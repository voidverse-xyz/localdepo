import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, readJson, isAuthed, unauthorized } from '@/lib/server/api.js';
import { VIEW_MODES, THEMES } from '@/core/constants.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await readConfig();
  return json({ view: config.view, layout: config.layout, ui: config.ui });
}

/** Persist the tile layout, view mode, and UI prefs (theme + controls position). */
export async function PUT(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;

  const config = await updateConfig((cfg) => {
    if (body.layout && typeof body.layout === 'object') {
      const patch = { ...body.layout };
      // Never persist a non-array grid — otherwise migrate() would later drop
      // the whole layout, silently wiping the user's saved tiles.
      if (patch.grid !== undefined && !Array.isArray(patch.grid)) delete patch.grid;
      cfg.layout = { ...cfg.layout, ...patch };
    }
    if (body.view?.mode && VIEW_MODES.includes(body.view.mode)) {
      cfg.view.mode = body.view.mode;
    }
    if (body.ui && typeof body.ui === 'object') {
      if (THEMES.includes(body.ui.theme)) cfg.ui.theme = body.ui.theme;
      if (body.ui.controls !== undefined) cfg.ui.controls = body.ui.controls;
    }
  });
  return json({ view: config.view, layout: config.layout, ui: config.ui });
}
