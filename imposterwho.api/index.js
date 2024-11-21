const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:4200", methods: ["GET", "POST"] }));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const lobbyContent = {};

function generateLobbyCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on("connection", (socket) => {
  console.log(lobbyContent);
  console.log("User Joined:", socket.id);
  socket.on("createLobby", (username) => {
    username = username.trim();
    if (username == null || username == "") {
      let error = "An unknown error has occurred.";
      socket.emit("onSendError", error);
      return;
    } else {
      console.log("Starting lobby");
      socket.emit("onLobbyCreated", generateLobbyCode());
    }
  });

  socket.on("disconnect", () => {
    console.log(`A user disconnected: ${socket.id}`);
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
