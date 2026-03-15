import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './Lineup.css';

gsap.registerPlugin(ScrollTrigger);

// Types 

export interface Exhibitor {
  id:          string;
  name:        string;
  role:        string;
  photo:       string;
  bio:         string;
  links:       { label: string; href: string; faIcon: string }[];
  designation: string;
  color:       string;
}

// Data — add more objects here, layout auto-recalculates 

export const DEMO_EXHIBITORS: Exhibitor[] = [
  {
    id: '01', name: 'Aria Chen', role: 'Astrophysics · Gr. 12',
    photo: '/headshots/aria-chen.png',
    bio: 'Built a backyard spectrometer from salvaged camera parts to classify stellar types on a $40 budget. Shortlisted for the Schulich Leader Scholarship.',
    links: [
      { label: 'GitHub', href: '#', faIcon: 'fa-brands fa-github' },
      { label: 'Email',  href: '#', faIcon: 'fa-solid fa-envelope' },
      { label: 'Paper',  href: '#', faIcon: 'fa-solid fa-file-lines' },
    ],
    designation: 'KSE-01', color: '#CE3072',
  },
  {
    id: '02', name: 'Marcus Osei', role: 'Robotics · Gr. 11',
    photo: '/headshots/marcus-osei.png',
    bio: 'Designed an autonomous soil-sampling rover using 3D-printed wheels and a Raspberry Pi brain, inspired by the Perseverance mission.',
    links: [
      { label: 'GitHub', href: '#', faIcon: 'fa-brands fa-github' },
      { label: 'Email',  href: '#', faIcon: 'fa-solid fa-envelope' },
      { label: 'Demo',   href: '#', faIcon: 'fa-solid fa-play' },
    ],
    designation: 'KSE-02', color: '#6789A3',
  },
  {
    id: '03', name: 'Priya Nair', role: 'Biochemistry · Gr. 12',
    photo: '/headshots/priya-nair.png',
    bio: 'Engineered a CRISPR-inspired lateral-flow biosensor detecting heavy metals in water for under $2 per test.',
    links: [
      { label: 'GitHub', href: '#', faIcon: 'fa-brands fa-github' },
      { label: 'Email',  href: '#', faIcon: 'fa-solid fa-envelope' },
      { label: 'Paper',  href: '#', faIcon: 'fa-solid fa-file-lines' },
    ],
    designation: 'KSE-03', color: '#9B5BBF',
  },
  {
    id: '04', name: 'Liam Bouchard', role: 'Computer Sci · Gr. 10',
    photo: '/headshots/liam-bouchard.png',
    bio: 'Trained a CNN to predict wildfire spread patterns using satellite imagery, outperforming existing heuristics on BC 2023 data.',
    links: [
      { label: 'GitHub', href: '#', faIcon: 'fa-brands fa-github' },
      { label: 'Email',  href: '#', faIcon: 'fa-solid fa-envelope' },
      { label: 'Demo',   href: '#', faIcon: 'fa-solid fa-play' },
    ],
    designation: 'KSE-04', color: '#CE3072',
  },
  {
    id: '05', name: 'Sofia Marchetti', role: 'Materials Sci · Gr. 11',
    photo: '/headshots/sofia-marchetti.png',
    bio: 'Synthesised a graphene-aerogel composite insulator for satellite thermal management at cryogenic temperatures.',
    links: [
      { label: 'GitHub', href: '#', faIcon: 'fa-brands fa-github' },
      { label: 'Email',  href: '#', faIcon: 'fa-solid fa-envelope' },
      { label: 'Paper',  href: '#', faIcon: 'fa-solid fa-file-lines' },
    ],
    designation: 'KSE-05', color: '#6789A3',
  },
  {
    id: '06', name: 'Jordan Kim', role: 'Environmental Sci · Gr. 12',
    photo: '/headshots/jordan-kim.png',
    bio: 'Deployed IoT sensors across the Rideau River tracking microplastic concentrations in real time via an open public dashboard.',
    links: [
      { label: 'GitHub', href: '#', faIcon: 'fa-brands fa-github' },
      { label: 'Email',  href: '#', faIcon: 'fa-solid fa-envelope' },
      { label: 'Live',   href: '#', faIcon: 'fa-solid fa-satellite-dish' },
    ],
    designation: 'KSE-06', color: '#9B5BBF',
  },
];

// Layout engine 

interface StarPos { x: number; y: number }

