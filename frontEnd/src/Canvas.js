import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import rough from "roughjs/bundled/rough.esm";

const generator = rough.generator();

const Canvas = ({
  canvasRef,
  ctx,
  color,
  setElements,
  elements,
  tool,
  socket,
  user,
  otherCursors,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentElementId = useRef(null);
  const cursorCanvasRef = useRef(null);
  const cursorCtx = useRef(null);
  let lastEmit = 0; // For throttling

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext("2d");
    context.strokeWidth = 5;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.lineWidth = 5;
    ctx.current = context;

    // Initialize cursor canvas with higher z-index
    const cursorCanvas = cursorCanvasRef.current;
    cursorCanvas.width = width;
    cursorCanvas.height = height;
    cursorCanvas.style.width = `${width}px`;
    cursorCanvas.style.height = `${height}px`;
    cursorCanvas.style.position = "absolute";
    cursorCanvas.style.top = "0";
    cursorCanvas.style.left = "0";
    cursorCanvas.style.pointerEvents = "none";
    cursorCanvas.style.zIndex = "10"; // Ensure cursor canvas is on top
    cursorCtx.current = cursorCanvas.getContext("2d");
  }, []);

  useEffect(() => {
    if (ctx.current) {
      ctx.current.strokeStyle = color;
    }
  }, [color]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    const newElement = {
      id: Date.now(),
      element: tool,
      stroke: color,
      offsetX,
      offsetY,
    };

    if (tool === "pencil") {
      newElement.path = [[offsetX, offsetY]];
    } else if (tool === "line") {
      newElement.endX = offsetX;
      newElement.endY = offsetY;
    }

    setElements((prevElements) => [...prevElements, newElement]);
    currentElementId.current = newElement.id;
    setIsDrawing(true);
    socket.emit("drawing", { roomId: user.roomId, elements: [newElement] });
  };

  const sendDrawing = () => {
    if (socket && user.roomId && elements.length > 0) {
      socket.emit("drawing", { roomId: user.roomId, elements });
    }
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;

    const roughCanvas = rough.canvas(canvas);
    ctx.current.clearRect(0, 0, canvas.width, canvas.height); // Clear only drawing layer

    elements.forEach((ele) => {
      if (ele.element === "rect") {
        roughCanvas.draw(
          generator.rectangle(ele.offsetX, ele.offsetY, ele.width || 0, ele.height || 0, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 5,
          })
        );
      } else if (ele.element === "line") {
        roughCanvas.draw(
          generator.line(ele.offsetX, ele.offsetY, ele.endX || ele.offsetX, ele.endY || ele.offsetY, {
            stroke: ele.stroke,
            roughness: 0,
            strokeWidth: 5,
          })
        );
      } else if (ele.element === "pencil") {
        roughCanvas.linearPath(ele.path || [[ele.offsetX, ele.offsetY]], {
          stroke: ele.stroke,
          roughness: 0,
          strokeWidth: 5,
        });
      }
    });
  }, [elements]);

  useEffect(() => {
    const cursorCanvas = cursorCanvasRef.current;
    if (!cursorCanvas || !cursorCtx.current) return;

    // Clear and redraw cursors only when they change
    cursorCtx.current.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
    console.log("Redrawing cursors:", otherCursors); // Debug log

    Object.entries(otherCursors).forEach(([userId, cursor]) => {
      const { x, y, username, color: cursorColor } = cursor;
      cursorCtx.current.beginPath();
      cursorCtx.current.arc(x, y, 8, 0, 2 * Math.PI);
      cursorCtx.current.fillStyle = cursorColor || "#ff0000";
      cursorCtx.current.fill();
      cursorCtx.current.strokeStyle = cursorColor || "#ff0000";
      cursorCtx.current.lineWidth = 2;
      cursorCtx.current.stroke();
      cursorCtx.current.closePath();
      cursorCtx.current.fillStyle = "white";
      cursorCtx.current.font = "12px Arial";
      cursorCtx.current.fillText(username?.substring(0, 3) || "U", x + 10, y - 5);
    });
  }, [otherCursors]);

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getMousePos(e);

    setElements((prevElements) =>
      prevElements.map((ele) =>
        ele.id === currentElementId.current
          ? {
              ...ele,
              ...(tool === "rect" && { width: offsetX - ele.offsetX, height: offsetY - ele.offsetY }),
              ...(tool === "line" && { endX: offsetX, endY: offsetY }),
              ...(tool === "pencil" && { path: [...ele.path, [offsetX, offsetY]] }),
            }
          : ele
      )
    );

    const now = Date.now();
    if (now - lastEmit >= 100 && user && socket && user.roomId) { // Increased to 100ms
      lastEmit = now;
      const currentElement = elements.find((ele) => ele.id === currentElementId.current);
      if (currentElement) {
        socket.emit("drawing", { roomId: user.roomId, elements: [currentElement] });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    sendDrawing();
  };

  return (
    <div
      className="col-md-8 overflow-hidden border border-dark px-0 mx-auto"
      style={{ height: "100vh", paddingTop: 0, marginTop: 0, position: "relative" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      <canvas ref={cursorCanvasRef} style={{ display: "block", width: "100%", height: "100%", zIndex: "10" }} />
    </div>
  );
};

export default Canvas;