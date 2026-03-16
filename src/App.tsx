import { Nav }            from './components/Navbar/Nav';
import { Hero }           from './components/Hero/Hero';
import { Lineup } from './components/Lineup/Lineup';
import { Cursor }         from './components/Cursor/Cursor';
import { About }          from './components/About/About';
import { StarTransition } from './components/StarTransition/StarTransition';
import { RocketPath }     from './components/ScrollRocket/RocketPath';
import { PathMapper } from './components/StarTransition/Pathmapper';
export default function App() {
  return (
    
    <>
    {/* <PathMapper /> */}
      {/* Custom star cursor */}
      <Cursor />

      {/* Rocket flies in page MARGINS, position:fixed, never clips content */}
      {/* <RocketPath /> */}

      {/* Fixed nav — hidden until hero scroll ends */}
      <Nav />

      <main>
        <Hero />
        {/* Star explosion bridge between hero and about */}
        {/* <StarTransition /> */}
        <About />
        <Lineup />
        
        {/* TODO: Lineup, Logistics, Judges, FAQ */}
      </main>
    </>
  );
}