/**
 * FAQ.tsx — Summit EXPO 2026
 *
 * ORBIT SYSTEM FAQ
 * ─────────────────
 * A central glowing star (the expo) sits in the middle of a dark canvas.
 * 16 FAQ items orbit it as planets on elliptical paths at varying radii +
 * speeds. Three orbit rings, colour-coded by category:
 *   Inner ring  — General (blue)
 *   Middle ring — Attendee (magenta)
 *   Outer ring  — Exhibitor (purple)
 *
 * INTERACTIONS
 * ─────────────
 * • Scroll entry: planets spiral in from random off-screen positions
 *   with back.out stagger via GSAP
 * • Hover: planet brightens, label appears
 * • Click: planet docks to the right panel, other planets slow + dim,
 *   answer typewriter-decodes in with blinking cursor
 * • Click active planet / press Esc / click close: re-enters orbit,
 *   brief warp streak on canvas as it accelerates back
 *
 * CANVAS
 * ───────
 * rAF loop draws the star field (static twinkling background stars) +
 * the orbital paths as faint ellipses + planets as glowing circles.
 * When a planet is "docked" a brief streak burst fires on canvas.
 *
 * GSAP
 * ─────
 * ScrollTrigger: pins the section, triggers planet entry animation.
 * Orbital motion: gsap.ticker drives angle increments each frame.
 * Planet dock/undock: gsap.to on the planet DOM element position.
 * Typewriter: RAF-based character reveal with random-char scramble.
 */

import React, {
  useEffect, useRef, useCallback, useState,
} from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FAQ.css';

gsap.registerPlugin(ScrollTrigger);

/* ── FAQ DATA ─────────────────────────────────────────────── */
type Category = 'general' | 'attendee' | 'exhibitor';

interface FAQItem {
  id: number;
  category: Category;
  q: string;
  a: string | React.ReactNode;
}

const FAQS: FAQItem[] = [
  // General
  {
    id: 1, category: 'general',
    q: "I'm not from Earl of March. Can I still attend or exhibit?",
    a: "Yes! Summit EXPO is a community event open to everyone — younger students, students from other schools, alumni, and parents. Exhibitors can come from other schools too, but must be under 19.",
  },
  {
    id: 2, category: 'general',
    q: "Where and when is Summit EXPO? How long is it?",
    a: "See the Practical Info section below for date, time, location, and duration details.",
  },
  {
    id: 3, category: 'general',
    q: "I need to contact the organizing team!",
    a: "Shoot us an email at contact@summitexpo.ca — questions, concerns, suggestions, we want to hear it all :)",
  },

  // Attendees
  {
    id: 4, category: 'attendee',
    q: "How do I attend?",
    a: "Sign up by filling out the attendee form and come to Earl of March Secondary School on the event date. It takes two minutes.",
  },
  {
    id: 5, category: 'attendee',
    q: "Is Summit EXPO free to attend?",
    a: "Absolutely! Admission is completely free. Just show up.",
  },
  {
    id: 6, category: 'attendee',
    q: "What cool things can I expect to see?",
    a: "Check out our lineup of exhibitors — software that learns, circuits that sense, comets named after students, steak grown from plants. The range is genuinely infinite.",
  },
  {
    id: 7, category: 'attendee',
    q: "How does the event actually unfold?",
    a: "Summit EXPO runs in two Acts. Act I: each exhibitor delivers a short pitch and demo. Act II: the exhibition opens as a fair-style showcase — explore booths, meet exhibitors and judges, watch live demos.",
  },
  {
    id: 8, category: 'attendee',
    q: "Do I get to vote on exhibits?",
    a: "More than that — you can score exhibits like a professional judge! Audience scores count toward the awards ceremony. Judges' evaluations are weighted more heavily, but your votes matter.",
  },
  {
    id: 9, category: 'attendee',
    q: "Can I connect with exhibitors and judges?",
    a: "Yes! During Act II, the fair opens up and you can explore booths, chat with exhibitors, and talk directly with professional judges from industry, research, and academia.",
  },
  {
    id: 10, category: 'attendee',
    q: "Is there food? Any liquid-nitrogen ice cream?",
    a: "Maybe :P",
  },

  // Exhibitors
  {
    id: 11, category: 'exhibitor',
    q: "How do I apply to be an Exhibitor?",
    a: "Fill out the exhibitor application form. The team will review all applications and contact selected exhibitors for next steps.",
  },
  {
    id: 12, category: 'exhibitor',
    q: "What kinds of projects can be exhibited?",
    a: "Anything across science, tech, math, and engineering — software, robotics, experiments, research, discoveries, interdisciplinary projects. Plant-based steak? Quantum simulator? New comet discovery? Yes, yes, and yes.",
  },
  {
    id: 13, category: 'exhibitor',
    q: "My exhibit needs a projector / power supply / special equipment.",
    a: "The application form asks exactly this. We'll accommodate all reasonable requests and arrange logistics meetings with exhibitors if needed.",
  },
  {
    id: 14, category: 'exhibitor',
    q: "Can teams apply, or only individuals?",
    a: "Both! If your project was built by three friends, all three can manage the exhibit. For Act I pitches, the team decides whether everyone presents together or just part of the team.",
  },
  {
    id: 15, category: 'exhibitor',
    q: "Do projects need to be finished?",
    a: "Not at all. MVPs, prototypes, proof-of-concepts, research proposals, works-in-progress — these are the heart of Summit EXPO. Demonstrate progress and vision; that's what matters.",
  },
  {
    id: 16, category: 'exhibitor',
    q: "I have so many logistics questions — stage, arrival, power, dress code...",
    a: "We're with you every step. Once selected, we'll communicate every detail you need. No formal dress code — business casual is popular. Focus on wowing the crowd; we handle logistics. Email us at contact@summitexpo.ca anytime.",
  },
];

