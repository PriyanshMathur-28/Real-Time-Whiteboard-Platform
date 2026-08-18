import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import "../css/MyBoards.css";

const SERVER_URL = (process.env.REACT_APP_SERVER_URL || "http://localhost:5000").replace(/\/+$/, "");
const CUSTOM_ID_RE = /^[a-zA-Z0-9-]{4,40}$/;

const uuid = () => {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
};

function timeAgo(date) {
  if (!date) return "—";
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  const d = Math.floor(secs / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

const MyBoards = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create form state
  const [createBoardName, setCreateBoardName] = useState("");
  const [createIdMode, setCreateIdMode] = useState("random"); // "random" | "custom"
  const [createCustomId, setCreateCustomId] = useState("");
  const [customIdError, setCustomIdError] = useState("");

  // Join form state
  const [joinRoomInput, setJoinRoomInput] = useState("");

  useEffect(() => {
    async function fetchBoards() {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/boards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load boards.");
        setBoards(data.boards || []);
      } catch (err) {
        if (err.message !== "Failed to load boards.") {
          toast.info("Could not load saved boards (DB may be offline). You can still create or join a room.");
        }
        setBoards([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBoards();
  }, [token]);

  const handleDelete = async (roomId) => {
    if (!window.confirm("Delete this board? This cannot be undone.")) return;
    setDeletingId(roomId);
    try {
      const res = await fetch(`${SERVER_URL}/api/boards/${roomId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Could not delete board.");
      }
      setBoards((prev) => prev.filter((b) => b.roomId !== roomId));
      toast.success("Board deleted.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenCreate = () => {
    setCreateBoardName("");
    setCreateIdMode("random");
    setCreateCustomId("");
    setCustomIdError("");
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    let finalRoomId = "";
    if (createIdMode === "random") {
      finalRoomId = uuid();
    } else {
      const trimmed = createCustomId.trim();
      if (!trimmed || !CUSTOM_ID_RE.test(trimmed)) {
        setCustomIdError("4-40 characters: letters, numbers, and dashes only.");
        return;
      }
      finalRoomId = trimmed;
    }

    const boardNameQuery = createBoardName.trim() ? `?name=${encodeURIComponent(createBoardName.trim())}` : "";
    setShowCreateModal(false);
    navigate(`/board/${finalRoomId}${boardNameQuery}`);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    let input = joinRoomInput.trim();
    if (!input) {
      toast.error("Please enter a Room ID or link.");
      return;
    }

    // If a full link was pasted e.g. http://localhost:3000/board/xyz or ?room=xyz
    try {
      if (input.includes("/board/")) {
        input = input.split("/board/")[1].split("?")[0].split("#")[0];
      } else if (input.includes("?room=")) {
        const urlParams = new URLSearchParams(input.split("?")[1]);
        input = urlParams.get("room") || input;
      }
    } catch {
      // Keep as-is
    }

    setShowJoinModal(false);
    navigate(`/board/${input.trim()}`);
  };

  return (
    <div className="mb-page">
      {/* Decorative background blobs */}
      <div className="mb-blob mb-blob-1" />
      <div className="mb-blob mb-blob-2" />

      {/* Nav */}
      <nav className="mb-nav">
        <div className="mb-nav-inner">
          <Link to="/" className="mb-logo" style={{ textDecoration: "none" }}>
            <svg className="mb-logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="mb-logo-text">Whiteboard</span>
          </Link>
          <div className="mb-nav-right">
            <span className="mb-account-name">{user?.name || user?.email}</span>
            <button className="mb-logout-btn" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <main className="mb-main">
        <div className="mb-header">
          <div>
            <h1 className="mb-title">My Boards</h1>
            <p className="mb-subtitle">Pick up where you left off, create a new board, or join a room.</p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="mb-new-btn"
              style={{ background: "white", color: "#6d28d9", border: "1.5px solid #c4b5fd" }}
              onClick={() => { setJoinRoomInput(""); setShowJoinModal(true); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Join by ID
            </button>
            <button className="mb-new-btn" onClick={handleOpenCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              New Board
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mb-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-card mb-card--skeleton">
                <div className="mb-skeleton mb-skeleton-title" />
                <div className="mb-skeleton mb-skeleton-meta" />
                <div className="mb-skeleton mb-skeleton-btn" />
              </div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="mb-empty">
            <div className="mb-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.5" />
                <path d="M8 12h8M12 8v8" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="mb-empty-title">No boards yet</h2>
            <p className="mb-empty-desc">Create your first whiteboard and it will appear here automatically.</p>
            <button className="mb-new-btn" onClick={handleOpenCreate}>
              Create your first board
            </button>
          </div>
        ) : (
          <div className="mb-grid">
            {boards.map((board) => (
              <div key={board.roomId} className="mb-card">
                <div className="mb-card-top">
                  <div className="mb-board-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="2" />
                      <path d="M7 8h10M7 12h6" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  {board.isOwner && <span className="mb-owner-badge">Owner</span>}
                </div>

                <h3 className="mb-board-name">{board.boardName || board.roomId}</h3>
                <p className="mb-board-id">{board.roomId}</p>

                <div className="mb-board-meta">
                  <span className="mb-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                      <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {timeAgo(board.lastActive)}
                  </span>
                  <span className="mb-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="9" cy="7" r="4" strokeWidth="1.5" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {board.participantCount} member{board.participantCount !== 1 ? "s" : ""}
                  </span>
                  <span className="mb-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M12 19l7-7 3 3-7 7-3-3z" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {board.elementCount} element{board.elementCount !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="mb-card-actions">
                  <button
                    className="mb-rejoin-btn"
                    onClick={() => {
                      const nameQuery = board.boardName ? `?name=${encodeURIComponent(board.boardName)}` : "";
                      navigate(`/board/${board.roomId}${nameQuery}`);
                    }}
                  >
                    Open Board
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <button
                    className="mb-delete-btn"
                    onClick={() => handleDelete(board.roomId)}
                    disabled={deletingId === board.roomId}
                    title={board.isOwner ? "Delete board" : "Remove from my list"}
                    aria-label={board.isOwner ? "Delete board" : "Remove from my list"}
                  >
                    {deletingId === board.roomId ? (
                      <span className="mb-spinner" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}

            {/* Create new card */}
            <button className="mb-card mb-card--new" onClick={handleOpenCreate}>
              <div className="mb-new-card-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="mb-new-card-label">New Board</span>
            </button>
          </div>
        )}
      </main>

      {/* ── Create Board Modal ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem"
        }} onClick={() => setShowCreateModal(false)}>
          <div style={{
            background: "white", borderRadius: "1.25rem", padding: "2rem",
            maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
                Create New Board
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                  Board Name <span style={{ fontWeight: 400, color: "#94a3b8" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Design Sprint, System Architecture"
                  value={createBoardName}
                  onChange={(e) => setCreateBoardName(e.target.value)}
                  maxLength={80}
                  style={{
                    width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                    border: "1.5px solid #e2e8f0", fontSize: "0.95rem", outline: "none",
                    boxSizing: "border-box"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                  Room ID
                </label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => { setCreateIdMode("random"); setCustomIdError(""); }}
                    style={{
                      flex: 1, padding: "0.45rem", borderRadius: "0.6rem",
                      border: `1.5px solid ${createIdMode === "random" ? "#6d28d9" : "#e2e8f0"}`,
                      background: createIdMode === "random" ? "#ede9fe" : "white",
                      color: createIdMode === "random" ? "#6d28d9" : "#64748b",
                      fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                    }}
                  >
                    Auto-generated
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreateIdMode("custom"); setCustomIdError(""); }}
                    style={{
                      flex: 1, padding: "0.45rem", borderRadius: "0.6rem",
                      border: `1.5px solid ${createIdMode === "custom" ? "#6d28d9" : "#e2e8f0"}`,
                      background: createIdMode === "custom" ? "#ede9fe" : "white",
                      color: createIdMode === "custom" ? "#6d28d9" : "#64748b",
                      fontWeight: 700, fontSize: "0.8rem", cursor: "pointer",
                    }}
                  >
                    Custom ID
                  </button>
                </div>

                {createIdMode === "custom" && (
                  <>
                    <input
                      type="text"
                      placeholder="e.g. team-standup"
                      value={createCustomId}
                      onChange={(e) => {
                        setCreateCustomId(e.target.value);
                        if (e.target.value.trim() && !CUSTOM_ID_RE.test(e.target.value.trim())) {
                          setCustomIdError("4-40 characters: letters, numbers, and dashes only.");
                        } else {
                          setCustomIdError("");
                        }
                      }}
                      style={{
                        width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                        border: customIdError ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0",
                        fontSize: "0.95rem", outline: "none", boxSizing: "border-box"
                      }}
                    />
                    {customIdError && (
                      <p style={{ color: "#ef4444", fontSize: "0.75rem", margin: "0.3rem 0 0" }}>{customIdError}</p>
                    )}
                  </>
                )}
                {createIdMode === "random" && (
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.25rem 0 0" }}>
                    A unique, secure UUID room ID will be generated automatically.
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
                    border: "1.5px solid #e2e8f0", background: "white",
                    color: "#64748b", fontWeight: 700, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.65rem 1.5rem", borderRadius: "0.75rem",
                    border: "none", background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
                    color: "white", fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(109, 40, 217, 0.3)"
                  }}
                >
                  Create & Launch →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Join Room Modal ─────────────────────────────────────────────────── */}
      {showJoinModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "1rem"
        }} onClick={() => setShowJoinModal(false)}>
          <div style={{
            background: "white", borderRadius: "1.25rem", padding: "2rem",
            maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
                Join Board by ID
              </h2>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.25rem", padding: "0.25rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinSubmit}>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                  Room ID or Invite Link
                </label>
                <input
                  type="text"
                  placeholder="Paste Room ID or invite link"
                  value={joinRoomInput}
                  onChange={(e) => setJoinRoomInput(e.target.value)}
                  style={{
                    width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                    border: "1.5px solid #e2e8f0", fontSize: "0.95rem", outline: "none",
                    boxSizing: "border-box"
                  }}
                  autoFocus
                />
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: "0.35rem 0 0" }}>
                  Enter the Room ID given to you by the room creator.
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  style={{
                    padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
                    border: "1.5px solid #e2e8f0", background: "white",
                    color: "#64748b", fontWeight: 700, cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "0.65rem 1.5rem", borderRadius: "0.75rem",
                    border: "none", background: "linear-gradient(135deg, #6d28d9, #4f46e5)",
                    color: "white", fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(109, 40, 217, 0.3)"
                  }}
                >
                  Join Board →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBoards;
