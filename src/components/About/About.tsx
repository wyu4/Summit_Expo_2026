import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./About.css";
import { RocketPath } from "../ScrollRocket/RocketPath";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

gsap.registerPlugin(ScrollTrigger);

const FIELDS: { icon: IconDefinition; label: string; desc: string }[] = [
  { icon: faCode, label: "Software", desc: "Apps, algorithms, AI" },
  { icon: faBolt, label: "Electronics", desc: "Circuits & embedded systems" },
  { icon: faGears, label: "Mechanical", desc: "Robotics & mechanisms" },
  { icon: faDna, label: "Biology", desc: "Life sciences & genetics" },
  { icon: faFlask, label: "Chemistry", desc: "Synthesis & materials" },
  { icon: faMicroscope, label: "Research", desc: "Papers & discoveries" },
  {
    icon: faSquareRootVariable,
    label: "Mathematics",
    desc: "Proofs & prime discovery",
  },
  {
    icon: faSatelliteDish,
    label: "Astronomy",
    desc: "Comets & deep sky objects",
  },
  { icon: faHeartPulse, label: "Medicine", desc: "Diagnostics & biotech" },
  { icon: faInfinity, label: "& Beyond", desc: "Plant-based steak? Yes." },
];

const STATS = [
  { value: "Free", label: "Admission" },
  { value: "∞", label: "Fields of study" },
  { value: "Live", label: "Awards ceremony" },
  { value: "All", label: "Schools welcome" },
];

//  Decorative star glyphs for the margins
const MARGIN_GLYPHS = [
  { top: "8%", left: "2%", size: 28, rot: 15, delay: 0 },
  { top: "18%", right: "1.5%", size: 18, rot: -10, delay: 0.6 },
  { top: "32%", left: "1%", size: 38, rot: 30, delay: 1.2 },
  { top: "45%", right: "2%", size: 22, rot: -25, delay: 0.3 },
  { top: "58%", left: "3%", size: 14, rot: 45, delay: 1.8 },
  { top: "65%", right: "1%", size: 32, rot: 10, delay: 0.9 },
  { top: "78%", left: "1.5%", size: 20, rot: -40, delay: 1.5 },
  { top: "88%", right: "2.5%", size: 16, rot: 20, delay: 0.4 },
];

