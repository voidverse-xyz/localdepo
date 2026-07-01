import { randomUUID } from 'node:crypto';
import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, badRequest, readJson, isAuthed, unauthorized } from '@/lib/server/api.js';
import { SERVICE_SOURCE } from '@/core/constants.js';
import { pick } from '@/lib/object.js';
import { clamp } from '@/lib/math.js';

export const dynamic = 'force-dynamic';

const EDITABLE = ['name', 'url', 'icon', 'enabled', 'bg', 'fg', 'bgOpacity'];

/** Coerce a client-supplied background opacity to an integer percent in [0, 100]. */
function normalizeOpacity(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(clamp(n, 0, 100)) : 100;
}

export async function GET() {
  const config = await readConfig();
  return json({ services: config.services });
}

/** Add a manual service. */
export async function POST(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body?.name || !body?.url) return badRequest('name and url are required');

  const service = {
    id: randomUUID(),
    name: body.name,
    url: body.url,
    icon: body.icon || '',
    bg: body.bg || '',
    fg: body.fg || '',
    bgOpacity: normalizeOpacity(body.bgOpacity),
    source: SERVICE_SOURCE.MANUAL,
    enabled: true,
  };
  const config = await updateConfig((cfg) => {
    cfg.services.push(service);
  });
  return json({ service, services: config.services });
}

/** Edit an existing service (manual or discovered). */
export async function PUT(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;
  if (!body?.id) return badRequest('id is required');

  const updates = pick(body, EDITABLE);
  if (updates.bgOpacity !== undefined) updates.bgOpacity = normalizeOpacity(updates.bgOpacity);

  let found = false;
  const config = await updateConfig((cfg) => {
    const service = cfg.services.find((s) => s.id === body.id);
    if (!service) return;
    Object.assign(service, updates);
    found = true;
  });
  if (!found) return badRequest('service not found');
  return json({ services: config.services });
}

/** Delete a service. Discovered services are remembered so a rescan won't re-add them. */
export async function DELETE(request) {
  if (!isAuthed()) return unauthorized();
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return badRequest('id is required');

  const config = await updateConfig((cfg) => {
    const service = cfg.services.find((s) => s.id === id);
    cfg.services = cfg.services.filter((s) => s.id !== id);
    // Drop the service's grid tile too, so deletion never leaves an orphaned
    // entry in layout.grid.
    if (Array.isArray(cfg.layout?.grid)) {
      cfg.layout.grid = cfg.layout.grid.filter((g) => g.i !== id);
    }
    if (service?.source === SERVICE_SOURCE.DISCOVERED && !cfg.dismissed.includes(id)) {
      cfg.dismissed.push(id);
    }
  });
  return json({ services: config.services });
}
