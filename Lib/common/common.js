/**
 * @fileoverview A file containing all of the common functions to the server.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const fs = require("fs");
const path = require("path");
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const init = require("./init");
// Keep the debug require here just so that if we need it, we'll have it.
// const debug = require("./debug");
const config = require("../../config");
// const util = require("util");
const loggers = init.winstonLoggers;
const SecurityLogger = loggers.get("Security-logger");

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
 * @typedef {"EINVALID"|"EMISSING"|"ENOEXIST"|"ENOTAUTH"|"EFAILED"} ErrorCodes
 */
/**
 * @typedef {import("../middleware").SocketIOAuthPayload} SocketIOAuthPayload
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
    res.type(_opts.httpOpts.contentType);
    res.cookie(
      "statusCode", _opts.httpOpts.status,
      { signed: true, sameSite: "strict" }
    );
    // Cehck if we need to log or not.
    if (_opts.logOpts.doLog) {
      // TODO: See if we should check if a logger exists or not before
      // attempting to log a message.
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
 * Serves a single file.
 * @param {express.request} req Client Request.
 * @param {express.response} res Server Response.
 * @param {express.NextFunction} next Next function.
 * @param {string} file The file to read.
 * @param {boolean} sendType Whether to send the `Content-Type` header.
 */
function serveFile(req, res, next, file, sendType) {
  // Open and pipe the file to the client.
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
 * Logs a CSP report.
 * @param {express.request} req Client Request.
 * @param {express.response} res Server Response.
 * @param {express.NextFunction} next Next function.
 */
function logCSPReport(req, res, next) {
  // Check if req.body is existent.
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

  // Then, check the unique token, the passphrase, and the client session.
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
 * Module exports.
 */
module.exports = exports = {
  // Functions.
  serveFile,
  handleOther,
  logCSPReport,
  sendError,
  jwtSignPromise,
  jwtVerifyPromise,
  jwtDecodePromise,
  createSocketAuthJWT,
  validateSocketAuthJWT,
  // Classes.
  ValidationError
};
