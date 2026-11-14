import { checkPassword, createToken } from '@/core/auth/session.js';
import { isLockedOut, recordFailure, clearFailures } from '@/core/auth/login-throttle.js';
import { json, readJson, unauthorized, isAuthed, sessionCookieOptions } from '@/lib/server/api.js';
import { SESSION, HTTP } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

// There is one admin account. Client-supplied proxy headers cannot partition its limit.
const LOGIN_KEY = 'admin';

function tooManyAttempts() {
  return json({ error: 'too many failed attempts, try again later' }, HTTP.TOO_MANY_REQUESTS);
}

/** Report whether the current request carries a valid admin session. */
export async function GET() {
  const authed = await isAuthed();
  return json({ authed });
}

/** Log in: verify the password and set the signed session cookie. */
export async function POST(request) {
  if (isLockedOut(LOGIN_KEY)) return tooManyAttempts();

  const { body, error } = await readJson(request);
  if (error) return error;
  // Other requests may exhaust the limit while this request's body is being read.
  if (isLockedOut(LOGIN_KEY)) return tooManyAttempts();
  if (!checkPassword(body?.password)) {
    recordFailure(LOGIN_KEY);
    return unauthorized();
  }

  clearFailures(LOGIN_KEY);
  const res = json({ ok: true });
  res.cookies.set(SESSION.COOKIE_NAME, createToken(), sessionCookieOptions());
  return res;
}

/** Log out: clear the session cookie. */
export async function DELETE() {
  const res = json({ ok: true });
  res.cookies.set(SESSION.COOKIE_NAME, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
