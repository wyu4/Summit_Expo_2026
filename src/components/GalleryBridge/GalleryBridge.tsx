import { useEffect, useRef } from "react";
import {gsap, ScrollTrigger} from "../../utils/gsap";
import "./GalleryBridge.css";
import { useVisibleCanvas } from "../../utils/useVisibleCanvas";

;

const PHOTOS = [
  { src: "/gallery/interlude-2.jpg", caption: "Live pitches, Act I" },
  { src: "/gallery/interlude.jpg", caption: "Project demos, Act II" },
  { src: "/gallery/stage.jpg", caption: "Live performances" },
  { src: "/gallery/liquid-nitrogen-ice-cream.jpg", caption: "HAVING FUN!" },
];

// Scattered grid positions — each photo gets a slight rotation and vertical offset
// so they feel like they were tossed onto the star-field
const LAYOUT = [
  { rot: -3.5, yOff: "0%" },
  { rot: 2.0, yOff: "-6%" },
  { rot: -1.5, yOff: "4%" },
  { rot: 3.0, yOff: "-3%" },
];

  function useGalleryBridgeCanvas(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
  ) {
    useVisibleCanvas(
      canvasRef,
      (canvas) => {
        interface S {
          x: number;
          y: number;
          r: number;
          op: number;
          ph: number;
          sp: number;
          hue: number;
        }
        let stars: S[] = [],
          t = 0;

        const seed = () => {
          const W = canvas.offsetWidth,
            H = canvas.offsetHeight;
          stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.0 + 0.2,
            op: Math.random() * 0.45 + 0.1,
            ph: Math.random() * Math.PI * 2,
            sp: Math.random() * 0.7 + 0.2,
            hue: 200 + Math.random() * 100,
          }));
        };
        seed();

        return (
          _c: HTMLCanvasElement,
          ctx: CanvasRenderingContext2D,
          dt: number,
        ) => {
          t += (dt / 1000) * 60 * 0.009;
          const W = _c.offsetWidth,
            H = _c.offsetHeight;
          ctx.clearRect(0, 0, W, H);
          for (const s of stars) {
            const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph),
              al = s.op * (0.3 + 0.7 * tw);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},65%,70%,${al * 0.06})`;
            ctx.fill();
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue},55%,90%,${al})`;
            ctx.fill();
          }
        };
      },
      { fps: 40 },
    );
  }

export function GalleryBridge() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useGalleryBridgeCanvas(canvasRef);

  // Scroll-driven entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Eyebrow + headline
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 82%",
        onEnter() {
          gsap.fromTo(
            ".gb-eyebrow",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
          );
          gsap.fromTo(
            ".gb-headline",
            { opacity: 0, y: 30, filter: "blur(6px)" },
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
            ".gb-sub",
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              delay: 0.25,
            },
          );
        },
      });

      // Photos slide in with stagger
      ScrollTrigger.create({
        trigger: ".gb-grid",
        start: "top 80%",
        onEnter() {
          gsap.fromTo(
            ".gb-photo-wrap",
            { opacity: 0, y: 50, scale: 0.92},
            {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.12,
              duration: 0.75,
              ease: "power3.out",
              delay: 0.1,
            },
          );
          // Scan lines sweep across each photo
          gsap.fromTo(
            ".gb-scan",
            { scaleX: 0 },
            {
              scaleX: 1,
              stagger: 0.12,
              duration: 0.5,
              ease: "power3.inOut",
              transformOrigin: "left center",
              delay: 0.35,
              onComplete() {
                gsap.to(".gb-scan", {
                  opacity: 0,
                  duration: 0.4,
                  stagger: 0.08,
                });
              },
            },
          );
          // Corner brackets pop in
          gsap.fromTo(
            ".gb-corner",
            { opacity: 0, scale: 0 },
            {
              opacity: 1,
              scale: 1,
              stagger: 0.03,
              duration: 0.25,
              ease: "back.out(2.5)",
              delay: 0.4,
            },
          );
          // Captions fade up
          gsap.fromTo(
            ".gb-caption",
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.12,
              duration: 0.45,
              ease: "power2.out",
              delay: 0.65,
            },
          );
          // Designation tags
          gsap.fromTo(
            ".gb-desig",
            { opacity: 0 },
            { opacity: 1, stagger: 0.1, duration: 0.4, delay: 0.7 },
          );
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="gb" id="gallery">
      <canvas ref={canvasRef} className="gb__canvas" aria-hidden="true" />

      {/* Nebula blobs — pure radial-gradient, no filter */}
      <div className="gb__nebula" aria-hidden="true" />

      {/* Top bridge line from Lineup */}
      <div className="gb__bridge-line" aria-hidden="true" />

      <div className="gb__inner">
        {/* Header */}
        <div className="gb-header">
          <p className="gb-eyebrow" style={{ opacity: 0 }}>
            <span className="gb-pip" />
            Transmission Log · Event Archive
            <span className="gb-pip" />
          </p>
          <h2 className="gb-headline" style={{ opacity: 0 }}>
            From Last Year's
            <br />
            <em>Launch.</em>
          </h2>
          <p className="gb-sub" style={{ opacity: 0 }}>
            Science, in action.
          </p>
        </div>

        {/* 4-photo grid */}
        <div className="gb-grid">
          {PHOTOS.map((photo, i) => (
            <div
              key={i}
              className="gb-photo-wrap"
              style={
                {
                  "--rot": `${LAYOUT[i].rot}deg`,
                  "--yoff": LAYOUT[i].yOff,
                  opacity: 0,
                } as React.CSSProperties
              }
            >
              {/* Scan sweep overlay */}
              <div className="gb-scan" />

              {/* Corner brackets */}
              <span className="gb-corner gb-corner--tl" />
              <span className="gb-corner gb-corner--tr" />
              <span className="gb-corner gb-corner--bl" />
              <span className="gb-corner gb-corner--br" />

              {/* Designation tag */}
              <span className="gb-desig" style={{ opacity: 0 }}>
                LOG-{String(i + 1).padStart(2, "0")}
              </span>

              {/* The photo */}
              <img
                src={photo.src}
                alt={photo.caption}
                className="gb-photo"
                draggable={false}
              />

              {/* Caption bar */}
              <div className="gb-caption" style={{ opacity: 0 }}>
                <span className="gb-caption-dot" />
                {photo.caption}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bridge line into PracticalInfo */}
      <div
        className="gb__bridge-line gb__bridge-line--bottom"
        aria-hidden="true"
      />
    </section>
  );
}
