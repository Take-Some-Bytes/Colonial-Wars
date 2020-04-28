/**
 * @fileoverview The express router for the server
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Dependencies and stuff
const express = require("express");
const security = require("./Security").create(
  ["GET", "POST", "HEAD"], false, false
);
const router = express.Router();
const {
  serveFile, methodNotImplemented, handleOther, logCSPReport, methodNotAllowed
} = require("./Common/Common");


//Route logger and security thing
router.use((req, res, next) => {
  const reqPath = req.url.toString().split("?")[0];
  //Security
  security.setDefaultHeaders(req, res);
  const date = new Date();
  console.log(
    "Request method: %s; Request URL: %s Request date: %s",
    req.method, reqPath, date
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
