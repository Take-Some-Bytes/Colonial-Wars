/**
 * @fileoverview File to store middleware for Socket.IO and Express.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const express = require("express");
const jwt = require("jsonwebtoken");
// eslint-disable-next-line no-unused-vars
const socketIO = require("socket.io");
const cookieParser = require("cookie-parser");

const config = require("../config");
const init = require("./common/init");
const Constants = require("./common/constants");
const debug = require("./common/debug");
const { sendError, jwtVerifyPromise } = require("./common/common");

const loggers = init.winstonLoggers;
const ServerLogger = loggers.get("Server-logger");
const SecurityLogger = loggers.get("Security-logger");

// JSDoc typedefs to make development easier.
/**
 * @callback SocketIONext
 * @param {*} [err]
 * @returns {void}
 */
/**
 * @callback SocketIOHandler
 * @param {socketIO.Socket} socket
 * @param {SocketIONext} next
 * @returns {Promise<void>}
 */
/**
 * @typedef {Object} AcceptOpts
 * @prop {Array<string>} type
 * @prop {Array<string>} lang
 * @prop {Array<string>} charset
 * @prop {Array<string>} encoding
 * @prop {boolean} ignoreAcceptMismatch
 */
/**
 * @typedef {Object} CheckAcceptOpts
 * @prop {"type"|"lang"|"charset"|"encoding"} whichAccept
 * @prop {Array<string>} acceptedTypes
 */
/**
 * @typedef {Object} MockedRequest
 * @prop {Object} headers
 * @prop {string} headers.cookie
 * @prop {string} secret
 * @prop {Object<string, string>} cookies
 * @prop {Object<string, string>} signedCookies
 */
/**
 * @typedef {Object} SocketIOAuthPayload
 * @prop {string} sub
 * @prop {string} iss
 * @prop {string} aud
 * @prop {string} utk
 * @prop {number} exp
 * @prop {string} pssPhrs
 */

/**
 * System part of HTTP decision making.
 * @param {Array<string>} implementedMethods Array of methods that this
 * server supports. Must be all upper-case.
 * @returns {express.Handler}
 * @public
 */
