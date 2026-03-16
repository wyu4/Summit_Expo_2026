/**
 * PracticalInfo — Mission Briefing
 *
 * Key features:
 * - Leaflet map with dark space tile theme (CartoDB Dark Matter)
 * - Hologram PDF modal with orbit rings + scan line + particle burst
 * - High contrast text throughout
 * - Futuristic terminal window dots (not Apple)
 * - Countdown to May XX 2026, 5:30 PM
 * - Dense layout, no dead space
 */

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './PracticalInfo.css';

gsap.registerPlugin(ScrollTrigger);

// Earl of March SS coords
const VENUE_LAT = 45.3521;
const VENUE_LNG = -75.9042;

//  Leaflet Map 
function SpaceMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Dynamically load Leaflet
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [VENUE_LAT, VENUE_LNG],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });
      mapInstanceRef.current = map;

      // Dark space tile layer — CartoDB Dark Matter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map);

      // Custom glowing marker
      const icon = L.divIcon({
        html: `
          <div class="pi-marker">
            <div class="pi-marker__pulse"></div>
            <div class="pi-marker__pulse pi-marker__pulse--2"></div>
            <div class="pi-marker__core">
              <i class="fa-solid fa-rocket"></i>
            </div>
          </div>`,
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      L.marker([VENUE_LAT, VENUE_LNG], { icon })
        .addTo(map)
        .bindPopup(`
          <div class="pi-popup">
            <p class="pi-popup__title">Earl of March SS</p>
            <p class="pi-popup__sub">Summit EXPO 2026</p>
          </div>
        `, { className: 'pi-leaflet-popup' });

      // Add zoom control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="pi-map-frame">
      <div className="pi-map-hud">
        <span className="pi-map-hud__left">
          <i className="fa-solid fa-satellite pi-map-hud__icon" />
          LIVE MAP · KANATA ON
        </span>
        <span className="pi-map-hud__right">
          <i className="fa-solid fa-crosshairs" />
          45.3232°N · 75.8951°W
        </span>
      </div>
      <span className="pi-map-corner pi-map-corner--tl" />
      <span className="pi-map-corner pi-map-corner--tr" />
      <span className="pi-map-corner pi-map-corner--bl" />
      <span className="pi-map-corner pi-map-corner--br" />
      <div ref={mapRef} className="pi-map" />
    </div>
  );
}

