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

// How many px outside the viewport we still keep running
// 300 = canvas starts up just before it scrolls into view
const MARGIN = 300;

export function useVisibleCanvas(
  ref: React.RefObject<HTMLCanvasElement | null>,
  setup: SetupFn,
) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf     = 0;
    let running = false;
    let lastT   = 0;
    let drawFn: DrawFn | void;

    // Run setup once to get the per-frame draw function
    drawFn = setup(canvas, ctx);

    const loop = (now: number) => {
      const dt = now - lastT;
      lastT = now;
      if (drawFn) drawFn(canvas, ctx, dt);
      raf = requestAnimationFrame(loop);
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

    // IntersectionObserver with a root margin so we warm up early
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { rootMargin: `${MARGIN}px 0px ${MARGIN}px 0px`, threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      stop();
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}