/**
 * @fileoverview The server of this web app. Made with express.js.
 * For development environments.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Import debugger and configurations.
const config = require("./config");
const debug = require("./Lib/common/debug");
debug("Starting colonialwars app!");
process.env.NODE_ENV = config.environment;

// Check if express is installed.
let express = null;
try {
  express = require("express");
} catch (err) {
  throw new Error(
    "\u001b[31mTo run this project as a standalone, you " +
    "must have express installed.\u001b[39m."
  );
}

// Dependencies.
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const socketIO = require("socket.io");

// Custom modules.
const router = require("./Lib/router");
const middleware = require("./Lib/middleware");
const init = require("./Lib/common/init");
const util = require("./Lib/common/util");
const Constants = require("./Lib/common/constants");

// Variables.
const PROTOCOL = config.httpsConfig.isHttps ? "https" : "http";
const PORT = config.serverConfig.port || (PROTOCOL === "http" ? 8000 : 4430);
const HOST = config.serverConfig.host || "localhost";
// Keep an array of intervals so we could stop them later.
const intervals = [];
// Keep an array of existing Socket.IO connections, so that
// we could close them when needed.
/**
 * @type {Array<socketIO.Socket>}
 */
const connections = [];

// Initialization.
const cookieSecret = init.cookieSecret;
const manager = init.manager;

const ServerLogger = init.winstonLoggers.get("Server-logger");

ServerLogger.info("Imports done, starting server.");
debug("Done imports, starting server.");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  maxHttpBufferSize: 1000 * 1000
});
const playIO = io.of("/play");

// Disable "X-Powered-By" for security.
app.disable("x-powered-by");

// Express middleware functions.
app.use(cookieParser(cookieSecret));
app.use(init.helmetFunctions);
app.use(express.json({
  inflate: true,
  limit: "40kb",
  type: ["application/json", "application/csp-report"]
}));
app.use(middleware.sysCheckpoint(Constants.SEC_ALLOWED_METHODS));
app.use(middleware.requestCheckpoint());
// FIXME: Adjust allowed MIME types in the `Accept` header.
// We don't just send HTML and text files!
app.use(middleware.acceptCheckpoint({
  ignoreAcceptMismatch: false,
  type: ["text/html", "text/plain"],
  lang: ["en"],
  charset: ["utf-8"],
  encoding: ["identity"]
}));

// Static assets.
app.use("/shared", express.static(
  path.join(__dirname, "Shared"),
  Constants.EXPRESS_STATIC_OPTS
));
app.use("/JS", express.static(
  path.join(__dirname, "Public/JS"),
  Constants.EXPRESS_STATIC_OPTS
));
app.use("/CSS", express.static(
  path.join(__dirname, "Public/CSS"),
  Constants.EXPRESS_STATIC_OPTS
));
app.use("/imgs", express.static(
  path.join(__dirname, "Public/Images"),
  Constants.EXPRESS_STATIC_OPTS
));
// Actual routing to HTML pages and such.
app.use("/", router);
// TODO: Add a custom error handler for express.

