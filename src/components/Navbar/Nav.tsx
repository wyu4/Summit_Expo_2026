import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Nav.css";

gsap.registerPlugin(ScrollTrigger);

// Config

const LINKS = [
  { id: "hero", label: "Home", mag: 6.5, greekLetter: "α" },
  { id: "about", label: "About", mag: 4.8, greekLetter: "β" },
  { id: "lineup", label: "Lineup", mag: 5.6, greekLetter: "γ" },
  { id: "logistics", label: "Logistics", mag: 3.9, greekLetter: "δ" },
  { id: "contact", label: "Contact", mag: 5.1, greekLetter: "ε" },
];


// Edges connecting the stars in order for constellation lines
const MOBILE_EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 4],
];

// Corner zones — each nav item always appears in its screen region,
// but at a random point within that zone each time the menu opens.
// [leftMin%, leftMax%, topMin%, topMax%]
const CORNER_ZONES: [number, number, number, number][] = [
  [38, 62, 8, 18], // 0 Home      — top centre
  [8, 28, 28, 48], // 1 About     — left mid
  [72, 92, 22, 42], // 2 Lineup    — right upper
  [10, 30, 58, 74], // 3 Logistics — lower left
  [62, 82, 60, 76], // 4 Contact   — lower right
];

function generateConstellationPositions(): [number, number][] {
  return CORNER_ZONES.map(([lMin, lMax, tMin, tMax]) => [
    lMin + Math.random() * (lMax - lMin),
    tMin + Math.random() * (tMax - tMin),
  ]);
}

// Star SVG

