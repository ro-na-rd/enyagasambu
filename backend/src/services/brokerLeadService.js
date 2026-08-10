const pool = require('../config/db');

async function getLeadsForBroker(brokerId, limit) {
  const [rows] = await pool.query(
    `SELECT cu.id, cu.buyer_phone, cu.sale_status, cu.unlocked_at AS created_at,
            COALESCE(bu.name, 'Guest buyer') AS buyer_name,
            l.id AS listing_id, l.title AS listing_title, l.price, l.currency,
            c.name AS category_name
     FROM contact_unlocks cu
     JOIN listings l ON l.id = cu.listing_id
     LEFT JOIN users bu ON bu.id = cu.buyer_id
     LEFT JOIN categories c ON l.category_id = c.id
     WHERE l.user_id = ? AND l.status != 'deleted'
     ORDER BY cu.unlocked_at DESC
     ${limit ? 'LIMIT ?' : ''}`,
    limit ? [brokerId, limit] : [brokerId]
  );
  return rows;
}

module.exports = { getLeadsForBroker };
