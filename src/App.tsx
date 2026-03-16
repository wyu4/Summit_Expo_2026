import { Nav } from "./components/Navbar/Nav";
import { Hero } from "./components/Hero/Hero";
import { Lineup } from "./components/Lineup/Lineup";
import { Cursor } from "./components/Cursor/Cursor";
import { About } from "./components/About/About";
import { FAQ } from "./components/FAQ/FAQ";
import { PracticalInfo } from "./components/PracticalInfo/PracticalInfo";
import {Register} from "./components/Register/Register";
import { WaypointEditor } from "./components/Waypoint/WaypointEditor";
// import { WaypointEditor } from "./components/Waypoint/WaypointEditor";
export default function App() {
  return (
    <>
      {/* <PathMapper /> */}
      {/* Custom star cursor */}
      <Cursor />

      {/* Rocket flies in page MARGINS, position:fixed, never clips content */}
      {/* <RocketPath /> */}
      {/* <WaypointEditor /> */}

      <Nav />

      <main>
        <Hero />
        {/* Star explosion bridge between hero and about */}
        {/* <StarTransition /> */}
        <About />
        {/* <Trailer /> */}
        <Lineup />
        <PracticalInfo />
        <FAQ />
        <Register />

        {/* TODO: Lineup, Logistics, Judges, FAQ */}
      </main>
    </>
  );
}
