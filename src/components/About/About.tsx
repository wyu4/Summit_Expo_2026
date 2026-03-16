import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './About.css';
import { RocketPath } from '../ScrollRocket/RocketPath';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode, faBolt, faGears, faDna, faFlask, faMicroscope,
  faSquareRootVariable, faSatelliteDish, faHeartPulse, faInfinity,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

gsap.registerPlugin(ScrollTrigger);

const FIELDS: { icon: IconDefinition; label: string; desc: string }[] = [
  { icon: faCode,               label: 'Software',    desc: 'Apps, algorithms, AI' },
  { icon: faBolt,               label: 'Electronics', desc: 'Circuits & embedded systems' },
  { icon: faGears,              label: 'Mechanical',  desc: 'Robotics & mechanisms' },
  { icon: faDna,                label: 'Biology',     desc: 'Life sciences & genetics' },
  { icon: faFlask,              label: 'Chemistry',   desc: 'Synthesis & materials' },
  { icon: faMicroscope,         label: 'Research',    desc: 'Papers & discoveries' },
  { icon: faSquareRootVariable, label: 'Mathematics', desc: 'Proofs & prime discovery' },
  { icon: faSatelliteDish,      label: 'Astronomy',   desc: 'Comets & deep sky objects' },
  { icon: faHeartPulse,         label: 'Medicine',    desc: 'Diagnostics & biotech' },
  { icon: faInfinity,           label: '& Beyond',    desc: 'Plant-based steak? Yes.' },
];

const STATS = [
  { value: 'Free', label: 'Admission' },
  { value: '∞',    label: 'Fields of study' },
  { value: 'Live', label: 'Awards ceremony' },
  { value: 'All',  label: 'Schools welcome' },
];

//  Decorative star glyphs for the margins 
const MARGIN_GLYPHS = [
  { top: '8%',   left: '2%',   size: 28, rot: 15,  delay: 0 },
  { top: '18%',  right: '1.5%',size: 18, rot: -10, delay: 0.6 },
  { top: '32%',  left: '1%',   size: 38, rot: 30,  delay: 1.2 },
  { top: '45%',  right: '2%',  size: 22, rot: -25, delay: 0.3 },
  { top: '58%',  left: '3%',   size: 14, rot: 45,  delay: 1.8 },
  { top: '65%',  right: '1%',  size: 32, rot: 10,  delay: 0.9 },
  { top: '78%',  left: '1.5%', size: 20, rot: -40, delay: 1.5 },
  { top: '88%',  right: '2.5%',size: 16, rot: 20,  delay: 0.4 },
];

