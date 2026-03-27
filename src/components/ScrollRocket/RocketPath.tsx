import { useEffect, useRef, useState } from "react";
import "./RocketPath.css";

export interface AnchoredWaypoint {
  selector: string;
  xPct: number;
  yPct: number;
}

interface ResolvedPt {
  x: number;
  y: number;
}

// BREAKPOINT PATH SYSTEM
//
// Each entry: { maxWidth: number; path: AnchoredWaypoint[] }
//
// HOW SELECTION WORKS
// The array is scanned top-to-bottom. The first entry whose
// maxWidth >= window.innerWidth wins. So sort entries ascending by
// maxWidth, and end with maxWidth: Infinity as the default / widest path.
//
// ADDING A NEW BREAKPOINT — only two steps:
// 1. Define a new path constant (copy PATH_NARROW as a template).
// 2. Insert { maxWidth: <px>, path: YOUR_PATH } in the right
//    ascending position inside BREAKPOINT_PATHS.
// Nothing else needs to change.
//
// EXAMPLE TABLE (three paths):
//   { maxWidth: 600,      path: PATH_MOBILE  }   ← ≤ 600 px
//   { maxWidth: 900,      path: PATH_NARROW  }   ← 601 – 900 px
//   { maxWidth: Infinity, path: PATH_WIDE    }   ← > 900 px  (default)

// Narrow Path Ex:
// Tighter horizontal range so the rocket stays inside the single-column
// layout and never clips the viewport edges.

// const PATH_NARROW: AnchoredWaypoint[] = [
//   { selector: "#about", xPct: 0.8, yPct: 0.05 },
//   { selector: "#about", xPct: 0.55, yPct: 0.1 },
//   { selector: "#about", xPct: 0.5, yPct: 0.17 },
//   { selector: "#about", xPct: 0.52, yPct: 0.25 },
//   { selector: "#about", xPct: 0.78, yPct: 0.27 },
//   { selector: "#about", xPct: 0.7, yPct: 0.36 },
//   { selector: "#about", xPct: 0.36, yPct: 0.38 },
//   { selector: "#about", xPct: 0.22, yPct: 0.4 },
//   { selector: "#about", xPct: 0.25, yPct: 0.47 },
//   { selector: "#about", xPct: 0.62, yPct: 0.49 },
//   { selector: "#about", xPct: 0.72, yPct: 0.55 },
//   { selector: "#about", xPct: 0.82, yPct: 0.57 },
//   { selector: "#about", xPct: 0.8, yPct: 0.64 },
//   { selector: "#about", xPct: 0.5, yPct: 0.61 },
//   { selector: "#about", xPct: 0.18, yPct: 0.66 },
// ];

const PATH_NARROW: AnchoredWaypoint[] = [
  { selector: "#about", xPct: 0.9254, yPct: 0.0657 },
  { selector: "#about", xPct: 0.7404, yPct: 0.0777 },
  { selector: "#about", xPct: 0.9674, yPct: 0.1921 },
  { selector: "#about", xPct: 0.8767, yPct: 0.3605 },
  { selector: "#about", xPct: 0.6937, yPct: 0.4076 },
  { selector: "#about", xPct: 0.1263, yPct: 0.4124 },
  { selector: "#about", xPct: 0.0282, yPct: 0.446 },
  { selector: "#about", xPct: 0.2202, yPct: 0.4892 },
  { selector: "#about", xPct: 0.8318, yPct: 0.4931 },
  { selector: "#about", xPct: 0.9508, yPct: 0.5473 },
  { selector: "#about", xPct: 0.9255, yPct: 0.6282 },
  { selector: "#about", xPct: 0.5099, yPct: 0.6513 },
  { selector: "#about", xPct: 0.0823, yPct: 0.6612 },
];
// Path: wide / default  (> 900 px)
const PATH_WIDE: AnchoredWaypoint[] = [
  { selector: "#about", xPct: 0.9423, yPct: 0.0796 },
  { selector: "#about", xPct: 0.7121, yPct: 0.0801 },
  { selector: "#about", xPct: 0.5329, yPct: 0.1378 },
  { selector: "#about", xPct: 0.534, yPct: 0.2414 },
  { selector: "#about", xPct: 0.9347, yPct: 0.2365 },
  { selector: "#about", xPct: 0.8662, yPct: 0.3531 },
  { selector: "#about", xPct: 0.3582, yPct: 0.3655 },
  { selector: "#about", xPct: 0.2111, yPct: 0.3743 },
  { selector: "#about", xPct: 0.2299, yPct: 0.4524 },
  { selector: "#about", xPct: 0.6421, yPct: 0.4669 },
  { selector: "#about", xPct: 0.7194, yPct: 0.5268 },
  { selector: "#about", xPct: 0.9188, yPct: 0.534 },
  { selector: "#about", xPct: 0.9255, yPct: 0.6282 },
  { selector: "#about", xPct: 0.5248, yPct: 0.5931 },
  { selector: "#about", xPct: 0.0606, yPct: 0.6402 },
];

