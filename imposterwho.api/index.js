const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const lobbyContent = {};

function generateLobbyCode() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on("connection", (socket) => {
  console.log(lobbyContent);
  console.log("User Joined:", socket.id);

  socket.on("createLobby", (name) => {
    let lobbyCode;

    do {
      lobbyCode = generateLobbyCode();
    } while (lobbyContent[lobbyCode]);

    lobbyContent[lobbyCode] = {
      lobbyCode: lobbyCode,
      lobbyFounder: name,
      players: [name],
    };

    socket.emit("lobbyCreated", {
      lobbyCode: lobbyCode,
      lobbyFounder: name,
    });

    console.log(`Lobby created: ${lobbyCode}`);
    console.log(lobbyContent);
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
