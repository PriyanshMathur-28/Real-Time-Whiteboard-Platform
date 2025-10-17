const express = require("express");
const http = require("http");
const cors = require("cors");
const { userJoin, getUsers, userLeave } = require("./utils/user");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/", (req, res) => {
  res.send("server");
});

let roomData = {};

io.on("connection", (socket) => {
  socket.on("user-joined", (data) => {
    const { roomId, userName, host, presenter } = data;
    const user = userJoin(socket.id, userName, roomId, host, presenter);
    socket.join(roomId);

    socket.emit("message", { message: "Welcome to ChatRoom" });
    socket.broadcast.to(roomId).emit("message", {
      message: `${userName} has joined`,
    });

    const roomUsers = getUsers(roomId); // FIXED: Pass roomId
    io.to(roomId).emit("users", roomUsers);

    if (!roomData[roomId]) {
      roomData[roomId] = { users: {} };
    }

    const mergedElements = Object.values(roomData[roomId].users).flat();
    socket.emit("whiteboardData", mergedElements);
  });

  socket.on("drawing", ({ roomId, elements }) => { // FIXED: Proper structure
    const user = getUsers(roomId).find(u => u.id === socket.id);
    if (user && Array.isArray(elements)) { // FIXED: Validation
      if (!roomData[roomId]) {
        roomData[roomId] = { users: {} };
      }
      roomData[roomId].users[socket.id] = elements;

      const merged = Object.values(roomData[roomId].users).flat();
      socket.broadcast.to(roomId).emit("whiteboardData", merged);
    }
  });

  socket.on("clearCanvas", ({ roomId }) => { // FIXED: Get roomId
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
      
      io.to(roomId).emit("message", {
        message: `${userLeaves.username} left the chat`,
      });
      io.to(roomId).emit("users", roomUsers);

      if (roomData[roomId]?.users) {
        delete roomData[roomId].users[socket.id];
        if (roomUsers.length === 0) {
          delete roomData[roomId];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`server is listening on http://localhost:${PORT}`)
);