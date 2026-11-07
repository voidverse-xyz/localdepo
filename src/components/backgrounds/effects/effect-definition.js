/**
 * Factory for background effect plugins. Each effect declares its own settings
 * as plain value descriptors (key/label/min/max/step/default) that live in the
 * effect file (the "catalog"). The settings panel renders controls generically
 * from these — nothing about density/speed is hard-coded in the UI.
 *
 * @param {Object} spec
 * @param {string} spec.key - Stable id (matches EFFECT.* in constants).
 * @param {string} spec.label - Human-readable name.
 * @param {React.ComponentType<{options: Object}>} spec.component
 * @param {Array<{key:string,label:string,min:number,max:number,step:number,default:number}>} [spec.settings]
 */
export function defineEffect({ key, label, component, settings = [] }) {
  const defaults = {};
  for (const setting of settings) defaults[setting.key] = setting.default;
  return { key, label, component, settings, defaults };
}
