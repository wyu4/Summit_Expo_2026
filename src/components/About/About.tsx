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

/* ── Parallax star field ─────────────────────────────────────────── */
function useParallaxStars(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface Star {
      x: number; y: number; r: number;
      vx: number; vy: number;
      op: number; ph: number; sp: number;
      layer: number;
    }

    const LAYERS = [
      { count: 120, speed: 0.012, rMax: 0.7,  opMax: 0.35, twinkleSpeed: 0.4 },
      { count:  70, speed: 0.030, rMax: 1.1,  opMax: 0.55, twinkleSpeed: 0.7 },
      { count:  30, speed: 0.065, rMax: 1.6,  opMax: 0.80, twinkleSpeed: 1.1 },
    ];
    const PARALLAX = [0.04, 0.12, 0.28];

    let stars: Star[] = [];
    let raf = 0, t = 0, scrollY = 0, lastScrollY = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars = [];
      LAYERS.forEach((cfg, li) => {
        for (let i = 0; i < cfg.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r:  Math.random() * cfg.rMax + 0.2,
            vx: Math.cos(angle) * cfg.speed * (0.5 + Math.random()),
            vy: Math.sin(angle) * cfg.speed * (0.5 + Math.random()),
            op: Math.random() * cfg.opMax + 0.1,
            ph: Math.random() * Math.PI * 2,
            sp: Math.random() * cfg.twinkleSpeed + 0.2,
            layer: li,
          });
        }
      });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const loop = () => {
      t += 0.010;
      const sd = scrollY - lastScrollY;
      lastScrollY = scrollY;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy + sd * PARALLAX[s.layer];
        if (s.x < -2) s.x = canvas.width + 2;
        if (s.x > canvas.width  + 2) s.x = -2;
        if (s.y < -2) s.y = canvas.height + 2;
        if (s.y > canvas.height + 2) s.y = -2;

        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = s.op * (0.4 + 0.6 * tw);

        if (s.layer === 2) {
          const hue = 250 + Math.sin(t * 0.3 + s.ph) * 40;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue},70%,80%,${al * 0.07})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        const b = s.layer === 2 ? 255 : 220;
        ctx.fillStyle = `rgba(${b},${b},255,${al})`;
        ctx.fill();

        if (s.layer === 2 && al > 0.6) {
          const spike = s.r * 6 * al;
          ctx.strokeStyle = `rgba(200,180,255,${al * 0.35})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - spike, s.y); ctx.lineTo(s.x + spike, s.y);
          ctx.moveTo(s.x, s.y - spike); ctx.lineTo(s.x, s.y + spike);
          ctx.stroke();
        }
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

/* ── Constellation canvas ────────────────────────────────────────── */
function useConstellations(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface CStar { x: number; y: number; vx: number; vy: number; ph: number; sp: number; r: number; }
    let stars: CStar[] = [];
    let raf = 0, t = 0;
    const MAX_DIST = 105;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars = [];
      const w = canvas.width, h = canvas.height;
      const marginW = Math.max(55, (w - 1280) / 2);
      const total   = Math.floor((w * h) / 17000) + 24;
      for (let i = 0; i < total; i++) {
        let x: number;
        if (Math.random() < 0.60 && marginW > 40)
          x = Math.random() < 0.5 ? Math.random() * marginW : w - Math.random() * marginW;
        else
          x = Math.random() * w;
        stars.push({
          x, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.10,
          vy: (Math.random() - 0.5) * 0.10,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.5 + 0.2,
          r:  Math.random() * 1.1 + 0.3,
        });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      t += 0.008;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width, h = canvas.height;
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = w; if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h; if (s.y > h) s.y = 0;
      }
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const a = stars[i], b = stars[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d  = Math.sqrt(dx*dx + dy*dy);
          if (d < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(170,130,220,${(1 - d/MAX_DIST) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = 0.20 + 0.40 * tw;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190,155,255,${al * 0.05})`; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(225,200,255,${al})`; ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [canvasRef]);
}

/* ── Mouse trail ─────────────────────────────────────────────────── */
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
      for (let i = 0; i < 4; i++) {
        const angle = Math.random()*Math.PI*2, speed = Math.random()*1.4+0.3;
        particles.push({ x: e.clientX-rect.left, y: e.clientY-rect.top,
          vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed-0.5,
          life: 0, max: Math.random()*45+20, r: Math.random()*2.5+0.4,
          h: Math.random()<0.6 ? 330 : (Math.random()<0.5 ? 275 : 210) });
      }
    };
    const section = canvas.parentElement;
    section?.addEventListener('mousemove', onMove, { passive: true });
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life < p.max);
      for (const p of particles) {
        const prog = p.life/p.max, al = (1-prog)*0.80, r = p.r*(1-prog*0.4);
        ctx.beginPath(); ctx.arc(p.x,p.y,r*3.8,0,Math.PI*2);
        ctx.fillStyle = `hsla(${p.h},80%,65%,${al*0.10})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
        ctx.fillStyle = `hsla(${p.h},90%,80%,${al})`; ctx.fill();
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.life++;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); section?.removeEventListener('mousemove', onMove); };
  }, [canvasRef]);
}

/* ── Component ───────────────────────────────────────────────────── */
export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const starsRef   = useRef<HTMLCanvasElement>(null);
  const constRef   = useRef<HTMLCanvasElement>(null);
  const trailRef   = useRef<HTMLCanvasElement>(null);
  const headRef    = useRef<HTMLDivElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);

  useParallaxStars(starsRef);
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
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="about" id="about">

      <canvas ref={starsRef} className="about-stars-canvas"         aria-hidden="true" />
      <canvas ref={constRef} className="about-constellation-canvas" aria-hidden="true" />
      <canvas ref={trailRef} className="about-trail-canvas"         aria-hidden="true" />

      <div className="about-glow about-glow--r" aria-hidden="true" />
      <div className="about-glow about-glow--l" aria-hidden="true" />

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