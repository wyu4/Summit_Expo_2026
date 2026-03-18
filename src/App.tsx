import { useState, useEffect, lazy, Suspense } from 'react';
import { Nav } from "./components/Navbar/Nav";
import { Hero } from "./components/Hero/Hero";
import { Cursor } from "./components/Cursor/Cursor";
import { PageLoader } from "./components/PageLoader/PageLoader";

import { About } from "./components/About/About";
import { WaypointEditor } from './components/Waypoint/WaypointEditor';

// Lazy load everything below the fold
// These components' JS won't parse until they're needed
const Lineup = lazy(() => import("./components/Lineup/Lineup").then(m => ({ default: m.Lineup })));
const GalleryBridge = lazy(() => import("./components/GalleryBridge/GalleryBridge").then(m => ({ default: m.GalleryBridge })));
const PracticalInfo = lazy(() => import("./components/PracticalInfo/PracticalInfo").then(m => ({ default: m.PracticalInfo })));
const FAQ = lazy(() => import("./components/FAQ/FAQ").then(m => ({ default: m.FAQ })));
const Register = lazy(() => import("./components/Register/Register").then(m => ({ default: m.Register })));
const Footer = lazy(() => import("./components/Footer/Footer").then(m => ({ default: m.Footer })));

function SectionFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#020010',
    }} aria-hidden="true" />
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [loaded]);

  const handleDone = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setLoaded(true);
  };

  return (
    <>
      {!loaded && <PageLoader onDone={handleDone} />}

      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}>
        <Cursor />
        <Nav />
        {/* <WaypointEditor /> */}
        <main>
          {/* Above-fold: eager */}
          <Hero />
          <About />

          {/* Below-fold: lazy — won't block FCP/LCP/TBT */}
          <Suspense fallback={<SectionFallback />}>
            <Lineup />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <GalleryBridge />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <PracticalInfo />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <FAQ />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <Register />
          </Suspense>
          <Suspense fallback={<div style={{ minHeight: '80px', background: 'rgba(4,2,12,0.82)' }} />}>
            <Footer />
          </Suspense>
        </main>
      </div>
    </>
  );
}