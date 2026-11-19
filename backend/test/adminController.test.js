const test = require('node:test');
const assert = require('node:assert/strict');

process.env.S3_PUBLIC_URL = 'https://example.test';

const pool = require('../src/config/db');
const { getAdminListing } = require('../src/controllers/adminController');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('getAdminListing returns listing details, parsed attributes, and images', async (t) => {
  const originalQuery = pool.query;
  t.after(() => { pool.query = originalQuery; });

  pool.query = async (sql, params) => {
    if (sql.includes('FROM listings l')) {
      assert.deepEqual(params, ['42']);
      return [[{ id: 42, title: 'Listing', attributes: '{"rooms":"2"}' }], []];
    }
    if (sql.includes('FROM listing_images')) {
      return [[{ id: 7, image_url: 'https://example.test/image.jpg', is_primary: 1 }], []];
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const res = createResponse();
  await getAdminListing({ params: { id: '42' } }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.listing.attributes, { rooms: '2' });
  assert.equal(res.body.listing.images[0].id, 7);
});

test('getAdminListing returns 404 for a missing listing', async (t) => {
  const originalQuery = pool.query;
  t.after(() => { pool.query = originalQuery; });

  pool.query = async () => [[], []];

  const res = createResponse();
  await getAdminListing({ params: { id: '42' } }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Listing not found' });
});
