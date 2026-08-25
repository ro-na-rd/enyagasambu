const pool = require('../config/db');
const { emitToAuction } = require('../config/socket');
const { notifyUser } = require('./notificationService');

let auctionSchemaChecked = false;
let auctionSchemaReady = false;

async function ensureAuctionSchemaReady() {
    if (auctionSchemaChecked) return auctionSchemaReady;

    try {
        const [rows] = await pool.query(
            `SELECT COLUMN_NAME
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'listings'
         AND COLUMN_NAME IN ('highest_bid', 'highest_bidder_id', 'reserve_price')`
        );

        const available = new Set(rows.map(r => r.COLUMN_NAME));
        auctionSchemaReady = ['highest_bid', 'highest_bidder_id', 'reserve_price'].every(col => available.has(col));
    } catch (err) {
        console.error('[Auction scheduler] schema check error:', err.message);
        auctionSchemaReady = false;
    } finally {
        auctionSchemaChecked = true;
    }

    if (!auctionSchemaReady) {
        console.warn('[Auction scheduler] skipped: required auction columns missing from listings table. Run backend/src/scripts/migrateAuctions.js.');
    }

    return auctionSchemaReady;
}

async function settleExpiredAuctions() {
    if (!(await ensureAuctionSchemaReady())) return;

    let ended;
    try {
        const [rows] = await pool.query(
            `SELECT l.id, l.title, l.highest_bid, l.highest_bidder_id, l.reserve_price
       FROM listings l
       WHERE l.listing_type = 'auction' AND l.status = 'active'
         AND l.expires_at IS NOT NULL AND l.expires_at <= NOW()`
        );
        ended = rows;
    } catch (err) {
        console.error('[Auction scheduler] query error:', err.message);
        return;
    }

    for (const a of ended) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const won = a.highest_bid != null &&
                (a.reserve_price == null || Number(a.highest_bid) >= Number(a.reserve_price));
            const newStatus = won ? 'sold' : 'expired';

            const [result] = await conn.query(
                `UPDATE listings SET status = ?
         WHERE id = ? AND status = 'active' AND expires_at <= NOW()`, [newStatus, a.id]
            );
            if (result.affectedRows === 0) {
                await conn.rollback();
                continue; // already transitioned or extended by anti-sniping
            }

            let winnerName = null;
            if (won && a.highest_bidder_id) {
                const [[u]] = await conn.query('SELECT name FROM users WHERE id = ?', [a.highest_bidder_id]);
                winnerName = u?.name || 'Bidder';
            }

            await conn.commit();

            const winningBid = a.highest_bid != null ? Number(a.highest_bid) : null;

            if (won && a.highest_bidder_id) {
                notifyUser(
                    a.highest_bidder_id,
                    'Congratulations! You won',
                    `Congratulations! You won the auction for ${winningBid.toLocaleString()} RWF.`,
                    'auction',
                    `/auction/${a.id}`
                );
            }

            emitToAuction(a.id, 'auction:ended', {
                auctionId: a.id,
                status: won ? 'sold' : 'ended',
                winnerId: won ? a.highest_bidder_id : null,
                winnerName,
                winningBid,
                title: a.title,
            });
        } catch (err) {
            await conn.rollback();
            console.error('[Auction scheduler] settle error:', err.message);
        } finally {
            conn.release();
        }
    }
}

function startAuctionScheduler() {
    settleExpiredAuctions().catch(() => {});
    setInterval(() => settleExpiredAuctions().catch(() => {}), 20 * 1000);
}

module.exports = { startAuctionScheduler };