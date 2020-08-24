/**
 * @fileoverview A file containing all of the common functions
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const init = require("./init");
const debug = require("./debug");
const config = require("../../config");
const loggers = init.winstonLoggers;
const SecurityLogger = loggers.get("Security-logger");

/**
 * @typedef {Object} SendErrorOpts Options.
 * @prop {Object} [httpOpts]
 * @prop {Number} [httpOpts.status=500] HTTP status code. Default is 500.
 * @prop {String} [httpOpts.contentType="text/html"] HTTP content type.
 * Only required if ``opts.messageToSend`` is a ``Buffer`` or if the
 * content type is not HTML.
 * @prop {Object} [logOpts]
 * @prop {String} [logOpts.logMessage=""] The message to log. No default.
 * @prop {Boolean} [logOpts.doLog=false] Whether to log or not to log.
 * Default is false.
 * @prop {String} [logOpts.loggerID] The ID of the winston logger to use.
 * @prop {String} [logOpts.logLevel] The level to log at.
 * @prop {String|Buffer} [messageToSend] The error message to send. Default is
 * the cached error page from ``init.js``.
 */

/**
 * Sends an error to the client.
 * @param {SendErrorOpts} opts Options.
 * @returns {express.Handler}
 */
function sendError(opts) {
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
  /**
   * @type {SendErrorOpts}
   */
  let _opts = {};

  if (!opts) {
    _opts = defaults;
  } else {
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

  return (req, res, next) => {
    res.type(_opts.httpOpts.contentType);
    res.cookie(
      "statusCode", _opts.httpOpts.status,
      { signed: true, sameSite: "strict" }
    );
    if (_opts.logOpts.doLog) {
      loggers
        .get(_opts.logOpts.loggerID)[
          _opts.logOpts.logLevel
        ](_opts.logOpts.logMessage);
    }

    res
      .status(_opts.httpOpts.status)
      .send(_opts.messageToSend);
  };
}
/**
 * Automatically handles the requests that the server approves of.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 * @param {String} file The file to read
 * @param {Boolean} sendType Whether to send the `Content-Type` header.
 */
function serveFile(req, res, next, file, sendType) {
  // File reading
  const s = fs.createReadStream(file);
  s.on("open", () => {
    if (sendType) {
      res.type(path.extname(file).slice(1));
    }
    s.pipe(res);
  });
  s.on("error", err => {
    const is404 = err.code === "ENOENT";
    sendError({
      httpOpts: {
        status: is404 ? 404 : 500
      },
      logOpts: {
        doLog: true,
        loggerID: is404 ? "Server-logger" : "Security-logger",
        logLevel: "error",
        logMessage: err.stack
      }
    })(req, res, next);
  });
}
/**
 * Automatically handles the requests that requests for a file that is
 * not for public viewing and/or not found.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function handleOther(req, res, next) {
  const protocol = req.socket.encrypted ? "https:" : "http:";
  const reqPath = new URL(req.url, `${protocol}//${req.headers.host}`);
  const includesFavicon = reqPath.pathname.includes("/favicon.ico");
  let actualPath = path.join(__dirname, "../../Public", reqPath.pathname);

  if (includesFavicon) {
    actualPath = path.join(__dirname, "../../Public", "Images/favicon.ico");
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
 * Logs a CSP report
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function logCSPReport(req, res, next) {
  // Check if req.body is existent
  if (
    req.body &&
    typeof req.body === "object" &&
    req.body.constructor === Object &&
    req.body instanceof Object
  ) {
    // We have to be very careful!
    // We have no idea what there is in req.body.
    // Not much validation is done, since this is a development server.
    if (typeof req.body["csp-report"] === "object") {
      SecurityLogger.warning(JSON.stringify(req.body, null, 3));
      return;
    } else if (typeof req.body.type === "string") {
      SecurityLogger.warning(JSON.stringify(req.body, null, 3));
      return;
    }
    sendError({
      httpOpts: {
        status: 400
      },
      logOpts: {
        doLog: false
      }
    })(req, res, next);
  }
  sendError({
    httpOpts: {
      status: 400
    },
    logOpts: {
      doLog: false
    }
  })(req, res, next);
}
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
 * @returns {Promise<object>}
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
 * Creates a socketIOAuth JWT, and sets the client in the
 * pendingClients map.
 * @param {qs.ParsedQs} query The query.
 * @param {express.request} req Request.
 * @param {express.response} res Response.
 * @param {express.NextFunction} next Next function.
 */
async function createSocketAuthJWT(query, req, res, next) {
  const utk = crypto.randomBytes(16).toString("hex");
  const jwtConfig = {
    pssPhrs: query.passPhrase,
    utk: utk,
    sub: config.securityOpts.validSubjectsMap.sockAuthCW,
    iss: config.serverConfig.appName,
    aud: config.serverConfig.appName
  };
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
  init.pendingClients.set(
    utk, {
      connected: false,
      joinedGame: false,
      playData: {},
      validationData: {
        utk: utk,
        passPhrase: query.passPhrase
      }
    }
  );
  return socketIoAuth;
}

/**
 * Export common server methods
 */
module.exports = exports = {
  serveFile,
  handleOther,
  logCSPReport,
  sendError,
  jwtSignPromise,
  jwtVerifyPromise,
  createSocketAuthJWT
};
