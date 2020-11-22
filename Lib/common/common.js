/**
 * @fileoverview A file containing all of the common functions to the server.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const fs = require("fs");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const http = require("http");

const init = require("./init");
// Keep the debug require here just so that if we need it, we'll have it.
const debug = require("./debug");
const config = require("../../config");
// const util = require("util");
const loggers = init.winstonLoggers;
const SecurityLogger = loggers.get("Security-logger");
const ServerLogger = loggers.get("Server-logger");

/**
 * @callback SocketIONext
 * @param {*} [err]
 * @returns {void}
 */
/**
 * @typedef {Object} SendErrorOpts Options.
 * @prop {Object} [httpOpts]
 * @prop {number} [httpOpts.status=500] HTTP status code. Default is 500.
 * @prop {string} [httpOpts.contentType="text/html"] HTTP content type.
 * Only required if ``opts.messageToSend`` is a ``Buffer`` or if the
 * content type is not HTML.
 * @prop {Object} [logOpts]
 * @prop {string} [logOpts.logMessage=""] The message to log. No default.
 * @prop {boolean} [logOpts.doLog=false] Whether to log or not to log.
 * Default is false.
 * @prop {string} [logOpts.loggerID] The ID of the winston logger to use.
 * @prop {string} [logOpts.logLevel] The level to log at.
 * @prop {string|Buffer} [messageToSend] The error message to send. Default is
 * the cached error page from ``init.js``.
 */
/**
 * @typedef {"EMISSING"|"ENOEXIST"} MissingCodes
 * @typedef {"ENOMATCH"|"EINVALID"} ValueErrorCodes
 * @typedef {"EFAILED"|ValueErrorCodes|MissingCodes} ErrorCodes
 */
/**
 * @typedef {import("../middleware").SocketIOAuthPayload} SocketIOAuthPayload
 */
/**
 * @callback ShutDownHandler
 * @param {NodeJS.Signals} signal
 * @returns {Promise<never>}
 */
/**
 * @callback ExceptionHandler
 * @param {any} reason
 * @returns {Promise<never>}
 */

/**
 * ValidationError class.
 * @extends Error
 */
class ValidationError extends Error {
  /**
   * Constructor for a ValidationError class.
   * @class
   * @param {string} msg The error message.
   * @param {ErrorCodes} typeCode The error code.
   * @param {string} toFix A string describing how to fix the error. This
   * should ***not*** be too verbose.
   */
  constructor(msg, typeCode, toFix) {
    super(msg);

    this.typeCode = typeCode;
    this.toFix = toFix;
  }
  /**
   * Returns this error formatted as a string. Omits the error stack.
   * @returns {string}
   */
  format() {
    return (
      `${this.typeCode}: ${this.message} To fix this error, ` +
      `${this.toFix}`
    );
  }
  /**
   * Returns this error formatted as a string. Includes the error stack.
   * @returns {string}
   */
  formatVerbose() {
    return (
      `${this.typeCode}: ${this.stack}\r\n\tTo fix this error,` +
      ` ${this.toFix}`
    );
  }
}
/**
 * Sends an error to the client.
 * @param {SendErrorOpts} opts Options.
 * @returns {express.Handler}
 */
function sendError(opts) {
  // Defaults for the options.
  /**
   * @type {SendErrorOpts}
   */
  const defaults = {
    httpOpts: {
      status: 500,
      contentType: "text/html"
    },
    logOpts: {
      doLog: false
    },
    messageToSend: init.cache.errorPage
  };
  // Create an internal `_opts` variable to actually use
  // without modifying the original `opts` parameter.
  /**
   * @type {SendErrorOpts}
   */
  let _opts = {};

  // No options? let's go to defaults.
  if (!opts) {
    _opts = defaults;
  } else {
    // Lots of option determination.
    _opts = {
      httpOpts: opts.httpOpts ?
        {
          status: opts.httpOpts.status || defaults.httpOpts.status,
          contentType:
            opts.httpOpts.contentType || defaults.httpOpts.contentType
        } :
        defaults.httpOpts,
      logOpts: opts.logOpts ?
        {
          doLog: opts.logOpts.doLog || defaults.logOpts.doLog,
          logMessage: opts.logOpts.logMessage,
          loggerID: opts.logOpts.loggerID,
          logLevel: opts.logOpts.logLevel
        } :
        defaults.logOpts,
      messageToSend: opts.messageToSend ?
        opts.messageToSend :
        defaults.messageToSend
    };
  }

  return (req, res) => {
    debug(
      `Sending error to client with status code ${_opts.httpOpts.status}` +
      `, who requested ${req.url}.`
    );
    res.type(_opts.httpOpts.contentType);
    res.cookie(
      "statusCode", _opts.httpOpts.status,
      { signed: true, sameSite: "strict" }
    );
    // Check if we need to log or not.
    if (_opts.logOpts.doLog) {
      const log = loggers
        .get(_opts.logOpts.loggerID)[
          _opts.logOpts.logLevel
        ];
      if (typeof log === "function") {
        log(_opts.logOpts.logMessage);
      }
    }

    res
      .status(_opts.httpOpts.status)
      .send(_opts.messageToSend);
  };
}
/**
 * Handles an error while processing a Socket.IO socket in middleware.
 * @param {socketIO.Socket} socket The Socket.IO socket.
 * @param {SocketIONext} next Next function.
 * @param {Error} err The error that was thrown.
 */
