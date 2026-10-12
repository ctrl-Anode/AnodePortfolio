import { getBucket } from '../../../lib/firebase.js';
import { ApiError } from '../../../utils/ApiError.js';

function requireBucket() {
  const bucket = getBucket();
  if (!bucket) {
    throw ApiError.serviceUnavailable(
      'GCS storage not configured. Set STORAGE_DRIVER=gcs with FIREBASE_STORAGE_BUCKET and Firebase credentials.'
    );
  }
  return bucket;
}

async function put(key, buffer, contentType = 'application/octet-stream') {
  const bucket = requireBucket();
  const file = bucket.file(key);
  await file.save(buffer, { contentType, resumable: false, metadata: { cacheControl: 'public, max-age=31536000' } });
  try {
    await file.makePublic();
  } catch {
    // Bucket may enforce uniform access control; signed URLs can be used instead.
  }
  return { key };
}

async function get(key) {
  const bucket = requireBucket();
  const [buffer] = await bucket.file(key).download();
  return buffer;
}

async function remove(key) {
  const bucket = requireBucket();
  await bucket.file(key).delete({ ignoreNotFound: true });
}

function getBucketName() {
  const bucket = getBucket();
  return bucket ? bucket.name : '';
}

function urlFor(key) {
  return `https://storage.googleapis.com/${getBucketName()}/${key}`;
}

export default { put, get, remove, urlFor };