/* Master canvas — stars + shooting stars + nebula */
function useSpaceCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
 
    interface Star {
      x: number; y: number; r: number;
      vx: number; vy: number;
      op: number; ph: number; sp: number;
      layer: number; hue: number;
    }
    interface Shooter {
      x: number; y: number;
      vx: number; vy: number;
      life: number; max: number;
      len: number; op: number;
    }
    interface NebulaPatch {
      x: number; y: number;
      rx: number; ry: number;
      hue: number; op: number;
      dop: number; drift: number; angle: number;
    }
 
    // REDUCED counts from 160/90/40 → 90/50/20
    const LAYERS = [
      { count: 90,  speedMult: 0.008, rMax: 0.6,  opMax: 0.45 },
      { count: 50,  speedMult: 0.022, rMax: 1.0,  opMax: 0.65 },
      { count: 20,  speedMult: 0.050, rMax: 1.5,  opMax: 0.90 },
    ];
    const PARALLAX = [0.03, 0.10, 0.24];
 
    let stars:    Star[]        = [];
    let shooters: Shooter[]     = [];
    let nebulae:  NebulaPatch[] = [];
    let raf = 0, t = 0, nebulaFrame = 0;
    let scrollY = 0, lastScrollY = 0;
 
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
 
      stars = [];
      LAYERS.forEach((cfg, li) => {
        for (let i = 0; i < cfg.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = cfg.speedMult * (0.5 + Math.random());
          stars.push({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * cfg.rMax + 0.15,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            op: Math.random() * cfg.opMax + 0.15,
            ph: Math.random() * Math.PI * 2,
            sp: Math.random() * 1.2 + 0.3,
            layer: li,
            hue: 200 + Math.random() * 100,
          });
        }
      });
 
      // REDUCED from 7 patches → 4
      nebulae = [];
      const patches = [
        { x: 0.12, y: 0.15, hue: 320 },
        { x: 0.88, y: 0.08, hue: 270 },
        { x: 0.05, y: 0.50, hue: 210 },
        { x: 0.50, y: 0.35, hue: 300 },
      ];
      for (const p of patches) {
        nebulae.push({
          x: p.x * W, y: p.y * H,
          rx: W * (0.15 + Math.random() * 0.12),
          ry: H * (0.08 + Math.random() * 0.06),
          hue: p.hue, op: Math.random() * 0.04 + 0.01,
          dop: (Math.random() * 0.0008 + 0.0002) * (Math.random() < 0.5 ? 1 : -1),
          drift: Math.random() * 0.12 + 0.04,
          angle: Math.random() * Math.PI * 2,
        });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
 
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
 
    const spawnShooter = () => {
      const W = canvas.width
      const fromRight = Math.random() < 0.5;
      const angle = (Math.random() * 20 + 10) * (Math.PI / 180) * (fromRight ? 1 : -1) + Math.PI / 2;
      const speed = 8 + Math.random() * 10;
      shooters.push({
        x: fromRight ? W * (0.6 + Math.random() * 0.4) : W * (Math.random() * 0.4),
        y: -10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        max: 45 + Math.random() * 30,
        len: 60 + Math.random() * 80,
        op: 0.7 + Math.random() * 0.3,
      });
    };
 
    let shooterTimer = 0;
    const SHOOTER_INTERVAL = 180 + Math.random() * 240;
 
    const loop = () => {
      t += 0.012;
      nebulaFrame++;
      const scrollDelta = (scrollY - lastScrollY) * 0.6;
      lastScrollY = scrollY;
      const W = canvas.width, H = canvas.height;
 
      ctx.clearRect(0, 0, W, H);
 
      // Nebula only every 3rd frame — moves so slowly nobody notices
      if (nebulaFrame % 3 === 0) {
        for (const n of nebulae) {
          n.angle += n.drift * 0.002;
          n.op    += n.dop;
          if (n.op > 0.055) { n.op = 0.055; n.dop = -Math.abs(n.dop); }
          if (n.op < 0.008) { n.op = 0.008; n.dop =  Math.abs(n.dop); }
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate(n.angle);
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.rx);
          g.addColorStop(0,   `hsla(${n.hue}, 70%, 55%, ${n.op})`);
          g.addColorStop(0.5, `hsla(${n.hue}, 60%, 45%, ${n.op * 0.5})`);
          g.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.scale(1, n.ry / n.rx);
          ctx.beginPath();
          ctx.arc(0, 0, n.rx, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
          ctx.restore();
        }
      }
 
      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy + scrollDelta * PARALLAX[s.layer];
        if (s.x < -2) s.x = W + 2; if (s.x > W + 2) s.x = -2;
        if (s.y < -2) s.y = H + 2; if (s.y > H + 2) s.y = -2;
 
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = s.op * (0.35 + 0.65 * tw);
 
        if (s.layer >= 1) {
          const haloSize = s.r * (s.layer === 2 ? 5.5 : 3.5);
          ctx.beginPath();
          ctx.arc(s.x, s.y, haloSize, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},70%,80%,${al * (s.layer === 2 ? 0.12 : 0.06)})`;
          ctx.fill();
        }
 
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.layer === 2
          ? `hsla(${s.hue},60%,95%,${al})`
          : `rgba(220,220,255,${al})`;
        ctx.fill();
 
        if (s.layer === 2 && al > 0.55) {
          const spike = s.r * 7 * al;
          ctx.strokeStyle = `hsla(${s.hue},60%,90%,${al * 0.45})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(s.x - spike, s.y); ctx.lineTo(s.x + spike, s.y);
          ctx.moveTo(s.x, s.y - spike); ctx.lineTo(s.x, s.y + spike);
          ctx.stroke();
          const d = spike * 0.45;
          ctx.strokeStyle = `hsla(${s.hue},60%,90%,${al * 0.20})`;
          ctx.beginPath();
          ctx.moveTo(s.x - d, s.y - d); ctx.lineTo(s.x + d, s.y + d);
          ctx.moveTo(s.x + d, s.y - d); ctx.lineTo(s.x - d, s.y + d);
          ctx.stroke();
        }
      }
 
      shooterTimer++;
      if (shooterTimer > SHOOTER_INTERVAL) { spawnShooter(); shooterTimer = 0; }
 
      shooters = shooters.filter(s => s.life < s.max);
      for (const s of shooters) {
        const prog  = s.life / s.max;
        const alpha = s.op * (1 - prog) * Math.min(1, s.life / 5);
        const tx    = s.x - s.vx * (s.len / Math.hypot(s.vx, s.vy));
        const ty    = s.y - s.vy * (s.len / Math.hypot(s.vx, s.vy));
 
        const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(0.6, `rgba(200,210,255,${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(255,255,255,${alpha})`);
 
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 * (1 - prog * 0.5);
        ctx.stroke();
 
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5 * (1 - prog * 0.7), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
 
        s.x += s.vx; s.y += s.vy; s.life++;
      }
 
      raf = requestAnimationFrame(loop);
    };
    loop();
 
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [canvasRef]);
}


