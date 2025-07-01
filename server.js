const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 8080;

app.use(express.static("public"));

const roomPlayers = {};
const MAX_PLAYERS = 4; // 💡 You can change this limit

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // CREATE ROOM
  socket.on("create-room", (roomCode) => {
    if (roomPlayers[roomCode]) {
      // 🚫 Room already exists (duplicate)
      socket.emit("room-exists");
      return;
    }

    socket.join(roomCode);
    console.log(`🟢 Room ${roomCode} created by ${socket.id}`);

    roomPlayers[roomCode] = [socket.id];

    // ✅ Notify client room is ready
    socket.emit("room-created");
  });

  // JOIN ROOM
  socket.on("join-room", (roomCode) => {
    const room = roomPlayers[roomCode];

    if (!room) {
      socket.emit("room-error", "Room does not exist.");
      return;
    }

    if (room.length >= MAX_PLAYERS) {
      socket.emit("room-error", "Room is full.");
      return;
    }

    socket.join(roomCode);
    if (!room.includes(socket.id)) {
      room.push(socket.id);
    }

    console.log(`🔵 ${socket.id} joined room ${roomCode}`);
    io.to(roomCode).emit("player-joined", socket.id);
  });

  // REJOIN (used on lobby load)
  socket.on("rejoin-room", (roomCode) => {
    socket.join(roomCode);

    if (!roomPlayers[roomCode]) roomPlayers[roomCode] = [];
    if (!roomPlayers[roomCode].includes(socket.id)) {
      roomPlayers[roomCode].push(socket.id);
    }

    const hostId = roomPlayers[roomCode][0];
    io.to(roomCode).emit("player-list", roomPlayers[roomCode], hostId);
  });

  // START GAME
  socket.on("start-game", (roomCode) => {
    console.log(`🟡 Game starting in room: ${roomCode}`);
    io.to(roomCode).emit("game-started");
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);

    for (const room in roomPlayers) {
      roomPlayers[room] = roomPlayers[room].filter(id => id !== socket.id);

      // Clean up room if empty
      if (roomPlayers[room].length === 0) {
        delete roomPlayers[room];
        console.log(`🧹 Deleted empty room: ${room}`);
      } else {
        const hostId = roomPlayers[room][0];
        io.to(room).emit("player-list", roomPlayers[room], hostId);
      }
    }
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
