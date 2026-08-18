import React, { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Pencil, Minus, Square, Circle, Triangle, Eraser, Type, StickyNote,
  Undo2, Trash2, Download, LogOut, Copy, Check, MessageSquare,
} from "lucide-react";
import Canvas from "./Canvas";
import Chat from "./Chat";
import "../css/Room.css";

const TOOLS = [
  { id: "pencil", label: "Pencil", Icon: Pencil },
  { id: "line", label: "Line", Icon: Minus },
  { id: "rect", label: "Rectangle", Icon: Square },
  { id: "circle", label: "Circle", Icon: Circle },
  { id: "ellipse", label: "Ellipse", Icon: Circle },
  { id: "triangle", label: "Triangle", Icon: Triangle },
  { id: "text", label: "Text (click canvas)", Icon: Type },
  { id: "sticky", label: "Sticky note (click canvas)", Icon: StickyNote },
  { id: "eraser", label: "Eraser", Icon: Eraser },
];

const SWATCHES = ["#1e293b", "#e11d48", "#fb923c", "#f59e0b", "#16a34a", "#0ea5e9", "#8b5cf6", "#ffffff"];
const REACTION_EMOJI = ["👍", "❤️", "🎉", "😂", "👏", "🔥", "👀", "🤔"];
const CURSOR_COLORS = ["#6d28d9", "#e11d48", "#0891b2", "#059669", "#d97706", "#db2777", "#4f46e5", "#0284c7"];

