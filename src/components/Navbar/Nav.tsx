import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, ScrollTrigger } from "../../utils/gsap";
import "./Nav.css";

// Config

const LINKS = [
  { id: "hero", label: "Home", mag: 6.5, greekLetter: "α" },
  { id: "about", label: "About", mag: 4.8, greekLetter: "β" },
  { id: "lineup", label: "Lineup", mag: 5.6, greekLetter: "γ" },
  { id: "practical-info", label: "Info", mag: 3.9, greekLetter: "δ" },
  { id: "faq", label: "FAQ", mag: 4.2, greekLetter: "ε" },
  { id: "register", label: "Register", mag: 5.1, greekLetter: "ζ" },
];

// Mobile constellation layout
// Stars are laid out in a VERTICAL chain that mirrors the page order:
// top → Home, then down → About → Lineup → Info → FAQ → Register at bottom.
// This creates a natural "path through the website" constellation.
//
// Each zone is [leftMin%, leftMax%, topMin%, topMax%]
// We intentionally stagger left/right so the constellation has zigzag depth.
const SITE_ZONES: [number, number, number, number][] = [
  [42, 58, 10, 16], // 0 Home     — top centre
  [14, 30, 20, 30], // 1 About    — upper left
  [68, 82, 28, 38], // 2 Lineup   — upper right
  [18, 32, 45, 54], // 3 Info     — mid left
  [64, 78, 54, 63], // 4 FAQ      — mid right
  [40, 60, 72, 80], // 5 Register — bottom centre
];

// Edges connect in website order: 0→1→2→3→4→5
// Plus a few cross-braces for constellation feel
const MOBILE_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5], // spine
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5], // cross braces
];

