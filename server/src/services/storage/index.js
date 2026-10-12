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
