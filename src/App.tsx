import { useState, useEffect } from 'react';
import { Nav } from "./components/Navbar/Nav";
import { Hero } from "./components/Hero/Hero";
import { Lineup } from "./components/Lineup/Lineup";
import { Cursor } from "./components/Cursor/Cursor";
import { About } from "./components/About/About";
import { FAQ } from "./components/FAQ/FAQ";
import { PracticalInfo } from "./components/PracticalInfo/PracticalInfo";
import { Register } from "./components/Register/Register";
import { PageLoader } from "./components/PageLoader/PageLoader";
import { WaypointEditor } from './components/Waypoint/WaypointEditor';
import { Footer } from './components/Footer/Footer';
import { GalleryBridge } from './components/GalleryBridge/GalleryBridge';

export default function App() {
  const [loaded, setLoaded] = useState(false);

  // Lock scroll while loader is showing so the page can't drift
  useEffect(() => {
    if (!loaded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [loaded]);

  const handleDone = () => {
    // Hard snap to top before revealing — prevents mid-page reveal
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
          <Hero />
          <About />
          <Lineup />
          <GalleryBridge />
          <PracticalInfo />
          <FAQ />
          <Register />
          <Footer />
        </main>
      </div>
    </>
  );
}