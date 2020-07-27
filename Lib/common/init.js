/**
 * @fileoverview Winston logger and stuff initialization file
 * @author Horton Cheng <horton0712@gmail.com>
 */
//Import required 3rd party modules.
const winston = require("winston");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { IncomingMessage, ServerResponse } = require("http");
//Import required custom modules
const Constants = require("./constants");
const { makeID, mixUp } = require("./util");
const config = require("../../config");

const Manager = require("../Game/Manager");
const Security = require("../Security/Security");
const SessionStorage = require("../Security/SessionStorage");

//Make exports the same as module.exports.
exports = module.exports;

/**
 * @typedef {Function} Handler
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 * @param {express.NextFunction} next
 * @returns {void}
 */
/**
 * @typedef {Object} MorganLoggers
 * @prop {Handler} consoleLogger
 * @prop {Handler} fileLogger
 */
/**
 * @typedef {Object} Loggers
 * @prop {winston.Container} winstonLoggers
 * @prop {MorganLoggers} [morganLoggers]
 */
/**
 * @typedef {Object} WinstonTransports
 * @prop {{
 * allLevelConsole: winston.transports.ConsoleTransportInstance
 * }} consoleTransports
 * @prop {{
 * combined: winston.transports.FileTransportInstance,
 * errors: winston.transports.FileTransportInstance,
 * process: winston.transports.FileTransportInstance
 * security: winston.transports.FileTransportInstance
 * }|null} fileTransports
 */
/**
 * @typedef {Function} EmptyMiddleware
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 * @returns {void}
 */

//Create a token in morgan
morgan.token("reqPath", (req, res) => {
  const protocol = config.httpsConfig.isHttps ? "https:" : "http:";
  const url = new URL(
    req.url, `${protocol}//${req.headers.host}`
  );
  const reqPath = url.pathname;
  return reqPath;
});
//Initialize winston format stuff
const { combine, timestamp, label, printf, colorize } = winston.format;
// eslint-disable-next-line no-shadow
const winstonFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
//Add logging colours
winston.addColors(Constants.WINSTON_LOGGING_LEVELS.colors);
/**
 * Makes the winston transports
 * @param {Boolean} logToFile Whether to log to a file.
 * @param {Boolean} isProd Whether the app environment is
 * production.
 * @returns {WinstonTransports}
 */
function makeTransports(logToFile, isProd) {
  const consoleTransports = {
    allLevelConsole: new winston.transports.Console()
  };

  let dirName = "";
  if (!logToFile) {
    return {
      consoleTransports: consoleTransports,
      fileTransports: null
    };
  } else if (isProd) {
    const logsDate = new Date().toISOString().replace(/:/g, "_");
    try {
      // eslint-disable-next-line no-sync
      fs.mkdirSync(path.join(config.logOpts.logTo, `${logsDate}`));
    } catch (err) {
      if (err.code !== "EEXIST") {
        throw err;
      }
    }
    dirName = path.join(config.logOpts.logTo, logsDate);
  } else {
    dirName = path.resolve(config.logOpts.logTo);
  }
  return {
    consoleTransports: consoleTransports,
    fileTransports: (() => {
      const transportsToReturn = {};
      for (const fileName of Constants.WINSTON_LOG_FILE_NAMES) {
        transportsToReturn[fileName] = new winston.transports.File({
          filename: path.join(dirName, `${fileName}.log`),
          level: fileName === "errors" ? "warning" : "info"
        });
      }
      return transportsToReturn;
    })()
  };
}
/**
 * Makes the morgan and winston loggers
 * @param {String} env The environment this app is operating in.
 * Must be either `production` or `development`.
 * @returns {Loggers}
 */
function makeLoggers(env) {
  //Make transports
  const transports = makeTransports(
    !config.logOpts.noLog,
    env === "production"
  );
  //Add winston loggers
  Constants.WINSTON_LOGGER_INFO.forEach(loggerInfo => {
    const currentLoggerTransports = (() => {
      if (!transports.fileTransports) {
        return [
          transports.consoleTransports.allLevelConsole
        ];
      }
      if (loggerInfo.id === "Server-logger") {
        return [
          transports.consoleTransports.allLevelConsole,
          ...Object.values(transports.fileTransports).slice(0, 3)
        ];
      }
      return [
        transports.consoleTransports.allLevelConsole,
        ...Object.values(transports.fileTransports).slice(3)
      ];
    })();
    winston.loggers.add(loggerInfo.id, {
      levels: Constants.WINSTON_LOGGING_LEVELS.levels,
      format: combine(
        colorize({
          colors: Constants.WINSTON_LOGGING_LEVELS.colors
        }),
        label({ label: loggerInfo.label }),
        timestamp({
          format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
        }),
        winstonFormat
      ),
      transports: currentLoggerTransports
    });
  });
  /**
   * @type {MorganLoggers}
   */
  const morganLoggers = (() => {
    if (env === "production") {
      return {
        consoleLogger: (req, res, next) => { next(); },
        fileLogger: (req, res, next) => { next(); }
      };
    }
    if (config.logOpts.noLog) {
      return {
        consoleLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
          immediate: true
        }),
        fileLogger: (req, res, next) => { next(); }
      };
    }
    //Add morgan loggers
    const writeS = fs.createWriteStream(
      path.join(
        config.logOpts.logTo, "request.log"
      ), { flags: "w" }
    );
    return {
      consoleLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
        immediate: true
      }),
      fileLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
        immediate: true,
        stream: writeS
      })
    };
  })();

  return {
    winstonLoggers: winston.loggers,
    morganLoggers: morganLoggers
  };
}
const { winstonLoggers, morganLoggers } = makeLoggers(config.environment);
/**
 * Export winston loggers
 * @readonly
 */
exports.winstonLoggers = winstonLoggers;
/**
 * Export morgan loggers
 * @readonly
 */
exports.morganLoggers = morganLoggers;

//Initialize manager instance
const manager = Manager.create();

manager.addNewGame(
  "test", makeID(20),
  "testing", Constants.START_POSITIONS_TEAM_MAP_1
);
/**
 * Export manager
 * @readonly
 */
exports.manager = manager;

//Create the server token
const serverToken = crypto.randomBytes(32).toString("hex");
/**
 * Export server token
 * @readonly
 */
exports.serverToken = serverToken;

//Create the cookie secret
const cookieSecret = mixUp(
  crypto.randomBytes(16).toString("hex"),
  "PadflPW@(/'123m_syc",
  24
);
/**
 * Export cookie secret
 * @readonly
 */
exports.cookieSecret = cookieSecret;

//Initialize SessionStorage instances
const wsSessions = new SessionStorage(
  crypto.randomBytes(16).toString("hex"),
  serverToken,
  8 * 60 * 1000
);
const webSessions = new SessionStorage(
  crypto.randomBytes(16).toString("hex"),
  serverToken,
  8 * 60 * 1000
);
/**
 * Export session storages
 * @readonly
 */
exports.sessionStorages = {
  wsSessions,
  webSessions
};

//Initialize security instance
const security = Security.create(
  Constants.SEC_ALLOWED_METHODS,
  false, false
);
/**
 * Export security
 * @readonly
 */
exports.security = security;
