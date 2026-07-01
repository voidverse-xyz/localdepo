import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/core/auth/session.js';
import { SESSION, HTTP } from '@/core/constants.js';

/** Server-only helpers shared by every API route (DRY response + auth). */

export function isAuthed() {
  const token = cookies().get(SESSION.COOKIE_NAME)?.value;
  return verifyToken(token);
}

export function json(data, status = HTTP.OK) {
  return NextResponse.json(data, { status });
}

export function unauthorized() {
  return json({ error: 'unauthorized' }, HTTP.UNAUTHORIZED);
}

export function badRequest(message = 'bad request') {
  return json({ error: message }, HTTP.BAD_REQUEST);
}

/**
 * Parse a JSON request body. Returns `{ body }` on success, or `{ error }`
 * holding a 400 response the caller can return directly.
 */
export async function readJson(request) {
  try {
    return { body: await request.json() };
  } catch {
    return { error: badRequest() };
  }
}

export function serverError(message = 'server error') {
  return json({ error: message }, HTTP.SERVER_ERROR);
}

/** Standard session cookie options. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION.TTL_SECONDS,
  };
}
