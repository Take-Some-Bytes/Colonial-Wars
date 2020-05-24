/**
 * @fileoverview Express and Socket.IO middleware for stuff
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Imports
const qs = require("querystring");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const express = require("express");
const socketIO = require("socket.io");
const SessionStorage = require("./Security/SessionStorage");
const Manager = require("./Game/Manager");
const Constants = require("./Constants");
const { makeID } = require("./Util");
const loggers = require("./Common/init");
const ErrorLogger = loggers.get("Error-logger");
const ServerLogger = loggers.get("Server-logger");

/**
 * Parses the request url query.
 * @param {String} str Client request
 * @returns {Object}
 * @api public
 */
function parseURL(str) {
  const parsedQuery = qs.parse(str);
  return parsedQuery;
}
/**
 * Parses cookies
 * @param {String} secret The secret to parse signed cookies with
 * @returns {Function}
 * @api public
 */
function parseCookies(secret) {
  const fn = cookieParser(secret);
  return fn;
}
/**
 * Starts a session for the client
 * @param {String} clientToken The client's token
 * @param {String} clientID The ID of the client
 * @param {Number} sessionMaxAge The client's session's max age
 * @param {express.request} req Client request
 * @param {express.response} res Server response
 * @api private
 */
function startSession(clientToken, clientID, sessionMaxAge, req, res) {
  const token = clientToken;
  res.cookie("clientID", clientID, {
    signed: true,
    httpOnly: true
  });
  res.cookie("token", token, {
    maxAge: sessionMaxAge,
    signed: true,
    httpOnly: true
  });
}
/**
 * Basically a checkpoint to check stuff for express
 * @param {SessionStorage} storage The session storage to work with
 * @param {String} serverToken The server's token
 * @returns {Function}
 * @api public
 */
function checkPoint(storage, serverToken) {
  return function(req, res, next) {
    const cookies = req.signedCookies;
    if(!cookies.clientID && !cookies.token) {
      const token = crypto.randomBytes(16).toString("hex");
      const id = makeID(20);
      const startTime = Date.now();
      const maxAge = storage.maxAge;
      try {
        storage.addNewSession({
          serverToken: serverToken,
          id: id,
          token: token,
          startTime: startTime,
          maxAge: maxAge,
          otherData: {
            requestsInSession: 1,
            requestLessStreak: 0
          }
        });
      } catch(err) {
        ErrorLogger.error(err);
        ServerLogger.error(err);
        res.set("Content-type", "text/html");
        res
          .status(500)
          .send("<h1>Uh, something went wrong...</h1>");
      }
      startSession(token, id, maxAge, req, res);
      next();
    } else if(!cookies.clientID && cookies.token) {
      res.set("Content-type", "text/html");
      res
        .status(401)
        .send("<h1>No client ID specified!</h1>");
    } else if(cookies.clientID && !cookies.token) {
      try {
        storage.refresh(cookies.clientID);
      } catch(err) {
        console.error(err);
        res.set("Content-type", "text/html");
        res
          .status(401)
          .send("<h1>Hmm, it looks like your session does not exist.</h1>");
      }
    } else {
      const session = storage.getSessionInfo(cookies.clientID);
      if(!session) {
        res.set("Content-type", "text/html");
        res
          .status(401)
          .send("<h1>Hmm, it looks like your session does not exist.</h1>");
        return;
      }
      if(cookies.token !== session.token) {
        res.set("Content-type", "text/html");
        res
          .status(401)
          .send("<h1>Hmm, it looks like your token is invalid.</h1>");
        return;
      }
      const newSessionStats =
        storage.getSessionInfo(cookies.clientID).storedData;
      storage.addDataToSession({
        id: cookies.clientID,
        token: cookies.token,
        dataToAdd: {
          requestsInSession: newSessionStats.requestsInSession + 1,
          requestLessStreak: 0
        }
      });
      next();
    }
  }
}

/**
 * Socket.io new client checkpoint
 * @param {SessionStorage} storage The session storage for socket.io
 * @param {String} serverToken The server's token
 * @returns {Function}
 */
