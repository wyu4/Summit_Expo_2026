import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollRocket.css';

gsap.registerPlugin(ScrollTrigger);

/* Deterministic zigzag path points so it looks like a constellation trail */
const PATH_NODES = [
  { xOff: 0,    label: false },
  { xOff: -18,  label: false },
  { xOff: 12,   label: true  },
  { xOff: -8,   label: false },
  { xOff: 20,   label: false },
  { xOff: -15,  label: true  },
  { xOff: 5,    label: false },
  { xOff: -20,  label: false },
  { xOff: 10,   label: true  },
  { xOff: -5,   label: false },
  { xOff: 18,   label: false },
  { xOff: -12,  label: true  },
  { xOff: 8,    label: false },
];

const TRAIL_HEIGHT = 1200; /* px of SVG canvas */
const NODE_SPACING = TRAIL_HEIGHT / (PATH_NODES.length - 1);

export function ScrollRocket() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rocketRef    = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const polyRef      = useRef<SVGPolylineElement>(null);
  const [progress, setProgress] = useState(0); /* 0–1 */

  /* Show/hide with hero */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    gsap.set(el, { opacity: 0, x: 30 });

    const st = ScrollTrigger.create({
      start: () => window.innerHeight * 5.6,
      onEnter() {
        gsap.to(el, { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' });
      },
      onLeaveBack() {
        gsap.to(el, { opacity: 0, x: 30, duration: 0.4, ease: 'power2.in' });
      },
    });
    return () => st.kill();
  }, []);

  /* Scroll → rocket Y + trail length */
  useEffect(() => {
    const onScroll = () => {
      const heroEnd   = window.innerHeight * 6;   /* where hero ends */
      const pageEnd   = document.body.scrollHeight - window.innerHeight;
      const scrolled  = Math.max(0, window.scrollY - heroEnd);
      const remaining = Math.max(1, pageEnd - heroEnd);
      const p = Math.min(1, scrolled / remaining);
      setProgress(p);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Update SVG trail and rocket position */
  useEffect(() => {
    const poly   = polyRef.current;
    const rocket = rocketRef.current;
    if (!poly || !rocket) return;

    /* Build visible points up to progress */
    const totalNodes = PATH_NODES.length;
    const visibleCount = Math.floor(progress * (totalNodes - 1)) + 1;
    const CX = 28; /* centre X of the 56px-wide SVG */

    const points = PATH_NODES.slice(0, visibleCount).map((n, i) => {
      const y = i * NODE_SPACING;
      const x = CX + n.xOff;
      return `${x},${y}`;
    }).join(' ');

    poly.setAttribute('points', points);

    /* Rocket sits at tip of the trail */
    const lastNode = PATH_NODES[visibleCount - 1];
    const tipY = (visibleCount - 1) * NODE_SPACING;
    const tipX = CX + lastNode.xOff;

    /* Map tipY (0..TRAIL_HEIGHT) to container CSS top (10%..85%) */
    const topPct = 10 + (tipY / TRAIL_HEIGHT) * 75;
    rocket.style.top  = `${topPct}%`;
    rocket.style.left = `${tipX}px`;
  }, [progress]);

  /* Build star nodes — only rendered ones (up to progress) */
  const visibleCount = Math.floor(progress * (PATH_NODES.length - 1)) + 1;
  const CX = 28;

  return (
    <div ref={containerRef} className="sr-container" aria-hidden="true">
      {/* Trail SVG */}
      <svg ref={svgRef} className="sr-svg"
        width={56} height={TRAIL_HEIGHT}
        viewBox={`0 0 56 ${TRAIL_HEIGHT}`}
      >
        <defs>
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#CE3072" stopOpacity={0.9}/>
            <stop offset="50%"  stopColor="#8B4B81" stopOpacity={0.7}/>
            <stop offset="100%" stopColor="#6789A3" stopOpacity={0.5}/>
          </linearGradient>
          <filter id="trailGlow">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* The growing trail line */}
        <polyline
          ref={polyRef}
          points=""
          fill="none"
          stroke="url(#trailGrad)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#trailGlow)"
          opacity={0.8}
        />

        {/* Star nodes along the trail */}
        {PATH_NODES.slice(0, visibleCount).map((n, i) => {
          const x = CX + n.xOff;
          const y = i * NODE_SPACING;
          const isFeature = n.label;
          return (
            <g key={i}>
              {isFeature && <circle cx={x} cy={y} r={5} fill="white" opacity={0.05}/>}
              <circle cx={x} cy={y} r={isFeature ? 2.5 : 1.5}
                fill={isFeature ? '#CE3072' : 'white'}
                opacity={isFeature ? 0.9 : 0.5}
                filter={isFeature ? 'url(#trailGlow)' : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* Rocket */}
      <div ref={rocketRef} className="sr-rocket">
        <div className="sr-exhaust">
          <div className="sr-flame-outer"/>
          <div className="sr-flame-inner"/>
        </div>
        <svg width={22} height={38} viewBox="0 0 22 38" fill="none">
          {/* Body */}
          <rect x="6" y="10" width="10" height="22" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.5"/>
          {/* Nose */}
          <path d="M6 11 Q6 2 11 1 Q16 2 16 11 Z" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="0.4"/>
          {/* Fins */}
          <path d="M6 26 L2 34 L6 31 Z" fill="#1e40af" stroke="#3b82f6" strokeWidth="0.4"/>
          <path d="M16 26 L20 34 L16 31 Z" fill="#1e40af" stroke="#3b82f6" strokeWidth="0.4"/>
          {/* Window */}
          <circle cx="11" cy="19" r="3" fill="#0c1445" stroke="#475569" strokeWidth="0.6"/>
          <circle cx="11" cy="19" r="1.8" fill="#0ea5e9" opacity="0.3"/>
          <ellipse cx="10" cy="18" rx="0.8" ry="0.6" fill="white" opacity="0.45"/>
          {/* Accent stripe */}
          <rect x="6" y="24" width="10" height="1.2" rx="0.3" fill="#CE3072" opacity="0.8"/>
        </svg>
      </div>
    </div>
  );
}