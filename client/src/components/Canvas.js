import React, { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import rough from "roughjs/bundled/rough.esm";
import { PenLine } from "lucide-react";

const generator = rough.generator();

const MIN_DIST_SQ = 16; // 4px threshold for pencil/eraser throttling

// The drawing surface is deliberately bigger than most viewports so there's
// always room to keep working — the board scrolls instead of running out
// of space ("scroll the whiteboard to get more space to draw").
const MIN_CANVAS_WIDTH = 2400;
const MIN_CANVAS_HEIGHT = 1600;

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function distSq(x1, y1, x2, y2) {
  return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

// Simple greedy word-wrap used for sticky-note text.
function wrapText(ctx2d, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx2d.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const STICKY_W = 200;
const STICKY_H = 150;
const CURSOR_THROTTLE_MS = 45;

const Canvas = ({
  canvasRef,
  ctx,
  color,
  setElements,
  elements,
  tool,
  socket,
  user,
  strokeWidth = 5,
  eraserSize = 30,
  fontFamily = "Inter",
  fillEnabled = false,
  fillColor = "#fed7aa",
  remoteCursors = {},
  className = "",
}) => {
  const lastCursorEmit = useRef(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dims, setDims] = useState({ w: MIN_CANVAS_WIDTH, h: MIN_CANVAS_HEIGHT });
  const currentElementId = useRef(null);
  const cursorCanvasRef = useRef(null);
  const cursorCtx = useRef(null);
  const wrapRef = useRef(null);

  // In-canvas text/sticky overlay state
  const [textOverlay, setTextOverlay] = useState(null);
  // { x, y, value, mode: "text"|"sticky", editId: null|elementId }

  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // ── Canvas initialisation (ResizeObserver, not just window resize) ─────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const applySize = (containerW, containerH) => {
      const width = Math.max(containerW, MIN_CANVAS_WIDTH);
      const height = Math.max(containerH, MIN_CANVAS_HEIGHT);
      setDims((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        context.lineWidth = strokeWidth;
        context.strokeStyle = color;
        ctx.current = context;

        const cursorCanvas = cursorCanvasRef.current;
        if (cursorCanvas) {
          cursorCanvas.width = width;
          cursorCanvas.height = height;
          cursorCtx.current = cursorCanvas.getContext("2d");
        }
        // Force a redraw of existing elements onto the freshly-sized canvas.
        setElements((prev) => [...prev]);
      }
    };

    const parent = wrap.parentElement;
    if (parent) applySize(parent.clientWidth, parent.clientHeight);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        applySize(width, height);
      }
    });
    if (parent) observer.observe(parent);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync color/width to context
  useEffect(() => {
    if (ctx.current) {
      ctx.current.strokeStyle = color;
      ctx.current.lineWidth = strokeWidth;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, strokeWidth]);

  // ── Cursor helpers ────────────────────────────────────────────────────────
  const getCursor = () => {
    if (tool === "eraser") return "none";
    if (tool === "text" || tool === "sticky") return "text";
    return "crosshair";
  };

  const drawEraserCursor = (x, y) => {
    const cc = cursorCtx.current;
    const cursorCanvas = cursorCanvasRef.current;
    if (!cc || !cursorCanvas) return;
    cc.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    cc.beginPath();
    cc.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
    cc.strokeStyle = "#334155";
    cc.lineWidth = 1.5;
    cc.setLineDash([4, 3]);
    cc.stroke();
    cc.setLineDash([]);
  };

  const clearCursorCanvas = () => {
    const cc = cursorCtx.current;
    const cursorCanvas = cursorCanvasRef.current;
    if (cc && cursorCanvas) {
      cc.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    }
  };

  // ── Coordinate helpers ────────────────────────────────────────────────────
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  };

  const getEventPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return { offsetX: 0, offsetY: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top,
      };
    }
    return getMousePos(e);
  };

  // ── Commit text/sticky overlay ─────────────────────────────────────────────
  const commitTextOverlay = useCallback(
    (val) => {
      if (!textOverlay) return;
      const value = (val ?? textOverlay.value).trim();
      const { x, y, mode, editId } = textOverlay;
      setTextOverlay(null);

      if (!value && !editId) return; // nothing typed and not editing

      if (editId) {
        // Edit existing element
        setElements((prev) => {
          const next = prev.map((el) =>
            el.id === editId ? { ...el, text: value } : el
          );
          if (socket && user?.roomId) {
            socket.emit("drawing", { roomId: user.roomId, elements: next });
          }
          return next;
        });
        return;
      }

      if (!value) return;

      if (mode === "text") {
        const newElement = {
          id: generateId(),
          element: "text",
          stroke: color,
          offsetX: x,
          offsetY: y,
          text: value,
          font: `${Math.max(strokeWidth * 5, 16)}px ${fontFamily}`,
        };
        setElements((prev) => {
          const next = [...prev, newElement];
          if (socket && user?.roomId) {
            socket.emit("drawing", { roomId: user.roomId, elements: next });
          }
          return next;
        });
      } else {
        const newElement = {
          id: generateId(),
          element: "sticky",
          stroke: color,
          offsetX: x,
          offsetY: y,
          width: STICKY_W,
          height: STICKY_H,
          text: value,
        };
        setElements((prev) => {
          const next = [...prev, newElement];
          if (socket && user?.roomId) {
            socket.emit("drawing", { roomId: user.roomId, elements: next });
          }
          return next;
        });
      }
    },
    [textOverlay, color, strokeWidth, fontFamily, socket, user, setElements]
  );

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const handleDrawStart = (e) => {
    // If a text overlay is open, commit it first
    if (textOverlay) {
      commitTextOverlay();
      return;
    }
    e.preventDefault();
    const { offsetX, offsetY } = getEventPos(e);

    if (tool === "text") {
      setTextOverlay({ x: offsetX, y: offsetY, value: "", mode: "text", editId: null });
      return;
    }

    if (tool === "sticky") {
      setTextOverlay({ x: offsetX, y: offsetY, value: "", mode: "sticky", editId: null });
      return;
    }

    if (tool === "eraser") {
      const newElement = {
        id: generateId(),
        element: "eraser",
        offsetX,
        offsetY,
        eraserSize,
        path: [[offsetX, offsetY]],
      };
      setElements((prev) => [...prev, newElement]);
      currentElementId.current = newElement.id;
      setIsDrawing(true);
      return;
    }

    const newElement = {
      id: generateId(),
      element: tool,
      stroke: color,
      strokeWidth,
      offsetX,
      offsetY,
    };

    if (tool === "pencil") {
      newElement.path = [[offsetX, offsetY]];
    } else if (tool === "line") {
      newElement.endX = offsetX;
      newElement.endY = offsetY;
    } else if (tool === "rect" || tool === "circle" || tool === "ellipse" || tool === "triangle") {
      newElement.width = 0;
      newElement.height = 0;
      if (fillEnabled) {
        newElement.fill = fillColor;
      }
    }

    setElements((prev) => [...prev, newElement]);
    currentElementId.current = newElement.id;
    setIsDrawing(true);
  };

  // Double-click to edit existing text/sticky elements
  const handleDoubleClick = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    // Find topmost text or sticky element at this position
    const hit = [...elementsRef.current].reverse().find((el) => {
      if (el.element === "text") {
        // Rough hit test: within 20px of the text origin
        return (
          Math.abs(el.offsetX - offsetX) < 200 &&
          Math.abs(el.offsetY - offsetY) < 24
        );
      }
      if (el.element === "sticky") {
        const w = el.width || STICKY_W;
        const h = el.height || STICKY_H;
        return (
          offsetX >= el.offsetX &&
          offsetX <= el.offsetX + w &&
          offsetY >= el.offsetY &&
          offsetY <= el.offsetY + h
        );
      }
      return false;
    });

    if (hit) {
      setTextOverlay({
        x: hit.offsetX,
        y: hit.offsetY,
        value: hit.text || "",
        mode: hit.element,
        editId: hit.id,
      });
    }
  };

  const handleDrawMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { offsetX, offsetY } = getEventPos(e);

    if (tool === "eraser") {
      drawEraserCursor(offsetX, offsetY);
    }

    setElements((prev) =>
      prev.map((ele) => {
        if (ele.id !== currentElementId.current) return ele;

        if (tool === "eraser") {
          const lastPt = ele.path[ele.path.length - 1];
          if (lastPt && distSq(lastPt[0], lastPt[1], offsetX, offsetY) < MIN_DIST_SQ) {
            return ele;
          }
          return { ...ele, path: [...ele.path, [offsetX, offsetY]] };
        }
        if (tool === "rect" || tool === "circle" || tool === "ellipse" || tool === "triangle") {
          return {
            ...ele,
            width: offsetX - ele.offsetX,
            height: offsetY - ele.offsetY,
          };
        }
        if (tool === "line") {
          return { ...ele, endX: offsetX, endY: offsetY };
        }
        if (tool === "pencil") {
          const lastPt = ele.path[ele.path.length - 1];
          if (lastPt && distSq(lastPt[0], lastPt[1], offsetX, offsetY) < MIN_DIST_SQ) {
            return ele;
          }
          return { ...ele, path: [...ele.path, [offsetX, offsetY]] };
        }
        return ele;
      })
    );
  };

  const handleDrawEnd = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
    clearCursorCanvas();

    const latestElements = elementsRef.current;
    if (socket && user?.roomId && latestElements.length > 0) {
      socket.emit("drawing", { roomId: user.roomId, elements: latestElements });
    }
  };

  const handleMouseMove = (e) => {
    if (tool === "eraser") {
      const { offsetX, offsetY } = getMousePos(e);
      drawEraserCursor(offsetX, offsetY);
    }
    if (isDrawing) handleDrawMove(e);

    if (socket && user?.roomId) {
      const now = Date.now();
      if (now - lastCursorEmit.current > CURSOR_THROTTLE_MS) {
        lastCursorEmit.current = now;
        const { offsetX, offsetY } = getMousePos(e);
        socket.emit("cursor-move", { roomId: user.roomId, x: offsetX, y: offsetY });
      }
    }
  };

  const handleMouseLeave = () => {
    clearCursorCanvas();
    if (isDrawing) handleDrawEnd(null);
  };

  // ── Render elements ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;

    const roughCanvas = rough.canvas(canvas);
    ctx.current.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((ele) => {
      const sw = ele.strokeWidth || 5;

      if (ele.element === "eraser") {
        const path = ele.path || [[ele.offsetX, ele.offsetY]];
        if (path.length < 1) return;
        ctx.current.save();
        ctx.current.globalCompositeOperation = "destination-out";
        ctx.current.strokeStyle = "rgba(0,0,0,1)";
        ctx.current.lineWidth = ele.eraserSize || 30;
        ctx.current.lineCap = "round";
        ctx.current.lineJoin = "round";
        ctx.current.beginPath();
        ctx.current.moveTo(path[0][0], path[0][1]);
        for (let i = 1; i < path.length; i++) {
          ctx.current.lineTo(path[i][0], path[i][1]);
        }
        ctx.current.stroke();
        ctx.current.restore();
        return;
      }

      if (ele.element === "sticky") {
        const w = ele.width || STICKY_W;
        const h = ele.height || STICKY_H;
        const x = ele.offsetX;
        const y = ele.offsetY;
        const r = 10;
        ctx.current.save();
        ctx.current.shadowColor = "rgba(15,23,42,0.18)";
        ctx.current.shadowBlur = 10;
        ctx.current.shadowOffsetY = 4;
        ctx.current.fillStyle = ele.stroke || "#fef08a";
        ctx.current.beginPath();
        ctx.current.moveTo(x + r, y);
        ctx.current.arcTo(x + w, y, x + w, y + h, r);
        ctx.current.arcTo(x + w, y + h, x, y + h, r);
        ctx.current.arcTo(x, y + h, x, y, r);
        ctx.current.arcTo(x, y, x + w, y, r);
        ctx.current.closePath();
        ctx.current.fill();
        ctx.current.shadowColor = "transparent";
        ctx.current.fillStyle = "#1f2937";
        ctx.current.font = "14px Inter";
        ctx.current.textBaseline = "top";
        const lines = wrapText(ctx.current, ele.text || "", w - 24);
        lines.slice(0, 7).forEach((line, i) => {
          ctx.current.fillText(line, x + 12, y + 12 + i * 18);
        });
        ctx.current.restore();
        return;
      }

      if (ele.element === "text") {
        ctx.current.save();
        ctx.current.fillStyle = ele.stroke;
        ctx.current.font = ele.font || "18px Inter";
        ctx.current.textBaseline = "middle";
        ctx.current.fillText(ele.text, ele.offsetX, ele.offsetY);
        ctx.current.restore();
        return;
      }

      const fillOpts = ele.fill
        ? { fill: ele.fill, fillStyle: "solid" }
        : {};

      if (ele.element === "rect") {
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width || 0, ele.height || 0, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: sw,
            ...fillOpts,
          })
        );
      } else if (ele.element === "circle") {
        const w = Math.abs(ele.width || 0);
        const h = Math.abs(ele.height || 0);
        const diameter = Math.max(w, h);
        const cx = ele.offsetX + (ele.width || 0) / 2;
        const cy = ele.offsetY + (ele.height || 0) / 2;
        roughCanvas.draw(
          generator.circle(cx, cy, diameter, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: sw,
            ...fillOpts,
          })
        );
      } else if (ele.element === "ellipse") {
        const w = Math.abs(ele.width || 0);
        const h = Math.abs(ele.height || 0);
        const cx = ele.offsetX + (ele.width || 0) / 2;
        const cy = ele.offsetY + (ele.height || 0) / 2;
        roughCanvas.draw(
          generator.ellipse(cx, cy, w || 1, h || 1, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: sw,
            ...fillOpts,
          })
        );
      } else if (ele.element === "triangle") {
        const x = ele.offsetX;
        const y = ele.offsetY;
        const w = ele.width || 0;
        const h = ele.height || 0;
        roughCanvas.draw(
          generator.polygon(
            [
              [x + w / 2, y],
              [x, y + h],
              [x + w, y + h],
            ],
            { stroke: ele.stroke, roughness: 0, strokeWidth: sw, ...fillOpts }
          )
        );
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(
            ele.offsetX,
            ele.offsetY,
            ele.endX ?? ele.offsetX,
            ele.endY ?? ele.offsetY,
            { stroke: ele.stroke, roughness: 0, strokeWidth: sw }
          )
        );
      } else if (ele.element === "pencil") {
        const path = ele.path || [[ele.offsetX, ele.offsetY]];
        if (path.length < 2) return;
        roughCanvas.linearPath(path, {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: sw,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  const isEmpty = elements.length === 0;

  // ── Text overlay position (relative to scrollable wrap) ───────────────────
  const getOverlayStyle = () => {
    if (!textOverlay) return {};
    const wrap = wrapRef.current;
    const scrollLeft = wrap ? wrap.scrollLeft : 0;
    const scrollTop = wrap ? wrap.scrollTop : 0;
    // textOverlay.x/y are canvas coords; the canvas is inside the wrap div
    // which itself is inside the scrollable container. We use left/top relative
    // to the wrap div (position:relative) so they line up with the canvas.
    return {
      left: textOverlay.x - scrollLeft,
      top: textOverlay.y - scrollTop,
    };
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        width: `${dims.w}px`,
        height: `${dims.h}px`,
        minWidth: "100%",
        minHeight: "100%",
        position: "relative",
        cursor: textOverlay ? "default" : getCursor(),
        background: "white",
        borderRadius: "0.75rem",
      }}
      onMouseDown={handleDrawStart}
      onMouseMove={handleMouseMove}
      onMouseUp={handleDrawEnd}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleDrawStart}
      onTouchMove={handleDrawMove}
      onTouchEnd={handleDrawEnd}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%", borderRadius: "0.75rem" }}
      />
      <canvas
        ref={cursorCanvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
          pointerEvents: "none",
          borderRadius: "0.75rem",
        }}
      />

      {/* ── In-canvas text / sticky input overlay ─────────────────────── */}
      {textOverlay && (
        <div
          className="canvas-text-overlay"
          style={{
            position: "absolute",
            left: getOverlayStyle().left,
            top: getOverlayStyle().top,
            zIndex: 30,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {textOverlay.mode === "sticky" ? (
            <textarea
              autoFocus
              className="canvas-overlay-textarea"
              value={textOverlay.value}
              placeholder="Type your note…"
              onChange={(e) => setTextOverlay((o) => ({ ...o, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setTextOverlay(null);
                }
                // Ctrl+Enter or Shift+Enter commits
                if (e.key === "Enter" && (e.ctrlKey || e.shiftKey)) {
                  e.preventDefault();
                  commitTextOverlay(textOverlay.value);
                }
              }}
              style={{
                width: `${STICKY_W}px`,
                height: `${STICKY_H}px`,
                background: color || "#fef08a",
                fontSize: "14px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937",
                border: "2px solid #6d28d9",
                borderRadius: "10px",
                padding: "10px",
                resize: "none",
                outline: "none",
                boxShadow: "0 8px 24px rgba(109,40,217,0.18)",
              }}
            />
          ) : (
            <input
              autoFocus
              type="text"
              className="canvas-overlay-input"
              value={textOverlay.value}
              placeholder="Type text…"
              onChange={(e) => setTextOverlay((o) => ({ ...o, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTextOverlay(textOverlay.value);
                }
                if (e.key === "Escape") {
                  setTextOverlay(null);
                }
              }}
              style={{
                fontSize: `${Math.max(strokeWidth * 5, 16)}px`,
                fontFamily: `${fontFamily}, sans-serif`,
                color: color,
                background: "rgba(255,255,255,0.95)",
                border: "2px solid #6d28d9",
                borderRadius: "6px",
                padding: "4px 8px",
                outline: "none",
                minWidth: "120px",
                boxShadow: "0 4px 16px rgba(109,40,217,0.18)",
                backdropFilter: "blur(4px)",
              }}
            />
          )}
          <div className="canvas-overlay-hint">
            {textOverlay.mode === "sticky"
              ? "Ctrl+Enter to save  ·  Esc to cancel"
              : "Enter to save  ·  Esc to cancel  ·  Dbl-click to edit"}
          </div>
        </div>
      )}

      {isEmpty && !textOverlay && (
        <div className="rm-canvas-hint">
          <PenLine />
          <span>Pick a tool and start drawing — scroll for more space</span>
        </div>
      )}
      {/* Live cursors */}
      {Object.entries(remoteCursors).map(([socketId, c]) => (
        <div
          key={socketId}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            pointerEvents: "none",
            zIndex: 20,
            transform: "translate(-2px, -2px)",
            transition: "left 0.08s linear, top 0.08s linear",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={c.color || "#6d28d9"}>
            <path d="M4 2l16 8-7 1.5L11 20z" />
          </svg>
          <span
            style={{
              display: "inline-block",
              marginLeft: "0.6rem",
              padding: "0.1rem 0.45rem",
              borderRadius: "0.35rem",
              background: c.color || "#6d28d9",
              color: "white",
              fontSize: "0.68rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              transform: "translateY(-0.6rem)",
            }}
          >
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Canvas;