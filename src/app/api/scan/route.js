import { scanNetwork } from '@/core/scanner/network-scanner.js';
import { mergeDiscovered } from '@/core/services/merge.js';
import { updateConfig } from '@/core/storage/config-store.js';
import { json, isAuthed, unauthorized, serverError } from '@/lib/server/api.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/** Run a network scan and merge newly discovered services into the config. */
export async function POST() {
  const authed = await isAuthed();
  if (!authed) return unauthorized();
  try {
    const discovered = await scanNetwork();
    let added = 0;
    const config = await updateConfig((cfg) => {
      const before = cfg.services.length;
      cfg.services = mergeDiscovered(cfg.services, discovered, cfg.dismissed);
      added = cfg.services.length - before;
    });
    return json({ added, found: discovered.length, services: config.services });
  } catch (err) {
    return serverError(err?.message || 'scan failed');
  }
}
