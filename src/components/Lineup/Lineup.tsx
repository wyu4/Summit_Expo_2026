import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { gsap, ScrollTrigger } from "../../utils/gsap";
import "./Lineup.css";
import { useVisibleCanvas } from "../../utils/useVisibleCanvas";

export interface ProjectPhoto {
  src: string;
  caption?: string;
}

export interface Exhibitor {
  id: string;
  name: string;
  role: string;
  photo: string;
  bio: string;
  links: { label: string; href: string; faIcon: string }[];
  designation: string;
  color: string;
  projectPhotos?: ProjectPhoto[];
}

export const DEMO_EXHIBITORS: Exhibitor[] = [
  {
    id: "01",
    name: "Aria Chen",
    role: "Astrophysics · Gr. 12",
    photo: "/headshots/aria-chen.png",
    bio: "Built a backyard spectrometer from salvaged camera parts to classify stellar types on a $40 budget. Shortlisted for the Schulich Leader Scholarship.",
    links: [
      { label: "GitHub", href: "#", faIcon: "fa-brands fa-github" },
      { label: "Email", href: "#", faIcon: "fa-solid fa-envelope" },
      { label: "Paper", href: "#", faIcon: "fa-solid fa-file-lines" },
    ],
    designation: "KSE-01",
    color: "#CE3072",
    projectPhotos: [
      { src: "/projects/aria-1.png", caption: "Spectrometer prototype" },
      {
        src: "/projects/aria-2.png",
        caption: "Stellar classification results",
      },
      { src: "/projects/aria-3.png", caption: "Lab setup" },
    ],
  },
  {
    id: "02",
    name: "Marcus Osei",
    role: "Robotics · Gr. 11",
    photo: "/headshots/marcus-osei.png",
    bio: "Designed an autonomous soil-sampling rover using 3D-printed wheels and a Raspberry Pi brain, inspired by the Perseverance mission.",
    links: [
      { label: "GitHub", href: "#", faIcon: "fa-brands fa-github" },
      { label: "Email", href: "#", faIcon: "fa-solid fa-envelope" },
      { label: "Demo", href: "#", faIcon: "fa-solid fa-play" },
    ],
    designation: "KSE-02",
    color: "#6789A3",
    projectPhotos: [
      { src: "/projects/marcus-1.png", caption: "Rover assembly" },
      { src: "/projects/marcus-2.png", caption: "Field test" },
    ],
  },
  {
    id: "03",
    name: "Priya Nair",
    role: "Biochemistry · Gr. 12",
    photo: "/headshots/priya-nair.png",
    bio: "Engineered a CRISPR-inspired lateral-flow biosensor detecting heavy metals in water for under $2 per test.",
    links: [
      { label: "GitHub", href: "#", faIcon: "fa-brands fa-github" },
      { label: "Email", href: "#", faIcon: "fa-solid fa-envelope" },
      { label: "Paper", href: "#", faIcon: "fa-solid fa-file-lines" },
    ],
    designation: "KSE-03",
    color: "#9B5BBF",
    projectPhotos: [
      { src: "/projects/priya-1.png", caption: "Biosensor strips" },
      { src: "/projects/priya-2.png", caption: "Water sample testing" },
      { src: "/projects/priya-3.png", caption: "Results dashboard" },
    ],
  },
  {
    id: "04",
    name: "Liam Bouchard",
    role: "Computer Sci · Gr. 10",
    photo: "/headshots/liam-bouchard.png",
    bio: "Trained a CNN to predict wildfire spread patterns using satellite imagery, outperforming existing heuristics on BC 2023 data.",
    links: [
      { label: "GitHub", href: "#", faIcon: "fa-brands fa-github" },
      { label: "Email", href: "#", faIcon: "fa-solid fa-envelope" },
      { label: "Demo", href: "#", faIcon: "fa-solid fa-play" },
    ],
    designation: "KSE-04",
    color: "#CE3072",
    projectPhotos: [
      { src: "/projects/liam-1.png", caption: "Model architecture" },
      { src: "/projects/liam-2.png", caption: "Prediction overlay" },
    ],
  },
  {
    id: "05",
    name: "Sofia Marchetti",
    role: "Materials Sci · Gr. 11",
    photo: "/headshots/sofia-marchetti.png",
    bio: "Synthesised a graphene-aerogel composite insulator for satellite thermal management at cryogenic temperatures.",
    links: [
      { label: "GitHub", href: "#", faIcon: "fa-brands fa-github" },
      { label: "Email", href: "#", faIcon: "fa-solid fa-envelope" },
      { label: "Paper", href: "#", faIcon: "fa-solid fa-file-lines" },
    ],
    designation: "KSE-05",
    color: "#6789A3",
    projectPhotos: [
      { src: "/projects/sofia-1.png", caption: "Aerogel sample" },
      { src: "/projects/sofia-2.png", caption: "Thermal test chamber" },
    ],
  },
  {
    id: "06",
    name: "Jordan Kim",
    role: "Environmental Sci · Gr. 12",
    photo: "/headshots/jordan-kim.png",
    bio: "Deployed IoT sensors across the Rideau River tracking microplastic concentrations in real time via an open public dashboard.",
    links: [
      { label: "GitHub", href: "#", faIcon: "fa-brands fa-github" },
      { label: "Email", href: "#", faIcon: "fa-solid fa-envelope" },
      { label: "Live", href: "#", faIcon: "fa-solid fa-satellite-dish" },
    ],
    designation: "KSE-06",
    color: "#9B5BBF",
    projectPhotos: [
      { src: "/projects/jordan-1.png", caption: "Sensor deployment" },
      { src: "/projects/jordan-2.png", caption: "Live dashboard" },
      { src: "/projects/jordan-3.png", caption: "River sampling" },
    ],
  },
];