/* Master canvas — stars + shooting stars + nebula */
function useSpaceCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface Star {
      x: number; y: number; r: number;
      vx: number; vy: number;
      op: number; ph: number; sp: number;
      layer: number; hue: number;
    }
    interface Shooter {
      x: number; y: number;
      vx: number; vy: number;
      life: number; max: number;
      len: number; op: number;
    }
    interface NebulaPatch {
      x: number; y: number;
      rx: number; ry: number;
      hue: number; op: number;
      dop: number; drift: number; angle: number;
    }

    const LAYERS = [
      { count: 160, speedMult: 0.008, rMax: 0.6,  opMax: 0.45 },
      { count:  90, speedMult: 0.022, rMax: 1.0,  opMax: 0.65 },
      { count:  40, speedMult: 0.050, rMax: 1.5,  opMax: 0.90 },
    ];
    const PARALLAX = [0.03, 0.10, 0.24];

    let stars:    Star[]        = [];
    let shooters: Shooter[]     = [];
    let nebulae:  NebulaPatch[] = [];
    let raf = 0, t = 0;
    let scrollY = 0, lastScrollY = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;

      // Stars
      stars = [];
      LAYERS.forEach((cfg, li) => {
        for (let i = 0; i < cfg.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = cfg.speedMult * (0.5 + Math.random());
          stars.push({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * cfg.rMax + 0.15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            op: Math.random() * cfg.opMax + 0.15,
            ph: Math.random() * Math.PI * 2,
            sp: Math.random() * 1.2 + 0.3,
            layer: li,
            hue: 200 + Math.random() * 100,
          });
        }
      });

      // Nebula patches — large blobs that slowly morph opacity
      nebulae = [];
      const patches = [
        { x: 0.12, y: 0.15, hue: 320 }, { x: 0.88, y: 0.08, hue: 270 },
        { x: 0.05, y: 0.50, hue: 210 }, { x: 0.92, y: 0.55, hue: 290 },
        { x: 0.20, y: 0.80, hue: 340 }, { x: 0.80, y: 0.85, hue: 250 },
        { x: 0.50, y: 0.35, hue: 300 },
      ];
      for (const p of patches) {
        nebulae.push({
          x: p.x * W, y: p.y * H,
          rx: W * (0.15 + Math.random() * 0.12),
          ry: H * (0.08 + Math.random() * 0.06),
          hue: p.hue, op: Math.random() * 0.04 + 0.01,
          dop: (Math.random() * 0.0008 + 0.0002) * (Math.random() < 0.5 ? 1 : -1),
          drift: Math.random() * 0.12 + 0.04,
          angle: Math.random() * Math.PI * 2,
        });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Spawn a shooting star every 2–5 seconds
    const spawnShooter = () => {
      const W = canvas.width, H = canvas.height;
      const fromRight = Math.random() < 0.5;
      const angle = (Math.random() * 20 + 10) * (Math.PI / 180) * (fromRight ? 1 : -1) + Math.PI / 2;
      const speed = 8 + Math.random() * 10;
      shooters.push({
        x: fromRight ? W * (0.6 + Math.random() * 0.4) : W * (Math.random() * 0.4),
        y: -10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 45 + Math.random() * 30,
        len: 60 + Math.random() * 80,
        op: 0.7 + Math.random() * 0.3,
      });
    };

    let shooterTimer = 0;
    const SHOOTER_INTERVAL = 180 + Math.random() * 240; // frames

    const loop = () => {
      t += 0.012;
      const scrollDelta = (scrollY - lastScrollY) * 0.6;
      lastScrollY = scrollY;
      const W = canvas.width, H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      //  Nebula patches 
      for (const n of nebulae) {
        n.angle += n.drift * 0.002;
        n.op    += n.dop;
        if (n.op > 0.055) { n.op = 0.055; n.dop = -Math.abs(n.dop); }
        if (n.op < 0.008) { n.op = 0.008; n.dop =  Math.abs(n.dop); }

        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(n.angle);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
        g.addColorStop(0,   `hsla(${n.hue}, 70%, 55%, ${n.op})`);
        g.addColorStop(0.5, `hsla(${n.hue}, 60%, 45%, ${n.op * 0.5})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.scale(1, n.ry / n.rx);
        ctx.beginPath();
        ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      }

      //  Stars 
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy + scrollDelta * PARALLAX[s.layer];

        if (s.x < -2) s.x = W + 2; if (s.x > W + 2) s.x = -2;
        if (s.y < -2) s.y = H + 2; if (s.y > H + 2) s.y = -2;

        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = s.op * (0.35 + 0.65 * tw);

        // Coloured halo on mid/near layers
        if (s.layer >= 1) {
          const haloSize = s.r * (s.layer === 2 ? 5.5 : 3.5);
          ctx.beginPath();
          ctx.arc(s.x, s.y, haloSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},70%,80%,${al * (s.layer === 2 ? 0.12 : 0.06)})`;
          ctx.fill();
        }

        // Core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.layer === 2
          ? `hsla(${s.hue},60%,95%,${al})`
          : `rgba(220,220,255,${al})`;
        ctx.fill();

        // 4-point cross-spike on bright near-layer stars
        if (s.layer === 2 && al > 0.55) {
          const spike = s.r * 7 * al;
          ctx.strokeStyle = `hsla(${s.hue},60%,90%,${al * 0.45})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - spike, s.y); ctx.lineTo(s.x + spike, s.y);
          ctx.moveTo(s.x, s.y - spike); ctx.lineTo(s.x, s.y + spike);
          ctx.stroke();
          // diagonal mini-spikes
          const d = spike * 0.45;
          ctx.strokeStyle = `hsla(${s.hue},60%,90%,${al * 0.20})`;
          ctx.beginPath();
          ctx.moveTo(s.x - d, s.y - d); ctx.lineTo(s.x + d, s.y + d);
          ctx.moveTo(s.x + d, s.y - d); ctx.lineTo(s.x - d, s.y + d);
          ctx.stroke();
        }
      }

      //  Shooting stars 
      shooterTimer++;
      if (shooterTimer > SHOOTER_INTERVAL) { spawnShooter(); shooterTimer = 0; }

      shooters = shooters.filter(s => s.life < s.max);
      for (const s of shooters) {
        const prog  = s.life / s.max;
        const alpha = s.op * (1 - prog) * Math.min(1, s.life / 5);
        const tx    = s.x - s.vx * (s.len / Math.hypot(s.vx, s.vy));
        const ty    = s.y - s.vy * (s.len / Math.hypot(s.vx, s.vy));

        const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.6, `rgba(200,210,255,${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(255,255,255,${alpha})`);

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 * (1 - prog * 0.5);
        ctx.stroke();

        // Bright tip
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5 * (1 - prog * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();

        s.x += s.vx; s.y += s.vy; s.life++;
      }

      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [canvasRef]);
}

/* Constellation canvas with pulsing lines */
function useConstellations(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface CStar {
      x: number; y: number; vx: number; vy: number;
      ph: number; sp: number; r: number; brightness: number;
    }
    let stars: CStar[] = [];
    let raf = 0, t = 0;
    const MAX_DIST = 120;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars = [];
      const W = canvas.width, H = canvas.height;
      const marginW = Math.max(60, (W - 1280) / 2);
      const total   = Math.floor((W * H) / 14000) + 30;
      for (let i = 0; i < total; i++) {
        // Bias toward margins
        let x: number;
        const inMargin = Math.random() < 0.65 && marginW > 40;
        if (inMargin) {
          x = Math.random() < 0.5 ? Math.random() * marginW : W - Math.random() * marginW;
        } else {
          x = Math.random() * W;
        }
        stars.push({
          x, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.13,
          vy: (Math.random() - 0.5) * 0.13,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.6 + 0.2,
          r:  Math.random() * 1.2 + 0.3,
          brightness: Math.random(),
        });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      t += 0.009;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;

      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
      }

      // Constellation lines — pulse brightness over time
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < MAX_DIST) {
            const proximity = 1 - d / MAX_DIST;
            // Lines pulse with a slow wave
            const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + (a.ph + b.ph) * 0.5);
            const alpha = proximity * 0.18 * pulse;
            const hue   = 240 + Math.sin(t * 0.3 + i * 0.1) * 40;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${hue},60%,75%,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Stars
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = (0.25 + 0.55 * tw) * (0.4 + s.brightness * 0.6);

        // Halo
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,145,255,${al * 0.07})`; ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,195,255,${al})`; ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [canvasRef]);
}

/* Mouse trail */
function useMouseTrail(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    interface P { x:number; y:number; vx:number; vy:number; life:number; max:number; r:number; h:number; }
    let particles: P[] = [];
    let raf = 0;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        const angle = Math.random()*Math.PI*2, speed = Math.random()*1.6+0.4;
        particles.push({ x: e.clientX-rect.left, y: e.clientY-rect.top,
          vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-0.6,
          life: 0, max: Math.random()*50+25, r: Math.random()*2.8+0.5,
          h: Math.random()<0.5 ? 330 : (Math.random()<0.5 ? 275 : 210) });
      }
    };
    const section = canvas.parentElement;
    section?.addEventListener('mousemove', onMove, { passive: true });
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life < p.max);
      for (const p of particles) {
        const prog = p.life/p.max, al = (1-prog)*0.85, r = p.r*(1-prog*0.4);
        ctx.beginPath(); ctx.arc(p.x,p.y,r*4,0,Math.PI*2);
        ctx.fillStyle = `hsla(${p.h},80%,65%,${al*0.12})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
        ctx.fillStyle = `hsla(${p.h},90%,82%,${al})`; ctx.fill();
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life++;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); section?.removeEventListener('mousemove', onMove); };
  }, [canvasRef]);
}

