import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Canvas from "./Canvas";

const Room = ({ userNo, socket, setUsers, setUserNo, user }) => { // FIXED: Add user prop
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");

  // FIXED: Proper cleanup
  useEffect(() => {
    const messageHandler = (data) => toast.info(data.message);
    const usersHandler = (data) => {
      setUsers(data);
      setUserNo(data.length);
    };
    const whiteboardHandler = (data) => setElements(data);
    const clearHandler = () => {
      ctx.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setElements([]);
    };

    socket.on("message", messageHandler);
    socket.on("users", usersHandler);
    socket.on("whiteboardData", whiteboardHandler);
    socket.on("canvasCleared", clearHandler);

    return () => { // CLEANUP
      socket.off("message", messageHandler);
      socket.off("users", usersHandler);
      socket.off("whiteboardData", whiteboardHandler);
      socket.off("canvasCleared", clearHandler);
    };
  }, [socket, setUsers, setUserNo]);

  const clearCanvas = () => {
    ctx.current?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setElements([]);
    socket.emit("clearCanvas", { roomId: user.roomId });
  };

  // FIXED: Proper undo/redo for shared canvas
  const undo = () => {
    if (elements.length === 0) return;
    const removed = elements[elements.length - 1];
    setHistory(prev => [...prev, removed]);
    setElements(prev => prev.slice(0, -1));
    socket.emit("drawing", { roomId: user.roomId, elements: elements.slice(0, -1) });
  };

  const redo = () => {
    if (history.length === 0) return;
    const added = history[history.length - 1];
    setElements(prev => [...prev, added]);
    setHistory(prev => prev.slice(0, -1));
    socket.emit("drawing", { roomId: user.roomId, elements: [...elements, added] });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <h1 className="display-5 pt-4 pb-3 text-center">
          React Drawing App - users online: {userNo}
        </h1>
      </div>
      <div className="row justify-content-center align-items-center text-center py-2">
        <div className="col-md-2">
          <div className="color-picker d-flex align-items-center justify-content-center">
            Color Picker : &nbsp;
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
        </div>
        <div className="col-md-3">
          {["pencil", "line", "rect"].map((t) => (
            <div key={t} className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="tools"
                id={t}
                value={t}
                checked={tool === t}
                onChange={(e) => setTool(e.target.value)}
              />
              <label className="form-check-label" htmlFor={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </label>
            </div>
          ))}
        </div>
        <div className="col-md-2">
          <button
            type="button"
            className="btn btn-outline-primary me-2"
            disabled={elements.length === 0}
            onClick={undo}
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={history.length === 0}
            onClick={redo}
          >
            Redo
          </button>
        </div>
        <div className="col-md-1">
          <button type="button" className="btn btn-danger w-100" onClick={clearCanvas}>
            Clear
          </button>
        </div>
      </div>
      <div className="row">
        <Canvas
          canvasRef={canvasRef}
          ctx={ctx}
          color={color}
          setElements={setElements}
          elements={elements}
          tool={tool}
          socket={socket}
          user={user} // FIXED: Pass user
        />
      </div>
    </div>
  );
};

export default Room;