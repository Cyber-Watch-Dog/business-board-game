const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 8080;

app.use(express.static("public"));

// Track players in each room
const roomPlayers = {};

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // CREATE ROOM
  socket.on("create-room", (roomCode) => {
    socket.join(roomCode);
    console.log(`🟢 Room ${roomCode} created by ${socket.id}`);

    // Add host to player list
    if (!roomPlayers[roomCode]) roomPlayers[roomCode] = [];
    roomPlayers[roomCode].push(socket.id);
  });

  // JOIN ROOM
  socket.on("join-room", (roomCode) => {
    const rooms = io.sockets.adapter.rooms;
    if (rooms.get(roomCode)) {
      socket.join(roomCode);
      console.log(`🔵 ${socket.id} joined room ${roomCode}`);

      // Add new player
      if (!roomPlayers[roomCode]) roomPlayers[roomCode] = [];
      if (!roomPlayers[roomCode].includes(socket.id)) {
        roomPlayers[roomCode].push(socket.id);
      }

      io.to(roomCode).emit("player-joined", socket.id);
    } else {
      socket.emit("room-error");
    }
  });

  // REJOIN (for lobby.html)
  socket.on("rejoin-room", (roomCode) => {
    socket.join(roomCode);

    if (!roomPlayers[roomCode]) {
      roomPlayers[roomCode] = [];
    }
    if (!roomPlayers[roomCode].includes(socket.id)) {
      roomPlayers[roomCode].push(socket.id);
    }

    const hostId = roomPlayers[roomCode][0]; // first player = host
    io.to(roomCode).emit("player-list", roomPlayers[roomCode], hostId);
  });

  // START GAME
  socket.on("start-game", (roomCode) => {
    console.log(`🟡 Game starting in room: ${roomCode}`);
    io.to(roomCode).emit("game-started");
  });

  // HANDLE DISCONNECT
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    // Optional: clean up disconnected player from roomPlayers
    for (const room in roomPlayers) {
      roomPlayers[room] = roomPlayers[room].filter((id) => id !== socket.id);
      io.to(room).emit("player-list", roomPlayers[room], roomPlayers[room][0]);
    }
  });
});

http.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
