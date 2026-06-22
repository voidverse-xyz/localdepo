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

/** Upload a background image; returns the path used by the image layer. */
export async function POST(request) {
  if (!isAuthed()) return unauthorized();

  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return badRequest('file is required');
  if (!UPLOAD.ALLOWED_MIME.includes(file.type)) {
    return json({ error: 'unsupported file type' }, HTTP.UNSUPPORTED_MEDIA);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > UPLOAD.MAX_BYTES) {
    return json({ error: 'file too large' }, HTTP.PAYLOAD_TOO_LARGE);
  }

  const filename = `${randomUUID()}${EXT_BY_MIME[file.type] || ''}`;
  await fs.mkdir(uploadsDir(), { recursive: true });
  await fs.writeFile(path.join(uploadsDir(), filename), buffer);

  return json({ path: `/uploads/${filename}` });
}