function onWsProcessingError(socket, next, err) {
  if (err instanceof ValidationError) {
    SecurityLogger.notice(
      `Socket ${socket.id} failed processing. Error is:` +
      ` ${err.format()}`
    );
    next(
      new Error(`Processing failed. Error is ${err.message}.`)
    );
  } else {
    ServerLogger.error(
      `Error occured while processing socket ${socket.id}.` +
      `Error: ${err}. Error stack:\r\n${err.stack}.`
    );
    next(
      new Error("Server error.")
    );
  }
}
/**
 * Serves a single file.
 * @param {express.request} req Client Request.
 * @param {express.response} res Server Response.
 * @param {express.NextFunction} next Next function.
 * @param {string} file The file to read.
 * @param {boolean} sendType Whether to send the `Content-Type` header.
 */
function serveFile(req, res, next, file, sendType) {
  // Open and pipe the file to the client.
  // We don't use the new `pipeline` function because we can't
  // send an error response if the ReadStream fails–`pipeline`
  // automatically closes all streams.
  debug(
    `Sending file ${file} for URL ${req.url}.`
  );
  const s = fs.createReadStream(file);
  s.on("open", () => {
    if (sendType) {
      res.type(path.extname(file).slice(1));
    }
    s.pipe(res);
  });
  s.on("error", err => {
    const is404 = err.code === "ENOENT";
    // Destory the Readstream so that memory leaks don't happen.
    s.destroy();
    sendError({
      httpOpts: {
        status: is404 ? 404 : 500
      },
      logOpts: {
        doLog: true,
        loggerID: "Server-logger",
        logLevel: "error",
        logMessage: `Error while serving URL ${req.url}: ${err.stack}`
      }
    })(req, res, next);
  });
}
/**
 * Handles all other requests in which the server did not have
 * an explicit route for.
 * @param {express.request} req Client Request.
 * @param {express.response} res Server Response.
 * @param {express.NextFunction} next Next function.
 */
function handleOther(req, res, next) {
  // The following code constructs the actual path that we are going
  // to serve the file from.
  const protocol = req.socket.encrypted ? "https:" : "http:";
  const reqPath = new URL(req.url, `${protocol}//${req.headers.host}`);
  const includesFavicon = reqPath.pathname.includes("/favicon.ico");
  let actualPath = path.join(
    config.serverConfig.rootDirs.publicRoot, reqPath.pathname
  );

  if (includesFavicon) {
    actualPath = path.join(
      config.serverConfig.rootDirs.publicRoot, "Images/favicon.ico"
    );
  } else if (!path.extname(actualPath)) {
    actualPath += ".html";
  }

  if (includesFavicon) {
    res.type("image/x-icon");
  }
  serveFile(
    req, res, next, actualPath,
    !includesFavicon
  );
}
/**
 * Logs a report, CSP or not.
 * @param {express.request} req Client Request.
 * @param {express.response} res Server Response.
 * @param {express.NextFunction} next Next function.
 */
