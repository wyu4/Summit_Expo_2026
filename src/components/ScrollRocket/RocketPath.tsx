import { useEffect, useRef } from "react";
import gsap from "gsap";
import "./RocketPath.css";
import { RocketGate } from "./RocketGate";

export interface Waypoint {
  x: number;
  y: number;
  cpx?: number;
  cpy?: number;
}
export interface SavedPath {
  refW: number;
  refH: number;
  points: Waypoint[];
}

const PATH: SavedPath = {
  refW: 1422,
  refH: 7012,
  points: [
    { x: 937, y: 4229 },
    { x: 1282, y: 4233 },
    { x: 1277, y: 4352 },
    { x: 739, y: 4351 },
    { x: 759, y: 4643 },
    { x: 1266, y: 4655 },
    { x: 1320, y: 4996 },
    { x: 395, y: 5012 },
    { x: 336, y: 5244 },
    { x: 919, y: 5279 },
    { x: 915, y: 5488 },
    { x: 180, y: 5482 },
    { x: 200, y: 5720 },
    { x: 1413, y: 5709 },
  ],
};

function scalePoints(): Waypoint[] {
  const sx = window.innerWidth / PATH.refW;
  const sy = document.documentElement.scrollHeight / PATH.refH;
  return PATH.points.map((p) => ({
    x: p.x * sx,
    y: p.y * sy,
    ...(p.cpx != null ? { cpx: p.cpx * sx, cpy: p.cpy! * sy } : {}),
  }));
}

function buildHiddenPath(pts: Waypoint[]) {
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
      const c1x = p1.cpx ?? p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.cpy ?? p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.cpx ?? p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.cpy ?? p2.y - (p3.y - p1.y) / 6;
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
  const N = 4000;
  const raw: { scrollY: number; rawP: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const pt = el.getPointAtLength(t * len);
    raw.push({ scrollY: pt.y - vh / 2, rawP: t });
  }

  const totalScroll = raw[raw.length - 1].scrollY - raw[0].scrollY;
  if (totalScroll <= 0)
    return raw.map((r) => ({ scrollY: r.scrollY, progress: r.rawP }));

  const avgRate = 1 / totalScroll;
  const MAX_RATE = avgRate * 3.5;

  const out: LutEntry[] = [{ scrollY: raw[0].scrollY, progress: 0 }];
  let remappedP = 0;

  for (let i = 1; i < raw.length; i++) {
    const dScroll = raw[i].scrollY - raw[i - 1].scrollY;
    const dRawP = raw[i].rawP - raw[i - 1].rawP;
    if (dScroll <= 0) continue;
    const rate = dRawP / dScroll;
    const clampedRate = Math.min(rate, MAX_RATE);
    remappedP += clampedRate * dScroll;
    out.push({ scrollY: raw[i].scrollY, progress: remappedP });
  }

  const maxP = out[out.length - 1].progress || 1;
  return out.map((e) => ({ scrollY: e.scrollY, progress: e.progress / maxP }));
}

function lutLookup(lut: LutEntry[], scrollY: number): number {
  if (!lut.length) return 0;
  if (scrollY <= lut[0].scrollY) return 0;
  if (scrollY >= lut[lut.length - 1].scrollY) return 1;
  let lo = 0,
    hi = lut.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lut[mid].scrollY <= scrollY) lo = mid;
    else hi = mid;
  }
  const a = lut[lo],
    b = lut[hi];
  const frac = (scrollY - a.scrollY) / (b.scrollY - a.scrollY || 1);
  return a.progress + frac * (b.progress - a.progress);
}

interface Props {
  rocketSrc?: string;
}

