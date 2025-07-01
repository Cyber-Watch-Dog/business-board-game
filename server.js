const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("create-room", (roomCode) => {
    socket.join(roomCode);
    console.log(`🟢 Room ${roomCode} created by ${socket.id}`);
  });

socket.on("join-room", (roomCode) => {
  const rooms = io.sockets.adapter.rooms;
  if (rooms.get(roomCode)) {
    socket.join(roomCode);
    console.log(`🔵 ${socket.id} joined room ${roomCode}`);
    io.to(roomCode).emit("player-joined", socket.id);
  } else {
    socket.emit("room-error");
  }
});

http.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
