/**
 * @fileoverview The express router for the server
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Dependencies and stuff
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

// Homepage
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

// Game page
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

// About page
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

// Version page
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

// License Page
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

// CSP report uri
router.route("/CSP-report")
  .post((req, res, next) => {
    logCSPReport(req, res, next);
  });

// XHR route
router.route("/xhr")
  .get(async(req, res, next) => {
    const query = req.query;
    /**
     * @type {{}}
     */
    const cookies = req.signedCookies;
    const clientIP = req.ips.length < 1 ?
      req.ip :
      req.ips[0];

    // Security
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
      const gamesAvailable = manager.allGames.filter(game => {
        const isGameClosed = game.status === "Game is open";
        return isGameClosed;
      });
      const arrayLength = gamesAvailable.length;
      const dataToSend = {};

      for (let i = 0; i < arrayLength; i++) {
        dataToSend[gamesAvailable[i].id] = {
          id: gamesAvailable[i].id,
          mode: gamesAvailable[i].mode,
          numPlayers: gamesAvailable[i].numPlayers,
          gameToken: gamesAvailable[i].token,
          map: gamesAvailable[i].mapName
        };
      }

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
        socketIoAuth = await createSocketAuthJWT(query, req, res, next);
        if (!socketIoAuth) { return; }
      } else {
        try {
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
      const passPhrase =
        config.securityOpts.passPhrases[bind(
          Math.floor(Math.random() * config.securityOpts.passPhrases.length),
          0, config.securityOpts.passPhrases.length
        )];
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
      res
        .status(200)
        .send(JSON.stringify({
          passPhrase
        }));
      break;
    }
    default:
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

// All other routes
router.route("*")
  .get((req, res, next) => {
    handleOther(req, res, next);
  });
/**
 * Module exports
 */
module.exports = exports = router;
