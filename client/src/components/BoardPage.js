import React, { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import Room from "./Room";
import Sidebar from "./Sidebar";
import "../css/style.css";

function toWsUrl(serverUrl) {
  try {
    const parsed = new URL(serverUrl);
    parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
    return parsed.toString();
  } catch {
    return serverUrl.replace(/^https?/, (match) => (match === "https" ? "wss" : "ws"));
  }
}

const uuid = () => {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
};

// ── Duplicate-tab detection ────────────────────────────────────────────────
// Each tab that successfully "owns" a board slot writes a unique tab-id into
// localStorage. BroadcastChannel lets an existing tab immediately tell any
// new tab opening the same board to stand down.

const TAB_ID = uuid(); // unique for this browser tab for its lifetime

function getBoardLockKey(accountId, roomId) {
  return `wb-board-lock:${accountId}:${roomId}`;
}

function getGlobalLockKey(accountId) {
  return `wb-global-lock:${accountId}`;
}

const BoardPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const queryBoardName = searchParams.get("name") || "";

  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [userNo, setUserNo] = useState(0);
  const [isHost, setIsHost] = useState(false);
  const [duplicateTab, setDuplicateTab] = useState(false); // blocked state
  const [duplicateMsg, setDuplicateMsg] = useState("");

  const userIdRef = useRef(uuid());
  const channelRef = useRef(null);
  const ownsLockRef = useRef(false);

  const accountId = authUser?.id || authUser?._id || null;

  const currentUserData = {
    roomId,
    userId: userIdRef.current,
    userName: authUser?.name || authUser?.email || "User",
    boardName: queryBoardName || roomId,
    host: isHost,
    presenter: true,
    accountId,
  };

  // ── Tab-lock effect ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !accountId) return; // guests bypass the lock

    const boardKey = getBoardLockKey(accountId, roomId);
    const globalKey = getGlobalLockKey(accountId);
    const channelName = `wb-tab-channel:${accountId}`;

    // 1. Check if THIS user already has the board open in another tab via
    //    localStorage.
    const existingBoardOwner = localStorage.getItem(boardKey);
    if (existingBoardOwner && existingBoardOwner !== TAB_ID) {
      setDuplicateTab(true);
      setDuplicateMsg("You already have this board open in another tab or window. Please use that tab instead.");
      return;
    }

    // 2. Check if THIS user is already in a DIFFERENT board.
    const existingGlobalEntry = localStorage.getItem(globalKey);
    if (existingGlobalEntry) {
      try {
        const entry = JSON.parse(existingGlobalEntry);
        if (entry.tabId !== TAB_ID && entry.roomId !== roomId) {
          setDuplicateTab(true);
          setDuplicateMsg(
            "You are already in another board. Please close that board before joining a new one."
          );
          return;
        }
      } catch {
        // malformed entry – clear it and continue
        localStorage.removeItem(globalKey);
      }
    }

    // 3. Claim the locks.
    localStorage.setItem(boardKey, TAB_ID);
    localStorage.setItem(globalKey, JSON.stringify({ tabId: TAB_ID, roomId }));
    ownsLockRef.current = true;

    // 4. Open a BroadcastChannel so other tabs opening the same board can be
    //    told immediately (before they even connect the socket).
    const bc = new BroadcastChannel(channelName);
    channelRef.current = bc;

    // Broadcast our presence so any tab that opens after us knows we're here.
    bc.postMessage({ type: "BOARD_ACTIVE", tabId: TAB_ID, roomId });

    bc.onmessage = (evt) => {
      const msg = evt.data;
      if (!msg || msg.tabId === TAB_ID) return;

      if (msg.type === "BOARD_ACTIVE" && msg.roomId === roomId) {
        // A different tab just announced it has the same board open.
        // If we own the lock, tell them they're the duplicate.
        if (ownsLockRef.current) {
          bc.postMessage({ type: "YOU_ARE_DUPLICATE", tabId: msg.tabId, roomId });
        }
      }

      if (msg.type === "YOU_ARE_DUPLICATE" && msg.tabId === TAB_ID) {
        // We are the new tab; the existing owner just told us to stand down.
        ownsLockRef.current = false;
        localStorage.removeItem(boardKey);
        localStorage.removeItem(globalKey);
        setDuplicateTab(true);
        setDuplicateMsg("You already have this board open in another tab or window. Please use that tab instead.");
      }
    };

    // 5. Release locks on unload so the next tab can take over.
    const releaseLocks = () => {
      if (!ownsLockRef.current) return;
      ownsLockRef.current = false;
      localStorage.removeItem(boardKey);
      localStorage.removeItem(globalKey);
      bc.postMessage({ type: "LOCK_RELEASED", tabId: TAB_ID, roomId });
      bc.close();
    };

    window.addEventListener("beforeunload", releaseLocks);
    window.addEventListener("pagehide", releaseLocks);

    return () => {
      releaseLocks();
      window.removeEventListener("beforeunload", releaseLocks);
      window.removeEventListener("pagehide", releaseLocks);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, accountId]);

  // ── Socket connection effect ─────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      navigate("/dashboard", { replace: true });
      return;
    }
    // Don't open a socket if we're already flagged as a duplicate tab.
    if (duplicateTab) return;

    const serverUrl = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
    const wsUrl = toWsUrl(serverUrl);

    const newSocket = io(wsUrl, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    setSocket(newSocket);

    const emitJoin = () => {
      newSocket.emit("user-joined", {
        roomId,
        userId: userIdRef.current,
        userName: authUser?.name || authUser?.email || "User",
        boardName: queryBoardName || roomId,
        presenter: true,
        accountId: authUser?.id || authUser?._id || null,
      });
    };

    if (newSocket.connected) {
      emitJoin();
    }
    newSocket.on("connect", emitJoin);

    newSocket.on("boardInfo", (info) => {
      if (info && typeof info.isHost === "boolean") {
        setIsHost(info.isHost);
      }
    });

    newSocket.on("users", (roomUsers) => {
      setUsers(roomUsers);
      setUserNo(roomUsers.length);
      const me = roomUsers.find((u) => u.id === newSocket.id);
      if (me && typeof me.host === "boolean") {
        setIsHost(me.host);
      }
    });

    newSocket.on("join-error", (data) => {
      const msg = data.message || "Could not join room.";
      toast.error(msg);
      if (data.code === "DUPLICATE_TAB" || data.code === "ALREADY_IN_ROOM") {
        // Release client-side locks since the server also rejected us
        if (ownsLockRef.current && accountId) {
          const boardKey = getBoardLockKey(accountId, roomId);
          const globalKey = getGlobalLockKey(accountId);
          localStorage.removeItem(boardKey);
          localStorage.removeItem(globalKey);
          ownsLockRef.current = false;
        }
        setDuplicateTab(true);
        setDuplicateMsg(msg);
        newSocket.disconnect();
      } else {
        navigate("/dashboard", { replace: true });
      }
    });

    newSocket.on("connect_error", (err) => {
      toast.error(`Couldn't reach the whiteboard server (${err.message}). Retrying…`);
    });

    newSocket.io.on("reconnect_failed", () => {
      toast.error("Lost connection to the whiteboard server. Please refresh the page.");
    });

    return () => {
      if (newSocket) {
        newSocket.emit("leave-room");
        newSocket.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, duplicateTab]);

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit("leave-room");
    }
    navigate("/dashboard");
  };

  // ── Duplicate-tab blocking screen ────────────────────────────────────────
  if (duplicateTab) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        padding: "2rem",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "1.5rem",
          padding: "3rem 2.5rem",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}>
          {/* Icon */}
          <div style={{
            width: "72px", height: "72px",
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 0 30px rgba(239,68,68,0.4)",
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", lineHeight: 1.3 }}>
            Board Already Open
          </h2>

          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            {duplicateMsg}
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                color: "white",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              }}
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.close()}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "0.75rem",
                padding: "0.75rem 1.5rem",
                color: "rgba(255,255,255,0.8)",
                fontWeight: 600,
                fontSize: "0.95rem",
                cursor: "pointer",
              }}
            >
              Close This Tab
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {socket && <Sidebar users={users} user={currentUserData} socket={socket} />}
      <Room
        userNo={userNo}
        user={currentUserData}
        socket={socket}
        setUsers={setUsers}
        setUserNo={setUserNo}
        setRoomJoined={handleLeaveRoom}
      />
    </div>
  );
};

export default BoardPage;
