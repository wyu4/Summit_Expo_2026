/**
 * RocketGate — portal placed at an AnchoredWaypoint.
 *
 * Coordinate system matches RocketPath:
 *   waypoint.selector = CSS selector for the anchor element
 *   waypoint.xPct     = fraction of that element's width
 *   waypoint.yPct     = fraction of that element's height
 *
 * To get document coords:
 *   rect = el.getBoundingClientRect()
 *   docX = rect.left + scrollX + rect.width  * xPct
 *   docY = rect.top  + scrollY + rect.height * yPct
 *
 * Fixed position:
 *   left = docX          (same as rocket: pt.x)
 *   top  = docY - scrollY  (same as rocket: pt.y - window.scrollY)
 */

import { useEffect, useRef } from "react";
import "./RocketGate.css";

export interface AnchoredWaypoint {
  selector: string;
  xPct: number;
  yPct: number;
}

interface Props {
  path: AnchoredWaypoint[];
  gateSrc?: string;
  size?: number;
  offsetX?: number;
  offsetY?: number;
  /** 0 = entry (first point), -1 = exit (last point, default) */
  pointIndex?: number;
}

export function RocketGate({
  path,
  gateSrc = "/gate.png",
  size = 130,
  offsetX = 0,
  offsetY = 0,
  pointIndex = -1,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !path.length) return;

    const idx =
      pointIndex < 0
        ? path.length - 1
        : Math.min(pointIndex, path.length - 1);

    const wp = path[idx];

    const place = () => {
      const anchor = document.querySelector<HTMLElement>(wp.selector);
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      // Document coordinates (same as resolve() in RocketPath)
      const docX = r.left + window.scrollX + r.width  * wp.xPct;
      const docY = r.top  + window.scrollY + r.height * wp.yPct;
      // Convert to fixed viewport coords
      el.style.left = `${docX + offsetX}px`;
      el.style.top  = `${docY - window.scrollY + offsetY}px`;
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