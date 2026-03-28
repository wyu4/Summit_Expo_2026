import { useEffect, useRef } from "react";
import {gsap, ScrollTrigger} from "../../utils/gsap";
import "./Register.css";
import { useVisibleCanvas } from "../../utils/useVisibleCanvas";

;

// TODO: replace with actual form links once they're live. For now these can be placeholders
const EXHIBITOR_FORM = "https://forms.gle/vx68poaxMEnezRP69";
const ATTENDEE_FORM = "https://forms.google.com/...";

// "What happens next" timeline items
const TIMELINE = [
  {
    icon: "fa-paper-plane",
    color: "#CE3072",
    step: "01",
    title: "Submit your form",
    body: "Fill out the form for exhibitors or attendees. Takes about two minutes.",
  },
  {
    icon: "fa-envelope-open-text",
    color: "#6789A3",
    step: "02",
    title: "Confirmation email",
    body: "We'll send a confirmation to the address you provide. Check your spam folder if you don't see it.",
  },
  {
    icon: "fa-comments",
    color: "#9B5BBF",
    step: "03",
    title: "We stay in touch",
    body: "Exhibitors receive logistics details, prep materials, and answers to any questions via email.",
  },
  {
    icon: "fa-rocket",
    color: "#5080C8",
    step: "04",
    title: "Show up & launch",
    body: "Arrive at Earl of March SS on event night. Doors open at 5:30 PM — we'll handle the rest.",
  },
];

function useRegisterCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useVisibleCanvas(canvasRef, (canvas) => {
    interface S { x:number; y:number; r:number; vx:number; vy:number; op:number; ph:number; sp:number; hue:number; }
    let stars: S[] = [], t = 0;
 
    const seed = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      stars = Array.from({ length: 80 }, () => {
        const a = Math.random() * Math.PI * 2, s = 0.004 + Math.random() * 0.015;
        return {
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.1 + 0.15,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          op: Math.random() * 0.65 + 0.2,
          ph: Math.random() * Math.PI * 2, sp: Math.random() * 0.8 + 0.2,
          hue: 270 + Math.random() * 80,
        };
      });
    };
    seed();
 
    return (_c: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dt: number) => {
      t += (dt / 1000) * 60 * 0.01;
      const W = _c.offsetWidth, H = _c.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -2) s.x = W + 2; if (s.x > W + 2) s.x = -2;
        if (s.y < -2) s.y = H + 2; if (s.y > H + 2) s.y = -2;
        const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph), al = s.op * (0.3 + 0.7 * tw);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},60%,70%,${al * 0.06})`; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue},55%,90%,${al})`; ctx.fill();
        if (al > 0.65 && s.r > 0.9) {
          const sp = s.r * 5.5 * al;
          ctx.strokeStyle = `hsla(${s.hue},55%,82%,${al * 0.32})`; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(s.x - sp, s.y); ctx.lineTo(s.x + sp, s.y);
          ctx.moveTo(s.x, s.y - sp); ctx.lineTo(s.x, s.y + sp); ctx.stroke();
        }
      }
    };
  }, { fps: 24 });
}


