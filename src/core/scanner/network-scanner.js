import { getScanTargets } from './subnet.js';
import { probe } from './probe.js';
import { identify } from './fingerprint.js';
import { getAllDefinitions, getAllPorts } from '../services/registry.js';
import { buildUrl } from '../services/service-definition.js';
import { SCAN, SERVICE_SOURCE } from '../constants.js';

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
      return {
        id: `${def.id}-${host}-${port}`,
        definitionId: def.id,
        name: def.getName(),
        url: buildUrl(def, host, port),
        icon: def.icon,
        category: def.category,
        source: SERVICE_SOURCE.DISCOVERED,
        enabled: true,
      };
    },
    concurrency,
  );

  const seen = new Set();
  return found.filter((s) => (seen.has(s.url) ? false : seen.add(s.url)));
}
