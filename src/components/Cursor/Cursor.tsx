import { useEffect, useRef } from "react";
import "./Cursor.css";
import { useVisibleCanvas } from "../../utils/useVisibleCanvas";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  hue: number;
}

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef({ x: -200, y: -200 });
  const tgtRef = useRef({ x: -200, y: -200 });
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const lastPos = useRef({ x: -200, y: -200 });

  useEffect(() => {
    const dot = dotRef.current!;
    const ring = ringRef.current!;

    // Keep resize for the canvas dimensions (still needed for backdrop coordinate math)
    const resize = () => {
      const canvas = canvasRef.current!;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const onMove = (e: MouseEvent) => {
      tgtRef.current = { x: e.clientX, y: e.clientY };
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 8) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 1.2 + 0.2;
          particles.current.push({
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 0.3,
            life: 0,
            maxLife: Math.random() * 30 + 18,
            r: Math.random() * 2.0 + 0.4,
            hue: Math.random() < 0.55 ? 330 : Math.random() < 0.5 ? 275 : 205,
          });
        }
        lastPos.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onEnter = () => ring.classList.add("cursor-ring--hover");
    const onLeave = () => ring.classList.remove("cursor-ring--hover");
    const interactiveEls = document.querySelectorAll(
      'a, button, [role="button"]',
    );
    interactiveEls.forEach((el) => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });

    window.addEventListener("mousemove", onMove, { passive: true });

    // Dot/ring animation only — NO canvas draw here anymore
    const animLoop = () => {
      posRef.current.x += (tgtRef.current.x - posRef.current.x) * 0.18;
      posRef.current.y += (tgtRef.current.y - posRef.current.y) * 0.18;
      dot.style.transform = `translate(${tgtRef.current.x}px, ${tgtRef.current.y}px)`;
      ring.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      rafRef.current = requestAnimationFrame(animLoop);
    };
    rafRef.current = requestAnimationFrame(animLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      interactiveEls.forEach((el) => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    };
  }, []);

  useVisibleCanvas(
    canvasRef,
    () => {
      return (_canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, _canvas.offsetWidth, _canvas.offsetHeight);

        particles.current = particles.current.filter((p) => p.life < p.maxLife);
        if (particles.current.length > 80) {
          particles.current.splice(0, particles.current.length - 80);
        }

        for (const p of particles.current) {
          const t = p.life / p.maxLife;
          const al = (1 - t) * 0.7;
          const r = p.r * (1 - t * 0.5);

          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},85%,65%,${al * 0.08})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue},90%,78%,${al})`;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.045;
          p.life++;
        }
      };
    },
    { fps: 60 },
  );

  return (
    <>
      {/* Particle trail canvas — covers entire viewport */}
      <canvas ref={canvasRef} className="cursor-canvas" aria-hidden="true" />

      {/* Inner dot — snaps to cursor instantly */}
      <div ref={dotRef} className="cursor-dot" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M5 0.5L5.9 3.8L9.5 5L5.9 6.2L5 9.5L4.1 6.2L0.5 5L4.1 3.8Z"
            fill="#CE3072"
          />
        </svg>
      </div>

      {/* Outer ring — lags behind for feel */}
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