export function Register() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useRegisterCanvas(canvasRef);

  // GSAP scroll entrances
  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 78%",
        onEnter() {
          gsap.fromTo(
            ".reg-eyebrow",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" },
          );
          gsap.fromTo(
            ".reg-title",
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
            ".reg-sub",
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              delay: 0.25,
            },
          );
          gsap.fromTo(
            ".reg-card",
            { opacity: 0, y: 40, scale: 0.94 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.14,
              duration: 0.7,
              ease: "power3.out",
              delay: 0.35,
            },
          );
        },
      });

      ScrollTrigger.create({
        trigger: ".reg-timeline",
        start: "top 82%",
        onEnter() {
          gsap.fromTo(
            ".reg-timeline__title",
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
          );
          gsap.fromTo(
            ".reg-step",
            { opacity: 0, x: -24 },
            {
              opacity: 1,
              x: 0,
              stagger: 0.12,
              duration: 0.55,
              ease: "power3.out",
              delay: 0.15,
            },
          );
          // Draw the connecting line
          gsap.fromTo(
            ".reg-timeline__track",
            { scaleY: 0 },
            {
              scaleY: 1,
              duration: 0.8,
              ease: "power2.inOut",
              transformOrigin: "top center",
              delay: 0.1,
            },
          );
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="register" className="reg">
      <canvas ref={canvasRef} className="reg__canvas" aria-hidden="true" />
      <div className="reg__nebula" aria-hidden="true" />

      <div className="reg__inner">
        {/* Header */}
        <div className="reg__header">
          <p className="reg-eyebrow" style={{ opacity: 0 }}>
            <i className="fa-solid fa-rocket" />
            Initiate Launch Sequence
          </p>
          <h2 className="reg-title" style={{ opacity: 0 }}>
            Register
          </h2>
          <p className="reg-sub" style={{ opacity: 0 }}>
            Two paths. One unforgettable evening.
          </p>
        </div>

        {/* Two registration cards */}
        <div className="reg-cards">
          {/* Exhibitor */}
          <div className="reg-card reg-card--exhibitor" style={{ opacity: 0 }}>
            <div className="reg-card__glow" aria-hidden="true" />
            <div className="reg-card__header">
              <div className="reg-card__icon-wrap">
                <i className="fa-solid fa-flask-vial" />
              </div>
              <div>
                <p className="reg-card__eyebrow">For students</p>
                <h3 className="reg-card__title">Exhibit Your Project</h3>
              </div>
            </div>
            <ul className="reg-card__features">
              <li>
                <i className="fa-solid fa-check" /> Open to students from all schools (age ≤ 19)
              </li>
              <li>
                <i className="fa-solid fa-check" /> Solo or team (up to 4)
              </li>
              <li>
                <i className="fa-solid fa-check" /> Any STEM field — finished or
                in-progress
              </li>
              <li>
                <i className="fa-solid fa-check" /> Physical resources can be
                requested
              </li>
              <li>
                <i className="fa-solid fa-check" /> Judged by industry
                professionals
              </li>
            </ul>
            <a
              href={EXHIBITOR_FORM}
              target="_blank"
              rel="noopener noreferrer"
              className="reg-card__btn reg-card__btn--primary"
            >
              <i className="fa-solid fa-rocket" />
              Apply as Exhibitor
              <i className="fa-solid fa-arrow-right reg-card__btn-arrow" />
            </a>
            <p className="reg-card__note">
              <i className="fa-solid fa-circle-info" /> Applications reviewed by
              the team — you'll hear back by email.
            </p>
          </div>

          {/* Attendee */}
          <div className="reg-card reg-card--attendee" style={{ opacity: 0 }}>
            <div className="reg-card__glow" aria-hidden="true" />
            <div className="reg-card__header">
              <div className="reg-card__icon-wrap">
                <i className="fa-solid fa-users" />
              </div>
              <div>
                <p className="reg-card__eyebrow">For everyone</p>
                <h3 className="reg-card__title">Attend the Expo</h3>
              </div>
            </div>
            <ul className="reg-card__features">
              <li>
                <i className="fa-solid fa-check" /> Free admission, open to all
                ages
              </li>
              <li>
                <i className="fa-solid fa-check" /> Watch live pitches in Act I
              </li>
              <li>
                <i className="fa-solid fa-check" /> Explore booths & demos in
                Act II
              </li>
              <li>
                <i className="fa-solid fa-check" /> Score the exhibits — your votes count
              </li>
              <li>
                <i className="fa-solid fa-check" /> Live awards ceremony
              </li>
            </ul>
            <a
              href={ATTENDEE_FORM}
              target="_blank"
              rel="noopener noreferrer"
              className="reg-card__btn reg-card__btn--secondary"
            >
              <i className="fa-solid fa-ticket" />
              Sign Up to Attend
              <i className="fa-solid fa-arrow-right reg-card__btn-arrow" />
            </a>
            <p className="reg-card__note">
              <i className="fa-solid fa-circle-info" /> No approval needed —
              sign up and show up!
            </p>
          </div>
        </div>

        {/* What happens next — timeline */}
        <div className="reg-timeline">
          <h3 className="reg-timeline__title" style={{ opacity: 0 }}>
            <i className="fa-solid fa-route" /> What Happens Next
          </h3>
          <div className="reg-timeline__body">
            <div className="reg-timeline__track" />
            {TIMELINE.map((item, i) => (
              <div key={i} className="reg-step" style={{ opacity: 0 }}>
                <div
                  className="reg-step__node"
                  style={{ "--step-color": item.color } as React.CSSProperties}
                >
                  <i className={`fa-solid ${item.icon}`} />
                  <div className="reg-step__pulse" />
                </div>
                <div className="reg-step__content">
                  <span className="reg-step__num" style={{ color: item.color }}>
                    {item.step}
                  </span>
                  <h4 className="reg-step__title">{item.title}</h4>
                  <p className="reg-step__body">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="reg-footer">
          <p className="reg-footer__text">
            Questions?{" "}
            <a href="mailto:XXXXXX" className="reg-footer__link">
              Shoot us an email
            </a>{" "}
            — we're happy to help.
          </p>
        </div>
      </div>
    </section>
  );
}
