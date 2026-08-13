require('dotenv').config();
const mysql = require('mysql2/promise');

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nmo_db',
    waitForConnections: true,
  });

  const getCategoryId = async (slug) => {
    const [[row]] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
    if (!row) throw new Error(`Category not found: ${slug}`);
    return row.id;
  };

  const ensureUser = async (name, email, phone) => {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing[0]) return existing[0].id;
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, require('crypto').randomBytes(32).toString('hex'), 'user']
    );
    return result.insertId;
  };

  const ensureListing = async (listing) => {
    const [existing] = await pool.query('SELECT id FROM listings WHERE title = ?', [listing.title]);
    if (existing[0]) return existing[0].id;
    const [result] = await pool.query(
      `INSERT INTO listings (user_id, category_id, title, description, price, price_type, currency, location, status, listing_type, expires_at, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      listing.values
    );
    return result.insertId;
  };

  const sellerId = await ensureUser('Grace Mukamana', 'grace.mukamana@example.rw', '250788111001');
  const bidderIds = {
    jean:   await ensureUser('Jean Bosco',      'jean.bosco@example.rw',   '250788222001'),
    alice:  await ensureUser('Alice Uwase',     'alice.uwase@example.rw',  '250788222002'),
    eric:   await ensureUser('Eric Niyonzima',  'eric.niyonzima@example.rw', '250788222003'),
    clarisse: await ensureUser('Clarisse Ingabire', 'clarisse@example.rw', '250788222004'),
  };

  const daysFromNow = (days, hours = 0) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000);
    return d;
  };

  const electronics = await getCategoryId('electronics');
  const furniture   = await getCategoryId('furniture');
  const fashion     = await getCategoryId('fashion');
  const clothing    = await getCategoryId('clothing');
  const beauty      = await getCategoryId('beauty-health');
  const books       = await getCategoryId('books');

  const auctions = [
    {
      title: 'Samsung 55" 4K Smart TV — brand new, sealed box',
      description: '55-inch Crystal UHD 4K Smart TV. Factory sealed, 1-year seller warranty included. Delivery available nationwide; pickup in Kigali within 24h of auction close.',
      price: 450000, category: electronics, location: 'Kigali', days: 2, hours: 5, featured: true,
    },
    {
      title: 'Walnut 6-Seater Dining Table Set',
      description: 'Solid walnut dining table with 6 upholstered chairs. Gently used, minor surface marks, very good condition. Local delivery & assembly arranged with the seller.',
      price: 280000, category: furniture, location: 'Kigali', days: 3, hours: 2, featured: false,
    },
    {
      title: 'iPhone 13 128GB — Midnight, battery 92%',
      description: 'iPhone 13 128GB in Midnight. Unlocked, Face ID works, battery health 92%. Ships within 24h. Cash on delivery available in Kigali.',
      price: 520000, category: electronics, location: 'Kigali', days: 1, hours: 8, featured: false,
    },
    {
      title: 'Designer Leather Handbag — new with tags',
      description: 'Genuine leather handbag, never worn, tags attached. Includes dust bag. Delivery in 24h or pickup in Kigali.',
      price: 95000, category: fashion, location: 'Kigali', days: 4, hours: 3, featured: false,
    },
    {
      title: 'Oak Desk & Bookshelf Bundle',
      description: 'Solid oak office desk with matching bookshelf. Excellent used condition. Local delivery arranged with seller; pickup in Kigali.',
      price: 150000, category: furniture, location: 'Kigali', days: 2, hours: 10, featured: false,
    },
    {
      title: 'Men\'s Premium Suit — navy, size 48',
      description: 'Premium navy suit, dry-cleaned and ready to wear. Very good condition. Pickup in Kigali or delivery nationwide from RWF 2,000.',
      price: 60000, category: clothing, location: 'Kigali', days: 3, hours: 6, featured: false,
    },
    {
      title: 'Bose QuietComfort Headphones',
      description: 'Wireless noise-cancelling headphones, complete with case and cables. Used, great condition. Delivery available nationwide; pickup in Kigali.',
      price: 120000, category: electronics, location: 'Kigali', days: 1, hours: 12, featured: false,
    },
    {
      title: 'Luxury Skincare Gift Set — sealed',
      description: 'Brand new skincare gift set, factory sealed. Ideal gift. Ships within 24h. Cash on delivery in Kigali.',
      price: 45000, category: beauty, location: 'Kigali', days: 5, hours: 1, featured: false,
    },
    {
      title: 'Vintage Collectors\' Book Set — 12 volumes',
      description: 'Classic literature collection in near-perfect condition. Rare find. Pickup in Kigali or delivery from RWF 2,000.',
      price: 75000, category: books, location: 'Kigali', days: 4, hours: 7, featured: false,
    },
  ];

  const listingIds = {};
  for (const a of auctions) {
    listingIds[a.title] = await ensureListing({
      title: a.title,
      values: [
        sellerId, a.category, a.title, a.description, a.price, 'fixed', 'RWF', a.location,
        'active', 'auction', daysFromNow(a.days, a.hours), a.featured ? 1 : 0,
      ],
    });
  }

  const firstBids = [
    ['Samsung 55" 4K Smart TV — brand new, sealed box', 'jean', 470000],
    ['Samsung 55" 4K Smart TV — brand new, sealed box', 'alice', 490000],
    ['Samsung 55" 4K Smart TV — brand new, sealed box', 'eric', 515000],
    ['Walnut 6-Seater Dining Table Set', 'alice', 290000],
    ['Walnut 6-Seater Dining Table Set', 'clarisse', 305000],
    ['iPhone 13 128GB — Midnight, battery 92%', 'eric', 535000],
    ['iPhone 13 128GB — Midnight, battery 92%', 'jean', 550000],
    ['Designer Leather Handbag — new with tags', 'clarisse', 100000],
    ['Oak Desk & Bookshelf Bundle', 'jean', 160000],
    ['Bose QuietComfort Headphones', 'alice', 125000],
    ['Bose QuietComfort Headphones', 'eric', 132000],
    ['Men\'s Premium Suit — navy, size 48', 'jean', 62000],
  ];

  for (const [title, bidderKey, amount] of firstBids) {
    const listingId = listingIds[title];
    const userId = bidderIds[bidderKey];
    const [[existing]] = await pool.query(
      'SELECT id FROM auction_bids WHERE listing_id = ? AND amount = ? AND user_id = ?',
      [listingId, amount, userId]
    );
    if (!existing) {
      const [[user]] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
      await pool.query(
        'INSERT INTO auction_bids (listing_id, user_id, bidder_name, amount) VALUES (?, ?, ?, ?)',
        [listingId, userId, user.name, amount]
      );
    }
  }

  await pool.query(
    `UPDATE listings SET status = 'expired'
     WHERE listing_type = 'auction' AND title = ?`,
    ['Vintage Collectors\' Book Set — 12 volumes']
  );

  console.log('Demo auctions seeded:');
  for (const a of auctions) {
    console.log(`  - ${a.title}  (start ${a.price.toLocaleString()} RWF)`);
  }

  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
