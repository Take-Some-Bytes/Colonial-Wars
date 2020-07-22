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
//Import required custom modules
const Constants = require("./constants");
const { makeID, mixUp } = require("./util");

const Manager = require("../Game/Manager");
const Security = require("../Security/Security");
const SessionStorage = require("../Security/SessionStorage");

//Make exports the same as module.exports.
exports = module.exports;

//Create a token in morgan
morgan.token("reqPath", (req, res) => {
  const reqPath = req.url.toString().split("?")[0];
  return reqPath;
});
//Initialize winston format stuff
const { combine, timestamp, label, printf, colorize } = winston.format;
//Initialize logger containers
let winstonLoggers = null;
let morganLoggers = null;
// eslint-disable-next-line no-shadow
const winstonFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});
//Add logging colours
winston.addColors(Constants.WINSTON_LOGGING_LEVELS.colors);

if (process.env.NODE_ENV === "production") {
  //Create a new directory for the logs
  const logsDate = new Date().toISOString().replace(/:/g, "_");
  try {
  // eslint-disable-next-line no-sync
    fs.mkdirSync(path.join(__dirname, "../../", `logs/${logsDate}`));
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
  //Create the fs writeStream for morgan
  const writeS = fs.createWriteStream(path.join(
    __dirname, "../../",
    `logs/${logsDate}/requests.log`
  ),
  {
    flags: "wx"
  });

  writeS.on("error", err => {
    throw err;
  });
  //Add CSP-report logger
  winston.loggers.add("CSP-logger", {
    levels: Constants.WINSTON_LOGGING_LEVELS.levels,
    format: combine(
      colorize({
        colors: Constants.WINSTON_LOGGING_LEVELS.colors
      }),
      label({ label: "CSP_report_log" }),
      timestamp({
        format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
      }),
      winstonFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/combined.log")
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          `logs/${logsDate}/CSP-reports.log`
        )
      })
    ]
  });
  //Add Server logger
  winston.loggers.add("Server-logger", {
    levels: Constants.WINSTON_LOGGING_LEVELS.levels,
    format: combine(
      colorize({
        colors: Constants.WINSTON_LOGGING_LEVELS.colors
      }),
      label({ label: "Server_log" }),
      timestamp({
        format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
      }),
      winstonFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          `logs/${logsDate}/combined.log`)
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          `logs/${logsDate}/errors.log`),
        level: "warning"
      }),
      new winston.transports.Console({
        level: "warning"
      })
    ]
  });
  //Add error and warning logger
  winston.loggers.add("Process-logger", {
    levels: Constants.WINSTON_LOGGING_LEVELS.levels,
    format: combine(
      colorize({
        colors: Constants.WINSTON_LOGGING_LEVELS.colors
      }),
      label({ label: "Process_log" }),
      timestamp({
        format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
      }),
      winstonFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          `logs/${logsDate}/process.log`)
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/combined.log")
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          `logs/${logsDate}/errors.log`),
        level: "error"
      }),
      new winston.transports.Console()
    ]
  });

  winstonLoggers = winston.loggers;
  morganLoggers = {
    consoleLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
      immediate: true
    }),
    fileLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
      immediate: true,
      stream: writeS
    })
  };
} else if (process.env.NODE_ENV === "development") {
  //Create the fs writeStream for morgan
  const writeS = fs.createWriteStream(path.join(
    __dirname, "../../",
    "logs/requests.log"
  ),
  {
    flags: "a"
  });

  writeS.on("error", err => {
    throw err;
  });
  //Add CSP-report logger
  winston.loggers.add("CSP-logger", {
    levels: Constants.WINSTON_LOGGING_LEVELS.levels,
    format: combine(
      colorize({
        colors: Constants.WINSTON_LOGGING_LEVELS.colors
      }),
      label({ label: "CSP_report_log" }),
      timestamp({
        format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
      }),
      winstonFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/combined.log")
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/CSP-reports.log"
        )
      })
    ]
  });
  //Add Server logger
  winston.loggers.add("Server-logger", {
    levels: Constants.WINSTON_LOGGING_LEVELS.levels,
    format: combine(
      colorize({
        colors: Constants.WINSTON_LOGGING_LEVELS.colors
      }),
      label({ label: "Server_log" }),
      timestamp({
        format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
      }),
      winstonFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/combined.log")
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/errors.log"),
        level: "warning"
      }),
      new winston.transports.Console({
        level: "warning"
      })
    ]
  });
  //Add error and warning logger
  winston.loggers.add("Process-logger", {
    levels: Constants.WINSTON_LOGGING_LEVELS.levels,
    format: combine(
      colorize({
        colors: Constants.WINSTON_LOGGING_LEVELS.colors
      }),
      label({ label: "Process_log" }),
      timestamp({
        format: Constants.WINSTON_LOGGING_TIMESTAMP_FORMAT
      }),
      winstonFormat
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/process.log")
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/combined.log")
      }),
      new winston.transports.File({
        filename: path.join(__dirname, "../../",
          "logs/errors.log"),
        level: "error"
      }),
      new winston.transports.Console()
    ]
  });

  winstonLoggers = winston.loggers;
  morganLoggers = {
    consoleLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
      immediate: true
    }),
    fileLogger: morgan(Constants.MORGAN_LOGGING_FORMAT, {
      immediate: true,
      stream: writeS
    })
  };
} else {
  throw new Error("Invalid app environment!");
}

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
