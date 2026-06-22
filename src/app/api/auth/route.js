import { checkPassword, createToken } from '@/core/auth/session.js';
import { json, badRequest, unauthorized, isAuthed, sessionCookieOptions } from '@/lib/server/api.js';
import { SESSION } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

/** Report whether the current request carries a valid admin session. */
export async function GET() {
  return json({ authed: isAuthed() });
}

/** Log in: verify the password and set the signed session cookie. */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  if (!checkPassword(body?.password)) return unauthorized();

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
