/** Clamp `n` into the inclusive range [min, max]. */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Uniform random number in the half-open range [min, max). */
export function rand(min = 0, max = 1) {
  return min + Math.random() * (max - min);
}
