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

const lobbies = {}; // Object to hold lobbies and their players

io.on("connection", (socket) => {
  console.log(lobbies);
  console.log("A user connected:", socket.id);

  // Create a lobby
  socket.on("createLobby", (lobbyName, name) => {
    if (!lobbies[lobbyName]) {
      lobbies[lobbyName] = { players: [], creator: socket.id };
      socket.join(lobbyName);
      lobbies[lobbyName].players.push({ id: socket.id, name });
      console.log(`Lobby ${lobbyName} created by ${name}.`);
      io.to(socket.id).emit("lobbyCreated", lobbyName);
      playerName = name;
    } else {
      socket.emit("error", "Lobby name already exists.");
    }
  });

  // Join a lobby
  socket.on("joinLobby", (lobbyName) => {
    if (lobbies[lobbyName]) {
      socket.join(lobbyName);
      lobbies[lobbyName].players.push(socket.id);
      console.log(`User ${socket.id} joined lobby ${lobbyName}.`);
      io.to(socket.id).emit("lobbyJoined", lobbyName);
    } else {
      socket.emit("error", "Lobby does not exist");
    }
  });

  // Handle messages
  socket.on("sendMessage", ({ lobbyName, message }) => {
    const username = lobbies[lobbyName]?.players.find(
      (player) => player.id === socket.id
    )?.username;

    if (!lobbies[lobbyName]) {
      socket.emit("error", "Lobby does not exist.");
      return;
    }

    if (!username) {
      socket.emit("error", "Username not found.");
      return;
    }

    // Broadcast the message to the lobby
    io.to(lobbyName).emit("receiveMessage", { username, message });
    console.log(`[${lobbyName}] ${username}: ${message}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected.`);
    for (const [lobbyName, lobby] of Object.entries(lobbies)) {
      if (lobby.players.includes(socket.id)) {
        // Remove the player from the lobby
        lobby.players = lobby.players.filter((player) => player !== socket.id);

        // If the creator disconnects, notify all players and delete the lobby
        if (lobby.creator === socket.id) {
          io.to(lobbyName).emit(
            "creatorDisconnected",
            "Lobby creator has left"
          );
          lobby.players.forEach((player) => {
            io.to(player).emit("returnToSelection");
          });
          delete lobbies[lobbyName];
          socket.emit(
            "error",
            `Lobby ${lobbyName} deleted as creator disconnected.`
          );
        } else {
          // Notify remaining players about lobby update
          io.to(lobbyName).emit("lobbyUpdate", lobby.players);
        }
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
