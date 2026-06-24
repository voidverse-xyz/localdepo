'use client';

import { getEffect, getEffectDefaults } from './effects/registry.js';

/** Effect layer: renders the active effect, merging saved options over its defaults. */
export default function EffectLayer({ type, options }) {
  const effect = getEffect(type);
  if (!effect) return null;
  const Effect = effect.component;
  const merged = { ...getEffectDefaults(type), ...(options || {}) };
  return (
    <div className="bg-layer">
      <Effect options={merged} />
    </div>
  );
}
