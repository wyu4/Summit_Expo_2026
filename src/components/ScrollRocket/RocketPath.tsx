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

const PATH: AnchoredWaypoint[] = [
  { selector: "#about", xPct: 0.6515, yPct: 0.0716 },
  { selector: "#about", xPct: 0.8879, yPct: 0.0803 },
  { selector: "#about", xPct: 0.8793, yPct: 0.1415 },
  { selector: "#about", xPct: 0.5329, yPct: 0.1378 },
  { selector: "#about", xPct: 0.5340, yPct: 0.2414 },
  { selector: "#about", xPct: 0.9347, yPct: 0.2365 },
  { selector: "#about", xPct: 0.8662, yPct: 0.3531 },
  { selector: "#about", xPct: 0.3582, yPct: 0.3655 },
  { selector: "#about", xPct: 0.2111, yPct: 0.3743 },
  { selector: "#about", xPct: 0.2299, yPct: 0.4524 },
  { selector: "#about", xPct: 0.6421, yPct: 0.4669 },
  { selector: "#about", xPct: 0.7194, yPct: 0.5268 },
  { selector: "#about", xPct: 0.9188, yPct: 0.5340 },
  { selector: "#about", xPct: 0.9255, yPct: 0.6282 },
  { selector: "#about", xPct: 0.5248, yPct: 0.5931 },
  { selector: "#about", xPct: 0.0021, yPct: 0.6465 },
];

function resolve(path: AnchoredWaypoint[]): ResolvedPt[] {
  return path.flatMap((a) => {
    const el = document.querySelector<HTMLElement>(a.selector);
    if (!el) return [];
    const r = el.getBoundingClientRect();
    return [{ x: r.left + window.scrollX + r.width * a.xPct, y: r.top + window.scrollY + r.height * a.yPct }];
  });
}

function buildSVGPath(pts: ResolvedPt[]) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;";
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

interface LutEntry { scrollY: number; progress: number; }

function buildLUT(el: SVGPathElement, len: number, vh: number): LutEntry[] {
  const N = 1200;
  const raw: { scrollY: number; rawP: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const pt = el.getPointAtLength(t * len);
    raw.push({ scrollY: pt.y - vh / 2, rawP: t });
  }
  const total = raw[raw.length - 1].scrollY - raw[0].scrollY;
  if (total <= 0) return raw.map((r) => ({ scrollY: r.scrollY, progress: r.rawP }));
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
  let lo = 0, hi = lut.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lut[mid].scrollY <= sy) lo = mid; else hi = mid;
  }
  const a = lut[lo], b = lut[hi];
  return a.progress + ((sy - a.scrollY) / (b.scrollY - a.scrollY || 1)) * (b.progress - a.progress);
}

interface BakedPt { x: number; y: number; angle: number; }

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
    baked[i] = { x: pt.x, y: pt.y, angle: Math.atan2(dy, dx) * (180 / Math.PI) };
  }
  return baked;
}

