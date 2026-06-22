import { STORAGE, VIEW_MODE, EFFECT, IMAGE_FIT } from '../constants.js';

/** Default background: color + starfield + readability overlay enabled. */
export function defaultBackground() {
  return {
    color: { enabled: true, value: '#0b0f1a' },
    image: { enabled: false, path: '', fit: IMAGE_FIT.COVER, blur: 0 },
    effect: { enabled: true, type: EFFECT.STARFIELD, options: { density: 0.6, speed: 1 } },
    overlay: { enabled: true, dim: 0.35, blur: 0 },
  };
}

/** A fresh, empty config document. */
export function defaultConfig() {
  return {
    version: STORAGE.CONFIG_VERSION,
    services: [],
    dismissed: [], // discovered service ids the user deleted (suppress on rescan)
    view: { mode: VIEW_MODE.GRID },
    layout: { custom: {}, grid: {} },
    background: defaultBackground(),
  };
}

/** Shallow-merge helper that keeps existing keys and fills missing ones. */
function withDefaults(value, defaults) {
  if (!value || typeof value !== 'object') return defaults;
  return { ...defaults, ...value };
}

/**
 * Normalize a (possibly older/partial) config to the current shape so that
 * missing keys never crash the app. Forward-compatible by design.
 * @param {Partial<import('../types.js').Config>} raw
 * @returns {import('../types.js').Config}
 */
export function migrate(raw) {
  const base = defaultConfig();
  if (!raw || typeof raw !== 'object') return base;

  const bg = raw.background || {};
  return {
    version: STORAGE.CONFIG_VERSION,
    services: Array.isArray(raw.services) ? raw.services : base.services,
    dismissed: Array.isArray(raw.dismissed) ? raw.dismissed : base.dismissed,
    view: withDefaults(raw.view, base.view),
    layout: withDefaults(raw.layout, base.layout),
    background: {
      color: withDefaults(bg.color, base.background.color),
      image: withDefaults(bg.image, base.background.image),
      effect: withDefaults(bg.effect, base.background.effect),
      overlay: withDefaults(bg.overlay, base.background.overlay),
    },
  };
}
