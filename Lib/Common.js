/**
 * @fileoverview A file containing all of the common functions
 * @author Horton Cheng <horton0712@gmail.com>
 * @version
 */

const fs = require("fs");
const path = require("path");
const qs = require("querystring");
const express = require("express");
const loggers = require("./Winstoninit");
var CSPLogger = loggers.get("CSP-logger");
var ServerLogger = loggers.get("Server-logger");

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
      ServerLogger.error(err);
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
   const date = new Date();
   ServerLogger.notice(
      `Someone used an unsupported method to try to access this page: ${req.url} at: ${date}.`
   );
   res.type("html");
   res.status(501)
      .send("<h1>Not Implemented</h1>\n<h3>That method is not implemented.</h3>");
}
/**
 * Automatically handles the requests that use a method that is not allowed on 
 * the resource that is requested.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function methodNotAllowed(req, res, next) {
   const date = new Date();
   ServerLogger.notice(
      `Someone used a method that is not allowed on this page: ${req.url} at: ${date}.`
   );
   res.type("html");
   res.status(405)
      .send("<h1>Not Allowed</h1>\n<h3>That method is not allowed on this page.</h3>");
}
/**
 * Automatically handles the requests that requests for a file that is
 * not for public viewing and/or not found.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function handleOther(req, res, next) {
   const reqPath = req.url.toString().split("?")[0];
   const date = new Date();
   if(reqPath.indexOf(
      "/Public/"
   ) !== 0 && reqPath.indexOf(
      "/Shared/"
   ) !== 0) {
      ServerLogger.notice(
         `Someone tried to access this page: ${reqPath} at ${date}. The request was blocked`
      );
      res.type("html");
      res.status(403)
         .send(
            "<h1>Forbidden</h1>\n<h3>The file you requested is not for public viewing.</h3>"
         );
   } else {
      var s = fs.createReadStream(reqPath.slice(1));  
      s.on("open", () => {
         res.type(path.extname(reqPath).slice(1));
         s.pipe(res);
      });
      s.on("error", err => {
         console.error(err);
         ServerLogger.error(err);
         res.type("html");
         res.status(404)
            .send(
               "<h1>File Not Found</h1>\n<h3>The file you requested was not found</h3>"
            );
      });
   }
}
/**
 * Logs a CSP report
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function logCSPReport(req, res, next) {
   let reqData = null;
   req.on("data", chunk => {
      reqData = chunk;
      if(reqData.length > 40 * 1000) {
         ServerLogger.warning(
            "Apparently the CSP sent a POST request that was too large. Please verify it."
         );
         res.type("html");
         res.status(413).send("<h1>POST entity too large</h1>");
      }
   });
   req.on("end", () => {
      reqData = JSON.parse(reqData);
      reqData = JSON.stringify(reqData, null, 3);
      CSPLogger.warning(reqData);
   });
}

/**
 * Module exports
 */
module.exports = exports = {
   serveFile,
   methodNotImplemented,
   methodNotAllowed,
   handleOther,
   logCSPReport
};
