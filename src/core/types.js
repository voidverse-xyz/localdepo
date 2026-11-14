/**
 * Domain shapes documented as JSDoc typedefs. Pure documentation — these give
 * editor autocomplete/checking without a TypeScript build step. No runtime code.
 */

/**
 * A service plugin definition (one per file in core/services/catalog).
 * @typedef {Object} ServiceDefinition
 * @property {string} id - Stable unique key, e.g. "jellyfin".
 * @property {string} [icon] - Optional icon URL or data URI.
 * @property {() => string} getName - Human-readable name.
 * @property {() => number[]} getDefaultPorts - Ports to probe during discovery.
 * @property {() => ('http'|'https')} getScheme - Scheme used to build the URL.
 * @property {() => string} getPath - Landing path appended to the URL (e.g. "/web").
 * @property {(probe: ProbeResult) => boolean} matches - Fingerprint: true if this
 *   service is running at the probed endpoint.
 */

/**
 * Raw result of probing one host:port (passed to ServiceDefinition.matches).
 * @typedef {Object} ProbeResult
 * @property {string} host
 * @property {number} port
 * @property {boolean} open - TCP port accepted a connection.
 * @property {number} [status] - HTTP status code, if an HTTP response came back.
 * @property {Object<string,string>} [headers] - Lowercased response headers.
 * @property {string} [body] - Truncated response body text.
 */

/**
 * A service shown on the dashboard (persisted in config).
 * @typedef {Object} Service
 * @property {string} id - Unique instance id.
 * @property {string} name
 * @property {string} url - Fully-qualified URL opened on click.
 * @property {string} [icon]
 * @property {('discovered'|'manual')} source
 * @property {boolean} enabled
 * @property {string} [definitionId] - Catalog plugin id, if discovered.
 */

/**
 * react-grid-layout item geometry.
 * @typedef {Object} LayoutItem
 * @property {string} i - Matches Service.id.
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * Background configuration — all four layers compose together.
 * @typedef {Object} BackgroundConfig
 * @property {{enabled:boolean,value:string}} color
 * @property {{enabled:boolean,path:string,fit:string,blur:number}} image
 * @property {{enabled:boolean,type:string,options:Object}} effect
 * @property {{enabled:boolean,dim:number,blur:number}} overlay
 */

/**
 * The full persisted config document (config.json).
 * @typedef {Object} Config
 * @property {number} version
 * @property {Service[]} services
 * @property {string[]} dismissed - Discovered ids the user deleted (suppressed on rescan).
 * @property {{mode:string}} view
 * @property {{grid: LayoutItem[]}} layout - Controlled react-grid-layout geometry.
 * @property {{theme:string}} ui
 * @property {BackgroundConfig} background
 */

export {};
