import { useEffect, useRef, useCallback } from "react";
import {gsap, ScrollTrigger} from "../../utils/gsap";
import "./Hero.css";

const STAR_COUNT = 300;
const TAU = Math.PI * 2;

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinklePhase: number;
  twinkleSpeed: number;
  parallaxFactor: number;
}

function makeStar(): Star {
  let x: number, y: number;
  let attempts = 0;
  do {
    x = Math.random();
    y = Math.random();
    attempts++;
  } while (attempts < 40 && x > 0.28 && x < 0.72 && y > 0.18 && y < 0.82);
  return {
    x,
    y,
    size: Math.random() * 1.2 + 0.25,
    opacity: Math.random() * 0.32 + 0.1,
    twinklePhase: Math.random() * TAU,
    twinkleSpeed: Math.random() * 1.2 + 0.4,
    parallaxFactor: Math.random() * 0.5 + 0.05,
  };
}

const C_STARS = [
  { x: 500, y: 20, r: 7.0 },
  { x: 160, y: 90, r: 5.0 },
  { x: 840, y: 90, r: 5.0 },
  { x: 80, y: 260, r: 4.2 },
  { x: 920, y: 260, r: 4.2 },
  { x: 140, y: 380, r: 4.0 },
  { x: 860, y: 380, r: 4.0 },
  { x: 280, y: 520, r: 4.5 },
  { x: 720, y: 520, r: 4.5 },
  { x: 500, y: 558, r: 5.5 },
] as const;

const C_EDGES: readonly [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [5, 7],
  [6, 8],
  [7, 9],
  [8, 9],
] as const;

