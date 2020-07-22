/**
 * @fileoverview A file containing all of the common functions
 * @author Horton Cheng <horton0712@gmail.com>
 */

const fs = require("fs");
const path = require("path");
const express = require("express");
const init = require("./init");
const loggers = init.winstonLoggers;
const CSPLogger = loggers.get("CSP-logger");
const ServerLogger = loggers.get("Server-logger");

/**
 * Length error class
 */
class LengthError extends Error {}
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
  const s = fs.createReadStream(file);
  s.on("open", () => {
    res.type(path.extname(file).slice(1));
    s.pipe(res);
  });
  s.on("error", err => {
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
    `Someone used an unsupported method to try to access ${req.url} at: ${date}`
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
 * @param {Array<String>} allowed The allowed methods on this resource
 */
function methodNotAllowed(req, res, next, allowed) {
  const date = new Date();
  ServerLogger.notice(
    `Someone used a method that is not allowed at ${req.url} at: ${date}.`
  );
  res.type("html");
  res.header("Allow", allowed.join(", "));
  res.status(405)
    .send(
      "<h1>Not Allowed</h1>\n<h3>That method is not allowed on this page.</h3>"
    );
}
/**
 * Automatically handles the requests that requests for a file that is
 * not for public viewing and/or not found.
 * @param {express.request} req Client Request
 * @param {express.response} res Server Response
 * @param {express.NextFunction} next Next function
 */
function handleOther(req, res, next) {
  const date = new Date();
  let reqPath = req.url.toString().split("?")[0];

  if (reqPath === "/favicon.ico") {
    const s = fs.createReadStream(
      path.join(
        __dirname, "../../",
        "Public/Images/favicon.ico"
      )
    );
    s.on("open", () => {
      res.type(path.extname(reqPath).slice(1));
      s.pipe(res);
    });
    s.on("error", err => {
      ServerLogger.error(err);
      res.type("html");
      res.status(404)
        .send(
          "<h1>File Not Found</h1>\n" +
          "<h3>The file you requested was not found</h3>"
        );
    });
  } else {
    fs.stat(path.join(__dirname, "../../", reqPath), (err, stats) => {
      if (err) {
        reqPath = path.join(
          __dirname, "../../",
          "Public", reqPath
        );

        const s = fs.createReadStream(reqPath);
        s.on("open", () => {
          res.type(path.extname(reqPath).slice(1));
          s.pipe(res);
        });
        s.on("error", er => {
          ServerLogger.error(er);
          res.type("html");
          res.status(404)
            .send(
              "<h1>File Not Found</h1>\n" +
              "<h3>The file you requested was not found</h3>"
            );
        });
      } else {
        ServerLogger.notice(
          `Someone tried to access ${reqPath} at ` +
          `${date}. The request was blocked`
        );
        res.type("html");
        res.status(403)
          .send(
            "<h1>Forbidden</h1>\n" +
              "<h3>The file you requested is not for public viewing.</h3>"
          );
      }
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
  const reqData = [];
  req.on("data", chunk => {
    reqData.push(chunk);
  });
  req.on("end", () => {
    let parsedData = "";
    try {
      parsedData = JSON.stringify(
        JSON.parse(
          Buffer.concat(reqData).toString("utf-8")
        ), null, 3
      );
      if (
        Buffer.from(parsedData, "utf-8").byteLength >
        40 * 1024
      ) {
        throw new LengthError("Data too long.");
      }
      CSPLogger.warning(parsedData);
    } catch (err) {
      ServerLogger.error(err);
      if (err instanceof SyntaxError) {
        res.status(400).send("Bad Request.");
      } else if (err instanceof LengthError) {
        res.status(413).send("Payload Too Large.");
      } else {
        res.status(500).send("Internal Server Error.");
      }
    }
  });
}
/**
 * Export common server methods
 */
module.exports = exports = {
  serveFile,
  methodNotImplemented,
  methodNotAllowed,
  handleOther,
  logCSPReport
};