function colorForName(name) {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

const Room = ({ userNo, user, socket, setUsers, setUserNo, setRoomJoined }) => {
  const canvasRef = useRef(null);
  const ctx = useRef(null);

  const [elements, setElements] = useState([]);
  const [boardTitle, setBoardTitle] = useState(user?.boardName || "");
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState("#1e293b");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [eraserSize, setEraserSize] = useState(30);
  const [fillEnabled, setFillEnabled] = useState(false);
  const [fillColor, setFillColor] = useState("#fed7aa");
  const [fontFamily] = useState("Inter");

  const [remoteCursors, setRemoteCursors] = useState({});
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [copied, setCopied] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  const isShapeTool = ["rect", "circle", "ellipse", "triangle"].includes(tool);

  useEffect(() => {
    if (user?.boardName) {
      setBoardTitle(user.boardName);
    }
  }, [user?.boardName]);

  // ── Socket listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onWhiteboardData = (data) => setElements(Array.isArray(data) ? data : []);
    const onBoardInfo = (data) => {
      if (data?.boardName) setBoardTitle(data.boardName);
    };
    const onCanvasCleared = () => {
      setElements([]);
      toast.info("The canvas was cleared.");
    };
    const onMessage = (data) => toast.info(data.message);
    const onUsers = (roomUsers) => {
      setUsers(roomUsers);
      setUserNo(roomUsers.length);
    };
    const onPresenceLeave = ({ socketId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    };
    const onCursorMove = ({ socketId, userName, x, y }) => {
      if (socketId === socket.id) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, name: userName, color: colorForName(userName) },
      }));
    };
    const onReaction = ({ senderName, emoji }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setFloatingReactions((prev) => [
        ...prev,
        { id, emoji, left: 10 + Math.random() * 80, name: senderName },
      ]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 1800);
    };

    socket.on("whiteboardData", onWhiteboardData);
    socket.on("boardInfo", onBoardInfo);
    socket.on("canvasCleared", onCanvasCleared);
    socket.on("message", onMessage);
    socket.on("users", onUsers);
    socket.on("presence-leave", onPresenceLeave);
    socket.on("cursor-move", onCursorMove);
    socket.on("reaction", onReaction);

    return () => {
      socket.off("whiteboardData", onWhiteboardData);
      socket.off("boardInfo", onBoardInfo);
      socket.off("canvasCleared", onCanvasCleared);
      socket.off("message", onMessage);
      socket.off("users", onUsers);
      socket.off("presence-leave", onPresenceLeave);
      socket.off("cursor-move", onCursorMove);
      socket.off("reaction", onReaction);
    };
  }, [socket, setUsers, setUserNo]);

  const handleUndo = useCallback(() => {
    setElements((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      if (socket && user?.roomId) {
        socket.emit("drawing", { roomId: user.roomId, elements: next });
      }
      return next;
    });
  }, [socket, user]);

  const handleClear = () => {
    if (!socket || !user?.roomId) return;
    if (elements.length === 0) return;
    if (!user?.host) {
      toast.warning("Only the host can clear the whiteboard.");
      return;
    }
    if (window.confirm("As the host, clear the whole board for everyone in this room?")) {
      socket.emit("clearCanvas", { roomId: user.roomId });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const octx = out.getContext("2d");
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `whiteboard-${user?.roomId || "board"}.png`;
    link.href = out.toDataURL("image/png");
    link.click();
  };

  const handleLeave = () => {
    setRoomJoined(false);
  };

  const handleCopyRoomId = () => {
    if (!user?.roomId) return;
    const shareUrl = `${window.location.origin}/board/${user.roomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Board link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReaction = (emoji) => {
    if (!socket || !user?.roomId) return;
    socket.emit("reaction", { roomId: user.roomId, emoji });
  };

  const handleUnread = () => setUnread((n) => n + 1);
  const openChat = () => {
    setChatOpen(true);
    setUnread(0);
  };

  return (
    <div className="rm-page">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="rm-topbar">
        <div className="rm-topbar-left">
          <div className="rm-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {(boardTitle || user?.boardName) && (
            <span className="rm-board-name">{boardTitle || user?.boardName}</span>
          )}
          <span className="rm-room-label">Room</span>
          <button className="rm-room-id-chip" onClick={handleCopyRoomId} title="Copy room ID">
            <span className="rm-monospace">{user?.roomId}</span>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <span className="rm-user-count">
            <span className="rm-user-dot" />
            {userNo} online
          </span>
          {user?.host && <span className="rm-host-badge">Host</span>}
        </div>

        <div className="rm-topbar-right">
          {/* Chat button — always visible in topbar */}
          <button
            id="rm-chat-btn"
            className={`rm-chat-topbar-btn ${chatOpen ? "rm-chat-topbar-btn--active" : ""}`}
            onClick={chatOpen ? () => setChatOpen(false) : openChat}
            title="Toggle chat"
            aria-label="Toggle chat"
          >
            <MessageSquare size={17} />
            <span className="rm-chat-btn-label">Chat</span>
            {unread > 0 && !chatOpen && (
              <span className="rm-chat-badge">{unread}</span>
            )}
          </button>

          <button className="rm-icon-btn" onClick={handleDownload} title="Download as PNG">
            <Download size={17} />
          </button>
          <button className="rm-icon-btn" onClick={handleLeave} title="Leave room">
            <LogOut size={17} />
            <span className="rm-leave-label">Leave</span>
          </button>
        </div>
      </header>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="rm-toolbar">
        <div className="rm-tool-group">
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`rm-tool-btn ${tool === id ? "rm-tool-btn--active" : ""}`}
              onClick={() => setTool(id)}
              title={label}
              aria-label={label}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>

        <div className="rm-toolbar-divider" />

        <div className="rm-tool-group">
          {SWATCHES.map((sw) => (
            <button
              key={sw}
              className={`rm-swatch ${color === sw ? "rm-swatch--active" : ""}`}
              style={{ background: sw, border: sw === "#ffffff" ? "1.5px solid #e0e7ff" : "none" }}
              onClick={() => setColor(sw)}
              aria-label={`Color ${sw}`}
            />
          ))}
          <input
            type="color"
            className="rm-color-input"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="Custom color"
          />
        </div>

        <div className="rm-toolbar-divider" />

        <div className="rm-tool-group rm-slider-group">
          <label className="rm-slider-label">
            {tool === "eraser" ? "Eraser" : "Stroke"}
          </label>
          <input
            type="range"
            min={tool === "eraser" ? 10 : 1}
            max={tool === "eraser" ? 80 : 24}
            value={tool === "eraser" ? eraserSize : strokeWidth}
            onChange={(e) =>
              tool === "eraser"
                ? setEraserSize(Number(e.target.value))
                : setStrokeWidth(Number(e.target.value))
            }
            className="rm-slider"
          />
        </div>

        {isShapeTool && (
          <>
            <div className="rm-toolbar-divider" />
            <div className="rm-tool-group">
              <label className="rm-fill-toggle">
                <input
                  type="checkbox"
                  checked={fillEnabled}
                  onChange={(e) => setFillEnabled(e.target.checked)}
                />
                Fill
              </label>
              {fillEnabled && (
                <input
                  type="color"
                  className="rm-color-input"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  title="Fill color"
                />
              )}
            </div>
          </>
        )}

        <div className="rm-toolbar-divider" />

        <div className="rm-tool-group">
          <button className="rm-icon-btn" onClick={handleUndo} title="Undo your last stroke" disabled={elements.length === 0}>
            <Undo2 size={17} />
          </button>
          <button
            className={`rm-icon-btn rm-icon-btn--danger ${!user?.host ? "rm-btn--disabled" : ""}`}
            onClick={handleClear}
            title={user?.host ? "Clear board for everyone (Host only)" : "Only the host can clear the board"}
            disabled={elements.length === 0 || !user?.host}
          >
            <Trash2 size={17} />
          </button>
        </div>

        <div className="rm-toolbar-spacer" />

        <div className="rm-reaction-bar">
          {REACTION_EMOJI.map((emoji) => (
            <button key={emoji} className="rm-reaction-btn" onClick={() => handleReaction(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas area ──────────────────────────────────────────────────── */}
      <div className="rm-canvas-wrap">
        <Canvas
          canvasRef={canvasRef}
          ctx={ctx}
          color={color}
          setElements={setElements}
          elements={elements}
          tool={tool}
          socket={socket}
          user={user}
          strokeWidth={strokeWidth}
          eraserSize={eraserSize}
          fontFamily={fontFamily}
          fillEnabled={fillEnabled}
          fillColor={fillColor}
          remoteCursors={remoteCursors}
          className="rm-canvas"
        />

        {floatingReactions.map((r) => (
          <div key={r.id} className="rm-floating-reaction" style={{ left: `${r.left}%` }}>
            <span className="rm-floating-emoji">{r.emoji}</span>
          </div>
        ))}
      </div>

      <Chat
        socket={socket}
        user={user}
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onUnread={handleUnread}
      />
    </div>
  );
};

export default Room;
