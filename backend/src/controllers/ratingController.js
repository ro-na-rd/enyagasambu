const pool = require('../config/db');
const { notifyAdmins } = require('../services/notificationService');

exports.getRating = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const [[agg]] = await pool.query(
      'SELECT COUNT(*) AS count, COALESCE(AVG(stars), 0) AS avg FROM listing_ratings WHERE listing_id = ?',
      [id]
    );

    let myStars = null;
    if (userId) {
      const [[row]] = await pool.query(
        'SELECT stars FROM listing_ratings WHERE listing_id = ? AND user_id = ?',
        [id, userId]
      );
      myStars = row ? row.stars : null;
    }

    return res.json({
      count: agg.count,
      avg: Math.round(agg.avg * 10) / 10,
      myStars,
    });
  } catch (err) {
    console.error('[Rating status error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.rate = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const stars = parseInt(req.body.stars, 10);
  if (!userId) return res.status(401).json({ message: 'Login required to rate' });
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: 'Stars must be between 1 and 5' });
  }

  try {
    const [[listing]] = await pool.query(
      'SELECT id, title, user_id FROM listings WHERE id = ? AND status != ?',
      [id, 'deleted']
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.user_id === userId) {
      return res.status(403).json({ message: 'You cannot rate your own post.' });
    }

    const [[existing]] = await pool.query(
      'SELECT id FROM listing_ratings WHERE listing_id = ? AND user_id = ?',
      [id, userId]
    );
    if (existing) {
      return res.status(409).json({ message: 'You have already rated this post. Each user can rate a post only once.' });
    }

    await pool.query(
      'INSERT INTO listing_ratings (listing_id, user_id, stars) VALUES (?, ?, ?)',
      [id, userId, stars]
    );

    const [[agg]] = await pool.query(
      'SELECT COUNT(*) AS count, COALESCE(AVG(stars), 0) AS avg FROM listing_ratings WHERE listing_id = ?',
      [id]
    );

    const [[user]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);

    notifyAdmins(
      'New listing rating',
      `${user?.name || 'A user'} rated "${listing.title}" ${stars} star${stars > 1 ? 's' : ''}.`,
      'info',
      `/admin/listings?id=${id}`
    );

    return res.status(201).json({
      count: agg.count,
      avg: Math.round(agg.avg * 10) / 10,
      myStars: stars,
    });
  } catch (err) {
    console.error('[Rate error]', err);
    return res.status(500).json({ message: 'Server error' });
  }
};