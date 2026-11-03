const test = require('node:test');
const assert = require('node:assert');

process.env.S3_PUBLIC_URL = 'https://enyagasambu.rw/minio/nmo-images/';
process.env.S3_BUCKET = 'nmo-images';

const { buildPublicUrl, extractKeyFromUrl } = require('../src/services/s3Service');

test('buildPublicUrl preserves object paths and encodes unsafe key characters', () => {
  assert.strictEqual(
    buildPublicUrl('listings/folder name/photo #1.jpg'),
    'https://enyagasambu.rw/minio/nmo-images/listings/folder%20name/photo%20%231.jpg'
  );
});

test('extractKeyFromUrl supports configured public prefixes and legacy bucket paths', () => {
  assert.strictEqual(
    extractKeyFromUrl('https://enyagasambu.rw/minio/nmo-images/listings/photo%20one.jpg'),
    'listings/photo one.jpg'
  );
  assert.strictEqual(
    extractKeyFromUrl('https://storage.example.com/nmo-images/listings/photo.jpg?versionId=1'),
    'listings/photo.jpg'
  );
});

test('extractKeyFromUrl accepts keys and rejects unrelated URLs', () => {
  assert.strictEqual(extractKeyFromUrl('listings/photo.jpg'), 'listings/photo.jpg');
  assert.strictEqual(extractKeyFromUrl('https://example.com/assets/photo.jpg'), null);
});
