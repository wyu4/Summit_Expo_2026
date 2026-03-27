import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { gsap, ScrollTrigger } from "../../utils/gsap";
import "./FAQ.css";
import { useVisibleCanvas } from "../../utils/useVisibleCanvas";

// Data
export interface FaqItem {
  id: string;
  category: string;
  color: string;
  q: string;
  a: string; // supports inline <a> tags rendered via dangerouslySetInnerHTML
}

export const FAQ_DATA: FaqItem[] = [
  // GENERAL
  {
    id: "g1",
    category: "General",
    color: "#CE3072",
    q: "I'm not a student from Earl of March SS. Can I still attend, or be an exhibitor?",
    a: "Yes! Summit EXPO is a community event open to everyone, including younger students, students from other schools, alumni, and parents. Exhibitors can also come from other schools, but must not exceed the age of nineteen (19).",
  },
  {
    id: "g2",
    category: "General",
    color: "#CE3072",
    q: "Where and when is Summit EXPO happening? How long is the event?",
    a: "See the Practical Info section on this page for full venue and schedule details.",
  },
  {
    id: "g3",
    category: "General",
    color: "#CE3072",
    q: "Questions, concerns, suggestions — how do I contact the organizing team?",
    a: "Shoot us an email at XXXXXX — we'd love to hear from you!",
  },

  // ATTENDEES
  {
    id: "a1",
    category: "Attendees",
    color: "#6789A3",
    q: "How do I attend?",
    a: "Sign up by filling out the attendee form, and come to Earl of March Secondary School on the event date. Doors open at the start of Act I.",
  },
  {
    id: "a2",
    category: "Attendees",
    color: "#6789A3",
    q: "Is Summit EXPO free to attend?",
    a: "Absolutely! Admission is completely free.",
  },
  {
    id: "a3",
    category: "Attendees",
    color: "#6789A3",
    q: "What cool things can I expect to see?",
    a: "Check out our lineup of exhibitors on this page! Summit EXPO unfolds in two Acts. In Act I, each exhibitor delivers a short pitch and demo to introduce their ideas and discoveries. In Act II, the exhibition opens into a fair-style showcase where attendees can explore project booths, connect with exhibitors and professional judges, and experience demonstrations firsthand.",
  },
  {
    id: "a4",
    category: "Attendees",
    color: "#6789A3",
    q: "Do I get to vote on who has the coolest exhibit?",
    a: "More than that — if you want, you can score exhibits like professional judges do! While judges' evaluations are weighed more than audience evaluations, your votes still count towards the exciting awards ceremony, happening near the event's end.",
  },
  {
    id: "a5",
    category: "Attendees",
    color: "#6789A3",
    q: "Do I have the opportunity to connect with exhibitors and judges?",
    a: "Yes! During Act II of Summit EXPO, the exhibition opens into a fair-style showcase where attendees can explore project booths, connect with exhibitors and professional judges, and experience demonstrations firsthand.",
  },
  {
    id: "a6",
    category: "Attendees",
    color: "#6789A3",
    q: "I tasted the most delicious liquid-nitrogen ice cream at the Science and Technology Summit, back in 2024. Is there anything similar at Summit EXPO?",
    a: "Maybe :P",
  },

  // EXHIBITORS
  {
    id: "e1",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "How do I apply to be an Exhibitor?",
    a: "Simply fill out the exhibitor application form. The organizing team will review all applications and contact selected exhibitors for next steps.",
  },
  {
    id: "e2",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "What kinds of projects can be exhibited?",
    a: "Anything across science, technology, mathematics, and engineering — software, robotics, experiments, research, discoveries, and interdisciplinary projects. Examples: plant-based steak; quantum computing simulator; discovery of new comets; AI applications; caretaker robot; medicine research proposal; literature review of recent advancements in category theory.",
  },
  {
    id: "e3",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "I have a cool exhibit idea but it requires a projector / power supply / other physical resource.",
    a: "That is why, when you fill out the exhibitor application form, we ask you what physical resources you might require! We will endeavour to accommodate all reasonable requests, and arrange meetings with exhibitors to discuss the logistics of their exhibits, if necessary.",
  },
  {
    id: "e4",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "Can teams apply, or only individuals?",
    a: "Both individuals and small teams are welcome. For example, if your super-cool project was built among three friends, it is natural that they all manage the same exhibit. For a team project, you can decide if you want the whole team to formally pitch together during Act I, or a part of the team.",
  },
  {
    id: "e5",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "Do projects have to be finished?",
    a: "Minimum viable products (MVPs), proof-of-concepts, prototypes, research proposals, works-in-progress, and other early-stage projects are all welcome — in fact, they constitute the heart of Summit EXPO! This is an exhibition of All That Can Be. Clearly explain your vision, demonstrate progress and drive, and you will have yourself an amazing exhibit.",
  },
  {
    id: "e6",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "Will exhibitors receive feedback from judges?",
    a: "Judges may offer feedback and discuss projects with exhibitors during the exhibition.",
  },
  {
    id: "e7",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "Are the judges from professional backgrounds?",
    a: "Yes. Judges are professionals from industry, research, and academia across STEM fields.",
  },
  {
    id: "e8",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "Is there a dress code?",
    a: "No formal dress code — come as you are! Many exhibitors and guests choose business casual.",
  },
  {
    id: "e9",
    category: "Exhibitors",
    color: "#9B5BBF",
    q: "What will I need to bring? How does the pitch night work? What about logistics?",
    a: "If you become an exhibitor, we are here every step of the way. Through continuous communication, we will let you know every detail you need to make your exhibit a stratospheric success. Focus on wowing the crowd — we'll handle the logistics. Shoot us an email at XXXXXX if you have any questions, concerns, or suggestions.",
  },
];

