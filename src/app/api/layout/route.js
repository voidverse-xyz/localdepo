import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, badRequest, isAuthed, unauthorized } from '@/lib/server/api.js';
import { VIEW_MODES } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await readConfig();
  return json({ view: config.view, layout: config.layout });
}

/** Persist the tile layout and/or active view mode (admin only). */
export async function PUT(request) {
  if (!isAuthed()) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }

  const config = await updateConfig((cfg) => {
    if (body.layout && typeof body.layout === 'object') {
      cfg.layout = { ...cfg.layout, ...body.layout };
    }
    if (body.view?.mode && VIEW_MODES.includes(body.view.mode)) {
      cfg.view.mode = body.view.mode;
    }
  });
  return json({ view: config.view, layout: config.layout });
}
