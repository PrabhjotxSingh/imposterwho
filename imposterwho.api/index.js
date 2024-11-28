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

let randomCategory = [
  "apple",
  "chandelier",
  "mountain",
  "laptop",
  "pizza",
  "dragon",
  "book",
  "teddy bear",
  "ice cream",
  "galaxy",
  "pencil",
  "waterfall",
  "robot",
  "chocolate bar",
  "backpack",
  "bicycle",
  "keyboard",
  "beach ball",
  "spaceship",
  "sweater",
  "candle",
  "roller coaster",
  "hamburger",
  "sunflower",
  "cloud",
  "paintbrush",
  "toaster",
  "camera",
  "suitcase",
  "banana",
  "rainbow",
  "sushi",
  "microscope",
  "treasure chest",
  "mug",
  "volcano",
  "soccer ball",
  "ukulele",
  "whale",
  "popcorn",
  "snowman",
  "owl",
  "lightbulb",
  "fireworks",
  "skateboard",
  "castle",
  "map",
  "shoes",
  "rocket",
  "scarf",
  "pineapple",
  "hot air balloon",
  "watermelon",
  "mountain bike",
  "train",
  "cookie",
  "penguin",
  "bottle",
  "jellyfish",
  "notebook",
  "garden",
  "headphones",
  "cupcake",
  "guitar",
  "sunset",
  "mirror",
  "donut",
  "parrot",
  "cactus",
  "fountain",
  "slippers",
  "puzzle",
  "clock",
  "sunglasses",
  "umbrella",
  "scooter",
  "tent",
  "basketball",
  "binoculars",
  "vase",
  "igloo",
  "kite",
  "roller skates",
  "trumpet",
  "snowflake",
  "zebra",
  "ferris wheel",
];

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
      allPrepDone: false,
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

io.on("connection", (socket) => {
  function waitForActionToComplete(conditionFn, timeoutMs) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (conditionFn()) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve(); // Action completed
        }
      }, 100); // Check every 100ms

      const timeout = setTimeout(() => {
        clearInterval(interval);
        resolve(); // Timeout reached
      }, timeoutMs);
    });
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function gameLoop(lobbyCode) {
    const lobby = lobbyContent[lobbyCode];
    const game = lobby.game;

    while (game.isActive) {
      console.log(`Starting round ${game.currentRound} in lobby ${lobbyCode}`);

      let fallbackCategory =
        randomCategory[Math.floor(Math.random() * randomCategory.length)];

      // Reset per-round data
      game.category = null;
      game.imposter = null;
      game.chosenPlayer = null;
      game.allPrepDone = false;
      game.guesses = 0;
      game.maxGuesses = 3;
      game.votesUsed = 0;
      game.maxVotes = 3;
      game.voteData = {};
      game.dev = "";

      // Step 1: Assign Roles
      assignRoles(lobby);

      // Notify Players of the Round Details
      io.to(lobbyCode).emit("onLobbyUpdated", lobbyCode, lobby);

      //Waiting for Category Submission Here
      await waitForActionToComplete(() => game.allPrepDone, 30000);

      if (game.category == null || game.category == "") {
        game.category = fallbackCategory;
      }

      io.to(lobbyCode).emit("onLobbyUpdated", lobbyCode, lobby);

      await delay(5000);
      // // Step 4: Prepare for Next Round
      game.currentRound++;
      console.log("next");
    }
  }

  function assignRoles(lobby) {
    const playerIds = Object.keys(lobby.players);
    const game = lobby.game;

    game.imposter = playerIds[Math.floor(Math.random() * playerIds.length)];

    let chosenPlayer;
    do {
      chosenPlayer = playerIds[Math.floor(Math.random() * playerIds.length)];
    } while (chosenPlayer === game.imposter);

    game.chosenPlayer = chosenPlayer;

    console.log(
      `Roles assigned: Imposter - ${game.imposter}, Chosen Player - ${game.chosenPlayer}`
    );
  }

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
          allPrepDone: false,
          guesses: 0,
          maxGuesses: 3,
          votesUsed: 0,
          maxVotes: 3,
          voteData: {},
          dev: "",
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

  socket.on("startGame", (lobbyCode) => {
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

    io.to(lobbyCode).emit("onLobbyUpdated", lobbyCode, lobbyContent[lobbyCode]);

    gameLoop(lobbyCode);
  });

  socket.on("submitCategory", (value, lobbyCode) => {
    if (!lobbyContent[lobbyCode]) {
      return;
    }
    const game = lobbyContent[lobbyCode].game;

    game.category =
      value ||
      randomCategory[Math.floor(Math.random() * randomCategory.length)];

    game.allPrepDone = true;

    io.to(lobbyCode).emit("onLobbyUpdated", lobbyCode, lobbyContent[lobbyCode]);
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
