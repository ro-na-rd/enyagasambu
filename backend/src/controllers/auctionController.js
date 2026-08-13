const pool = require('../config/db');
const { uploadToS3 } = require('../services/s3Service');
const { notifyUser } = require('../services/notificationService');
const { emitToAuction } = require('../config/socket');

const ENDING_SOON_MINUTES = 5;
const DEFAULT_INCREMENT = 500;

const CATEGORY_CONDITION = {
  electronics: 'Used – Good',
  fashion: 'New with tags',
  clothing: 'Used – Excellent',
  furniture: 'Used – Good',
  'beauty-health': 'New',
  books: 'Used – Like new',
  handcraft: 'Handmade',
  'food-beverage': 'New',
  default: 'Used – Good',
};

const DELIVERY_TERMS = {
  default: 'Pickup in Kigali or nationwide delivery from RWF 2,000',
  electronics: 'Delivery available nationwide. Pickup in Kigali.',
  furniture: 'Local delivery & assembly arranged with the seller.',
  clothing: 'Ships within 24h. Cash on delivery available in Kigali.',
};

function pick(map, key) {
  return map[key] || map.default;
}

function computeRating(sellerId) {
  const base = 4.0 + (sellerId % 10) * 0.1;
  const reviews = (sellerId % 21) + 4;
  return { rating: Number(base.toFixed(1)), reviews };
}

const AUCTION_SELECT = `
  SELECT l.id, l.title, l.description, l.price, l.currency, l.location,
         l.listing_type, l.status AS db_status, l.is_featured, l.views,
         l.auction_start, l.expires_at AS ends_at, l.created_at,
         l.minimum_increment, l.reserve_price, l.anti_sniping, l.sniping_window,
         l.highest_bid, l.highest_bidder_id,
         c.id AS category_id, c.name AS category_name, c.slug AS category_slug, c.type AS category_type,
         u.id AS seller_id, u.name AS seller_name,
         hu.name AS highest_bidder_name,
         (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image,
         (SELECT COUNT(*) FROM auction_bids b WHERE b.listing_id = l.id) AS bid_count
  FROM listings l
  JOIN categories c ON l.category_id = c.id
  JOIN users u ON l.user_id = u.id
  LEFT JOIN users hu ON hu.id = l.highest_bidder_id
`;

function computeStatus(row, now) {
  const s = row.db_status || row.status;
  const starts = row.auction_start ? new Date(row.auction_start).getTime() : null;
  const ends = row.ends_at ? new Date(row.ends_at).getTime() : 0;
  if (s === 'sold') return 'sold';
  if (s === 'expired' || s === 'disabled') return 'ended';
  if (s === 'active') {
    if (starts && starts > now) return 'upcoming';
    if (ends <= now) return 'ended';
    if ((ends - now) / 60000 <= ENDING_SOON_MINUTES) return 'ending_soon';
    return 'live';
  }
  return s;
}

function decorate(row) {
  const now = Date.now();
  const rating = computeRating(row.seller_id);
  const currentBid = row.highest_bid != null ? Number(row.highest_bid) : row.price != null ? Number(row.price) : 0;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    starting_price: row.price != null ? Number(row.price) : 0,
    price: row.price != null ? Number(row.price) : 0,
    minimum_increment: Number(row.minimum_increment != null ? row.minimum_increment : DEFAULT_INCREMENT),
    reserve_price: row.reserve_price != null ? Number(row.reserve_price) : null,
    currency: row.currency || 'RWF',
    location: row.location || 'Kigali',
    category_id: row.category_id,
    category_name: row.category_name,
    category_slug: row.category_slug,
    category_type: row.category_type,
    seller_id: row.seller_id,
    seller_name: row.seller_name,
    seller_rating: rating.rating,
    seller_reviews: rating.reviews,
    auction_start: row.auction_start,
    ends_at: row.ends_at,
    created_at: row.created_at,
    status: computeStatus(row, now),
    current_bid: currentBid,
    highest_bid: currentBid,
    bid_count: Number(row.bid_count || 0),
    highest_bidder_id: row.highest_bidder_id || null,
    highest_bidder_name: row.highest_bidder_name || null,
    primary_image: row.primary_image || null,
    is_featured: !!row.is_featured,
    views: Number(row.views || 0),
    condition: pick(CATEGORY_CONDITION, row.category_slug),
    delivery_terms: pick(DELIVERY_TERMS, row.category_slug),
    anti_sniping: !!row.anti_sniping,
    sniping_window: Number(row.sniping_window || 30),
  };
}

