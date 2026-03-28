import { useEffect } from "react";

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
const MAX_DPR = 1; 
export interface CanvasOptions {
  fps?: number;
  margin?: number;
  highDpr?: boolean;
}

export function useVisibleCanvas(
  ref: React.RefObject<HTMLCanvasElement | null>,
  setup: SetupFn,
  options: CanvasOptions = {},
) {
  const { fps = 24, margin = MARGIN, highDpr = false } = options;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let lastT = 0;
    let drawFn: DrawFn | void;
    const interval = 1000 / fps;
    const dprCap = highDpr
      ? Math.min(window.devicePixelRatio || 1, 2)
      : MAX_DPR;

    const applySize = () => {
      const dpr = dprCap;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      const targetW = Math.round(w * dpr);
      const targetH = Math.round(h * dpr);
      if (canvas.width === targetW && canvas.height === targetH) return;
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    applySize();
    drawFn = setup(canvas, ctx);

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return; 
      const dt = now - lastT;
      if (dt < interval) return;
      const clampedDt = Math.min(dt, interval * 2);
      lastT = now - (dt % interval);
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

    const visObs = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: `${margin}px 0px ${margin}px 0px`, threshold: 0 },
    );
    visObs.observe(canvas);

    const resizeObs = new ResizeObserver(() => {
      applySize();
      if (drawFn === undefined) {
        drawFn = setup(canvas, ctx);
      }
    });
    resizeObs.observe(canvas);

    const onVisChange = () => {
      if (document.hidden) {
        stop();
      } else {
        // Re-check intersection before restarting
        const rect = canvas.getBoundingClientRect();
        const inView =
          rect.top < window.innerHeight + margin && rect.bottom > -margin;
        if (inView) start();
      }
    };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      stop();
      visObs.disconnect();
      resizeObs.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
