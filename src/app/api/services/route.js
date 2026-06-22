import { randomUUID } from 'node:crypto';
import { readConfig, updateConfig } from '@/core/storage/config-store.js';
import { json, badRequest, isAuthed, unauthorized } from '@/lib/server/api.js';
import { SERVICE_SOURCE } from '@/core/constants.js';
import { pick } from '@/lib/object.js';

export const dynamic = 'force-dynamic';

const EDITABLE = ['name', 'url', 'icon', 'category', 'enabled'];

export async function GET() {
  const config = await readConfig();
  return json({ services: config.services });
}

/** Add a manual service. */
export async function POST(request) {
  if (!isAuthed()) return unauthorized();
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  if (!body?.name || !body?.url) return badRequest('name and url are required');

  const service = {
    id: randomUUID(),
    name: body.name,
    url: body.url,
    icon: body.icon || '',
    category: body.category || 'General',
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
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }
  if (!body?.id) return badRequest('id is required');

  let found = false;
  const config = await updateConfig((cfg) => {
    const service = cfg.services.find((s) => s.id === body.id);
    if (!service) return;
    Object.assign(service, pick(body, EDITABLE));
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
    if (service?.source === SERVICE_SOURCE.DISCOVERED && !cfg.dismissed.includes(id)) {
      cfg.dismissed.push(id);
    }
  });
  return json({ services: config.services });
}
