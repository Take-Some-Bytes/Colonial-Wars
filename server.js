/**
 * @fileoverview The server of this web app. Made with express.js
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Dependencies
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const crypto = require("crypto");

//Variables
const PROTOCOL = "http";
const PORT = PROTOCOL === "http" ? 80 : 443;
const HOST = "localhost";

//Custom modules
const router = require("./Lib/Router");
const loggers = require("./Lib/Common/init");
const manager = loggers.manager;
const ErrorLogger = loggers.get("Error-logger");
const SessionStorage = require("./Lib/Security/SessionStorage");
const middleware = require("./Lib/middleware");
const Constants = require("./Lib/Constants");
const { logMemoryUsage } = require("./Lib/Util");

//Initialization
const serverToken = crypto.randomBytes(32).toString("hex");
const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const playIO = io.of("/play");
const wsSessions = new SessionStorage(
  crypto.randomBytes(16).toString("hex"),
  serverToken,
  8 * 60 * 1000
);
const webSessions = new SessionStorage(
  crypto.randomBytes(16).toString("hex"),
  serverToken,
  8 * 60 * 1000
);

const pendingClients = {};
const secret = crypto.randomBytes(16).toString("hex");

//Settings
app.set("query parser", middleware.parseURL);

app.disable("x-powered-by");

//Middleware
app.use(middleware.parseCookies(secret));
app.use(middleware.checkPoint(webSessions, serverToken));

//Server stuff
app.use("/dist", express.static(path.join(__dirname, "dist")));
app.use("/shared", express.static(path.join(__dirname, "Shared")));
app.use("/JS", express.static(path.join(__dirname, "Public/JS")));
app.use("/CSS", express.static(path.join(__dirname, "Public/CSS")));
app.use("/imgs", express.static(path.join(__dirname, "Public/Images")));
app.use("/", router);

//Socket.io stuff
io.use(middleware.socketNewClientCP(wsSessions, serverToken));
io.use((socket, next) => {
  const clientSession = wsSessions.getSessionInfo(socket.id);
  manager.addNewClient(socket, clientSession);
  next();
});
io.on("connection", socket => {
  console.log("Connection!", socket.id);
  socket.use(middleware.socketEmitCP(serverToken, socket));
  socket.on(Constants.SOCKET_NEW_PLAYER, (data, cb) => {
    let err = null;
    try {
      const playData = JSON.parse(data).playerData;
      const gameToJoin = manager.getGame(playData.game);

      if (!gameToJoin) {
        err = new Error("Game does not exist.");
        ErrorLogger.error(err);

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
      ErrorLogger.error(error);

      cb("Something went wrong. Please try again later.");
    }
  });
  socket.on(Constants.SOCKET_DISCONNECT, () => {
    console.log("Client Disconnected!", socket.id);
    if (!pendingClients[socket.id]) {
      const client = manager.getClient(socket.id);
      const session = wsSessions.getSessionInfo(socket.id);
      if (client && session) {
        manager.removeClient(socket.id);
        try {
          wsSessions.deleteSession(socket.id);
        } catch (err) {
          ErrorLogger.error(err);
        }
      }
    }
  });
});

playIO.use(middleware.nspCheckPoint(wsSessions, manager, serverToken));
playIO.use(middleware.nspChangeStats(wsSessions, manager));
playIO.use(middleware.nspCheckIsPending(pendingClients, serverToken));
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
    socket.emit(Constants.SOCKET_ERROR);
    return;
  }
  manager.addClientToGame(
    pending.gameID,
    socket,
    pending.clientName,
    pending.clientTeam
  );
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
  const gameID = pendingClients[socket.handshake.query.prevSocketID].gameID;
  delete pendingClients[socket.handshake.query.prevSocketID];
  console.log("Connection!", socket.id);
  logMemoryUsage();
  socket.on(Constants.SOCKET_PLAYER_ACTION, data => {
    const parsedData = JSON.parse(data);
    const game = manager.getGame(gameID);
    game.updatePlayerOnInput(socket.id, parsedData.playerData.actionData);
  });
  socket.on(Constants.SOCKET_DISCONNECT, () => {
    console.log("Client Disconnected!", socket.id);
    const client = manager.getClient(socket.id);
    const session = wsSessions.getSessionInfo(socket.id);
    if (client && session) {
      manager.removeClient(socket.id);
      try {
        wsSessions.deleteSession(socket.id);
      } catch (err) {
        ErrorLogger.error(err);
      }
    }
    manager.removeClientFromGame(gameID, socket);
  });
});

server.listen(PORT, HOST, 20, () => {
  console.log(`Server started on port ${PORT}, http://${HOST}.`);
  console.log(`Protocol is: ${PROTOCOL}.`);
  logMemoryUsage();
});

setInterval(() => {
  //Refresh ws sessions
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
  //Delete unused web sessions
  webSessions.forEach((session, ID) => {
    const requestLessStreak = session.storedData.requestLessStreak;
    const requestsInSession = session.storedData.requestsInSession;

    if (requestsInSession < 1 && requestLessStreak > 3) {
      try {
        webSessions.deleteSession(ID);
      } catch (err) {
        ErrorLogger.error(err);
      }
    }
  });
}, 8 * 60 * 1000);

setInterval(() => {
  manager.update();
  manager.sendState();
}, Constants.GAME_UPDATE_SPEED);