function seededRand(seed: number) {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function buildLayout(n: number): StarPos[] {
  if (n === 0) return [];
  if (n === 1) return [{ x: 50, y: 50 }];
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const r  = Math.sqrt((i + 0.5) / n);
    const th = i * golden;
    const jx = (seededRand(42 + i * 2)     - 0.5) * 7;
    const jy = (seededRand(42 + i * 2 + 1) - 0.5) * 7;
    return {
      x: Math.min(87, Math.max(13, 50 + r * 38 * Math.cos(th) + jx)),
      y: Math.min(87, Math.max(13, 50 + r * 38 * Math.sin(th) + jy)),
    };
  });
}

function buildEdges(pos: StarPos[]): [number, number][] {
  const n = pos.length;
  if (n < 2) return [];
  const d = (a: StarPos, b: StarPos) => Math.hypot(a.x - b.x, a.y - b.y);

  // Prim's MST
  const inTree = new Set([0]);
  const edges: [number, number][] = [];
  while (inTree.size < n) {
    let best = Infinity, bu = -1, bv = -1;
    for (const u of inTree) {
      for (let v = 0; v < n; v++) {
        if (inTree.has(v)) continue;
        const dd = d(pos[u], pos[v]);
        if (dd < best) { best = dd; bu = u; bv = v; }
      }
    }
    if (bv === -1) break;
    edges.push([bu, bv]);
    inTree.add(bv);
  }

  // Bonus cross-edges
  for (let i = 0; i < n; i++) {
    const sorted = Array.from({ length: n }, (_, j) => j)
      .filter(j => j !== i)
      .sort((a, b) => d(pos[i], pos[a]) - d(pos[i], pos[b]));
    let added = 0;
    for (const j of sorted) {
      if (added >= 1 || d(pos[i], pos[j]) > 40) break;
      if (!edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) {
        edges.push([i, j]); added++;
      }
    }
  }
  return edges;
}

// Component 

