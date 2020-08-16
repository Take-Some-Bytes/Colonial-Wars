/**
 * @fileoverview The server of this web app. Made with express.js
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Import debugger and configurations
const config = require("./config");
const debug = require("./Lib/common/debug");
debug("Starting colonialwars app!");

// Check if express is installed
let express = null;
try {
  express = require("express");
} catch (err) {
  throw new Error(
    "\u001b[31mTo run this project as a standalone, you " +
    "must have express installed.\u001b[39m."
  );
}

// Dependencies
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const socketIO = require("socket.io");

// Variables
const PROTOCOL = config.httpsConfig.isHttps ? "https" : "http";
const PORT = config.serverConfig.port || (PROTOCOL === "http" ? 8000 : 4430);
const HOST = config.serverConfig.host || "localhost";
const pendingClients = {};
const intervals = [];
const connections = [];

process.env.NODE_ENV = config.environment;

// Custom modules
const router = require("./Lib/router");
const middleware = require("./Lib/middleware");
const init = require("./Lib/common/init");
const Constants = require("./Lib/common/constants");
const { logMemoryUsage } = require("./Lib/common/util");

// Initialization
const serverToken = init.serverToken;
const wsSessions = init.sessionStorages.wsSessions;
const cookieSecret = init.cookieSecret;
const manager = init.manager;

const ServerLogger = init.winstonLoggers.get("Server-logger");

ServerLogger.info("Imports done, starting server.");
debug("Done imports, starting server.");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const playIO = io.of("/play");

// Settings
app.disable("x-powered-by");

// Middleware
app.use(cookieParser(cookieSecret));
app.use(init.helmetFunctions);
app.use(express.json({
  inflate: true,
  limit: "40kb",
  type: ["application/json", "application/csp-report"]
}));
app.use(middleware.sysCheckpoint(Constants.SEC_ALLOWED_METHODS));
app.use(middleware.requestCheckpoint());
app.use(middleware.acceptCheckpoint({
  ignoreAcceptMismatch: false,
  type: ["text/html", "text/plain"],
  lang: ["en"],
  charset: ["utf-8"],
  encoding: ["identity"]
}));

// Static stuff
app.use("/dist", express.static(path.join(__dirname, "dist")));
app.use("/shared", express.static(path.join(__dirname, "Shared")));
app.use("/JS", express.static(path.join(__dirname, "Public/JS")));
app.use("/CSS", express.static(path.join(__dirname, "Public/CSS")));
app.use("/imgs", express.static(path.join(__dirname, "Public/Images")));
// Actual routing
app.use("/", router);

// Socket.io stuff
io.use(middleware.socketNewClientCP(wsSessions, serverToken));
io.use((socket, next) => {
  const clientSession = wsSessions.getSessionInfo(socket.id);
  manager.addNewClient(socket, clientSession);
  next();
});
io.on("connection", socket => {
  connections.push(socket);
  debug("Connection!", socket.id);
  socket.on(Constants.SOCKET_NEW_PLAYER, (data, cb) => {
    let err = null;
    try {
      const playData = JSON.parse(data).playerData;
      const gameToJoin = manager.getGame(playData.game);

      if (!gameToJoin) {
        err = new Error("Game does not exist.");
        ServerLogger.error(err);

        cb("Selected game does not exist.");
      } else {
        pendingClients[socket.id] = {
          clientName: playData.name,
          gameID: playData.game,
          clientTeam: playData.team
        };

        cb(null);
      }
    } catch (error) {
      err = error;
      ServerLogger.error(err);

      cb("Something went wrong. Please try again later.");
    }
  });
  socket.on(Constants.SOCKET_DISCONNECT, () => {
    debug("Client Disconnected!", socket.id);
    if (!pendingClients[socket.id]) {
      const client = manager.getClient(socket.id);
      const session = wsSessions.getSessionInfo(socket.id);
      if (client && session) {
        manager.removeClient(socket.id);
        try {
          wsSessions.deleteSession(socket.id);
        } catch (err) {
          ServerLogger.error(err);
        }
      }
    }
  });
});

playIO.use(middleware.nspCheckPoint(wsSessions, manager));
playIO.use(middleware.nspCheckIsPending(pendingClients));
playIO.use(middleware.nspChangeStats(wsSessions, manager));
playIO.use((socket, next) => {
  const session = wsSessions.getSessionInfo(socket.id);
  socket.emit(Constants.SOCKET_SECURITY_DATA, JSON.stringify({
    securityData: {
      serverToken: serverToken,
      clientData: {
        token: session.token,
        id: session.clientID
      }
    },
    playerData: {},
    otherData: {
      status: "success"
    }
  }));
  const prevSocketID = socket.handshake.query.prevSocketID;
  const pending = pendingClients[prevSocketID];
  if (!pending) {
    next(new Error("Client does not exist."));
    return;
  }
  try {
    manager.addClientToGame(
      pending.gameID,
      socket,
      pending.clientName,
      pending.clientTeam,
      pending.screen_size
    );
  } catch (err) {
    next(new Error(err));
  }
  const game = manager.getGame(pending.gameID);
  socket.emit(Constants.SOCKET_PROCEED, JSON.stringify({
    securityData: {
      serverToken: serverToken,
      gameToken: game.token
    },
    playerData: {
      gameID: pending.gameID,
      gameMap: game.mapName
    },
    otherData: {
      status: "success"
    }
  }));
  next();
});
playIO.on("connection", socket => {
  connections.push(socket);
  const pending = pendingClients[socket.handshake.query.prevSocketID];
  const gameID = pendingClients[socket.handshake.query.prevSocketID].gameID;
  delete pendingClients[socket.handshake.query.prevSocketID];
  debug("Connection!", socket.id);
  logMemoryUsage();
  socket.on(Constants.SOCKET_PLAYER_ACTION, data => {
    const parsedData = JSON.parse(data);
    const game = manager.getGame(gameID);
    game.updatePlayerOnInput(socket.id, parsedData.playerData.actionData);
  });
  socket.on(Constants.SOCKET_DISCONNECT, reason => {
    debug("Client disconnected!", socket.id);
    if (reason !== "server namespace disconnect") {
      const client = manager.getClient(socket.id);
      const session = wsSessions.getSessionInfo(socket.id);
      if (client && session) {
        manager.removeClient(socket.id);
        try {
          wsSessions.deleteSession(socket.id);
        } catch (err) {
          ServerLogger.error(err);
        }
      }
      manager.removeClientFromGame(gameID, socket);
    } else {
      pendingClients[socket.handshake.query.prevSocketID] = pending;
      manager.removeClientFromGame(gameID, socket);
    }
  });
});

server.listen(PORT, HOST, 20, err => {
  if (err) {
    ServerLogger.fatal("Failed to start server. Error is:");
    ServerLogger.fatal(err);
    debug("Failed to start server. Error is: ");
    debug(err);
    // Allow the async functions to finish
    setTimeout(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }, 600);
  }
  ServerLogger.info(
    `Server started successfully on ${PROTOCOL}://${HOST}:${PORT}.`
  );
  debug(`Server started on ${PROTOCOL}://${HOST}:${PORT}.`);
  debug(`Protocol is: ${PROTOCOL}.`);
  logMemoryUsage();
});
server.on("error", err => {
  throw err;
});

const sessionInterval = setInterval(() => {
  // Refresh ws sessions
  wsSessions.refreshAll();
  wsSessions.forEach((session, ID) => {
    manager.getClient(ID).socket.emit(
      Constants.SOCKET_SECURITY_DATA, JSON.stringify({
        securityData: {
          serverToken: serverToken,
          clientData: {
            token: session.token,
            id: session.id
          }
        },
        playerData: {},
        otherData: {
          status: "success"
        }
      }));
  });
}, 8 * 60 * 1000);

const updateLoop = setInterval(() => {
  manager.update();
  manager.sendState();
}, Constants.GAME_UPDATE_SPEED);

intervals.push(sessionInterval, updateLoop);

process.on("SIGINT", signal => {
  // Let us know that the user terminated the process
  intervals.forEach(interval => {
    clearInterval(interval);
  });
  connections.forEach(socket => {
    socket.disconnect(true);
  });
  debug(`Received signal ${signal}. Shutting down server...`);
  ServerLogger.info(
    `Received signal ${signal} from user. Shutting down server...`
  );
  server.close(() => io.close(() => {
    debug("Server shutdown complete. Exiting...");
    ServerLogger.info(
      "Server shutdown complete. Exiting..."
    );
    // Allow the async functions to finish
    setTimeout(() => {
    // eslint-disable-next-line no-process-exit
      process.exit(0);
    }, 1000);
  }));
});
process.on("uncaughtException", err => {
  intervals.forEach(interval => {
    clearInterval(interval);
  });
  connections.forEach(socket => {
    socket.disconnect(true);
  });
  ServerLogger.fatal("Server crashed. Error is:");
  ServerLogger.fatal(err.stack);
  ServerLogger.fatal("Exiting...");
  debug("Server crashed. Error is:");
  debug(err);
  debug("Exiting...");
  // Allow the async functions to finish
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1000);
});
