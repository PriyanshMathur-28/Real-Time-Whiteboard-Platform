require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");
const { userJoin, getUsers, userLeave, removeUserByAccount, getUserByNameInRoom, getUserByAccountId } = require("./utils/user");
const Room = require("./models/Room");
const Session = require("./models/Session");
const authRoutes = require("./routes/auth");
const boardsRoutes = require("./routes/boards");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(express.json());

// ── Database ───────────────────────────────────────────────────────────────
// Falls back to a local Mongo instance in dev. In production, set
// MONGODB_URI (e.g. an Atlas connection string, from Atlas > Connect > Drivers)
// as an environment variable ON THE SERVER HOST (Render dashboard → your
// service → Environment). Setting it only in the React app's .env does
// nothing — the browser never talks to Mongo directly.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/whiteboard";
let dbReady = false;

mongoose
  .connect(MONGODB_URI, {
    // Fail fast (5s) instead of hanging ~30s on a bad URI, wrong password,
    // or an IP that isn't allow-listed in Atlas Network Access — so the
    // real reason shows up in the logs immediately instead of looking like
    // a silent hang.
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    dbReady = true;
    console.log("MongoDB connected:", mongoose.connection.name);
  })
  .catch((err) => {
    // Don't crash the whole server if Mongo is unreachable — the app still
    // works in-memory (rooms just won't survive a restart) so a local dev
    // session without Mongo running isn't blocked.
    console.error("MongoDB connection failed, continuing with in-memory state only.");
    console.error("Reason:", err.message);
    console.error(
      "Checklist: (1) MONGODB_URI set in Render's Environment tab, not just locally, " +
      "(2) password in the URI is URL-encoded if it has special characters, " +
      "(3) Atlas → Network Access allows 0.0.0.0/0 (or Render's IPs), " +
      "(4) Atlas → Database Access has a user with read/write on this DB."
    );
  });

mongoose.connection.on("disconnected", () => {
  dbReady = false;
  console.error("MongoDB disconnected — falling back to in-memory state.");
});
mongoose.connection.on("reconnected", () => {
  dbReady = true;
  console.log("MongoDB reconnected");
});

// ── CORS ───────────────────────────────────────────────────────────────────
// Hard-coding a single deployed URL breaks the moment you deploy a preview
// URL, add a custom domain, or rename the project — the socket.io handshake
// gets rejected at the CORS check and every client fails to connect at all
// (which looks like "whiteboards won't connect", even though every user is
// affected, not just simultaneous ones). Set CLIENT_URL (comma-separated
// for multiple origins) in the server's env instead.
const PROD_ORIGIN = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? PROD_ORIGIN
        : ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
  },
});

// The `cors` package needs to be wired into Express explicitly, or plain
// HTTP calls (e.g. /api/auth/*) from a deployed frontend are subject to the
// browser's default same-origin policy and fail. Same allow-list as sockets.
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? PROD_ORIGIN
        : ["http://localhost:3000", "http://localhost:3001"],
  })
);

// ── Auth routes (signup / login / forgot-password / reset-password) ───────
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardsRoutes);

// Simple health check — handy for uptime monitors and for confirming the
// DB connection from the deployed server without digging through logs.
app.get("/api/health", (req, res) => {
  res.json({ ok: true, dbReady, uptime: process.uptime() });
});

// ── Serve the built React app in production ─────────────────────────────
// create-react-app (react-scripts build) outputs to client/build. Only
// wire this up if that folder actually exists — in local dev the React
// dev server (npm start on :3000) serves the frontend instead, and this
// path won't exist yet.
const CLIENT_BUILD_DIR = path.join(__dirname, "..", "client", "build");
if (fs.existsSync(CLIENT_BUILD_DIR)) {
  app.use(express.static(CLIENT_BUILD_DIR));
  // Express 5 no longer accepts a bare "*" route pattern — match everything
  // that isn't already handled above (i.e. isn't an /api/* route) instead.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(CLIENT_BUILD_DIR, "index.html"));
  });
}

// ── Constants ──────────────────────────────────────────────────────────────
// The room keeps one shared array per socket, capped per-room so a single
// pathological client can't grow the board without bound.
const MAX_ELEMENTS_PER_ROOM = 4000;
const MAX_PATH_POINTS = 2000;
const MAX_USERS_PER_ROOM = 20;
const MAX_CHAT_MSG_LEN = 500;