export function RocketPath({ rocketSrc = "/rocket.png" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLImageElement>(null);
  const fireRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const rocket = rocketRef.current;
    const fire = fireRef.current;
    if (!wrap || !rocket || !fire) return;

    //  Fire canvas — cartoon style 
    const fctx = fire.getContext("2d")!;
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
    let isScrolling = false;

    fire.width = 80;
    fire.height = 120;

    const CX = 40;
    const NOZZLE_Y = 56;

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

    const TIER_COLORS = [
      { fill: "#ff6a00", stroke: "#c93a00" },
      { fill: "#ffd200", stroke: "#e08a00" },
      { fill: "#ffffff", stroke: "#ffe680" },
    ];

    let fireRaf = 0;
    const drawFire = () => {
      fctx.clearRect(0, 0, fire.width, fire.height);

      if (isScrolling) {
        if (Math.random() < 0.85) spawnPuff(true);
        if (Math.random() < 0.5) spawnPuff(false);
      } else {
        if (Math.random() < 0.3) spawnPuff(false);
      }

      flames.sort((a, b) => a.tier - b.tier);
      flames = flames.filter((f) => f.life < f.max);

      for (const f of flames) {
        const p = f.life / f.max;
        const fade = isScrolling ? 1 - p * 0.85 : (1 - p * 0.9) * 0.55;
        const r = f.r * (1 - p * 0.45);
        const col = TIER_COLORS[f.tier];

        fctx.globalAlpha = fade;
        fctx.beginPath();
        fctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        fctx.fillStyle = col.fill;
        fctx.fill();
        fctx.lineWidth = f.tier === 0 ? 1.8 : 1.2;
        fctx.strokeStyle = col.stroke;
        fctx.stroke();
        fctx.globalAlpha = 1;

        f.x += f.vx;
        f.y += f.vy * (1 + p * 0.5);
        f.vx *= 0.96;
        f.life++;
      }

      // Fade mask so flames don't hard-clip at canvas edge
      const fadeH = fire.height * 0.35;
      const topFade = fctx.createLinearGradient(
        0,
        NOZZLE_Y + fadeH,
        0,
        fire.height,
      );
      topFade.addColorStop(0, "rgba(0,0,0,0)");
      topFade.addColorStop(1, "rgba(0,0,0,1)");
      fctx.globalCompositeOperation = "destination-out";
      fctx.fillStyle = topFade;
      fctx.fillRect(0, NOZZLE_Y, fire.width, fire.height - NOZZLE_Y);
      fctx.globalCompositeOperation = "source-over";

      fireRaf = requestAnimationFrame(drawFire);
    };
    drawFire();

    //  Path + LUT 
    let vh = window.innerHeight;
    let pts = scalePoints();
    let { el, len, remove } = buildHiddenPath(pts);
    let lut = buildLUT(el, len, vh);

    const rebuild = () => {
      remove();
      vh = window.innerHeight;
      pts = scalePoints();
      ({ el, len, remove } = buildHiddenPath(pts));
      lut = buildLUT(el, len, vh);
    };
    window.addEventListener("resize", rebuild);

    //  Smooth progress 
    const state = { p: 0 };
    let tween: gsap.core.Tween | null = null;
    let visible = false;
    let stopTimer: ReturnType<typeof setTimeout>;

    // Portal positions (doc coords, scaled)
    const entryX = () => pts[0].x;
    const entryY = () => pts[0].y;
    const exitX = () => pts[pts.length - 1].x;
    const exitY = () => pts[pts.length - 1].y;
    const VANISH_RADIUS = 80; // px — effect starts within this distance

    let posRaf = 0;
    const renderLoop = () => {
      if (visible && len > 0) {
        const t = Math.max(0, Math.min(1, state.p));
        const pt = el.getPointAtLength(t * len);
        const ptA = el.getPointAtLength(Math.max(0, t - 0.005) * len);
        const ptB = el.getPointAtLength(Math.min(1, t + 0.005) * len);
        const angle =
          Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);

        wrap.style.left = `${pt.x}px`;
        wrap.style.top = `${pt.y - window.scrollY}px`;

        // Distance to each portal
        const distExit = Math.hypot(pt.x - exitX(), pt.y - exitY());
        const distEntry = Math.hypot(pt.x - entryX(), pt.y - entryY());

        if (distExit < VANISH_RADIUS) {
          // Approaching exit — shrink + fade INTO portal
          const p = 1 - distExit / VANISH_RADIUS;
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg) scale(${1 - p * 0.95})`;
          wrap.style.opacity = String(1 - p * p);
        } else if (distEntry < VANISH_RADIUS) {
          // Near entry — grow + fade OUT of portal
          const p = 1 - distEntry / VANISH_RADIUS;
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg) scale(${1 - p * 0.95})`;
          wrap.style.opacity = String(1 - p * p);
        } else {
          wrap.style.transform = `translate(-50%,-50%) rotate(${angle + 90}deg)`;
          wrap.style.opacity = "1";
        }
      }
      posRaf = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const onScroll = () => {
      if (!len || !lut.length) return;

      const sy = window.scrollY;
      const firstDoc = lut[0].scrollY;
      const lastDoc = lut[lut.length - 1].scrollY;

      if (sy < firstDoc - 50 || sy > lastDoc + 50) {
        if (visible) {
          wrap.style.opacity = "0";
          visible = false;
        }
        isScrolling = false;
        return;
      }

      if (!visible) {
        wrap.style.opacity = "1";
        visible = true;
      }
      isScrolling = true;

      const targetP = lutLookup(lut, sy);

      tween?.kill();
      tween = gsap.to(state, {
        p: targetP,
        duration: 0.18,
        ease: "none",
        overwrite: true,
      });

      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    wrap.style.opacity = "0";
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(fireRaf);
      cancelAnimationFrame(posRaf);
      clearTimeout(stopTimer);
      tween?.kill();
      remove();
      window.removeEventListener("resize", rebuild);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      {/* Entry portal — rocket grows out of this (first waypoint) */}
      <RocketGate
        path={PATH}
        pointIndex={0}
        gateSrc="/gate.png"
        size={130}
        offsetX={0}
        offsetY={0}
      />
      {/* Exit portal — rocket shrinks into this (last waypoint) */}
      <RocketGate
        path={PATH}
        pointIndex={-1}
        gateSrc="/gate.png"
        size={130}
        offsetX={0}
        offsetY={0}
      />
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
    </>
  );
}
