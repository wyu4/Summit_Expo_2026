/**
 * RocketPath — rocket always stays vertically centered in the viewport.
 *
 * How it works:
 *   1. Sample the path into 2000 points, recording (progress, docX, docY).
 *   2. Build a lookup table: for each sample, the "scroll position that would
 *      center this point" = sample.docY - vh/2.
 *   3. On scroll, binary-search the LUT for current scrollY → get progress.
 *   4. GSAP lerps the rendered progress for smoothness.
 *
 * Horizontal segments (same Y, different X) are handled correctly because
 * we search by the SCROLL VALUE that centers each point, not by path Y.
 * Consecutive points with same Y → same scroll trigger → rocket sweeps
 * sideways instantly at that scroll position (correct behaviour).
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './RocketPath.css';

export interface Waypoint  { x: number; y: number; cpx?: number; cpy?: number; }
export interface SavedPath { refW: number; refH: number; points: Waypoint[]; }

const PATH: SavedPath = {
  refW: 1422,
  refH: 7063,
  points: [
    { x: 1000, y: 4416 },
    { x: 1214, y: 4426 },
    { x: 1211, y: 4555 },
    { x: 771, y: 4581 },
    { x: 775, y: 4873 },
    { x: 1279, y: 4897 },
    { x: 1379, y: 5104 },
    { x: 1293, y: 5487 },
    { x: 715, y: 5521 },
    { x: 643, y: 5688 },
    { x: 197, y: 5716 },
    { x: 293, y: 5964 },
    { x: 1154, y: 5895 },
    { x: 1422, y: 6040 },
  ],
};

function scalePoints(): Waypoint[] {
  const sx = window.innerWidth  / PATH.refW;
  const sy = document.documentElement.scrollHeight / PATH.refH;
  return PATH.points.map(p => ({
    x: p.x * sx, y: p.y * sy,
    ...(p.cpx != null ? { cpx: p.cpx * sx, cpy: p.cpy! * sy } : {}),
  }));
}

function buildHiddenPath(pts: Waypoint[]) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;pointer-events:none;';
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  if (pts.length >= 2) {
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i-1,0)], p1 = pts[i],
            p2 = pts[i+1],             p3 = pts[Math.min(i+2,pts.length-1)];
      const c1x = p1.cpx ?? (p1.x + (p2.x - p0.x) / 6);
      const c1y = p1.cpy ?? (p1.y + (p2.y - p0.y) / 6);
      const c2x = p2.cpx ?? (p2.x - (p3.x - p1.x) / 6);
      const c2y = p2.cpy ?? (p2.y - (p3.y - p1.y) / 6);
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    el.setAttribute('d', d);
  }
  svg.appendChild(el);
  document.body.appendChild(svg);
  return { el, len: el.getTotalLength(), remove: () => svg.remove() };
}

// ── LUT: maps scrollY → path progress ──────────────────────────────
// Builds a table of { scrollY, progress } pairs.
// Then remaps progress so that no horizontal segment can advance it
// faster than MAX_RATE × average — prevents rocket rushing on flat segments.
interface LutEntry { scrollY: number; progress: number; }

function buildLUT(el: SVGPathElement, len: number, vh: number): LutEntry[] {
  const N = 4000;

  // Pass 1 — raw samples evenly spaced by arc-length
  const raw: { scrollY: number; rawP: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t  = i / N;
    const pt = el.getPointAtLength(t * len);
    raw.push({ scrollY: pt.y - vh / 2, rawP: t });
  }

  const totalScroll = raw[raw.length - 1].scrollY - raw[0].scrollY;
  if (totalScroll <= 0) return raw.map(r => ({ scrollY: r.scrollY, progress: r.rawP }));

  // Pass 2 — remap: clamp rate so fast horizontal sweeps are slowed down
  // avgRate = how much progress per scroll-px on average
  const avgRate  = 1 / totalScroll;
  const MAX_RATE = avgRate * 3.5; // allow up to 3.5× average, cap beyond that

  const out: LutEntry[] = [{ scrollY: raw[0].scrollY, progress: 0 }];
  let remappedP = 0;

  for (let i = 1; i < raw.length; i++) {
    const dScroll = raw[i].scrollY - raw[i - 1].scrollY;
    const dRawP   = raw[i].rawP   - raw[i - 1].rawP;
    if (dScroll <= 0) continue; // pure horizontal — skip, will interpolate over
    const rate        = dRawP / dScroll;
    const clampedRate = Math.min(rate, MAX_RATE);
    remappedP        += clampedRate * dScroll;
    out.push({ scrollY: raw[i].scrollY, progress: remappedP });
  }

  // Normalise to 0..1
  const maxP = out[out.length - 1].progress || 1;
  return out.map(e => ({ scrollY: e.scrollY, progress: e.progress / maxP }));
}

function lutLookup(lut: LutEntry[], scrollY: number): number {
  if (!lut.length) return 0;
  if (scrollY <= lut[0].scrollY)              return 0;
  if (scrollY >= lut[lut.length - 1].scrollY) return 1;
  let lo = 0, hi = lut.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (lut[mid].scrollY <= scrollY) lo = mid;
    else hi = mid;
  }
  const a = lut[lo], b = lut[hi];
  const frac = (scrollY - a.scrollY) / (b.scrollY - a.scrollY || 1);
  return a.progress + frac * (b.progress - a.progress);
}

interface Props { rocketSrc?: string; }

export function RocketPath({ rocketSrc = '/rocket.png' }: Props) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLImageElement>(null);
  const fireRef   = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const rocket = rocketRef.current;
    const fire   = fireRef.current;
    if (!wrap || !rocket || !fire) return;

    // ── Fire canvas — cartoon style ─────────────────────────────
    const fctx = fire.getContext('2d')!;
    interface Flame {
      x: number; y: number; vx: number; vy: number;
      life: number; max: number;
      r: number;       // base radius
      tier: number;    // 0=outer orange, 1=mid yellow, 2=inner white
    }
    let flames: Flame[] = [];
    let isScrolling = false;

    fire.width  = 80;
    fire.height = 120;

    const CX       = 40;
    const NOZZLE_Y = 56;

    // Cartoon flame = stacked blob clusters per "puff"
    // Each puff spawns 3 tiers at the same origin
    const spawnPuff = (big: boolean) => {
      const ox  = CX + (Math.random() - 0.5) * (big ? 10 : 5);
      const oy  = NOZZLE_Y + Math.random() * 3;
      const vy  = (big ? 2.8 : 1.8) + Math.random() * 1.5;
      const vx  = (Math.random() - 0.5) * (big ? 1.8 : 0.8);
      const max = (big ? 16 : 10) + Math.random() * 6;
      // outer blob (orange)
      flames.push({ x: ox, y: oy, vx, vy, life: 0, max, r: big ? 11 : 7,  tier: 0 });
      // mid blob (yellow) — slightly smaller, same origin
      flames.push({ x: ox, y: oy, vx: vx * 0.8, vy: vy * 1.05, life: 0, max: max * 0.8, r: big ? 7 : 4.5, tier: 1 });
      // core blob (white) — smallest
      flames.push({ x: ox, y: oy, vx: vx * 0.5, vy: vy * 1.10, life: 0, max: max * 0.6, r: big ? 4 : 2.5, tier: 2 });
    };

    const TIER_COLORS = [
      { fill: '#ff6a00', stroke: '#c93a00' }, // outer orange
      { fill: '#ffd200', stroke: '#e08a00' }, // mid yellow
      { fill: '#ffffff', stroke: '#ffe680' }, // core white
    ];

    let fireRaf = 0;
    const drawFire = () => {
      fctx.clearRect(0, 0, fire.width, fire.height);

      if (isScrolling) {
        if (Math.random() < 0.85) spawnPuff(true);
        if (Math.random() < 0.5)  spawnPuff(false);
      } else {
        // idle: tiny gentle flicker
        if (Math.random() < 0.3) spawnPuff(false);
      }

      // Sort by tier so outer blobs paint first (back to front)
      flames.sort((a, b) => a.tier - b.tier);
      flames = flames.filter(f => f.life < f.max);

      for (const f of flames) {
        const p    = f.life / f.max;
        const fade = isScrolling ? (1 - p * 0.85) : (1 - p * 0.9) * 0.55;
        const r    = f.r * (1 - p * 0.45);
        const col  = TIER_COLORS[f.tier];

        // Flat filled blob
        fctx.globalAlpha = fade;
        fctx.beginPath();
        fctx.arc(f.x, f.y, r, 0, Math.PI * 2);
        fctx.fillStyle = col.fill;
        fctx.fill();

        // Bold cartoon outline
        fctx.lineWidth   = f.tier === 0 ? 1.8 : 1.2;
        fctx.strokeStyle = col.stroke;
        fctx.stroke();

        fctx.globalAlpha = 1;

        f.x   += f.vx;
        f.y   += f.vy * (1 + p * 0.5);
        f.vx  *= 0.96;
        f.life++;
      }
      // Fade mask — gradient overlay that fades flames near canvas edges
      // so they never hard-clip
      const fadeH = fire.height * 0.35;
      const topFade = fctx.createLinearGradient(0, NOZZLE_Y + fadeH, 0, fire.height);
      topFade.addColorStop(0, 'rgba(0,0,0,0)');
      topFade.addColorStop(1, 'rgba(0,0,0,1)');
      fctx.globalCompositeOperation = 'destination-out';
      fctx.fillStyle = topFade;
      fctx.fillRect(0, NOZZLE_Y, fire.width, fire.height - NOZZLE_Y);
      fctx.globalCompositeOperation = 'source-over';

      fireRaf = requestAnimationFrame(drawFire);
    };
    drawFire();

    // ── Path + LUT ───────────────────────────────────────────────
    let vh  = window.innerHeight;
    let pts = scalePoints();
    let { el, len, remove } = buildHiddenPath(pts);
    let lut = buildLUT(el, len, vh);

    const rebuild = () => {
      remove();
      vh  = window.innerHeight;
      pts = scalePoints();
      ({ el, len, remove } = buildHiddenPath(pts));
      lut = buildLUT(el, len, vh);
    };
    window.addEventListener('resize', rebuild);

    // ── Smooth progress ──────────────────────────────────────────
    const state = { p: 0 };
    let tween: gsap.core.Tween | null = null;
    let visible = false;
    let stopTimer: ReturnType<typeof setTimeout>;

    // rAF render loop — always reads state.p
    let posRaf = 0;
    const renderLoop = () => {
      if (visible && len > 0) {
        const t   = Math.max(0, Math.min(1, state.p));
        const pt  = el.getPointAtLength(t * len);
        const ptA = el.getPointAtLength(Math.max(0, t - 0.005) * len);
        const ptB = el.getPointAtLength(Math.min(1, t + 0.005) * len);
        const angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * (180 / Math.PI);

        // pt.y is document coord → subtract scrollY for fixed positioning
        wrap.style.left      = `${pt.x}px`;
        wrap.style.top       = `${pt.y - window.scrollY}px`;
        wrap.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
      }
      posRaf = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const onScroll = () => {
      if (!len || !lut.length) return;

      const sy       = window.scrollY;
      const firstDoc = lut[0].scrollY;           // scroll that centers first point
      const lastDoc  = lut[lut.length-1].scrollY; // scroll that centers last point

      // Show when scrollY is within the range that keeps rocket on-screen
      if (sy < firstDoc - 50 || sy > lastDoc + 50) {
        if (visible) { wrap.style.opacity = '0'; visible = false; }
        isScrolling = false;
        return;
      }

      if (!visible) { wrap.style.opacity = '1'; visible = true; }
      isScrolling = true;

      // LUT lookup: find the progress that centers the rocket at vh/2
      const targetP = lutLookup(lut, sy);

      tween?.kill();
      tween = gsap.to(state, {
        p: targetP,
        duration: 0.18,      // short enough to track scroll, long enough to smooth
        ease: 'none',
        overwrite: true,
      });

      clearTimeout(stopTimer);
      stopTimer = setTimeout(() => { isScrolling = false; }, 150);
    };

    wrap.style.opacity = '0';
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(fireRaf);
      cancelAnimationFrame(posRaf);
      clearTimeout(stopTimer);
      tween?.kill();
      remove();
      window.removeEventListener('resize', rebuild);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

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