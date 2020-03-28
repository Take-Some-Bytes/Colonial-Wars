/**
 * @fileoverview The express router for the server
 * @author Horton Cheng <horton0712@gmail.com>
 * @version 1.0.0
 */

//Dependencies and stuff
const express = require("express");
const fs = require("fs");
const path = require("path");
var security = require("./Security").create(["GET", "POST", "HEAD"], false, false);
var router = express.Router();

/**
 * Automatically handles the requests that the server approves of.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 * @param {String} file The file to read
 * @param {String} response The response to send if an error occurs
 */
function serveFile(req, res, next, file, response) {
   //File reading
   var s = fs.createReadStream(file);
   s.on("open", () => {
      res.type(path.extname(file).slice(1));
      s.pipe(res);
   });
   s.on("error", err => {
      console.error(err);
      res.type("html");
      res.status(404).send(response);
   });
}

/**
 * Automatically handles the requests that uses a method that the server
 * doesn't support.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function methodNotImplemented(req, res, next) {
   res.type("html");
   res.status(501)
      .send("<h1>Method Not Supported</h1>\n<h3>That method is not supported.</h3>");
}

//Route logger and security thing
router.use((req, res, next) => {
   var reqPath = req.url.toString().split("?")[0];
   //Security
   security.setDefaultHeaders(req, res);
   var date = new Date();
   console.log("Request method: %s; Request URL: %s Request date: %s", req.method, req.url, date);
   next();
});

//Homepage
router.route("/")
   .get((req, res, next) => {
      serveFile(req, res, next, "Public/index.html", 
         "<h1>File Not Found!</h1>\n<h3>Somehow the home page isn't where it used to be</h3>");
   })
   .post((req, res, next) => methodNotImplemented(req, res, next))
   .put((req, res, next) => methodNotImplemented(req, res, next))
   .delete((req, res, next) => methodNotImplemented(req, res, next));

//Game page
router.route("/play")
   .get((req, res, next) => {
      serveFile(req, res, next, "Public/play.html", 
         "<h1>File Not Found!</h1>\n<h3>Somehow the game page isn't where it used to be</h3>");
   })
   .post((req, res, next) => methodNotImplemented(req, res, next))
   .put((req, res, next) => methodNotImplemented(req, res, next))
   .delete((req, res, next) => methodNotImplemented(req, res, next));

//About page
router.route("/about")
   .get((req, res, next) => {
      serveFile(req, res, next, "Public/about.html", 
         "<h1>File Not Found!</h1>\n<h3>Somehow the about page isn't where it used to be</h3>");
   })
   .post((req, res, next) => methodNotImplemented(req, res, next))
   .put((req, res, next) => methodNotImplemented(req, res, next))
   .delete((req, res, next) => methodNotImplemented(req, res, next));

//Version page
router.route("/version")
   .get((req, res, next) => {
      serveFile(req, res, next, "Public/version.html", 
         "<h1>File Not Found!</h1>\n<h3>Somehow the version page isn't where it used to be</h3>");
   })
   .post((req, res, next) => methodNotImplemented(req, res, next))
   .put((req, res, next) => methodNotImplemented(req, res, next))
   .delete((req, res, next) => methodNotImplemented(req, res, next));

/**
 * Module exports
 */
module.exports = exports = router;
