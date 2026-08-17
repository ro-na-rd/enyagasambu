require('dotenv').config();
const pool = require('../config/db');
const { htmlToText } = require('../services/htmlToText');

async function run() {
  console.log('Converting existing content_pages HTML to plain text...');
  const [rows] = await pool.query('SELECT id, content FROM content_pages WHERE content LIKE "%<%>"');
  let converted = 0;
  for (const row of rows) {
    const plain = htmlToText(row.content);
    await pool.query('UPDATE content_pages SET content = ? WHERE id = ?', [plain, row.id]);
    converted++;
  }
  console.log(`Converted ${converted} page(s) to plain text.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});