const CATEGORIES = ["All", "General", "Attendees", "Exhibitors"];
const CAT_COLORS: Record<string, string> = {
  All: "#a0a8c0",
  General: "#CE3072",
  Attendees: "#6789A3",
  Exhibitors: "#9B5BBF",
};

// Star canvas
function useFaqCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
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
        { count: 60, speed: 0.006, rMax: 0.5, opMax: 0.38 },
        { count: 35, speed: 0.018, rMax: 0.9, opMax: 0.58 },
        { count: 14, speed: 0.042, rMax: 1.4, opMax: 0.82 },
      ];

      let stars: Star[] = [],
        shooters: Shooter[] = [];
      let t = 0,
        lastScrollY = 0,
        shooterTimer = 0;
      let SHOOTER_INTERVAL = 220 + Math.random() * 200;

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
              sp: Math.random() * 1.0 + 0.25,
              layer: li,
              hue:
                li === 2 ? 30 + Math.random() * 50 : 200 + Math.random() * 60,
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
        const speed = 8 + Math.random() * 8;
        shooters.push({
          x: fromRight
            ? W * (0.5 + Math.random() * 0.5)
            : W * Math.random() * 0.5,
          y: -10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          max: 38 + Math.random() * 28,
          len: 50 + Math.random() * 70,
        });
      };

      return (
        _c: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        dt: number,
      ) => {
        t += (dt / 1000) * 60 * 0.01;
        const sd = (scrollRef.current - lastScrollY) * 0.45;
        lastScrollY = scrollRef.current;
        const W = _c.offsetWidth,
          H = _c.offsetHeight;
        ctx.clearRect(0, 0, W, H);

        for (const s of stars) {
          s.x += s.vx;
          s.y +=
            s.vy + sd * (s.layer === 0 ? 0.02 : s.layer === 1 ? 0.08 : 0.2);
          if (s.x < -2) s.x = W + 2;
          if (s.x > W + 2) s.x = -2;
          if (s.y < -2) s.y = H + 2;
          if (s.y > H + 2) s.y = -2;
          const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph),
            al = s.op * (0.35 + 0.65 * tw);
          if (s.layer >= 1) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * (s.layer === 2 ? 5 : 3.2), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},70%,72%,${al * (s.layer === 2 ? 0.1 : 0.04)})`;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle =
            s.layer === 2
              ? `hsla(${s.hue},65%,92%,${al})`
              : `rgba(210,220,255,${al})`;
          ctx.fill();
          if (s.layer === 2 && al > 0.55) {
            const sp = s.r * 7 * al;
            ctx.strokeStyle = `hsla(${s.hue},65%,85%,${al * 0.4})`;
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
          SHOOTER_INTERVAL = 180 + Math.random() * 240;
        }
        shooters = shooters.filter((s) => s.life < s.max);
        for (const s of shooters) {
          const prog = s.life / s.max,
            alpha = 0.7 * (1 - prog) * Math.min(1, s.life / 4);
          const spd = Math.hypot(s.vx, s.vy);
          const tx = s.x - s.vx * (s.len / spd),
            ty = s.y - s.vy * (s.len / spd);
          const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
          grad.addColorStop(0, "rgba(255,220,150,0)");
          grad.addColorStop(0.6, `rgba(255,220,150,${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(255,255,255,${alpha})`);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.3 * (1 - prog * 0.5);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.fill();
          s.x += s.vx;
          s.y += s.vy;
          s.life++;
        }
      };
    },
    { fps: 40 },
  );
}

// Single FAQ row
function FaqRow({
  item,
  isOpen,
  onToggle,
  onKeyNav,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
  onKeyNav: (dir: 1 | -1) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLSpanElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const prevOpen = useRef(false);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const body = bodyRef.current;
    const answer = answerRef.current;
    const scan = scanRef.current;
    const row = rowRef.current;
    if (!body || !answer || !scan || !row) return;

    if (isOpen && !prevOpen.current) {
      // OPEN
      // Clear any running typewriter
      if (typeTimer.current) clearInterval(typeTimer.current);
      answer.textContent = "";

      // Measure full height
      gsap.set(body, { height: "auto", opacity: 1 });
      const fullH = body.scrollHeight;
      gsap.fromTo(
        body,
        { height: 0, opacity: 0 },
        {
          height: fullH,
          opacity: 1,
          duration: 0.38,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(body, { height: "auto" });
          },
        },
      );

      // Scan line
      gsap.fromTo(
        scan,
        { scaleX: 0, opacity: 1 },
        {
          scaleX: 1,
          duration: 0.38,
          ease: "power3.inOut",
          transformOrigin: "left center",
          onComplete: () => {
            gsap.to(scan, { opacity: 0, duration: 0.25 });
          },
        },
      );

      // Row accent glow
      gsap.fromTo(
        row,
        { "--faq-glow": "0px" },
        { "--faq-glow": "1px", duration: 0.4, ease: "power2.out" },
      );

      // Typewriter — 4ms/char, fast but visible
      const text = item.a;
      let i = 0;
      typeTimer.current = setInterval(() => {
        answer.textContent = text.slice(0, i + 1);
        i++;
        if (i >= text.length && typeTimer.current) {
          clearInterval(typeTimer.current);
          typeTimer.current = null;
        }
      }, 0.1);
    } else if (!isOpen && prevOpen.current) {
      // CLOSE
      if (typeTimer.current) {
        clearInterval(typeTimer.current);
        typeTimer.current = null;
      }
      gsap.to(body, {
        height: 0,
        opacity: 0,
        duration: 0.28,
        ease: "power2.in",
      });
      gsap.to(row, { "--faq-glow": "0px", duration: 0.25 });
      gsap.set(scan, { opacity: 0, scaleX: 0 });
    }

    prevOpen.current = isOpen;
    return () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
    };
  }, [isOpen, item.a]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onKeyNav(1);
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onKeyNav(-1);
    }
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      ref={rowRef}
      className={`faq-row${isOpen ? " faq-row--open" : ""}`}
      style={{ "--faq-color": item.color } as React.CSSProperties}
    >
      {/* Question button */}
      <button
        className="faq-row__q"
        onClick={onToggle}
        onKeyDown={onKey}
        aria-expanded={isOpen}
        aria-controls={`faq-body-${item.id}`}
      >
        <span className="faq-row__cat" style={{ color: item.color }}>
          // {item.category.toUpperCase()}
        </span>
        <span className="faq-row__text">{item.q}</span>
        <span className="faq-row__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Answer body — GSAP controls height */}
      <div
        ref={bodyRef}
        id={`faq-body-${item.id}`}
        className="faq-row__body"
        style={{ height: 0, opacity: 0, overflow: "hidden" }}
        aria-hidden={!isOpen}
      >
        {/* Scan line */}
        <div
          ref={scanRef}
          className="faq-row__scan"
          style={{ opacity: 0, transform: "scaleX(0)" }}
        />

        <p className="faq-row__answer">
          <span ref={answerRef} />
        </p>
      </div>
    </div>
  );
}

// Main component
export function FAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [openId, setOpenId] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  useFaqCanvas(canvasRef);

  // Filter + search
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQ_DATA.filter((item) => {
      const catMatch = category === "All" || item.category === category;
      const searchMatch =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [category, search]);

  // When filter changes, close open item if it's now hidden
  useEffect(() => {
    if (openId && !visible.find((i) => i.id === openId)) setOpenId(null);
  }, [visible, openId]);

  // Animate list items in/out when filter changes
  useEffect(() => {
    if (!listRef.current) return;
    const rows = listRef.current.querySelectorAll<HTMLDivElement>(".faq-row");
    gsap.fromTo(
      rows,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, stagger: 0.04, duration: 0.35, ease: "power2.out" },
    );
  }, [visible.length, category]);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => {
      if (prev === id) return null; // close
      return id; // open new (previous closes via its own useEffect)
    });
  }, []);

  // Keyboard navigation between rows
  const handleKeyNav = useCallback(
    (currentId: string, dir: 1 | -1) => {
      const idx = visible.findIndex((i) => i.id === currentId);
      const next = visible[idx + dir];
      if (next) {
        // Focus the next button
        const btn = listRef.current?.querySelector<HTMLButtonElement>(
          `[aria-controls="faq-body-${next.id}"]`,
        );
        btn?.focus();
      }
    },
    [visible],
  );

  // Scroll entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".faq-header", { opacity: 0, y: 40 });
      gsap.set(".faq-filters", { opacity: 0, y: 20 });
      gsap.set(".faq-search", { opacity: 0, y: 16 });
      if (listRef.current)
        gsap.set(listRef.current.querySelectorAll(".faq-row"), {
          opacity: 0,
          y: 20,
        });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 75%",
        onEnter() {
          gsap.fromTo(
            ".faq-header",
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.1,
            },
          );
          gsap.fromTo(
            ".faq-filters",
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power2.out",
              delay: 0.25,
            },
          );
          gsap.fromTo(
            ".faq-search",
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power2.out",
              delay: 0.35,
            },
          );
          const rows = listRef.current?.querySelectorAll(".faq-row");
          if (rows) {
            gsap.fromTo(
              rows,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                stagger: 0.045,
                duration: 0.5,
                ease: "power2.out",
                delay: 0.45,
              },
            );
          }
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="faq" className="faq">
      <canvas ref={canvasRef} className="faq__canvas" aria-hidden="true" />

      {/* Background nebula */}
      <div className="faq__nebula" aria-hidden="true" />

      {/* Decorative giant question mark */}
      <div className="faq__deco" aria-hidden="true">
        ?
      </div>

      <div className="faq__inner">
        {/* Header */}
        <div className="faq-header">
          <p className="faq-eyebrow">
            <span className="faq-pip" />
            INTERCEPTED TRANSMISSIONS
            <span className="faq-pip" />
          </p>
          <h2 className="faq-title">Frequently Asked</h2>
          <p className="faq-sub">
            Everything you need to know about Summit EXPO.
          </p>
        </div>

        {/* Filter chips */}
        <div
          className="faq-filters"
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`faq-chip${category === cat ? " faq-chip--active" : ""}`}
              style={{ "--chip-color": CAT_COLORS[cat] } as React.CSSProperties}
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="faq-search">
          <i
            className="fa-solid fa-magnifying-glass faq-search__icon"
            aria-hidden="true"
          />
          <input
            type="search"
            className="faq-search__input"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search FAQ"
          />
          {search && (
            <button
              className="faq-search__clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* FAQ list */}
        <div ref={listRef} className="faq-list" role="list">
          {visible.length === 0 ? (
            <div className="faq-empty">
              <span className="faq-empty__icon">✦</span>
              <p>No transmissions found. Try a different search.</p>
            </div>
          ) : (
            visible.map((item) => (
              <FaqRow
                key={item.id}
                item={item}
                isOpen={openId === item.id}
                onToggle={() => toggle(item.id)}
                onKeyNav={(dir) => handleKeyNav(item.id, dir)}
              />
            ))
          )}
        </div>

        {/* Bottom CTA */}
        <div className="faq-cta">
          <p>Still have questions?</p>
          <a href="mailto:XXXXXX" className="faq-cta__link">
            <i className="fa-solid fa-paper-plane" />
            Shoot us an email
          </a>
        </div>
      </div>
    </section>
  );
}
