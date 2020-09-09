/**
 * @fileoverview Winston logger and stuff initialization file.
 * @author Horton Cheng <horton0712@gmail.com>
 */
// Imports.
const winston = require("winston");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const helmet = require("helmet");

const Constants = require("./constants");
const { makeID, mixUp, deepFreeze } = require("./util");
const config = require("../../config");

const Manager = require("../Game/Manager");

// Make exports the same as module.exports.
// TODO: See if this is necessary.
exports = module.exports = {};

/**
 * @typedef {Object} MorganLoggers
 * @prop {express.Handler} consoleLogger
 * @prop {express.Handler} fileLogger
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
 * @typedef {Object<string, string>} ServerCache
 */
/**
 * @typedef {Map<string, PendingClientEntry>} PendingClients
 */
/**
 * @typedef {Object} PendingClientEntry
 * @prop {boolean} connected
 * @prop {boolean} joinedGame
 * @prop {Object} playData
 * @prop {string} playData.clientName
 * @prop {string} playData.clientTeam
 * @prop {string} playData.gameID
 * @prop {Object} validationData
 * @prop {string} validationData.utk
 * @prop {string} validationData.passPhrase
 */

// Create a token in morgan.
morgan.token("reqPath", req => {
  const protocol = config.httpsConfig.isHttps ? "https:" : "http:";
  const url = new URL(
    req.url, `${protocol}//${req.headers.host}`
  );
  const reqPath = url.pathname;
  return reqPath;
});
// Initialize winston format.
const { combine, timestamp, label, printf, colorize } = winston.format;
// eslint-disable-next-line no-shadow
const winstonFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
// Add logging colours.
winston.addColors(Constants.WINSTON_LOGGING_LEVELS.colors);
// TODO: See if we should use functions, or just make the loggers
// and be done with them.
/**
 * Makes the winston transports.
 * @param {boolean} logToFile Whether to log to a file.
 * @param {boolean} isProd Whether the app environment is production.
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
      // Dynamically iterate through the log files, and create transports
      // for each of them.
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
 * Makes the morgan and winston loggers.
 * @param {string} env The environment this app is operating in.
 * Must be either `production` or `development`.
 * @returns {Loggers}
 */
function makeLoggers(env) {
  // Make transports dynamically.
  const transports = makeTransports(
    !config.logOpts.noLog,
    env === "production"
  );
  // Add winston loggers dynamically.
  Constants.WINSTON_LOGGER_INFO.forEach(loggerInfo => {
    const currentLoggerTransports = (() => {
      // Dynamically get the winston transports.
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
    // And then... add a new logger.
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
  // Next, make the morgan loggers.
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
    // Make the write stream that the file morgan logger is going
    // to use, if needed.
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
 * Export winston loggers.
 * @readonly
 */
exports.winstonLoggers = winstonLoggers;
/**
 * Export morgan loggers.
 * @readonly
 */
exports.morganLoggers = morganLoggers;

// Initialize manager instance.
const manager = Manager.create();

// TODO: Make game creation dynamic and use configurations from
// a JSON file.
manager.addNewGame(
  "test", makeID(20),
  "testing", Constants.START_POSITIONS_TEAM_MAP_1
);
/**
 * Export manager.
 * @readonly
 */
exports.manager = manager;

// TODO: See if the `serverToken` is needed.
// Create the server token.
const serverToken = crypto.randomBytes(32).toString("hex");
/**
 * Export server token.
 * @readonly
 */
exports.serverToken = serverToken;

// Create the cookie secret.
const cookieSecret = mixUp(
  config.secrets.cookieSecret || crypto.randomBytes(16).toString("utf-8"),
  "PadflPW@(/'123m_syc",
  26
);
/**
 * Export cookie secret.
 * @readonly
 */
exports.cookieSecret = cookieSecret;

// Create the JWT secret.
const jwtSecret = mixUp(
  config.secrets.jwtSecret || crypto.randomBytes(16).toString("utf-8"),
  "QjhOoqm(1023]32\\no",
  30
);
/**
 * Export JWT secret.
 * @readonly
 */
exports.jwtSecret = jwtSecret;

// Declare server cache.
/**
 * @type {ServerCache}
 */
const cache = {};
// eslint-disable-next-line no-sync
const errorPage = fs.readFileSync(
  path.join(__dirname, "../../Public", "error.html")
).toString("utf-8");

cache.errorPage = errorPage;
/**
 * Export cache
 * @readonly
 */
exports.cache = cache;

// Declare pendingClients map for game connections.
/**
 * @type {PendingClients}
 */
const pendingClients = new Map();
/**
 * Export pendingClients map.
 * @readonly
 */
exports.pendingClients = pendingClients;

// Initialize helmet functions.
/**
 * @type {Array<express.Handler>}
 */
const helmetFunctions = [
  helmet.contentSecurityPolicy({
    directives: Constants.HEADERS.CSP_DIRECTIVES
  }),
  helmet.expectCt(Constants.HEADERS.EXPECT_CT_OPTS),
  helmet.noSniff(),
  helmet.referrerPolicy(Constants.HEADERS.REFERRER_POLICY)
];
/**
 * Export helmet functions.
 * @readonly
 */
exports.helmetFunctions = helmetFunctions;

// Make exports read-only.
deepFreeze(exports);
