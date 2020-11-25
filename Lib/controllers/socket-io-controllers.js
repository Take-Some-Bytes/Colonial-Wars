/**
 * @fileoverview Socket.IO connection controllers.
 * @author Horton Cheng <horton0712@gmail.com>
 */

const socketIO = require("socket.io");

const init = require("../common/init");
const util = require("../common/util");
const debug = require("../common/debug");
const Constants = require("../common/constants");

const manager = init.manager;
const loggers = init.winstonLoggers;
const ServerLogger = loggers.get("Server-logger");
const SecurityLogger = loggers.get("Security-logger");

/**
 * @callback GenericAsyncFunc
 * @param {...any} args
 * @returns {Promise<void>}
 */
/**
 * @callback SocketIOController
 * @param {socketIO.Socket} socket
 * @returns {void}
 */
/**
 * @callback SocketIOAckHandler
 * @param {any} data
 * @param {GenericAsyncFunc} cb
 */

/**
 * Handles the disconnection of a socket.
 * @param {socketIO.Socket} socket The Socket.IO socket.
 * @param {Array<socketIO.Socket>} ioConns Array of Socket.IO connections.
 * @returns {VoidFunction}
 */
function disconnectHandler(socket, ioConns) {
  return () => {
    debug("Client Disconnected!", socket.id);
    util.removeFromArray(ioConns, socket);
    clearInterval(socket.touchInterval);
  };
}
/**
 * Handles the disconnection of a socket in the play `/play`
 * Socket.IO namespace.
 * @param {socketIO.Socket} socket The Socket.IO socket.
 * @param {Array<socketIO.Socket>} ioConns Array of Socket.IO connections.
 * @param {any} socketAuth The Socket.IO client's authorization information.
 * @param {string} gameID The game ID this client is connected to.
 * @returns {VoidFunction}
 */
function playDisconnectHandler(socket, ioConns, socketAuth, gameID) {
  return () => {
    manager.removeClientFromGame(gameID, socket);
    init.wsSessions.get(socketAuth.validationData.utk)
      .then(async session => {
        if (typeof session === "boolean" && !session) {
          // Hmm... I'm actually not sure what to do here. How
          // did the client get a Socket.IO connection anyways?
          SecurityLogger.warning(
            `Client ${socket.id} accessed the Socket.IO play namespace` +
            " without a session."
          );
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
        ServerLogger.info(
          `Removed client ${socket.id} from game ${gameID}.`
        );
      })
      .catch(err => {
        ServerLogger.error(
          `An error occurred while trying to remove client ${socket.id}` +
          ` with session token ${socketAuth.validationData.utk} from game` +
          ` ${gameID}. Error is:\r\n${err.stack}`
        );
      });

    // Now call the generic disconnect handler.
    disconnectHandler(socket, ioConns)();
  };
}
/**
 * Handles the coming of a new player in the game.
 * @param {socketIO.Socket} socket The Socket.IO socket.
 * @param {any} socketAuth The Socket.IO client's authorization information.
 * @returns {SocketIOAckHandler}
 */
function newPlayerHandler(socket, socketAuth) {
  return async(data, cb) => {
    let playData = null;
    let gameToJoin = null;
    try {
      // A player wants to join a game, so try to parse
      // the data sent.
      playData = JSON.parse(data).playerData;
      gameToJoin = manager.getGame(playData.game);
      debug(`Client ${socket.id} wants to join game ID ${playData.game}.`);

      if (!gameToJoin) {
        ServerLogger.notice(
          `Client ${socket.id} wants to join game ${playData.game}, ` +
          "which does not exist."
        );
        cb("Selected game does not exist.");
      } else if (!socketAuth) {
        SecurityLogger.notice(
          `Client ${socket.id} is not authorized.`
        );
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
        ServerLogger.info(
          `Client ${socket.id} successfully joined game ${playData.game}` +
        ` as ${playData.name}.`
        );
        cb(null);
      }
    } catch (err) {
      ServerLogger.error(
        `Error occured while trying to add client ${socket.id} to` +
        ` game ${playData.game}. Error is:`
      );
      ServerLogger.error(err);

      // Intentionally be vague with the error message.
      cb("Something went wrong. Please try again later.");
    }
  };
}

/**
 * The main `/` Socket.IO namespace controller.
 * @param {Array<socketIO.Socket>} ioConns An array of Socket.IO connections.
 * @returns {SocketIOController}
 */
function mainNspController(ioConns) {
  return socket => {
    const socketAuth = socket.auth;
    ioConns.push(socket);
    debug("Connection!", socket.id);
    socket.on(Constants.SOCKET_NEW_PLAYER, newPlayerHandler(
      socket, socketAuth
    ));
    socket.on(Constants.SOCKET_DISCONNECT, disconnectHandler(socket, ioConns));
  };
}
/**
 * The play `/play` Socket.IO namespace controller.
 * @param {Array<socketIO.Socket>} ioConns An array of Socket.IO connections.
 * @returns {SocketIOController}
 */
function playNspController(ioConns) {
  return socket => {
    // Keep the game ID for later. We'll need it.
    const gameID = socket.gameID;
    const socketAuth = socket.auth;
    ioConns.push(socket);
    debug("Connection /play!", socket.id);
    socket.on(Constants.SOCKET_PLAYER_ACTION, data => {
      const parsedData = JSON.parse(data);
      const game = manager.getGame(gameID);
      game.updatePlayerOnInput(socket.id, parsedData.playerData.actionData);
    });
    socket.on(Constants.SOCKET_DISCONNECT, playDisconnectHandler(
      socket, ioConns, socketAuth, gameID
    ));
  };
}

/**
 * Module exports
 */
module.exports = exports = {
  mainNspController,
  playNspController
};