function logReport(req, res, next) {
  // Get the real client IP.
  const clientIP = req.ips.length > 1 ?
    req.ips[0] :
    req.ip;
  // Check if req.body is existent.
  if (
    req.body &&
    typeof req.body === "object" &&
    req.body.constructor === Object &&
    req.body instanceof Object
  ) {
    // We have to be very careful!
    // We have no idea what there is in req.body.
    // In production, this endpoint should not be used.
    if (
      typeof req.body["csp-report"] === "object" ||
      req.body instanceof Array
    ) {
      const report = JSON.stringify(req.body, null, 3);
      SecurityLogger.warning(
        `Report received. Report:\r\n${report}`
      );
      res
        .status(204)
        .end();
      return;
    }
  }
  sendError({
    httpOpts: {
      status: 400
    },
    logOpts: {
      doLog: true,
      loggerID: "Security-logger",
      logLevel: "warning",
      logMessage:
        `${clientIP} accessed reporting endpoint with an invalid or ` +
        `non-existent request body. Request body:\r\n${req.body}`
    }
  })(req, res, next);
}
// TODO: See if there's an automatic way of promisifying
// async functions. `util.promisify` may be of interest.
/**
 * `jwt.sign` promisified.
 * @param {string|object|Buffer} payload The payload.
 * @param {jwt.Secret} secret The secret.
 * @param {jwt.SignOptions} options Options.
 * @returns {Promise<string>}
 */
function jwtSignPromise(payload, secret, options) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload, secret, options, (err, encoded) => {
        if (err) { reject(err); }
        resolve(encoded);
      }
    );
  });
}
/**
 * `jwt.verify` promisified.
 * @param {string} token The payload.
 * @param {jwt.Secret} secret The secret.
 * @param {jwt.VerifyOptions} options Options.
 * @returns {Promise<Object<string, any>>}
 */
function jwtVerifyPromise(token, secret, options) {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token, secret, options, (err, decoded) => {
        if (err) { reject(err); }
        resolve(decoded);
      }
    );
  });
}
/**
 * `jwt.decode` promisified.
 * @param {string} token The payload.
 * @param {jwt.DecodeOptions} options Options.
 * @returns {Promise<Object<string, any>>}
 */
function jwtDecodePromise(token, options) {
  return new Promise((resolve, reject) => {
    try {
      const decoded = jwt.decode(token, options);
      resolve(decoded);
    } catch (err) {
      reject(err);
    }
  });
}
/**
 * `crypto.randomBytes` promisified.
 * @param {number} length The length of the random Bytes.
 * @returns {Promise<Buffer>}
 */
function randomBytesPromise(length) {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(length, (err, buf) => {
      if (err) { reject(err); }
      resolve(buf);
    });
  });
}
/**
 * Closes this application's server.
 * @param {socketIO.Server} ioServer The Socket.IO server to close. The HTTP
 * server is accessible through this, so no HTTP server reference is needed.
 * @returns {Promise<void>}
 */
function closeServer(ioServer) {
  const SocketIOServer = socketIO;
  return new Promise((resolve, reject) => {
    if (ioServer instanceof SocketIOServer) {
      if (
        ioServer.httpServer instanceof http.Server &&
        ioServer.httpServer.listening === false
      ) {
        resolve(undefined);
        return;
      }
      ioServer.close(err => {
        if (err) { reject(err); }
        resolve(undefined);
      });
    }
  });
}
/**
 * Creates a socketIOAuth JWT, and sets the client in the
 * pendingClients map.
 * @param {import("qs").ParsedQs} query The query.
 * @param {"default"|Object<string, any>} payload The payload, if needed.
 * You could specify "default", which will use the default payload.
 * @param {express.request} req Request.
 * @param {express.response} res Response.
 * @param {express.NextFunction} next Next function.
 * @returns {Promise<string|false>}
 */
async function createSocketAuthJWT(query, payload, req, res, next) {
  // Generate the required parameters for the signing of the JWT.
  const utk = (await randomBytesPromise(16)).toString("hex");
  const jwtConfig = payload === "default" ?
    {
      pssPhrs: query.passPhrase,
      utk: utk,
      sub: config.securityOpts.validSubjectsMap.sockAuthCW,
      iss: config.serverConfig.appName,
      aud: config.serverConfig.appName
    } :
    Object.assign(payload, {
      sub: config.securityOpts.validSubjectsMap.sockAuthCW,
      iss: config.serverConfig.appName,
      aud: config.serverConfig.appName
    });
  let socketIoAuth = "";
  try {
    socketIoAuth = await jwtSignPromise(
      jwtConfig, init.jwtSecret, { expiresIn: config.securityOpts.maxTokenAge }
    );
  } catch (err) {
    sendError({
      logOpts: {
        doLog: true,
        loggerID: "Server-logger",
        logLevel: "error",
        logMessage: err.stack
      }
    })(req, res, next);
    return false;
  }
  await init.wsSessions.set(
    utk, {
      sessionData: {
        connected: false,
        joinedGame: false,
        playData: {},
        validationData: {
          utk: utk,
          passPhrase: query.passPhrase
        }
      }
    }
  );
  return socketIoAuth;
}
/**
 * Helper function to validate a JWT.
 * @param {string} token The JWT to validate.
 * @param  {...any} jwtConf Configurations to pass to the `jwt.verify` function.
 * @returns {Promise<SocketIOAuthPayload>}
 */