/* Component */
export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const spaceRef   = useRef<HTMLCanvasElement>(null);
  const constRef   = useRef<HTMLCanvasElement>(null);
  const trailRef   = useRef<HTMLCanvasElement>(null);
  const headRef    = useRef<HTMLDivElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);

  useSpaceCanvas(spaceRef);
  useConstellations(constRef);
  useMouseTrail(trailRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headRef.current,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 85%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(leftRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: leftRef.current, start: 'top 83%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(rightRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out', delay: 0.1,
          scrollTrigger: { trigger: rightRef.current, start: 'top 83%', toggleActions: 'play none none reverse' } });
      const cards = gridRef.current?.querySelectorAll<HTMLDivElement>('.about-card') ?? [];
      gsap.fromTo(Array.from(cards),
        { opacity: 0, y: 32, scale: 0.90 },
        { opacity: 1, y: 0, scale: 1, stagger: { each: 0.055, from: 'start' },
          duration: 0.55, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: gridRef.current, start: 'top 82%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(statsRef.current?.querySelectorAll<HTMLDivElement>('.about-stat') ?? [],
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 83%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(closingRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: closingRef.current, start: 'top 88%', toggleActions: 'play none none reverse' } });

      // Animate margin glyphs on scroll
      gsap.utils.toArray<HTMLElement>('.about-glyph').forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.5, rotate: (el.dataset.rot ?? '0') + 'deg' },
          { opacity: 1, scale: 1, rotate: el.dataset.rot + 'deg',
            duration: 1.2, ease: 'back.out(1.4)',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
            delay: i * 0.08,
          }
        );
        // Slow float animation
        gsap.to(el, {
          y: `${Math.sin(i) * 18 + 12}px`,
          duration: 3 + i * 0.4,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.3,
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="about" id="about">

      {/* Background layers */}
      <canvas ref={spaceRef} className="about-space-canvas" aria-hidden="true" />
      <canvas ref={constRef} className="about-constellation-canvas" aria-hidden="true" />
      <canvas ref={trailRef} className="about-trail-canvas" aria-hidden="true" />

      {/* Nebula glows */}
      <div className="about-glow about-glow--r" aria-hidden="true" />
      <div className="about-glow about-glow--l" aria-hidden="true" />
      <div className="about-glow about-glow--center" aria-hidden="true" />

      {/* Decorative star glyphs in margins */}
      {MARGIN_GLYPHS.map((g, i) => (
        <div
          key={i}
          className="about-glyph"
          data-rot={g.rot}
          aria-hidden="true"
          style={{
            top: g.top,
            left: 'left' in g ? (g as any).left : undefined,
            right: 'right' in g ? (g as any).right : undefined,
            width: g.size,
            height: g.size,
            animationDelay: `${g.delay}s`,
            opacity: 0,
          }}
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 5 L55 44 L94 50 L55 56 L50 95 L45 56 L6 50 L45 44 Z"
              fill="none"
              stroke="rgba(180,140,255,0.35)"
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="4" fill="rgba(200,160,255,0.45)" />
          </svg>
        </div>
      ))}

      <RocketPath rocketSrc="/rocket.png" />

      <div className="about-inner">

        <div ref={headRef} className="about-head">
          <p className="about-eyebrow">About the Expo</p>
          <h2 className="about-title">
            A show-and-tell of the<br />
            <em>most spectacular order</em>
          </h2>
          <div className="about-rule" aria-hidden="true" />
        </div>

        <div className="about-manifesto">
          <div ref={leftRef} className="about-manifesto-block">
            <span className="about-block-label">Vision</span>
            <p className="about-block-text">
              Where explorers connect and ideas collide.
            </p>
            <a href="#register" className="about-cta-btn" aria-label="Register your project">
              <span className="cta-shimmer" aria-hidden="true" />
              <span className="cta-label">Register your project</span>
            </a>
          </div>

          <div className="about-manifesto-sep" aria-hidden="true" />

          <div ref={rightRef} className="about-manifesto-block">
            <span className="about-block-label">Mission</span>
            <p className="about-block-body">
              Summit EXPO celebrates Kanata youth innovation across engineering and STEM research,
              under the theme "All That Can Be." The evening unfolds in two Acts: the "pitch night"
              and the "science fair." Throughout, professional guests look for outstanding projects,
              culminating in an awards ceremony.
            </p>
          </div>
        </div>

        <p className="about-eyebrow" style={{ marginBottom: '1.2rem' }}>What gets exhibited</p>
        <div ref={gridRef} className="about-grid">
          {FIELDS.map((f) => (
            <div key={f.label} className="about-card">
              <FontAwesomeIcon icon={f.icon} className="about-card-icon" aria-hidden="true" />
              <span className="about-card-label">{f.label}</span>
              <span className="about-card-desc">{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="about-quote-wrap">
          <div className="about-quote-line" aria-hidden="true" />
          <p className="about-quote">
            Software that learns. Circuits that sense. Steak grown from plants.
            Primes found in bedrooms. Comets named after students.
            <br /><br />
            <strong>The possibilities are, quite literally, infinite.</strong>
          </p>
          <div className="about-quote-line" aria-hidden="true" />
        </div>

        <div ref={statsRef} className="about-stats">
          {STATS.map((s) => (
            <div key={s.label} className="about-stat">
              <span className="about-stat-value">{s.value}</span>
              <span className="about-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div ref={closingRef} className="about-closing">
          <p>
            Inspired by the audacity of <em>Expo&nbsp;67</em> —
            the belief that human ingenuity, given a stage, can change everything.
          </p>
        </div>

      </div>
    </section>
  );
}