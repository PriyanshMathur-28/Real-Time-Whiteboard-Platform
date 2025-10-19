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
}) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const currentElementId = useRef(null);
  const cursorCanvasRef = useRef(null);
  const cursorCtx = useRef(null);

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

    const cursorCanvas = cursorCanvasRef.current;
    cursorCanvas.width = width;
    cursorCanvas.height = height;
    cursorCanvas.style.width = `${width}px`;
    cursorCanvas.style.height = `${height}px`;
    cursorCanvas.style.position = "absolute";
    cursorCanvas.style.top = "0";
    cursorCanvas.style.left = "0";
    cursorCanvas.style.pointerEvents = "none";
    cursorCanvas.style.zIndex = "10";
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
    // ✅ NO EMIT during mousedown
  };

  // ✅ REMOVED: No mouseMove emit (local only)
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
    // ✅ NO EMIT during mouseMove - LOCAL ONLY!
  };

  // ✅ RESTORED: ONLY emit on mouseUp (FINAL)
  const handleMouseUp = () => {
    setIsDrawing(false);
    if (socket && user.roomId && elements.length > 0) {
      // Send COMPLETE elements array (all final strokes)
      socket.emit("drawing", { roomId: user.roomId, elements });
    }
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ctx.current) return;

    const roughCanvas = rough.canvas(canvas);
    ctx.current.clearRect(0, 0, canvas.width, canvas.height);

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