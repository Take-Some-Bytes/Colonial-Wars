/**
 * @fileoverview Express and Socket.IO middleware for stuff
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports
const crypto = require("crypto");
const express = require("express");
const socketIO = require("socket.io");

const SessionStorage = require("./Security/SessionStorage");
const Manager = require("./Game/Manager");
const init = require("./common/init");
const Constants = require("./common/constants");
const { sendError } = require("./common/common");

const loggers = init.winstonLoggers;
const ServerLogger = loggers.get("Server-logger");

/**
 * @callback SocketIONext
 * @param {*} [err]
 * @returns {void}
 */
/**
 * @callback SocketIOHandler
 * @param {socketIO.Socket} socket
 * @param {SocketIONext} next
 * @returns {void}
 */
/**
 * @typedef {Object} AcceptOpts
 * @prop {Array<String>} type
 * @prop {Array<String>} lang
 * @prop {Array<String>} charset
 * @prop {Array<String>} encoding
 * @prop {Boolean} ignoreAcceptMismatch
 */
/**
 * @typedef {Object} CheckAcceptOpts
 * @prop {"type"|"lang"|"charset"|"encoding"} whichAccept
 * @prop {Array<String>} acceptedTypes
 */

/**
 * System part of the request decision making.
 * @param {Array<String>} implementedMethods Array of methods that this
 * server supports. Must be all upper-case.
 * @returns {express.Handler}
 * @public
 */
function sysCheckpoint(implementedMethods) {
  return (req, res, next) => {
    const reqUrlLength = req.url.length;
    const clientIP = req.ips.length < 1 ?
      req.ip :
      req.ips[0];

    if (reqUrlLength > Constants.REQ_URL_MAX_LEN) {
      sendError({
        httpOpts: {
          status: 414
        },
        logOpts: {
          doLog: true,
          logLevel: "notice",
          loggerID: "Security-logger",
          logMessage:
          `${clientIP} tried to get ${req.url} with a very long request URL.`
        }
      })(req, res, next);
      return;
    } else if (!implementedMethods.includes(req.method)) {
      sendError({
        httpOpts: {
          status: 501
        },
        logOpts: {
          doLog: false
        }
      })(req, res, next);
      return;
    }
    next();
  };
}
/**
 * Request part of the decision making.
 * @returns {express.Handler}
 */
function requestCheckpoint() {
  return (req, res, next) => {
    for (
      const path of Object.getOwnPropertyNames(Constants.ALLOWED_METHODS_MAP)
    ) {
      const pathRegex = new RegExp(path);
      /**
       * @type {Array<String>}
       */
      const methods = Constants.ALLOWED_METHODS_MAP[path];
      if (pathRegex.test(req.url)) {
        if (!methods.includes(req.method.toUpperCase())) {
          sendError({
            httpOpts: {
              status: 405
            },
            logOpts: {
              doLog: false
            }
          })(req, res, next);
          return;
        }
        break;
      }
    }

    if (req.method === "OPTIONS") {
      res
        .status(204)
        .header("Allow", Constants.SEC_ALLOWED_METHODS)
        .end();
      return;
    }
    next();
  };
}
/**
 * Checkpoint for the accept part of decision making.
 * @param {AcceptOpts} acceptOpts Options.
 * @returns {express.Handler}
 */
function acceptCheckpoint(acceptOpts) {
  /**
   * Checks accept. Private.
   * @param {express.request} req Request.
   * @param {express.response} res Response.
   * @param {CheckAcceptOpts} opts Options.
   * @returns {string|false}
   * @private
   */
  function checkAccept(req, res, opts) {
    let acceptFunction = null;

    switch (opts.whichAccept) {
    case "type":
      acceptFunction = req.accepts;
      break;
    case "lang":
      acceptFunction = req.acceptsLanguages;
      break;
    case "charset":
      acceptFunction = req.acceptsCharsets;
      break;
    case "encoding":
      acceptFunction = req.acceptsEncodings;
      break;
    default:
      acceptFunction = req.accepts;
      break;
    }

    return acceptFunction.call(req, opts.acceptedTypes);
  }

  return (req, res, next) => {
    const accepted = [];

    Object.getOwnPropertyNames(acceptOpts).forEach(key => {
      if (key === "ignoreAcceptMismatch") { return; }
      const acceptsType = checkAccept(req, res, {
        whichAccept: key,
        acceptedTypes: acceptOpts[key]
      });
      accepted.push(acceptsType);
    });
    if (accepted.some(type => !type) && !acceptOpts.ignoreAcceptMismatch) {
      sendError({
        httpOpts: {
          status: 406
        },
        logOpts: {
          doLog: false
        }
      })(req, res, next);
      return;
    }
    next();
  };
}
/**
 * Socket.io new client checkpoint
 * @param {SessionStorage} storage The session storage for socket.io
 * @param {String} serverToken The server's token
 * @returns {SocketIOHandler}
 */
function socketNewClientCP(storage, serverToken) {
  return (socket, next) => {
    const clientID = socket.id;
    const token = crypto.randomBytes(16).toString("hex");
    const startTime = Date.now();
    const maxAge = storage.maxAge;
    try {
      storage.addNewSession({
        serverToken: serverToken,
        id: clientID,
        token: token,
        startTime: startTime,
        maxAge: maxAge
      });
    } catch (err) {
      ServerLogger.error(err);
      next(new Error("500 Internal Server Error."));
      return;
    }
    socket.emit(Constants.SOCKET_SECURITY_DATA, JSON.stringify({
      securityData: {
        serverToken: serverToken,
        clientData: {
          token: token,
          id: clientID
        }
      },
      playerData: {},
      otherData: {
        status: "success"
      }
    }));
    next();
  };
}
/**
 * Checkpoint for the socket.io namespaces
 * @param {SessionStorage} storage The session storage that you use
 * for socket.io session handling
 * @param {Manager} manager The manager object used for game managing
 * @returns {SocketIOHandler}
 */
function nspCheckPoint(storage, manager) {
  return (socket, next) => {
    const prevClientID = socket.handshake.query.prevSocketID;
    const session = storage.getSessionInfo(prevClientID);
    const client = manager.getClient(prevClientID);
    if (!prevClientID || !session || !client) {
      next(new Error(
        "It looks like your session does not exist or" +
        " you have not been to the main page."
      ));
      return;
    }
    next();
  };
}
/**
 * Changes a client's stats
 * @param {SessionStorage} storage The session storage for ws sessions
 * @param {Manager} manager The manager you are using
 * @returns {SocketIOHandler}
 */
function nspChangeStats(storage, manager) {
  return (socket, next) => {
    const query = socket.handshake.query;
    storage.changeSessionID(socket.id, query.prevSocketID);
    manager.changeStats({
      id: socket.id,
      token: storage.getSessionInfo(socket.id).token,
      socket: socket
    }, query.prevSocketID);
    next();
  };
}
/**
 * Checks if the client is in the pendingClients object
 * @param {Object} pendingClients The pending clients
 * object that you store pending clients in
 * @returns {Function}
 */
function nspCheckIsPending(pendingClients) {
  return (socket, next) => {
    const prevClientID = socket.handshake.query.prevSocketID;
    const pending = pendingClients[prevClientID];
    if (!pending) {
      next(new Error(
        "It looks like your session does not exist or" +
        " you have not been to the main page."
      ));
      return;
    }
    next();
  };
}

/**
 * Module exports
 */
module.exports = exports = {
  sysCheckpoint,
  requestCheckpoint,
  acceptCheckpoint,
  socketNewClientCP,
  nspCheckPoint,
  nspChangeStats,
  nspCheckIsPending
};
