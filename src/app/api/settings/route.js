import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, badRequest, readJson, isAuthed, unauthorized } from '@/lib/server/api.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await readConfig();
  return json({ background: config.background });
}

/** Persist background layer settings (admin only). Layers merge individually. */
export async function PUT(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body?.background) return badRequest('background is required');

  const incoming = body.background;
  const config = await updateConfig((cfg) => {
    cfg.background = {
      color: { ...cfg.background.color, ...(incoming.color || {}) },
      image: { ...cfg.background.image, ...(incoming.image || {}) },
      effect: { ...cfg.background.effect, ...(incoming.effect || {}) },
      overlay: { ...cfg.background.overlay, ...(incoming.overlay || {}) },
    };
  });
  return json({ background: config.background });
}