export function Lineup({ exhibitors = DEMO_EXHIBITORS }: { exhibitors?: Exhibitor[] }) {
  const sectionRef    = useRef<HTMLElement>(null);
  const mapRef        = useRef<HTMLDivElement>(null);
  const svgRef        = useRef<SVGSVGElement>(null);
  const nodeRefs      = useRef<(HTMLButtonElement | null)[]>([]);
  const modalRef      = useRef<HTMLDivElement>(null);
  const tooltipRef    = useRef<HTMLDivElement>(null);

  const [modal,    setModal]    = useState<number | null>(null);
  const [hovered,  setHovered]  = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState<Set<string>>(new Set());
  const [drawn,    setDrawn]    = useState(false);

  const positions = useMemo(() => buildLayout(exhibitors.length), [exhibitors.length]);
  const edges     = useMemo(() => buildEdges(positions),          [positions]);

  // SVG edge draw-on progress
  const edgeProgs = useRef<number[]>(edges.map(() => 0));
  useEffect(() => { edgeProgs.current = edges.map(() => 0); }, [edges.length]);

  // SVG line animation (no canvas, no RAF — just CSS stroke-dashoffset) 
  // We drive dashoffset via GSAP on the SVG paths directly — far cheaper.
  const svgLineRefs = useRef<(SVGLineElement | null)[]>([]);

  // Scroll entrance 
  useEffect(() => {
    gsap.set(['.lu-eyebrow', '.lu-title', '.lu-sub'], { opacity: 0, y: 22 });
    const nodes = nodeRefs.current.filter(Boolean);
    if (nodes.length) gsap.set(nodes, { scale: 0, opacity: 0 });

    const lines = svgLineRefs.current.filter(Boolean);
    if (lines.length) {
      lines.forEach(l => {
        if (!l) return;
        const len = l.getTotalLength?.() ?? 200;
        l.style.strokeDasharray  = `${len}`;
        l.style.strokeDashoffset = `${len}`;
      });
    }

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 72%',
      once: true,
      onEnter() {
        // Header
        gsap.timeline()
          .to('.lu-eyebrow', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
          .to('.lu-title',   { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.28')
          .to('.lu-sub',     { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.28');

        // Stars
        gsap.to(nodes, {
          scale: 1, opacity: 1,
          stagger: { each: 0.1, from: 'center' },
          duration: 0.6, ease: 'back.out(2.5)', delay: 0.4,
          onComplete() {
            // Draw SVG lines sequentially — cheap, no RAF needed
            svgLineRefs.current.forEach((l, ei) => {
              if (!l) return;
              const len = parseFloat(l.style.strokeDasharray) || 200;
              gsap.to(l, {
                strokeDashoffset: 0,
                duration: 0.6,
                delay: ei * 0.12,
                ease: 'power2.inOut',
                onComplete: () => { if (ei === svgLineRefs.current.length - 1) setDrawn(true); },
              });
            });
          },
        });
      },
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hover tooltip 
  const handleMouseEnter = useCallback((idx: number) => {
    setHovered(idx);
    const tip = tooltipRef.current;
    if (!tip) return;
    gsap.killTweensOf(tip);
    gsap.fromTo(tip,
      { opacity: 0, y: 8, scale: 0.94 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    const tip = tooltipRef.current;
    if (!tip) return;
    gsap.killTweensOf(tip);
    gsap.to(tip, { opacity: 0, y: 6, scale: 0.94, duration: 0.18, ease: 'power2.in' });
  }, []);

  // Modal open/close 
  const openModal = useCallback((idx: number) => {
    setModal(idx);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const m = modalRef.current;
      if (!m) return;

      gsap.killTweensOf(m.querySelectorAll('*'));

      const bd = m.closest('.lu-modal-backdrop') as HTMLElement | null;
      if (bd) gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });

      gsap.fromTo(m,
        { opacity: 0, scale: 0.88, y: 40, rotateX: -6 },
        { opacity: 1, scale: 1,    y: 0,  rotateX: 0, duration: 0.5, ease: 'power3.out' }
      );

      const tl = gsap.timeline({ delay: 0.1 });

      tl.fromTo('.lu-modal__scan',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.55, ease: 'power3.out', transformOrigin: 'left center' }
      );
      tl.fromTo('.lu-modal__desig',
        { opacity: 0, x: -16 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' },
        '-=0.3'
      );
      tl.fromTo('.lu-modal__photo-wrap',
        { scale: 0.6, opacity: 0, rotation: -8 },
        { scale: 1,   opacity: 1, rotation: 0,  duration: 0.5, ease: 'back.out(1.8)' },
        '-=0.15'
      );
      tl.fromTo(['.lu-modal__name', '.lu-modal__role'],
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, stagger: 0.08, duration: 0.4, ease: 'power3.out' },
        '-=0.3'
      );
      tl.fromTo('.lu-modal__divider',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.4, ease: 'power2.inOut', transformOrigin: 'left center' },
        '-=0.1'
      );
      tl.fromTo('.lu-modal__bio',
        { opacity: 0, y: 12, filter: 'blur(4px)' },
        { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' },
        '-=0.1'
      );
      tl.fromTo('.lu-modal__link',
        { opacity: 0, y: 14, scale: 0.9 },
        { opacity: 1, y: 0,  scale: 1, stagger: 0.07, duration: 0.35, ease: 'back.out(1.5)' },
        '-=0.1'
      );
      tl.fromTo(['.lu-c--tl', '.lu-c--tr', '.lu-c--bl', '.lu-c--br'],
        { opacity: 0, scale: 0 },
        { opacity: 1, scale: 1, stagger: 0.04, duration: 0.25, ease: 'back.out(2)' },
        '-=0.2'
      );

      // Magnitude dots fill in one by one from left
      tl.fromTo('.lu-modal__mag-dot',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.08, duration: 0.28, ease: 'back.out(3)' },
        '-=0.15'
      );

      // Mag label fades in last
      tl.fromTo('.lu-modal__mag-label',
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' },
        '-=0.05'
      );
    }));
  }, []);

  const closeModal = useCallback(() => {
    const m = modalRef.current;
    if (!m) return;
    const bd = m.closest('.lu-modal-backdrop') as HTMLElement | null;
    const tl = gsap.timeline({
      onComplete: () => {
        setModal(null);
        document.body.style.overflow = '';
      },
    });
    tl.to(m, { opacity: 0, scale: 0.92, y: 20, duration: 0.28, ease: 'power2.in' });
    if (bd) tl.to(bd, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '-=0.1');
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeModal]);

  const hovEx   = hovered !== null ? exhibitors[hovered]  : null;
  const modalEx = modal   !== null ? exhibitors[modal]    : null;

  // Get tooltip position relative to map
  const tooltipStyle = useMemo(() => {
    if (hovered === null) return {};
    const pos = positions[hovered];
    if (!pos) return {};
    // If star is in the right half, show tooltip to the left
    const leftSide = pos.x < 55;
    return {
      left: leftSide ? `calc(${pos.x}% + 32px)` : 'auto',
      right: leftSide ? 'auto' : `calc(${100 - pos.x}% + 32px)`,
      top: `calc(${pos.y}% - 20px)`,
    };
  }, [hovered, positions]);

  return (
    <section ref={sectionRef} id="lineup" className="lu">

      {/* CSS-only starfield — much cheaper than canvas RAF */}
      {/* <div className="lu__stars" aria-hidden="true">
        {Array.from({ length: 60 }, (_, i) => (
          <span
            key={i}
            className="lu__star"
            style={{
              left:            `${seededRand(i * 3)     * 100}%`,
              top:             `${seededRand(i * 3 + 1) * 100}%`,
              width:           `${seededRand(i * 3 + 2) * 2 + 0.5}px`,
              height:          `${seededRand(i * 3 + 2) * 2 + 0.5}px`,
              animationDelay:  `${seededRand(i * 7) * 4}s`,
              animationDuration:`${seededRand(i * 5) * 3 + 2}s`,
              opacity:          seededRand(i * 4) * 0.5 + 0.1,
            }}
          />
        ))}
      </div> */}
      <div className="lu__nebula" aria-hidden="true" />

      {/* Header */}
      <header className="lu__header">
        <p className="lu-eyebrow">
          <span className="lu-pip" />
          EXHIBITOR CONSTELLATION · {exhibitors.length} STARS
          <span className="lu-pip" />
        </p>
        <h2 className="lu-title">THE LINEUP</h2>
        <p className="lu-sub">Hover to preview · click to explore.</p>
      </header>

      {/* Map */}
      <div
        ref={mapRef}
        className="lu__map"
        style={{ '--n': exhibitors.length } as React.CSSProperties}
      >
        {/* SVG constellation lines — GSAP animates stroke-dashoffset directly */}
        <svg ref={svgRef} className="lu__svg" aria-hidden="true">
          <defs>
            <filter id="lu-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {edges.map(([ai, bi], ei) => {
            const a = positions[ai], b = positions[bi];
            if (!a || !b) return null;

            const isLit =
              hovered === ai || hovered === bi ||
              modal   === ai || modal   === bi;

            // Positions in % — SVG uses percentage viewBox via CSS
            return (
              <g key={ei}>
                {/* Glow layer */}
                <line
                  x1={`${a.x}%`} y1={`${a.y}%`}
                  x2={`${b.x}%`} y2={`${b.y}%`}
                  className={`lu-edge lu-edge--glow ${isLit ? 'lu-edge--lit' : ''}`}
                />
                {/* Animated dashed line */}
                <line
                  ref={el => { svgLineRefs.current[ei] = el; }}
                  x1={`${a.x}%`} y1={`${a.y}%`}
                  x2={`${b.x}%`} y2={`${b.y}%`}
                  className={`lu-edge lu-edge--dash ${isLit ? 'lu-edge--lit' : ''}`}
                />
              </g>
            );
          })}
        </svg>

        {/* Star nodes */}
        {exhibitors.map((e, i) => {
          const pos = positions[i] ?? { x: 50, y: 50 };
          const isHov = hovered === i;
          const isMod = modal   === i;

          return (
            <button
              key={e.id}
              ref={el => { nodeRefs.current[i] = el; }}
              className={`lu-node ${isHov ? 'lu-node--hov' : ''} ${isMod ? 'lu-node--active' : ''}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, '--nc': e.color } as React.CSSProperties}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              onClick={() => openModal(i)}
              aria-label={`View ${e.name}`}
            >
              {/* Halo layers */}
              <span className="lu-node__outer" />
              <span className="lu-node__mid"   />
              <span className="lu-node__core"  />

              {/* Spikes — CSS only, no conditional render for perf */}
              <span className="lu-node__spikes" aria-hidden="true">
                <span className="s s--h" /><span className="s s--v" />
                <span className="s s--d1" /><span className="s s--d2" />
              </span>

              {/* Pulse rings when active */}
              {isMod && (
                <>
                  <span className="lu-node__ring" />
                  <span className="lu-node__ring lu-node__ring--2" />
                </>
              )}

              {/* Name tag below */}
              <span className="lu-node__tag" aria-hidden="true">
                <span className="lu-node__tag-id">{e.designation}</span>
                <span className="lu-node__tag-name">{e.name}</span>
              </span>
            </button>
          );
        })}

        {/* Hover tooltip — absolutely positioned inside map */}
        <div
          ref={tooltipRef}
          className="lu-tooltip"
          style={{ ...tooltipStyle, opacity: 0, pointerEvents: 'none' } as React.CSSProperties}
          aria-hidden="true"
        >
          {hovEx && (
            <>
              <div className="lu-tooltip__top">
                {imgFailed.has(hovEx.id) ? (
                  <div className="lu-tooltip__avatar" style={{ '--tc': hovEx.color } as React.CSSProperties}>
                    {hovEx.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                ) : (
                  <img
                    src={hovEx.photo}
                    alt={hovEx.name}
                    className="lu-tooltip__photo"
                    onError={() => setImgFailed(s => new Set([...s, hovEx.id]))}
                  />
                )}
                <div>
                  <p className="lu-tooltip__name">{hovEx.name}</p>
                  <p className="lu-tooltip__role">{hovEx.role}</p>
                </div>
              </div>
              <p className="lu-tooltip__bio">
                {hovEx.bio.length > 90 ? hovEx.bio.slice(0, 88) + '…' : hovEx.bio}
              </p>
              <p className="lu-tooltip__cta">Click to explore →</p>
              <span className="lu-tooltip__corner lu-tooltip__corner--tl" style={{ '--tc': hovEx.color } as React.CSSProperties} />
              <span className="lu-tooltip__corner lu-tooltip__corner--tr" style={{ '--tc': hovEx.color } as React.CSSProperties} />
            </>
          )}
        </div>
      </div>

      {drawn && modal === null && hovered === null && (
        <p className="lu__hint">
          <span className="lu-pip lu-pip--sm" /> Hover to preview · click to explore
        </p>
      )}

      {/* Modal overlay */}
      {modal !== null && modalEx && (
        <div className="lu-modal-backdrop" onClick={closeModal}>
          <div
            ref={modalRef}
            className="lu-modal"
            style={{ '--mc': modalEx.color } as React.CSSProperties}
            onClick={e => e.stopPropagation()}
          >
            {/* Scan line — animates across top on open */}
            <div className="lu-modal__scan" />

            {/* Close */}
            <button className="lu-modal__close" onClick={closeModal} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>

            {/* Designation badge */}
            <div className="lu-modal__desig-wrap">
              <span className="lu-modal__desig-dot" />
              <span className="lu-modal__desig">{modalEx.designation}</span>
              <span className="lu-modal__desig-line" />
            </div>

            {/* Hero row: photo + identity */}
            <div className="lu-modal__hero">
              <div className="lu-modal__photo-wrap">
                {imgFailed.has(modalEx.id) ? (
                  <div className="lu-modal__avatar"
                    style={{ '--mc': modalEx.color } as React.CSSProperties}>
                    {modalEx.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                  </div>
                ) : (
                  <img
                    src={modalEx.photo}
                    alt={modalEx.name}
                    className="lu-modal__photo"
                    onError={() => setImgFailed(s => new Set([...s, modalEx.id]))}
                  />
                )}
                {/* Orbit rings */}
                <div className="lu-modal__orbit lu-modal__orbit--1" />
                <div className="lu-modal__orbit lu-modal__orbit--2" />
                {/* Cross-hair spikes */}
                <div className="lu-modal__crosshair" aria-hidden="true">
                  <span className="lu-modal__ch-h" />
                  <span className="lu-modal__ch-v" />
                </div>
              </div>

              <div className="lu-modal__identity">
                <h3 className="lu-modal__name">{modalEx.name}</h3>
                <p  className="lu-modal__role">{modalEx.role}</p>
                {/* Stellar magnitude rating */}
                <div className="lu-modal__mag" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, mi) => (
                    <span
                      key={mi}
                      className={`lu-modal__mag-dot ${mi < 4 ? 'lu-modal__mag-dot--on' : ''}`}
                      style={{ animationDelay: `${mi * 0.08}s` } as React.CSSProperties}
                    />
                  ))}
                  <span className="lu-modal__mag-label">Stellar Magnitude</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="lu-modal__divider" />

            {/* Bio */}
            <p className="lu-modal__bio">{modalEx.bio}</p>

            {/* Links */}
            <div className="lu-modal__links">
              {modalEx.links.map((lk: { label: string; href: string; faIcon: string }) => (
                <a key={lk.label} href={lk.href} className="lu-modal__link"
                  target="_blank" rel="noopener noreferrer"
                  style={{ '--lc': modalEx.color } as React.CSSProperties}>
                  <i className={`${lk.faIcon} lu-modal__link-icon`} />
                  <span>{lk.label}</span>
                </a>
              ))}
            </div>

            {/* Corner accents */}
            <span className="lu-c lu-c--tl" />
            <span className="lu-c lu-c--tr" />
            <span className="lu-c lu-c--bl" />
            <span className="lu-c lu-c--br" />
          </div>
        </div>
      )}

    </section>
  );
}