function StarDot({
  mag,
  active,
  hovered,
  large = false,
}: {
  mag: number;
  active: boolean;
  hovered: boolean;
  large?: boolean;
}) {
  const scale = large ? 2.2 : 1;
  const r = mag * 0.9 * scale;
  const cx = mag * 2.5 * scale;
  const size = mag * 5 * scale;
  const lit = active || hovered;

  return (
    <svg
      className={`star-dot ${lit ? "star-dot--lit" : ""} ${active ? "star-dot--active" : ""}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      overflow="visible"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r * 3.8}
        fill={active ? "#CE3072" : "white"}
        opacity={lit ? 0.1 : 0.04}
        className="star-halo-outer"
      />
      <circle
        cx={cx}
        cy={cx}
        r={r * 2}
        fill={active ? "#CE3072" : "white"}
        opacity={lit ? 0.22 : 0.08}
        className="star-halo-mid"
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill={active ? "#CE3072" : "white"}
        className="star-core"
      />
      {lit && (
        <>
          <line
            x1={cx}
            y1={0}
            x2={cx}
            y2={size}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.7}
            opacity={0.45}
            className="star-spike"
          />
          <line
            x1={0}
            y1={cx}
            x2={size}
            y2={cx}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.7}
            opacity={0.45}
            className="star-spike"
          />
          <line
            x1={size * 0.16}
            y1={size * 0.16}
            x2={size * 0.84}
            y2={size * 0.84}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.4}
            opacity={0.22}
          />
          <line
            x1={size * 0.84}
            y1={size * 0.16}
            x2={size * 0.16}
            y2={size * 0.84}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.4}
            opacity={0.22}
          />
        </>
      )}
    </svg>
  );
}

// Component

export function Nav() {
  const navRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const overlayCanvas = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const mobileStarRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const burgerRef = useRef<HTMLButtonElement>(null);

  const [active, setActive] = useState("hero");
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [starPositions, setStarPositions] = useState<[number, number][]>(
    generateConstellationPositions,
  );

  // Keep ref in sync so the canvas RAF can read latest positions
  useEffect(() => {
    starPositionsRef.current = starPositions;
  }, [starPositions]);

  const tickRef = useRef(false);
  const drawProgress = useRef(0);
  const rafRef = useRef(0);
  const overlayRafRef = useRef(0);
  const menuOpenRef = useRef(false);
  const lineProgress = useRef<number[]>(MOBILE_EDGES.map(() => 0));
  const starPositionsRef = useRef<[number, number][]>(
    generateConstellationPositions(),
  );

  // Entrance
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    gsap.set(nav, { xPercent: -50, yPercent: -130, opacity: 0 });

    const st = ScrollTrigger.create({
      start: () => window.innerHeight * 5.5,
      onEnter() {
        gsap.to(nav, {
          xPercent: -50,
          yPercent: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out",
        });
        gsap.to(drawProgress, {
          current: 1,
          duration: 1.6,
          delay: 0.5,
          ease: "power2.inOut",
        });
        gsap.fromTo(
          ".nav__item",
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            stagger: 0.1,
            duration: 0.55,
            ease: "back.out(2.8)",
            delay: 0.35,
          },
        );
      },
      onLeaveBack() {
        gsap.to(nav, {
          xPercent: -50,
          yPercent: -130,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        });
        drawProgress.current = 0;
      },
    });
    return () => st.kill();
  }, []);

  // Active section tracking
  useEffect(() => {
    const onScroll = () => {
      if (tickRef.current) return;
      tickRef.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > window.innerHeight * 6);
        const thresh = window.innerHeight * 0.3;
        let best = LINKS[0].id,
          bestD = Infinity;
        LINKS.forEach(({ id }) => {
          const el = document.getElementById(id);
          if (!el) return;
          const d = Math.abs(el.getBoundingClientRect().top - thresh);
          if (d < bestD) {
            bestD = d;
            best = id;
          }
        });
        setActive(best);
        tickRef.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Desktop canvas draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const nav = navRef.current;
    if (!canvas || !nav) return;

    const getCentres = () => {
      const navRect = nav.getBoundingClientRect();
      return LINKS.map(({ id }) => {
        const el = nodeRefs.current[id];
        if (!el) return { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - navRect.left,
          y: r.top + r.height / 2 - navRect.top,
        };
      });
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = nav.offsetWidth,
        h = nav.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.getContext("2d")!.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width: W, height: H } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, W, H);
      const centres = getCentres();
      const prog = drawProgress.current;
      if (prog <= 0) return;
      const total = centres.length - 1;
      for (let i = 0; i < total; i++) {
        const sp = Math.max(0, Math.min(1, (prog - i / total) / (1 / total)));
        if (sp <= 0) continue;
        const a = centres[i],
          b = centres[i + 1];
        const ex = a.x + (b.x - a.x) * sp,
          ey = a.y + (b.y - a.y) * sp;

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#6789A3";
        ctx.lineWidth = 3;
        ctx.filter = "blur(3px)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "#8ab4d4";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -Date.now() * 0.012;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = "rgba(180,220,255,0.75)";
        ctx.lineWidth = 0.75;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Mobile overlay canvas draw
  useEffect(() => {
    const canvas = overlayCanvas.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.getContext("2d")!.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const draw = () => {
      overlayRafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = window.innerWidth,
        H = window.innerHeight;
      ctx.clearRect(0, 0, W, H);

      if (!menuOpenRef.current) return;

      // Get star positions in px — reads from ref so it always uses latest layout
      const positions = starPositionsRef.current.map(([lp, tp]) => ({
        x: (lp / 100) * W,
        y: (tp / 100) * H,
      }));

      MOBILE_EDGES.forEach(([ai, bi], ei) => {
        const prog = lineProgress.current[ei];
        if (prog <= 0) return;
        const a = positions[ai],
          b = positions[bi];
        const ex = a.x + (b.x - a.x) * prog;
        const ey = a.y + (b.y - a.y) * prog;

        // Outer glow
        ctx.save();
        ctx.globalAlpha = 0.18 * prog;
        ctx.strokeStyle = "#CE3072";
        ctx.lineWidth = 6;
        ctx.filter = "blur(6px)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        // Mid glow
        ctx.save();
        ctx.globalAlpha = 0.35 * prog;
        ctx.strokeStyle = "#8ab4d4";
        ctx.lineWidth = 2;
        ctx.filter = "blur(2px)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        // Dashed animated line
        ctx.save();
        ctx.globalAlpha = 0.65 * prog;
        ctx.strokeStyle = "rgba(180,220,255,0.85)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = -Date.now() * 0.008;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        // Crisp solid core
        ctx.save();
        ctx.globalAlpha = 0.5 * prog;
        ctx.strokeStyle = "rgba(220,240,255,0.9)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();
      });
    };
    overlayRafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(overlayRafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Scroll lock when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [menuOpen]);
  // Mobile menu open/close with GSAP
  const openMenu = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    menuOpenRef.current = true;
    setMenuOpen(true);

    // Generate fresh constellation layout every open
    const newPositions = generateConstellationPositions();
    setStarPositions(newPositions);
    starPositionsRef.current = newPositions;

    // Reset line progress
    lineProgress.current = MOBILE_EDGES.map(() => 0);

    // Fade in overlay background
    gsap.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" },
    );

    // Animate each star node in from its position
    mobileStarRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.55,
          delay: 0.1 + i * 0.12,
          ease: "back.out(2.5)",
        },
      );
    });

    // Draw lines sequentially after stars appear
    MOBILE_EDGES.forEach((_, ei) => {
      gsap.to(lineProgress.current, {
        [ei]: 1,
        duration: 0.6,
        delay: 0.5 + ei * 0.15,
        ease: "power2.inOut",
      });
    });

    // Animate burger → X
    gsap.to(".burger-bar-1", {
      rotation: 45,
      y: 7,
      duration: 0.3,
      ease: "power2.inOut",
    });
    gsap.to(".burger-bar-2", { opacity: 0, x: 8, duration: 0.2 });
    gsap.to(".burger-bar-3", {
      rotation: -45,
      y: -7,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, []);

  const closeMenu = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Fade out stars
    mobileStarRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        delay: i * 0.05,
        ease: "power2.in",
      });
    });

    // Fade lines out
    MOBILE_EDGES.forEach((_, ei) => {
      gsap.to(lineProgress.current, {
        [ei]: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    });

    // Fade overlay
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.4,
      delay: 0.25,
      ease: "power2.in",
      onComplete: () => {
        menuOpenRef.current = false;
        setMenuOpen(false);
      },
    });

    // Burger → hamburger
    gsap.to(".burger-bar-1", {
      rotation: 0,
      y: 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
    gsap.to(".burger-bar-2", { opacity: 1, x: 0, duration: 0.2, delay: 0.1 });
    gsap.to(".burger-bar-3", {
      rotation: 0,
      y: 0,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    if (menuOpenRef.current) closeMenu();
    else openMenu();
  }, [openMenu, closeMenu]);

  const handleClick = useCallback(
    (id: string) => {
      closeMenu();
      setTimeout(() => {
        if (id === "hero") window.scrollTo({ top: 0, behavior: "smooth" });
        else
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    },
    [closeMenu],
  );

  return (
    <>
      {/* Desktop + mobile top bar */}
      <nav
        ref={navRef}
        className={`nav ${scrolled ? "nav--solid" : ""} ${menuOpen ? "nav--hidden" : ""}`}
        aria-label="Site navigation"
      >
        <canvas ref={canvasRef} className="nav__canvas" aria-hidden="true" />

        {/* Logo */}
        <button className="nav__logo" onClick={() => handleClick("hero")}>
          <span className="nav__logo-star" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="nav__logo-svg"
            >
              <circle
                cx="10"
                cy="10"
                r="8.5"
                fill="#CE3072"
                opacity="0.10"
                className="logo-halo"
              />
              <circle cx="10" cy="10" r="4.5" fill="#CE3072" opacity="0.25" />
              <circle cx="10" cy="10" r="2" fill="#CE3072" />
              <line
                x1="10"
                y1="0.5"
                x2="10"
                y2="19.5"
                stroke="#CE3072"
                strokeWidth="0.9"
                opacity="0.5"
              />
              <line
                x1="0.5"
                y1="10"
                x2="19.5"
                y2="10"
                stroke="#CE3072"
                strokeWidth="0.9"
                opacity="0.5"
              />
              <line
                x1="3"
                y1="3"
                x2="17"
                y2="17"
                stroke="#CE3072"
                strokeWidth="0.55"
                opacity="0.28"
              />
              <line
                x1="17"
                y1="3"
                x2="3"
                y2="17"
                stroke="#CE3072"
                strokeWidth="0.55"
                opacity="0.28"
              />
            </svg>
          </span>
          <span className="nav__logo-text">
            SUMMIT<em>EXPO</em>
          </span>
        </button>

        {/* Desktop: divider + star strip + CTA */}
        <span className="nav__divider nav__desktop-only" aria-hidden="true" />

        <div className="nav__strip nav__desktop-only">
          {LINKS.map(({ id, label, mag, greekLetter }) => {
            const isActive = active === id;
            const isHovered = hovered === id;
            return (
              <button
                key={id}
                data-id={id}
                ref={(el) => {
                  nodeRefs.current[id] = el;
                }}
                className={`nav__item ${isActive ? "nav__item--active" : ""}`}
                onClick={() => handleClick(id)}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="nav__item-greek">{greekLetter}</span>
                <span className="nav__item-star">
                  <StarDot mag={mag} active={isActive} hovered={isHovered} />
                </span>
                <span className="nav__item-label">{label}</span>
                {isActive && (
                  <>
                    <span className="nav__item-orbit" aria-hidden="true" />
                    <span
                      className="nav__item-orbit nav__item-orbit--2"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            );
          })}
        </div>

        <button
          className="nav__cta nav__desktop-only"
          onClick={() => handleClick("about")}
        >
          <span className="nav__cta-text">Register</span>
          <span className="nav__cta-icon" aria-hidden="true">
            ↗
          </span>
        </button>

        {/* Hamburger — mobile only */}
        <button
          ref={burgerRef}
          className="nav__burger nav__mobile-only"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span className="burger-bar burger-bar-1" />
          <span className="burger-bar burger-bar-2" />
          <span className="burger-bar burger-bar-3" />
        </button>
      </nav>

      {/* Mobile constellation overlay */}
      <div
        ref={overlayRef}
        className="nav__overlay"
        aria-hidden={!menuOpen}
        style={{ pointerEvents: menuOpen ? "auto" : "none", opacity: 0 }}
      >
        {/* Star background canvas — lines live here */}
        <canvas ref={overlayCanvas} className="nav__overlay-canvas" />

        {/* Ambient background particles */}
        <div className="nav__overlay-bg" />

        {/* Star nodes — absolutely positioned */}
        {LINKS.map(({ id, label, mag, greekLetter }, i) => {
          const [lp, tp] = starPositions[i] ?? [50, 50];
          const isActive = active === id;
          return (
            <button
              key={id}
              ref={(el) => {
                mobileStarRefs.current[i] = el;
              }}
              className={`nav__overlay-star ${isActive ? "nav__overlay-star--active" : ""}`}
              style={{ left: `${lp}%`, top: `${tp}%` }}
              onClick={() => handleClick(id)}
            >
              {/* Greek designation */}
              <span className="overlay-star__greek">{greekLetter}</span>

              {/* Star dot — larger for the overlay */}
              <span className="overlay-star__dot">
                <StarDot mag={mag} active={isActive} hovered={false} large />
              </span>

              {/* Label below */}
              <span className="overlay-star__label">{label}</span>

              {/* Distance marker — decorative */}
              <span className="overlay-star__dist">
                {(mag * 12.4).toFixed(1)} ly
              </span>

              {/* Active pulse rings */}
              {isActive && (
                <>
                  <span className="overlay-star__pulse" />
                  <span className="overlay-star__pulse overlay-star__pulse--2" />
                </>
              )}
            </button>
          );
        })}

        {/* Close hint at bottom */}
        <button className="nav__overlay-close" onClick={closeMenu}>
          <span>✕</span>
          <span className="overlay-close__label">Close</span>
        </button>
      </div>
    </>
  );
}
