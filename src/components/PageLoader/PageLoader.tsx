import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./PageLoader.css";
import { useVisibleCanvas } from "../../utils/useVisibleCanvas";

interface Props {
  onComplete?: () => void;
  onDone?: () => void;
}

function usePageLoaderCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  // 30fps is plenty for a loader — was 60fps, halves main thread time
  useVisibleCanvas(
    canvasRef,
    (canvas) => {
      interface S {
        x: number;
        y: number;
        r: number;
        vx: number;
        vy: number;
        op: number;
        ph: number;
        sp: number;
        hue: number;
      }
      let stars: S[] = [],
        t = 0;

      const seed = () => {
        const W = canvas.offsetWidth,
          H = canvas.offsetHeight;
        stars = Array.from({ length: 120 }, () => {
          const a = Math.random() * Math.PI * 2,
            s = 0.004 + Math.random() * 0.014;
          return {
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.3 + 0.15,
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s,
            op: Math.random() * 0.65 + 0.2,
            ph: Math.random() * Math.PI * 2,
            sp: Math.random() * 0.8 + 0.3,
            hue: 200 + Math.random() * 120,
          };
        });
      };
      seed();

      return (
        _c: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        dt: number,
      ) => {
        t += (dt / 1000) * 60 * 0.012;
        const W = _c.offsetWidth,
          H = _c.offsetHeight;
        ctx.clearRect(0, 0, W, H);
        for (const s of stars) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < -2) s.x = W + 2;
          if (s.x > W + 2) s.x = -2;
          if (s.y < -2) s.y = H + 2;
          if (s.y > H + 2) s.y = -2;
          const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph),
            al = s.op * (0.3 + 0.7 * tw);
          // Skip halo on small stars to reduce draw calls
          if (s.r > 0.8 && al > 0.5) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},60%,70%,${al * 0.06})`;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},50%,92%,${al})`;
          ctx.fill();
          if (al > 0.7 && s.r > 1.0) {
            const sp = s.r * 5 * al;
            ctx.strokeStyle = `hsla(${s.hue},55%,85%,${al * 0.28})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(s.x - sp, s.y);
            ctx.lineTo(s.x + sp, s.y);
            ctx.moveTo(s.x, s.y - sp);
            ctx.lineTo(s.x, s.y + sp);
            ctx.stroke();
          }
        }
      };
    },
    { fps: 30 },
  ); // was 60
}

export function PageLoader({ onComplete, onDone }: Props) {
  const done = onComplete ?? onDone ?? (() => {});
  const loaderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(0);
  const dismissed = useRef(false);

  usePageLoaderCanvas(canvasRef);

  useEffect(() => {
    const obj = { v: 0 };
    // Faster progress: 2.2s instead of 3.2s — users don't want to wait
    const tween = gsap.to(obj, {
      v: 100,
      duration: 2.2,
      ease: "power2.inOut",
      onUpdate() {
        setPct(Math.round(obj.v));
      },
      onComplete() {
        setTimeout(() => {
          if (dismissed.current) return;
          dismissed.current = true;
          gsap.to(loaderRef.current, {
            yPercent: -100,
            duration: 0.7, // was 0.85
            ease: "power4.inOut",
            onComplete: done,
          });
        }, 200); // was 380ms
      },
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div ref={loaderRef} className="pl">
      <canvas ref={canvasRef} className="pl__canvas" aria-hidden="true" />

      <div className="pl__glow pl__glow--a" aria-hidden="true" />
      <div className="pl__glow pl__glow--b" aria-hidden="true" />
      <div className="pl__glow pl__glow--c" aria-hidden="true" />

      <div className="pl__content">
        <div className="pl__orrery" aria-hidden="true">
          <div className="pl__sun">
            <div className="pl__sun-core" />
            <div className="pl__sun-corona" />
          </div>
          <div className="pl__orbit pl__orbit--1">
            <div className="pl__planet pl__planet--1" />
          </div>
          <div className="pl__orbit pl__orbit--2">
            <div className="pl__planet pl__planet--2">
              <div className="pl__ring" />
            </div>
          </div>
          <div className="pl__orbit pl__orbit--3">
            <div className="pl__planet pl__planet--3" />
          </div>
        </div>

        <p className="pl__loading-label">Website is Loading</p>

        <div className="pl__bar-wrap" aria-label={`Loading ${pct}%`}>
          <div className="pl__bar-track">
            <div className="pl__bar-fill" style={{ width: `${pct}%` }} />
            <div className="pl__bar-glint" style={{ left: `${pct}%` }} />
          </div>
          <span className="pl__bar-pct">{String(pct).padStart(3, "0")}%</span>
        </div>

        <p className="pl__status">
          {pct < 30
            ? "INITIALISING SYSTEMS…"
            : pct < 60
              ? "LOADING ASSETS…"
              : pct < 90
                ? "PREPARING LAUNCH SEQUENCE…"
                : "T-MINUS ZERO"}
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
