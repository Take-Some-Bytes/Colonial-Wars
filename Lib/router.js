/**
 * @fileoverview The express router for the server.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Dependencies and modules.
const express = require("express");

const common = require("./common/common");
const expressControllers = require("./controllers/express-controllers");
// Keep debug here just in case.
const debug = require("./common/debug");

const router = express.Router();

// HTML page routing.
// TODO: Add HTML files for the About and Version page.
// Lobby page.
router.route("/")
  .get(expressControllers.HTMLController("index.html"));
// Game page.
router.route("/play")
  .get(expressControllers.HTMLController("play.html"));
// About page.
router.route("/about")
  .get(expressControllers.HTMLController("about.html"));
// Version page.
router.route("/version")
  .get(expressControllers.HTMLController("version.html"));
// License page.
router.route("/license")
  .get(expressControllers.HTMLController("license.html"));
debug("Registered HTML route handlers.");
// CSP report route.
router.route("/CSP-report")
  .post(common.logReport);

// XHR route for requests made by client-side JavaScript.
router.route("/xhr")
  .get(expressControllers.XHRController);

// Handling all other routes.
router.route("*")
  .get(common.handleOther);
debug("Registered CSP report route, XHR route, and fallback handler.");
/**
 * Module exports.
 */
module.exports = exports = router;
