import { useEffect, useRef } from "react";
import "./RocketGate.css";

export interface Waypoint {
  x: number;
  y: number;
}
export interface SavedPath {
  refW: number;
  refH: number;
  points: Waypoint[];
}

interface Props {
  path: SavedPath;
  gateSrc?: string; // image in /public, default /gate.png
  size?: number; // width in px, default 120
  offsetX?: number; // px nudge from the waypoint (- = left, + = right)
  offsetY?: number; // px nudge from the waypoint (- = up,   + = down)
  /**
   * Which waypoint to anchor to.
   * 0          = first point (entry portal — rocket flies OUT of here)
   * -1 or omit = last point  (exit portal  — rocket flies INTO here)
   * Any other number = that index
  */
  pointIndex?: number;
}

export function RocketGate({
  path,
  gateSrc = "/gate.png",
  size = 120,
  offsetX = 0,
  offsetY = 0,
  pointIndex = -1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const place = () => {
      const idx =
        pointIndex < 0
          ? path.points.length - 1 // last point
          : Math.min(pointIndex, path.points.length - 1);

      const pt = path.points[idx];
      const sx = window.innerWidth / path.refW;
      const sy = document.documentElement.scrollHeight / path.refH;

      el.style.left = `${pt.x * sx + offsetX}px`;
      el.style.top = `${pt.y * sy - window.scrollY + offsetY}px`;
    };

    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [path, offsetX, offsetY, pointIndex]);

  return (
    <div ref={ref} className="rgate-wrap" aria-hidden="true">
      <img
        src={gateSrc}
        alt=""
        className="rgate-img"
        draggable={false}
        style={{ width: size }}
      />
    </div>
  );
}