// Breakpoint table
interface BreakpointPath {
  maxWidth: number; // inclusive upper bound (px). Use Infinity for the default.
  path: AnchoredWaypoint[];
}

const BREAKPOINT_PATHS: BreakpointPath[] = [
  // Sorted ascending. First match (maxWidth >= window.innerWidth) wins.
  { maxWidth: 900, path: PATH_NARROW },
  { maxWidth: Infinity, path: PATH_WIDE },
];

/** Returns the path whose maxWidth is the first value >= window.innerWidth. */
function getActivePath(): AnchoredWaypoint[] {
  const w = window.innerWidth;
  for (const bp of BREAKPOINT_PATHS) {
    if (w <= bp.maxWidth) return bp.path;
  }
  // Safety fallback — unreachable when table ends with Infinity
  return BREAKPOINT_PATHS[BREAKPOINT_PATHS.length - 1].path;
}

// Path geometry helpers — unchanged from original

function resolve(path: AnchoredWaypoint[]): ResolvedPt[] {
  return path.flatMap((a) => {
    const el = document.querySelector<HTMLElement>(a.selector);
    if (!el) return [];
    const r = el.getBoundingClientRect();
    return [
      {
        x: r.left + window.scrollX + r.width * a.xPct,
        y: r.top + window.scrollY + r.height * a.yPct,
      },
    ];
  });
}

function buildSVGPath(pts: ResolvedPt[]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText =
    "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;";
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  if (pts.length >= 2) {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    el.setAttribute("d", d);
  }
  svg.appendChild(el);
  document.body.appendChild(svg);
  return { el, len: el.getTotalLength(), remove: () => svg.remove() };
}

interface LutEntry {
  scrollY: number;
  progress: number;
}

function buildLUT(el: SVGPathElement, len: number, vh: number): LutEntry[] {
  const N = 1200;
  const raw: { scrollY: number; rawP: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const pt = el.getPointAtLength(t * len);
    raw.push({ scrollY: pt.y - vh / 2, rawP: t });
  }
  const total = raw[raw.length - 1].scrollY - raw[0].scrollY;
  if (total <= 0)
    return raw.map((r) => ({ scrollY: r.scrollY, progress: r.rawP }));
  const avgRate = 1 / total;
  const MAX = avgRate * 3.5;
  const out: LutEntry[] = [{ scrollY: raw[0].scrollY, progress: 0 }];
  let p = 0;
  for (let i = 1; i < raw.length; i++) {
    const ds = raw[i].scrollY - raw[i - 1].scrollY;
    const dp = raw[i].rawP - raw[i - 1].rawP;
    if (ds <= 0) continue;
    p += Math.min(dp / ds, MAX) * ds;
    out.push({ scrollY: raw[i].scrollY, progress: p });
  }
  const mx = out[out.length - 1].progress || 1;
  return out.map((e) => ({ scrollY: e.scrollY, progress: e.progress / mx }));
}

function lutLookup(lut: LutEntry[], sy: number): number {
  if (!lut.length) return 0;
  if (sy <= lut[0].scrollY) return 0;
  if (sy >= lut[lut.length - 1].scrollY) return 1;
  let lo = 0,
    hi = lut.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lut[mid].scrollY <= sy) lo = mid;
    else hi = mid;
  }
  const a = lut[lo],
    b = lut[hi];
  return (
    a.progress +
    ((sy - a.scrollY) / (b.scrollY - a.scrollY || 1)) *
      (b.progress - a.progress)
  );
}

interface BakedPt {
  x: number;
  y: number;
  angle: number;
}