// ── Room state ─────────────────────────────────────────────────────────────
// roomData[roomId] = { elements: [...], chat: [...], boardName: "..." }
let roomData = {};

// Debounced DB writes: drawing events fire on every mouse-up, so we save
// at most once per interval per room rather than on every single event.
const SAVE_DEBOUNCE_MS = 1500;
const saveTimers = {};

function scheduleSave(roomId) {
  if (!dbReady) return;
  if (saveTimers[roomId]) clearTimeout(saveTimers[roomId]);
  saveTimers[roomId] = setTimeout(() => {
    delete saveTimers[roomId];
    persistRoom(roomId);
  }, SAVE_DEBOUNCE_MS);
}

async function persistRoom(roomId) {
  if (!dbReady || !roomData[roomId]) return;
  const elements = roomData[roomId].elements || [];
  const chat = roomData[roomId].chat || [];
  const boardName = roomData[roomId].boardName;
  try {
    const update = { elements, chat, lastActive: new Date() };
    if (boardName && boardName !== roomId) {
      update.boardName = boardName;
    }
    await Room.findOneAndUpdate(
      { roomId },
      update,
      { upsert: true }
    );
  } catch (err) {
    console.error(`Failed to persist room ${roomId}:`, err.message);
  }
}

// Load a room's saved board + chat from the DB the first time it's needed
// (e.g. the first person to (re)join after a server restart).
async function loadRoomFromDb(roomId) {
  if (!dbReady) return null;
  try {
    return await Room.findOne({ roomId }).lean();
  } catch (err) {
    console.error(`Failed to load room ${roomId}:`, err.message);
    return null;
  }
}

// ── Session log (who was in which room, and when) ───────────────────────────
async function recordJoin(roomId, participant) {
  if (!dbReady) return;
  try {
    let session = await Session.findOne({ roomId, endedAt: null });
    if (!session) {
      session = await Session.create({ roomId, participants: [] });
    }
    session.participants.push({
      accountId: participant.accountId || null,
      socketId: participant.socketId,
      userName: participant.userName,
      host: !!participant.host,
      joinedAt: new Date(),
    });
    await session.save();
  } catch (err) {
    console.error(`Failed to record join for room ${roomId}:`, err.message);
  }
}

async function recordLeave(roomId, socketId) {
  if (!dbReady) return;
  try {
    const session = await Session.findOne({ roomId, endedAt: null });
    if (!session) return;
    const entry = [...session.participants].reverse().find((p) => p.socketId === socketId && !p.leftAt);
    if (entry) {
      entry.leftAt = new Date();
      await session.save();
    }
  } catch (err) {
    console.error(`Failed to record leave for room ${roomId}:`, err.message);
  }
}

async function closeSession(roomId) {
  if (!dbReady) return;
  try {
    await Session.findOneAndUpdate({ roomId, endedAt: null }, { endedAt: new Date() });
  } catch (err) {
    console.error(`Failed to close session for room ${roomId}:`, err.message);
  }
}

// ── Validation helpers ─────────────────────────────────────────────────────
const VALID_TOOLS = new Set([
  "pencil", "line", "rect", "circle", "ellipse", "triangle", "eraser", "text", "sticky",
]);

function isValidElement(ele) {
  if (!ele || typeof ele !== "object") return false;
  if (!VALID_TOOLS.has(ele.element)) return false;
  if (typeof ele.offsetX !== "number" || typeof ele.offsetY !== "number") return false;
  return true;
}

