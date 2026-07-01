import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, badRequest, readJson, isAuthed, unauthorized } from '@/lib/server/api.js';
import { sanitizeBackground } from '@/core/validation.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await readConfig();
  return json({ background: config.background });
}

/**
 * Persist background layer settings (admin only). Each layer merges over the
 * current config with every field validated/clamped (see sanitizeBackground).
 */
export async function PUT(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body?.background || typeof body.background !== 'object') {
    return badRequest('background is required');
  }

  const config = await updateConfig((cfg) => {
    cfg.background = sanitizeBackground(body.background, cfg.background);
  });
  return json({ background: config.background });
}
