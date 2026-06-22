/**
 * Single source of truth for app-wide strings, enums, defaults, and config.
 * Nothing else in the codebase should hard-code these values.
 */

export const APP = {
  NAME: 'LocalDepo',
  TAGLINE: 'Self-hosted service dashboard',
};

/** Environment variable names (read server-side only). */
export const ENV = {
  ADMIN_PASSWORD: 'ADMIN_PASSWORD',
  SESSION_SECRET: 'SESSION_SECRET',
  SCAN_CIDR: 'SCAN_CIDR',
  DATA_DIR: 'DATA_DIR',
};

/** Filesystem defaults (resolved by core/storage/paths.js). */
export const STORAGE = {
  DEFAULT_DATA_DIR: '/data',
  CONFIG_FILENAME: 'config.json',
  UPLOADS_DIRNAME: 'uploads',
  CONFIG_VERSION: 1,
};

/** View modes for the dashboard. */
export const VIEW_MODE = {
  CUSTOM: 'custom',
  GRID: 'grid',
  LIST: 'list',
};
export const VIEW_MODES = Object.values(VIEW_MODE);

/** Where a service came from. */
export const SERVICE_SOURCE = {
  DISCOVERED: 'discovered',
  MANUAL: 'manual',
};

/** URL scheme used to reach a service. */
export const SCHEME = {
  HTTP: 'http',
  HTTPS: 'https',
};

/** Background layer keys (all composable / independently toggleable). */
export const BG_LAYER = {
  COLOR: 'color',
  IMAGE: 'image',
  EFFECT: 'effect',
  OVERLAY: 'overlay',
};

/** How a background image fills the viewport. */
export const IMAGE_FIT = {
  COVER: 'cover',
  CONTAIN: 'contain',
  TILE: 'tile',
  CENTER: 'center',
};

/** Built-in background effect keys (registry keys live in components/backgrounds/effects). */
export const EFFECT = {
  NONE: 'none',
  STARFIELD: 'starfield',
  RAIN: 'rain',
};

/** Network scan tuning. */
export const SCAN = {
  TCP_TIMEOUT_MS: 800,
  HTTP_TIMEOUT_MS: 2500,
  CONCURRENCY: 64,
  MAX_HOSTS: 1024, // safety cap so a huge CIDR can't blow up
};

/** Session cookie config. */
export const SESSION = {
  COOKIE_NAME: 'localdepo_session',
  TTL_SECONDS: 60 * 60 * 24 * 7, // 7 days
};

/** API route paths (used by the client fetch layer). */
export const API = {
  AUTH: '/api/auth',
  SERVICES: '/api/services',
  SCAN: '/api/scan',
  LAYOUT: '/api/layout',
  SETTINGS: '/api/settings',
  UPLOAD: '/api/upload',
};

/** Responsive grid configuration shared by custom + grid modes. */
export const GRID = {
  BREAKPOINTS: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  COLS: { lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 },
  ROW_HEIGHT: 84,
  MARGIN: [14, 14],
  DEFAULT_TILE: { w: 2, h: 2 },
  MIN_TILE: { minW: 1, minH: 1 },
};

/** Upload constraints for background images. */
export const UPLOAD = {
  MAX_BYTES: 8 * 1024 * 1024, // 8 MB
  ALLOWED_MIME: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
};

/** User-facing strings (centralized for consistency + future i18n). */
export const STRINGS = {
  EDIT: 'Edit',
  DONE: 'Done',
  ADD_SERVICE: 'Add service',
  EDIT_SERVICE: 'Edit service',
  DELETE: 'Delete',
  SAVE: 'Save',
  CANCEL: 'Cancel',
  SCAN_NOW: 'Scan network',
  SCANNING: 'Scanning…',
  SETTINGS: 'Background',
  UNLOCK: 'Unlock',
  PASSWORD_TITLE: 'Admin password',
  PASSWORD_PLACEHOLDER: 'Enter admin password',
  WRONG_PASSWORD: 'Incorrect password',
  NO_SERVICES: 'No services yet. Scan the network or add one.',
  VIEW_CUSTOM: 'Custom',
  VIEW_GRID: 'Grid',
  VIEW_LIST: 'List',
  FIELD_NAME: 'Name',
  FIELD_URL: 'URL',
  FIELD_ICON: 'Icon URL',
  FIELD_CATEGORY: 'Category',
  CONFIRM_DELETE: 'Delete this service?',
};

/** HTTP status codes used by API routes. */
export const HTTP = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA: 415,
  SERVER_ERROR: 500,
};
