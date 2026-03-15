import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './About.css';
import { RocketPath } from '../ScrollRocket/RocketPath';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode,
  faBolt,
  faGears,
  faDna,
  faFlask,
  faMicroscope,
  faSquareRootVariable,
  faSatelliteDish,
  faHeartPulse,
  faInfinity,
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
  { value: 'Free',   label: 'Admission' },
  { value: '∞',      label: 'Fields of study' },
  { value: 'Live',   label: 'Awards ceremony' },
  { value: 'All',    label: 'Schools welcome' },
];

/* Ambient star canvas for About background */
function useAmbientStars(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    interface AStar { x:number; y:number; r:number; op:number; ph:number; sp:number; }
    const stars: AStar[] = [];
    let raf = 0;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars.length = 0;
      const count = Math.floor((canvas.width * canvas.height) / 4000);
      for (let i = 0; i < count; i++) {
        stars.push({
          x:  Math.random() * canvas.width,
          y:  Math.random() * canvas.height,
          r:  Math.random() * 1.3 + 0.2,
          op: Math.random() * 0.5 + 0.15,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.8 + 0.3,
        });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      t += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = s.op * tw;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${al * 0.07})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${al})`;
        ctx.fill();
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

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.4 + 0.3;
        particles.push({
          x: mx, y: my,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 0, max: Math.random() * 45 + 20,
          r: Math.random() * 2.5 + 0.4,
          h: Math.random() < 0.6 ? 330 : (Math.random() < 0.5 ? 275 : 210),
        });
      }
    };

    const section = canvas.parentElement;
    section?.addEventListener('mousemove', onMove, { passive: true });

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life < p.max);
      for (const p of particles) {
        const prog = p.life / p.max;
        const al   = (1 - prog) * 0.80;
        const r    = p.r * (1 - prog * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},80%,65%,${al * 0.10})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},90%,80%,${al})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life++;
      }
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      section?.removeEventListener('mousemove', onMove);
    };
  }, [canvasRef]);
}

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const trailRef   = useRef<HTMLCanvasElement>(null);
  const headRef    = useRef<HTMLDivElement>(null);
  const leftRef    = useRef<HTMLDivElement>(null);
  const rightRef   = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const statsRef   = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);

  useAmbientStars(ambientRef);
  useMouseTrail(trailRef);

  useEffect(() => {
    const ctx = gsap.context(() => {

      gsap.fromTo(headRef.current,
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out',
          scrollTrigger: { trigger: headRef.current, start: 'top 85%', toggleActions: 'play none none none' } }
      );

      gsap.fromTo(leftRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: leftRef.current, start: 'top 83%', toggleActions: 'play none none none' } }
      );
      gsap.fromTo(rightRef.current,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.9, ease: 'power2.out', delay: 0.1,
          scrollTrigger: { trigger: rightRef.current, start: 'top 83%', toggleActions: 'play none none none' } }
      );

      const cards = gridRef.current?.querySelectorAll<HTMLDivElement>('.about-card') ?? [];
      gsap.fromTo(Array.from(cards),
        { opacity: 0, y: 32, scale: 0.90 },
        { opacity: 1, y: 0, scale: 1,
          stagger: { each: 0.055, from: 'start' },
          duration: 0.55, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: gridRef.current, start: 'top 82%', toggleActions: 'play none none none' } }
      );

      gsap.fromTo(statsRef.current?.querySelectorAll<HTMLDivElement>('.about-stat') ?? [],
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: statsRef.current, start: 'top 83%', toggleActions: 'play none none none' } }
      );

      gsap.fromTo(closingRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: closingRef.current, start: 'top 88%', toggleActions: 'play none none none' } }
      );

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="about" id="about">

      <canvas ref={ambientRef} className="about-stars-canvas" aria-hidden="true"/>
      <canvas ref={trailRef}   className="about-trail-canvas" aria-hidden="true"/>

      <div className="about-glow about-glow--r" aria-hidden="true"/>
      <div className="about-glow about-glow--l" aria-hidden="true"/>

      {/* <RocketPath /> */}

      <div className="about-inner">

        <div ref={headRef} className="about-head">
          <p className="about-eyebrow">About the Expo</p>
          <h2 className="about-title">
            A show-and-tell of the<br/>
            <em>most spectacular order</em>
          </h2>
          <div className="about-rule" aria-hidden="true"/>
        </div>

        <div className="about-manifesto">
          <div ref={leftRef} className="about-manifesto-block">
            <span className="about-block-label">Vision</span>
            <p className="about-block-text">
              Where dreamers connect<br/>and ideas collide.
            </p>
          </div>

          <div className="about-manifesto-sep" aria-hidden="true"/>

          <div ref={rightRef} className="about-manifesto-block">
            <span className="about-block-label">Mission</span>
            <p className="about-block-body">
              To catalyse idea exchange and spark STEM dialogue among Kanata youth —
              a community fair where professional guests speak and judge,
              and every exhibitor competes for awards at a closing ceremony.
              Open to all students, not just Earl&nbsp;of&nbsp;March.
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
          <div className="about-quote-line" aria-hidden="true"/>
          <p className="about-quote">
            Software that learns. Circuits that sense. Steak grown from plants.
            Primes found in bedrooms. Comets named after students.
            <br/><br/>
            <strong>The possibilities are, quite literally, infinite.</strong>
          </p>
          <div className="about-quote-line" aria-hidden="true"/>
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