function statusWhere(status) {
  switch (status) {
    case 'live':
      return "AND l.status = 'active' AND (l.auction_start IS NULL OR l.auction_start <= NOW()) AND l.expires_at > NOW() AND TIMESTAMPDIFF(MINUTE, NOW(), l.expires_at) > " + ENDING_SOON_MINUTES;
    case 'ending_soon':
      return "AND l.status = 'active' AND (l.auction_start IS NULL OR l.auction_start <= NOW()) AND l.expires_at > NOW() AND TIMESTAMPDIFF(MINUTE, NOW(), l.expires_at) <= " + ENDING_SOON_MINUTES;
    case 'upcoming':
      return "AND l.status = 'active' AND l.auction_start IS NOT NULL AND l.auction_start > NOW()";
    case 'ended':
      return "AND (l.status IN ('expired', 'sold') OR l.expires_at <= NOW())";
    case 'sold':
      return "AND l.status = 'sold'";
    case 'all':
    default:
      return '';
  }
}

async function getGlobalAntiSniping() {
  const [rows] = await pool.query(
    "SELECT setting_key, setting_value FROM platform_settings WHERE setting_key IN ('auction_anti_sniping', 'auction_sniping_window')"
  );
  const s = {};
  (rows || []).forEach((r) => { s[r.setting_key] = r.setting_value; });
  return {
    antiSniping: s.auction_anti_sniping === 'true',
    window: parseInt(s.auction_sniping_window, 10) || 30,
  };
}

/* ─────────────────────────── Listing ─────────────────────────── */

