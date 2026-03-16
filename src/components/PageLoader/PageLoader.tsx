import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './PageLoader.css';

interface Props {
  onComplete: () => void;
  siteName?:  string;
  tagline?:   string;
  rocketSrc?: string;
}

const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x:  Math.random() * 100,
  y:  Math.random() * 100,
  r:  Math.random() * 1.6 + 0.3,
  op: Math.random() * 0.6 + 0.2,
  d:  Math.random() * 3 + 1.5,
}));

export function PageLoader({
  onComplete,
  siteName  = 'SUMMIT EXPO',
  tagline   = 'All That Can Be',
  rocketSrc = '/rocket.png',
}: Props) {
  const loaderRef  = useRef<HTMLDivElement>(null);
  const rocketRef  = useRef<HTMLImageElement>(null);
  const nameRef    = useRef<HTMLDivElement>(null);
  const tagRef     = useRef<HTMLParagraphElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);
  const [letters,  setLetters]  = useState<string[]>([]);
  const [showBtn,  setShowBtn]  = useState(false);
  const dismissed = useRef(false);

  const dismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;

    const tl = gsap.timeline({ onComplete });
    tl.to(loaderRef.current, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power4.inOut',
    });
  };

  useEffect(() => {
    const tl = gsap.timeline();

    // Rocket flies in
    tl.fromTo(rocketRef.current,
      { x: 180, y: 180, opacity: 0, rotation: -30, scale: 0.4 },
      { x: 0,   y: 0,   opacity: 1, rotation: 0,   scale: 1,
        duration: 1.0, ease: 'back.out(1.4)' },
      0.5
    );

    // Type out site name letter by letter
    const chars = siteName.split('');
    tl.call(() => {
      let i = 0;
      const interval = setInterval(() => {
        setLetters(chars.slice(0, i + 1));
        i++;
        if (i >= chars.length) clearInterval(interval);
      }, 75);
    }, [], 1.2);

    // Tagline
    tl.fromTo(tagRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
      2.4
    );

    // Enter button
    tl.call(() => setShowBtn(true), [], 3.1);

    // Auto-dismiss after 5s if user hasn't clicked
    tl.call(() => dismiss(), [], 5.0);

    return () => { tl.kill(); };
  }, []);

  // Animate button in when it appears
  useEffect(() => {
    if (!showBtn || !btnRef.current) return;
    gsap.fromTo(btnRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }
    );
  }, [showBtn]);

  return (
    <div ref={loaderRef} className="pl-loader" aria-label="Loading">

      {/* Star field */}
      <svg className="pl-stars" aria-hidden="true">
        {STARS.map(s => (
          <circle
            key={s.id}
            cx={`${s.x}%`} cy={`${s.y}%`}
            r={s.r}
            fill="white"
            opacity={s.op}
            style={{ animation: `pl-twinkle ${s.d}s ease-in-out infinite alternate` }}
          />
        ))}
      </svg>

      {/* Nebula glows */}
      <div className="pl-glow pl-glow--a" aria-hidden="true" />
      <div className="pl-glow pl-glow--b" aria-hidden="true" />

      {/* Content */}
      <div className="pl-content">

        {/* Rocket */}
        <div className="pl-rocket-wrap">
          <img
            ref={rocketRef}
            src={rocketSrc}
            alt=""
            className="pl-rocket"
            draggable={false}
          />
          {/* Cartoon exhaust puffs */}
          <div className="pl-exhaust" aria-hidden="true">
            <span /><span /><span />
          </div>
        </div>

        {/* Site name */}
        <div ref={nameRef} className="pl-name" aria-label={siteName}>
          {letters.map((ch, i) => (
            <span
              key={i}
              className="pl-letter"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
          <span className="pl-cursor" aria-hidden="true">|</span>
        </div>

        {/* Tagline */}
        <p ref={tagRef} className="pl-tagline" style={{ opacity: 0 }}>
          <em>{tagline}</em>
        </p>

        {/* Enter button */}
        {showBtn && (
          <button
            ref={btnRef}
            className="pl-enter-btn"
            onClick={dismiss}
            style={{ opacity: 0 }}
          >
            <span className="pl-enter-inner">
              <span className="pl-enter-star" aria-hidden="true">✦</span>
              Enter
              <span className="pl-enter-star" aria-hidden="true">✦</span>
            </span>
          </button>
        )}
      </div>

      {/* Bottom wipe bar */}
      <div className="pl-wipe-bar" aria-hidden="true" />
    </div>
  );
}