import { SCHEME } from '../constants.js';

/**
 * Factory that turns a small plugin spec into a normalized ServiceDefinition.
 * Every catalog file calls this so all plugins share one consistent shape.
 *
 * @param {Object} spec
 * @param {string} spec.id
 * @param {string} spec.name
 * @param {number|number[]} spec.ports
 * @param {('http'|'https')} [spec.scheme]
 * @param {string} [spec.path]
 * @param {string} [spec.icon]
 * @param {(probe: import('../types.js').ProbeResult) => boolean} spec.match
 * @returns {import('../types.js').ServiceDefinition}
 */
export function defineService(spec) {
  const {
    id,
    name,
    ports,
    scheme = SCHEME.HTTP,
    path = '',
    icon = '',
    match,
  } = spec;

  return {
    id,
    icon,
    getName: () => name,
    getDefaultPorts: () => (Array.isArray(ports) ? ports : [ports]),
    getScheme: () => scheme,
    getPath: () => path,
    matches: (probe) => {
      try {
        return Boolean(match(probe));
      } catch {
        return false;
      }
    },
  };
}

/** Build the clickable URL for a discovered service. */
export function buildUrl(def, host, port) {
  return `${def.getScheme()}://${host}:${port}${def.getPath()}`;
}

/**
 * Shared fingerprint helpers, so catalog files stay tiny and consistent.
 */
export const fp = {
  /** Endpoint responded without a server error. */
  ok: (p) => p.open && (p.status === undefined || (p.status >= 200 && p.status < 500)),
  /** Response body matches a regex. */
  body: (p, re) => typeof p.body === 'string' && re.test(p.body),
  /** Header present (optionally matching a regex). */
  header: (p, name, re) => {
    const v = p.headers ? p.headers[name.toLowerCase()] : undefined;
    if (v === undefined) return false;
    return re ? re.test(v) : true;
  },
};