function bakePath(el: SVGPathElement, len: number, n = 2000): BakedPt[] {
  const baked: BakedPt[] = new Array(n + 1);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const pt = el.getPointAtLength(t * len);
    const t2 = Math.min(1, t + 0.003);
    const pb = el.getPointAtLength(t2 * len);
    const ta = el.getPointAtLength(Math.max(0, t - 0.003) * len);
    const dx = t2 < 1 ? pb.x - pt.x : pt.x - ta.x;
    const dy = t2 < 1 ? pb.y - pt.y : pt.y - ta.y;
    baked[i] = {
      x: pt.x,
      y: pt.y,
      angle: Math.atan2(dy, dx) * (180 / Math.PI),
    };
  }
  return baked;
}

function bakedLookup(baked: BakedPt[], progress: number): BakedPt {
  const n = baked.length - 1;
  const raw = Math.max(0, Math.min(1, progress)) * n;
  const lo = Math.floor(raw);
  const hi = Math.min(lo + 1, n);
  const f = raw - lo;
  const a = baked[lo],
    b = baked[hi];
  const w = ((b.angle - a.angle + 180 + 360) % 360) - 180;
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    angle: a.angle + w * f,
  };
}

// Fire canvas

function useVisibleFire(
  fireRef: React.RefObject<HTMLCanvasElement | null>,
  wrapRef: React.RefObject<HTMLDivElement | null>,
  isScrollingRef: React.MutableRefObject<boolean>,
) {
  useEffect(() => {
    const canvas = fireRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 80;
    canvas.height = 120;
    const CX = 40,
      NOZZLE_Y = 56;
    interface Flame {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      r: number;
      tier: number;
    }
    let flames: Flame[] = [];
    let raf = 0,
      running = false,
      lastT = 0;
    const FPS_MS = 1000 / 30;
    const TIER_COLORS = [
      { fill: "#ff6a00", stroke: "#c93a00" },
      { fill: "#ffd200", stroke: "#e08a00" },
      { fill: "#ffffff", stroke: "#ffe680" },
    ];
    const spawnPuff = (big: boolean) => {
      const ox = CX + (Math.random() - 0.5) * (big ? 10 : 5);
      const oy = NOZZLE_Y + Math.random() * 3;
      const vy = (big ? 2.8 : 1.8) + Math.random() * 1.5;
      const vx = (Math.random() - 0.5) * (big ? 1.8 : 0.8);
      const max = (big ? 16 : 10) + Math.random() * 6;
      flames.push({
        x: ox,
        y: oy,
        vx,
        vy,
        life: 0,
        max,
        r: big ? 11 : 7,
        tier: 0,
      });
      flames.push({
        x: ox,
        y: oy,
        vx: vx * 0.8,
        vy: vy * 1.05,
        life: 0,
        max: max * 0.8,
        r: big ? 7 : 4.5,
        tier: 1,
      });
      flames.push({
        x: ox,
        y: oy,
        vx: vx * 0.5,
        vy: vy * 1.1,
        life: 0,
        max: max * 0.6,
        r: big ? 4 : 2.5,
        tier: 2,
      });
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastT < FPS_MS) return;
      lastT = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scrolling = isScrollingRef.current;
      if (scrolling) {
        if (Math.random() < 0.85) spawnPuff(true);
        if (Math.random() < 0.5) spawnPuff(false);
      } else {
        if (Math.random() < 0.3) spawnPuff(false);
      }
      flames.sort((a, b) => a.tier - b.tier);
      flames = flames.filter((f) => f.life < f.max);
      for (const f of flames) {
        const p = f.life / f.max;
        const fade = scrolling ? 1 - p * 0.85 : (1 - p * 0.9) * 0.55;
        const r = f.r * (1 - p * 0.45);
        const col = TIER_COLORS[f.tier];
        ctx.globalAlpha = fade;
        ctx.beginPath();
        ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col.fill;
        ctx.fill();
        ctx.lineWidth = f.tier === 0 ? 1.8 : 1.2;
        ctx.strokeStyle = col.stroke;
        ctx.stroke();
        ctx.globalAlpha = 1;
        f.x += f.vx;
        f.y += f.vy * (1 + p * 0.5);
        f.vx *= 0.96;
        f.life++;
      }
      const topFade = ctx.createLinearGradient(
        0,
        NOZZLE_Y + canvas.height * 0.35,
        0,
        canvas.height,
      );
      topFade.addColorStop(0, "rgba(0,0,0,0)");
      topFade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = topFade;
      ctx.fillRect(0, NOZZLE_Y, canvas.width, canvas.height - NOZZLE_Y);
      ctx.globalCompositeOperation = "source-over";
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
    };
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "300px 0px 300px 0px", threshold: 0 },
    );
    observer.observe(wrap);
    return () => {
      stop();
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

interface Props {
  rocketSrc?: string;
}

export function RocketPath({ rocketSrc = "/rocket.png" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLImageElement>(null);
  const fireRef = useRef<HTMLCanvasElement>(null);
  const isScrollingRef = useRef(false);
  const [show, setShow] = useState(true);

  useVisibleFire(fireRef, wrapRef, isScrollingRef);

  useEffect(() => {
    const check = () => setShow(window.innerWidth > 500);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    let vh = window.innerHeight;

    let activePath = getActivePath();
    let pts = resolve(activePath);
    let built = buildSVGPath(pts);
    let lut: LutEntry[] = [];
    let baked: BakedPt[] = [];
    let ready = false;

    requestIdleCallback(
      () => {
        lut = buildLUT(built.el, built.len, vh);
        baked = bakePath(built.el, built.len);
        ready = true;
      },
      { timeout: 2000 },
    );

    let rebuildTimer: ReturnType<typeof setTimeout>;

    const rebuild = () => {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => {
        built.remove();
        vh = window.innerHeight;
        // Re-run selection — picks a different path array if a breakpoint
        // boundary was crossed, or just re-resolves pixel coords otherwise.
        activePath = getActivePath();
        pts = resolve(activePath);
        built = buildSVGPath(pts);
        lut = buildLUT(built.el, built.len, vh);
        baked = bakePath(built.el, built.len);
      }, 300);
    };

    window.addEventListener("resize", rebuild);

    const ENTRY_THRESHOLD = 0.04;
    const EXIT_START = 0.975;

    let targetP = 0;
    let smoothP = 0;
    const LERP_NORMAL = 0.07;
    const LERP_EXIT = 0.04;
    let posRaf = 0;
    let visible = false;
    let exiting = false;

    const hide = () => {
      visible = false;
      exiting = false;
      wrap.style.visibility = "hidden";
      wrap.style.opacity = "0";
      wrap.style.transform = "translate(-50%,-50%)";
    };

    const renderLoop = () => {
      if (visible && !exiting) {
        const lerp = smoothP >= EXIT_START ? LERP_EXIT : LERP_NORMAL;
        smoothP += (targetP - smoothP) * lerp;
        if (Math.abs(targetP - smoothP) < 0.00005) smoothP = targetP;

        const pt = bakedLookup(baked, smoothP);
        const angle = pt.angle;
        // console.log(angle);

        wrap.style.left = `${pt.x}px`;
        wrap.style.top = `${pt.y - window.scrollY}px`;

        if (smoothP <= ENTRY_THRESHOLD) {
          const p = 1 - smoothP / ENTRY_THRESHOLD;
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg) scale(${Math.max(0, 1 - p)})`;
          wrap.style.opacity = String(Math.max(0, 1 - p * p));
          wrap.style.visibility = "visible";
        } else if (smoothP >= EXIT_START) {
          const p = (smoothP - EXIT_START) / (1 - EXIT_START);
          const scale = Math.max(0, 1 - p);
          const alpha = Math.max(0, 1 - p * p);
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg) scale(${scale})`;
          wrap.style.opacity = String(alpha);
          wrap.style.visibility = scale < 0.02 ? "hidden" : "visible";
          if (scale < 0.02) hide();
        } else {
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg)`;
          wrap.style.opacity = "1";
          wrap.style.visibility = "visible";
        }
      }
      posRaf = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    let stopTimer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      if (!ready || !built.len || !lut.length) return;
      const sy = window.scrollY;
      const firstDoc = lut[0].scrollY;

      if (sy < firstDoc - 50) {
        hide();
        isScrollingRef.current = false;
        return;
      }

      if (!visible) {
        visible = true;
        exiting = false;
        wrap.style.visibility = "visible";
        wrap.style.opacity = "0";
      }

      targetP = Math.min(lutLookup(lut, sy), 1);
      isScrollingRef.current = true;

      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);
    };

    wrap.style.opacity = "0";
    wrap.style.visibility = "hidden";
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(posRaf);
      clearTimeout(stopTimer);
      clearTimeout(rebuildTimer);
      built.remove();
      window.removeEventListener("resize", rebuild);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  if (!show) return null;

  return (
    <div ref={wrapRef} className="rocket-wrap" aria-hidden="true">
      <canvas ref={fireRef} className="rocket-fire" />
      <img
        ref={rocketRef}
        src={rocketSrc}
        alt=""
        className="rocket-img"
        draggable={false}
      />
    </div>
  );
}
