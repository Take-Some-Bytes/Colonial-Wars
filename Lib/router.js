/**
 * @fileoverview The express router for the server.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Dependencies and modules.
const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");

const init = require("./common/init");
const {
  serveFile, handleOther, logCSPReport, sendError,
  jwtVerifyPromise, createSocketAuthJWT
} = require("./common/common");
const { bind } = require("./common/util");
const config = require("../config");

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

    serveFile(req, res, next, filePath,
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

    serveFile(req, res, next, filePath,
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

    serveFile(req, res, next, filePath,
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

    serveFile(req, res, next, filePath,
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

    serveFile(req, res, next, filePath,
      "<h1>Page Not Found.</h1>\n" +
    "<h3>Somehow the license page isn't where it used to be</h3>"
    );
  });
// CSP report route.
router.route("/CSP-report")
  .post((req, res, next) => {
    logCSPReport(req, res, next);
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
      sendError({
        httpOpts: {
          status: 400
        },
        logOpts: {
          loggerID: "Server-logger",
          logLevel: "notice",
          doLog: true,
          logMessage:
            `Someone tried to get: ${req.url} without a query. 
            Client IP: ${clientIP}.`
        }
      })(req, res, next);
      return;
    } else if (typeof query.for !== "string") {
      sendError({
        httpOpts: {
          status: 400
        },
        logOpts: {
          loggerID: "Server-logger",
          logLevel: "notice",
          doLog: true,
          logMessage:
            `Someone tried to get: ${req.url} without a for field in their 
             query. Client IP: ${clientIP}.`
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

      // TODO: Check if this should use `res.json();`.
      const stringifiedData = JSON.stringify(dataToSend);
      res
        .status(200)
        .send(stringifiedData);
      break;
    }
    case "license_text.html": {
      serveFile(
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
        sendError({
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
        socketIoAuth = await createSocketAuthJWT(query, req, res, next);
        if (!socketIoAuth) { return; }
      } else {
        // The client does have a socketIOAuth cookie. Verify it.
        try {
          // BUG: This is NOT right. We are not supposed to assign
          // the decoded socketIOAuth payload to the socketIoAuth
          // variable. It will accidentally be set.
          socketIoAuth = await jwtVerifyPromise(
            cookies.socketIOAuth, init.jwtSecret,
            {
              issuer: config.serverConfig.appName,
              audience: config.serverConfig.appName,
              maxAge: config.securityOpts.maxTokenAge,
              subject: config.securityOpts.validSubjectsMap.sockAuthCW,
              ignoreNotBefore: true
            }
          );
        } catch (err) {
          if (
            err instanceof jwt.NotBeforeError ||
            err instanceof jwt.JsonWebTokenError ||
            err instanceof jwt.TokenExpiredError
          ) {
            // TODO: See if this is what we want to do.
            socketIoAuth = await createSocketAuthJWT(query, req, res, next);
            if (!socketIoAuth) { return; }
          } else {
            sendError({
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
      // TODO: See if we should check the type of the `socketIoAuth` variable.
      // By checking it, we could avoid setting a non-intended value.
      if (socketIoAuth) {
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
      res
        .status(200)
        .send("OK");
      break;
    }
    case "passPhrases": {
      // Not sure why this won't be an array, but it doesn't hurt to check.
      if (!(config.securityOpts.passPhrases instanceof Array)) {
        sendError({
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
        sendError({
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
      // TODO: Check if this should use `res.json();`.
      res
        .status(200)
        .send(JSON.stringify({
          passPhrase
        }));
      break;
    }
    default:
      // By default, we'll send an error.
      sendError({
        httpOpts: {
          status: 400
        },
        logOpts: {
          loggerID: "Server-logger",
          logLevel: "notice",
          doLog: true,
          logMessage:
            `Someone tried to get: ${req.url} with an unrecognized for field.
            Client IP: ${clientIP}.`
        }
      })(req, res, next);
    }
  });

// Handling all other routes.
router.route("*")
  .get((req, res, next) => {
    handleOther(req, res, next);
  });
/**
 * Module exports.
 */
module.exports = exports = router;
