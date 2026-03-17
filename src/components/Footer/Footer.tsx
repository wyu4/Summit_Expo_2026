import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Footer.css';

gsap.registerPlugin(ScrollTrigger);

const LINKS = [
  { id: 'hero',           label: 'Home',     mag: 6.5, greekLetter: 'α' },
  { id: 'about',          label: 'About',    mag: 4.8, greekLetter: 'β' },
  { id: 'lineup',         label: 'Lineup',   mag: 5.6, greekLetter: 'γ' },
  { id: 'practical-info', label: 'Info',     mag: 3.9, greekLetter: 'δ' },
  { id: 'faq',            label: 'FAQ',      mag: 5.1, greekLetter: 'ε' },
  { id: 'register',       label: 'Register', mag: 4.4, greekLetter: 'ζ' },
];

// Same StarDot component from Nav — identical rendering
function StarDot({
  mag,
  active,
  hovered,
}: {
  mag: number;
  active: boolean;
  hovered: boolean;
}) {
  const scale = 1;
  const r  = mag * 0.9 * scale;
  const cx = mag * 2.5 * scale;
  const size = mag * 5 * scale;
  const lit = active || hovered;

  return (
    <svg
      className={`star-dot ${lit ? 'star-dot--lit' : ''} ${active ? 'star-dot--active' : ''}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
    >
      <circle cx={cx} cy={cx} r={r * 3.8} fill={active ? '#CE3072' : 'white'}
        opacity={lit ? 0.1 : 0.04} className="star-halo-outer" />
      <circle cx={cx} cy={cx} r={r * 2} fill={active ? '#CE3072' : 'white'}
        opacity={lit ? 0.22 : 0.08} className="star-halo-mid" />
      <circle cx={cx} cy={cx} r={r} fill={active ? '#CE3072' : 'white'} className="star-core" />
      {lit && (
        <>
          <line x1={cx} y1={0} x2={cx} y2={size}
            stroke={active ? '#CE3072' : 'white'} strokeWidth={0.7} opacity={0.45} className="star-spike" />
          <line x1={0} y1={cx} x2={size} y2={cx}
            stroke={active ? '#CE3072' : 'white'} strokeWidth={0.7} opacity={0.45} className="star-spike" />
          <line x1={size * 0.16} y1={size * 0.16} x2={size * 0.84} y2={size * 0.84}
            stroke={active ? '#CE3072' : 'white'} strokeWidth={0.4} opacity={0.22} />
          <line x1={size * 0.84} y1={size * 0.16} x2={size * 0.16} y2={size * 0.84}
            stroke={active ? '#CE3072' : 'white'} strokeWidth={0.4} opacity={0.22} />
        </>
      )}
    </svg>
  );
}

function scrollTo(id: string) {
  if (id === 'hero') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

export function Footer() {
  const footerRef  = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const drawProg   = useRef(0);
  const rafRef     = useRef(0);
  const nodeRefs   = useRef<Record<string, HTMLButtonElement | null>>({});
  const [hovered, setHovered] = useState<string | null>(null);

  //  Constellation line canvas — exact same logic as Nav desktop canvas 
  useEffect(() => {
    const canvas = canvasRef.current;
    const footer = footerRef.current;
    if (!canvas || !footer) return;

    const getCentres = () => {
      const footerRect = footer.getBoundingClientRect();
      return LINKS.map(({ id }) => {
        const el = nodeRefs.current[id];
        if (!el) return { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width  / 2 - footerRect.left,
          y: r.top  + r.height / 2 - footerRect.top,
        };
      });
    };

    let cachedCentres: { x: number; y: number }[] = [];
    let centresDirty = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = footer.offsetWidth, h = footer.offsetHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.getContext('2d')!.scale(dpr, dpr);
      centresDirty = true;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let running = false;
    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width: W, height: H } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, W, H);

      if (centresDirty) { cachedCentres = getCentres(); centresDirty = false; }
      const centres = cachedCentres;
      const prog = drawProg.current;
      if (prog <= 0) return;

      const total = centres.length - 1;
      for (let i = 0; i < total; i++) {
        const sp = Math.max(0, Math.min(1, (prog - i / total) / (1 / total)));
        if (sp <= 0) continue;
        const a = centres[i], b = centres[i + 1];
        const ex = a.x + (b.x - a.x) * sp;
        const ey = a.y + (b.y - a.y) * sp;

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#6789A3';
        ctx.lineWidth = 3;
        ctx.filter = 'blur(3px)';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#8ab4d4';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -Date.now() * 0.012;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = 'rgba(180,220,255,0.75)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();
      }
    };

    const start = () => { if (running) return; running = true; rafRef.current = requestAnimationFrame(draw); };
    const stop  = () => { if (!running) return; running = false; cancelAnimationFrame(rafRef.current); };

    const observer = new IntersectionObserver(
      ([e]) => e.isIntersecting ? start() : stop(),
      { rootMargin: '200px 0px 200px 0px', threshold: 0 },
    );
    observer.observe(footer);

    return () => {
      stop(); observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  //  Scroll entrance — draw constellation lines + pop stars 
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: footerRef.current,
        start: 'top 90%',
        onEnter() {
          gsap.fromTo('.footer-top-line',
            { scaleX: 0 },
            { scaleX: 1, duration: 1.0, ease: 'power3.inOut', transformOrigin: 'left center' },
          );
          gsap.fromTo('.footer-meta',
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: 0.2 },
          );
          gsap.fromTo('.footer-nav-item',
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'back.out(2.5)', delay: 0.35 },
          );
          gsap.to(drawProg, {
            current: 1, duration: 1.4, ease: 'power2.inOut', delay: 0.6,
          });
          gsap.fromTo('.footer-legal-line',
            { opacity: 0 },
            { opacity: 1, duration: 0.5, delay: 1.2 },
          );
        },
      });
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="footer" id="footer">

      {/* Constellation line canvas */}
      <canvas ref={canvasRef} className="footer-canvas" aria-hidden="true" />

      {/* Top separator line */}
      <div className="footer-top-line" />

      <div className="footer-inner">

        {/* Top row: branding + contact */}
        <div className="footer-meta" style={{ opacity: 0 }}>
          <div className="footer-brand">
            <span className="footer-logo-star" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8.5" fill="#CE3072" opacity="0.10" />
                <circle cx="10" cy="10" r="4.5" fill="#CE3072" opacity="0.25" />
                <circle cx="10" cy="10" r="2" fill="#CE3072" />
                <line x1="10" y1="0.5" x2="10" y2="19.5" stroke="#CE3072" strokeWidth="0.9" opacity="0.5" />
                <line x1="0.5" y1="10" x2="19.5" y2="10" stroke="#CE3072" strokeWidth="0.9" opacity="0.5" />
                <line x1="3" y1="3" x2="17" y2="17" stroke="#CE3072" strokeWidth="0.55" opacity="0.28" />
                <line x1="17" y1="3" x2="3" y2="17" stroke="#CE3072" strokeWidth="0.55" opacity="0.28" />
              </svg>
            </span>
            <span className="footer-brand-text">
              SUMMIT<em>EXPO</em>
            </span>
          </div>

          <span className="footer-meta-sep" aria-hidden="true" />

          <span className="footer-made-by">Made by the Summit Team</span>

          <span className="footer-meta-sep" aria-hidden="true" />

          <div className="footer-contacts">
            <a href="mailto:summitexpo2026@gmail.com" className="footer-contact-link" aria-label="Email">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1.5 4.5L8 9.5L14.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <span>summitexpo2026@gmail.com</span>
            </a>
            <a
              href="https://instagram.com/summitexpo2026"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-link"
              aria-label="Instagram"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="11.8" cy="4.2" r="0.8" fill="currentColor"/>
              </svg>
              <span>@summitexpo2026</span>
            </a>
          </div>
        </div>

        {/* Constellation nav strip */}
        <div className="footer-nav">
          {LINKS.map(({ id, label, mag, greekLetter }) => {
            const isHov = hovered === id;
            return (
              <button
                key={id}
                ref={el => { nodeRefs.current[id] = el; }}
                className="footer-nav-item"
                onClick={() => scrollTo(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                aria-label={label}
                style={{ opacity: 0 }}
              >
                <span className="footer-nav-greek">{greekLetter}</span>
                <span className="footer-nav-star">
                  <StarDot mag={mag} active={false} hovered={isHov} />
                </span>
                <span className={`footer-nav-label${isHov ? ' footer-nav-label--hov' : ''}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legal */}
        <p className="footer-legal-line" style={{ opacity: 0 }}>
          © 2026 Summit EXPO · Earl of March SS · Kanata, ON · All That Can Be
        </p>

      </div>
    </footer>
  );
}