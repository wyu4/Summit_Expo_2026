/**
 * RocketPath.tsx
 *
 * Single rocket. Draws a canvas trail behind it.
 * StarTransition flies its rocket to FIRST_WAYPOINT_VW then hides.
 * This component picks up from there.
 *
 * Waypoints: { x, y } = viewport %, scrollAt = 0–1 scroll progress.
 */

import { useEffect, useRef } from 'react';
import './RocketPath.css';

// Waypoints — paste from PathMapper 
interface Waypoint {
  x:        number; // viewport % (0=left, 100=right)
  y:        number; // viewport % (0=top,  100=bottom)
  scrollAt: number; // 0–1 page scroll progress
}

export const WAYPOINTS: Waypoint[] = [
  { scrollAt: 0.60, x: 85, y: 20 },
  { scrollAt: 0.65, x: 75, y: 50 },
  { scrollAt: 0.70, x: 88, y: 80 },
  { scrollAt: 0.75, x: 15, y: 70 },
  { scrollAt: 0.80, x: 10, y: 40 },
  { scrollAt: 0.85, x: 20, y: 20 },
  { scrollAt: 0.90, x: 80, y: 50 },
  { scrollAt: 0.95, x: 85, y: 85 },
  { scrollAt: 1.00, x: 50, y: 90 },
];

// Export first waypoint so StarTransition can fly to it
export const FIRST_WAYPOINT = WAYPOINTS.slice().sort((a, b) => a.scrollAt - b.scrollAt)[0];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function RocketPath() {
  const rocketRef  = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const angleRef   = useRef(0);
  // Trail: array of {x, y} in viewport px
  const trailRef   = useRef<{ x: number; y: number }[]>([]);
  const rafRef     = useRef(0);
  const posRef     = useRef({ x: 0, y: 0, visible: false });

  useEffect(() => {
    const rocket = rocketRef.current;
    const canvas = canvasRef.current;
    if (!rocket || !canvas) return;

    // Size canvas to viewport
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const wps = [...WAYPOINTS].sort((a, b) => a.scrollAt - b.scrollAt);

    // Update rocket position on scroll 
    const onScroll = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));

      if (progress < wps[0].scrollAt) {
        posRef.current.visible = false;
        rocket.style.opacity = '0';
        return;
      }

      posRef.current.visible = true;
      rocket.style.opacity = '1';

      // Find segment
      let i = wps.length - 2;
      for (let j = 0; j < wps.length - 1; j++) {
        if (progress >= wps[j].scrollAt && progress <= wps[j + 1].scrollAt) {
          i = j;
          break;
        }
      }

      const a = wps[i];
      const b = wps[Math.min(i + 1, wps.length - 1)];
      const segLen = b.scrollAt - a.scrollAt;
      const t = segLen > 0 ? (progress - a.scrollAt) / segLen : 0;
      const smooth = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      const x = lerp(a.x, b.x, smooth);
      const y = lerp(a.y, b.y, smooth);

      // Convert viewport % to px for trail
      const px = (x / 100) * window.innerWidth;
      const py = (y / 100) * window.innerHeight;
      posRef.current = { x: px, y: py, visible: true };

      // Rotation
      const targetAngle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI) + 90;
      let delta = targetAngle - angleRef.current;
      while (delta >  180) delta -= 360;
      while (delta < -180) delta += 360;
      angleRef.current += delta * 0.15;

      rocket.style.left      = `${x}%`;
      rocket.style.top       = `${y}%`;
      rocket.style.transform = `translate(-50%, -50%) rotate(${angleRef.current}deg)`;

      // Add to trail
      const trail = trailRef.current;
      const last  = trail[trail.length - 1];
      if (!last || Math.hypot(px - last.x, py - last.y) > 3) {
        trail.push({ x: px, y: py });
        // Keep trail length bounded
        if (trail.length > 400) trail.shift();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Canvas RAF loop — draw trail 
    const drawTrail = () => {
      rafRef.current = requestAnimationFrame(drawTrail);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const trail = trailRef.current;
      if (trail.length < 2 || !posRef.current.visible) return;

      // Draw trail as a series of line segments fading toward the tail
      for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1];
        const b = trail[i];
        const progress = i / trail.length; // 0 = oldest, 1 = newest

        // Fade: older = more transparent
        const alpha = progress * progress * 0.75;

        // Colour shifts from violet (old) to magenta (new)
        const r = Math.round(lerp(104, 206, progress));
        const g = Math.round(lerp(74,  48,  progress));
        const bv = Math.round(lerp(130, 114, progress));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgb(${r},${g},${bv})`;
        ctx.lineWidth   = lerp(0.5, 2.5, progress);
        ctx.lineCap     = 'round';
        ctx.shadowColor = `rgba(${r},${g},${bv},0.6)`;
        ctx.shadowBlur  = lerp(2, 8, progress);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      }
    };
    rafRef.current = requestAnimationFrame(drawTrail);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      {/* Trail canvas — fixed, full viewport */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          pointerEvents: 'none',
          zIndex: 49,
        }}
        aria-hidden="true"
      />

      {/* Rocket */}
      <div
        ref={rocketRef}
        className="rocket-fixed"
        aria-hidden="true"
        style={{ opacity: 0, position: 'fixed', zIndex: 52 }}
      >
        <div className="rocket-flame-wrap">
          <div className="rocket-flame-outer" />
          <div className="rocket-flame-mid"   />
          <div className="rocket-flame-inner" />
          <div className="rocket-flame-core"  />
        </div>
        <img
          src="/rocket.png"
          alt=""
          className="rocket-img-fixed"
          draggable={false}
        />
      </div>
    </>
  );
}