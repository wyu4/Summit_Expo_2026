import { useEffect, useRef, useState } from "react";

interface RecordedPoint {
  x: number; // viewport %
  y: number; // viewport %
  scrollAt: number; // scroll progress 0–1
}

export function PathMapper() {
  const [points, setPoints] = useState<RecordedPoint[]>([]);
  const [active, setActive] = useState(true);
  const [status, setStatus] = useState(
    "Click anywhere to place a waypoint at your current scroll position",
  );
  const [panelPos, setPanelPos] = useState({ x: 16, y: 80 });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    mx: number;
    my: number;
    px: number;
    py: number;
  } | null>(null);

  // Click on page to record a point
  useEffect(() => {
    if (!active) return;

    const onClick = (e: MouseEvent) => {
      const panel = document.getElementById("pm2-panel");
      if (panel?.contains(e.target as Node)) return;

      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollAt = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      const pt: RecordedPoint = {
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
        scrollAt: parseFloat(scrollAt.toFixed(3)),
      };

      setPoints((prev) => {
        const next = [...prev, pt].sort((a, b) => a.scrollAt - b.scrollAt);
        return next;
      });

      setStatus(
        `Placed point at scroll ${(scrollAt * 100).toFixed(1)}% — viewport (${x.toFixed(0)}%, ${y.toFixed(0)}%)`,
      );
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [active]);

  // Esc to toggle
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive((v) => !v);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Panel drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      setPanelPos({
        x: dragRef.current.px + e.clientX - dragRef.current.mx,
        y: dragRef.current.py + e.clientY - dragRef.current.my,
      });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const output =
    points.length < 2
      ? "// Need at least 2 points"
      : `const WAYPOINTS: Waypoint[] = [\n${points
          .map(
            (p) =>
              `  { scrollAt: ${p.scrollAt.toFixed(3)}, x: ${p.x}, y: ${p.y} },`,
          )
          .join("\n")}\n];`;

  if (!active)
    return (
      <div
        onClick={() => setActive(true)}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 99999,
          background: "#1a0a14",
          border: "1px solid #CE3072",
          borderRadius: 6,
          padding: "6px 14px",
          color: "#CE3072",
          fontSize: 12,
          fontFamily: "monospace",
          cursor: "pointer",
        }}
      >
        PathMapper paused — click to resume
      </div>
    );

  // Draw path preview on fixed SVG
  const pathPreview =
    points.length >= 2
      ? "M " +
        points
          .map(
            (p) =>
              `${((p.x / 100) * window.innerWidth).toFixed(0)} ${((p.y / 100) * window.innerHeight).toFixed(0)}`,
          )
          .join(" L ")
      : "";

  return (
    <>
      {/* Crosshair cursor hint overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99990,
          cursor: "crosshair",
          pointerEvents: active ? "none" : "none",
        }}
      />

      {/* SVG dot + path preview */}
      <svg
        ref={svgRef}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 99991,
          overflow: "visible",
        }}
      >
        {/* Path preview line */}
        {pathPreview && (
          <path
            d={pathPreview}
            fill="none"
            stroke="rgba(206,48,114,0.5)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
        )}
        {/* Dots at each recorded point */}
        {points.map((p, i) => {
          const vx = (p.x / 100) * window.innerWidth;
          const vy = (p.y / 100) * window.innerHeight;
          return (
            <g key={i}>
              <circle cx={vx} cy={vy} r={10} fill="rgba(206,48,114,0.15)" />
              <circle
                cx={vx}
                cy={vy}
                r={4}
                fill={
                  i === 0
                    ? "#00ff88"
                    : i === points.length - 1
                      ? "#ff8844"
                      : "#CE3072"
                }
              />
              <text
                x={vx + 10}
                y={vy - 5}
                fill="rgba(255,255,255,0.8)"
                fontSize="9"
                fontFamily="monospace"
              >
                {i + 1}: scroll {(p.scrollAt * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Panel */}
      <div
        id="pm2-panel"
        style={{
          position: "fixed",
          left: panelPos.x,
          top: panelPos.y,
          zIndex: 99999,
          width: 320,
          background: "rgba(6,3,16,0.97)",
          border: "1px solid rgba(206,48,114,0.5)",
          borderRadius: 8,
          padding: "10px 12px",
          fontFamily: "monospace",
          fontSize: 12,
          color: "#f0ecff",
          boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          userSelect: "none",
        }}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button,textarea")) return;
          dragRef.current = {
            mx: e.clientX,
            my: e.clientY,
            px: panelPos.x,
            py: panelPos.y,
          };
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#CE3072", fontWeight: "bold", fontSize: 13 }}>
            ✦ PathMapper
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPoints([])}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                background: "transparent",
                border: "1px solid rgba(255,80,80,0.4)",
                color: "#ff8080",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setPoints((prev) => prev.slice(0, -1))}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#aaa",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Undo
            </button>
            <button
              onClick={() => setActive(false)}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#aaa",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Hide
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(180,160,200,0.6)",
            marginBottom: 8,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: "#CE3072" }}>HOW TO USE:</strong>
          <br />
          1. Scroll to a position on your page
          <br />
          2. Click where you want the rocket
          <br />
          3. Repeat going down the page
          <br />
          4. Copy output → paste into RocketPath.tsx
        </div>

        {/* Status */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(140,220,140,0.7)",
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          {status}
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            fontSize: 10,
            color: "rgba(150,150,180,0.5)",
            marginBottom: 8,
          }}
        >
          Current scroll:{" "}
          {document.body.scrollHeight > window.innerHeight
            ? (
                (window.scrollY /
                  (document.body.scrollHeight - window.innerHeight)) *
                100
              ).toFixed(1)
            : "0"}
          % &nbsp;·&nbsp;{points.length} point{points.length !== 1 ? "s" : ""}{" "}
          recorded
        </div>

        {/* Point list */}
        {points.length > 0 && (
          <div style={{ maxHeight: 80, overflowY: "auto", marginBottom: 8 }}>
            {points.map((p, i) => (
              <div
                key={i}
                style={{
                  fontSize: 10,
                  padding: "1px 3px",
                  borderRadius: 3,
                  color:
                    i === 0
                      ? "#00ff88"
                      : i === points.length - 1
                        ? "#ff8844"
                        : "#CE3072",
                }}
              >
                {i + 1}. scroll={(p.scrollAt * 100).toFixed(1)}% · x={p.x}% y=
                {p.y}%
              </div>
            ))}
          </div>
        )}

        {/* Output */}
        <textarea
          readOnly
          value={output}
          onClick={(e) => {
            e.stopPropagation();
            (e.target as HTMLTextAreaElement).select();
          }}
          style={{
            width: "100%",
            height: 100,
            resize: "vertical",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 4,
            padding: 6,
            color: "#c0b0d8",
            fontSize: 10,
            fontFamily: "monospace",
          }}
        />

        <button
          onClick={(e) => {
            navigator.clipboard.writeText(output);
            (e.target as HTMLButtonElement).textContent = "Copied!";
            setTimeout(() => {
              (e.target as HTMLButtonElement).textContent = "Copy";
            }, 1400);
          }}
          style={{
            marginTop: 6,
            width: "100%",
            padding: 5,
            background: "rgba(206,48,114,0.15)",
            border: "1px solid rgba(206,48,114,0.5)",
            borderRadius: 4,
            color: "#CE3072",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Copy
        </button>

        <div
          style={{ marginTop: 6, fontSize: 10, color: "rgba(130,110,160,0.5)" }}
        >
          Green = first · Orange = last · Drag panel header to move
        </div>
      </div>
    </>
  );
}
