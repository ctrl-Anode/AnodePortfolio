import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';

let client = null;

function requireConfig() {
  const missing = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'R2_PUBLIC_URL'].filter(
    (key) => !config[key]
  );
  if (missing.length) {
    throw ApiError.serviceUnavailable(
      `R2 storage not configured. Set STORAGE_DRIVER=r2 and provide ${missing.join(', ')}.`
    );
  }
}

function getClient() {
  requireConfig();
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY
      }
    });
  }
  return client;
}

export async function put(key, buffer, contentType = 'application/octet-stream') {
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000'
    })
  );
  return { key };
}

export async function get(key) {
  const result = await getClient().send(new GetObjectCommand({ Bucket: config.R2_BUCKET, Key: key }));
  const chunks = [];
  for await (const chunk of result.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function remove(key) {
  await getClient().send(new DeleteObjectCommand({ Bucket: config.R2_BUCKET, Key: key }));
}

export function urlFor(key) {
  requireConfig();
  return `${config.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
}
