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

let lobbyContent = {
  aaa: {
    host: {
      socketId1: { name: "HostName" },
    },
    players: {
      socketId1: { name: "HostName" },
      socketId2: { name: "Player2" },
      socketId3: { name: "Player3" },
    },
  },
};

function generateLobbyCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on("connection", (socket) => {
  console.log("On Lobby Create: " + JSON.stringify(lobbyContent, null, 2));
  console.log("User Joined:", socket.id);

  socket.on("createLobby", (username) => {
    username = username.trim();
    if (username == null || username == "") {
      let error = "An unknown error has occurred.";
      socket.emit("onSendError", error);
      return;
    } else {
      let lobbyCode = generateLobbyCode();
      lobbyContent[lobbyCode] = {
        host: {
          [socket.id]: { name: username },
        },
        players: {
          [socket.id]: { name: username },
        },
      };
      socket.join(lobbyCode);
      socket.emit("onLobbyCreated", lobbyCode);
      console.log("On Lobby Create: " + JSON.stringify(lobbyContent, null, 2));
    }
  });

  socket.on("joinLobby", (username, lobbyCode) => {
    username = username.trim();
    lobbyCode = lobbyCode.trim().toUpperCase();
    if (username == null || username == "") {
      let error = "An unknown error has occurred.";
      socket.emit("onSendError", error);
      return;
    }
    if (lobbyCode == null || lobbyCode == "") {
      let error = "An unknown error has occurred.";
      socket.emit("onSendError", error);
      return;
    }
    let lobby = lobbyContent[lobbyCode];
    if (!lobby) {
      socket.emit("onSendError", "Lobby not found.");
      return;
    }
    let isUsernameTaken = Object.values(lobby.players).some(
      (player) => player.name === username
    );
    if (isUsernameTaken) {
      socket.emit("onSendError", "Username already taken in this lobby.");
      return;
    }
    if (lobby.players[socket.id]) {
      socket.emit("onSendError", "You are already in this lobby.");
      return;
    } else {
      lobby.players[socket.id] = { name: username };
      socket.join(lobbyCode);
      socket.emit("onLobbyJoined", lobbyCode);
      console.log("On Lobby Join: " + JSON.stringify(lobbyContent, null, 2));
    }
  });

  socket.on("checkPlayerStatus", () => {
    let found = false;

    for (const [lobbyCode, lobby] of Object.entries(lobbyContent)) {
      if (lobby.players[socket.id]) {
        found = true;
        socket.emit("playerStatus", {
          status: "found",
          username: lobby.players[socket.id].name,
          lobbyCode: lobbyCode,
        });
        break;
      }
    }

    if (!found) {
      socket.emit(
        "onSendError",
        "Looks you ended up on the play screen by mistake. Please join a lobby first. "
      );
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const [lobbyCode, lobby] of Object.entries(lobbyContent)) {
      if (lobby.players[socket.id]) {
        delete lobby.players[socket.id];
        console.log(`Player ${socket.id} removed from lobby ${lobbyCode}`);
        if (lobby.host[socket.id]) {
          delete lobbyContent[lobbyCode];
          io.to(lobbyCode).emit(
            "onLobbyClosed",
            "The host has left the lobby."
          );
          console.log(`Lobby ${lobbyCode} closed.`);
        } else {
          io.to(lobbyCode).emit("onPlayerLeft", {
            lobbyCode,
            players: lobby.players,
          });
        }
        socket.leave(lobbyCode);
        break;
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
