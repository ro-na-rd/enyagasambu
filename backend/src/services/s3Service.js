const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || 'nmo-images';
const PUBLIC_URL = process.env.S3_PUBLIC_URL || `http://localhost:9000/${BUCKET}`;

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
      console.log(`[S3] Created bucket: ${BUCKET}`);
    } else {
      console.error('[S3] Error checking bucket:', err.message);
    }
  }

  try {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    });
    await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }));
  } catch (err) {
    console.error('[S3] Error setting bucket policy:', err.message);
  }
}

async function uploadToS3(file) {
  const ext = file.originalname.split('.').pop() || 'jpg';
  const key = `listings/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return { key, url: `${PUBLIC_URL}/${key}` };
}

async function deleteFromS3(key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error('[S3] Delete error:', err.message);
  }
}

module.exports = { uploadToS3, deleteFromS3, ensureBucket };