function sysCheckpoint(implementedMethods) {
  // IDEA: Maybe we should add some code to make the elements in
  // the `implementedMethods` array all uppercase strings.
  return (req, res, next) => {
    const reqUrlLength = req.url.length;
    // IDEA: Maybe we should not have this? The following code
    // tries to get the client's real IP, if the app is behind a
    // reverse proxy, which it should not be.
    const clientIP = req.ips.length < 1 ?
      req.ip :
      req.ips[0];

    // YOUR REQUEST URL MUST NOT BE SUPER LONG!
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
          `${clientIP} tried to get a page on this server with a very ` +
          `long request URL. URL that they tried to get:\r\n${req.url}`
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
 * Request part of HTTP decision making.
 * @returns {express.Handler}
 */
function requestCheckpoint() {
  return (req, res, next) => {
    // The following code dynamically checks the request url,
    // matches to a regex made from an object's keys, and checks
    // if the request method matches the allowed methods on that route.
    let allowedMethods = [];
    for (
      const path of Object.getOwnPropertyNames(Constants.ALLOWED_METHODS_MAP)
    ) {
      const pathRegex = new RegExp(path);
      /**
       * @type {Array<string>}
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
        allowedMethods = methods;
        break;
      }
    }

    // Send a 204 response right here if the method is OPTIONS.
    // TODO: See if we need to support the OPTIONS HTTP method.
    if (req.method === "OPTIONS") {
      res
        .status(204)
        .header("Allow", allowedMethods.join(", "))
        .end();
      return;
    }
    next();
  };
}
/**
 * Checkpoint for the accept part of HTTP decision making.
 * @param {AcceptOpts} acceptOpts Options.
 * @returns {express.Handler}
 */
function acceptCheckpoint(acceptOpts) {
  /**
   * Checks what the client accepts. Private.
   * @param {express.request} req Request.
   * @param {express.response} res Response.
   * @param {CheckAcceptOpts} opts Options.
   * @returns {string|false}
   * @private
   */
  function checkAccept(req, res, opts) {
    // This dynamically gets the accept function that
    // is needed and calls it.
    const acceptFunction = {
      type: req.accepts,
      lang: req.acceptsLanguages,
      charset: req.acceptsCharsets,
      encoding: req.acceptsEncodings
    }[opts.whichAccept] || req.accepts;

    return acceptFunction.call(req, opts.acceptedTypes);
  }

  return (req, res, next) => {
    const accepted = [];

    Object.getOwnPropertyNames(acceptOpts).forEach(key => {
      // Do not execute the following function for the
      // `ignorAcceptMismatch` key.
      if (key === "ignoreAcceptMismatch") { return; }
      const acceptsType = checkAccept(req, res, {
        whichAccept: key,
        acceptedTypes: acceptOpts[key]
      });
      accepted.push(acceptsType);
    });
    // If there is even one unacceptable asset, see if we are supposed to
    // ignore accept mismatch, and send a 406 Not Acceptable response if
    // we don't ignore accept mismatch.
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
 * Wraps the `cookie-parser` middleware for non-express environments.
 * @param {string|Array<string>} secrets Cookie secrets, if any.
 * @param {string} cookie The `Cookie` header from the HTTP request.
 * @returns {MockedRequest}
 */
function wrapCookieParser(secrets, cookie) {
  const cookieParserFn = cookieParser(secrets, {});
  // Here, we mock the request, with just enough properties
  // to run the cookie parser.
  /**
   * @type {MockedRequest}
   */
  const _req = {
    headers: {
      cookie
    },
    secret: ""
  };

  try {
    // Pass in the mocked request, pass in null as the response object,
    // and pass a function for the `next()` function.
    cookieParserFn(_req, null, err => {
      if (err) { throw err; }
    });
  } catch (err) {
    // TODO See if we want to handle the error in this function, or let
    // the caller handle it.
    ServerLogger.error(`Failed to wrap cookie-parser. Error is: ${err}.`);
    return {};
  }
  return _req;
}
/**
 * Accept a new ``SocketIO.Socket`` socket.
 * @param {string|Array<string>} secrets The cookie secrets, if any.
 * @returns {SocketIOHandler}
 */
function acceptNewSocket(secrets) {
  return async(socket, next) => {
    const req = wrapCookieParser(secrets, socket.request.headers.cookie);
    const cookies = req.signedCookies;

    // YOU MUST HAVE A socketIOAuth COOKIE, AND IT MUST BE A STRING!
    if (typeof cookies.socketIOAuth !== "string") {
      debug("No Socket.IO authorization!");
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

      // TODO: See if this could be refactored.
      // Check the unique token, passphrase, and if the client's session exists.
      if (!decoded.utk || typeof decoded.utk !== "string") {
        debug("Missing unique token!");
        next(new Error("Missing unique token!"));
        return;
      } else if (!config.securityOpts.passPhrases.includes(decoded.pssPhrs)) {
        debug("Invalid passphrase!");
        next(new Error("Invalid passphrase!"));
      } else {
        const pending = await init.wsSessions.get(decoded.utk);
        if (typeof pending === "boolean" && !pending) {
          debug("Your session does not exist.");
          next(new Error("Your session does not exist."));
          return;
        }
        if (pending.sessionData.joinedGame) {
          socket.auth = pending.sessionData;
        }
        const auth = Object.assign(
          pending.sessionData, { connected: true }
        );
        init.wsSessions.set(decoded.utk, {
          sessionData: auth
        });
        socket.auth = auth;
        socket.touchInterval = setInterval(() => {
          init.wsSessions.touch(decoded.utk);
        }, 1000 * 60 * 19);
        next();
      }
    } catch (err) {
      // TODO: See if this could be refactored.
      if (
        err instanceof jwt.NotBeforeError ||
        err instanceof jwt.JsonWebTokenError ||
        err instanceof jwt.TokenExpiredError
      ) {
        SecurityLogger.notice(
          `Socket ${socket.id} failed authentication. Error is: ` +
          `${err.stack}`
        );
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
 * queue when a new connection to the `play` namespace is received.
 * @param {string|Array<string>} secrets The cookie secrets, if any.
 * @returns {SocketIOHandler}
 */
function checkSocket(secrets) {
  return async(socket, next) => {
    const req = wrapCookieParser(secrets, socket.request.headers.cookie);
    const cookies = req.signedCookies;

    // YOU ALSO STILL MUST HAVE A socketIOAuth COOKIE!
    if (typeof cookies.socketIOAuth !== "string") {
      debug("No Socket.IO authorization!");
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

      // TODO: See if this could be refactored.
      // Check the unique token, passphrase, and client session.
      if (!decoded.utk || typeof decoded.utk !== "string") {
        next(new Error("Missing unique token!"));
        return;
      } else if (!config.securityOpts.passPhrases.includes(decoded.pssPhrs)) {
        next(new Error("Invalid passphrase!"));
      } else {
        const pending = await init.wsSessions.get(decoded.utk);
        if (typeof pending === "boolean" && !pending) {
          next(new Error("Your session does not exist."));
          return;
        }
        if (
          pending.sessionData.validationData.passPhrase !== decoded.pssPhrs ||
          !config.securityOpts.passPhrases.includes(decoded.pssPhrs)
        ) {
          next(new Error("Invalid auth!"));
          return;
        } else if (
          typeof pending.sessionData.playData === "object" &&
          Object.keys(pending.sessionData.playData).length < 1
        ) {
          next(new Error("No play data!"));
          return;
        }
        try {
          init.manager.addClientToGame(
            pending.sessionData.playData.gameID,
            socket,
            pending.sessionData.playData.clientName,
            pending.sessionData.playData.clientTeam
          );
        } catch (err) {
          // TODO: See if we need to be less verbose with the error.
          next(new Error(err));
          return;
        }
        // Emit the "proceed" event to get the client to proceed with
        // tasks.
        const game = init.manager.getGame(pending.sessionData.playData.gameID);
        socket.emit(Constants.SOCKET_PROCEED, JSON.stringify({
          playerData: {
            gameID: pending.sessionData.playData.gameID,
            gameMap: game.mapName
          },
          otherData: {
            status: "success"
          }
        }));
        socket.gameID = pending.sessionData.playData.gameID;
        socket.auth = pending.sessionData;
        socket.touchInterval = setInterval(() => {
          init.wsSessions.touch(decoded.utk);
        }, 1000 * 60 * 19);
        next();
      }
    } catch (err) {
      // TODO: See if this could be refactored.
      if (
        err instanceof jwt.NotBeforeError ||
        err instanceof jwt.JsonWebTokenError ||
        err instanceof jwt.TokenExpiredError
      ) {
        SecurityLogger.notice(
          `Socket ${socket.id} failed authentication. Error is: ` +
          `${err.stack}`
        );
        next(new Error("Unauthorized."));
      } else {
        ServerLogger.error(err.stack);
        next(new Error("Server error."));
      }
    }
  };
}

/**
 * Module exports.
 */
module.exports = exports = {
  sysCheckpoint,
  requestCheckpoint,
  acceptCheckpoint,
  wrapCookieParser,
  acceptNewSocket,
  checkSocket
};