// Layout engine
interface StarPos {
  x: number;
  y: number;
}
function seededRand(seed: number) {
  return ((seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
}

function buildLayout(n: number): StarPos[] {
  if (n === 0) return [];
  if (n === 1) return [{ x: 50, y: 50 }];
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / n);
    const th = i * golden;
    const jx = (seededRand(42 + i * 2) - 0.5) * 9;
    const jy = (seededRand(42 + i * 2 + 1) - 0.5) * 9;
    return {
      x: Math.min(90, Math.max(10, 50 + r * 40 * Math.cos(th) + jx)),
      y: Math.min(88, Math.max(12, 50 + r * 38 * Math.sin(th) + jy)),
    };
  });
}

function buildEdges(pos: StarPos[]): [number, number][] {
  const n = pos.length;
  if (n < 2) return [];
  const d = (a: StarPos, b: StarPos) => Math.hypot(a.x - b.x, a.y - b.y);
  const inTree = new Set([0]);
  const edges: [number, number][] = [];
  while (inTree.size < n) {
    let best = Infinity,
      bu = -1,
      bv = -1;
    for (const u of inTree) {
      for (let v = 0; v < n; v++) {
        if (inTree.has(v)) continue;
        const dd = d(pos[u], pos[v]);
        if (dd < best) {
          best = dd;
          bu = u;
          bv = v;
        }
      }
    }
    if (bv === -1) break;
    edges.push([bu, bv]);
    inTree.add(bv);
  }
  for (let i = 0; i < n; i++) {
    const sorted = Array.from({ length: n }, (_, j) => j)
      .filter((j) => j !== i)
      .sort((a, b) => d(pos[i], pos[a]) - d(pos[i], pos[b]));
    let added = 0;
    for (const j of sorted) {
      if (added >= 2 || d(pos[i], pos[j]) > 45) break;
      if (
        !edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))
      ) {
        edges.push([i, j]);
        added++;
      }
    }
  }
  return edges;
}