exports.getAuctions = async (req, res) => {
  const {
    status, category, search, minPrice, maxPrice,
    sort, page = 1, limit = 30, featured,
  } = req.query;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const where = ["l.listing_type = 'auction'", "l.status != 'deleted'"];
  const params = [];

  const statusCond = statusWhere(status);
  if (statusCond) where.push(statusCond);

  if (category) {
    where.push('c.slug = ?');
    params.push(category);
  }
  if (search) {
    where.push('(l.title LIKE ? OR l.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (minPrice && !Number.isNaN(Number(minPrice))) {
    where.push('COALESCE(l.highest_bid, l.price) >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice && !Number.isNaN(Number(maxPrice))) {
    where.push('COALESCE(l.highest_bid, l.price) <= ?');
    params.push(Number(maxPrice));
  }

  let order = 'l.is_featured DESC, l.expires_at ASC';
  switch (sort) {
    case 'ending_soon': order = 'l.expires_at ASC'; break;
    case 'newest': order = 'l.created_at DESC'; break;
    case 'highest_bid': order = 'COALESCE(l.highest_bid, l.price) DESC'; break;
    case 'lowest_bid': order = 'COALESCE(l.highest_bid, l.price) ASC'; break;
    case 'most_bids': order = '(SELECT COUNT(*) FROM auction_bids b WHERE b.listing_id = l.id) DESC'; break;
    default: break;
  }
  if (featured === '1') order = 'l.is_featured DESC, ' + order;

  try {
    const [rows] = await pool.query(
      `${AUCTION_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM listings l WHERE ${where.join(' AND ')}`,
      params
    );

    return res.json({
      auctions: rows.map(decorate),
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  } catch (err) {
    console.error('[Auctions list error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getAuction = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const [[row]] = await pool.query(
      `${AUCTION_SELECT}
       WHERE l.id = ? AND l.listing_type = 'auction' AND l.status != 'deleted'`,
      [id]
    );
    if (!row) return res.status(404).json({ message: 'Auction not found' });

    await pool.query('UPDATE listings SET views = views + 1 WHERE id = ?', [id]);

    const [images] = await pool.query(
      'SELECT id, image_url, is_primary FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC, id ASC',
      [id]
    );
    const [bids] = await pool.query(
      'SELECT id, user_id, bidder_name, amount, created_at FROM auction_bids WHERE listing_id = ? ORDER BY created_at DESC, id DESC LIMIT 50',
      [id]
    );

    let watched = false;
    if (userId) {
      const [[w]] = await pool.query(
        'SELECT id FROM auction_watches WHERE listing_id = ? AND user_id = ?',
        [id, userId]
      );
      watched = !!w;
    }

    return res.json({
      auction: {
        ...decorate(row),
        images,
        bids: bids.map((b) => ({ ...b, amount: Number(b.amount) })),
        watched,
        is_own: !!userId && userId === row.seller_id,
      },
    });
  } catch (err) {
    console.error('[Auction detail error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getEndedAuctions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${AUCTION_SELECT}
       WHERE l.listing_type = 'auction' AND l.status IN ('expired', 'sold')
       ORDER BY l.created_at DESC
       LIMIT 12`
    );
    const ended = rows.map((r) => {
      const d = decorate(r);
      return { ...d, final_price: d.current_bid, ended_at: r.ends_at };
    });
    return res.json({ auctions: ended });
  } catch (err) {
    console.error('[Ended auctions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getFeed = async (req, res) => {
  const { limit = 15 } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT b.id, b.listing_id, b.bidder_name, b.amount, b.created_at,
              l.title AS listing_title, l.currency,
              c.slug AS category_slug,
              (SELECT image_url FROM listing_images WHERE listing_id = l.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM auction_bids b
       JOIN listings l ON l.id = b.listing_id
       JOIN categories c ON l.category_id = c.id
       ORDER BY b.created_at DESC, b.id DESC
       LIMIT ?`,
      [parseInt(limit, 10)]
    );
    return res.json({ feed: rows.map((r) => ({ ...r, amount: Number(r.amount) })) });
  } catch (err) {
    console.error('[Auction feed error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getBids = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, bidder_name, amount, created_at
       FROM auction_bids
       WHERE listing_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
      [id]
    );
    return res.json({ bids: rows.map((r) => ({ ...r, amount: Number(r.amount) })) });
  } catch (err) {
    console.error('[Auction bids error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/* ─────────────────────────── Bidding ─────────────────────────── */

exports.placeBid = async (req, res) => {
  const { id } = req.params;
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'A valid bid amount is required.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[auction]] = await conn.query(
      `SELECT id, user_id, price, expires_at, auction_start, minimum_increment,
              highest_bid, highest_bidder_id, anti_sniping, sniping_window, title
       FROM listings
       WHERE id = ? AND listing_type = 'auction' AND status = 'active'
       FOR UPDATE`,
      [id]
    );

    if (!auction) {
      await conn.rollback();
      return res.status(404).json({ message: 'Auction not found or has ended.' });
    }

    const nowMs = Date.now();
    const startMs = auction.auction_start ? new Date(auction.auction_start).getTime() : 0;
    const endMs = new Date(auction.expires_at).getTime();

    if (startMs && startMs > nowMs) {
      await conn.rollback();
      return res.status(400).json({ message: 'This auction has not started yet.' });
    }
    if (endMs <= nowMs) {
      await conn.rollback();
      return res.status(400).json({ message: 'This auction has ended.' });
    }
    if (auction.user_id === req.user.id) {
      await conn.rollback();
      return res.status(400).json({ message: 'You cannot bid on your own auction.' });
    }

    const [[bidder]] = await conn.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    const bidderName = bidder?.name || 'Bidder';

    const increment = Number(auction.minimum_increment != null ? auction.minimum_increment : DEFAULT_INCREMENT);
    const currentBid = auction.highest_bid != null
      ? Number(auction.highest_bid)
      : auction.price != null ? Number(auction.price) : 0;
    const minAmount = currentBid + increment;

    if (amount < minAmount) {
      await conn.rollback();
      return res.status(400).json({
        message: `Your bid must be at least ${minAmount.toLocaleString()} RWF (current ${currentBid.toLocaleString()} RWF + ${increment.toLocaleString()} RWF increment).`,
        minAmount,
        currentBid,
        increment,
      });
    }

    // Anti-sniping: extend the auction when a valid bid lands in the final window.
    const g = await getGlobalAntiSniping();
    const effAntiSniping = auction.anti_sniping != null && auction.anti_sniping !== undefined
      ? !!auction.anti_sniping
      : g.antiSniping;
    const snipingWindow = Number(auction.sniping_window || g.window || 30);
    const remainingSec = Math.floor((endMs - nowMs) / 1000);
    let newEndsAt = null;
    let extended = false;
    if (effAntiSniping && remainingSec <= snipingWindow) {
      newEndsAt = new Date(endMs + snipingWindow * 1000);
      extended = true;
    }

    const prevHighestBidderId = auction.highest_bidder_id || null;
    const auctionTitle = auction.title;

    const [result] = await conn.query(
      'INSERT INTO auction_bids (listing_id, user_id, bidder_name, amount) VALUES (?, ?, ?, ?)',
      [id, req.user.id, bidderName, amount]
    );

    await conn.query(
      'UPDATE listings SET highest_bid = ?, highest_bidder_id = ?, expires_at = ? WHERE id = ?',
      [amount, req.user.id, newEndsAt || auction.expires_at, id]
    );

    const [[{ cnt }]] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM auction_bids WHERE listing_id = ?',
      [id]
    );

    await conn.commit();

    const [bidRows] = await pool.query(
      'SELECT id, user_id, bidder_name, amount, created_at FROM auction_bids WHERE id = ?',
      [result.insertId]
    );
    const bid = bidRows[0];

    if (prevHighestBidderId && prevHighestBidderId !== req.user.id) {
      notifyUser(
        prevHighestBidderId,
        'You have been outbid',
        `You have been outbid on ${auctionTitle}. Current bid: ${amount.toLocaleString()} RWF.`,
        'auction',
        `/auction/${id}`
      );
    }

    emitToAuction(id, 'auction:bid', {
      auctionId: id,
      bid,
      currentBid: amount,
      highestBidderId: req.user.id,
      highestBidderName: bidderName,
      bidCount: cnt,
      endsAt: newEndsAt ? newEndsAt.toISOString() : auction.expires_at,
      extended,
      title: auctionTitle,
    });

    return res.status(201).json({
      message: 'Bid placed successfully.',
      bid,
      current_bid: amount,
      currentBid: amount,
      bid_count: cnt,
      highest_bidder_id: req.user.id,
      highest_bidder_name: bidderName,
      ends_at: newEndsAt ? newEndsAt.toISOString() : auction.expires_at,
      extended,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[Place bid error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

/* ─────────────────────────── Creation / Management ─────────────────────────── */

exports.createAuction = async (req, res) => {
  const {
    title, description, category_id, starting_price, minimum_increment,
    auction_start, auction_end, location, reserve_price, anti_sniping, sniping_window, currency,
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: 'Product title is required.' });
  }
  if (!category_id) {
    return res.status(400).json({ message: 'Product category is required.' });
  }
  const startPrice = Number(starting_price);
  const increment = Number(minimum_increment);
  if (!Number.isFinite(startPrice) || startPrice <= 0) {
    return res.status(400).json({ message: 'Starting price must be greater than zero.' });
  }
  if (!Number.isFinite(increment) || increment <= 0) {
    return res.status(400).json({ message: 'Minimum bid increment must be positive.' });
  }
  const startMs = auction_start ? new Date(auction_start).getTime() : null;
  const endMs = auction_end ? new Date(auction_end).getTime() : null;
  if (!startMs || !endMs || Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return res.status(400).json({ message: 'Auction start and end times are required.' });
  }
  if (endMs <= startMs) {
    return res.status(400).json({ message: 'Auction end time must be after the start time.' });
  }
  const reserve = reserve_price !== undefined && reserve_price !== '' ? Number(reserve_price) : null;
  if (reserve != null && (!Number.isFinite(reserve) || reserve < 0)) {
    return res.status(400).json({ message: 'Reserve price must be zero or greater.' });
  }

  const g = await getGlobalAntiSniping();
  const effAntiSniping = anti_sniping !== undefined && anti_sniping !== ''
    ? (anti_sniping === true || anti_sniping === 'true' || anti_sniping === '1')
    : g.antiSniping;
  const windowSec = parseInt(sniping_window, 10) || g.window || 30;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO listings
         (user_id, category_id, title, description, price, price_type, currency, location,
          status, listing_type, expires_at, auction_start, minimum_increment, reserve_price,
          anti_sniping, sniping_window)
       VALUES (?, ?, ?, ?, ?, 'fixed', ?, ?, 'active', 'auction', ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        category_id,
        String(title).trim(),
        description || null,
        startPrice,
        currency || 'RWF',
        location || 'Kigali',
        new Date(endMs),
        new Date(startMs),
        increment,
        reserve,
        effAntiSniping ? 1 : 0,
        windowSec,
      ]
    );
    const auctionId = result.insertId;

    if (req.files?.length) {
      const values = [];
      for (let i = 0; i < req.files.length; i++) {
        const { url } = await uploadToS3(req.files[i]);
        values.push([auctionId, url, i === 0]);
      }
      await conn.query('INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES ?', [values]);
    }

    await conn.commit();
    return res.status(201).json({ message: 'Auction created successfully.', auctionId });
  } catch (err) {
    await conn.rollback();
    console.error('[Create auction error]', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
};

exports.getMyAuctions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${AUCTION_SELECT}
       WHERE l.user_id = ? AND l.listing_type = 'auction' AND l.status != 'deleted'
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    return res.json({ auctions: rows.map(decorate) });
  } catch (err) {
    console.error('[My auctions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getWatched = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `${AUCTION_SELECT}
       JOIN auction_watches w ON w.listing_id = l.id
       WHERE w.user_id = ? AND l.status != 'deleted'
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    return res.json({ auctions: rows.map(decorate) });
  } catch (err) {
    console.error('[Watched auctions error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.watch = async (req, res) => {
  try {
    await pool.query(
      'INSERT IGNORE INTO auction_watches (listing_id, user_id) VALUES (?, ?)',
      [req.params.id, req.user.id]
    );
    return res.json({ watched: true });
  } catch (err) {
    console.error('[Watch auction error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.unwatch = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM auction_watches WHERE listing_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    return res.json({ watched: false });
  } catch (err) {
    console.error('[Unwatch auction error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
