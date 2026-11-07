'use client';

import { useRef } from 'react';
import { useCanvasAnimation } from '@/hooks/use-canvas-animation.js';
import { rand } from '@/lib/math.js';
import { EFFECT } from '@/core/constants.js';
import { defineEffect } from './effect-definition.js';

function makeStar(width, y) {
  return {
    x: rand(0, width),
    y: y ?? rand(0, 1),
    r: rand(0.4, 1.6),
    vy: rand(0.05, 0.5),
    tw: rand(0, Math.PI * 2),
    tws: rand(0.5, 2),
  };
}

/** Slowly drifting, twinkling starfield. Options are supplied by its settings. */
function Starfield({ options }) {
  const { density = 0.6, speed = 1 } = options;
  const stateRef = useRef({ stars: [], w: 0, h: 0 });

  const ref = useCanvasAnimation(
    (ctx, { width, height, dt }) => {
      const state = stateRef.current;
      if (state.w !== width || state.h !== height || state.stars.length === 0) {
        state.w = width;
        state.h = height;
        const count = Math.floor(((width * height) / 6000) * (0.3 + density));
        state.stars = Array.from({ length: count }, () => {
          const s = makeStar(width);
          s.y *= height;
          return s;
        });
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      for (const s of state.stars) {
        s.y += s.vy * speed * dt * 60;
        s.tw += dt * s.tws;
        if (s.y > height) Object.assign(s, makeStar(width, 0));
        ctx.globalAlpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [density, speed],
  );

  return <canvas ref={ref} className="bg-canvas" />;
}

export default defineEffect({
  key: EFFECT.STARFIELD,
  label: 'Space stars',
  component: Starfield,
  settings: [
    { key: 'density', label: 'Density', min: 0, max: 1, step: 0.05, default: 0.6 },
    { key: 'speed', label: 'Speed', min: 0, max: 3, step: 0.1, default: 1 },
  ],
});
