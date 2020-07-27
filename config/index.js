/**
 * @fileoverview File to parse configurations.
 * @author Horton Cheng <horton0712@gmail.com>
 */

const path = require("path");
const fs = require("fs");

/**
 * @typedef {Object} ParsedArgs
 * @prop {Array<any>} _
 * @prop {Object.<string, any>} keyedValues
 */
/**
 * @typedef {Object.<string, any>} ParsedEnvFile
 */
/**
 * @typedef {"map"|"object"} EnvOutAsFormat
 */

/**
 * Parses process arguments.
 * @param {Array<string>} args The process arguments.
 * @returns {ParsedArgs}
 */
function parseArgs(args) {
  const parsedArgs = {
    _: [],
    keyedValues: {}
  };
  args
    .filter(arg => {
      const doesArgStartWithFlag = arg.startsWith("-") || arg.startsWith("--");
      return doesArgStartWithFlag;
    })
    .forEach(arg => {
      const splitArg = arg.replace(/-+/, "").split("=", 2);
      if (splitArg.length < 2) {
        if (!splitArg[0]) { return; }
        parsedArgs._.push(splitArg[0]);
      } else {
        parsedArgs.keyedValues[splitArg[0]] = splitArg[1];
      }
    });
  return parsedArgs;
}
/**
 * Parses an ``.env`` file.
 * @param {String} filePath The path to the ``.env`` file. May be absolute
 * or relative.
 * @param {Boolean} [useSync] Whether to use synchronous ``fs`` methods.
 * @param {EnvOutAsFormat} [outAs] The format to return the environment
 * variables.
 * @returns {ParsedEnvFile|Map<String, any>|Promise<ParsedEnvFile>}
 */
function parseEnvFile(filePath, useSync, outAs) {
  const realFilePath = path.isAbsolute(filePath) ?
    filePath :
    path.resolve(filePath);
  let result = null;

  switch (outAs) {
  case "map":
    result = new Map();
    break;
  case "object":
    result = {};
    break;
  default:
    result = {};
    break;
  }

  /**
   * Private method to parse the .env file.
   * @param {String} file The file to parse.
   * @returns {Map<string, any>|Object<string, any>}
   * @private
   */
  function parse(file) {
    file
      .split(/\r\n|\r|\n/)
      .filter(line => !!line)
      .filter(line => !line.startsWith("#"))
      .forEach(line => {
        const pieces = line.split("=", 2);
        pieces[1] = (pieces[1] ? pieces[1] : "")
          .replace(/^["'`](.+)["'`]$/, "$1")
          .trim();
        if (result instanceof Map) {
          result.set(pieces[0], pieces[1]);
        } else {
          result[pieces[0]] = pieces[1];
        }
      });
    return result;
  }

  if (useSync) {
    // eslint-disable-next-line no-sync
    const file = fs.readFileSync(realFilePath, { encoding: "utf-8" });

    result = parse(file);
    return result;
  }
  return new Promise((resolve, reject) => {
    const readS = fs.createReadStream(realFilePath);
    const chunks = [];

    readS.on("data", chunk => {
      chunks.push(chunk);
    });
    readS.on("error", err => {
      reject(new Error(
        `Failed to parse .env file! Error is:\n${err}`
      ));
    });
    readS.on("end", () => {
      const file = Buffer.concat(chunks).toString("utf-8");
      result = parse(file);
      resolve(result);
    });
  });
}

let parsedArgs = null;
let envVariables = null;
try {
  parsedArgs = parseArgs(process.argv);
  envVariables = parseEnvFile(
    path.join(parsedArgs.keyedValues.confFile || __dirname, "./config.env"),
    true, "object"
  );
} catch (err) {
  throw new Error("Failed to load configurations.");
}

const envVars = {
  logOpts: {
    /**
     * @type {Boolean}
     */
    noLog:
      parsedArgs._.includes("nolog") || parsedArgs._.includes("noLog") ||
      !envVariables.NO_LOG,
    /**
     * @type {String}
     */
    logTo:
      parsedArgs.keyedValues.logTo ||
      (envVariables.LOG_TO.startsWith("~") ?
        path.join(
          require("os").homedir(),
          envVariables.LOG_TO.substring(2)
        ) :
        envVariables.LOG_TO
      ) ||
      "/var/log/colonialwars/"
  },
  httpsConfig: {
    /**
     * @type {Boolean}
     */
    isHttps:
      parsedArgs.keyedValues.isHttps === "true" ||
      envVariables.IS_HTTPS === "true",
    /**
     * @type {String}
     */
    httpsConfigPath:
      parsedArgs.httpsConfigPath ||
      envVariables.HTTPS_CONFIG_PATH ||
      "/etc/letsencrypt/live/"
  },
  serverConfig: {
    /**
     * @type {String}
     */
    host:
      process.env.HOST ||
      envVariables.HOST ||
      parsedArgs.keyedValues.host,
    /**
     * @type {Number}
     */
    port:
      parseInt(
        process.env.PORT ||
        envVariables.PORT ||
        parsedArgs.keyedValues.port,
        10
      )
  },
  /**
   * @type {String}
   */
  environment:
    process.env.NODE_ENV ||
    envVariables.NODE_ENV ||
    parsedArgs.keyedValues.nodeEnv ||
    "development"
};
/**
 * Module exports
 */
module.exports = exports = envVars;
