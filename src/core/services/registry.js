/**
 * Central registry of service plugins.
 *
 * To add a new detectable service: create a file in ./catalog that default-
 * exports `defineService({...})`, then add a single import + array entry below.
 * Everything else (discovery, fingerprinting, tiles) picks it up automatically.
 */
import jellyfin from './catalog/jellyfin.js';
import plex from './catalog/plex.js';
import sonarr from './catalog/sonarr.js';
import radarr from './catalog/radarr.js';
import prowlarr from './catalog/prowlarr.js';
import qbittorrent from './catalog/qbittorrent.js';

/** @type {import('../types.js').ServiceDefinition[]} */
const DEFINITIONS = [jellyfin, plex, sonarr, radarr, prowlarr, qbittorrent];

export function getAllDefinitions() {
  return DEFINITIONS;
}

/** All distinct ports across the catalog (used to bound the scan surface). */
export function getAllPorts() {
  const ports = new Set();
  for (const def of DEFINITIONS) {
    for (const port of def.getDefaultPorts()) ports.add(port);
  }
  return [...ports];
}
