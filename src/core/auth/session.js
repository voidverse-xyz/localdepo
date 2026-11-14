import crypto from 'node:crypto';
import { ENV, SESSION } from '../constants.js';

/**
 * Stateless admin sessions: a signed, expiring token stored in an httpOnly
 * cookie. The raw admin password is only ever compared server-side and never
 * leaves the server.
 */

const EXAMPLE_SECRETS = new Set([
  'please-change-this-to-a-long-random-string',
  'please-change-me-to-a-long-random-string',
]);

function credentials() {
  const password = process.env[ENV.ADMIN_PASSWORD];
  const secret = process.env[ENV.SESSION_SECRET];
  const trimmedSecret = secret?.trim();
  if (!password?.trim() || password.trim().toLowerCase() === 'changeme') return null;
  if (!trimmedSecret || Buffer.byteLength(trimmedSecret) < 32 || EXAMPLE_SECRETS.has(trimmedSecret)) {
    return null;
  }
  return { password, secret };
}

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('base64url');
}

/** Issue a signed token valid for `ttl` seconds. */
export function createToken(ttl = SESSION.TTL_SECONDS) {
  const config = credentials();
  if (!config) {
    throw new Error('Configure a unique ADMIN_PASSWORD and a random SESSION_SECRET of at least 32 bytes');
  }
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const payload = `admin.${exp}`;
  return `${payload}.${sign(payload, config.secret)}`;
}

/** Verify signature + expiry of a token. */
export function verifyToken(token) {
  const config = credentials();
  if (!config || typeof token !== 'string') return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = Buffer.from(token.slice(lastDot + 1));
  const expected = Buffer.from(sign(payload, config.secret));

  if (signature.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(signature, expected)) return false;

  const exp = parseInt(payload.split('.')[1], 10);
  return Boolean(exp) && exp >= Math.floor(Date.now() / 1000);
}

/** Constant-time compare of a submitted password against ADMIN_PASSWORD. */
export function checkPassword(input) {
  const config = credentials();
  if (!config || typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(config.password);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
