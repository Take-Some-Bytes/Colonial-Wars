/**
 * @fileoverview Winston logger initialization file
 * @author Horton Cheng <horton0712@gmail.com>
 * @version
 */

const winston = require("winston");
const { combine, timestamp, label, printf } = winston.format;

// eslint-disable-next-line no-shadow
const myFormat = printf(({ level, message, label, timestamp }) => {
   return `${timestamp} [${label}] ${level}: ${message}`;
});

//Add CSP-report logger
winston.loggers.add("CSP-logger", {
   levels: winston.config.syslog.levels,
   format: combine(
      label({ label: "CSP-report" }),
      timestamp(),
      myFormat
   ),
   transports: [
      new winston.transports.File({
         filename: "logs/CSP-reports.log",
         level: ""
      })
   ]
});
//Add Server logger
winston.loggers.add("Server-logger", {
   levels: winston.config.syslog.levels,
   format: combine(
      label({ label: "Server" }),
      timestamp(),
      myFormat
   ),
   transports: [
      new winston.transports.File({
         filename: "logs/Server-logs.log",
         level: ""
      })
   ]  
})

const loggers = winston.loggers;

/**
 * Module exports
 */
module.exports = exports = loggers;