function generatePositions(): [number, number][] {
  return SITE_ZONES.map(([lMin, lMax, tMin, tMax]) => [
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
  const sz = mag * 5 * scale;
  const lit = active || hovered;

  return (
    <svg
      className={`star-dot ${lit ? "star-dot--lit" : ""} ${active ? "star-dot--active" : ""}`}
      width={sz}
      height={sz}
      viewBox={`0 0 ${sz} ${sz}`}
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
            y2={sz}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.7}
            opacity={0.45}
            className="star-spike"
          />
          <line
            x1={0}
            y1={cx}
            x2={sz}
            y2={cx}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.7}
            opacity={0.45}
            className="star-spike"
          />
          <line
            x1={sz * 0.16}
            y1={sz * 0.16}
            x2={sz * 0.84}
            y2={sz * 0.84}
            stroke={active ? "#CE3072" : "white"}
            strokeWidth={0.4}
            opacity={0.22}
          />
          <line
            x1={sz * 0.84}
            y1={sz * 0.16}
            x2={sz * 0.16}
            y2={sz * 0.84}
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

  const [active, setActive] = useState("hero");
  const [hovered, setHovered] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [starPositions, setStarPositions] =
    useState<[number, number][]>(generatePositions);

  const tickRef = useRef(false);
  const drawProgress = useRef(0);
  const rafRef = useRef(0);
  const overlayRafRef = useRef(0);
  const menuOpenRef = useRef(false);
  const lineProgress = useRef<number[]>(MOBILE_EDGES.map(() => 0));
  const starPositionsRef = useRef<[number, number][]>(generatePositions());

  useEffect(() => {
    starPositionsRef.current = starPositions;
  }, [starPositions]);

  // Nav entrance
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

  // Desktop canvas constellation
  useEffect(() => {
    const canvas = canvasRef.current;
    const nav = navRef.current;
    if (!canvas || !nav) return;

    let cachedCentres: { x: number; y: number }[] = [];
    let centresDirty = true;
    let lastInvalidate = 0;
    let isVisible = true;

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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // cap DPR
      const w = nav.offsetWidth,
        h = nav.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.getContext("2d")!.scale(dpr, dpr);
      centresDirty = true;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Throttled scroll invalidation — only re-measure every 100ms
    const onScroll = () => {
      const now = performance.now();
      if (now - lastInvalidate > 100) {
        centresDirty = true;
        lastInvalidate = now;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Pause drawing when tab is hidden
    const onVisibility = () => {
      isVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);

      // Skip entirely when tab is hidden
      if (!isVisible) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const { width: W, height: H } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, W, H);

      if (centresDirty) {
        cachedCentres = getCentres();
        centresDirty = false;
      }
      const centres = cachedCentres;
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

        // Glow layer — skip ctx.filter (expensive), use a semi-transparent wider line instead
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = "#6789A3";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        // Dashed animated march
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "#8ab4d4";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.lineDashOffset = -(Date.now() * 0.012) % 28;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.restore();

        // Solid spine
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
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Mobile overlay canvas
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

      const positions = starPositionsRef.current.map(([lp, tp]) => ({
        x: (lp / 100) * W,
        y: (tp / 100) * H,
      }));

      MOBILE_EDGES.forEach(([ai, bi], ei) => {
        const prog = lineProgress.current[ei];
        if (prog <= 0) return;
        const a = positions[ai],
          b = positions[bi];
        const ex = a.x + (b.x - a.x) * prog,
          ey = a.y + (b.y - a.y) * prog;

        // Glow
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
        // Mid
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
        // Dashed
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
        // Solid
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

  // Scroll lock
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

  // Open / Close
  const openMenu = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rocketWrap = document.querySelector<HTMLElement>(".rocket-wrap");
    if (rocketWrap) rocketWrap.classList.add("rocket-wrap--hidden");

    menuOpenRef.current = true;
    setMenuOpen(true);

    const newPos = generatePositions();
    setStarPositions(newPos);
    starPositionsRef.current = newPos;
    lineProgress.current = MOBILE_EDGES.map(() => 0);

    gsap.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: "power2.out" },
    );

    // Stars burst in staggered
    mobileStarRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.55,
          delay: 0.08 + i * 0.1,
          ease: "back.out(2.5)",
        },
      );
    });

    // Edges draw sequentially (spine first, then braces)
    MOBILE_EDGES.forEach((_, ei) => {
      gsap.to(lineProgress.current, {
        [ei]: 1,
        duration: 0.55,
        delay: 0.4 + ei * 0.1,
        ease: "power2.inOut",
      });
    });

    // Burger → X
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

    mobileStarRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        delay: i * 0.04,
        ease: "power2.in",
      });
    });
    MOBILE_EDGES.forEach((_, ei) => {
      gsap.to(lineProgress.current, {
        [ei]: 0,
        duration: 0.25,
        ease: "power2.in",
      });
    });
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.35,
      delay: 0.2,
      ease: "power2.in",
      onComplete: () => {
        menuOpenRef.current = false;
        setMenuOpen(false);
        const rocketWrap = document.querySelector<HTMLElement>(".rocket-wrap");
        if (rocketWrap) rocketWrap.classList.remove("rocket-wrap--hidden");
      },
    });

    // X → Burger
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
      {/* Desktop / top bar */}
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

        {/* Desktop strip */}
        <span className="nav__divider nav__desktop-only" aria-hidden="true" />
        <div className="nav__strip nav__desktop-only">
          {LINKS.map(({ id, label, mag, greekLetter }) => {
            const isActive = active === id;
            const isHovered = hovered === id;
            return (
              <button
                key={id}
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
          onClick={() => handleClick("register")}
        >
          <span className="nav__cta-text">Register</span>
          <span className="nav__cta-icon" aria-hidden="true">
            ↗
          </span>
        </button>

        {/* Hamburger */}
        <button
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
        {/* Constellation lines canvas */}
        <canvas ref={overlayCanvas} className="nav__overlay-canvas" />

        {/* Ambient nebula */}
        <div className="nav__overlay-bg" />

        {/* Site title watermark */}
        <div className="nav__overlay-watermark" aria-hidden="true">
          SUMMIT EXPO
        </div>

        {/* Star nodes */}
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
              style={{
                left: `${lp}%`,
                top: i === 0 ? "80px" : `${tp}%`,
              }}
              onClick={() => handleClick(id)}
            >
              <span className="overlay-star__greek">{greekLetter}</span>
              <span className="overlay-star__dot">
                <StarDot mag={mag} active={isActive} hovered={false} large />
              </span>
              <span className="overlay-star__label">{label}</span>
              <span className="overlay-star__dist">
                {(mag * 12.4).toFixed(1)} ly
              </span>
              {isActive && (
                <>
                  <span className="overlay-star__pulse" />
                  <span className="overlay-star__pulse overlay-star__pulse--2" />
                </>
              )}
            </button>
          );
        })}

        {/* Close button — bottom-right corner, always above constellation */}
        <button
          className="nav__overlay-close"
          onClick={closeMenu}
          aria-label="Close menu"
        >
          <span className="nav__overlay-close__x" aria-hidden="true">
            ✕
          </span>
          <span className="nav__overlay-close__label">Close</span>
        </button>
      </div>
    </>
  );
}
