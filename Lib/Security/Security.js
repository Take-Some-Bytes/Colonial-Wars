/**
 * @fileoverview This is a Security class, made for
 * enforcing security on a http or https server with the express framework.
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Dependencies
const { response, request } = require("express");
const path = require("path");

/**
 * Security class
 */
class Security {
  /**
    * Security class for enforcing security on a https or http server.
    * Please only use if you are using an express server
    * @constructor
    * @param {Array<string>} allowed_methods allowed methods
    * for accessing the server
    * @param {Boolean} HTTPS Is the server a https server?
    * @param {Boolean} HSTS_PRLD_LIST_SUBM is the server
    * registered with the HSTS Preload List Submission?
    */
  constructor(allowed_methods, HTTPS, HSTS_PRLD_LIST_SUBM) {
    this.allowed_methods = allowed_methods;
    this.HTTPS = HTTPS;
    this.HSTS_PRLD_LIST_SUBM = HSTS_PRLD_LIST_SUBM;
    this.status = null;
  }
  /**
    * Sets the default headers on a https or http server
    * @param {request} req Client request
    * @param {response} res Server response
    */
  setDefaultHeaders(req, res) {
    res.set({
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' https://ajax.googleapis.com/; " +
        "style-src 'self' https://*.googleapis.com/ https://*.gstatic.com/; " +
        "font-src https://*.googleapis.com/ https://*.gstatic.com/; " +
        "img-src 'self' data: ; child-src 'self'; media-src 'none'; " +
        "object-src 'none'; base-uri 'self'; " +
        "connect-src 'self' https://*.googleapis.com/ " +
        "https://*.gstatic.com/; report-uri logs/CSP-reports.log; " +
        "frame-ancestors 'none'; form-action 'self'",
      "X-XSS-Protection": "1; mode=block",
      "X-Content-Type-Options": "nosniff"
    });
  }
  /**
    * Sets strict headers for confidental data control
    * @param {request} req Client request
    * @param {response} res Server response
    */
  setStrictHeaders(req, res) {
    res.set({
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "-1"
    });
  }
  /**
    * Sets a https only header
    *
    * ***REQUIRES HSTS PRELOAD LIST SUBMISSION***
    * @param {request} req Client request
    * @param {response} res Server response
    */
  enforceHTTPS(req, res) {
    if (!this.HTTPS || !this.HSTS_PRLD_LIST_SUBM) {
      throw new Error(
        "Header is only for HTTPS " +
        "servers registered with the HSTS preload list submission."
      );
    }
    res.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  /**
    * Checks the requested method,
    * and sees if it follows the allowed methods array.
    * Returns a string reporting whether there is an error or not.
    * @param {request} req Client request
    * @param {response} res Server response
    * @returns {String}
    */
  checkMethod(req, res) {
    for (let i = 0; i < this.allowed_methods.length; i++) {
      if (// eslint-disable-next-line eqeqeq
        req.method != this.allowed_methods[i] &&
        // eslint-disable-next-line eqeqeq
        i == this.allowed_methods.length - 1
      ) {
        res.type("html");
        res.status(501)
          .send(
            "<h1>Method Not Implemented</h1>\n" +
            "<h3>That method is not implemented.</h3>"
          );
        this.status = "error";
        return this.status;
        // eslint-disable-next-line eqeqeq
      } else if (req.method == this.allowed_methods[i]) {
        this.status = "success";
        return this.status;
      }
    }
  }
  /**
    * Checks to see if the requested file is for public viewing.
    * Returns a string reporting whether there is an error or not.
    * @param {request} req Client request
    * @param {response} res Server response
    * @param {Array<string>} allowed_paths The paths that you will
    * allow clients to request for
    * @param {String} reqFile The requested file
    * @returns {String}
    */
  checkRequest(req, res, allowed_paths, reqFile) {
    for (let i = 0; i < allowed_paths.length; i++) {
      if (
        reqFile.indexOf(allowed_paths[i] + path.sep) !== 0 &&
        i === allowed_paths.length - 1
      ) {
        res.type("html");
        res.status(403)
          .send(
            "<h1>That is forbidden.</h1>\n" +
            "<h3>The requested page is not for the public.</h3>"
          );
        this.status = "error";
        return this.status;
      } else if (reqFile.indexOf(allowed_paths[i] + path.sep) === 0) {
        this.status = "success";
        return this.status;
      }
    }
  }
  /**
    * Factory method for the Security class
    * @param {Array<string>} allowed_methods allowed methods
    * for accessing the server
    * @param {Boolean} HTTPS Is the server a https server?
    * @param {Boolean} HSTS_PRLD_LIST_SUBM is the server registered with the
    * HSTS Preload List Submission?
    * @returns {Security}
    */
  static create(allowed_methods, HTTPS, HSTS_PRLD_LIST_SUBM) {
    return new Security(allowed_methods, HTTPS, HSTS_PRLD_LIST_SUBM);
  }
}
/**
 * Module exports
 */
module.exports = exports = Security;
