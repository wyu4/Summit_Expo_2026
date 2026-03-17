import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import "./WaypointEditor.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnchoredWaypoint {
  selector: string;
  xPct: number; // 0–1 fraction of element width
  yPct: number; // 0–1 fraction of element height
  cpxPct?: number; // control handle x (fraction of element width)
  cpyPct?: number; // control handle y (fraction of element height)
}

interface ResolvedPt {
  x: number;
  y: number;
  cpx?: number;
  cpy?: number;
  selector: string;
  xPct: number;
  yPct: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "rocketAnchors_v1";

const DEFAULT_SECTIONS = [
  "#about",
  "#lineup",
  "#practical-info",
  "#faq",
  "#register",
];

function loadAnchors(): AnchoredWaypoint[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p;
    }
  } catch {}
  return [];
}

function saveAnchors(data: AnchoredWaypoint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Resolve helpers ──────────────────────────────────────────────────────────

function resolveOne(a: AnchoredWaypoint): ResolvedPt | null {
  const el = document.querySelector<HTMLElement>(a.selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const sx = window.scrollX, sy = window.scrollY;
  const bx = rect.left + sx + rect.width  * a.xPct;
  const by = rect.top  + sy + rect.height * a.yPct;
  return {
    x: bx, y: by,
    cpx: a.cpxPct != null ? rect.left + sx + rect.width  * a.cpxPct! : undefined,
    cpy: a.cpyPct != null ? rect.top  + sy + rect.height * a.cpyPct! : undefined,
    selector: a.selector,
    xPct: a.xPct,
    yPct: a.yPct,
  };
}

function resolveAll(anchors: AnchoredWaypoint[]): ResolvedPt[] {
  return anchors.map(resolveOne).filter(Boolean) as ResolvedPt[];
}

// ─── SVG path string ──────────────────────────────────────────────────────────

function buildD(pts: ResolvedPt[]): string {
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

// ─── Section highlight rects ──────────────────────────────────────────────────

interface SectionRect {
  selector: string;
  label: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

function getSectionRects(selectors: string[]): SectionRect[] {
  return selectors.flatMap((sel) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return [];
    const rect = el.getBoundingClientRect();
    return [{
      selector: sel,
      label: sel.replace("#", ""),
      top:    rect.top  + window.scrollY,
      left:   rect.left + window.scrollX,
      width:  rect.width,
      height: rect.height,
    }];
  });
}

// ─── Copy to clipboard ────────────────────────────────────────────────────────

function buildExportString(anchors: AnchoredWaypoint[]): string {
  const lines = anchors.map((a) => {
    const cp =
      a.cpxPct != null
        ? `, cpxPct: ${a.cpxPct.toFixed(4)}, cpyPct: ${a.cpyPct!.toFixed(4)}`
        : "";
    return `  { selector: "${a.selector}", xPct: ${a.xPct.toFixed(4)}, yPct: ${a.yPct.toFixed(4)}${cp} },`;
  });
  return `const PATH: AnchoredWaypoint[] = [\n${lines.join("\n")}\n];`;
}

// ─── Main editor ─────────────────────────────────────────────────────────────

type DragKind = "point" | "handle";

export function WaypointEditor() {
  const [open, setOpen]         = useState(false);
  const [anchors, setAnchors]   = useState<AnchoredWaypoint[]>(loadAnchors);
  const [sel, setSel]           = useState<number | null>(null);
  const [addMode, setAddMode]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [scrollY, setScrollY]   = useState(window.scrollY);
  const [sectionRects, setSectionRects] = useState<SectionRect[]>([]);

  // Panel drag
  const [panelPos, setPanelPos] = useState({ x: 16, y: 16 });
  const panelDragRef = useRef<{ sx:number; sy:number; ox:number; oy:number } | null>(null);

  // Node drag state
  const nodeDragRef = useRef<{
    idx: number;
    kind: DragKind;
    startClientX: number;
    startClientY: number;
    startXPct: number;
    startYPct: number;
    elRect: DOMRect;
  } | null>(null);

  // ── Scroll tracking ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Build section rects whenever editor opens or user scrolls ───────────────
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => setSectionRects(getSectionRects(DEFAULT_SECTIONS));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
    };
  }, [open]);

  // ── Persist ─────────────────────────────────────────────────────────────────
  useEffect(() => { saveAnchors(anchors); }, [anchors]);

  // ── W key toggle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "w" || e.key === "W") setOpen((v) => !v);
      if (e.key === "Escape") { setAddMode(false); setSel(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Add-mode: click on page places a waypoint anchored to whatever element
  //    is directly under the cursor ────────────────────────────────────────────
  useEffect(() => {
    if (!addMode) return;

    const onClick = (e: MouseEvent) => {
      // Ignore clicks on our own panel
      const panel = document.querySelector(".wpe-panel");
      if (panel?.contains(e.target as Node)) return;
      if ((e.target as Element).closest(".wpe-node-hit")) return;

      // Find which tracked section the cursor is inside
      const cx = e.clientX + window.scrollX;
      const cy = e.clientY + window.scrollY;

      let bestSelector = DEFAULT_SECTIONS[0];
      let bestXPct     = cx / window.innerWidth;
      let bestYPct     = 0.5;

      for (const sr of sectionRects) {
        if (
          cx >= sr.left && cx <= sr.left + sr.width &&
          cy >= sr.top  && cy <= sr.top  + sr.height
        ) {
          bestSelector = sr.selector;
          bestXPct     = (cx - sr.left) / sr.width;
          bestYPct     = (cy - sr.top)  / sr.height;
          break;
        }
      }

      setAnchors((prev) => {
        const next = [
          ...prev,
          {
            selector: bestSelector,
            xPct: Math.max(0, Math.min(1, bestXPct)),
            yPct: Math.max(0, Math.min(1, bestYPct)),
          },
        ];
        setSel(next.length - 1);
        return next;
      });
    };

    window.addEventListener("click", onClick, { capture: true });
    return () => window.removeEventListener("click", onClick, { capture: true });
  }, [addMode, sectionRects]);

  // ── Panel header drag ────────────────────────────────────────────────────────
  const onPanelHeaderDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, select, input")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panelDragRef.current = { sx: e.clientX, sy: e.clientY, ox: panelPos.x, oy: panelPos.y };
  };
  const onPanelMove = (e: React.PointerEvent) => {
    if (!panelDragRef.current) return;
    setPanelPos({
      x: Math.max(0, panelDragRef.current.ox + e.clientX - panelDragRef.current.sx),
      y: Math.max(0, panelDragRef.current.oy + e.clientY - panelDragRef.current.sy),
    });
  };
  const onPanelUp = () => { panelDragRef.current = null; };

  // ── Node drag: drag in screen space, convert back to element-relative % ─────
  const onNodeDown = useCallback((
    e: React.PointerEvent<SVGCircleElement>,
    idx: number,
    kind: DragKind,
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const a  = anchors[idx];
    const el = document.querySelector<HTMLElement>(a.selector);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    nodeDragRef.current = {
      idx, kind,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: kind === "point" ? a.xPct : (a.cpxPct ?? a.xPct),
      startYPct: kind === "point" ? a.yPct : (a.cpyPct ?? a.yPct),
      elRect: rect,
    };
    setSel(idx);
  }, [anchors]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nd = nodeDragRef.current;
      if (!nd) return;
      const { elRect } = nd;
      const dx = (e.clientX - nd.startClientX) / elRect.width;
      const dy = (e.clientY - nd.startClientY) / elRect.height;
      const nx = Math.max(-0.2, Math.min(1.2, nd.startXPct + dx));
      const ny = Math.max(-0.2, Math.min(1.2, nd.startYPct + dy));
      setAnchors((prev) =>
        prev.map((a, i) => {
          if (i !== nd.idx) return a;
          if (nd.kind === "point") return { ...a, xPct: nx, yPct: ny };
          return { ...a, cpxPct: nx, cpyPct: ny };
        })
      );
    };
    const onUp = () => { nodeDragRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const deletePoint = (idx: number) => {
    setAnchors((p) => p.filter((_, i) => i !== idx));
    setSel(null);
  };
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setAnchors((p) => { const a = [...p]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; return a; });
    setSel(idx - 1);
  };
  const moveDown = (idx: number) => {
    setAnchors((p) => {
      if (idx >= p.length - 1) return p;
      const a = [...p]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; return a;
    });
    setSel(idx + 1);
  };
  const addHandle = (idx: number) => {
    setAnchors((p) => p.map((a, i) =>
      i === idx ? { ...a, cpxPct: a.xPct + 0.1, cpyPct: Math.max(0, a.yPct - 0.1) } : a
    ));
  };
  const removeHandle = (idx: number) => {
    setAnchors((p) => p.map((a, i) => {
      if (i !== idx) return a;
      const { cpxPct: _, cpyPct: __, ...rest } = a;
      return rest;
    }));
  };
  const changeSelector = (idx: number, selector: string) => {
    setAnchors((p) => p.map((a, i) => i === idx ? { ...a, selector } : a));
  };
  const clearAll = () => { setAnchors([]); setSel(null); setAddMode(false); };

  const copyExport = () => {
    navigator.clipboard.writeText(buildExportString(anchors)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Resolve for rendering ────────────────────────────────────────────────────
  const resolved = resolveAll(anchors);
  const svgD     = buildD(resolved);

  // viewport Y from doc Y
  const vy = (docY: number) => docY - scrollY;

  // ── Closed state ─────────────────────────────────────────────────────────────
  if (!open) {
    return (
      <button className="wpe-badge" onClick={() => setOpen(true)} title="Open Path Editor (W)">
        ✦ PATH
      </button>
    );
  }

  // ── Open state ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Full-viewport overlay SVG ── */}
      <svg
        style={{
          position: "fixed", inset: 0,
          width: "100vw", height: "100vh",
          pointerEvents: "none",
          zIndex: 99980,
          overflow: "visible",
        }}
      >
        {/* Section highlight boxes */}
        {sectionRects.map((sr) => (
          <g key={sr.selector} style={{ pointerEvents: "none" }}>
            <rect
              x={sr.left}
              y={sr.top - scrollY}
              width={sr.width}
              height={sr.height}
              fill="none"
              stroke="rgba(80,210,210,0.18)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <text
              x={sr.left + 10}
              y={sr.top - scrollY + 18}
              fill="rgba(80,210,210,0.50)"
              fontSize={11}
              fontFamily="monospace"
            >
              {sr.label}
            </text>
          </g>
        ))}

        {/* Path preview */}
        <g transform={`translate(0, ${-scrollY})`} style={{ pointerEvents: "none" }}>
          {svgD && (
            <>
              <path d={svgD} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={5} strokeLinecap="round" />
              <path d={svgD} fill="none" stroke="rgba(185,105,255,0.88)" strokeWidth={2.5}
                strokeLinecap="round" strokeDasharray="9 5"
                style={{ animation: "wpe-march 0.9s linear infinite" }} />
            </>
          )}
          {/* Control handle lines */}
          {resolved.map((p, i) =>
            p.cpx != null ? (
              <line key={`hl${i}`} x1={p.x} y1={p.y} x2={p.cpx} y2={p.cpy!}
                stroke="rgba(75,160,255,0.42)" strokeWidth={1} strokeDasharray="4 3" />
            ) : null
          )}
        </g>

        {/* Nodes + handles at viewport coords */}
        {resolved.map((p, i) => {
          const cy  = vy(p.y);
          const hcy = p.cpy != null ? vy(p.cpy) : null;
          if (cy < -80 || cy > window.innerHeight + 80) return null;
          return (
            <g key={`n${i}`} style={{ pointerEvents: "all" }}>
              {/* Selection ring */}
              {sel === i && (
                <circle cx={p.x} cy={cy} r={17}
                  fill="none" stroke="rgba(255,85,160,0.48)" strokeWidth={1.5}
                  style={{ animation: "wpe-pulse 1.2s ease-in-out infinite" }} />
              )}
              {/* Main node */}
              <circle
                cx={p.x} cy={cy} r={11}
                fill={sel === i ? "#ff55a0" : "rgba(155,65,255,0.92)"}
                stroke="#fff" strokeWidth={2}
                className="wpe-node-hit"
                style={{ cursor: "grab" }}
                onPointerDown={(e) => onNodeDown(e, i, "point")}
              />
              {/* Index label */}
              <text x={p.x} y={cy + 4} fill="#fff" fontSize={8.5}
                fontFamily="monospace" fontWeight="700"
                textAnchor="middle" dominantBaseline="middle"
                style={{ pointerEvents: "none" }}>
                {i}
              </text>
              {/* Selector badge below node */}
              <text x={p.x} y={cy + 22} fill="rgba(160,220,255,0.70)" fontSize={9}
                fontFamily="monospace" textAnchor="middle"
                style={{ pointerEvents: "none" }}>
                {p.selector}
              </text>

              {/* Control handle */}
              {p.cpx != null && hcy != null && Math.abs(hcy) < window.innerHeight + 80 && (
                <circle
                  cx={p.cpx} cy={hcy} r={7}
                  fill="rgba(55,145,255,0.88)" stroke="#fff" strokeWidth={1.5}
                  className="wpe-node-hit"
                  style={{ cursor: "grab", pointerEvents: "all" }}
                  onPointerDown={(e) => onNodeDown(e, i, "handle")}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Add-mode hint */}
      {addMode && (
        <div className="wpe-addmode-hint">
          Click anywhere on the page to place a waypoint · Esc to cancel
        </div>
      )}

      {/* ── Draggable panel ── */}
      <div
        className="wpe-panel"
        style={{ left: panelPos.x, top: panelPos.y }}
        onPointerMove={onPanelMove}
        onPointerUp={onPanelUp}
      >
        {/* Header */}
        <div className="wpe-panel-head" onPointerDown={onPanelHeaderDown}>
          <span className="wpe-title">🚀 Rocket Path</span>
          <div className="wpe-head-btns">
            <button className="wpe-close" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        {/* How-to hint */}
        <div className="wpe-howto">
          Drag nodes on the page · nodes snap to section % positions.<br />
          Path auto-scales to any screen size.
        </div>

        {/* Actions row 1 */}
        <div className="wpe-actions">
          <button
            className={`wpe-btn wpe-btn--add${addMode ? " wpe-btn--active" : ""}`}
            onClick={() => setAddMode((v) => !v)}
          >
            {addMode ? "⬛ Stop" : "＋ Add point"}
          </button>
          <button className="wpe-btn" onClick={clearAll}>Clear all</button>
        </div>

        {/* Actions row 2 */}
        <div className="wpe-actions" style={{ paddingTop: 0 }}>
          <button className="wpe-btn wpe-btn--primary" onClick={copyExport}>
            {copied ? "✓ Copied!" : "⎘ Copy PATH array"}
          </button>
          <button className="wpe-btn" onClick={() => setSel(null)}>Desel.</button>
        </div>

        {/* Point list */}
        <div className="wpe-list">
          {anchors.length === 0 && (
            <p className="wpe-empty">
              No points yet.<br />
              Click "＋ Add point"<br />
              then click on the page.
            </p>
          )}

          {anchors.map((a, i) => {
            const isSelected = sel === i;
            return (
              <div
                key={i}
                className={`wpe-item${isSelected ? " wpe-item--sel" : ""}`}
                onClick={() => setSel(i)}
              >
                {/* Row: index + section selector + move/delete buttons */}
                <div className="wpe-item-top">
                  <span className="wpe-item-idx">{i}</span>
                  <select
                    className="wpe-selector-select"
                    value={a.selector}
                    onChange={(e) => { e.stopPropagation(); changeSelector(i, e.target.value); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {DEFAULT_SECTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="wpe-item-btns">
                    <button onClick={(e) => { e.stopPropagation(); moveUp(i); }}>↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveDown(i); }}>↓</button>
                    <button className="wpe-del" onClick={(e) => { e.stopPropagation(); deletePoint(i); }}>✕</button>
                  </div>
                </div>

                {/* X/Y percentage display */}
                <div className="wpe-pct-row">
                  <span className="wpe-pct-label">X</span>
                  <span className="wpe-pct-val">{(a.xPct * 100).toFixed(1)}%</span>
                  <span className="wpe-pct-label">Y</span>
                  <span className="wpe-pct-val">{(a.yPct * 100).toFixed(1)}%</span>
                  <span className="wpe-pct-hint">of element</span>
                </div>

                {/* Fine-tune sliders */}
                {isSelected && (
                  <div className="wpe-sliders">
                    <label className="wpe-slider-row">
                      <span>X</span>
                      <input
                        type="range" min={0} max={1} step={0.005}
                        value={a.xPct}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setAnchors((p) => p.map((wp, wi) => wi === i ? { ...wp, xPct: v } : wp));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{(a.xPct * 100).toFixed(0)}%</span>
                    </label>
                    <label className="wpe-slider-row">
                      <span>Y</span>
                      <input
                        type="range" min={0} max={1} step={0.005}
                        value={a.yPct}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setAnchors((p) => p.map((wp, wi) => wi === i ? { ...wp, yPct: v } : wp));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{(a.yPct * 100).toFixed(0)}%</span>
                    </label>
                  </div>
                )}

                {/* Curve handle */}
                {a.cpxPct != null ? (
                  <div className="wpe-handle-row">
                    <span className="wpe-handle-label">↳ handle</span>
                    <span className="wpe-pct-val">{(a.cpxPct * 100).toFixed(1)}%</span>
                    <span className="wpe-pct-val">{(a.cpyPct! * 100).toFixed(1)}%</span>
                    <button
                      className="wpe-rm-handle"
                      onClick={(e) => { e.stopPropagation(); removeHandle(i); }}
                    >✕</button>
                  </div>
                ) : (
                  <button
                    className="wpe-add-handle"
                    onClick={(e) => { e.stopPropagation(); addHandle(i); }}
                  >
                    ＋ curve handle
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="wpe-footer">
          <span>{anchors.length} pts</span>
          <span className="wpe-footer-hint">drag nodes · W to close</span>
        </div>
      </div>
    </>
  );
}