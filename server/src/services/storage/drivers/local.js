import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../../config/env.js';

const root = path.resolve(config.STORAGE_LOCAL_PATH);

export async function put(key, buffer) {
  const target = path.join(root, key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer);
  return { key };
}

export async function get(key) {
  return fs.readFile(path.join(root, key));
}

export async function remove(key) {
  try {
    await fs.unlink(path.join(root, key));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

export function urlFor(key) {
  return `${config.API_URL}/uploads/${key}`;
}