async function validateSocketAuthJWT(token, ...jwtConf) {
  /**
   * @type {SocketIOAuthPayload}
   */
  let decoded = {};
  // First, verify the JWT.
  try {
    decoded = await jwtVerifyPromise(token, ...jwtConf);
  } catch (err) {
    throw new ValidationError(
      JSON.stringify(err), "EFAILED",
      "Go back to the home page, don't mess with your cookies, " +
      "and don't mess with your JWT."
    );
  }

  // Then, check the unique token, and the passphrase.
  if (!decoded.utk || typeof decoded.utk !== "string") {
    throw new ValidationError(
      "Missing or invalid unique token!", "EMISSING",
      "Don't mess with your JWT, and don't try to forge one!"
    );
  } else if (!config.securityOpts.passPhrases.includes(decoded.pssPhrs)) {
    throw new ValidationError(
      "Invalid passphrase!", "EINVALID",
      "Don't mess with your JWT, and don't try to forge one!"
    );
  }

  // If all checks have been passed, return the decoded JWT.
  return decoded;
}
/**
 * Returns a function that gracefully shuts down this Node.JS application.
 * @param {Array<NodeJS.Timer>} intervals An array of intervals to clear.
 * @param {Array<socketIO.Socket>} ioConnections An array of Socket.IO
 * connections to close.
 * @param {socketIO.Server} ioServer The Socket.IO server to close.
 * @returns {ShutDownHandler}
 */
function shutDown(intervals, ioConnections, ioServer) {
  return async signal => {
    ServerLogger.info(
      `Received signal ${signal}. Shutting down application...`
    );
    intervals.forEach(interval => {
      clearInterval(interval);
    });
    ioConnections.forEach(conn => {
      conn.disconnect(true);
    });

    // If the HTTP server is already closed or closing, don't
    // proceed with this handler.
    if (
      ioServer.httpServer instanceof http.Server &&
      ioServer.httpServer.listening === false
    ) {
      ServerLogger.warning(
        "HTTP server is already in CLOSED or CLOSING state."
      );
      return;
    }

    await closeServer(ioServer);
    ServerLogger.info(
      "Server closed successfully. Exiting..."
    );
    // To be safe, exit after a second, in case there are still
    // asynchronous things that need to be done.
    setTimeout(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(0);
    }, 1000);
  };
}
/**
 * Handles an uncaught error in the Node.JS process.
 * @param {Array<NodeJS.Timer>} intervals An array of intervals to clear.
 * @param {Array<socketIO.Socket>} ioConnections An array of Socket.IO
 * connections to close.
 * @param {socketIO.Server} ioServer The Socket.IO server to close.
 * @returns {ExceptionHandler}
 */
function handleError(intervals, ioConnections, ioServer) {
  return async err => {
    // Clear intervals and connections so we could shutdown properly.
    intervals.forEach(interval => {
      clearInterval(interval);
    });
    ioConnections.forEach(socket => {
      socket.disconnect(true);
    });

    // Only try closing the HTTP server if the server is still
    // open.
    if (
      ioServer.httpServer instanceof http.Server &&
      ioServer.httpServer.listening === true
    ) {
      await closeServer(ioServer);
    }

    // We use a fatal log level because we couldn't recover from
    // the uncaught exception (at least not likely).
    ServerLogger.fatal("Server crashed. Error is:");
    ServerLogger.fatal(err.stack);
    ServerLogger.fatal("Exiting...");
    debug(`Is server listening? ${ioServer.httpServer.listening}`);
    // To be safe, exit after a second, in case there are still
    // asynchronous things that need to be done.
    setTimeout(() => {
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }, 1000);
  };
}

/**
 * Module exports.
 */
module.exports = exports = {
  // Functions.
  serveFile,
  handleOther,
  logReport,
  sendError,
  onWsProcessingError,
  jwtSignPromise,
  jwtVerifyPromise,
  jwtDecodePromise,
  createSocketAuthJWT,
  validateSocketAuthJWT,
  closeServer,
  shutDown,
  handleError,
  // Classes.
  ValidationError
};
