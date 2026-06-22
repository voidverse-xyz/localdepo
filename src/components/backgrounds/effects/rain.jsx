'use client';

import { useMemo } from 'react';
import { useCanvasAnimation } from '@/hooks/use-canvas-animation.js';
import { clamp, rand } from '@/lib/math.js';

function makeDrop(width, y) {
  return {
    x: rand(0, width),
    y: y ?? rand(0, 1),
    v: rand(8, 16),
    vx: rand(0.4, 1.2),
    len: rand(8, 18),
  };
}

/** Diagonal falling rain. */
export default function Rain({ options = {} }) {
  const density = clamp(options.density ?? 0.6, 0, 1);
  const speed = clamp(options.speed ?? 1, 0, 5);
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
        d.x += d.vx * speed * dt * 60;
        if (d.y > height) Object.assign(d, makeDrop(width, 0));
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.vx * d.len, d.y - d.len);
        ctx.stroke();
      }
    },
    [density, speed],
  );

  return <canvas ref={ref} className="bg-canvas" />;
}
