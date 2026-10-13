import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../../config/env.js';
import * as localDriver from './drivers/local.js';
import gcsDriver from './drivers/gcs.js';
import * as r2Driver from './drivers/r2.js';

const drivers = { local: localDriver, gcs: gcsDriver, r2: r2Driver };

export const storage = drivers[config.STORAGE_DRIVER] || localDriver;

export function buildFileKey(prefix, originalName) {
  const ext = path.extname(originalName || '').toLowerCase().slice(0, 10);
  const datePath = new Date().toISOString().slice(0, 10).replaceAll('-', '/');
  const id = crypto.randomUUID();
  return `${prefix}/${datePath}/${id}${ext}`;
}

export async function putObject(key, buffer, contentType) {
  return storage.put(key, buffer, contentType);
}

export async function getObject(key) {
  return storage.get(key);
}

export async function deleteObject(key) {
  return storage.remove(key);
}

export function objectUrl(key) {
  return storage.urlFor(key);
}

const R2_REQUIRED = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL'
];

/**
 * Logs the active storage driver and warns loudly about the two
 * misconfigurations that silently break uploaded media in production:
 *   - `STORAGE_DRIVER=local` on an ephemeral host (Render/Fly/Heroku): the
 *     container filesystem is wiped on every redeploy/restart, so previously
 *     saved `imageUrl` / `credentialUrl` values 404.
 *   - `STORAGE_DRIVER=r2` with missing `R2_*` vars: every upload returns 503.
 * Returns true when the configuration looks usable.
 */
export function verifyStorageConfig(logger = console) {
  const driver = config.STORAGE_DRIVER;
  logger.info(`Storage driver: ${driver}`);

  if (driver === 'local') {
    if (config.isProd) {
      logger.warn(
        'STORAGE_DRIVER=local in production: uploads are written to the container ' +
          'filesystem and disappear on every redeploy/restart. Set STORAGE_DRIVER=r2 ' +
          '(Cloudflare R2) so uploaded files and images persist.'
      );
    }
    return true;
  }

  if (driver === 'r2') {
    const missing = R2_REQUIRED.filter((key) => !config[key]);
    if (missing.length) {
      logger.error(
        `STORAGE_DRIVER=r2 but ${missing.join(', ')} ${
          missing.length === 1 ? 'is' : 'are'
        } not set: every upload will fail with 503 until these are provided.`
      );
      return false;
    }
  }

  return true;
}