// Space canvas
function useSpaceCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  const scrollRef = useRef(0);
  useEffect(() => {
    const fn = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useVisibleCanvas(
    ref,
    (canvas) => {
      interface Star {
        x: number;
        y: number;
        r: number;
        vx: number;
        vy: number;
        op: number;
        ph: number;
        sp: number;
        layer: number;
        hue: number;
      }
      interface Shooter {
        x: number;
        y: number;
        vx: number;
        vy: number;
        life: number;
        max: number;
        len: number;
      }

      const LAYERS = [
        { count: 80, speed: 0.007, rMax: 0.55, opMax: 0.4 },
        { count: 45, speed: 0.02, rMax: 0.95, opMax: 0.6 },
        { count: 18, speed: 0.045, rMax: 1.45, opMax: 0.85 },
      ];

      let stars: Star[] = [],
        shooters: Shooter[] = [];
      let t = 0,
        lastScrollY = 0,
        shooterTimer = 0;
      let SHOOTER_INTERVAL = 200 + Math.random() * 200;

      const seed = () => {
        stars = [];
        const W = canvas.offsetWidth,
          H = canvas.offsetHeight;
        LAYERS.forEach((cfg, li) => {
          for (let i = 0; i < cfg.count; i++) {
            const angle = Math.random() * Math.PI * 2,
              speed = cfg.speed * (0.5 + Math.random());
            stars.push({
              x: Math.random() * W,
              y: Math.random() * H,
              r: Math.random() * cfg.rMax + 0.15,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              op: Math.random() * cfg.opMax + 0.15,
              ph: Math.random() * Math.PI * 2,
              sp: Math.random() * 1.1 + 0.25,
              layer: li,
              hue: 200 + Math.random() * 80,
            });
          }
        });
      };
      seed();

      const spawnShooter = () => {
        const W = canvas.offsetWidth,
          fromRight = Math.random() < 0.5;
        const angle =
          (Math.random() * 20 + 10) * (Math.PI / 180) * (fromRight ? 1 : -1) +
          Math.PI / 2;
        const speed = 9 + Math.random() * 9;
        shooters.push({
          x: fromRight
            ? W * (0.55 + Math.random() * 0.45)
            : W * (Math.random() * 0.45),
          y: -10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 40 + Math.random() * 30,
          len: 55 + Math.random() * 75,
        });
      };

      return (
        _c: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        dt: number,
      ) => {
        t += (dt / 1000) * 60 * 0.011;
        const sd = (scrollRef.current - lastScrollY) * 0.5;
        lastScrollY = scrollRef.current;
        const W = _c.offsetWidth,
          H = _c.offsetHeight;
        ctx.clearRect(0, 0, W, H);

        for (const s of stars) {
          s.x += s.vx;
          s.y +=
            s.vy + sd * (s.layer === 0 ? 0.03 : s.layer === 1 ? 0.09 : 0.22);
          if (s.x < -2) s.x = W + 2;
          if (s.x > W + 2) s.x = -2;
          if (s.y < -2) s.y = H + 2;
          if (s.y > H + 2) s.y = -2;
          const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph),
            al = s.op * (0.35 + 0.65 * tw);
          if (s.layer >= 1) {
            ctx.beginPath();
            ctx.arc(
              s.x,
              s.y,
              s.r * (s.layer === 2 ? 5.5 : 3.5),
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = `hsla(${s.hue},65%,75%,${al * (s.layer === 2 ? 0.11 : 0.05)})`;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle =
            s.layer === 2
              ? `hsla(${s.hue},55%,92%,${al})`
              : `rgba(200,215,255,${al})`;
          ctx.fill();
          if (s.layer === 2 && al > 0.5) {
            const sp = s.r * 7 * al;
            ctx.strokeStyle = `hsla(${s.hue},55%,85%,${al * 0.45})`;
            ctx.lineWidth = 0.55;
            ctx.beginPath();
            ctx.moveTo(s.x - sp, s.y);
            ctx.lineTo(s.x + sp, s.y);
            ctx.moveTo(s.x, s.y - sp);
            ctx.lineTo(s.x, s.y + sp);
            ctx.stroke();
          }
        }

        shooterTimer++;
        if (shooterTimer > SHOOTER_INTERVAL) {
          spawnShooter();
          shooterTimer = 0;
          SHOOTER_INTERVAL = 180 + Math.random() * 220;
        }
        shooters = shooters.filter((s) => s.life < s.max);
        for (const s of shooters) {
          const prog = s.life / s.max,
            alpha = 0.75 * (1 - prog) * Math.min(1, s.life / 4);
          const spd = Math.hypot(s.vx, s.vy);
          const tx = s.x - s.vx * (s.len / spd),
            ty = s.y - s.vy * (s.len / spd);
          const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
          grad.addColorStop(0, "rgba(180,215,255,0)");
          grad.addColorStop(0.6, `rgba(180,215,255,${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(255,255,255,${alpha})`);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4 * (1 - prog * 0.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.4 * (1 - prog * 0.7), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
          s.x += s.vx;
          s.y += s.vy;
          s.life++;
        }
      };
    },
    { fps: 24 },
  );
}

// Project Photo Carousel
function ProjectCarousel({
  photos,
  color,
}: {
  photos: ProjectPhoto[];
  color: string;
}) {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const trackRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  const goTo = useCallback(
    (next: number, dir: 1 | -1) => {
      if (isAnimating.current || next === current) return;
      isAnimating.current = true;

      const track = trackRef.current;
      const caption = captionRef.current;
      if (!track) return;

      const slides = track.querySelectorAll<HTMLDivElement>(
        ".lu-carousel__slide",
      );
      const dots =
        dotsRef.current?.querySelectorAll<HTMLSpanElement>(".lu-carousel__dot");

      // const tl = gsap.timeline({
      //  onComplete: () => {
      //    setCurrent(next);
      //    isAnimating.current = false;
      //  },
      // });

      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      // Outgoing slide
      // tl.to(slides[current], {
      //  x: dir * -60,
      //  opacity: 0,
      //  scale: 0.92,
      //  filter: "blur(4px)",
      //  duration: 0.32,
      //  ease: "power2.in",
      // });

      // Caption fades out
      // if (caption) tl.to(caption, { opacity: 0, y: -8, duration: 0.2, ease: "power2.in" }, 0);

      tl.to(slides[current], {
        x: dir * -60,
        opacity: 0,
        scale: 0.92,
        filter: "blur(4px)",
        duration: 0.32,
        ease: "power2.in",
      });
      if (caption)
        tl.to(
          caption,
          { opacity: 0, y: -8, duration: 0.2, ease: "power2.in" },
          0,
        );

      tl.call(
        () => {
          setCurrent(next);
        },
        [],
        "+=0",
      );

      // Incoming slide
      tl.fromTo(
        slides[next],
        { x: dir * 60, opacity: 0, scale: 0.92, filter: "blur(4px)" },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.4,
          ease: "power3.out",
        },
        "-=0.1",
      );

      // Caption blurs in
      if (caption) {
        tl.fromTo(
          caption,
          { opacity: 0, y: 8, filter: "blur(3px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.35,
            ease: "power2.out",
          },
          "-=0.25",
        );
      }

      // Active dot bounces
      if (dots) {
        tl.to(
          dots[current],
          { scale: 0.6, duration: 0.15, ease: "power2.in" },
          0,
        );
        tl.to(
          dots[next],
          { scale: 1.4, duration: 0.2, ease: "back.out(3)" },
          "-=0.15",
        );
        tl.to(dots[next], { scale: 1.0, duration: 0.15, ease: "power2.out" });
      }
    },
    [current],
  );

  const prev = () => goTo((current - 1 + photos.length) % photos.length, -1);
  const next = () => goTo((current + 1) % photos.length, 1);

  // Keyboard nav when carousel is focused
  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [current],
  );

  // Initial entrance animation
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = track.querySelectorAll<HTMLDivElement>(
      ".lu-carousel__slide",
    );

    // Hide all non-current slides
    slides.forEach((s, i) => {
      gsap.set(s, { opacity: i === 0 ? 1 : 0, x: i === 0 ? 0 : 60 });
    });

    // Entrance: the first slide and the whole carousel
    gsap.fromTo(
      track,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", delay: 0.1 },
    );
    gsap.fromTo(
      ".lu-carousel__controls",
      { opacity: 0, y: 10 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        delay: 0.3,
        stagger: 0.05,
      },
    );
  }, []);

  if (!photos.length) return null;

  return (
    <div
      className="lu-carousel"
      onKeyDown={onKey}
      tabIndex={0}
      role="region"
      aria-label="Project photos"
    >
      {/* Section label */}
      <div className="lu-carousel__header">
        <span className="lu-carousel__label">
  <i className="fa-solid fa-images" /> Project Photos  {/* was ◈ Project Photos */}
</span>
        <span className="lu-carousel__counter">
          {current + 1} / {photos.length}
        </span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="lu-carousel__track"
        style={{ "--cc": color } as React.CSSProperties}
      >
        {photos.map((p, i) => (
          <div
            key={i}
            className="lu-carousel__slide"
            style={{
              opacity: i === current ? 1 : 0,
              pointerEvents: i === current ? "auto" : "none",
            }}
            aria-hidden={i !== current}
          >
            {imgErrors.has(i) ? (
              <div
                className="lu-carousel__placeholder"
                style={{ "--cc": color } as React.CSSProperties}
              >
                <i className="fa-solid fa-image" />
                <span>{p.caption ?? "Project photo"}</span>
              </div>
            ) : (
              <img
                src={p.src}
                alt={p.caption ?? `Project photo ${i + 1}`}
                className="lu-carousel__img"
                onError={() => setImgErrors((s) => new Set([...s, i]))}
              />
            )}
          </div>
        ))}

        {/* Corner accents on the image frame */}
        <span
          className="lu-carousel__corner lu-carousel__corner--tl"
          style={{ "--cc": color } as React.CSSProperties}
        />
        <span
          className="lu-carousel__corner lu-carousel__corner--tr"
          style={{ "--cc": color } as React.CSSProperties}
        />
        <span
          className="lu-carousel__corner lu-carousel__corner--bl"
          style={{ "--cc": color } as React.CSSProperties}
        />
        <span
          className="lu-carousel__corner lu-carousel__corner--br"
          style={{ "--cc": color } as React.CSSProperties}
        />
      </div>

      {/* Caption */}
      {photos[current]?.caption && (
        <p ref={captionRef} className="lu-carousel__caption">
          {photos[current].caption}
        </p>
      )}

      {/* Controls */}
      {photos.length > 1 && (
        <div className="lu-carousel__controls">
          <button
            className="lu-carousel__btn"
            onClick={prev}
            aria-label="Previous photo"
            style={{ "--cc": color } as React.CSSProperties}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>

          <div ref={dotsRef} className="lu-carousel__dots">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`lu-carousel__dot${i === current ? " lu-carousel__dot--active" : ""}`}
                style={{ "--cc": color } as React.CSSProperties}
                onClick={() => goTo(i, i > current ? 1 : -1)}
                role="button"
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="lu-carousel__btn"
            onClick={next}
            aria-label="Next photo"
            style={{ "--cc": color } as React.CSSProperties}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}

// Main component
export function Lineup({
  exhibitors = DEMO_EXHIBITORS,
}: {
  exhibitors?: Exhibitor[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [modal, setModal] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [imgFailed, setImgFailed] = useState<Set<string>>(new Set());
  const [_, setDrawn] = useState(false);

  const positions = useMemo(
    () => buildLayout(exhibitors.length),
    [exhibitors.length],
  );
  const edges = useMemo(() => buildEdges(positions), [positions]);
  const svgLineRefs = useRef<(SVGLineElement | null)[]>([]);

  useSpaceCanvas(canvasRef);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: bridgeRef.current,
        start: "top 90%",
        onEnter() {
          gsap.fromTo(
            ".lu__bridge-line",
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1,
              opacity: 1,
              duration: 1.2,
              ease: "power3.inOut",
              transformOrigin: "left center",
            },
          );
          gsap.fromTo(
            ".lu__bridge-particle",
            { opacity: 0, scale: 0 },
            {
              opacity: 1,
              scale: 1,
              stagger: { each: 0.06, from: "random" },
              duration: 0.4,
              ease: "back.out(2)",
            },
          );
          gsap.fromTo(
            ".lu__bridge-label",
            { opacity: 0, letterSpacing: "0.8em" },
            {
              opacity: 0.6,
              letterSpacing: "0.4em",
              duration: 1.0,
              ease: "power2.out",
              delay: 0.4,
            },
          );
        },
      });

      ScrollTrigger.create({
        trigger: headerRef.current,
        start: "top 80%",
        onEnter() {
          const header = headerRef.current;
          if (!header) return;
          gsap
            .timeline()
            .fromTo(
             header.querySelector(".lu-eyebrow"),
              { opacity: 0, y: 30, scale: 0.95 },
              { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" },
            )
            .fromTo(
              header.querySelector(".lu-title"),
              { opacity: 0, y: 40, scale: 0.9 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out",
              },
              "-=0.3",
            )
            .fromTo(
             header.querySelector(".lu-sub"),
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
              "-=0.4",
            );
        },
        onLeaveBack() {
          gsap.set([".lu-eyebrow", ".lu-title", ".lu-sub"], {
            opacity: 0,
            y: 30,
          });
        },
      });

      ScrollTrigger.create({
        trigger: mapRef.current,
        start: "top 85%",
        onEnter() {
          gsap.fromTo(
            mapRef.current,
            { opacity: 0, y: 60 },
            { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
          );
        },
        onLeaveBack() {
          gsap.set(mapRef.current, { opacity: 0, y: 60 });
        },
      });

      const nodes = nodeRefs.current.filter(Boolean);
      gsap.set(nodes, { scale: 0, opacity: 0 });

      ScrollTrigger.create({
        trigger: mapRef.current,
        start: "top 65%",
        onEnter() {
          const lines = svgLineRefs.current.filter(Boolean);
          lines.forEach((l) => {
            if (!l) return;
            const len = l.getTotalLength?.() ?? 200;
            l.style.strokeDasharray = `${len}`;
            l.style.strokeDashoffset = `${len}`;
          });
          gsap.to(nodes, {
            scale: 1,
            opacity: 1,
            stagger: { each: 0.05, from: "center" },
            duration: 0.5,
            ease: "back.out(1.8)",
            delay: 0.1,
            onComplete() {
              lines.forEach((l, ei) => {
                if (!l) return;
                const _len = parseFloat(l.style.strokeDasharray) || 200;
                gsap.to(l, {
                  strokeDashoffset: 0,
                  duration: 0.7,
                  delay: ei * 0.09,
                  ease: "power2.inOut",
                  onComplete: () => {
                    if (ei === lines.length - 1) setDrawn(true);
                  },
                });
              });
            },
          });
        },
        onLeaveBack() {
          setDrawn(false);
          gsap.to(nodes, { scale: 0, opacity: 0, duration: 0.35 });
          svgLineRefs.current.forEach((l) => {
            if (!l) return;
            gsap.set(l, {
              strokeDashoffset: parseFloat(l.style.strokeDasharray) || 200,
            });
          });
        },
      });

      ScrollTrigger.create({
        trigger: ".lu__hint",
        start: "top 95%",
        onEnter() {
          gsap.fromTo(
            ".lu__hint",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          );
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleMouseEnter = useCallback((idx: number) => {
    setHovered(idx);
    const tip = tooltipRef.current;
    if (!tip) return;
    gsap.killTweensOf(tip);
    gsap.fromTo(
      tip,
      { opacity: 0, y: 8, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" },
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(null);
    const tip = tooltipRef.current;
    if (!tip) return;
    gsap.killTweensOf(tip);
    gsap.to(tip, {
      opacity: 0,
      y: 6,
      scale: 0.93,
      duration: 0.18,
      ease: "power2.in",
    });
  }, []);

  const openModal = useCallback((idx: number) => {
    setModal(idx);
    document.body.style.overflow = "hidden";
    const nav = document.querySelector<HTMLElement>(".nav");
    if (nav)
      gsap.to(nav, {
        yPercent: -130,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const m = modalRef.current;
        if (!m) return;
        const bd = m.closest(".lu-modal-backdrop") as HTMLElement | null;
        if (bd)
          gsap.fromTo(
            bd,
            { opacity: 0 },
            { opacity: 1, duration: 0.35, ease: "power2.out" },
          );
        gsap.fromTo(
          m,
          { opacity: 0, scale: 0.85, y: 50, rotateX: -8 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: 0,
            duration: 0.55,
            ease: "power3.out",
          },
        );

        const tl = gsap.timeline({ delay: 0.12 });
        tl.fromTo(
          ".lu-modal__scan",
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.6,
            ease: "power3.out",
            transformOrigin: "left center",
          },
        )
          .fromTo(
            ".lu-modal__desig-wrap",
            { opacity: 0, x: -24 },
            { opacity: 1, x: 0, duration: 0.4, ease: "power3.out" },
            "-=0.35",
          )
          .fromTo(
            ".lu-modal__photo-wrap",
            { scale: 0.5, opacity: 0, rotation: -12 },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 0.55,
              ease: "back.out(2)",
            },
            "-=0.2",
          )
          .fromTo(
            ".lu-modal__orbit",
            { scale: 0.3, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              stagger: 0.12,
              duration: 0.4,
              ease: "power2.out",
            },
            "-=0.25",
          )
          .fromTo(
            ".lu-modal__name",
            { opacity: 0, x: 28, filter: "blur(4px)" },
            {
              opacity: 1,
              x: 0,
              filter: "blur(0px)",
              duration: 0.45,
              ease: "power3.out",
            },
            "-=0.3",
          )
          .fromTo(
            ".lu-modal__role",
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.35, ease: "power3.out" },
            "-=0.25",
          )
          .fromTo(
            ".lu-modal__mag-dot",
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              stagger: 0.07,
              duration: 0.25,
              ease: "back.out(3)",
            },
            "-=0.15",
          )
          .fromTo(
            ".lu-modal__divider",
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.45,
              ease: "power2.inOut",
              transformOrigin: "left center",
            },
            "-=0.05",
          )
          .fromTo(
            ".lu-modal__bio",
            { opacity: 0, y: 14, filter: "blur(5px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.5,
              ease: "power2.out",
            },
            "-=0.1",
          )
          // Carousel section slides up
          .fromTo(
            ".lu-carousel",
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
            "-=0.1",
          )
          .fromTo(
            ".lu-modal__link",
            { opacity: 0, y: 16, scale: 0.88 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.075,
              duration: 0.38,
              ease: "back.out(1.6)",
            },
            "-=0.2",
          )
          .fromTo(
            [".lu-c--tl", ".lu-c--tr", ".lu-c--bl", ".lu-c--br"],
            { opacity: 0, scale: 0 },
            {
              opacity: 1,
              scale: 1,
              stagger: 0.05,
              duration: 0.22,
              ease: "back.out(2.5)",
            },
            "-=0.2",
          );
      }),
    );
  }, []);

  const closeModal = useCallback(() => {
    const m = modalRef.current;
    if (!m) return;
    const bd = m.closest(".lu-modal-backdrop") as HTMLElement | null;
    const tl = gsap.timeline({
      onComplete: () => {
        setModal(null);
        document.body.style.overflow = "";
        const nav = document.querySelector<HTMLElement>(".nav");
        if (nav)
          gsap.to(nav, {
            yPercent: 0,
            opacity: 1,
            duration: 0.4,
            ease: "power3.out",
          });
      },
    });
    tl.to(m, {
      opacity: 0,
      scale: 0.9,
      y: 24,
      duration: 0.3,
      ease: "power2.in",
    });
    if (bd)
      tl.to(bd, { opacity: 0, duration: 0.22, ease: "power2.in" }, "-=0.12");
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeModal]);

  const hovEx = hovered !== null ? exhibitors[hovered] : null;
  const modalEx = modal !== null ? exhibitors[modal] : null;

  const tooltipStyle = useMemo(() => {
    if (hovered === null) return {};
    const pos = positions[hovered];
    if (!pos) return {};
    const leftSide = pos.x < 55;
    return {
      left: leftSide ? `calc(${pos.x}% + 32px)` : "auto",
      right: leftSide ? "auto" : `calc(${100 - pos.x}% + 32px)`,
      top: `calc(${pos.y}% - 20px)`,
    };
  }, [hovered, positions]);

  return (
    <section ref={sectionRef} id="lineup" className="lu">
      <canvas ref={canvasRef} className="lu__space-canvas" aria-hidden="true" />

      <div className="lu__nebula" aria-hidden="true" />

      <header ref={headerRef} className="lu__header">
        <p className="lu-eyebrow" >
          <span className="lu-pip" />
          EXHIBITOR CONSTELLATION · {exhibitors.length} STARS
          <span className="lu-pip" />
        </p>
        <h2 className="lu-title" >
          THE LINEUP
        </h2>
        <p className="lu-sub" >
          Hover to preview · click to explore.
        </p>
      </header>

      <div
        ref={mapRef}
        className="lu__map"
        style={{ "--n": exhibitors.length, opacity: 0 } as React.CSSProperties}
      >
        <svg ref={svgRef} className="lu__svg" aria-hidden="true">
          <defs>
            <filter id="lu-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {edges.map(([ai, bi], ei) => {
            const a = positions[ai],
              b = positions[bi];
            if (!a || !b) return null;
            const isLit =
              hovered === ai || hovered === bi || modal === ai || modal === bi;
            return (
              <g key={ei}>
                <line
                  x1={`${a.x}%`}
                  y1={`${a.y}%`}
                  x2={`${b.x}%`}
                  y2={`${b.y}%`}
                  className={`lu-edge lu-edge--glow${isLit ? " lu-edge--lit" : ""}`}
                />
                <line
                  ref={(el) => {
                    svgLineRefs.current[ei] = el;
                  }}
                  x1={`${a.x}%`}
                  y1={`${a.y}%`}
                  x2={`${b.x}%`}
                  y2={`${b.y}%`}
                  className={`lu-edge lu-edge--dash${isLit ? " lu-edge--lit" : ""}`}
                />
              </g>
            );
          })}
        </svg>

        {exhibitors.map((e, i) => {
          const pos = positions[i] ?? { x: 50, y: 50 };
          const isHov = hovered === i,
            isMod = modal === i;
          return (
            <button
              key={e.id}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className={`lu-node${isHov ? " lu-node--hov" : ""}${isMod ? " lu-node--active" : ""}`}
              style={
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  "--nc": e.color,
                } as React.CSSProperties
              }
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={handleMouseLeave}
              onClick={() => openModal(i)}
              aria-label={`View ${e.name}`}
            >
              <span className="lu-node__outer" />
              <span className="lu-node__mid" />
              <span className="lu-node__core" />
              <span className="lu-node__spikes" aria-hidden="true">
                <span className="s s--h" />
                <span className="s s--v" />
                <span className="s s--d1" />
                <span className="s s--d2" />
              </span>
              {isMod && (
                <>
                  <span className="lu-node__ring" />
                  <span className="lu-node__ring lu-node__ring--2" />
                </>
              )}
              <span className="lu-node__tag" aria-hidden="true">
                <span className="lu-node__tag-id">{e.designation}</span>
                <span className="lu-node__tag-name">{e.name}</span>
              </span>
            </button>
          );
        })}

        <div
          ref={tooltipRef}
          className="lu-tooltip"
          style={
            {
              ...tooltipStyle,
              opacity: 0,
              pointerEvents: "none",
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {hovEx && (
            <>
              <div className="lu-tooltip__top">
                {imgFailed.has(hovEx.id) ? (
                  <div
                    className="lu-tooltip__avatar"
                    style={{ "--tc": hovEx.color } as React.CSSProperties}
                  >
                    {hovEx.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                ) : (
                  <img
                    src={hovEx.photo}
                    alt={hovEx.name}
                    className="lu-tooltip__photo"
                    onError={() =>
                      setImgFailed((s) => new Set([...s, hovEx.id]))
                    }
                  />
                )}
                <div>
                  <p className="lu-tooltip__name">{hovEx.name}</p>
                  <p className="lu-tooltip__role">{hovEx.role}</p>
                </div>
              </div>
              <p className="lu-tooltip__bio">
                {hovEx.bio.length > 90
                  ? hovEx.bio.slice(0, 88) + "…"
                  : hovEx.bio}
              </p>
              <p className="lu-tooltip__cta">Click to explore →</p>
              <span
                className="lu-tooltip__corner lu-tooltip__corner--tl"
                style={{ "--tc": hovEx.color } as React.CSSProperties}
              />
              <span
                className="lu-tooltip__corner lu-tooltip__corner--tr"
                style={{ "--tc": hovEx.color } as React.CSSProperties}
              />
            </>
          )}
        </div>
      </div>

      {modal !== null && modalEx && (
        <div className="lu-modal-backdrop" onClick={closeModal}>
          <div
            ref={modalRef}
            className="lu-modal"
            style={{ "--mc": modalEx.color } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lu-modal__inner">
              <div className="lu-modal__scan" />
              <button
                className="lu-modal__close"
                onClick={closeModal}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              <div className="lu-modal__desig-wrap">
                <span className="lu-modal__desig-dot" />
                <span className="lu-modal__desig">{modalEx.designation}</span>
                <span className="lu-modal__desig-line" />
              </div>
              <div className="lu-modal__hero">
                <div className="lu-modal__photo-wrap">
                  {imgFailed.has(modalEx.id) ? (
                    <div
                      className="lu-modal__avatar"
                      style={{ "--mc": modalEx.color } as React.CSSProperties}
                    >
                      {modalEx.name
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  ) : (
                    <img
                      src={modalEx.photo}
                      alt={modalEx.name}
                      className="lu-modal__photo"
                      onError={() =>
                        setImgFailed((s) => new Set([...s, modalEx.id]))
                      }
                    />
                  )}
                  <div className="lu-modal__orbit lu-modal__orbit--1" />
                  <div className="lu-modal__orbit lu-modal__orbit--2" />
                  <div className="lu-modal__crosshair" aria-hidden="true">
                    <span className="lu-modal__ch-h" />
                    <span className="lu-modal__ch-v" />
                  </div>
                </div>
                <div className="lu-modal__identity">
                  <h3 className="lu-modal__name">{modalEx.name}</h3>
                  <p className="lu-modal__role">{modalEx.role}</p>
                  {/* <div className="lu-modal__mag" aria-hidden="true">
                    {Array.from({ length: 5 }, (_, mi) => (
                      <span
                        key={mi}
                        className={`lu-modal__mag-dot${mi < 4 ? " lu-modal__mag-dot--on" : ""}`}
                      />
                    ))}
                    <span className="lu-modal__mag-label">
                      Stellar Magnitude
                    </span>
                  </div> */}
                </div>
              </div>
              <div className="lu-modal__divider" />
              <p className="lu-modal__bio">{modalEx.bio}</p>

              {/* Project photos carousel */}
              {modalEx.projectPhotos && modalEx.projectPhotos.length > 0 && (
                <ProjectCarousel
                  key={modalEx.id}
                  photos={modalEx.projectPhotos}
                  color={modalEx.color}
                />
              )}

              <div className="lu-modal__links">
                {modalEx.links.map(
                  (lk: { label: string; href: string; faIcon: string }) => (
                    <a
                      key={lk.label}
                      href={lk.href}
                      className="lu-modal__link"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ "--lc": modalEx.color } as React.CSSProperties}
                    >
                      <i className={`${lk.faIcon} lu-modal__link-icon`} />
                      <span>{lk.label}</span>
                    </a>
                  ),
                )}
              </div>
            </div>
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