function bakedLookup(baked: BakedPt[], progress: number): BakedPt {
  const n = baked.length - 1;
  const raw = Math.max(0, Math.min(1, progress)) * n;
  const lo = Math.floor(raw);
  const hi = Math.min(lo + 1, n);
  const f = raw - lo;
  const a = baked[lo], b = baked[hi];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, angle: a.angle + (b.angle - a.angle) * f };
}

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
    canvas.width = 80; canvas.height = 120;
    const CX = 40, NOZZLE_Y = 56;
    interface Flame { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; tier: number; }
    let flames: Flame[] = [];
    let raf = 0, running = false, lastT = 0;
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
      flames.push({ x: ox, y: oy, vx, vy, life: 0, max, r: big ? 11 : 7, tier: 0 });
      flames.push({ x: ox, y: oy, vx: vx * 0.8, vy: vy * 1.05, life: 0, max: max * 0.8, r: big ? 7 : 4.5, tier: 1 });
      flames.push({ x: ox, y: oy, vx: vx * 0.5, vy: vy * 1.1, life: 0, max: max * 0.6, r: big ? 4 : 2.5, tier: 2 });
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - lastT < FPS_MS) return;
      lastT = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scrolling = isScrollingRef.current;
      if (scrolling) { if (Math.random() < 0.85) spawnPuff(true); if (Math.random() < 0.5) spawnPuff(false); }
      else { if (Math.random() < 0.3) spawnPuff(false); }
      flames.sort((a, b) => a.tier - b.tier);
      flames = flames.filter((f) => f.life < f.max);
      for (const f of flames) {
        const p = f.life / f.max;
        const fade = scrolling ? 1 - p * 0.85 : (1 - p * 0.9) * 0.55;
        const r = f.r * (1 - p * 0.45);
        const col = TIER_COLORS[f.tier];
        ctx.globalAlpha = fade;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        ctx.fillStyle = col.fill; ctx.fill();
        ctx.lineWidth = f.tier === 0 ? 1.8 : 1.2;
        ctx.strokeStyle = col.stroke; ctx.stroke();
        ctx.globalAlpha = 1;
        f.x += f.vx; f.y += f.vy * (1 + p * 0.5); f.vx *= 0.96; f.life++;
      }
      const topFade = ctx.createLinearGradient(0, NOZZLE_Y + canvas.height * 0.35, 0, canvas.height);
      topFade.addColorStop(0, "rgba(0,0,0,0)");
      topFade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = topFade;
      ctx.fillRect(0, NOZZLE_Y, canvas.width, canvas.height - NOZZLE_Y);
      ctx.globalCompositeOperation = "source-over";
    };
    const start = () => { if (running) return; running = true; raf = requestAnimationFrame(loop); };
    const stop = () => { if (!running) return; running = false; cancelAnimationFrame(raf); };
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "300px 0px 300px 0px", threshold: 0 },
    );
    observer.observe(wrap);
    return () => { stop(); observer.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

interface Props { rocketSrc?: string; }

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
    let pts = resolve(PATH);
    let built = buildSVGPath(pts);
    let lut = buildLUT(built.el, built.len, vh);
    let baked = bakePath(built.el, built.len);

    let rebuildTimer: ReturnType<typeof setTimeout>;
    const rebuild = () => {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(() => {
        built.remove();
        vh = window.innerHeight;
        pts = resolve(PATH);
        built = buildSVGPath(pts);
        lut = buildLUT(built.el, built.len, vh);
        baked = bakePath(built.el, built.len);
      }, 300);
    };
    window.addEventListener("resize", rebuild);

    // Exit begins at this progress value and completes at 1.0
    const ENTRY_THRESHOLD = 0.04;
    const EXIT_START = 0.92;

    let targetP = 0;
    let smoothP = 0;
    // Two lerp speeds: normal travel vs exit (slower = smoother fade)
    const LERP_NORMAL = 0.07;
    const LERP_EXIT = 0.04;
    let posRaf = 0;
    let visible = false;
    // When true, renderLoop skips writes — onScroll owns the styles
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

        wrap.style.left = `${pt.x}px`;
        wrap.style.top = `${pt.y - window.scrollY}px`;

        if (smoothP <= ENTRY_THRESHOLD) {
          // Fade + scale in at start
          const p = 1 - smoothP / ENTRY_THRESHOLD;
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg) scale(${Math.max(0, 1 - p)})`;
          wrap.style.opacity = String(Math.max(0, 1 - p * p));
          wrap.style.visibility = "visible";
        } else if (smoothP >= EXIT_START) {
          // Fade + scale out at end — driven by smoothP so lerp controls speed
          const p = (smoothP - EXIT_START) / (1 - EXIT_START); // 0→1
          const scale = Math.max(0, 1 - p);
          const alpha = Math.max(0, 1 - p * p);
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg) scale(${scale})`;
          wrap.style.opacity = String(alpha);
          wrap.style.visibility = scale < 0.02 ? "hidden" : "visible";
          // Once fully faded, latch hidden
          if (scale < 0.02) {
            hide();
          }
        } else {
          // Normal travel
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
      if (!built.len || !lut.length) return;
      const sy = window.scrollY;
      const firstDoc = lut[0].scrollY;

      // Before path starts — hide
      if (sy < firstDoc - 50) {
        hide();
        isScrollingRef.current = false;
        return;
      }

      // Show wrapper if not yet visible
      if (!visible) {
        visible = true;
        exiting = false;
        wrap.style.visibility = "visible";
        wrap.style.opacity = "0";
      }

      const raw = lutLookup(lut, sy);

      // Hand targetP to renderLoop — it handles both normal + exit fade
      // renderLoop uses EXIT_START threshold to switch behaviour
      targetP = Math.min(raw, 1);
      isScrollingRef.current = true;

      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => { isScrollingRef.current = false; }, 150);
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