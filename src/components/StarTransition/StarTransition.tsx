import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FIRST_WAYPOINT } from '../ScrollRocket/RocketPath';
import './StarTransition.css';

gsap.registerPlugin(ScrollTrigger);

const TAU = Math.PI * 2;

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  tx: number; ty: number;
  r: number; opacity: number;
  hue: number; settled: boolean; phase: number;
}

export function StarTransition() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const textRef     = useRef<HTMLDivElement>(null);
  const rocketRef   = useRef<HTMLDivElement>(null);
  const rafRef      = useRef(0);
  const clock       = useRef(0);
  const particles   = useRef<Particle[]>([]);
  const hasRun      = useRef(false);

  useEffect(() => {
    const section = sectionRef.current!;
    const canvas  = canvasRef.current!;
    const ctx     = canvas.getContext('2d')!;
    const text    = textRef.current!;
    const rocket  = rocketRef.current!;

    const resize = () => {
      canvas.width  = section.offsetWidth;
      canvas.height = section.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    gsap.set(text,   { opacity: 0 });
    gsap.set(rocket, { opacity: 0, scale: 0, xPercent: -50, yPercent: -50 });

    const spawnBurst = () => {
      const W = canvas.width, H = canvas.height;
      const CX = W * 0.5, CY = H * 0.5;
      particles.current = Array.from({ length: 200 }, () => {
        const angle = Math.random() * TAU;
        const spd   = Math.random() * 12 + 3;
        return {
          x: CX, y: CY,
          vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
          tx: W * 0.04 + Math.random() * W * 0.92,
          ty: H * 0.04 + Math.random() * H * 0.92,
          r:  Math.random() * 2 + 0.4,
          opacity: Math.random() * 0.6 + 0.25,
          hue: Math.random() < 0.45 ? 0 : Math.random() < 0.55 ? 330 : 275,
          settled: false,
          phase: Math.random() * TAU,
        };
      });
    };

    const loop = () => {
      clock.current += 0.013;
      const t = clock.current;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const p of particles.current) {
        if (!p.settled) {
          p.vx *= 0.86; p.vy *= 0.86;
          p.x  += (p.tx - p.x) * 0.042 + p.vx;
          p.y  += (p.ty - p.y) * 0.042 + p.vy;
          if (Math.hypot(p.tx - p.x, p.ty - p.y) < 1.2 && Math.abs(p.vx) < 0.06) p.settled = true;
        } else {
          p.x += Math.sin(t * 0.38 + p.phase) * 0.07;
          p.y += Math.cos(t * 0.32 + p.phase) * 0.06;
        }
        const tw = 0.55 + 0.45 * Math.sin(t * 0.7 + p.phase);
        const al = p.opacity * tw;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.5, 0, TAU);
        ctx.fillStyle = p.hue === 0 ? `rgba(255,255,255,${al * 0.07})` : `hsla(${p.hue},88%,68%,${al * 0.10})`;
        ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fillStyle = p.hue === 0 ? `rgba(255,255,255,${al})` : `hsla(${p.hue},92%,76%,${al})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const runSequence = () => {
      if (hasRun.current) return;
      hasRun.current = true;
      spawnBurst();

      const W  = canvas.width, H  = canvas.height;
      const CX = W * 0.5,     CY = H * 0.5;

      // Where is FIRST_WAYPOINT in viewport coords right now?
      // FIRST_WAYPOINT.x/y are viewport %, so:
      const targetVpX = (FIRST_WAYPOINT.x / 100) * window.innerWidth;
      const targetVpY = (FIRST_WAYPOINT.y / 100) * window.innerHeight;

      // Rocket is position:absolute inside section.
      // Section's top-left in viewport:
      const sRect = section.getBoundingClientRect();

      // Delta from rocket's starting point (section centre) to target viewport pos
      const toX = targetVpX - (sRect.left + CX);
      const toY = targetVpY - (sRect.top  + CY);

      const tl = gsap.timeline();

      // Rocket pops in
      tl.to(rocket, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, 0.1);

      // Text materialises
      const words = text.querySelectorAll<HTMLSpanElement>('.st-word');
      tl.set(words, { opacity: 0, y: 28, scale: 0.85 });
      tl.set(text,  { opacity: 1 });
      tl.to(words, { opacity: 1, y: 0, scale: 1, stagger: 0.09, duration: 0.65, ease: 'back.out(1.8)' }, 0.5);

      // Rocket flies to first waypoint, fades out
      tl.to(rocket, {
        x: toX,
        y: toY,
        scale: 0.7,
        opacity: 0,
        rotation: Math.atan2(toY, toX) * (180 / Math.PI) + 90,
        duration: 1.2,
        ease: 'power2.in',
      }, 1.5);
    };

    const resetSequence = () => {
      hasRun.current    = false;
      particles.current = [];
      gsap.killTweensOf([rocket, text]);
      gsap.set(rocket, { opacity: 0, scale: 0, x: 0, y: 0, rotation: 0 });
      gsap.set(text,   { opacity: 0 });
    };

    const st = ScrollTrigger.create({
      trigger: section,
      start:   'top 85%',
      onEnter:     runSequence,
      onLeaveBack: resetSequence,
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      st.kill();
    };
  }, []);

  const words = 'Where Dreamers Connect & Ideas Collide'.split(' ');

  return (
    <section ref={sectionRef} className="star-transition" id="star-transition">
      <canvas ref={canvasRef} className="st-canvas" aria-hidden="true" />

      <div className="st-glow st-glow--l" aria-hidden="true" />
      <div className="st-glow st-glow--r" aria-hidden="true" />

      <div ref={textRef} className="st-text">
        <span className="st-pip" aria-hidden="true">✦</span>
        {words.map((w, i) => (
          <span key={i} className="st-word st-text-inner">{w}</span>
        ))}
        <span className="st-pip" aria-hidden="true">✦</span>
      </div>

      {/* This rocket only exists during the launch animation, then vanishes */}
      <div ref={rocketRef} className="st-rocket" aria-hidden="true">
        <div className="st-rocket-flame">
          <div className="st-flame-outer" />
          <div className="st-flame-mid"   />
          <div className="st-flame-inner" />
        </div>
        <img src="/rocket.png" alt="" className="st-rocket-img" draggable={false} />
      </div>
    </section>
  );
}