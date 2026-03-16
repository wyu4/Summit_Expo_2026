import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import "./WaypointEditor.css";

//  Types
export interface Waypoint {
  x: number; // absolute px from left
  y: number; // absolute px from top of document
  cpx?: number; // control handle x (absolute px)
  cpy?: number; // control handle y (absolute px)
}

export interface SavedPath {
  refW: number; // window.innerWidth when points were placed
  refH: number; // document.documentElement.scrollHeight when placed
  points: Waypoint[];
}

const STORAGE_KEY = "rocketWaypoints_v2"; // v2 = absolute px format

const EMPTY_PATH: SavedPath = {
  refW: window.innerWidth,
  refH: document.documentElement.scrollHeight,
  points: [],
};

function loadSaved(): SavedPath {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (p && Array.isArray(p.points)) return p;
    }
  } catch {}
  return { ...EMPTY_PATH };
}

function saveSaved(data: SavedPath) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Build SVG path d-string from absolute-px waypoints
function buildD(pts: Waypoint[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const c1x = p1.cpx ?? p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.cpy ?? p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.cpx ?? p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.cpy ?? p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

type DragKind = "point" | "handle";

export function WaypointEditor() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedPath>(loadSaved);
  const [sel, setSel] = useState<number | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const points = saved.points;

  // Panel drag
  const [panelPos, setPanelPos] = useState({ x: 16, y: 16 });
  const panelDrag = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);

  // Node drag
  const nodeDrag = useRef<{
    idx: number;
    kind: DragKind;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const didDrag = useRef(false);

  // Keep refW/refH always current (updated when editor opens or window resizes)
  const updateRef = useCallback(() => {
    setSaved((prev) => ({
      ...prev,
      refW: window.innerWidth,
      refH: document.documentElement.scrollHeight,
    }));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateRef();
    window.addEventListener("resize", updateRef);
    return () => window.removeEventListener("resize", updateRef);
  }, [open, updateRef]);

  // Track scroll for node viewport positioning
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // W key toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "w" || e.key === "W") setOpen((v) => !v);
      if (e.key === "Escape") {
        setAddMode(false);
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Persist on every change
  useEffect(() => {
    saveSaved(saved);
  }, [saved]);

  const setPoints = (fn: (pts: Waypoint[]) => Waypoint[]) => {
    setSaved((prev) => ({ ...prev, points: fn(prev.points) }));
  };

  //  Add mode: click page → drop waypoint
  useEffect(() => {
    if (!addMode) return;
    const onClick = (e: MouseEvent) => {
      const panel = document.querySelector(".wpe-panel");
      if (panel?.contains(e.target as Node)) return;
      if ((e.target as Element).closest(".wpe-node-hit")) return;

      // Absolute px coords
      const nx = Math.round(e.clientX);
      const ny = Math.round(e.clientY + window.scrollY);

      setPoints((prev) => {
        const next = [...prev, { x: nx, y: ny }];
        setSel(next.length - 1);
        return next;
      });
    };
    window.addEventListener("click", onClick, { capture: true });
    return () =>
      window.removeEventListener("click", onClick, { capture: true });
  }, [addMode]);

  //  Panel drag
  const onPanelHeaderDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panelDrag.current = {
      sx: e.clientX,
      sy: e.clientY,
      ox: panelPos.x,
      oy: panelPos.y,
    };
  };
  const onPanelMove = (e: React.PointerEvent) => {
    if (!panelDrag.current) return;
    setPanelPos({
      x: Math.max(0, panelDrag.current.ox + e.clientX - panelDrag.current.sx),
      y: Math.max(0, panelDrag.current.oy + e.clientY - panelDrag.current.sy),
    });
  };
  const onPanelUp = () => {
    panelDrag.current = null;
  };

  //  Node drag
  const onNodeDown = (
    e: React.PointerEvent<SVGCircleElement>,
    idx: number,
    kind: DragKind,
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    didDrag.current = false;
    const p = points[idx];
    nodeDrag.current = {
      idx,
      kind,
      sx: e.clientX,
      sy: e.clientY,
      ox: kind === "point" ? p.x : (p.cpx ?? p.x),
      oy: kind === "point" ? p.y : (p.cpy ?? p.y),
    };
    setSel(idx);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!nodeDrag.current) return;
      didDrag.current = true;
      const { idx, kind, sx, sy, ox, oy } = nodeDrag.current;
      // Keep in absolute px — clamp to document bounds
      const docH = document.documentElement.scrollHeight;
      const nx = Math.max(
        0,
        Math.min(window.innerWidth, ox + (e.clientX - sx)),
      );
      const ny = Math.max(0, Math.min(docH, oy + (e.clientY - sy)));
      setPoints((prev) =>
        prev.map((p, i) => {
          if (i !== idx) return p;
          return kind === "point"
            ? { ...p, x: Math.round(nx), y: Math.round(ny) }
            : { ...p, cpx: Math.round(nx), cpy: Math.round(ny) };
        }),
      );
    };
    const onUp = () => {
      nodeDrag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  //  Sidebar actions
  const addHandle = (idx: number) =>
    setPoints((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, cpx: p.x + 40, cpy: Math.max(0, p.y - 40) } : p,
      ),
    );
  const removeHandle = (idx: number) =>
    setPoints((prev) =>
      prev.map((p, i) => {
        if (i !== idx) return p;
        const { cpx: _, cpy: __, ...rest } = p;
        return rest;
      }),
    );
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setPoints((prev) => {
      const a = [...prev];
      [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
      return a;
    });
    setSel(idx - 1);
  };
  const moveDown = (idx: number) => {
    setPoints((prev) => {
      if (idx >= prev.length - 1) return prev;
      const a = [...prev];
      [a[idx], a[idx + 1]] = [a[idx + 1], a[idx]];
      return a;
    });
    setSel(idx + 1);
  };
  const del = (idx: number) => {
    setPoints((prev) => prev.filter((_, i) => i !== idx));
    setSel(null);
  };
  const editField = (idx: number, field: keyof Waypoint, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setPoints((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: Math.round(n) } : p)),
    );
  };
  const copyJSON = () => {
    const { refW, refH, points } = saved;
    const ptLines = points
      .map((p) => {
        const handle = p.cpx != null ? `, cpx: ${p.cpx}, cpy: ${p.cpy}` : "";
        return `    { x: ${p.x}, y: ${p.y}${handle} },`;
      })
      .join("\n");
    const out = `const PATH: SavedPath = {
  refW: ${refW},
  refH: ${refH},
  points: [
${ptLines}
  ],
};`;
    navigator.clipboard.writeText(out).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const clearAll = () => {
    setPoints(() => []);
    setSel(null);
    setAddMode(false);
  };

  //  SVG path in absolute px (for the fixed preview SVG)
  // The preview SVG is fixed to viewport, so we shift path by -scrollY
  const svgD = buildD(points);

  // Viewport Y of a doc-absolute point
  const vy = (docY: number) => docY - scrollY;

  if (!open) {
    return (
      <button
        className="wpe-badge"
        onClick={() => setOpen(true)}
        title="Open Path Editor (W)"
      >
        ✦ PATH
      </button>
    );
  }

  return (
    <>
      {/* Fixed SVG — path + nodes rendered over page, passes through pointer events */}
      <svg
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 99980,
          overflow: "visible",
        }}
      >
        {/* Path shifted up by scrollY to stay doc-anchored */}
        <g
          transform={`translate(0,${-scrollY})`}
          style={{ pointerEvents: "none" }}
        >
          {svgD && (
            <>
              <path d={svgD} className="wpe-path-shadow" />
              <path d={svgD} className="wpe-path" />
            </>
          )}
          {points.map((p, i) =>
            p.cpx != null ? (
              <line
                key={`hl${i}`}
                x1={p.x}
                y1={p.y}
                x2={p.cpx}
                y2={p.cpy!}
                className="wpe-handle-line"
              />
            ) : null,
          )}
        </g>

        {/* Nodes: render at viewport coords (doc Y - scrollY) */}
        {points.map((p, i) => {
          const cy = vy(p.y);
          if (cy < -60 || cy > window.innerHeight + 60) return null;
          return (
            <g key={`n${i}`} style={{ pointerEvents: "all" }}>
              {sel === i && (
                <circle cx={p.x} cy={cy} r={17} className="wpe-sel-ring" />
              )}
              <circle
                cx={p.x}
                cy={cy}
                r={11}
                className={`wp-node wpe-node-hit${sel === i ? " wp-node--sel" : ""}`}
                onPointerDown={(e) => onNodeDown(e, i, "point")}
              />
              <text
                x={p.x}
                y={cy + 4}
                className="wpe-node-label"
                style={{ pointerEvents: "none" }}
              >
                {i}
              </text>
            </g>
          );
        })}

        {/* Handles */}
        {points.map((p, i) => {
          if (p.cpx == null) return null;
          const cy = vy(p.cpy!);
          if (cy < -60 || cy > window.innerHeight + 60) return null;
          return (
            <circle
              key={`h${i}`}
              cx={p.cpx}
              cy={cy}
              r={7}
              className="wp-handle wpe-node-hit"
              style={{ pointerEvents: "all" }}
              onPointerDown={(e) => onNodeDown(e, i, "handle")}
            />
          );
        })}
      </svg>

      {addMode && (
        <div className="wpe-addmode-hint">
          Click anywhere to place waypoint · Esc to stop
        </div>
      )}

      {/* Draggable panel */}
      <div
        className="wpe-panel"
        style={{ left: panelPos.x, top: panelPos.y }}
        onPointerMove={onPanelMove}
        onPointerUp={onPanelUp}
      >
        <div className="wpe-panel-head" onPointerDown={onPanelHeaderDown}>
          <span className="wpe-title">🚀 Path Editor</span>
          <div className="wpe-head-btns">
            <button className="wpe-close" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
        </div>

        {/* Ref resolution display */}
        <div className="wpe-refsize">
          📐 ref: {saved.refW} × {saved.refH}px
        </div>

        <div className="wpe-actions">
          <button
            className={`wpe-btn wpe-btn--add${addMode ? " wpe-btn--active" : ""}`}
            onClick={() => setAddMode((v) => !v)}
          >
            {addMode ? "⬛ Stop" : "＋ Add point"}
          </button>
          <button className="wpe-btn" onClick={clearAll}>
            Clear all
          </button>
        </div>
        <div className="wpe-actions" style={{ paddingTop: 0 }}>
          <button className="wpe-btn wpe-btn--primary" onClick={copyJSON}>
            {copied ? "✓ Copied!" : "⎘ Copy Array"}
          </button>
          <button className="wpe-btn" onClick={() => setSel(null)}>
            Deselect
          </button>
        </div>

        <div className="wpe-list">
          {points.length === 0 && (
            <p className="wpe-empty">
              No points yet.
              <br />
              Click "＋ Add point"
              <br />
              then click on the page.
            </p>
          )}
          {points.map((p, i) => (
            <div
              key={i}
              className={`wpe-item${sel === i ? " wpe-item--sel" : ""}`}
              onClick={() => setSel(i)}
            >
              <div className="wpe-item-top">
                <span className="wpe-item-idx">{i}</span>
                <div className="wpe-item-coords">
                  <label>
                    x
                    <input
                      type="number"
                      value={p.x}
                      step={1}
                      onChange={(e) => editField(i, "x", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <label>
                    y
                    <input
                      type="number"
                      value={p.y}
                      step={1}
                      onChange={(e) => editField(i, "y", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                </div>
                <div className="wpe-item-btns">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveUp(i);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDown(i);
                    }}
                  >
                    ↓
                  </button>
                  <button
                    className="wpe-del"
                    onClick={(e) => {
                      e.stopPropagation();
                      del(i);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {p.cpx != null ? (
                <div className="wpe-handle-row">
                  <span className="wpe-handle-label">↳ handle</span>
                  <label>
                    hx
                    <input
                      type="number"
                      value={p.cpx}
                      step={1}
                      onChange={(e) => editField(i, "cpx", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <label>
                    hy
                    <input
                      type="number"
                      value={p.cpy}
                      step={1}
                      onChange={(e) => editField(i, "cpy", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </label>
                  <button
                    className="wpe-rm-handle"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHandle(i);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  className="wpe-add-handle"
                  onClick={(e) => {
                    e.stopPropagation();
                    addHandle(i);
                  }}
                >
                  ＋ curve handle
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="wpe-footer">
          <span>{points.length} pts</span>
          <span className="wpe-footer-hint">drag header · W to close</span>
        </div>
      </div>
    </>
  );
}
