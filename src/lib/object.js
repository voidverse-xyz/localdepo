/** Return a copy of `obj` containing only the allowed keys that are present. */
export function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj != null && Object.prototype.hasOwnProperty.call(obj, key)) {
      out[key] = obj[key];
    }
  }
  return out;
}
