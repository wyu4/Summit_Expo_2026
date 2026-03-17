import { useEffect } from 'react';

type DrawFn = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  deltaTime: number,
) => void;

type SetupFn = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
) => DrawFn | void;

const MARGIN = 300;
const MAX_DPR = 1.5;

export interface CanvasOptions {
  /** Target frames per second. Defaults to 60. Use 30–40 for background star fields. */
  fps?: number;
  /** Extra px outside viewport to keep running. Defaults to 300. */
  margin?: number;
}

export function useVisibleCanvas(
  ref: React.RefObject<HTMLCanvasElement | null>,
  setup: SetupFn,
  options: CanvasOptions = {},
) {
  const { fps = 60, margin = MARGIN } = options;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    // Skip on touch / reduced-motion devices for heavy background canvases
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf     = 0;
    let running = false;
    let lastT   = 0;
    let drawFn: DrawFn | void;
    const interval = 1000 / fps;

    // ── DPR-aware resize ───────────────────────────────────────────────────────
    const applySize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w   = canvas.offsetWidth;
      const h   = canvas.offsetHeight;
      // Only reallocate when the backing store actually needs to change
      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);
      if (canvas.width === targetW && canvas.height === targetH) return;
      canvas.width  = targetW;
      canvas.height = targetH;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    applySize();

    // ── Setup ─────────────────────────────────────────────────────────────────
    drawFn = setup(canvas, ctx);

    // ── FPS-throttled loop ────────────────────────────────────────────────────
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = now - lastT;
      if (dt < interval) return; // skip frame — haven't hit the target interval
      // Clamp dt so a tab that was hidden doesn't produce a huge spike
      const clampedDt = Math.min(dt, interval * 3);
      lastT = now - (dt % interval); // keep phase consistent
      if (drawFn) drawFn(canvas, ctx, clampedDt);
    };

    const start = () => {
      if (running) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };

    // ── Visibility observer ───────────────────────────────────────────────────
    const visObs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting ? start() : stop(),
      { rootMargin: `${margin}px 0px ${margin}px 0px`, threshold: 0 },
    );
    visObs.observe(canvas);

    // ── Resize observer ───────────────────────────────────────────────────────
    const resizeObs = new ResizeObserver(() => {
      applySize();
      // Re-run setup so the draw function can re-seed stars / rebuild grids
      // after the canvas dimensions change
      if (drawFn === undefined) {
        drawFn = setup(canvas, ctx);
      }
    });
    resizeObs.observe(canvas);

    // ── Page visibility (tab switch) ──────────────────────────────────────────
    const onVisChange = () => {
      if (document.hidden) stop();
      else if (canvas.getBoundingClientRect().top < window.innerHeight + margin) start();
    };
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      stop();
      visObs.disconnect();
      resizeObs.disconnect();
      document.removeEventListener('visibilitychange', onVisChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}