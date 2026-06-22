'use client';

import { getEffect } from './effects/registry.js';

/** Effect layer: renders the active animated effect from the registry. */
export default function EffectLayer({ type, options }) {
  const effect = getEffect(type);
  if (!effect) return null;
  const Effect = effect.component;
  return (
    <div className="bg-layer">
      <Effect options={options} />
    </div>
  );
}
