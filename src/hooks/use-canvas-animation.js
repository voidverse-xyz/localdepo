import { useEffect, useLayoutEffect, useRef } from 'react';

// Cap the device-pixel-ratio so very high-DPI screens don't render 3-4x the pixels.
const MAX_DPR = 2;
// Clamp the per-frame delta (seconds) so animation doesn't lurch after the tab
// was backgrounded and requestAnimationFrame paused.
const MAX_FRAME_DT = 0.05;

/**
 * Reusable canvas animation loop. Handles DPR-aware sizing, resize, and the
 * requestAnimationFrame loop so individual effects only describe how to draw.
 *
 * @param {(ctx: CanvasRenderingContext2D, frame: {width:number,height:number,dt:number,t:number}) => void} draw
 * @param {Array<any>} deps - Recreate the loop when these change (e.g. options).
 * @returns {React.RefObject<HTMLCanvasElement>}
 */
export function useCanvasAnimation(draw, deps = []) {
  const canvasRef = useRef(null);
  const drawRef = useRef(draw);
  useLayoutEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let last = performance.now();
    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, MAX_FRAME_DT);
      last = now;
      drawRef.current(ctx, { width, height, dt, t: now / 1000 });
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}
