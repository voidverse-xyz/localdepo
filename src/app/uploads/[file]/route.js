import { promises as fs } from 'node:fs';
import path from 'node:path';
import { uploadsDir } from '@/core/storage/paths.js';

export const dynamic = 'force-dynamic';

const TYPE_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

/** Serve a background image from the data volume (outside Next's public dir). */
export async function GET(_request, { params }) {
  const name = path.basename(params.file); // basename strips any path traversal
  const filePath = path.join(uploadsDir(), name);
  try {
    const data = await fs.readFile(filePath);
    const type = TYPE_BY_EXT[path.extname(name).toLowerCase()] || 'application/octet-stream';
    return new Response(data, {
      headers: {
        'content-type': type,
        'cache-control': 'public, max-age=3600',
        // Uploaded bytes must never be sniffed into a scriptable type.
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
