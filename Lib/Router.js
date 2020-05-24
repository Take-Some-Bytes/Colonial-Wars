/**
 * @fileoverview The express router for the server
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Dependencies and stuff
const express = require("express");
const security = require("./Security/Security").create(
  ["GET", "POST", "HEAD"], false, false
);
const router = express.Router();
const {
  serveFile, methodNotImplemented, handleOther, logCSPReport, methodNotAllowed
} = require("./Common/Common");
const loggers = require("./Common/init");
const RequestLogger = loggers.get("Request-logger");
const ErrorLogger = loggers.get("Error-logger");
const ServerLogger = loggers.get("Server-logger");
const { manager } = require("./Common/init");

//Route logger and security thing
router.use((req, res, next) => {
  const reqPath = req.url.toString().split("?")[0];
  //Security
  security.setDefaultHeaders(req, res);
  //Logging
  const date = new Date();
  RequestLogger.info(
    `Request method: ${req.method}; ` +
    `Request Path: ${reqPath}; Request full URL: ${req.url}`
  );
  next();
});

//Homepage
router.route("/")
  .get((req, res, next) => {
    serveFile(req, res, next, "Public/index.html",
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the home page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//Game page
router.route("/play")
  .get((req, res, next) => {
    serveFile(req, res, next, "Public/play.html",
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the play page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//About page
router.route("/about")
  .get((req, res, next) => {
    serveFile(req, res, next, "Public/about.html",
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the about page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//Version page
router.route("/version")
  .get((req, res, next) => {
    serveFile(req, res, next, "Public/version.html",
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the version page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//CSP report uri
router.route("/logs/CSP-reports.log")
  .get((req, res, next) => methodNotAllowed(req, res, next))
  .post((req, res, next) => {
    logCSPReport(req, res, next);
  })
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//XHR route
router.route("/xhr")
  .get((req, res, next) => {
    const query = req.query;
    const date = new Date();
    const cookies = req.signedCookies;

    //Security
    if(!query) {
      ServerLogger.notice(
        `Someone tried to get: ${req.url} without a query. ` +
        `Request date: ${date}`
      );
      res
        .status(400)
        .send("No query supplied! Cannot process request.");
      return;
    } else if(!query.token || !query.clientID) {
      ServerLogger.notice(
        `Someone tried to get: ${req.url} without a token or ID in the query.` +
        ` Request date: ${date}`
      );
      res
        .status(401)
        .send("No token or ID specified in query!");
      return;
    } else if(!cookies.token || !cookies.clientID) {
      ServerLogger.notice(
        `Someone tried to get: ${req.url} without a token or ID with their ` +
        `cookies. Request date: ${date}`
      );
      res
        .status(401)
        .send("No token or ID specified in cookies!");
      return;
    }

    switch(query.for) {
    case "games_available": {
      const gamesAvailable = manager.allGames.filter(game => {
        const isGameClosed = !!game.status;
        return isGameClosed;
      });
      const arrayLength = gamesAvailable.length;
      const dataToSend = {};

      for(let i = 0; i < arrayLength; i++) {
        dataToSend[gamesAvailable[i].id] = {
          id: gamesAvailable[i].id,
          mode: gamesAvailable[i].mode,
          numPlayers: gamesAvailable[i].numPlayers,
          gameToken: gamesAvailable[i].token,
          map: gamesAvailable[i].mapName
        }
      }

      const stringifiedData = JSON.stringify(dataToSend);
      res
        .status(200)
        .send(stringifiedData);
      break;
    }
    default:
      ServerLogger.notice(
        `Someone tried to get: ${req.url} without a for field. ` +
        `Request date: ${date}`
      );
      res
        .status(400)
        .send("No for field! Cannot process request");
    }
  })
  .post((req, res, next) => methodNotAllowed(req, res, next))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//All other routes
router.route("*")
  .get((req, res, next) => {
    handleOther(req, res, next);
  })
  .post((req, res, next) => methodNotAllowed(req, res, next))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));
/**
 * Module exports
 */
module.exports = exports = router;
