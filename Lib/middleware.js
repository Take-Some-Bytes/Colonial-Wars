/**
 * @fileoverview Express and Socket.IO middleware for stuff
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports
const crypto = require("crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const socketIO = require("socket.io");
const cookieParser = require("cookie-parser");

const config = require("../config");
const init = require("./common/init");
const debug = require("./common/debug");
const Manager = require("./Game/Manager");
const Constants = require("./common/constants");
const { sendError, jwtVerifyPromise } = require("./common/common");

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
 * @returns {void|Promise<void>}
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
 * @typedef {Object} MockedRequest
 * @prop {Object} headers
 * @prop {String} headers.cookie
 * @prop {String} secret
 * @prop {Object<string, string>} cookies
 * @prop {Object<string, string>} signedCookies
 */
/**
 * @typedef {Object} SocketIOAuthPayload
 * @prop {String} sub
 * @prop {String} iss
 * @prop {String} aud
 * @prop {String} utk
 * @prop {Number} exp
 * @prop {String} pssPhrs
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
 * Wraps the `cookie-parser` middleware for non-express
 * environments.
 * @param {String|Array<string>} secrets Cookie secrets, if any.
 * @param {String} cookies The `Cookie` header from the HTTP request.
 * @returns {MockedRequest}
 */
function wrapCookieParser(secrets, cookies) {
  const cookieParserFn = cookieParser(secrets, {});
  /**
   * @type {MockedRequest}
   */
  const _req = {
    headers: {
      cookie: cookies
    },
    secret: ""
  };

  try {
    cookieParserFn(_req, null, err => {
      if (err) { throw err; }
    });
  } catch (err) {
    ServerLogger.error(`Failed to wrap cookie-parser. Error is: ${err}.`);
    return {};
  }
  return _req;
}
/**
 * Accept a new ``SocketIO.Socket`` socket.
 * @param {String|Array<string>} secrets The cookie secrets, if any.
 * @param {init.PendingClients} pendingClients Pending clients.
 * @returns {SocketIOHandler}
 */
function acceptNewSocket(secrets, pendingClients) {
  return async(socket, next) => {
    const req = wrapCookieParser(secrets, socket.request.headers.cookie);
    const cookies = req.signedCookies;

    if (typeof cookies.socketIOAuth !== "string") {
      next(new Error("No Socket.IO authorization!"));
      return;
    }
    try {
      /**
       * @type {SocketIOAuthPayload}
       */
      const decoded = await jwtVerifyPromise(
        cookies.socketIOAuth, init.jwtSecret,
        {
          issuer: config.serverConfig.appName,
          audience: config.serverConfig.appName,
          maxAge: config.securityOpts.maxTokenAge,
          subject: config.securityOpts.validSubjectsMap.sockAuthCW,
          ignoreNotBefore: true
        }
      );

      if (!decoded.utk || typeof decoded.utk !== "string") {
        next(new Error("Missing unique token!"));
        return;
      } else if (!config.securityOpts.passPhrases.includes(decoded.pssPhrs)) {
        next(new Error("Invalid passphrase!"));
      } else if (!pendingClients.has(decoded.utk)) {
        next(new Error("Your session does not exist."));
      } else {
        const joinedGame = pendingClients.get(
          decoded.utk
        ).joinedGame;
        if (joinedGame) {
          next();
          return;
        }
        const auth = {
          connected: true,
          joinedGame: false,
          playData: {},
          validationData: {
            utk: decoded.utk,
            passPhrase: decoded.pssPhrs
          }
        };
        pendingClients.set(decoded.utk, auth);
        socket.auth = auth;
        next();
      }
    } catch (err) {
      if (
        err instanceof jwt.NotBeforeError ||
        err instanceof jwt.JsonWebTokenError ||
        err instanceof jwt.TokenExpiredError
      ) {
        debug(err);
        next(new Error("Unauthorized."));
      } else {
        ServerLogger.error(err.stack);
        next(new Error("Server error."));
      }
    }
  };
}
/**
 * Checks if a `Socket.IO` socket exists in the pending clients
 * queue when a new connection to the `play` namespace is
 * received.
 * @param {String|Array<string>} secrets The cookie secrets, if any.
 * @param {init.PendingClients} pendingClients Pending clients.
 * @returns {SocketIOHandler}
 */
function checkSocket(secrets, pendingClients) {
  return async(socket, next) => {
    const req = wrapCookieParser(secrets, socket.request.headers.cookie);
    const cookies = req.signedCookies;

    if (typeof cookies.socketIOAuth !== "string") {
      next(new Error("No Socket.IO authorization!"));
      return;
    }
    try {
      /**
       * @type {SocketIOAuthPayload}
       */
      const decoded = await jwtVerifyPromise(
        cookies.socketIOAuth, init.jwtSecret,
        {
          issuer: config.serverConfig.appName,
          audience: config.serverConfig.appName,
          maxAge: config.securityOpts.maxTokenAge,
          subject: config.securityOpts.validSubjectsMap.sockAuthCW,
          ignoreNotBefore: true
        }
      );

      if (!decoded.utk || typeof decoded.utk !== "string") {
        next(new Error("Missing unique token!"));
        return;
      } else if (!config.securityOpts.passPhrases.includes(decoded.pssPhrs)) {
        next(new Error("Invalid passphrase!"));
      } else if (!pendingClients.has(decoded.utk)) {
        next(new Error("Your session does not exist."));
      } else {
        const pending = pendingClients.get(decoded.utk);
        if (
          pending.validationData.passPhrase !== decoded.pssPhrs ||
          !config.securityOpts.passPhrases.includes(decoded.pssPhrs)
        ) {
          next(new Error("Invalid auth!"));
        } else if (
          typeof pending.playData === "object" &&
          Object.keys(pending.playData).length < 1
        ) {
          next(new Error("No play data!"));
        }
        try {
          init.manager.addClientToGame(
            pending.playData.gameID,
            socket,
            pending.playData.clientName,
            pending.playData.clientTeam
          );
        } catch (err) {
          next(new Error(err));
        }
        const game = init.manager.getGame(pending.playData.gameID);
        socket.emit(Constants.SOCKET_PROCEED, JSON.stringify({
          playerData: {
            gameID: pending.playData.gameID,
            gameMap: game.mapName
          },
          otherData: {
            status: "success"
          }
        }));
        socket.gameID = pending.playData.gameID;
        next();
      }
    } catch (err) {
      if (
        err instanceof jwt.NotBeforeError ||
        err instanceof jwt.JsonWebTokenError ||
        err instanceof jwt.TokenExpiredError
      ) {
        debug(err);
        next(new Error("Unauthorized."));
      } else {
        ServerLogger.error(err.stack);
        next(new Error("Server error."));
      }
    }
  };
}

/**
 * Module exports
 */
module.exports = exports = {
  sysCheckpoint,
  requestCheckpoint,
  acceptCheckpoint,
  wrapCookieParser,
  acceptNewSocket,
  checkSocket
};
