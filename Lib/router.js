/**
 * @fileoverview The express router for the server
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Dependencies and stuff
const express = require("express");
const fs = require("fs");
const path = require("path");
const init = require("./common/init");
const {
  serveFile, methodNotImplemented, handleOther, logCSPReport, methodNotAllowed
} = require("./common/common");

const router = express.Router();

const security = init.security;
const manager = init.manager;
const loggers = init.winstonLoggers;
const morganLoggers = init.morganLoggers;
const ServerLogger = loggers.get("Server-logger");

//Route logger and security thing
router.use(morganLoggers.consoleLogger, morganLoggers.fileLogger);
router.use((req, res, next) => {
  //Security
  security.setDefaultHeaders(req, res);
  next();
});

//Homepage
router.route("/")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/index.html"
    );

    serveFile(req, res, next, filePath,
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the home page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//Game page
router.route("/play")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/play.html"
    );

    serveFile(req, res, next, filePath,
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the play page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//About page
router.route("/about")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/about.html"
    );

    serveFile(req, res, next, filePath,
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the about page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//Version page
router.route("/version")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/version.html"
    );

    serveFile(req, res, next, filePath,
      "<h1>Page Not Found:(</h1>\n" +
      "<h3>Somehow the version page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//License Page
router.route("/license")
  .get((req, res, next) => {
    const filePath = path.join(
      __dirname, "../",
      "Public/license.html"
    );

    serveFile(req, res, next, filePath,
      "<h1>Page Not Found:(</h1>\n" +
    "<h3>Somehow the license page isn't where it used to be</h3>"
    );
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//CSP report uri
router.route("/CSP-report")
  .get((req, res, next) => methodNotAllowed(req, res, next, ["POST"]))
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
    if (!query) {
      ServerLogger.notice(
        `Someone tried to get: ${req.url} without a query. ` +
        `Request date: ${date}`
      );
      res
        .status(400)
        .send("No query supplied! Cannot process request.");
      return;
    } else if (!cookies.token || !cookies.clientID) {
      ServerLogger.notice(
        `Someone tried to get: ${req.url} without a token or ID with their ` +
        `cookies. Request date: ${date}`
      );
      res
        .status(401)
        .send("No token or ID specified in cookies!");
      return;
    }

    switch (query.for) {
    case "games_available": {
      const gamesAvailable = manager.allGames.filter(game => {
        const isGameClosed = !!game.status;
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
      const s = fs.createReadStream(
        path.join(
          __dirname, "../",
          "Public/license_text.html"
        )
      );
      let data = "";
      s.on("data", chunk => {
        data += chunk;
      });
      s.on("end", () => {
        const response = JSON.stringify({
          status: 200,
          html: data
        });
        res.send(response);
      });
      break;
    }
    default:
      ServerLogger.notice(
        `Someone tried to get: ${req.url} with an unrecognized for field. ` +
        `Request date: ${date}`
      );
      res
        .status(400)
        .send("Unrecognized for field! Cannot process request");
    }
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));

//All other routes
router.route("*")
  .get((req, res, next) => {
    handleOther(req, res, next);
  })
  .post((req, res, next) => methodNotAllowed(req, res, next, ["GET"]))
  .put((req, res, next) => methodNotImplemented(req, res, next))
  .delete((req, res, next) => methodNotImplemented(req, res, next));
/**
 * Module exports
 */
module.exports = exports = router;