/* ── ORBIT CONFIG ─────────────────────────────────────────── */
interface OrbitConfig {
  radiusX: number;   // ellipse semi-major (horizontal)
  radiusY: number;   // ellipse semi-minor (vertical)
  speed: number;     // radians per second (positive = counter-clockwise)
  tilt: number;      // rotation of ellipse in degrees
}

const ORBIT_RINGS: Record<Category, OrbitConfig> = {
  general:   { radiusX: 165, radiusY: 54,  speed: 0.28, tilt: -8  },
  attendee:  { radiusX: 240, radiusY: 82,  speed: 0.18, tilt: 6   },
  exhibitor: { radiusX: 318, radiusY: 110, speed: 0.12, tilt: -4  },
};

/* Colour per category */
const CAT_COLOUR: Record<Category, { core: string; glow: string; ring: string }> = {
  general:   { core: '#6789A3', glow: 'rgba(103,137,163,0.55)', ring: 'rgba(103,137,163,0.18)' },
  attendee:  { core: '#CE3072', glow: 'rgba(206,48,114,0.60)',  ring: 'rgba(206,48,114,0.18)'  },
  exhibitor: { core: '#8B4B81', glow: 'rgba(139,75,129,0.55)', ring: 'rgba(139,75,129,0.18)'  },
};

/* Starting angle offsets so planets don't stack */
function startAngle(id: number, cat: Category): number {
  const offset: Record<Category, number[]> = {
    general:   [0.2,  1.4,  3.8],
    attendee:  [0.6,  1.8,  3.1,  4.2,  5.0,  5.8,  0.3],
    exhibitor: [0.4,  1.2,  2.2,  3.3,  4.4,  5.5],
  };
  const byCategory = FAQS.filter(f => f.category === cat);
  const idx = byCategory.findIndex(f => f.id === id);
  return (offset[cat][idx] ?? idx * 1.1);
}

/* ── STAR CANVAS ──────────────────────────────────────────── */
interface BgStar { x: number; y: number; r: number; a: number; phase: number; speed: number; }

