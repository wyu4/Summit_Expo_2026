import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

;

// Lerp factor — higher = snappier, lower = more floaty
const LERP = 0.09;

let currentY  = 0;
let targetY   = 0;
let rafId     = 0;
let _content: HTMLElement | null = null;

/** Smoothly scroll to a selector or pixel offset */
export function smoothScrollTo(target: string | number, duration = 1.0) {
  let destY: number;
  if (typeof target === 'number') {
    destY = target;
  } else {
    const el = document.querySelector(target);
    if (!el) return;
    destY = (el as HTMLElement).offsetTop;
  }
  gsap.to(window, {
    scrollTo: { y: destY, autoKill: false },
    duration,
    ease: 'power3.inOut',
  });
}

export function useSmoothScroll() {
  useEffect(() => {
    // Dynamically import ScrollToPlugin only on client
    import('gsap/ScrollToPlugin').then(({ ScrollToPlugin }) => {
      gsap.registerPlugin(ScrollToPlugin);
    });

    const wrapper = document.getElementById('smooth-wrapper');
    const content = document.getElementById('smooth-content');
    if (!wrapper || !content) return;

    _content = content;

    // Set wrapper to fill viewport (fixed, overflow hidden)
    Object.assign(wrapper.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    });

    // Content sits normally inside, translated by JS
    content.style.willChange = 'transform';

    // Create a spacer div that gives the document its real scroll height
    const spacer = document.createElement('div');
    spacer.id = 'smooth-spacer';
    document.body.appendChild(spacer);

    const syncSpacer = () => {
      spacer.style.height = `${content.scrollHeight}px`;
      ScrollTrigger.refresh();
    };
    syncSpacer();

    // ResizeObserver keeps spacer in sync
    const ro = new ResizeObserver(syncSpacer);
    ro.observe(content);

    // Sync targetY with real scroll
    const onScroll = () => { targetY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    currentY = window.scrollY;
    targetY  = currentY;

    const tick = () => {
      // Lerp toward target
      currentY += (targetY - currentY) * LERP;
      // Snap to avoid sub-pixel drift
      if (Math.abs(targetY - currentY) < 0.05) currentY = targetY;
      content.style.transform = `translateY(${-currentY}px)`;
      // Tell ScrollTrigger where we are
      ScrollTrigger.update();
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      spacer.remove();
      // Reset styles
      wrapper.style.cssText    = '';
      content.style.cssText    = '';
      _content = null;
    };
  }, []);
}