import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Pencil, Users, Palette, Undo, Redo, Trash2 } from "lucide-react";
import Canvas from "./Canvas";

const LineIcon = ({ style }) => (
  <div
    style={{
      height: "0.125rem",
      backgroundColor: "#000",
      transform: "rotate(45deg)",
      ...style
    }}
  />
);

const RectIcon = ({ style }) => (
  <div
    style={{
      border: "1px solid #000",
      ...style
    }}
  />
);

const Room = ({ userNo, socket, setUsers, setUserNo, user }) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);
  const [color, setColor] = useState("#000000");
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");

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

    return () => {
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

  const toolConfigs = {
    pencil: { Component: Pencil, label: "Pencil" },
    line: { Component: LineIcon, label: "Line" },
    rect: { Component: RectIcon, label: "Rectangle" }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f9fafb, #ffffff)',
      color: '#111827',
      overflowX: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Top Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 1.5rem'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '2.25rem',
              height: '2.25rem',
              background: 'linear-gradient(to bottom right, #fb923c, #ec4899)',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(6deg)'
            }}>
              <Pencil style={{ width: '1.25rem', height: '1.25rem', color: 'white', transform: 'rotate(-6deg)' }} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '-0.025em' }}>
              Whiteboard Room
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
            <span style={{ fontSize: '1rem', fontWeight: '500', color: '#6b7280' }}>
              {userNo} online
            </span>
          </div>
        </div>
      </nav>

      {/* Toolbar */}
      <div style={{
        position: 'fixed',
        top: '5.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb'
      }}>
        {/* Color Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <Palette style={{ width: '1rem', height: '1rem', color: '#fb923c' }} />
          <span>Color:</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              width: '2rem',
              height: '2rem',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              padding: 0
            }}
          />
        </div>

        {/* Tools */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Object.entries(toolConfigs).map(([t, config]) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.75rem',
                background: tool === t ? 'linear-gradient(to bottom right, #fb923c, #ec4899)' : 'white',
                color: tool === t ? 'white' : '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.75rem',
                fontWeight: tool === t ? 'bold' : 'normal'
              }}
              onMouseEnter={(e) => {
                if (tool !== t) {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (tool !== t) {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <config.Component style={{ width: '1rem', height: '1rem' }} />
              </div>
              <span>{config.label}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={undo}
            disabled={elements.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: elements.length === 0 ? '#f3f4f6' : 'white',
              color: elements.length === 0 ? '#9ca3af' : '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: elements.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (elements.length !== 0) {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (elements.length !== 0) {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            <Undo style={{ width: '1rem', height: '1rem' }} />
            Undo
          </button>
          <button
            onClick={redo}
            disabled={history.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: history.length === 0 ? '#f3f4f6' : 'white',
              color: history.length === 0 ? '#9ca3af' : '#6b7280',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              cursor: history.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => {
              if (history.length !== 0) {
                e.target.style.background = '#f3f4f6';
                e.target.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (history.length !== 0) {
                e.target.style.background = 'white';
                e.target.style.transform = 'scale(1)';
              }
            }}
          >
            <Redo style={{ width: '1rem', height: '1rem' }} />
            Redo
          </button>
          <button
            onClick={clearCanvas}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(to bottom right, #fb923c, #ec4899)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: '500',
              boxShadow: '0 4px 14px rgba(251, 146, 60, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 20px rgba(251, 146, 60, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 14px rgba(251, 146, 60, 0.4)';
            }}
          >
            <Trash2 style={{ width: '1rem', height: '1rem' }} />
            Clear
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div style={{
        position: 'fixed',
        top: '12rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '1200px',
        height: 'calc(100vh - 12rem)',
        padding: '1rem',
        zIndex: 10
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom right, #fef3c7, #fce7f3)',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
          border: '1px solid #fde68a',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3rem',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            borderBottom: '1px solid #e5e7eb',
            padding: '0 1rem'
          }}>
            <Users style={{ width: '1rem', height: '1rem', color: '#9ca3af' }} />
            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
              {userNo} collaborating
            </span>
          </div>
          <div style={{ height: 'calc(100% - 3rem)', padding: '1rem' }}>
            <Canvas
              canvasRef={canvasRef}
              ctx={ctx}
              color={color}
              setElements={setElements}
              elements={elements}
              tool={tool}
              socket={socket}
              user={user}
              style={{
                display: 'block',
                background: 'white',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                cursor: tool === 'pencil' ? 'crosshair' : 'default'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;