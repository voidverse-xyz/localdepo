import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, readJson, badRequest, isAuthed, unauthorized } from '@/lib/server/api.js';
import { sanitizeGridItems } from '@/core/validation.js';
import { VIEW_MODES, THEMES } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await readConfig();
  return json({ view: config.view, layout: config.layout, ui: config.ui });
}

/** Persist the tile layout, view mode, and UI prefs (theme). */
export async function PUT(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body || typeof body !== 'object') return badRequest();

  // null when the payload carried no usable grid. Only ever persisting a
  // sanitized array also means migrate() can't later drop the whole layout
  // and silently wipe the user's saved tiles.
  const grid = sanitizeGridItems(body.layout?.grid);

  const config = await updateConfig((cfg) => {
    if (grid) cfg.layout = { ...cfg.layout, grid };
    if (VIEW_MODES.includes(body.view?.mode)) cfg.view.mode = body.view.mode;
    if (THEMES.includes(body.ui?.theme)) cfg.ui.theme = body.ui.theme;
  });
  return json({ view: config.view, layout: config.layout, ui: config.ui });
}
