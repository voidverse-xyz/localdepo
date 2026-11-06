import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { uploadsDir } from '@/core/storage/paths.js';
import { json, badRequest, isAuthed, unauthorized } from '@/lib/server/api.js';
import { UPLOAD, HTTP } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

const EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

/**
 * Magic-byte checks per allowed MIME type, so the stored bytes must actually
 * be the image format the client claims (the browser-supplied content type is
 * attacker-controlled).
 */
const MAGIC_BY_MIME = {
  'image/png': (b) => b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/gif': (b) => b.length >= 6 && ['GIF87a', 'GIF89a'].includes(b.toString('ascii', 0, 6)),
  'image/webp': (b) =>
    b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  'image/avif': (b) => b.length >= 12 && b.toString('ascii', 4, 8) === 'ftyp',
};

/** Upload a background image; returns the path used by the image layer. */
export async function POST(request) {
  if (!isAuthed()) return unauthorized();

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return badRequest('file is required');
  if (!UPLOAD.ALLOWED_MIME.includes(file.type)) {
    return json({ error: 'unsupported file type' }, HTTP.UNSUPPORTED_MEDIA);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  if (buffer.length > UPLOAD.MAX_BYTES) {
    return json({ error: 'file too large' }, HTTP.PAYLOAD_TOO_LARGE);
  }
  if (!MAGIC_BY_MIME[file.type]?.(buffer)) {
    return json({ error: 'file content does not match its type' }, HTTP.UNSUPPORTED_MEDIA);
  }

  const filename = `${randomUUID()}${EXT_BY_MIME[file.type] || ''}`;
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), filename), buffer);

  return json({ path: `/uploads/${filename}` });
}
