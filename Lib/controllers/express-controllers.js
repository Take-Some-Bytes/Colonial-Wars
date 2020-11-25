/**
 * @fileoverview Express route controllers.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Dependencies and modules
const express = require("express");
const path = require("path");

const common = require("../common/common");
const init = require("../common/init");
const util = require("../common/util");
const config = require("../../config");

const manager = init.manager;

// First, the private handler functions.
/**
 * Handler to serve up the available games. Should not be used by itself.
 * @param {express.response} res Server response. Only this is needed
 * because this function does not access client request props.
 */
function gamesAvailableHandler(res) {
  // Get statistics about the available games, and send
  // it to the client.
  // IDEA: Maybe we should add a getter method to get all the
  // available games?
  const gamesAvailable = manager.allGames.filter(game => {
    const isGameClosed = game.status === "Game is open";
    return isGameClosed;
  });
  const arrayLength = gamesAvailable.length;
  const dataToSend = {};

  for (let i = 0; i < arrayLength; i++) {
    // TODO: Also send a game name and what teams are available.
    dataToSend[gamesAvailable[i].id] = {
      id: gamesAvailable[i].id,
      mode: gamesAvailable[i].mode,
      numPlayers: gamesAvailable[i].numPlayers,
      gameToken: gamesAvailable[i].token,
      map: gamesAvailable[i].mapName
    };
  }

  res
    .status(200)
    .type("json")
    .json(dataToSend);
}
/**
 * Handles sending passphrases to the client.
 * @param {express.request} req Client request.
 * @param {express.response} res Server response.
 * @param {express.NextFunction} next Next function.
 */
function passPhraseHandler(req, res, next) {
  // Not sure why this won't be an array, but it doesn't hurt to check.
  if (!(config.securityOpts.passPhrases instanceof Array)) {
    common.sendError({
      logOpts: {
        doLog: true,
        loggerID: "Server-logger",
        logLevel: "fatal",
        logMessage:
          "Failed to send passPhrase! passPhrases config is not an array."
      }
    })(req, res, next);
    return;
  }
  // Get a random pass phrase.
  const passPhrase =
    config.securityOpts.passPhrases[util.bind(
      Math.floor(Math.random() * config.securityOpts.passPhrases.length),
      0, config.securityOpts.passPhrases.length
    )];
  // If the pass phrase is not a string, then... that's not good.
  if (typeof passPhrase !== "string") {
    common.sendError({
      logOpts: {
        doLog: true,
        loggerID: "Server-logger",
        logLevel: "error",
        logMessage:
          "Failed to send passPhrase! Selected passPhrase is not a string."
      }
    })(req, res, next);
    return;
  }
  res
    .status(200)
    .type("json")
    .json({
      passPhrase
    });
}
/**
 * Handles the giving of the Socket.IO Authorization.
 * @param {import("qs").ParsedQs} query The client query.
 * @param {Object<string, string>} cookies The client's cookies.
 * @param {string} clientIP The client's IP.
 * @returns {express.Handler}
 */