function socketNewClientCP(storage, serverToken) {
  return function(socket, next) {
    const clientID = socket.id;
    const token = crypto.randomBytes(16).toString("hex");
    const startTime = Date.now();
    const maxAge = storage.maxAge;
    try {
      storage.addNewSession({
        serverToken: serverToken,
        id: clientID,
        token: token,
        startTime: startTime,
        maxAge: maxAge
      });
    } catch(err) {
      console.error(err);
      socket.emit(Constants.SOCKET_ERROR, JSON.stringify({
        securityData: {
          serverToken
        },
        playerData: {},
        otherData: {
          status: "error",
          msg: "Something happened..."
        }
      }));
      socket.disconnect(true);
      return;
    }
    socket.emit(Constants.SOCKET_SECURITY_DATA, JSON.stringify({
      securityData: {
        serverToken: serverToken,
        clientData: {
          token: token,
          id: clientID
        }
      },
      playerData: {},
      otherData: {
        status: "success"
      }
    }));
    next();
  }
}
/**
 * Socket.io client emit checkpoint
 * @param {String} serverToken The server's token
 * @param {socketIO.Socket} socket The socket object associated with the
 * client
 * @returns {Function}
 */
function socketEmitCP(serverToken, socket) {
  return function(packet, next) {
    const packetData = JSON.parse(packet[1]);
    const clientData = packetData.securityData.clientData;
    if(!clientData.id) {
      socket.emit(Constants.SOCKET_ERROR, JSON.stringify({
        securityData: {
          serverToken
        },
        playerData: {},
        otherData: {
          status: "error",
          msg: "No id specified!"
        }
      }));
      socket.disconnect(true);
      return;
    } else if(!clientData.token) {
      socket.emit(Constants.SOCKET_ERROR, JSON.stringify({
        securityData: {
          serverToken
        },
        playerData: {},
        otherData: {
          status: "error",
          msg: "No token specified!"
        }
      }));
      socket.disconnect(true);
      return;
    }
    next();
  }
}
/**
 * Checkpoint for the socket.io namespaces
 * @param {SessionStorage} storage The session storage that you use
 * for socket.io session handling
 * @param {Manager} manager The manager object used for game managing
 * @param {String} serverToken The server's token
 * @returns {Function}
 */
function nspCheckPoint(storage, manager, serverToken) {
  return function(socket, next) {
    const prevClientID = socket.handshake.query.prevSocketID;
    const session = storage.getSessionInfo(prevClientID);
    const client = manager.getClient(prevClientID);
    if(!prevClientID || !session || !client) {
      socket.emit(Constants.SOCKET_ERROR, JSON.stringify({
        securityData: {
          serverToken
        },
        playerData: {},
        otherData: {
          status: "error",
          msg: "It looks like your session does not exist or" +
            " you have not been to the main page."
        }
      }));
      return;
    }
    next();
  }
}
/**
 * Changes a client's stats
 * @param {SessionStorage} storage The session storage for ws sessions
 * @param {Manager} manager The manager you are using
 * @returns {Function}
 */
function nspChangeStats(storage, manager) {
  return function(socket, next) {
    const query = socket.handshake.query;
    storage.changeSessionID(socket.id, query.prevSocketID);
    manager.changeStats({
      id: socket.id,
      token: storage.getSessionInfo(socket.id).token,
      socket: socket
    }, query.prevSocketID);
    next();
  }
}
/**
 * Checks if the client is in the pendingClients object
 * @param {Object} pendingClients The pending clients
 * object that you store pending clients in
 * @param {String} serverToken The server's token
 * @returns {Function}
 */
function nspCheckIsPending(pendingClients, serverToken) {
  return function(socket, next) {
    const prevClientID = socket.handshake.query.prevSocketID;
    const pending = pendingClients[prevClientID];
    if(!pending) {
      socket.emit(Constants.SOCKET_ERROR, JSON.stringify({
        securityData: {
          serverToken
        },
        playerData: {},
        otherData: {
          status: "error",
          msg: "It looks like your session does not exist or" +
            " you have not been to the main page."
        }
      }));
      return;
    }
    next();
  }
}

module.exports = {
  parseURL,
  parseCookies,
  checkPoint,
  socketNewClientCP,
  socketEmitCP,
  nspCheckPoint,
  nspChangeStats,
  nspCheckIsPending
}