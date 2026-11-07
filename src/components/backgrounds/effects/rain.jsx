'use client';

import { useMemo } from 'react';
import { useCanvasAnimation } from '@/hooks/use-canvas-animation.js';
import { rand } from '@/lib/math.js';
import { EFFECT } from '@/core/constants.js';
import { defineEffect } from './effect-definition.js';

function makeDrop(width, y) {
  return {
    x: rand(0, width),
    y: y ?? rand(0, 1),
    v: rand(8, 16),
    vx: rand(0.4, 1.2),
    len: rand(8, 18),
  };
}

/**
 * Falling rain. Wind controls the horizontal slant, centered at 1.5 = straight
 * down. Below 1.5 it leans one way (0 = full opposite slant); above 1.5 the other.
 */
function Rain({ options }) {
  const { density = 0.6, speed = 1, wind = 1.5 } = options;
  const slant = wind - 1.5;
  const state = useMemo(() => ({ drops: [], w: 0, h: 0 }), []);

  const ref = useCanvasAnimation(
    (ctx, { width, height, dt }) => {
      if (state.w !== width || state.h !== height || state.drops.length === 0) {
        state.w = width;
        state.h = height;
        const count = Math.floor(((width * height) / 9000) * (0.3 + density));
        state.drops = Array.from({ length: count }, () => {
          const d = makeDrop(width);
          d.y *= height;
          return d;
        });
      }

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
      ctx.lineWidth = 1;
      for (const d of state.drops) {
        d.y += d.v * speed * dt * 60;
        d.x += d.vx * slant * speed * dt * 60;
        if (d.y > height) Object.assign(d, makeDrop(width, 0));
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.vx * slant * d.len, d.y - d.len);
        ctx.stroke();
      }
    },
    [density, speed, slant],
  );

  return <canvas ref={ref} className="bg-canvas" />;
}

export default defineEffect({
  key: EFFECT.RAIN,
  label: 'Rain',
  component: Rain,
  settings: [
    { key: 'density', label: 'Density', min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.1, default: 1 },
    { key: 'wind', label: 'Wind', min: 0, max: 3, step: 0.1, default: 1.5 },
  ],
});
