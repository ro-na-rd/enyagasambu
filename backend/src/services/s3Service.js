const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, ListBucketsCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
  requestHandler: {
    requestTimeout: 10000,
  },
});

const BUCKET = process.env.S3_BUCKET || 'nmo-images';
const PUBLIC_URL = process.env.S3_PUBLIC_URL;
if (!PUBLIC_URL) {
  console.error('[FATAL] S3_PUBLIC_URL must be set in environment');
  process.exit(1);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry(fn, label, retries = 5, baseDelay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`[S3] ${label} attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

async function waitForS3() {
  await withRetry(async () => {
    await s3.send(new ListBucketsCommand({}));
    console.log('[S3] Connection established');
  }, 'connect', 10, 2000);
}

async function ensureBucket() {
  await withRetry(async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
      console.log(`[S3] Bucket "${BUCKET}" already exists`);
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
        console.log(`[S3] Created bucket: ${BUCKET}`);
      } else {
        throw err;
      }
    }
  }, `ensureBucket "${BUCKET}"`, 5, 2000);

  try {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    });
    await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }));
    console.log(`[S3] Public read policy applied to "${BUCKET}"`);
  } catch (err) {
    console.warn('[S3] Could not set bucket policy (non-blocking):', err.message);
  }
}

async function uploadToS3(file) {
  const ext = file.originalname.split('.').pop() || 'jpg';
  const key = `listings/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  await withRetry(async () => {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
  }, `upload "${key}"`, 3, 1000);

  return { key, url: `${PUBLIC_URL}/${key}` };
}

async function deleteFromS3(key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('[S3] Delete error:', err.message);
  }
}

function extractKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) return url.slice(idx + marker.length);
  return null;
}

async function deleteFromS3Url(url) {
  const key = extractKeyFromUrl(url);
  if (!key) return;
  await deleteFromS3(key);
}

module.exports = { uploadToS3, deleteFromS3, deleteFromS3Url, ensureBucket, waitForS3 };
