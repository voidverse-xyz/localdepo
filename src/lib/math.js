/** Clamp `n` into the inclusive range [min, max]. */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Deterministic pseudo-random in [0, 1) without Math.random seed concerns. */
export function rand(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}
