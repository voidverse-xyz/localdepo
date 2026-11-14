/**
 * Background effect registry. To add an effect: create a file in this folder
 * that default-exports `defineEffect({...})` (component + its settings as
 * values), then add a single import + entry below.
 */
import starfield from './starfield.jsx';
import rain from './rain.jsx';

const EFFECTS = {
  [starfield.key]: starfield,
  [rain.key]: rain,
};

export function getEffect(key) {
  return EFFECTS[key] || null;
}

export function listEffects() {
  return Object.values(EFFECTS).map((e) => ({ key: e.key, label: e.label }));
}

/** Default option values for an effect, derived from its settings descriptors. */
export function getEffectDefaults(key) {
  const effect = EFFECTS[key];
  return effect ? { ...effect.defaults } : {};
}