//  Hologram PDF modal 
function SponsorshipPDF({ pdfUrl = '/sponsorship-package.pdf' }: { pdfUrl?: string }) {
  const [open, setOpen] = useState(false);
  const bdRef  = useRef<HTMLDivElement>(null);
  const vwRef  = useRef<HTMLDivElement>(null);
  const o1Ref  = useRef<HTMLDivElement>(null);
  const o2Ref  = useRef<HTMLDivElement>(null);
  const o3Ref  = useRef<HTMLDivElement>(null);

  const openIt = () => {
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const bd = bdRef.current, vw = vwRef.current;
      if (!bd || !vw) return;

      // Backdrop in
      gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });

      // Modal scales + rotates in from deep
      gsap.fromTo(vw,
        { opacity: 0, scale: 0.78, rotateX: -16, rotateY: 4, y: 60, filter: 'blur(8px)' },
        { opacity: 1, scale: 1,    rotateX: 0,   rotateY: 0, y: 0,  filter: 'blur(0px)',
          duration: 0.65, ease: 'power3.out' }
      );

      // Scan line sweeps
      gsap.fromTo('.spdf-scan',
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.7, ease: 'power3.inOut', transformOrigin: 'left center', delay: 0.15 }
      );

      // Corner accents snap in
      gsap.fromTo('.spdf-corner',
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, stagger: 0.06, duration: 0.28, ease: 'back.out(3)', delay: 0.25 }
      );

      // Orbit rings expand out
      [o1Ref, o2Ref, o3Ref].forEach((r, i) => {
        if (!r.current) return;
        gsap.fromTo(r.current,
          { scale: 0.3, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)', delay: 0.2 + i * 0.12 }
        );
      });

      // HUD bar slides in
      gsap.fromTo('.spdf-bar',
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.3 }
      );

      // PDF embed fades in last
      gsap.fromTo('.spdf-embed-wrap',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.45 }
      );
    }));
  };

  const closeIt = () => {
    const bd = bdRef.current, vw = vwRef.current;
    if (!bd || !vw) return;
    gsap.timeline({ onComplete: () => setOpen(false) })
      .to(vw, { opacity: 0, scale: 0.88, rotateX: -8, y: 24, filter: 'blur(4px)', duration: 0.3, ease: 'power2.in' })
      .to(bd, { opacity: 0, duration: 0.22, ease: 'power2.in' }, '-=0.12');
  };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) closeIt(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);

  return (
    <>
      {/* Trigger card */}
      <button className="spdf-card" onClick={openIt} aria-label="View sponsorship package">
        <div className="spdf-card__holo" aria-hidden="true">
          <div className="spdf-page spdf-page--3" />
          <div className="spdf-page spdf-page--2" />
          <div className="spdf-page spdf-page--1">
            <i className="fa-solid fa-file-pdf spdf-page__icon" />
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="spdf-line"
                style={{ width: `${32 + Math.sin(i * 1.3) * 26}%`, animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <div className="spdf-orbit spdf-orbit--1" />
          <div className="spdf-orbit spdf-orbit--2" />
          <div className="spdf-glow" />
        </div>
        <div className="spdf-card__text">
          <p className="spdf-card__title">Sponsorship Package</p>
          <p className="spdf-card__sub">Summit EXPO 2026 · PDF</p>
          <span className="spdf-card__cta">
            <i className="fa-solid fa-eye" /> View Hologram
          </span>
        </div>
      </button>

      {/* Modal */}
      {open && (
        <div className="spdf-backdrop" ref={bdRef} onClick={closeIt} style={{ opacity: 0 }}>
          <div className="spdf-modal-wrap" style={{ perspective: '1200px' }}>
            {/* Orbit rings behind the modal */}
            <div ref={o1Ref} className="spdf-modal-orbit spdf-modal-orbit--1" aria-hidden="true" />
            <div ref={o2Ref} className="spdf-modal-orbit spdf-modal-orbit--2" aria-hidden="true" />
            <div ref={o3Ref} className="spdf-modal-orbit spdf-modal-orbit--3" aria-hidden="true" />

            <div ref={vwRef} className="spdf-viewer" style={{ opacity: 0 }} onClick={e => e.stopPropagation()}>
              {/* Scan line */}
              <div className="spdf-scan" />

              {/* Corner brackets */}
              <span className="spdf-corner spdf-corner--tl" />
              <span className="spdf-corner spdf-corner--tr" />
              <span className="spdf-corner spdf-corner--bl" />
              <span className="spdf-corner spdf-corner--br" />

              {/* HUD bar */}
              <div className="spdf-bar">
                <div className="spdf-bar__left">
                  <div className="spdf-bar__dots">
                    <span className="spdf-dot spdf-dot--close" onClick={closeIt} title="Close" />
                    <span className="spdf-dot spdf-dot--min" title="Minimise" />
                    <span className="spdf-dot spdf-dot--max" title="Fullscreen" />
                  </div>
                  <span className="spdf-bar__tag">
                    <i className="fa-solid fa-file-pdf" /> SPONSORSHIP PACKAGE · SUMMIT EXPO 2026
                  </span>
                </div>
                <a href={pdfUrl} download className="spdf-bar__dl">
                  <i className="fa-solid fa-download" /> Download
                </a>
              </div>

              {/* Embed */}
              <div className="spdf-embed-wrap">
                <iframe src={`${pdfUrl}#view=FitH`} className="spdf-embed" title="Sponsorship Package" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//  Countdown 
const EVENT_DATE = new Date('2026-05-15T17:30:00'); // May 15, 5:30 PM — update XX

function Countdown() {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0, past: false });
  useEffect(() => {
    const tick = () => {
      const diff = EVENT_DATE.getTime() - Date.now();
      if (diff <= 0) { setTime({ d:0,h:0,m:0,s:0,past:true }); return; }
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        past: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const units = [
    { val: time.d, label: 'Days' },
    { val: time.h, label: 'Hrs' },
    { val: time.m, label: 'Min' },
    { val: time.s, label: 'Sec' },
  ];

  return (
    <div className="pi-countdown">
      <p className="pi-countdown__label">
        <i className="fa-solid fa-rocket" />
        {time.past ? 'Mission is live!' : 'T-Minus to Launch'}
      </p>
      <div className="pi-countdown__units">
        {units.map(({ val, label }, i) => (
          <div key={label} className="pi-countdown__unit">
            {i > 0 && <span className="pi-countdown__sep">:</span>}
            <span className="pi-countdown__num">{String(val).padStart(2, '0')}</span>
            <span className="pi-countdown__unit-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

//  Star canvas 
function usePiCanvas(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    interface S { x:number;y:number;r:number;vx:number;vy:number;op:number;ph:number;sp:number;hue:number; }
    let stars: S[] = [], raf = 0, t = 0;
    const resize = () => {
      canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
      stars = Array.from({ length: 180 }, () => {
        const a = Math.random()*Math.PI*2, s = 0.004+Math.random()*0.016;
        return { x:Math.random()*canvas.width, y:Math.random()*canvas.height,
          r:Math.random()*1.2+0.15, vx:Math.cos(a)*s, vy:Math.sin(a)*s,
          op:Math.random()*0.7+0.2, ph:Math.random()*Math.PI*2,
          sp:Math.random()*0.8+0.2, hue:165+Math.random()*60 };
      });
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const loop = () => {
      t += 0.010; ctx.clearRect(0,0,canvas.width,canvas.height);
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x<-2)s.x=canvas.width+2; if (s.x>canvas.width+2)s.x=-2;
        if (s.y<-2)s.y=canvas.height+2; if (s.y>canvas.height+2)s.y=-2;
        const tw=0.5+0.5*Math.sin(t*s.sp+s.ph), al=s.op*(0.3+0.7*tw);
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r*3,0,Math.PI*2);
        ctx.fillStyle=`hsla(${s.hue},60%,68%,${al*0.06})`; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${s.hue},55%,90%,${al})`; ctx.fill();
        if (al>0.65 && s.r>0.9) {
          const sp = s.r*5.5*al;
          ctx.strokeStyle=`hsla(${s.hue},55%,82%,${al*0.32})`; ctx.lineWidth=0.5;
          ctx.beginPath(); ctx.moveTo(s.x-sp,s.y); ctx.lineTo(s.x+sp,s.y);
          ctx.moveTo(s.x,s.y-sp); ctx.lineTo(s.x,s.y+sp); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [ref]);
}

const sr = (n: number) => ((n*1664525+1013904223)>>>0)/0xffffffff;
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  left:  `${6+sr(i*7)*88}%`,
  delay: `${sr(i*3)*3.5}s`,
  dur:   `${2.2+sr(i*5)*2.8}s`,
  size:  1.8+sr(i*11)*3,
  color: i%3===0 ? 'rgba(80,210,210,0.60)' : i%3===1 ? 'rgba(60,148,210,0.60)' : 'rgba(110,88,230,0.55)',
}));

//  Main 
export function PracticalInfo() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const bridgeRef  = useRef<HTMLDivElement>(null);

  usePiCanvas(canvasRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: bridgeRef.current, start: 'top 90%',
        onEnter() {
          gsap.fromTo('.pi-bridge__line', { scaleX:0,opacity:0 }, { scaleX:1,opacity:1,stagger:0.2,duration:1.1,ease:'power3.inOut',transformOrigin:'center center' });
          gsap.fromTo('.pi-bridge__particle', { opacity:0,scale:0 }, { opacity:1,scale:1,stagger:{each:0.05,from:'random'},duration:0.35,ease:'back.out(2)' });
          gsap.fromTo('.pi-bridge__label', { opacity:0,letterSpacing:'0.7em' }, { opacity:1,letterSpacing:'0.42em',duration:0.9,ease:'power2.out',delay:0.4 });
        },
      });

      sectionRef.current?.querySelectorAll<HTMLElement>('.pi-row').forEach(row => {
        ScrollTrigger.create({
          trigger: row, start: 'top 83%',
          onEnter() {
            gsap.fromTo(row.querySelectorAll('.pi-animate'),
              { opacity:0, y:28 }, { opacity:1, y:0, stagger:0.1, duration:0.65, ease:'power3.out' }
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

      {/* Bridge */}
      <div ref={bridgeRef} className="pi-bridge" aria-hidden="true">
        <div className="pi-bridge__line pi-bridge__line--1" />
        <div className="pi-bridge__line pi-bridge__line--2" />
        {PARTICLES.map((p,i) => (
          <div key={i} className="pi-bridge__particle" style={{ left:p.left, width:p.size, height:p.size, background:p.color, animationDelay:p.delay, animationDuration:p.dur, boxShadow:`0 0 ${p.size*2.5}px ${p.color}` }} />
        ))}
        {/* <span className="pi-bridge__label">— mission briefing —</span> */}
      </div>

      <div className="pi__inner">

        {/* Header + Countdown */}
        <div className="pi-row pi__header">
          <div className="pi-animate">
            <p className="pi-eyebrow">
              <i className="fa-solid fa-map-pin" /> Mission Briefing
            </p>
            <h2 className="pi__title">Practical Info</h2>
            <p className="pi__subtitle">Everything you need to make it to the launchpad.</p>
          </div>
          <div className="pi-animate">
            <Countdown />
          </div>
        </div>

        {/* Terminal + Map */}
        <div className="pi-row pi-venue-row">
          <div className="pi-terminal pi-animate">
            {/* Futuristic window bar — not Apple */}
            <div className="pi-terminal__bar">
              <div className="pi-terminal__bar-icons">
                <span className="pi-wdot pi-wdot--r" title="×">×</span>
                <span className="pi-wdot pi-wdot--y" title="−">−</span>
                <span className="pi-wdot pi-wdot--g" title="⤢">⤢</span>
              </div>
              <span className="pi-terminal__bar-title">
                <i className="fa-solid fa-terminal" /> venue.briefing
              </span>
              <span className="pi-terminal__bar-sig">
                <i className="fa-solid fa-circle pi-terminal__bar-live" /> LIVE
              </span>
            </div>
            <div className="pi-terminal__body">
              {[
                { icon:'fa-school',          key:'venue',    val:'Earl of March Secondary School', accent:false },
                { icon:'fa-location-dot',    key:'address',  val:'Kanata, Ontario, Canada',         accent:false },
                { icon:'fa-calendar-days',   key:'date',     val:'May XX, 2026',                    accent:true  },
                { icon:'fa-clock',           key:'time',     val:'5:30 PM – 8:00 PM',               accent:true  },
                { icon:'fa-square-parking',  key:'parking',  val:'Main lot off Teron Road',          accent:false },
                { icon:'fa-door-open',       key:'entry',    val:'Main front doors → gymnasium',    accent:false },
              ].map(({ icon, key, val, accent }) => (
                <div key={key} className="pi-terminal__line">
                  <span className="pi-terminal__key">
                    <i className={`fa-solid ${icon}`} /> {key}
                  </span>
                  <span className={`pi-terminal__val${accent ? ' pi-terminal__val--accent' : ''}`}>{val}</span>
                </div>
              ))}
              <div className="pi-terminal__divider" />
              <div className="pi-terminal__note">
                <i className="fa-solid fa-triangle-exclamation" />
                <span>Follow signage. Washrooms inside main entrance, right.</span>
              </div>
              <div className="pi-terminal__note">
                <i className="fa-solid fa-circle-info" />
                <span>Lorem ipsum — additional housekeeping note here.</span>
              </div>
            </div>
          </div>

          <div className="pi-animate">
            <SpaceMap />
          </div>
        </div>

        {/* Support · Judges · Sponsors */}
        <div className="pi-row pi-cards-grid">

          <div className="pi-card pi-animate">
            <div className="pi-card__top">
              <div className="pi-card__icon"><i className="fa-solid fa-heart" /></div>
              <h3 className="pi-card__title">Support Us</h3>
            </div>
            <p className="pi-card__body">
              Thank you for your interest in supporting high school STEM initiatives.
              Summit EXPO is made possible by the generosity of our community and sponsors.
            </p>
            <div className="pi-card__accent-stars" aria-hidden="true">
              {Array.from({length:6},(_,i)=>(
                <span key={i} className="pi-star" style={{animationDelay:`${i*0.38}s`,animationDuration:`${2+i*0.3}s`}}>✦</span>
              ))}
            </div>
          </div>

          <div className="pi-card pi-animate">
            <div className="pi-card__top">
              <div className="pi-card__icon"><i className="fa-solid fa-scale-balanced" /></div>
              <h3 className="pi-card__title">Judges</h3>
            </div>
            <p className="pi-card__body">
              Judges are professionals from industry, research, and academia across STEM fields.
              Want to be — or refer — a judge at Summit EXPO?
            </p>
            <a href="mailto:XXXXXX" className="pi-card__btn">
              <i className="fa-solid fa-envelope" /> Contact Us
              <i className="fa-solid fa-arrow-right" />
            </a>
          </div>

          <div className="pi-card pi-card--wide pi-animate">
            <div className="pi-card__top">
              <div className="pi-card__icon"><i className="fa-solid fa-handshake" /></div>
              <h3 className="pi-card__title">Sponsors</h3>
            </div>
            <p className="pi-card__body">
              Interested in sponsorship opportunities? We'd love to hear from you.
            </p>
            <div className="pi-card__sponsors-row">
              <a href="mailto:XXXXXX" className="pi-card__btn">
                <i className="fa-solid fa-envelope" /> Get in Touch
                <i className="fa-solid fa-arrow-right" />
              </a>
              <SponsorshipPDF pdfUrl="/sponsorship-package.pdf" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}