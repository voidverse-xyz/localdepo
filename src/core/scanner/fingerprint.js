import { getAllDefinitions } from '../services/registry.js';

/**
 * Identify which service (if any) a probe result corresponds to.
 * Prefers a plugin whose default port matches; falls back to a content-only
 * match so remapped ports still resolve.
 * @param {import('../types.js').ProbeResult} probe
 * @returns {import('../types.js').ServiceDefinition|null}
 */
export function identify(probe, definitions = getAllDefinitions()) {
  for (const def of definitions) {
    if (def.getDefaultPorts().includes(probe.port) && def.matches(probe)) {
      return def;
    }
  }
  for (const def of definitions) {
    if (def.matches(probe)) return def;
  }
  return null;
}