/* ── COMPONENT ────────────────────────────────────────────── */
export function FAQ() {
  const sectionRef  = useRef<HTMLElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const orbitAreaRef = useRef<HTMLDivElement>(null);

  /* angle state — one per FAQ item */
  const anglesRef = useRef<Record<number, number>>({});
  FAQS.forEach(f => {
    anglesRef.current[f.id] = startAngle(f.id, f.category);
  });

  /* planet DOM refs */
  const planetRefs = useRef<Record<number, HTMLDivElement | null>>({});

  /* background stars */
  const bgStarsRef = useRef<BgStar[]>([]);
  const clockRef   = useRef(0);
  const rafRef     = useRef(0);

  /* active item */
  const [activeId, setActiveId] = useState<number | null>(null);
  const [displayedAnswer, setDisplayedAnswer] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  const typeRafRef  = useRef(0);
  const isDockedRef = useRef(false);

  /* track size */
  const sizeRef = useRef({ w: 0, h: 0 });

  /* ── background star canvas ─────────────────────────────── */
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const { w: W, h: H } = sizeRef.current;
    if (!W) { rafRef.current = requestAnimationFrame(renderCanvas); return; }

    clockRef.current += 0.012;
    const t = clockRef.current;

    ctx.clearRect(0, 0, W, H);

    for (const s of bgStarsRef.current) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
      const al = s.a * tw;
      ctx.fillStyle = `rgba(255,255,255,${al * 0.06})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${al})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }

    rafRef.current = requestAnimationFrame(renderCanvas);
  }, []);

  /* ── mount canvas ───────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const resize = () => {
      const section = sectionRef.current;
      if (!section) return;
      canvas.width  = section.offsetWidth;
      canvas.height = section.offsetHeight;
      sizeRef.current = { w: canvas.width, h: canvas.height };
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    /* spawn background stars */
    bgStarsRef.current = Array.from({ length: 120 }, () => ({
      x: Math.random() * (sizeRef.current.w || 1200),
      y: Math.random() * (sizeRef.current.h || 800),
      r: Math.random() * 0.9 + 0.15,
      a: Math.random() * 0.30 + 0.08,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.9,
    }));

    rafRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [renderCanvas]);

  /* ── GSAP orbital ticker ────────────────────────────────── */
  useEffect(() => {
    const ticker = gsap.ticker.add(() => {
      if (isDockedRef.current) return;
      const dt = gsap.ticker.deltaRatio(60) * (1 / 60); // seconds per frame

      FAQS.forEach(f => {
        const cfg = ORBIT_RINGS[f.category];
        /* slow down non-active planets when one is docked */
        const mult = activeId !== null && activeId !== f.id ? 0.18 : 1;
        anglesRef.current[f.id] += cfg.speed * dt * mult;

        const el = planetRefs.current[f.id];
        if (!el || (activeId === f.id)) return;

        const angle  = anglesRef.current[f.id];
        const tiltRad = cfg.tilt * (Math.PI / 180);
        const lx = Math.cos(angle) * cfg.radiusX;
        const ly = Math.sin(angle) * cfg.radiusY;
        /* apply tilt rotation */
        const rx = lx * Math.cos(tiltRad) - ly * Math.sin(tiltRad);
        const ry = lx * Math.sin(tiltRad) + ly * Math.cos(tiltRad);

        el.style.transform = `translate(calc(-50% + ${rx}px), calc(-50% + ${ry}px))`;
        /* depth: planets "behind" centre are smaller + more transparent */
        const depth = (Math.sin(angle) + 1) * 0.5; // 0=back, 1=front
        const scale = 0.65 + depth * 0.45;
        const alpha = activeId !== null ? 0.22 + depth * 0.18 : 0.55 + depth * 0.45;
        el.style.transform += ` scale(${scale.toFixed(3)})`;
        el.style.opacity    = alpha.toFixed(3);
        el.style.zIndex     = Math.round(depth * 10).toString();
      });
    });

    return () => gsap.ticker.remove(ticker);
  }, [activeId]);

  /* ── ScrollTrigger entry animation ─────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* Hide all planets initially */
      gsap.set('.faq-planet', { scale: 0, opacity: 0 });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 75%',
        once: true,
        onEnter() {
          /* Staggered spiral-in */
          gsap.to('.faq-planet', {
            scale: 1, opacity: 1,
            duration: 0.7,
            ease: 'back.out(1.8)',
            stagger: { amount: 0.9, from: 'random' },
          });
          /* Star glow pulse */
          gsap.fromTo('.faq-star-core',
            { scale: 0.4, opacity: 0 },
            { scale: 1, opacity: 1, duration: 1.2, ease: 'back.out(2.0)' }
          );
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  /* ── Typewriter effect ──────────────────────────────────── */
  const typewriterText = useCallback((text: string) => {
    cancelAnimationFrame(typeRafRef.current);
    setDisplayedAnswer('');
    setTypewriterDone(false);

    const chars = text.split('');
    let i = 0;
    const SCRAMBLE = '░▒▓█▄▀◆◇✦✧★☆';
    let scrambleCount = 0;

    const tick = () => {
      if (i >= chars.length) {
        setDisplayedAnswer(text);
        setTypewriterDone(true);
        return;
      }

      /* Scramble then reveal */
      if (scrambleCount < 2) {
        const sc = SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
        setDisplayedAnswer(text.slice(0, i) + sc + '▌');
        scrambleCount++;
        typeRafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayedAnswer(text.slice(0, i + 1) + '▌');
        scrambleCount = 0;
        i++;
        /* Variable speed: faster for common chars */
        const delay = chars[i - 1] === ' ' ? 25 : chars[i - 1] === ',' ? 80 : 32;
        setTimeout(() => {
          typeRafRef.current = requestAnimationFrame(tick);
        }, delay);
      }
    };

    setTimeout(() => { typeRafRef.current = requestAnimationFrame(tick); }, 120);
  }, []);

  /* ── Activate planet ────────────────────────────────────── */
  const activatePlanet = useCallback((id: number) => {
    if (activeId === id) return;

    const item = FAQS.find(f => f.id === id)!;
    setActiveId(id);
    isDockedRef.current = false; // let ticker slow others but keep active moving briefly

    const el = planetRefs.current[id];
    if (el) {
      /* Float the active planet to the panel zone */
      gsap.to(el, {
        x: 0, y: 0,
        duration: 0.55,
        ease: 'power3.out',
        onComplete: () => { isDockedRef.current = false; }
      });
      gsap.to(el, { opacity: 1, scale: 1.15, duration: 0.4, ease: 'power2.out' });
    }

    /* Start typewriter */
    const answerText = typeof item.a === 'string' ? item.a : String(item.a);
    typewriterText(answerText);
  }, [activeId, typewriterText]);

  /* ── Deactivate ─────────────────────────────────────────── */
  const deactivate = useCallback(() => {
    if (activeId === null) return;
    cancelAnimationFrame(typeRafRef.current);
    setActiveId(null);
    setDisplayedAnswer('');
    setTypewriterDone(false);
    isDockedRef.current = false;

    /* Re-enter orbit with a spring */
    const el = planetRefs.current[activeId!];
    if (el) {
      gsap.to(el, { opacity: 0.55, scale: 1, duration: 0.4, ease: 'power2.inOut' });
    }
  }, [activeId]);

  /* ── ESC to close ───────────────────────────────────────── */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') deactivate(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [deactivate]);

  /* ── Render orbit rings (SVG paths) ─────────────────────── */
  const orbitRings = (Object.entries(ORBIT_RINGS) as [Category, OrbitConfig][]).map(([cat, cfg]) => {
    const tilt = cfg.tilt;
    return (
      <ellipse
        key={cat}
        cx="0" cy="0"
        rx={cfg.radiusX} ry={cfg.radiusY}
        fill="none"
        stroke={CAT_COLOUR[cat].ring}
        strokeWidth="1"
        strokeDasharray="3 5"
        transform={`rotate(${tilt})`}
      />
    );
  });

  const activeItem = FAQS.find(f => f.id === activeId) ?? null;

  return (
    <section ref={sectionRef} className="faq-section" id="faq">
      <canvas ref={canvasRef} className="faq-canvas" aria-hidden="true" />

      {/* ── SECTION HEADER ── */}
      <div className="faq-header">
        <p className="faq-eyebrow">
          <span className="faq-eyebrow-line" />
          Questions &amp; Answers
          <span className="faq-eyebrow-line" />
        </p>
        <h2 className="faq-title">
          Mission <em>Intel</em>
        </h2>
        <p className="faq-subtitle">
          Click any planet to decode its transmission
        </p>
      </div>

      {/* ── ORBIT ARENA ── */}
      <div className="faq-arena">

        {/* Orbit SVG rings */}
        <div ref={orbitAreaRef} className="faq-orbit-wrap">
          <svg className="faq-orbit-svg" viewBox="-350 -140 700 280" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            {orbitRings}
          </svg>

          {/* Central star */}
          <div className="faq-star">
            <div className="faq-star-core" />
            <div className="faq-star-pulse" />
            <div className="faq-star-pulse faq-star-pulse--2" />
            <span className="faq-star-label">SUMMIT<br/>EXPO</span>
          </div>

          {/* Planets */}
          {FAQS.map(item => {
            const col = CAT_COLOUR[item.category];
            const isActive = activeId === item.id;
            const shortQ = item.q.length > 38 ? item.q.slice(0, 36) + '…' : item.q;
            return (
              <div
                key={item.id}
                className={`faq-planet faq-planet--${item.category}${isActive ? ' faq-planet--active' : ''}`}
                ref={(el: HTMLDivElement | null) => { planetRefs.current[item.id] = el; }}
                onClick={() => isActive ? deactivate() : activatePlanet(item.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isActive}
                aria-label={item.q}
                onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isActive ? deactivate() : activatePlanet(item.id); } }}
                style={{ '--planet-core': col.core, '--planet-glow': col.glow } as React.CSSProperties}
              >
                <div className="faq-planet-core" />
                <div className="faq-planet-halo" />
                <div className="faq-planet-label">{shortQ}</div>
                {/* Category indicator ring */}
                <div className="faq-planet-ring" />
              </div>
            );
          })}
        </div>

        {/* ── ANSWER PANEL ── */}
        <div className={`faq-panel${activeItem ? ' faq-panel--open' : ''}`} aria-live="polite">
          {activeItem ? (
            <>
              {/* Category badge */}
              <div className={`faq-panel-badge faq-panel-badge--${activeItem.category}`}>
                {activeItem.category === 'general'   && '◈ General'}
                {activeItem.category === 'attendee'  && '✦ Attendee'}
                {activeItem.category === 'exhibitor' && '⬡ Exhibitor'}
              </div>

              {/* Question */}
              <p className="faq-panel-q">{activeItem.q}</p>

              {/* Answer — typewriter */}
              <div className="faq-panel-a-wrap">
                <span className="faq-panel-prompt">&#62;&#95;</span>
                <p className="faq-panel-a">
                  {displayedAnswer}
                  {!typewriterDone && <span className="faq-cursor" aria-hidden="true">▌</span>}
                </p>
              </div>

              {/* Signal bars */}
              <div className="faq-signal" aria-hidden="true">
                {[1,2,3,4,5].map(i => (
                  <div
                    key={i}
                    className={`faq-signal-bar${typewriterDone ? ' faq-signal-bar--active' : ''}`}
                    style={{ animationDelay: `${i * 0.08}s`, height: `${6 + i * 4}px` } as React.CSSProperties}
                  />
                ))}
                <span className="faq-signal-label">{typewriterDone ? 'SIGNAL LOCKED' : 'DECODING...'}</span>
              </div>

              {/* Close */}
              <button className="faq-panel-close" onClick={deactivate} aria-label="Close answer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Release orbit
              </button>
            </>
          ) : (
            <div className="faq-panel-idle">
              <div className="faq-idle-icon" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="5" stroke="currentColor" strokeWidth="1"/>
                  <ellipse cx="14" cy="14" rx="13" ry="5.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3"/>
                  <ellipse cx="14" cy="14" rx="13" ry="5.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" transform="rotate(60 14 14)"/>
                  <ellipse cx="14" cy="14" rx="13" ry="5.5" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3 3" transform="rotate(120 14 14)"/>
                </svg>
              </div>
              <p className="faq-idle-text">Select a planet<br/>to receive its transmission</p>
              <div className="faq-legend">
                <div className="faq-legend-item">
                  <span className="faq-legend-dot faq-legend-dot--general" />General
                </div>
                <div className="faq-legend-item">
                  <span className="faq-legend-dot faq-legend-dot--attendee" />Attendee
                </div>
                <div className="faq-legend-item">
                  <span className="faq-legend-dot faq-legend-dot--exhibitor" />Exhibitor
                </div>
              </div>
            </div>
          )}
        </div>

      </div>{/* end arena */}

    </section>
  );
}