/**
 * @fileoverview The express router for the server.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Dependencies and modules.
const express = require("express");
const path = require("path");

const init = require("./common/init");
const common = require("./common/common");
const { bind } = require("./common/util");
const config = require("../config");
const util = require("./common/util");
// Keep debug here just in case.
// const debug = require("./common/debug");

const router = express.Router();

const manager = init.manager;
const morganLoggers = init.morganLoggers;

// Route logger.
router.use(morganLoggers.consoleLogger, morganLoggers.fileLogger);

// HTML page routing.
// TODO: Add HTML files for the About and Version page.
// Lobby page.
router.route("/")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/index.html"
    );

    common.serveFile(req, res, next, filePath,
      "<h1>Page Not Found.</h1>\n" +
      "<h3>Somehow the home page isn't where it used to be</h3>"
    );
  });
// Game page.
router.route("/play")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/play.html"
    );

    common.serveFile(req, res, next, filePath,
      "<h1>Page Not Found.</h1>\n" +
      "<h3>Somehow the play page isn't where it used to be</h3>"
    );
  });
// About page.
router.route("/about")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/about.html"
    );

    common.serveFile(req, res, next, filePath,
      "<h1>Page Not Found.</h1>\n" +
      "<h3>Somehow the about page isn't where it used to be</h3>"
    );
  });
// Version page.
router.route("/version")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/version.html"
    );

    common.serveFile(req, res, next, filePath,
      "<h1>Page Not Found.</h1>\n" +
      "<h3>Somehow the version page isn't where it used to be</h3>"
    );
  });
// License page.
router.route("/license")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/license.html"
    );

    common.serveFile(req, res, next, filePath,
      "<h1>Page Not Found.</h1>\n" +
    "<h3>Somehow the license page isn't where it used to be</h3>"
    );
  });
// CSP report route.
router.route("/CSP-report")
  .post((req, res, next) => {
    common.logCSPReport(req, res, next);
  });

// XHR route for requests made by client-side JavaScript.
router.route("/xhr")
  .get(async(req, res, next) => {
    // IDEA: Should we implement a check to MAKE SURE that the
    // request made to this route is made by client-side JS?
    // Like checking for a specific header?
    const query = req.query;
    /**
     * @type {Object<string, string>}
     */
    const cookies = req.signedCookies;
    // This is used to determine the real client IP, and shouldn't be needed.
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
          loggerID: "Server-logger",
          logLevel: "notice",
          doLog: true,
          logMessage:
            `Someone tried to get: ${req.url} without a query. ` +
            `Client IP: ${clientIP}.`
        }
      })(req, res, next);
      return;
    } else if (typeof query.for !== "string") {
      common.sendError({
        httpOpts: {
          status: 400
        },
        logOpts: {
          loggerID: "Server-logger",
          logLevel: "notice",
          doLog: true,
          logMessage:
            `Someone tried to get: ${req.url} without a for field in their ` +
            `query. Client IP: ${clientIP}.`
        }
      })(req, res, next);
      return;
    }

    switch (query.for) {
    case "games_available": {
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
        .json(dataToSend);
      break;
    }
    case "license_text.html": {
      common.serveFile(
        req, res, next,
        path.join(
          __dirname, "../",
          "Public/license_text.html"
        ), true
      );
      break;
    }
    case "socketIOAuth": {
      let socketIoAuth = "";
      // YOU MUST HAVE A PASSPHRASE!
      if (typeof query.passPhrase !== "string") {
        common.sendError({
          httpOpts: {
            status: 400
          },
          logOpts: {
            doLog: false
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
                logLevel: "notice",
                logMessage:
                  `${clientIP} tried to get a new JWT with an expired ` +
                  "JWT and no existing session."
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
                    logLevel: "notice",
                    logMessage:
                      `${clientIP} tried to get a new JWT with an expired ` +
                      "JWT and no existing session."
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
          }
        }
      }
      if (socketIoAuth && typeof socketIoAuth === "string") {
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
      // TODO: See if this should send HTTP 204 No Content.
      res
        .status(200)
        .end("OK");
      break;
    }
    case "passPhrases": {
      // Not sure why this won't be an array, but it doesn't hurt to check.
      if (!(config.securityOpts.passPhrases instanceof Array)) {
        common.sendError({
          logOpts: {
            doLog: true,
            loggerID: "Server-logger",
            logLevel: "error",
            logMessage:
              "Failed to send passPhrase! passPhrases config is not an array."
          }
        })(req, res, next);
        return;
      }
      // Get a random pass phrase.
      const passPhrase =
        config.securityOpts.passPhrases[bind(
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
        .json({
          passPhrase
        });
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
          logLevel: "notice",
          doLog: true,
          logMessage:
            `Someone tried to get: ${req.url} with an unrecognized for field.` +
            ` Client IP: ${clientIP}.`
        }
      })(req, res, next);
    }
  });

// Handling all other routes.
router.route("*")
  .get((req, res, next) => {
    common.handleOther(req, res, next);
  });
/**
 * Module exports.
 */
module.exports = exports = router;