// ── Socket events ──────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  // ── user-joined ──────────────────────────────────────────────────────────
  socket.on("user-joined", async (data) => {
    if (!data || typeof data !== "object") return;
    const { roomId, userName, host, presenter, accountId, boardName } = data;
    if (!roomId || !userName) return;

    // ── One-session-per-account enforcement ──────────────────────────────────
    // Block the same accountId from joining the SAME room via a different tab/window.
    if (accountId) {
      const sameRoomSession = getUserByAccountId(accountId, roomId, socket.id);
      if (sameRoomSession) {
        socket.emit("join-error", {
          code: "DUPLICATE_TAB",
          message: "You already have this board open in another tab or window. Please use that tab instead.",
        });
        return;
      }

      // Block the same accountId from joining a DIFFERENT room while already in one.
      const otherRoomSession = getUserByAccountId(accountId, null, socket.id);
      if (otherRoomSession) {
        socket.emit("join-error", {
          code: "ALREADY_IN_ROOM",
          message: `You are already in another board (${otherRoomSession.room}). Please leave that board before joining a new one.`,
        });
        return;
      }
    }

    // Enforce unique names per room, but allow the same account or socket to reconnect
    const nameTaken = getUserByNameInRoom(userName, roomId, socket.id, accountId);
    if (nameTaken) {
      socket.emit("join-error", {
        message: `The name "${userName}" is already in use by another participant in this room.`,
      });
      return;
    }

    // Enforce max concurrent users per room
    const currentUsers = getUsers(roomId);
    if (currentUsers.length >= MAX_USERS_PER_ROOM) {
      socket.emit("join-error", {
        message: `This room is full (max ${MAX_USERS_PER_ROOM} users). Please try again later.`,
      });
      return;
    }

    // First person into this room since the server started (or restarted):
    // pull any previously saved board/chat from the database.
    if (!roomData[roomId]) {
      const saved = await loadRoomFromDb(roomId);
      roomData[roomId] = {
        elements: saved?.elements || [],
        chat: saved?.chat || [],
        boardName: saved?.boardName || (boardName && typeof boardName === "string" ? boardName.trim() : roomId),
        ownerAccountId: saved?.ownerAccountId || null,
      };
    }

    // Determine host: ONLY the person who created/owns the room is Host.
    // If the room has no owner recorded yet, the first person joining becomes the host.
    let isHost = false;
    if (roomData[roomId].ownerAccountId) {
      isHost = accountId ? roomData[roomId].ownerAccountId.toString() === accountId.toString() : false;
    } else if (roomData[roomId].creatorSocketId) {
      isHost = roomData[roomId].creatorSocketId === socket.id;
    } else {
      // First person to create/join this room
      isHost = true;
      if (accountId) {
        roomData[roomId].ownerAccountId = accountId.toString();
      } else {
        roomData[roomId].creatorSocketId = socket.id;
      }
    }

    userJoin(socket.id, userName, roomId, isHost, presenter, accountId);
    socket.join(roomId);
    recordJoin(roomId, { accountId, socketId: socket.id, userName, host: isHost });

    // Persist board metadata (name, owner, participant list) to DB best-effort.
    if (dbReady) {
      try {
        const update = { lastActive: new Date() };
        if (isHost && accountId) {
          update.ownerAccountId = accountId;
        }
        if (boardName && typeof boardName === "string" && boardName.trim() && boardName !== roomId) {
          update.boardName = boardName.trim().slice(0, 80);
          roomData[roomId].boardName = update.boardName;
        }
        if (accountId) {
          update.$addToSet = { participantAccountIds: accountId };
        }
        await Room.findOneAndUpdate(
          { roomId },
          update,
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`Failed to update board metadata for ${roomId}:`, err.message);
      }
    }

    socket.emit("message", { message: "Welcome to the Whiteboard!" });
    socket.broadcast.to(roomId).emit("message", { message: `${userName} has joined` });

    const roomUsers = getUsers(roomId);
    io.to(roomId).emit("users", roomUsers);

    // Send existing canvas state to the newly joined user
    socket.emit("whiteboardData", roomData[roomId].elements || []);

    // Send board metadata with isHost flag
    socket.emit("boardInfo", {
      roomId,
      boardName: roomData[roomId].boardName || roomId,
      isHost,
    });

    // Send existing chat history
    socket.emit("chatHistory", roomData[roomId].chat || []);

    // Let everyone know this user is present (for the live cursor layer)
    io.to(roomId).emit("presence-join", { socketId: socket.id, userName });
  });

  // ── drawing ──────────────────────────────────────────────────────────────
  socket.on("drawing", ({ roomId, elements }) => {
    if (!roomId || !Array.isArray(elements)) return;

    const user = getUsers(roomId).find((u) => u.id === socket.id);
    if (!user) return;

    const sanitized = elements.filter(isValidElement);
    const capped = sanitized.slice(-MAX_ELEMENTS_PER_ROOM);

    if (!roomData[roomId]) {
      roomData[roomId] = { elements: [], chat: [] };
    }
    roomData[roomId].elements = capped;

    socket.broadcast.to(roomId).emit("whiteboardData", capped);
    scheduleSave(roomId);
  });

  // ── cursor-move (live presence) ─────────────────────────────────────────
  socket.on("cursor-move", ({ roomId, x, y }) => {
    if (!roomId || typeof x !== "number" || typeof y !== "number") return;
    const user = getUsers(roomId).find((u) => u.id === socket.id);
    if (!user) return;
    socket.broadcast.to(roomId).emit("cursor-move", {
      socketId: socket.id,
      userName: user.username,
      x,
      y,
    });
  });

  // ── reaction (emoji burst) ───────────────────────────────────────────────
  socket.on("reaction", ({ roomId, emoji }) => {
    if (!roomId || typeof emoji !== "string") return;
    const user = getUsers(roomId).find((u) => u.id === socket.id);
    if (!user) return;
    const ALLOWED_EMOJI = new Set(["👍", "❤️", "🎉", "😂", "👏", "🔥", "👀", "🤔"]);
    if (!ALLOWED_EMOJI.has(emoji)) return;
    io.to(roomId).emit("reaction", { senderId: socket.id, senderName: user.username, emoji });
  });

  // ── clearCanvas ──────────────────────────────────────────────────────────
  socket.on("clearCanvas", ({ roomId }) => {
    if (!roomId) return;

    const user = getUsers(roomId).find((u) => u.id === socket.id);
    if (!user) return;

    if (roomData[roomId]) {
      roomData[roomId].elements = [];
    }

    io.to(roomId).emit("canvasCleared");
    persistRoom(roomId);
  });

  // ── chat-message ─────────────────────────────────────────────────────────
  socket.on("chat-message", ({ roomId, message }) => {
    if (!roomId || typeof message !== "string") return;

    const user = getUsers(roomId).find((u) => u.id === socket.id);
    if (!user) return;

    const trimmed = message.trim().slice(0, MAX_CHAT_MSG_LEN);
    if (!trimmed) return;

    const chatMsg = {
      senderId: socket.id,
      senderName: user.username,
      message: trimmed,
      timestamp: Date.now(),
    };

    if (!roomData[roomId]) roomData[roomId] = { elements: [], chat: [] };
    roomData[roomId].chat.push(chatMsg);
    if (roomData[roomId].chat.length > 200) {
      roomData[roomId].chat.shift();
    }

    io.to(roomId).emit("chat-message", chatMsg);
    scheduleSave(roomId);
  });

  // ── user leaving (leave-room / disconnect) ─────────────────────────────
  // Made async so that when the room empties out, we can WAIT for the final
  // DB write (and session close) to actually complete before clearing the
  // in-memory cache. Previously `persistRoom(roomId)` was fired without
  // being awaited, so `delete roomData[roomId]` ran immediately afterward —
  // if the two users left and then rejoined quickly, the rejoin's
  // `loadRoomFromDb` could race that in-flight write (or the room's very
  // first save) and come back empty, making the board look wiped.
  const handleUserLeave = async (socket) => {
    const userLeaves = userLeave(socket.id);
    if (userLeaves) {
      const { room: roomId } = userLeaves;
      socket.leave(roomId);
      recordLeave(roomId, socket.id);

      const roomUsers = getUsers(roomId);
      io.to(roomId).emit("message", { message: `${userLeaves.username} left the room` });
      io.to(roomId).emit("users", roomUsers);
      io.to(roomId).emit("presence-leave", { socketId: socket.id });

      if (roomUsers.length === 0) {
        // Flush the final state to the DB BEFORE clearing in-memory roomData,
        // and wait for that flush to finish so a fast rejoin can't race it.
        if (saveTimers[roomId]) {
          clearTimeout(saveTimers[roomId]);
          delete saveTimers[roomId];
        }
        await persistRoom(roomId);
        await closeSession(roomId);
        delete roomData[roomId];
      } else {
        scheduleSave(roomId);
      }
    }
  };

  // ── leave-room ───────────────────────────────────────────────────────────
  socket.on("leave-room", () => {
    handleUserLeave(socket);
  });

  // ── disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    handleUserLeave(socket);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => console.log(`Server listening on port ${PORT}`));

// Export for integration testing
module.exports = { app, server, io };