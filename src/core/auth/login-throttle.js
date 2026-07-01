import { LOGIN } from '../constants.js';

/**
 * In-memory login throttle: after LOGIN.MAX_FAILURES failed attempts within
 * LOGIN.WINDOW_MS, a client key is locked out until the window expires. State
 * is per-process (fine for a single-instance, self-hosted app) and pruned on
 * every access so the map stays bounded.
 */

/** @type {Map<string, {count: number, first: number}>} */
const failures = new Map();

function prune(now) {
  for (const [key, entry] of failures) {
    if (now - entry.first > LOGIN.WINDOW_MS) failures.delete(key);
  }
}

/** True when the key has exhausted its failed attempts for the current window. */
export function isLockedOut(key, now = Date.now()) {
  prune(now);
  const entry = failures.get(key);
  return Boolean(entry && entry.count >= LOGIN.MAX_FAILURES);
}

/** Record one failed login attempt for the key. */
export function recordFailure(key, now = Date.now()) {
  prune(now);
  const entry = failures.get(key);
  if (entry) entry.count += 1;
  else failures.set(key, { count: 1, first: now });
}

/** Reset the key (called after a successful login). */
export function clearFailures(key) {
  failures.delete(key);
}
