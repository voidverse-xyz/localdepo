import { EFFECT, IMAGE_FIT, GRID } from './constants.js';
import { clamp } from '../lib/math.js';

/**
 * Validation/normalization for client-supplied values, shared by the API
 * routes. Everything here is pure and framework-free so it can be unit-tested
 * directly. Invalid input is either rejected (null) or coerced to a safe
 * fallback — nothing user-controlled reaches config.json unchecked.
 */

const MAX_URL_LENGTH = 2048;
const MAX_NAME_LENGTH = 120;
const MAX_COLOR_LENGTH = 200;
const MAX_GRID_ITEMS = 500;
const MAX_EFFECT_OPTIONS = 32;
const MAX_BLUR = 40;

const EFFECT_TYPES = Object.values(EFFECT);
const IMAGE_FITS = Object.values(IMAGE_FIT);
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const UPLOAD_PATH = /^\/uploads\/[A-Za-z0-9._-]+$/;

/** Trim + length-cap a service name. Returns '' when unusable. */
export function normalizeServiceName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_NAME_LENGTH);
}

/**
 * Normalize a service URL to a valid http(s) URL, adding `http://` when the
 * scheme is missing (so "host:8080" works). Returns null when invalid —
 * rejecting `javascript:` and friends, which would otherwise become a stored
 * XSS via the tile/list link href.
 */
export function normalizeServiceUrl(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;
  // Try the value as-is, then with http:// prefixed — the fallback also covers
  // scheme-less inputs whose host part parses like a scheme ("localhost:3000").
  const candidates = trimmed.includes('://') ? [trimmed] : [trimmed, `http://${trimmed}`];
  for (const candidate of candidates) {
    if (!HAS_SCHEME.test(candidate)) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === 'http:' || url.protocol === 'https:') return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

/**
 * Sanitize an icon reference rendered as an <img src>. Allows http(s) URLs,
 * same-origin paths (e.g. /uploads/…), and data:image/ URIs; anything else
 * (notably javascript:) is dropped so the letter-avatar fallback kicks in.
 */
export function normalizeIcon(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return '';
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  if (/^data:image\//i.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.protocol === 'http:' || url.protocol === 'https:') return trimmed;
  } catch {
    /* fall through */
  }
  return '';
}

/** Accept only a #rrggbb color (what the pickers emit); anything else clears to theme default. */
export function normalizeColor(value) {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value : '';
}

/** Coerce a background opacity to an integer percent in [0, 100]. */
export function normalizeOpacity(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(clamp(n, 0, 100)) : 100;
}

/**
 * Sanitize a react-grid-layout array to plain {i,x,y,w,h} items with finite,
 * clamped geometry. Returns null when the payload isn't an array at all, so
 * callers can distinguish "no grid sent" from "empty grid".
 */
export function sanitizeGridItems(value) {
  if (!Array.isArray(value)) return null;
  const items = [];
  for (const item of value.slice(0, MAX_GRID_ITEMS)) {
    if (!item || typeof item.i !== 'string') continue;
    const [x, y, w, h] = [item.x, item.y, item.w, item.h].map(Number);
    if (![x, y, w, h].every(Number.isFinite)) continue;
    items.push({
      i: item.i,
      x: clamp(Math.round(x), 0, GRID.COLUMNS - 1),
      y: Math.max(0, Math.round(y)),
      w: clamp(Math.round(w), 1, GRID.COLUMNS),
      h: Math.max(1, Math.round(h)),
    });
  }
  return items;
}

function asBool(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value, min, max, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? clamp(n, min, max) : fallback;
}

/** Effect options are a flat bag of numbers (density, speed, …); drop anything else. */
function sanitizeEffectOptions(value, fallback) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const out = {};
  for (const [key, v] of Object.entries(value).slice(0, MAX_EFFECT_OPTIONS)) {
    const n = Number(v);
    if (Number.isFinite(n)) out[key] = n;
  }
  return out;
}

/**
 * Merge a client-supplied background patch over the current config, keeping
 * only known keys with validated values (each field falls back to its current
 * value when the patch is missing or invalid).
 */
export function sanitizeBackground(incoming, current) {
  const layer = (key) =>
    incoming?.[key] && typeof incoming[key] === 'object' ? incoming[key] : {};

  const color = layer('color');
  const image = layer('image');
  const effect = layer('effect');
  const overlay = layer('overlay');

  return {
    color: {
      enabled: asBool(color.enabled, current.color.enabled),
      value:
        typeof color.value === 'string' && color.value.length <= MAX_COLOR_LENGTH
          ? color.value
          : current.color.value,
    },
    image: {
      enabled: asBool(image.enabled, current.image.enabled),
      // Only images served from our own /uploads route — never external URLs.
      path:
        typeof image.path === 'string' && (image.path === '' || UPLOAD_PATH.test(image.path))
          ? image.path
          : current.image.path,
      fit: IMAGE_FITS.includes(image.fit) ? image.fit : current.image.fit,
      blur: asNumber(image.blur, 0, MAX_BLUR, current.image.blur),
    },
    effect: {
      enabled: asBool(effect.enabled, current.effect.enabled),
      type: EFFECT_TYPES.includes(effect.type) ? effect.type : current.effect.type,
      options: sanitizeEffectOptions(effect.options, current.effect.options),
    },
    overlay: {
      enabled: asBool(overlay.enabled, current.overlay.enabled),
      dim: asNumber(overlay.dim, 0, 1, current.overlay.dim),
      blur: asNumber(overlay.blur, 0, MAX_BLUR, current.overlay.blur),
    },
  };
}