// Root Socket.IO namespace.
io.use(middleware.acceptNewSocket(cookieSecret));
io.on("connection", socket => {
  const socketAuth = socket.auth;
  connections.push(socket);
  debug("Connection!", socket.id);
  socket.on(Constants.SOCKET_NEW_PLAYER, async(data, cb) => {
    try {
      // A player wants to join a game, so try to parse
      // the data sent.
      const playData = JSON.parse(data).playerData;
      const gameToJoin = manager.getGame(playData.game);

      if (!gameToJoin) {
        cb("Selected game does not exist.");
      } else if (!socketAuth) {
        cb("Not authorized.");
      } else {
        await init.wsSessions.set(
          socketAuth.validationData.utk,
          {
            sessionData: {
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
          }
        );
        cb(null);
      }
    } catch (err) {
      ServerLogger.error(err);

      // Intentionally be vague with the error message.
      cb("Something went wrong. Please try again later.");
    }
  });
  socket.on(Constants.SOCKET_DISCONNECT, () => {
    debug("Client Disconnected!", socket.id);
    util.removeFromArray(connections, socket);
    clearInterval(socket.touchInterval);
  });
});

// Play namespace, where game-related stuff happens.
playIO.use(middleware.checkSocket(cookieSecret));
playIO.on("connection", socket => {
  // Keep the game ID for later. We'll need it.
  const gameID = socket.gameID;
  const socketAuth = socket.auth;
  connections.push(socket);
  debug("Connection /play!", socket.id);
  socket.on(Constants.SOCKET_PLAYER_ACTION, data => {
    const parsedData = JSON.parse(data);
    const game = manager.getGame(gameID);
    game.updatePlayerOnInput(socket.id, parsedData.playerData.actionData);
  });
  socket.on(Constants.SOCKET_DISCONNECT, () => {
    debug("Client Disconnected /play!", socket.id);
    manager.removeClientFromGame(gameID, socket);
    init.wsSessions.get(socketAuth.validationData.utk)
      .then(async session => {
        if (typeof session === "boolean" && !session) {
          // Hmm... I'm actually not sure what to do here. How
          // did the client get a Socket.IO connection anyways?
          return;
        }
        session.sessionData = Object.assign(
          session.sessionData, {
            joinedGame: false,
            playData: {}
          }
        );
        await init.wsSessions.set(
          socketAuth.validationData.utk, session
        );
      })
      .catch(err => {
        ServerLogger.error(err);
      });
    util.removeFromArray(connections, socket);
    clearInterval(socket.touchInterval);
  });
});

// Start the server, with a backlog of 20.
server.listen(PORT, HOST, 20, err => {
  if (err) {
    // TODO: Check if this is correct.
    // Currently we throw the error so that we could let
    // our `process.on("uncaughtException")` handler handle it.
    throw err;
  }
  ServerLogger.info(
    `Server started successfully on ${PROTOCOL}://${HOST}:${PORT}.`
  );
  debug(`Server started on ${PROTOCOL}://${HOST}:${PORT}.`);
  debug(`Protocol is: ${PROTOCOL}.`);
});

// Start the update loop.
const updateLoop = setInterval(() => {
  manager.update();
  manager.sendState();
}, Constants.GAME_UPDATE_SPEED);

intervals.push(updateLoop);

// TODO: Refactor the server shutdown code to another
// function. It will be easier to maintain that way.
process.on("SIGINT", signal => {
  // Clear intervals and connections so we could shutdown properly.
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
  // TODO: Also move this to another file.
  server.close(err => {
    if (err) {
      throw err;
    }
    io.close(() => {
      debug("Server shutdown complete. Exiting...");
      ServerLogger.info(
        "Server shutdown complete. Exiting..."
      );
      // Allow the async functions to finish.
      setTimeout(() => {
        // eslint-disable-next-line no-process-exit
        process.exit(0);
      }, 1000);
    });
  });
});
// Handle the "uncaughtException" event as a last resort.
process.on("uncaughtException", err => {
  // TODO: Refactor this as specified above.
  // Clear intervals and connections so we could shutdown properly.
  intervals.forEach(interval => {
    clearInterval(interval);
  });
  connections.forEach(socket => {
    socket.disconnect(true);
  });
  // We use a fatal log level because we couldn't recover from
  // the uncaught exception (at least not likely).
  ServerLogger.fatal("Server crashed. Error is:");
  ServerLogger.fatal(err.stack);
  ServerLogger.fatal("Exiting...");
  debug(`Is server listening? ${server.listening}`);
  debug("Server crashed. Error is:");
  debug(err.stack);
  debug("Exiting...");
  // Allow the async functions to finish.
  setTimeout(() => {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }, 1000);
});
