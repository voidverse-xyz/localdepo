import path from 'node:path';
import { ENV, STORAGE } from '../constants.js';

/** Root directory where config + uploads live (overridable via DATA_DIR). */
export function dataDir() {
  return process.env[ENV.DATA_DIR] || STORAGE.DEFAULT_DATA_DIR;
}

/** Absolute path to the JSON config file. */
export function configPath() {
  return path.join(dataDir(), STORAGE.CONFIG_FILENAME);
}

/** Absolute path to the uploads directory (background images). */
export function uploadsDir() {
  return path.join(dataDir(), STORAGE.UPLOADS_DIRNAME);
}
