import { randomUUID } from 'node:crypto';
import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, badRequest, readJson, isAuthed, unauthorized } from '@/lib/server/api.js';
import {
  normalizeServiceName,
  normalizeServiceUrl,
  normalizeIcon,
  normalizeColor,
  normalizeOpacity,
} from '@/core/validation.js';
import { SERVICE_SOURCE } from '@/core/constants.js';
import { pick } from '@/lib/object.js';

export const dynamic = 'force-dynamic';

const EDITABLE = ['name', 'url', 'icon', 'enabled', 'bg', 'fg', 'bgOpacity'];

export async function GET() {
  const config = await readConfig();
  return json({ services: config.services });
}

/** Add a manual service. */
export async function POST(request) {
  if (!isAuthed()) return unauthorized();
  const { body, error } = await readJson(request);
  if (error) return error;

  const name = normalizeServiceName(body?.name);
  const url = normalizeServiceUrl(body?.url);
  if (!name || !url) return badRequest('name and a valid http(s) url are required');

  const service = {
    id: randomUUID(),
    name,
    url,
    icon: normalizeIcon(body?.icon),
    bg: normalizeColor(body?.bg),
    fg: normalizeColor(body?.fg),
    bgOpacity: normalizeOpacity(body?.bgOpacity),
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
  if (updates.name !== undefined) {
    updates.name = normalizeServiceName(updates.name);
    if (!updates.name) return badRequest('name is required');
  }
  if (updates.url !== undefined) {
    updates.url = normalizeServiceUrl(updates.url);
    if (!updates.url) return badRequest('url must be a valid http(s) url');
  }
  if (updates.icon !== undefined) updates.icon = normalizeIcon(updates.icon);
  if (updates.bg !== undefined) updates.bg = normalizeColor(updates.bg);
  if (updates.fg !== undefined) updates.fg = normalizeColor(updates.fg);
  if (updates.enabled !== undefined) updates.enabled = Boolean(updates.enabled);
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
