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
    game: {
      isActive: false,
      currentRound: 0,
      currentGame: 0,
      category: null,
      imposter: null,
      chosenPlayer: null,
      guesses: 0,
      maxGuesses: 3,
      votesUsed: 0,
      maxVotes: 3,
      voteData: {},
      dev: "",
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

// async function gameLoop(lobbyCode) {
//   const lobby = lobbyContent[lobbyCode];
//   const game = lobby.game;

//   while (game.isActive) {
//     console.log(`Starting round ${game.currentRound} in lobby ${lobbyCode}`);

//     // Step 1: Assign Roles
//     assignRoles(lobby);

//     // Step 2: Await Category Input
//     const category = await awaitCategoryInput(lobby);
//     if (!category) {
//       console.log("Game terminated: No category provided.");
//       endGame(lobbyCode, "Game ended as no category was chosen.");
//       return;
//     }

//     console.log(`Category chosen: ${category}`);

//     // Notify Players of the Round Details
//     io.to(lobbyCode).emit("onLobbyUpdated", lobbyCode, lobby);

//     // Step 3: Await Player Actions (Imposter guesses or players vote)
//     const result = await handlePlayerActions(lobby);
//     if (result) {
//       console.log("Game result:", result);
//       endGame(lobbyCode, result);
//       return;
//     }

//     // Step 4: Prepare for Next Round
//     game.currentRound++;
//   }
// }

io.on("connection", (socket) => {
  console.log("On Lobby Create: " + JSON.stringify(lobbyContent, null, 2));
  console.log("User Joined:", socket.id);

  socket.on("createLobby", (username) => {
    username = username.trim();
    if (username == null || username == "") {
      let error = "An unknown error has occurred.";
      socket.emit("onSendError", error);
      return;
    }
    if (Object.values(lobbyContent).some((lobby) => lobby.players[socket.id])) {
      socket.emit(
        "onSendError",
        "You are already part of a lobby. Leave your current lobby to create a new one. You may refresh to fully disconnect."
      );
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
        game: {
          isActive: false,
          currentRound: 1,
          currentGame: 1,
          category: null,
          imposter: null,
          chosenPlayer: null,
          guesses: 0,
          maxGuesses: 3,
          votesUsed: 0,
          maxVotes: 3,
          voteData: {},
        },
      };
      socket.join(lobbyCode);
      socket.emit("onLobbyCreated", lobbyCode);
      io.to(lobbyCode).emit(
        "onLobbyUpdated",
        lobbyCode,
        lobbyContent[lobbyCode]
      );
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
      io.to(lobbyCode).emit(
        "onLobbyUpdated",
        lobbyCode,
        lobbyContent[lobbyCode]
      );
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
        "Looks you ended up on the play screen by mistake or refreshed your browser. Remember refreshing your browser disconnects you from the game. Please rejoin the lobby, if you were the host this lobby has been closed. "
      );
    }
  });

  socket.on("startGame", async (lobbyCode) => {
    let lobby = lobbyContent[lobbyCode];

    if (!lobby) {
      socket.emit("onSendError", "Lobby not found.");
      return;
    }

    if (Object.keys(lobby.players).length < 3) {
      socket.emit("onSendError", "You need at least 3 players to start.");
      return;
    }

    lobby.game.isActive = true;
    lobby.game.currentRound = 1;

    // await gameLoop(lobbyCode);
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
          io.to(lobbyCode).emit(
            "onLobbyUpdated",
            lobbyCode,
            lobbyContent[lobbyCode]
          );
        }
        socket.leave(lobbyCode);
        break;
      }
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
