import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./PageLoader.css";

interface Props {
  onComplete?: () => void;
  onDone?: () => void;
}

export function PageLoader({ onComplete, onDone }: Props) {
  const done = onComplete ?? onDone ?? (() => {});
  const loaderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(0);
  const dismissed = useRef(false);

  // Star canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0,
      t = 0;

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
    let stars: S[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: 200 }, () => {
        const a = Math.random() * Math.PI * 2,
          s = 0.004 + Math.random() * 0.014;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
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
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      t += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < -2) s.x = canvas.width + 2;
        if (s.x > canvas.width + 2) s.x = -2;
        if (s.y < -2) s.y = canvas.height + 2;
        if (s.y > canvas.height + 2) s.y = -2;
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = s.op * (0.3 + 0.7 * tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},60%,70%,${al * 0.06})`;
        ctx.fill();
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
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Progress + auto-dismiss
  useEffect(() => {
    // Fill progress over ~3.2 seconds with a natural ease
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: 100,
      duration: 3.2,
      ease: "power1.inOut",
      onUpdate() {
        setPct(Math.round(obj.v));
      },
      onComplete() {
        // Small pause at 100% then wipe up
        setTimeout(() => {
          if (dismissed.current) return;
          dismissed.current = true;
          gsap.to(loaderRef.current, {
            yPercent: -100,
            duration: 0.85,
            ease: "power4.inOut",
            done,
          });
        }, 380);
      },
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div ref={loaderRef} className="pl">
      {/* Star canvas */}
      <canvas ref={canvasRef} className="pl__canvas" aria-hidden="true" />

      {/* Nebula glows */}
      <div className="pl__glow pl__glow--a" aria-hidden="true" />
      <div className="pl__glow pl__glow--b" aria-hidden="true" />
      <div className="pl__glow pl__glow--c" aria-hidden="true" />

      {/* Centre content */}
      <div className="pl__content">
        {/* Solar system orrery */}
        <div className="pl__orrery" aria-hidden="true">
          {/* Sun */}
          <div className="pl__sun">
            <div className="pl__sun-core" />
            <div className="pl__sun-corona" />
          </div>

          {/* Orbit 1 — small fast planet */}
          <div className="pl__orbit pl__orbit--1">
            <div className="pl__planet pl__planet--1" />
          </div>

          {/* Orbit 2 — medium planet with ring */}
          <div className="pl__orbit pl__orbit--2">
            <div className="pl__planet pl__planet--2">
              <div className="pl__ring" />
            </div>
          </div>

          {/* Orbit 3 — large slow planet */}
          <div className="pl__orbit pl__orbit--3">
            <div className="pl__planet pl__planet--3" />
          </div>
        </div>

        {/* Text */}
        <p className="pl__loading-label">Website is Loading</p>

        {/* Progress bar */}
        <div className="pl__bar-wrap" aria-label={`Loading ${pct}%`}>
          <div className="pl__bar-track">
            <div className="pl__bar-fill" style={{ width: `${pct}%` }} />
            {/* Moving glint on fill */}
            <div className="pl__bar-glint" style={{ left: `${pct}%` }} />
          </div>
          <span className="pl__bar-pct">{String(pct).padStart(3, "0")}%</span>
        </div>

        {/* Status line */}
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