export function Hero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const consvgRef = useRef<SVGSVGElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dissolveRef = useRef<HTMLDivElement>(null);
  const horizonRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const ctaLinesRef = useRef<HTMLCanvasElement>(null);
  const ctaNodeRefs = useRef<(HTMLAnchorElement | null)[]>([null, null, null]);
  const ctasRef = useRef<HTMLDivElement>(null);

  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef(0);
  const clock = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseTgtRef = useRef({ x: 0.5, y: 0.5 });
  const warpRef = useRef({ v: 1.0 });
  // ← ADDED: lets render() schedule through the guard
  const guardedRenderRef = useRef<() => void>(() => {});

  /* Canvas render loop */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { w: W, h: H } = sizeRef.current;
    if (!W) {
      // size not ready yet — schedule through guard so pause logic still applies
      rafRef.current = requestAnimationFrame(() => guardedRenderRef.current());
      return;
    }

    clock.current += 0.012;
    const t = clock.current;
    const warp = warpRef.current.v;

    mouseRef.current.x += (mouseTgtRef.current.x - mouseRef.current.x) * 0.055;
    mouseRef.current.y += (mouseTgtRef.current.y - mouseRef.current.y) * 0.055;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    ctx.globalAlpha = 1;
    if (warp > 0.06) {
      ctx.fillStyle = `rgba(6,4,15,${Math.min(0.12 + warp * 0.18, 0.42)})`;
    } else {
      ctx.fillStyle = "rgba(6,4,15,0.022)";
    }
    ctx.fillRect(0, 0, W, H);

    const CX = W * 0.5,
      CY = H * 0.5;

    if (warp > 0.06) {
      ctx.lineCap = "round";
      for (const s of starsRef.current) {
        const sx = s.x * W,
          sy = s.y * H;
        const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const al = s.opacity * tw * Math.min(warp, 1);
        const streak = warp * warp * 120;
        const dx = sx - CX,
          dy = sy - CY;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        ctx.strokeStyle = `rgba(255,255,255,${al * 0.85})`;
        ctx.lineWidth = s.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(sx - (dx / d) * streak, sy - (dy / d) * streak);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
    }

    for (const s of starsRef.current) {
      const PRANGE = 0.02;
      const sx = (s.x + (mx - 0.5) * PRANGE * s.parallaxFactor) * W;
      const sy = (s.y + (my - 0.5) * PRANGE * s.parallaxFactor) * H;
      const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
      const al = Math.min(s.opacity * tw * (1 - warp * 0.35), 0.42);
      const r = s.size * (1 - warp * 0.2);

      ctx.fillStyle = `rgba(255,255,255,${al * 0.06})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r * 3.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${al})`;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.fill();
    }

    if (warp > 0.02) {
      for (const s of starsRef.current) {
        const dx = s.x - 0.5,
          dy = s.y - 0.5;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        s.x += (dx / d) * 0.0018 * warp * 3;
        s.y += (dy / d) * 0.0018 * warp * 3;
        if (s.x < -0.08 || s.x > 1.08 || s.y < -0.08 || s.y > 1.08) {
          Object.assign(s, makeStar());
        }
      }
    }

    const svg = consvgRef.current;
    if (svg) {
      const shiftX = (mx - 0.5) * -22;
      const shiftY = (my - 0.5) * -14;
      svg.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
    }

    // ← Schedule through guard so visibility/intersection pause works every frame
    rafRef.current = requestAnimationFrame(() => guardedRenderRef.current());
  }, []);

  /* Mount / cleanup */
  useEffect(() => {
    const canvas = canvasRef.current!;
    const DPR = Math.min(window.devicePixelRatio, 1.5);

    const resize = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.getContext("2d")!.scale(DPR, DPR);
      sizeRef.current = { w, h };
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    starsRef.current = Array.from({ length: STAR_COUNT }, makeStar);

    // Pause when tab hidden
    let isVisible = true;
    const onVisibility = () => {
      isVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Pause when hero scrolled fully off screen
    let heroInView = true;
    const heroObs = new IntersectionObserver(
      ([entry]) => {
        heroInView = entry.isIntersecting;
      },
      { rootMargin: "200px" },
    );
    heroObs.observe(pinRef.current ?? canvas);

    const guardedRender = () => {
      if (isVisible && heroInView) {
        render();
      } else {
        rafRef.current = requestAnimationFrame(guardedRender);
      }
    };
    // Wire the ref so render() can schedule back through the guard
    guardedRenderRef.current = guardedRender;
    rafRef.current = requestAnimationFrame(guardedRender);

    const onMouse = (e: MouseEvent) => {
      mouseTgtRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      document.removeEventListener("visibilitychange", onVisibility);
      heroObs.disconnect();
    };
  }, [render]);

  /* CTA lines canvas */
  useEffect(() => {
    const canvas = ctaLinesRef.current;
    if (!canvas) return;
    let raf = 0;
    let travelT = 0;

    const getNodeCentres = () => {
      const parent = canvas.parentElement;
      if (!parent) return null;
      const parentRect = parent.getBoundingClientRect();
      return ctaNodeRefs.current.map((el) => {
        if (!el) return null;
        const nodeEl = el.querySelector(".hscta-node") as HTMLElement | null;
        const r = (nodeEl ?? el).getBoundingClientRect();
        return {
          x: r.left + r.width / 2 - parentRect.left,
          y: r.top + r.height / 2 - parentRect.top,
        };
      });
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const parent = canvas.parentElement;
      if (!parent) return;

      const DPR = Math.min(window.devicePixelRatio, 1.5); // capped
      const pw = parent.offsetWidth;
      const ph = parent.offsetHeight;

      if (canvas.width !== Math.round(pw * DPR)) {
        canvas.width = Math.round(pw * DPR);
        canvas.height = Math.round(ph * DPR);
        canvas.style.width = `${pw}px`;
        canvas.style.height = `${ph}px`;
        canvas.getContext("2d")!.scale(DPR, DPR);
      }

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, pw, ph);

      const centres = getNodeCentres();
      if (!centres || centres.some((c) => !c)) return;
      const [A, B, C] = centres as { x: number; y: number }[];

      const NODE_RADIUS = 18;

      const drawBase = (
        p1: { x: number; y: number },
        p2: { x: number; y: number },
      ) => {
        const dx = p2.x - p1.x,
          dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist,
          uy = dy / dist;
        const start = {
          x: p1.x + ux * NODE_RADIUS,
          y: p1.y + uy * NODE_RADIUS,
        };
        const end = { x: p2.x - ux * NODE_RADIUS, y: p2.y - uy * NODE_RADIUS };

        // Glow — wide low-alpha line instead of ctx.filter blur (much cheaper)
        ctx.save();
        ctx.strokeStyle = "rgba(103,137,163,0.10)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.restore();

        // Dashed animated march
        ctx.save();
        ctx.strokeStyle = "rgba(160,210,255,0.32)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 9]);
        ctx.lineDashOffset = -((Date.now() * 0.012) % 28);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.restore();

        // Solid spine
        ctx.save();
        ctx.strokeStyle = "rgba(103,137,163,0.14)";
        ctx.lineWidth = 0.75;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.restore();
      };

      drawBase(A, B);
      drawBase(B, C);

      travelT = (travelT + 0.0035) % 1;
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Warp intro + idle loop */
  useEffect(() => {
    warpRef.current.v = 1.0;
    let warpTween: gsap.core.Tween | null = null;

    const onScroll = () => {
      const scrollY = window.scrollY;
      if (warpTween) warpTween.kill();
      if (scrollY <= 0) {
        warpTween = gsap.to(warpRef.current, {
          v: 1.0,
          duration: 1.6,
          ease: "power2.in",
        });
        gsap.to(hintRef.current, {
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
        });
      } else {
        warpTween = gsap.to(warpRef.current, {
          v: 0,
          duration: 2.2,
          ease: "power3.out",
        });
        gsap.to(hintRef.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          y: 10,
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Scroll scrub timeline */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".hero-c-edge", {
        strokeDashoffset: (_i: number, el: SVGGeometryElement) =>
          el.getTotalLength?.() ?? 300,
        opacity: 0,
      });
      gsap.set(".hero-c-star", {
        scale: 0,
        opacity: 0,
        transformBox: "fill-box",
        transformOrigin: "center",
      });
      gsap.set(nebulaRef.current, { scale: 0.15, opacity: 0 });
      gsap.set(horizonRef.current, { scaleX: 0 });
      gsap.set(contentRef.current, { opacity: 0, y: 24 });
      gsap.set(dissolveRef.current, { opacity: 0 });
      gsap.set(".hero-star-cta", { opacity: 0, y: 18, scale: 0.88 });
      gsap.set(".hcta-line", { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapRef.current,
          start: "top top",
          end: "+=500%",
          scrub: 1.4,
          pin: pinRef.current,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl.to(
        nebulaRef.current,
        { scale: 1, opacity: 1, duration: 1.3, ease: "power2.out" },
        0.2,
      );
      tl.to(
        horizonRef.current,
        { scaleX: 1, duration: 1.0, ease: "power3.out" },
        0.6,
      );
      tl.to(
        ".hero-c-star",
        {
          scale: 1,
          opacity: 1,
          stagger: { each: 0.07, from: "edges" },
          duration: 0.45,
          ease: "back.out(2.2)",
        },
        1.5,
      );
      tl.to(
        ".hero-c-edge",
        {
          strokeDashoffset: 0,
          opacity: 0.5,
          stagger: { each: 0.07, from: "random" },
          duration: 0.65,
          ease: "power2.inOut",
        },
        2.0,
      );
      tl.to(
        ".hero-star-cta",
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: { each: 0.18, from: "start" },
          duration: 0.55,
          ease: "back.out(2.0)",
        },
        3.2,
      );
      tl.to(
        ".hcta-line",
        { scaleX: 1, stagger: 0.12, duration: 0.5, ease: "power2.inOut" },
        3.35,
      );
      tl.to(
        contentRef.current,
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
        3.0,
      );
      tl.to(
        [".hero-c-edge", ".hero-c-star"],
        { opacity: 0.06, duration: 0.7 },
        5.0,
      );
      tl.to(
        contentRef.current,
        { opacity: 0, duration: 0.5, ease: "power2.in" },
        5.8,
      );
      tl.to(nebulaRef.current, { opacity: 0, duration: 0.6 }, 5.9);
      tl.to(horizonRef.current, { opacity: 0, duration: 0.4 }, 6.0);
      tl.to(
        dissolveRef.current,
        { opacity: 1, duration: 0.8, ease: "power2.inOut" },
        6.2,
      );
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  /* SVG elements */
  const edges = C_EDGES.map(([a, b], i) => {
    const pa = C_STARS[a],
      pb = C_STARS[b];
    const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    return (
      <line
        key={i}
        className="hero-c-edge"
        x1={pa.x}
        y1={pa.y}
        x2={pb.x}
        y2={pb.y}
        stroke="url(#heroGrad)"
        strokeWidth={0.9}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len}
      />
    );
  });

  const starNodes = C_STARS.map((s, i) => (
    <g
      key={i}
      className="hero-c-star"
      style={{ transformOrigin: `${s.x}px ${s.y}px` }}
    >
      <circle cx={s.x} cy={s.y} r={s.r * 4.0} fill="white" opacity={0.04} />
      <circle cx={s.x} cy={s.y} r={s.r * 1.8} fill="white" opacity={0.14} />
      <circle cx={s.x} cy={s.y} r={s.r} fill="white" />
      {i === 0 && (
        <>
          <line
            x1={s.x - s.r * 9}
            y1={s.y}
            x2={s.x + s.r * 9}
            y2={s.y}
            stroke="white"
            strokeWidth={0.5}
            opacity={0.22}
          />
          <line
            x1={s.x}
            y1={s.y - s.r * 9}
            x2={s.x}
            y2={s.y + s.r * 9}
            stroke="white"
            strokeWidth={0.5}
            opacity={0.22}
          />
        </>
      )}
    </g>
  ));

  return (
    <div ref={wrapRef} className="hero-wrap" id="hero">
      <div ref={pinRef} className="hero-pin">
        <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div ref={nebulaRef} className="hero-nebula" aria-hidden="true" />
        <svg
          ref={consvgRef}
          className="hero-svg"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
          style={{ transition: "transform 0.12s ease-out" }}
        >
          <defs>
            <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6789A3" stopOpacity={0.85} />
              <stop offset="50%" stopColor="#CE3072" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#684A82" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          {edges}
          {starNodes}
        </svg>
        <div ref={horizonRef} className="hero-horizon" aria-hidden="true" />
        <div ref={contentRef} className="hero-content">
          <div className="hero-badge">
            <span className="hbadge-pip" aria-hidden="true" />
            <span className="hbadge-text">
              Earl of March · Kanata, ON · 2026
            </span>
            <span className="hbadge-pip" aria-hidden="true" />
          </div>
          <div className="hero-title" aria-label="Summit EXPO 2026">
            <div className="ht-row ht-summit">
              {"SUMMIT".split("").map((c, i) => (
                <span key={i} className="ht-letter ht-s">
                  {c}
                </span>
              ))}
            </div>
            <div className="ht-row ht-expo">
              {"EXPO".split("").map((c, i) => (
                <span key={i} className="ht-letter ht-e">
                  {c}
                </span>
              ))}
              <span className="ht-year">2026</span>
            </div>
          </div>
          <p className="hero-tagline">
            A youth exhibition of <em>All That Can Be</em>
          </p>
          <p className="hero-subline">
            <span className="hero-subline-dot" aria-hidden="true">
              ✦
            </span>
            Coming Soon
            <span className="hero-subline-dot" aria-hidden="true">
              ✦
            </span>
          </p>
          <div className="hero-ctas" ref={ctasRef}>
            <div className="hero-star-ctas">
              <canvas
                ref={ctaLinesRef}
                className="hero-cta-lines-canvas"
                aria-hidden="true"
              />
              <a
                href="#trailer"
                className="hero-star-cta hero-star-cta--trailer"
                ref={(el: HTMLAnchorElement | null) => {
                  ctaNodeRefs.current[0] = el;
                }}
              >
                <span className="hscta-greek">α</span>
                <span className="hscta-node" aria-hidden="true">
                  <span className="hscta-halo hscta-halo--outer" />
                  <span className="hscta-halo hscta-halo--mid" />
                  <span className="hscta-core" />
                  <span className="hscta-spike hscta-spike--h" />
                  <span className="hscta-spike hscta-spike--v" />
                </span>
                <span className="hscta-label">
                  <span className="hscta-eyebrow">watch the</span>
                  <span className="hscta-title">Trailer</span>
                </span>
                <span className="hscta-play">▶</span>
              </a>
              <a
                href="#register"
                className="hero-star-cta hero-star-cta--attendee"
                ref={(el: HTMLAnchorElement | null) => {
                  ctaNodeRefs.current[1] = el;
                }}
              >
                <span className="hscta-greek">β</span>
                <span className="hscta-node" aria-hidden="true">
                  <span className="hscta-halo hscta-halo--outer" />
                  <span className="hscta-halo hscta-halo--mid" />
                  <span className="hscta-core" />
                  <span className="hscta-spike hscta-spike--h" />
                  <span className="hscta-spike hscta-spike--v" />
                  <span className="hscta-orbit" />
                </span>
                <span className="hscta-label">
                  <span className="hscta-eyebrow">join us as an</span>
                  <span className="hscta-title">Attendee</span>
                </span>
              </a>
              <a
                href="#register"
                className="hero-star-cta hero-star-cta--exhibitor"
                ref={(el: HTMLAnchorElement | null) => {
                  ctaNodeRefs.current[2] = el;
                }}
              >
                <span className="hscta-greek">γ</span>
                <span className="hscta-node" aria-hidden="true">
                  <span className="hscta-halo hscta-halo--outer" />
                  <span className="hscta-halo hscta-halo--mid" />
                  <span className="hscta-core" />
                  <span className="hscta-spike hscta-spike--h" />
                  <span className="hscta-spike hscta-spike--v" />
                </span>
                <span className="hscta-label">
                  <span className="hscta-eyebrow">showcase as an</span>
                  <span className="hscta-title">Exhibitor</span>
                </span>
              </a>
            </div>
          </div>
        </div>
        <div ref={hintRef} className="hero-hint" aria-hidden="true">
          <span className="hero-hint-label">scroll to explore</span>
          <i className="fa-solid fa-angles-down hero-hint-icon" />
        </div>
        <div ref={dissolveRef} className="hero-dissolve" aria-hidden="true" />
      </div>
    </div>
  );
}
