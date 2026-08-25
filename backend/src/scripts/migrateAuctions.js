require('dotenv').config();
const mysql = require('mysql2/promise');

async function columnExists(conn, table, column) {
    const [rows] = await conn.query(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]
    );
    return rows.length > 0;
}

async function addColumn(conn, table, column, definition) {
    if (!(await columnExists(conn, table, column))) {
        await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`  + ${table}.${column}`);
    } else {
        console.log(`  = ${table}.${column} (exists)`);
    }
}

async function tableExists(conn, table) {
    const [rows] = await conn.query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [table]
    );
    return rows.length > 0;
}

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nmo_db',
        waitForConnections: true,
    });
    const conn = await pool.getConnection();
    try {
        console.log('Migrating auction schema...');

        // ---- listings: auction-specific columns ----
        await addColumn(conn, 'listings', 'auction_start', 'TIMESTAMP NULL DEFAULT NULL');
        await addColumn(conn, 'listings', 'minimum_increment', 'DECIMAL(12,2) NOT NULL DEFAULT 500.00');
        await addColumn(conn, 'listings', 'reserve_price', 'DECIMAL(12,2) NULL DEFAULT NULL');
        await addColumn(conn, 'listings', 'anti_sniping', 'TINYINT(1) DEFAULT 0');
        await addColumn(conn, 'listings', 'sniping_window', 'INT DEFAULT 30');
        await addColumn(conn, 'listings', 'highest_bid', 'DECIMAL(12,2) NULL DEFAULT NULL');
        await addColumn(conn, 'listings', 'highest_bidder_id', 'INT NULL DEFAULT NULL');

        if (!(await tableExists(conn, 'auction_bids'))) {
            await conn.query(`
        CREATE TABLE IF NOT EXISTS auction_bids (
          id INT AUTO_INCREMENT PRIMARY KEY,
          listing_id INT NOT NULL,
          user_id INT NULL,
          bidder_name VARCHAR(150) NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_auction_bid_listing (listing_id, amount),
          INDEX idx_auction_bid_created (created_at)
        )
      `);
            console.log('  + auction_bids (table)');
        } else {
            console.log('  = auction_bids (exists)');
        }

        // backfill auction_start = created_at where null (listings were live at creation)
        await conn.query(
            `UPDATE listings SET auction_start = created_at
       WHERE listing_type = 'auction' AND auction_start IS NULL`
        );

        // backfill highest_bid + highest_bidder_id from existing bids
        await conn.query(
            `UPDATE listings l
       SET highest_bid = (
         SELECT MAX(amount) FROM auction_bids b WHERE b.listing_id = l.id
       )
       WHERE l.listing_type = 'auction'`
        );
        await conn.query(
            `UPDATE listings l
       SET highest_bidder_id = (
         SELECT b.user_id FROM auction_bids b
         WHERE b.listing_id = l.id AND b.amount = l.highest_bid
         ORDER BY b.created_at ASC, b.id ASC LIMIT 1
       )
       WHERE l.listing_type = 'auction' AND l.highest_bid IS NOT NULL`
        );

        // normalize: highest bid on expired auctions with bids -> sold, without -> expired
        await conn.query(
            `UPDATE listings SET status = 'sold'
       WHERE listing_type = 'auction' AND status = 'expired' AND highest_bid IS NOT NULL`
        );
        await conn.query(
            `UPDATE listings SET status = 'expired'
       WHERE listing_type = 'auction' AND status = 'active'
         AND expires_at IS NOT NULL AND expires_at <= NOW() AND highest_bid IS NULL`
        );

        // ---- auction_watches ----
        await conn.query(`
      CREATE TABLE IF NOT EXISTS auction_watches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        listing_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_watch (listing_id, user_id),
        FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);
        console.log('  + auction_watches (table)');

        // ---- platform defaults for anti-sniping ----
        await conn.query(
            `INSERT IGNORE INTO platform_settings (setting_key, setting_value) VALUES
        ('auction_anti_sniping', 'false'),
        ('auction_sniping_window', '30'),
        ('auction_default_increment', '500')`
        );
        console.log('  + platform_settings auction defaults');

        console.log('Migration complete.');
    } finally {
        conn.release();
        await pool.end();
    }
}

migrate().catch((err) => {
    console.error(err);
    process.exit(1);
});