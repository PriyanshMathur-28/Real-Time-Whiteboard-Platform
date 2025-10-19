const express = require("express");
const http = require("http");
const cors = require("cors");
const { userJoin, getUsers, userLeave } = require("./utils/user");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production" ? "https://real-time-whiteboard-platform-priyansh.vercel.app/" : "http://localhost:3000",
    methods: ["GET", "POST"]
  } 
});

// Health check for Render
app.head("/", (req, res) => res.status(200).send());  // Empty 200 OK for HEAD
app.get("/", (req, res) => res.send("server"));

io.on("connection", (socket) => {
  socket.on("user-joined", (data) => {
    const { roomId, userName, host, presenter } = data;
    const user = userJoin(socket.id, userName, roomId, host, presenter);
    socket.join(roomId);

    socket.emit("message", { message: "Welcome to ChatRoom" });
    socket.broadcast.to(roomId).emit("message", { message: `${userName} has joined` });

    const roomUsers = getUsers(roomId);
    io.to(roomId).emit("users", roomUsers);

    if (!roomData[roomId]) roomData[roomId] = { users: {} };
    const mergedElements = Object.values(roomData[roomId].users).flat();
    socket.emit("whiteboardData", mergedElements);
  });

  // NEW: Handle real-time pen movement
  socket.on("penMove", ({ roomId, x, y, color, tool }) => {
    const user = getUsers(roomId).find(u => u.id === socket.id);
    if (user) {
      // Broadcast to others in room (exclude sender)
      socket.broadcast.to(roomId).emit("penMove", {
        id: socket.id,
        username: user.username,
        x,
        y,
        color,
        tool
      });
    }
  }); 

  socket.on("drawing", ({ roomId, elements }) => {
    const user = getUsers(roomId).find(u => u.id === socket.id);
    if (user && Array.isArray(elements)) {
      if (!roomData[roomId]) roomData[roomId] = { users: {} };
      roomData[roomId].users[socket.id] = elements;
      const merged = Object.values(roomData[roomId].users).flat();
      socket.broadcast.to(roomId).emit("whiteboardData", merged);
    }
  });

  socket.on("clearCanvas", ({ roomId }) => {
    const user = getUsers(roomId).find(u => u.id === socket.id);
    if (user) {
      roomData[roomId] = { users: {} };
      socket.broadcast.to(roomId).emit("canvasCleared");
    }
  });

  socket.on("disconnect", () => {
    const userLeaves = userLeave(socket.id);
    if (userLeaves) {
      const { room: roomId } = userLeaves;
      const roomUsers = getUsers(roomId);
      io.to(roomId).emit("message", { message: `${userLeaves.username} left the chat` });
      io.to(roomId).emit("users", roomUsers);
      if (roomData[roomId]?.users) {
        delete roomData[roomId].users[socket.id];
        if (roomUsers.length === 0) delete roomData[roomId];
      }
    }
  });
});

let roomData = {};  // Moved outside io.on for persistence

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server listening on port ${PORT}`));