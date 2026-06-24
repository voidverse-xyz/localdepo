import { getScanTargets } from './subnet.js';
import { probe } from './probe.js';
import { identify } from './fingerprint.js';
import { getAllDefinitions, getAllPorts } from '../services/registry.js';
import { buildUrl } from '../services/service-definition.js';
import { SCAN, SERVICE_SOURCE } from '../constants.js';

/** Default icon for a discovered service: the site's favicon at its origin. */
function faviconFor(url) {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return '';
  }
}

/** Run `worker` over `items` with a bounded number of concurrent runners. */
async function pool(items, worker, concurrency) {
  const results = [];
  let index = 0;
  const runnerCount = Math.max(1, Math.min(concurrency, items.length));
  const runners = Array.from({ length: runnerCount }, async () => {
    while (index < items.length) {
      const item = items[index++];
      const out = await worker(item);
      if (out) results.push(out);
    }
  });
  await Promise.all(runners);
  return results;
}

/**
 * Scan the network and return the services discovered (as persistable Service
 * objects). Pure of storage — callers merge the result into config.
 * @returns {Promise<import('../types.js').Service[]>}
 */
export async function scanNetwork({ targets, ports, concurrency = SCAN.CONCURRENCY } = {}) {
  const hosts = targets || getScanTargets();
  const candidatePorts = ports || getAllPorts();
  const definitions = getAllDefinitions();

  const jobs = [];
  for (const host of hosts) {
    for (const port of candidatePorts) jobs.push({ host, port });
  }

  const found = await pool(
    jobs,
    async ({ host, port }) => {
      const result = await probe(host, port);
      if (!result.open) return null;
      const def = identify(result, definitions);
      if (!def) return null;
      const url = buildUrl(def, host, port);
      return {
        id: `${def.id}-${host}-${port}`,
        definitionId: def.id,
        name: def.getName(),
        url,
        // Prefer the catalog icon; otherwise default to the service's own
        // favicon (derived from its URL). ServiceIcon falls back to a letter
        // avatar if that favicon fails to load.
        icon: def.icon || faviconFor(url),
        source: SERVICE_SOURCE.DISCOVERED,
        enabled: true,
      };
    },
    concurrency,
  );

  const seen = new Set();
  return found.filter((s) => (seen.has(s.url) ? false : seen.add(s.url)));
}
