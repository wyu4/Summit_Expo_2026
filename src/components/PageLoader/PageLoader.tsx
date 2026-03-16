/**
 * PracticalInfo — Mission Briefing
 * Covers: Practical Info, Support Us, Judges, Sponsors + PDF viewer
 * Flows from About's dark indigo → teal/cyan star palette
 */

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './PracticalInfo.css';

gsap.registerPlugin(ScrollTrigger);

// ── Holographic PDF viewer ─────────────────────────────────────────
function SponsorshipPDF({ pdfUrl = '/sponsorship-package.pdf' }: { pdfUrl?: string }) {
  const [open, setOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const viewerRef   = useRef<HTMLDivElement>(null);

  const openViewer = () => {
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const bd = backdropRef.current, vw = viewerRef.current;
      if (!bd || !vw) return;
      gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(vw,
        { opacity: 0, scale: 0.84, rotateX: -8, y: 50 },
        { opacity: 1, scale: 1,    rotateX: 0,  y: 0, duration: 0.55, ease: 'power3.out' }
      );
      gsap.fromTo('.spdf-scan',   { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: 'power3.inOut', transformOrigin: 'left center', delay: 0.1 });
      gsap.fromTo('.spdf-corner', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.05, duration: 0.22, ease: 'back.out(2.5)', delay: 0.2 });
    }));
  };

  const closeViewer = () => {
    const bd = backdropRef.current, vw = viewerRef.current;
    if (!bd || !vw) return;
    gsap.timeline({ onComplete: () => setOpen(false) })
      .to(vw, { opacity: 0, scale: 0.9, y: 20, duration: 0.25, ease: 'power2.in' })
      .to(bd, { opacity: 0, duration: 0.2 }, '-=0.1');
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) closeViewer(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <>
      <button className="spdf-card" onClick={openViewer} aria-label="View sponsorship package">
        <div className="spdf-card__holo" aria-hidden="true">
          <div className="spdf-card__page spdf-card__page--3" />
          <div className="spdf-card__page spdf-card__page--2" />
          <div className="spdf-card__page spdf-card__page--1">
            <i className="fa-solid fa-file-pdf spdf-card__pdf-icon" />
            <div className="spdf-card__lines">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="spdf-card__line" style={{ width: `${35 + Math.sin(i * 1.2) * 28}%`, animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
          <div className="spdf-card__orbit" />
          <div className="spdf-card__glow" />
        </div>
        <div className="spdf-card__text">
          <p className="spdf-card__title">Sponsorship Package</p>
          <p className="spdf-card__sub">Summit EXPO 2026 · PDF</p>
          <span className="spdf-card__cta">
            <i className="fa-solid fa-eye" /> Open Document
          </span>
        </div>
      </button>

      {open && (
        <div className="spdf-backdrop" ref={backdropRef} onClick={closeViewer} style={{ opacity: 0 }}>
          <div ref={viewerRef} className="spdf-viewer" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
            <div className="spdf-scan" />
            <button className="spdf-close" onClick={closeViewer} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
            <span className="spdf-corner spdf-corner--tl" />
            <span className="spdf-corner spdf-corner--tr" />
            <span className="spdf-corner spdf-corner--bl" />
            <span className="spdf-corner spdf-corner--br" />
            <div className="spdf-topbar">
              <span className="spdf-topbar__tag">
                <i className="fa-solid fa-file-pdf" style={{ marginRight: '0.35em' }} />
                SPONSORSHIP PACKAGE · SUMMIT EXPO 2026
              </span>
              <a href={pdfUrl} download className="spdf-topbar__dl">
                <i className="fa-solid fa-download" /> Download
              </a>
            </div>
            <div className="spdf-embed-wrap">
              <iframe src={`${pdfUrl}#view=FitH`} className="spdf-embed" title="Sponsorship Package" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Star canvas (teal palette) ─────────────────────────────────────
function usePiCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    interface Star { x:number; y:number; r:number; vx:number; vy:number; op:number; ph:number; sp:number; hue:number; }
    let stars: Star[] = [], raf = 0, t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      stars = Array.from({ length: 140 }, () => {
        const a = Math.random()*Math.PI*2, s = 0.005+Math.random()*0.018;
        return { x:Math.random()*canvas.width, y:Math.random()*canvas.height,
          r:Math.random()*1.1+0.15, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
          op:Math.random()*0.65+0.15, ph:Math.random()*Math.PI*2,
          sp:Math.random()*0.8+0.2, hue:170+Math.random()*55 };
      });
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const loop = () => {
      t+=0.010; ctx.clearRect(0,0,canvas.width,canvas.height);
      for(const s of stars){
        s.x+=s.vx; s.y+=s.vy;
        if(s.x<-2)s.x=canvas.width+2; if(s.x>canvas.width+2)s.x=-2;
        if(s.y<-2)s.y=canvas.height+2; if(s.y>canvas.height+2)s.y=-2;
        const tw=0.5+0.5*Math.sin(t*s.sp+s.ph), al=s.op*(0.3+0.7*tw);
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r*3.2,0,Math.PI*2);
        ctx.fillStyle=`hsla(${s.hue},60%,68%,${al*0.055})`; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${s.hue},55%,86%,${al})`; ctx.fill();
      }
      raf=requestAnimationFrame(loop);
    };
    loop();
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); };
  }, [ref]);
}

// ── Section bridge from About ──────────────────────────────────────
const BRIDGE_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  left:  `${6 + (((i * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 88}%`,
  delay: `${(((i*3 * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 3.5}s`,
  dur:   `${2.2 + (((i*5 * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 2.8}s`,
  size:  1.8 + (((i*11 * 1664525 + 1013904223) >>> 0) / 0xffffffff) * 3,
  color: i % 3 === 0 ? 'rgba(80,200,200,0.55)' : i % 3 === 1 ? 'rgba(60,140,200,0.55)' : 'rgba(100,80,220,0.50)',
}));

// ── Main component ─────────────────────────────────────────────────
export function PracticalInfo() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const bridgeRef  = useRef<HTMLDivElement>(null);

  usePiCanvas(canvasRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Bridge entrance
      ScrollTrigger.create({
        trigger: bridgeRef.current,
        start: 'top 90%',
        onEnter() {
          gsap.fromTo('.pi-bridge__line',
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 1.1, ease: 'power3.inOut', transformOrigin: 'center center' }
          );
          gsap.fromTo('.pi-bridge__particle',
            { opacity: 0, scale: 0 },
            { opacity: 1, scale: 1, stagger: { each: 0.05, from: 'random' }, duration: 0.35, ease: 'back.out(2)' }
          );
          gsap.fromTo('.pi-bridge__label',
            { opacity: 0, letterSpacing: '0.7em' },
            { opacity: 0.5, letterSpacing: '0.42em', duration: 0.9, ease: 'power2.out', delay: 0.4 }
          );
        },
      });

      // Each block animates in
      sectionRef.current?.querySelectorAll<HTMLDivElement>('.pi-block').forEach(block => {
        ScrollTrigger.create({
          trigger: block,
          start: 'top 83%',
          onEnter() {
            gsap.fromTo(block.querySelector('.pi-block__head'),
              { opacity: 0, y: 28 },
              { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out' }
            );
            gsap.fromTo(block.querySelectorAll('.pi-item'),
              { opacity: 0, y: 22 },
              { opacity: 1, y: 0, stagger: 0.09, duration: 0.55, ease: 'power2.out', delay: 0.12 }
            );
          },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="practical-info" className="pi">
      <canvas ref={canvasRef} className="pi__canvas" aria-hidden="true" />
      <div className="pi__nebula" aria-hidden="true" />

      {/* ── Bridge from About/Lineup ── */}
      <div ref={bridgeRef} className="pi-bridge" aria-hidden="true">
        <div className="pi-bridge__line pi-bridge__line--1" />
        <div className="pi-bridge__line pi-bridge__line--2" />
        {BRIDGE_PARTICLES.map((p, i) => (
          <div key={i} className="pi-bridge__particle" style={{
            left: p.left, width: p.size, height: p.size,
            background: p.color, animationDelay: p.delay,
            animationDuration: p.dur, boxShadow: `0 0 ${p.size*2.5}px ${p.color}`,
          }} />
        ))}
        <span className="pi-bridge__label">— mission briefing —</span>
      </div>

      <div className="pi__inner">

        {/* Section eyebrow */}
        <div className="pi__eyebrow-wrap">
          <p className="pi-eyebrow">
            <span className="pi-pip" />
            Mission Briefing
            <span className="pi-pip" />
          </p>
        </div>

        {/* ════ PRACTICAL INFO ════ */}
        <div className="pi-block">
          <div className="pi-block__head">
            <h2 className="pi-block__title">
              <i className="fa-solid fa-location-dot pi-block__icon" />
              Practical Info
            </h2>
            <div className="pi-block__rule" />
          </div>

          <div className="pi-venue-grid">
            {/* Venue + time cards */}
            <div className="pi-item pi-card">
              <div className="pi-card__icon-wrap">
                <i className="fa-solid fa-school" />
              </div>
              <div className="pi-card__body">
                <p className="pi-card__label">Venue</p>
                <p className="pi-card__value">Earl of March Secondary School</p>
                <p className="pi-card__sub">Kanata, Ontario</p>
              </div>
            </div>

            <div className="pi-item pi-card">
              <div className="pi-card__icon-wrap">
                <i className="fa-solid fa-clock" />
              </div>
              <div className="pi-card__body">
                <p className="pi-card__label">Date &amp; Time</p>
                <p className="pi-card__value">dd Month 2026</p>
                <p className="pi-card__sub">x&nbsp;pm – x&nbsp;pm</p>
              </div>
            </div>
          </div>

          {/* Map + parking row */}
          <div className="pi-item pi-map-row">
            <div className="pi-map-frame">
              <span className="pi-map-corner pi-map-corner--tl" />
              <span className="pi-map-corner pi-map-corner--tr" />
              <span className="pi-map-corner pi-map-corner--bl" />
              <span className="pi-map-corner pi-map-corner--br" />
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2797.4!2d-75.899!3d45.352!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cce05b25f5113af%3A0xb8f1352e9e5dfa06!2sEarl%20of%20March%20Secondary%20School!5e0!3m2!1sen!2sca!4v1"
                className="pi-map"
                title="Earl of March Secondary School"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="pi-map-info">
              <div className="pi-info-card">
                <p className="pi-info-card__title">
                  <i className="fa-solid fa-square-parking" /> Parking &amp; Entry
                </p>
                <p className="pi-info-card__body">
                  Parking is available in the main lot off Teron Road.
                  Enter through the main front doors and follow the signage to the gymnasium.
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>
              <div className="pi-info-card">
                <p className="pi-info-card__title">
                  <i className="fa-solid fa-clipboard-list" /> Housekeeping
                </p>
                <ul className="pi-info-card__list">
                  <li>Follow the signage throughout the building.</li>
                  <li>Washrooms are located inside the main entrance to the right.</li>
                  <li>Please proceed directly to the gymnasium upon entry.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ════ SUPPORT US ════ */}
        <div className="pi-block">
          <div className="pi-block__head">
            <h2 className="pi-block__title">
              <i className="fa-solid fa-heart pi-block__icon" />
              Support Us
            </h2>
            <div className="pi-block__rule" />
          </div>
          <div className="pi-item pi-support">
            <p className="pi-support__body">
              Thank you very much for your interest in supporting high school STEM initiatives!
              Summit EXPO is made possible by the generosity of our sponsors and the community.
            </p>
          </div>
        </div>

        {/* ════ JUDGES ════ */}
        <div className="pi-block">
          <div className="pi-block__head">
            <h2 className="pi-block__title">
              <i className="fa-solid fa-scale-balanced pi-block__icon" />
              Judges
            </h2>
            <div className="pi-block__rule" />
          </div>
          <div className="pi-item pi-contact">
            <div className="pi-contact__avatar">
              <i className="fa-solid fa-user-tie" />
            </div>
            <div className="pi-contact__body">
              <p className="pi-contact__text">
                Please contact us if you would like to be, or provide, a judge at Summit EXPO.
                Judges are professionals from industry, research, and academia across STEM fields.
              </p>
              <a href="mailto:XXXXXX" className="pi-contact__link">
                <i className="fa-solid fa-envelope" /> XXXXXX
              </a>
            </div>
          </div>
        </div>

        {/* ════ SPONSORS ════ */}
        <div className="pi-block">
          <div className="pi-block__head">
            <h2 className="pi-block__title">
              <i className="fa-solid fa-handshake pi-block__icon" />
              Sponsors
            </h2>
            <div className="pi-block__rule" />
          </div>
          <div className="pi-sponsors-row">
            <div className="pi-item pi-contact">
              <div className="pi-contact__avatar">
                <i className="fa-solid fa-building" />
              </div>
              <div className="pi-contact__body">
                <p className="pi-contact__text">
                  Interested in sponsorship opportunities? We'd love to hear from you.
                </p>
                <a href="mailto:XXXXXX" className="pi-contact__link">
                  <i className="fa-solid fa-envelope" /> XXXXXX
                </a>
              </div>
            </div>
            <div className="pi-item">
              <SponsorshipPDF pdfUrl="/sponsorship-package.pdf" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}