/* Constellation canvas with pulsing lines */
function useConstellations(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
 
    interface CStar {
      x: number; y: number; vx: number; vy: number;
      ph: number; sp: number; r: number; brightness: number;
    }
    let stars: CStar[] = [];
    let raf = 0, t = 0;
    const MAX_DIST = 110;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;
    const CELL = 115;
 
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stars = [];
      const W = canvas.width, H = canvas.height;
      const marginW = Math.max(60, (W - 1280) / 2);
      const total   = Math.floor((W * H) / 20000) + 16;
      for (let i = 0; i < total; i++) {
        let x: number;
        const inMargin = Math.random() < 0.65 && marginW > 40;
        if (inMargin) {
          x = Math.random() < 0.5 ? Math.random() * marginW : W - Math.random() * marginW;
        } else {
          x = Math.random() * W;
        }
        stars.push({
          x, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.13,
          vy: (Math.random() - 0.5) * 0.13,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.6 + 0.2,
          r:  Math.random() * 1.2 + 0.3,
          brightness: Math.random(),
        });
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
 
    const loop = () => {
      t += 0.009;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
 
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
      }
 
      // Build spatial grid — O(n) bucket fill
      const cols = Math.ceil(W / CELL) + 1;
      const rows = Math.ceil(H / CELL) + 1;
      const grid: number[][] = Array.from({ length: cols * rows }, () => []);
      for (let i = 0; i < stars.length; i++) {
        const cx = Math.floor(stars[i].x / CELL);
        const cy = Math.floor(stars[i].y / CELL);
        const idx = cy * cols + cx;
        if (grid[idx]) grid[idx].push(i);
      }
 
      // Check only neighbouring cells — instead of all pairs
      for (let i = 0; i < stars.length; i++) {
        const a  = stars[i];
        const cx = Math.floor(a.x / CELL);
        const cy = Math.floor(a.y / CELL);
        for (let ny = cy - 1; ny <= cy + 1; ny++) {
          for (let nx = cx - 1; nx <= cx + 1; nx++) {
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
            const cell = grid[ny * cols + nx];
            for (const j of cell) {
              if (j <= i) continue;
              const b  = stars[j];
              const dx = a.x - b.x, dy = a.y - b.y;
              const dSq = dx * dx + dy * dy;
              if (dSq < MAX_DIST_SQ) {
                const d         = Math.sqrt(dSq);
                const proximity = 1 - d / MAX_DIST;
                const pulse     = 0.5 + 0.5 * Math.sin(t * 0.8 + (a.ph + b.ph) * 0.5);
                const alpha     = proximity * 0.18 * pulse;
                const hue       = 240 + Math.sin(t * 0.3 + i * 0.1) * 40;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `hsla(${hue},60%,75%,${alpha})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
              }
            }
          }
        }
      }
 
      // Draw star dots
      for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
        const al = (0.25 + 0.55 * tw) * (0.4 + s.brightness * 0.6);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,145,255,${al * 0.07})`; ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,195,255,${al})`; ctx.fill();
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
    let lastTrailTime = 0;
 
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
 
    const onMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastTrailTime < 16) return; // throttle to ~60fps
      lastTrailTime = now;
      const rect = canvas.getBoundingClientRect();
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.6 + 0.4;
        particles.push({
          x: e.clientX - rect.left, y: e.clientY - rect.top,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.6,
          life: 0, max: Math.random() * 50 + 25, r: Math.random() * 2.8 + 0.5,
          h: Math.random() < 0.5 ? 330 : (Math.random() < 0.5 ? 275 : 210),
        });
      }
    };
 
    const section = canvas.parentElement;
    section?.addEventListener('mousemove', onMove, { passive: true });
 
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life < p.max);
      // Cap total particles
      if (particles.length > 80) particles.splice(0, particles.length - 80);
      for (const p of particles) {
        const prog = p.life / p.max, al = (1 - prog) * 0.85, r = p.r * (1 - prog * 0.4);
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},80%,65%,${al * 0.12})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},90%,82%,${al})`; ctx.fill();
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life++;
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
 
 


/* Component */

//  Embedded trailer — lives inside About
// Hologram-style transmission frame. States: idle → loading → live
// HUD: top bar (tag + signal bars + REC), bottom bar (subtitle + coords + ping)
function AboutTrailer({ youtubeId = "dQw4w9WgXcQ" }: { youtubeId?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const noiseRef = useRef<HTMLCanvasElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "live">("idle");
  const [sigPct, setSigPct] = useState(0);
  const [ping, setPing] = useState("---");

  // Animate signal pct on mount
  useEffect(() => {
    gsap.to(
      { v: 0 },
      {
        v: 85,
        duration: 2.8,
        ease: "power2.out",
        delay: 1.0,
        onUpdate() {
          setSigPct(Math.round((this as any).targets()[0].v));
        },
      },
    );
    // Ping counter
    const t = setInterval(() => {
      setPing(`${18 + Math.floor(Math.random() * 10)}ms`);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // Noise canvas — idle only
  useEffect(() => {
    const canvas = noiseRef.current;
    if (!canvas || phase !== "idle") return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const draw = () => {
      const { width: W, height: H } = canvas;
      const img = ctx.createImageData(W, H);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() < 0.45 ? Math.floor(Math.random() * 18) : 0;
        img.data[i] = v * 0.5;
        img.data[i + 1] = v * 0.4;
        img.data[i + 2] = v + Math.floor(Math.random() * 12);
        img.data[i + 3] = 100;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phase]);

  // Scroll entrance
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 82%",
        onEnter() {
          // Intro headline swings in
          gsap.fromTo(
            ".about-trailer__intro-eyebrow",
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
          );
          gsap.fromTo(
            ".about-trailer__intro-title",
            { opacity: 0, y: 32, filter: "blur(6px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.75,
              ease: "power3.out",
              delay: 0.1,
            },
          );
          gsap.fromTo(
            ".about-trailer__intro-sub",
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              delay: 0.28,
            },
          );
          gsap.fromTo(
            ".about-trailer__intro",
            { opacity: 0 },
            { opacity: 1, duration: 0.01 },
          );
          gsap.fromTo(
            ".about-trailer__eyebrow",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
          );
          gsap.fromTo(
            frameRef.current,
            { opacity: 0, y: 36, scale: 0.94, rotateX: -4 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: 0,
              duration: 0.9,
              ease: "power3.out",
              delay: 0.14,
            },
          );
          gsap.fromTo(
            ".about-trailer__hint",
            { opacity: 0 },
            { opacity: 1, duration: 0.5, delay: 0.6 },
          );
          // HUD corners snap in
          gsap.fromTo(
            ".about-trailer__corner",
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              stagger: 0.06,
              duration: 0.28,
              ease: "back.out(2)",
              delay: 0.4,
            },
          );
          // Signal bars grow
          gsap.fromTo(
            ".at-hud__sigbar",
            { scaleY: 0 },
            {
              scaleY: 1,
              stagger: 0.05,
              duration: 0.2,
              ease: "power2.out",
              transformOrigin: "bottom center",
              delay: 0.55,
            },
          );
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Loading sequence
  useEffect(() => {
    if (phase !== "loading") return;
    const ld = loadingRef.current;
    if (!ld) return;

    gsap.to(".about-trailer__overlay", {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
    });
    gsap.fromTo(
      ld,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, delay: 0.25 },
    );

    // Scan sweep
    gsap.fromTo(
      ".at-load__scan",
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.6,
        ease: "power3.inOut",
        transformOrigin: "left center",
        delay: 0.3,
      },
    );

    // Bars rise
    const bars = ld.querySelectorAll<HTMLSpanElement>(".at-load__bar");
    gsap.fromTo(
      bars,
      { scaleY: 0, opacity: 0 },
      {
        scaleY: 1,
        opacity: 1,
        stagger: 0.07,
        duration: 0.22,
        ease: "power2.out",
        transformOrigin: "bottom center",
        delay: 0.4,
      },
    );

    // Status cycle
    const statuses = [
      "ACQUIRING SIGNAL…",
      "TRIANGULATING SOURCE…",
      "SIGNAL LOCKED ✓",
      "DECODING STREAM…",
      "READY",
    ];
    const statusEl = ld.querySelector<HTMLSpanElement>(".at-load__status");
    let si = 0;
    const cycle = setInterval(() => {
      si++;
      if (statusEl)
        statusEl.textContent = statuses[Math.min(si, statuses.length - 1)];
      if (si >= statuses.length - 1) clearInterval(cycle);
    }, 280);

    // Percentage
    const pctEl = ld.querySelector<HTMLSpanElement>(".at-load__pct");
    gsap.to(
      { v: 0 },
      {
        v: 100,
        duration: 1.5,
        ease: "power1.inOut",
        delay: 0.35,
        onUpdate() {
          if (pctEl)
            pctEl.textContent = `${Math.round((this as any).targets()[0].v)}%`;
        },
      },
    );

    // Pre-load the iframe BEFORE animation ends
    const preloadTimer = setTimeout(() => {
      // Inject a hidden iframe to start buffering
      const preload = document.createElement("iframe");
      preload.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
      preload.style.cssText =
        "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:-9999px;";
      preload.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      document.body.appendChild(preload);

      // Store reference to remove later
      (window as any).__ytPreload = preload;
    }, 1900); // 200ms before the 1900ms flash

    const timer = setTimeout(() => {
      clearInterval(cycle);
      gsap.to(ld, {
        opacity: 0,
        scale: 1.05,
        filter: "brightness(4) saturate(0)",
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          // Remove the preload iframe
          if ((window as any).__ytPreload) {
            document.body.removeChild((window as any).__ytPreload);
            delete (window as any).__ytPreload;
          }
          setPhase("live");
        },
      });
    }, 2600);

    return () => {
      clearTimeout(timer);
      clearTimeout(preloadTimer);
      clearInterval(cycle);
    };
  }, [phase]);

  // iframe fade in
  useEffect(() => {
    if (phase !== "live") return;
    gsap.fromTo(
      ".about-trailer__iframe",
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power2.out" },
    );
  }, [phase]);

  const SIG_BARS = 8;

  return (
    <div ref={wrapRef} className="about-trailer">
      {/* Sway-in headline above the frame */}
      <div className="about-trailer__intro" style={{ opacity: 0 }}>
        <p className="about-trailer__intro-eyebrow">
          <i className="fa-solid fa-satellite-dish" />
          Incoming Transmission
        </p>
        <h3 className="about-trailer__intro-title">
          A Glimpse of
          <br />
          <em>What Awaits.</em>
        </h3>
        <p className="about-trailer__intro-sub">
          One evening. One stage. Unlimited discovery.
        </p>
      </div>

      {/* Divider into frame */}
      <div className="about-trailer__eyebrow" style={{ opacity: 0 }}>
        <span className="about-trailer__line" />
        <span className="about-trailer__label">
          <i
            className="fa-solid fa-film"
            style={{ marginRight: "0.4em", fontSize: "0.7em" }}
          />
          Preview Transmission · Summit EXPO 2026
        </span>
        <span className="about-trailer__line" />
      </div>

      {/* Frame */}
      <div
        ref={frameRef}
        className="about-trailer__frame"
        style={{ opacity: 0 }}
      >
        {/* TOP HUD */}
        <div className="about-trailer__hud about-trailer__hud--top">
          <span className="at-hud__tag">
            <i className="fa-solid fa-circle at-hud__dot-icon" />
            // SUMMIT EXPO · 2026
          </span>

          {/* Signal bars + pct */}
          <div className="at-hud__signal">
            <span className="at-hud__sig-label">SIG</span>
            <div className="at-hud__sigbars">
              {Array.from({ length: SIG_BARS }, (_, i) => (
                <span
                  key={i}
                  className="at-hud__sigbar"
                  style={{
                    height: `${5 + i * 2}px`,
                    opacity: (i / (SIG_BARS - 1)) * 100 <= sigPct ? 1 : 0.15,
                  }}
                />
              ))}
            </div>
            <span className="at-hud__sig-pct">{sigPct}%</span>
          </div>

          {/* Network latency bar */}
          <div className="at-hud__net">
            <span className="at-hud__net-label">
              <i className="fa-solid fa-wifi" />
            </span>
            <div className="at-hud__net-bar">
              <div
                className="at-hud__net-fill"
                style={{ width: `${sigPct}%` }}
              />
            </div>
          </div>

          <span className="at-hud__rec">
            <i className="fa-solid fa-circle at-hud__rec-dot" />
            REC
          </span>
        </div>

        {/* Corner brackets */}
        <span className="about-trailer__corner about-trailer__corner--tl" />
        <span className="about-trailer__corner about-trailer__corner--tr" />
        <span className="about-trailer__corner about-trailer__corner--bl" />
        <span className="about-trailer__corner about-trailer__corner--br" />

        {/* Video area */}
        <div className="about-trailer__video">
          {/* IDLE */}
          {phase === "idle" && (
            <button
              className="about-trailer__overlay"
              onClick={() => setPhase("loading")}
              aria-label="Play preview"
            >
              <canvas
                ref={noiseRef}
                className="about-trailer__noise"
                aria-hidden="true"
              />
              <div className="about-trailer__scanlines" aria-hidden="true" />
              {/* Hologram tint overlay */}
              <div className="about-trailer__holo" aria-hidden="true" />
              <div className="about-trailer__play">
                <div className="about-trailer__play-ring" aria-hidden="true" />
                <div className="about-trailer__play-btn">
                  <i className="fa-solid fa-play" />
                </div>
                <p className="about-trailer__play-label">Watch the Trailer</p>
                <p className="about-trailer__play-sub">
                  <i
                    className="fa-solid fa-lock-open"
                    style={{ marginRight: "0.3em" }}
                  />
                  Click to decode signal
                </p>
              </div>
            </button>
          )}

          {/* LOADING */}
          {phase === "loading" && (
            <div
              ref={loadingRef}
              className="about-trailer__loading"
              style={{ opacity: 0 }}
            >
              <div className="about-trailer__scanlines" aria-hidden="true" />
              <div className="at-load__scan" />

              <div className="at-load__bars" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <span
                    key={i}
                    className="at-load__bar"
                    style={{ height: `${14 + i * 3.5}px` }}
                  />
                ))}
              </div>

              <div className="at-load__center">
                <div className="at-load__ring">
                  <div className="at-load__ring-inner" />
                  <i className="fa-solid fa-satellite at-load__icon" />
                </div>
                <div className="at-load__info">
                  <span className="at-load__status">ACQUIRING SIGNAL…</span>
                  <span className="at-load__pct">0%</span>
                </div>
              </div>
            </div>
          )}

          {/* LIVE */}
          {phase === "live" && (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title="Summit EXPO 2026 Preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="about-trailer__iframe"
            />
          )}
        </div>

        {/* BOTTOM HUD */}
        <div className="about-trailer__hud about-trailer__hud--bottom">
          <span className="at-hud__tag at-hud__tag--sub">
            <i className="fa-solid fa-film" style={{ marginRight: "0.35em" }} />
            The future begins here
          </span>
          <div className="at-hud__coords">
            <i
              className="fa-solid fa-location-dot"
              style={{ marginRight: "0.3em", opacity: 0.5 }}
            />
            <span>45.3232° N · 75.8951° W</span>
          </div>
          <span className="at-hud__ping">
            <i
              className="fa-solid fa-signal"
              style={{ marginRight: "0.3em" }}
            />
            {ping}
          </span>
        </div>
      </div>

      <p className="about-trailer__hint" style={{ opacity: 0 }}>
        Summit EXPO 2026 · Earl of March Secondary School · Kanata, ON
      </p>
    </div>
  );
}

//  About → Lineup transition component
// Scatter of constellation nodes + connecting lines that visually
// carry the eye from About's magenta-purple stars into Lineup's blue.
// Lives at the bottom of the About section with a negative margin
// so it overlaps the very top of Lineup.
const TRANS_NODES = [
  {
    x: "8%",
    y: "22%",
    size: 3,
    color: "rgba(206,48,114,0.7)",
    delay: "0s",
    dur: "2.8s",
    spike: false,
  },
  {
    x: "18%",
    y: "55%",
    size: 5,
    color: "rgba(180,80,200,0.8)",
    delay: "0.4s",
    dur: "3.5s",
    spike: true,
  },
  {
    x: "29%",
    y: "35%",
    size: 2.5,
    color: "rgba(140,90,220,0.6)",
    delay: "0.8s",
    dur: "2.2s",
    spike: false,
  },
  {
    x: "38%",
    y: "70%",
    size: 4,
    color: "rgba(110,100,240,0.75)",
    delay: "1.1s",
    dur: "4.0s",
    spike: true,
  },
  {
    x: "50%",
    y: "25%",
    size: 6,
    color: "rgba(90,120,255,0.85)",
    delay: "0.2s",
    dur: "3.2s",
    spike: true,
  },
  {
    x: "50%",
    y: "75%",
    size: 3,
    color: "rgba(100,110,245,0.6)",
    delay: "1.5s",
    dur: "2.6s",
    spike: false,
  },
  {
    x: "62%",
    y: "45%",
    size: 4.5,
    color: "rgba(80,140,255,0.80)",
    delay: "0.6s",
    dur: "3.8s",
    spike: true,
  },
  {
    x: "73%",
    y: "62%",
    size: 2.5,
    color: "rgba(70,150,255,0.65)",
    delay: "1.2s",
    dur: "2.4s",
    spike: false,
  },
  {
    x: "82%",
    y: "30%",
    size: 5,
    color: "rgba(80,160,255,0.80)",
    delay: "0.9s",
    dur: "3.1s",
    spike: true,
  },
  {
    x: "92%",
    y: "58%",
    size: 3,
    color: "rgba(80,160,255,0.60)",
    delay: "0.3s",
    dur: "2.9s",
    spike: false,
  },
];

// Edges connecting the nodes — indices into TRANS_NODES
const TRANS_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [4, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [1, 4],
  [4, 8],
  [2, 6],
];

function AboutToLineupTransition() {
  const transRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = transRef.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        onEnter() {
          // Nodes burst in staggered from center outward
          gsap.fromTo(
            ".about-transition__node",
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              stagger: { each: 0.06, from: "center" },
              duration: 0.6,
              ease: "back.out(2.5)",
            },
          );
          // Edges draw on after nodes
          const edges = el.querySelectorAll<SVGLineElement>(
            ".about-transition__edge",
          );
          edges.forEach((edge, i) => {
            const len = edge.getTotalLength?.() ?? 100;
            gsap.set(edge, { strokeDasharray: len, strokeDashoffset: len });
            gsap.to(edge, {
              strokeDashoffset: 0,
              duration: 0.5,
              delay: 0.4 + i * 0.06,
              ease: "power2.inOut",
            });
          });
          // Lines fade in
          gsap.fromTo(
            ".about-transition__line",
            { scaleX: 0, opacity: 0 },
            {
              scaleX: 1,
              opacity: 1,
              stagger: 0.15,
              duration: 0.9,
              ease: "power3.out",
              transformOrigin: "center center",
              delay: 0.2,
            },
          );
          // Label fades in last
          gsap.fromTo(
            ".about-transition__label",
            { opacity: 0, letterSpacing: "0.8em" },
            {
              opacity: 0.45,
              letterSpacing: "0.55em",
              duration: 1.0,
              ease: "power2.out",
              delay: 0.8,
            },
          );
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={transRef} className="about-transition" aria-hidden="true">
      <div className="about-transition__fade" />

      {/* Constellation lines */}
      <div className="about-transition__line about-transition__line--1" />
      <div className="about-transition__line about-transition__line--2" />
      <div className="about-transition__line about-transition__line--3" />

      {/* SVG edges between nodes */}
      <svg
        className="about-transition__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {TRANS_EDGES.map(([ai, bi], ei) => {
          const a = TRANS_NODES[ai],
            b = TRANS_NODES[bi];
          const ax = parseFloat(a.x),
            ay = parseFloat(a.y);
          const bx = parseFloat(b.x),
            by = parseFloat(b.y);
          // Blend color from node a
          return (
            <line
              key={ei}
              className="about-transition__edge"
              x1={`${ax}%`}
              y1={`${ay}%`}
              x2={`${bx}%`}
              y2={`${by}%`}
              stroke={
                ei < 6 ? "rgba(160,80,220,0.35)" : "rgba(80,140,255,0.30)"
              }
              strokeWidth="0.3"
              strokeDasharray="3 4"
            />
          );
        })}
      </svg>

      {/* Star nodes */}
      {TRANS_NODES.map((n, i) => (
        <div
          key={i}
          className={`about-transition__node${n.spike ? " about-transition__node--spike" : ""}`}
          style={
            {
              left: n.x,
              top: n.y,
              width: n.size,
              height: n.size,
              transform: "translate(-50%, -50%)",
              background: n.color,
              boxShadow: `0 0 ${n.size * 3}px ${n.color}`,
              animationDelay: n.delay,
              animationDuration: n.dur,
              "--tn-color": n.color,
            } as React.CSSProperties
          }
        />
      ))}

      <span className="about-transition__label">— summit expo 2026 —</span>
    </div>
  );
}

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const spaceRef = useRef<HTMLCanvasElement>(null);
  const constRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);

  useSpaceCanvas(spaceRef);
  useConstellations(constRef);
  useMouseTrail(trailRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
      gsap.fromTo(
        leftRef.current,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: leftRef.current,
            start: "top 83%",
            toggleActions: "play none none reverse",
          },
        },
      );
      gsap.fromTo(
        rightRef.current,
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          ease: "power2.out",
          delay: 0.1,
          scrollTrigger: {
            trigger: rightRef.current,
            start: "top 83%",
            toggleActions: "play none none reverse",
          },
        },
      );
      const cards =
        gridRef.current?.querySelectorAll<HTMLDivElement>(".about-card") ?? [];
      gsap.fromTo(
        Array.from(cards),
        { opacity: 0, y: 32, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: { each: 0.055, from: "start" },
          duration: 0.55,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        },
      );
      gsap.fromTo(
        statsRef.current?.querySelectorAll<HTMLDivElement>(".about-stat") ?? [],
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 83%",
            toggleActions: "play none none reverse",
          },
        },
      );
      gsap.fromTo(
        closingRef.current,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: closingRef.current,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        },
      );

      // Animate margin glyphs on scroll
      gsap.utils.toArray<HTMLElement>(".about-glyph").forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.5, rotate: (el.dataset.rot ?? "0") + "deg" },
          {
            opacity: 1,
            scale: 1,
            rotate: el.dataset.rot + "deg",
            duration: 1.2,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
            delay: i * 0.08,
          },
        );
        // Slow float animation
        gsap.to(el, {
          y: `${Math.sin(i) * 18 + 12}px`,
          duration: 3 + i * 0.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.3,
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="about" id="about">
      {/* Background layers */}
      <canvas
        ref={spaceRef}
        className="about-space-canvas"
        aria-hidden="true"
      />
      <canvas
        ref={constRef}
        className="about-constellation-canvas"
        aria-hidden="true"
      />
      <canvas
        ref={trailRef}
        className="about-trail-canvas"
        aria-hidden="true"
      />

      {/* Nebula glows */}
      <div className="about-glow about-glow--r" aria-hidden="true" />
      <div className="about-glow about-glow--l" aria-hidden="true" />
      <div className="about-glow about-glow--center" aria-hidden="true" />

      {/* Decorative star glyphs in margins */}
      {MARGIN_GLYPHS.map((g, i) => (
        <div
          key={i}
          className="about-glyph"
          data-rot={g.rot}
          aria-hidden="true"
          style={{
            top: g.top,
            left: "left" in g ? (g as any).left : undefined,
            right: "right" in g ? (g as any).right : undefined,
            width: g.size,
            height: g.size,
            animationDelay: `${g.delay}s`,
            opacity: 0,
          }}
        >
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 5 L55 44 L94 50 L55 56 L50 95 L45 56 L6 50 L45 44 Z"
              fill="none"
              stroke="rgba(180,140,255,0.35)"
              strokeWidth="2"
            />
            <circle cx="50" cy="50" r="4" fill="rgba(200,160,255,0.45)" />
          </svg>
        </div>
      ))}

      <RocketPath rocketSrc="/rocket.png" />

      <div className="about-inner">
        <div ref={headRef} className="about-head">
          <p className="about-eyebrow">About the Expo</p>
          <h2 className="about-title">
            A show-and-tell of the
            <br />
            <em>most spectacular order</em>
          </h2>
          <div className="about-rule" aria-hidden="true" />
        </div>

        <div className="about-manifesto">
          <div ref={leftRef} className="about-manifesto-block">
            <span className="about-block-label">Vision</span>
            <p className="about-block-text">
              Where explorers connect and ideas collide.
            </p>
            <a
              href="#register"
              className="about-cta-btn"
              aria-label="Register your project"
            >
              <span className="cta-shimmer" aria-hidden="true" />
              <span className="cta-label">Register your project</span>
            </a>
          </div>

          <div className="about-manifesto-sep" aria-hidden="true" />

          <div ref={rightRef} className="about-manifesto-block">
            <span className="about-block-label">Mission</span>
            <p className="about-block-body">
              Summit EXPO celebrates Kanata youth innovation across engineering
              and STEM research, under the theme "All That Can Be." The evening
              unfolds in two Acts: the "pitch night" and the "science fair."
              Throughout, professional guests look for outstanding projects,
              culminating in an awards ceremony.
            </p>
          </div>
        </div>

        <p className="about-eyebrow" style={{ marginBottom: "1.2rem" }}>
          What could be exhibited
        </p>
        <div ref={gridRef} className="about-grid">
          {FIELDS.map((f) => (
            <div key={f.label} className="about-card">
              <FontAwesomeIcon
                icon={f.icon}
                className="about-card-icon"
                aria-hidden="true"
              />
              <span className="about-card-label">{f.label}</span>
              <span className="about-card-desc">{f.desc}</span>
            </div>
          ))}
        </div>

        <div className="about-quote-wrap">
          <div className="about-quote-line" aria-hidden="true" />
          <p className="about-quote">
            Software that learns. Circuits that sense. Steak grown from plants.
            Primes found in bedrooms. Comets named after students.
            <br />
            <br />
            <strong>The possibilities are, quite literally, infinite.</strong>
          </p>
          <div className="about-quote-line" aria-hidden="true" />
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
            Inspired by the audacity of <em>Expo&nbsp;67</em> — the belief that
            human ingenuity, given a stage, can change everything.
          </p>
        </div>

        {/* Embedded trailer  sits inside About, shares its canvas */}
        <AboutTrailer />
      </div>

      {/* About → Lineup transition */}
      <AboutToLineupTransition />
    </section>
  );
}