function ioAuthHandler(query, cookies, clientIP) {
  return async(req, res, next) => {
    let socketIoAuth = "";
    // YOU MUST HAVE A PASSPHRASE!
    if (typeof query.passPhrase !== "string") {
      common.sendError({
        httpOpts: {
          status: 400
        },
        logOpts: {
          loggerID: "Security-logger",
          logLevel: "warning",
          doLog: true,
          logMessage:
            `Client IP ${clientIP} tried to get a sockIOAuth/JWT token` +
            ` without a passphrase. Request URL is: ${req.url}.`
        }
      })(req, res, next);
      return;
    }
    if (typeof cookies.socketIOAuth !== "string" || !cookies.socketIOAuth) {
      // The client does not have a socketIOAuth cookie. Create one.
      socketIoAuth =
        await common.createSocketAuthJWT(query, "default", req, res, next);
      // The above function will return false if a response has already
      // been sent.
      if (!socketIoAuth) { return; }
    } else {
      try {
        const decoded = await common.validateSocketAuthJWT(
          cookies.socketIOAuth, init.jwtSecret,
          {
            issuer: config.serverConfig.appName,
            audience: config.serverConfig.appName,
            maxAge: config.securityOpts.maxTokenAge,
            subject: config.securityOpts.validSubjectsMap.sockAuthCW,
            ignoreNotBefore: true
          }
        );
        const realExpiry = new Date(decoded.exp * 1000);
        const sess = await init.wsSessions.get(decoded.utk);
        // If the session does not exist then stop right here.
        if (!sess) {
          common.sendError({
            httpOpts: {
              status: 401
            },
            logOpts: {
              doLog: true,
              loggerID: "Security-logger",
              logLevel: "warning",
              logMessage:
                `Client IP ${clientIP} tried to get a new JWT with` +
                " no existing session."
            }
          })(req, res, next);
          return;
        }
        if (Date.now() - realExpiry <= 1000 * 60 * 5) {
          socketIoAuth =
            await common.createSocketAuthJWT(
              query, {
                utk: decoded.utk,
                pssPhrs: sess.sessionData.validationData.passPhrase
              }, req, res, next
            );
          // The above function will return false if a response has already
          // been sent.
          if (!socketIoAuth) { return; }
        }
      } catch (err) {
        if (err instanceof common.ValidationError) {
          const isJson = util.isJson(err.message);
          if (isJson && isJson.name === "TokenExpiredError") {
            // Unsafe decoding, but whatever.
            const unsafeDecoded = await common.jwtDecodePromise(
              cookies.socketIOAuth
            );
            // If the session does not exist then stop right here.
            const sess = await init.wsSessions.get(
              unsafeDecoded.utk
            );
            if (!sess) {
              common.sendError({
                httpOpts: {
                  status: 401
                },
                logOpts: {
                  doLog: true,
                  loggerID: "Security-logger",
                  logLevel: "warning",
                  logMessage:
                    `Client IP ${clientIP} tried to get a new JWT with an ` +
                    "expired JWT and no existing session."
                }
              })(req, res, next);
              return;
            }
            // Create a new JWT for this client because it expired.
            socketIoAuth =
              await common.createSocketAuthJWT(
                query, {
                  utk: unsafeDecoded.utk,
                  pssPhrs: sess.sessionData.validationData.passPhrase
                }, req, res, next
              );
            // The above function will return false if a response has already
            // been sent.
            if (!socketIoAuth) { return; }
          }
        } else {
          common.sendError({
            httpOpts: {
              status: 500
            },
            logOpts: {
              doLog: true,
              loggerID: "Server-logger",
              logLevel: "error",
              logMessage: err.stack
            }
          })(req, res, next);
          return;
        }
      }
    }
    if (socketIoAuth && typeof socketIoAuth === "string") {
      // Send the socketIOAuth only if it is a string.
      res.cookie(
        "socketIOAuth", socketIoAuth,
        {
          signed: true,
          maxAge: config.securityOpts.maxTokenAge,
          sameSite: "strict",
          httpOnly: true
        }
      );
    }
    // Now that we don't use jQuery AJAX, we could send 204.
    res
      .status(204)
      .end();
  };
}
// Now, the public controller functions.
/**
 * Serves up the HTML pages.
 * @param {string} fileName The name of the file to serve. Only name is needed,
 * root directory of public files is retreived through app configurations.
 * @returns {express.Handler}
 */
function HTMLController(fileName) {
  const filePath = path.join(
    config.serverConfig.rootDirs.publicRoot,
    fileName
  );

  return (req, res, next) => {
    common.serveFile(req, res, next, filePath, true);
  };
}
/**
 * Main controller for XHR requests.
 * @param {express.request} req Client request.
 * @param {express.response} res Server response.
 * @param {express.NextFunction} next Next function.
 */
function XHRController(req, res, next) {
  // IDEA: Should we implement a check to MAKE SURE that the
  // request made to this route is made by client-side JS?
  // Like checking for a specific header?
  const query = req.query;
  /**
   * @type {Object<string, string>}
   */
  const cookies = req.signedCookies;
  const clientIP = req.ips.length < 1 ?
    req.ip :
    req.ips[0];

  // YOU MUST HAVE A QUERY!
  if (Object.keys(query).length === 0 && query.constructor === Object) {
    common.sendError({
      httpOpts: {
        status: 400
      },
      logOpts: {
        loggerID: "Security-logger",
        logLevel: "notice",
        doLog: true,
        logMessage:
          `Client IP ${clientIP} tried to get ${req.url} without a query.`
      }
    })(req, res, next);
    return;
  } else if (typeof query.for !== "string") {
    common.sendError({
      httpOpts: {
        status: 400
      },
      logOpts: {
        loggerID: "Security-logger",
        logLevel: "notice",
        doLog: true,
        logMessage:
          `Client IP ${clientIP} tried to get ${req.url} without a "for"` +
          " field in their query."
      }
    })(req, res, next);
    return;
  }

  switch (query.for) {
  case "games_available": {
    gamesAvailableHandler(res);
    break;
  }
  case "license_text.html": {
    // Simple: serve the damn file.
    common.serveFile(
      req, res, next,
      path.join(
        __dirname, "../../",
        "Public/license_text.html"
      ), true
    );
    break;
  }
  case "socketIOAuth": {
    ioAuthHandler(query, cookies, clientIP)(req, res, next);
    break;
  }
  case "passPhrases": {
    passPhraseHandler(req, res, next);
    break;
  }
  default:
    // By default, we'll send an error.
    common.sendError({
      httpOpts: {
        status: 400
      },
      logOpts: {
        loggerID: "Server-logger",
        logLevel: "error",
        doLog: true,
        logMessage:
          `Client IP ${clientIP} tried to get ${req.url} with an` +
          " unrecognized \"for\" field."
      }
    })(req, res, next);
  }
}

/**
 * Export controllers.
 */
module.exports = exports = {
  HTMLController,
  XHRController
};
