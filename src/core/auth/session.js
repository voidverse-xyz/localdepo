import crypto from 'node:crypto';
import { ENV, SESSION } from '../constants.js';

/**
 * Stateless admin sessions: a signed, expiring token stored in an httpOnly
 * cookie. The raw admin password is only ever compared server-side and never
 * leaves the server.
 */

function secret() {
  // A stable fallback keeps dev working; production should set SESSION_SECRET.
  return process.env[ENV.SESSION_SECRET] || 'localdepo-insecure-dev-secret';
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Issue a signed token valid for `ttl` seconds. */
export function createToken(ttl = SESSION.TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify signature + expiry of a token. */
export function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);

  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;

  const exp = parseInt(payload.split('.')[1], 10);
  return Boolean(exp) && exp >= Math.floor(Date.now() / 1000);
}

/** Constant-time compare of a submitted password against ADMIN_PASSWORD. */
export function checkPassword(input) {
  const expected = process.env[ENV.ADMIN_PASSWORD];
  if (!expected) return false; // no password configured => everything stays locked
  const a = Buffer.from(String(input ?? ''));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
