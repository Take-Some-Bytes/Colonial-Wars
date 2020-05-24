/**
 * @fileoverview Winston logger and manager initialization file
 * @author Horton Cheng <horton0712@gmail.com>
 */

const winston = require("winston");
const { combine, timestamp, label, printf } = winston.format;

const manager = require("../Game/Manager").create();
const { makeID } = require("../Util");
const Constants = require("../Constants");

manager.addNewGame(
  "test", makeID(20),
  "testing", Constants.START_POSITIONS_TEAM_MAP_1
);

// eslint-disable-next-line no-shadow
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

//Add CSP-report logger
winston.loggers.add("CSP-logger", {
  levels: winston.config.syslog.levels,
  format: combine(
    label({ label: "CSP_report_log" }),
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/CSP-reports.log"
    })
  ]
});
//Add Server logger
winston.loggers.add("Server-logger", {
  levels: winston.config.syslog.levels,
  format: combine(
    label({ label: "Server_log" }),
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File({
      filename: "logs/Server-logs.log"
    })
  ]
});
//Add visit and page request logger
winston.loggers.add("Request-logger", {
  levels: winston.config.syslog.levels,
  format: combine(
    label({ label: "Request_log" }),
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});
//Add error and warning logger
winston.loggers.add("Error-logger", {
  levels: winston.config.syslog.levels,
  format: combine(
    label({ label: "Error_log" }),
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const loggers = winston.loggers;

/**
 * Module exports
 */
module.exports = exports = loggers;
exports.manager = manager;
