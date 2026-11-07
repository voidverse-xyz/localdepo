import { checkPassword, createToken } from '@/core/auth/session.js';
import { isLockedOut, recordFailure, clearFailures } from '@/core/auth/login-throttle.js';
import { json, readJson, unauthorized, isAuthed, sessionCookieOptions } from '@/lib/server/api.js';
import { SESSION, HTTP } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

/** Throttle key: first hop of x-forwarded-for when proxied, else one shared bucket. */
function clientKey(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'direct';
}

/** Report whether the current request carries a valid admin session. */
export async function GET() {
  const authed = await isAuthed();
  return json({ authed });
}

/** Log in: verify the password and set the signed session cookie. */
export async function POST(request) {
  const key = clientKey(request);
  if (isLockedOut(key)) {
    return json({ error: 'too many failed attempts, try again later' }, HTTP.TOO_MANY_REQUESTS);
  }

  const { body, error } = await readJson(request);
  if (error) return error;
  if (!checkPassword(body?.password)) {
    recordFailure(key);
    return unauthorized();
  }

  clearFailures(key);
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
