/**
 * @fileoverview The server of this web app. Made with express.js.
 * For development environments. In production, ideally, you should use
 * server-prod.js, and use a reverse proxy.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Import debugger and configurations
const config = require("./config");
const debug = require("./Lib/common/debug");
debug("Starting colonialwars app!");
process.env.NODE_ENV = config.environment;

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

// Custom modules
const router = require("./Lib/router");
const middleware = require("./Lib/middleware");
const init = require("./Lib/common/init");
const Constants = require("./Lib/common/constants");
const { logMemoryUsage } = require("./Lib/common/util");

// Variables
const PROTOCOL = config.httpsConfig.isHttps ? "https" : "http";
const PORT = config.serverConfig.port || (PROTOCOL === "http" ? 8000 : 4430);
const HOST = config.serverConfig.host || "localhost";
const pendingClients = init.pendingClients;
const intervals = [];
/**
 * @type {Array<socketIO.Socket>}
 */
const connections = [];

// Initialization
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
io.use(middleware.acceptNewSocket(cookieSecret, pendingClients));
io.on("connection", socket => {
  connections.push(socket);
  debug("Connection!", socket.id);
  socket.on(Constants.SOCKET_NEW_PLAYER, (data, cb) => {
    let err = null;
    try {
      const playData = JSON.parse(data).playerData;
      const gameToJoin = manager.getGame(playData.game);
      const socketAuth = socket.auth;

      if (!gameToJoin) {
        cb("Selected game does not exist.");
      } else if (!socketAuth) {
        cb("Not authorized.");
      } else {
        init.pendingClients.set(
          socketAuth.validationData.utk,
          {
            connected: true,
            joinedGame: true,
            playData: {
              clientName: playData.name,
              clientTeam: playData.team,
              gameID: playData.game
            },
            validationData: {
              utk: socketAuth.validationData.utk,
              passPhrase: socketAuth.validationData.passPhrase
            }
          }
        );
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
  });
});

playIO.use(middleware.checkSocket(cookieSecret, pendingClients));
playIO.on("connection", socket => {
  connections.push(socket);
  const gameID = socket.gameID;
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
      manager.removeClientFromGame(gameID, socket);
    }
  });
});

server.listen(PORT, HOST, 20, err => {
  if (err) {
    throw err;
  }
  ServerLogger.info(
    `Server started successfully on ${PROTOCOL}://${HOST}:${PORT}.`
  );
  debug(`Server started on ${PROTOCOL}://${HOST}:${PORT}.`);
  debug(`Protocol is: ${PROTOCOL}.`);
  debug(`Is server listening? ${server.listening}`);
  logMemoryUsage();
});


const updateLoop = setInterval(() => {
  manager.update();
  manager.sendState();
}, Constants.GAME_UPDATE_SPEED);

intervals.push(updateLoop);

process.on("SIGINT", signal => {
  // Let us know that the user terminated the process
  intervals.forEach(interval => {
    clearInterval(interval);
  });
  connections.forEach(socket => {
    socket.disconnect(true);
  });
  debug(`Is server listening? ${server.listening}`);
  debug(`Received signal ${signal}. Shutting down server...`);
  ServerLogger.info(
    `Received signal ${signal} from user. Shutting down server...`
  );
  server.close(err => {
    if (err) {
      throw err;
    }
    io.close(() => {
      debug("Server shutdown complete. Exiting...");
      ServerLogger.info(
        "Server shutdown complete. Exiting..."
      );
      // Allow the async functions to finish
      setTimeout(() => {
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      }, 1000);
    });
  });
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
  debug(`Is server listening? ${server.listening}`);
  debug("Server crashed. Error is:");
  debug(err);
  debug("Exiting...");
  // Allow the async functions to finish
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1000);
});
