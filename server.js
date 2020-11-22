/**
 * @fileoverview The server of this web app. Made with express.js.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Import debugger and configurations.
const config = require("./config");
const debug = require("./Lib/common/debug");
debug("Initializing Colonial Wars web application.");
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
const socketIO = require("socket.io");
const cookieParser = require("cookie-parser");

// Custom modules.
const router = require("./Lib/router");
const init = require("./Lib/common/init");
const middleware = require("./Lib/middleware");
const Constants = require("./Lib/common/constants");
const { shutDown, handleError } = require("./Lib/common/common");
const {
  mainNspController, playNspController
} = require("./Lib/controllers/socket-io-controllers");

// Variables.
const PROTOCOL = "http";
const PORT = config.serverConfig.port || 8000;
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

ServerLogger.info(
  "All modules have been loaded; starting Express and Socket.IO servers."
);

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  // Only 40KB of data is allowed to be received at any time.
  maxHttpBufferSize: 1024 * 40
});
const playIO = io.of("/play");

debug("Server instances created.");
// Disable "X-Powered-By" HTTP header for security.
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
debug("Express middleware and handlers have been mounted.");

// Root Socket.IO namespace.
io.use(middleware.acceptNewSocket(cookieSecret));
io.on("connection", mainNspController(connections));

// Play namespace, where game-related stuff happens.
playIO.use(middleware.checkSocket(cookieSecret));
playIO.on("connection", playNspController(connections));

// Start the server, with a backlog of 20.
server.listen(PORT, HOST, 20, err => {
  if (err) {
    debug(
      "Error while trying to start server on " +
      `port ${PORT}, protocol ${PROTOCOL}, and host ${HOST}.`
    );
    throw err;
  }
  ServerLogger.info(
    `Server running on ${PROTOCOL}://${HOST}:${PORT}.`
  );
});

// Start the update loop.
const updateLoop = setInterval(() => {
  manager.update();
  manager.sendState();
}, Constants.GAME_UPDATE_SPEED);

intervals.push(updateLoop);

// Handle SIGINT and SIGTERM--the server will shut down gracefully
// if any of those signals are received.
process.on("SIGINT", shutDown(intervals, connections, io));
process.on("SIGTERM", shutDown(intervals, connections, io));
// Handle the "uncaughtException" and
// "unhandledRejection" event as a last resort.
process.on("uncaughtException", handleError(intervals, connections, io));
process.on("unhandledRejection", handleError(intervals, connections, io));
