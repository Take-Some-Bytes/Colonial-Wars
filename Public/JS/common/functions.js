/**
 * @fileoverview Utility methods for the client
 * @author Horton Cheng <horton0712@gmail.com>
 */

import Constants from "../Constants-client.js";
/**
 * @callback AJAXCallback
 * @param {Error} err
 * @param {{}} data
 * @returns {void}
 */
/**
 * Get the type definitions
 * @typedef {import("jquery")} jQuery
 * @typedef {import("socket.io-client")} SocketIOStatic
 */
/**
 * @typedef {Object<string, string>} ParsedCookies
 * @typedef {() => void} VoidFunction
 * @typedef {SocketIOStatic} SocketIOClient
 * @typedef {"EINVALID"|"EMISSING"|"ELENGTH"|"ENOTAUTH"|"EFAILED"} ErrorCodes
 *
 * @typedef {Object} AJAXOpts
 * @prop {string} url
 * @prop {Object<string, any>|string|Array<any>} data
 * @prop {Object<string, string>} headers
 *
 * @typedef {Object} PlayData
 * @prop {string} name
 * @prop {string} game
 * @prop {string} team
 */

/**
 * Export RegExp to check for signed cookies.
 */
export const signedCookieRegExp = /^s:(.+)\..+/;
/**
 * ValidationError class.
 * @extends Error
 */
export class ValidationError extends Error {
  /**
   * Constructor for a ValidationError class.
   * @class
   * @param {string} msg The error message.
   * @param {ErrorCodes} typeCode The error code.
   * @param {string} toFix A string describing how to fix the error. This
   * should ***not*** be too verbose.
   */
  constructor(msg, typeCode, toFix) {
    super(msg);

    this.typeCode = typeCode;
    this.toFix = toFix;
  }
}
/**
 * Given a value, a minimum, and a maximum, returns true if value is
 * between the minimum and maximum, inclusive of both bounds. This
 * function will still work if min and max are switched.
 * @param {number} val The value to compare.
 * @param {number} min The minumum bound.
 * @param {number} max The maximum bound.
 * @returns {boolean}
 */
export function inBound(val, min, max) {
  if (min > max) { return val >= max && val <= min; }
  return val >= min && val <= max;
}
/**
 * Binds a number to the given minimum and maximum, inclusive of both
 * binds. This function will still work if min and max are switched.
 * @param {number} val The value to check.
 * @param {number} min The minimum number to bound to.
 * @param {number} max The maximum number to bound to.
 * @returns {number}
 */
export function bind(val, min, max) {
  if (min > max) { return Math.min(Math.max(val, max), min); }
  return Math.min(Math.max(val, min), max);
}
/**
 * Converts an angle in degrees into an angle in radians.
 * @param {number} degree The angle in degrees.
 * @returns {number}
 */
export function degreeToRadian(degree) {
  return degree * (Math.PI / 180);
}
/**
 * Normalizes an angle into radians that are equvilent to 0 degrees,
 * 90 degrees, 180 degrees, and 270 degrees.
 * @param {number} angle The angle in either degrees or radians.
 * @param {boolean} [isDegree] Is the angle supplied in degrees?
 * Default is false
 * @returns {number}
 */
export function normalizeAngle(angle, isDegree = false) {
  if (isDegree) {
    angle = degreeToRadian(angle);
  }

  if (angle < 0.7853981633974483 && angle > 0) {
    return 0;
  } else if (angle > 0.7853981633974483 && angle < 2.356194490192345) {
    return 1.5707963267948966;
  }
}
/**
 * Changes the viewport stats in the Constants object.
 */
export function changeViewportStats() {
  try {
    Constants.VIEWPORT_HEIGHT = (() => {
      if (window.innerHeight !== undefined) {
        const vw = window.innerHeight;
        return vw;
      }
      const vw = document.documentElement.clientHeight;
      return vw;
    })();
    Constants.VIEWPORT_WIDTH = (() => {
      if (window.innerWidth !== undefined) {
        const vw = window.innerWidth;
        return vw;
      }
      const vw = document.documentElement.clientWidth;
      return vw;
    })();
  } catch (err) {
    if (err instanceof TypeError) {
      console.error("Object has been frozen!");
      console.error(err);
    } else {
      throw err;
    }
  }
}
/**
 * Deep seals an object.
 * @param {*} obj The object to deep seal.
 * @returns {*}
 */
export function deepSeal(obj) {
  // Retrieve the property names defined on object.
  const propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self.
  for (const name of propNames) {
    const value = obj[name];

    if (value && typeof value === "object") {
      deepSeal(value);
    }
  }

  return Object.seal(obj);
}
/**
 * Parses the non-http only cookies.
 * @param {string} cookies The document cookies.
 * @returns {ParsedCookies}
 */
export function parseCookies(cookies) {
  const objToReturn = {};
  cookies
    .split("; ")
    .forEach(cookie => {
      // TODO: Just don't try to parse the cookie value into
      // anything special, only strings, please.
      const splitCookie = cookie.split("=");
      const key = splitCookie[0];
      let val = decodeURIComponent(splitCookie[1]);

      console.log(signedCookieRegExp.test(val));
      console.log(
        val.replace(signedCookieRegExp, "$1"));
      if (signedCookieRegExp.test(val)) {
        val = val.replace(signedCookieRegExp, "$1");
      }
      if (typeof val === "undefined") {
        val = null;
      }

      val = isNaN(parseFloat(val)) ?
        val :
        parseFloat(val);
      val = val === "true" || val === "false" ?
        val === "false" :
        val;

      objToReturn[key] = val;
    });

  return objToReturn;
}

/**
 * Gets this player's play data.
 * @returns {PlayData}
 */
export function getPlayData() {
  // Helpers.
  /**
   * Checks if a bunch of values is a type using `typeof`.
   * @param {string} type The type that is expected.
   * @param  {...any} args The values to check.
   * @returns {boolean}
   */
  function isType(type, ...args) {
    // Type checking, just to be sure.
    if (args === undefined || args === null) {
      throw new TypeError("Invalid arguments!");
    } else if (typeof type !== "string") {
      throw new TypeError("Invalid type parameter!");
    }
    for (const val of args) {
      if (typeof val !== type) {
        // Type does not match, return false.
        return false;
      }
    }
    // Everythin passes, so return true.
    return true;
  }
  // First, get the data.
  const data = {
    name: $("#name-input").val(),
    game: $("input[name='game']:checked", "#game-select").val(),
    team: $("select#teams option:checked").val()
  };

  // Then, do some validation.
  // Check if all the values in the `data` object are strings.
  if (!isType("string", ...Object.values(data))) {
    throw new ValidationError(
      "Missing required data!", "EINVALID"
    );
  } else if (data.name.length < 2 || data.name.length > 22) {
    // Check the length of the name.
    throw new ValidationError(
      "Name is too long or less than two characters!", "ELENGTH",
      "Enter a name between 2 characters and 22 characters."
    );
  }

  // All is well, so return the data.
  return data;
}
/**
 * Submits this player's play info.
 * @param {SocketIOClient.Socket} socket The Socket.IO socket.
 * @returns {VoidFunction}
 */
export function submitPlayInfo(socket) {
  /**
   * @this {Object}
   */
  return () => {
    try {
      // Get the play data.
      // The function will throw if something goes wrong.
      const playData = getPlayData();

      // Check if the socket is connected. This will save us some
      // future headaches... Maybe.
      if (!socket.connected) {
        throw new Error("Socket is not connected!");
      }
      // All is well, so emit the message.
      socket.emit(Constants.SOCKET_NEW_PLAYER, JSON.stringify({
        playerData: playData,
        otherData: {}
      }), err => {
        if (err) {
          $("#error-span")
            .addClass("error")
            .text(`${err.message}`);
          return;
        }
        console.log(this);
        this.dialog("close");
        window.location.href =
          `${window.location.protocol}//` +
          `${window.location.hostname}` +
          `:${window.location.port}/play`;
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        $("#error-span")
          .addClass("error")
          .text(`${err.message}`);
      } else {
        console.error(err);
        $("#error-span")
          .addClass("error")
          .text(
            "Something went wrong. Please see your JS console for details."
          );
      }
    }
  };
}
/**
 * Creates a `Play` dialog.
 * @param {string} dialogElem The element to create the dialog from.
 * @param {SocketIOClient.Socket} socket The Socket.IO socket.
 * @returns {Object}
 */
export function createPlayDialog(dialogElem, socket) {
  const dialog = $(dialogElem)
    .dialog({
      autoOpen: false,
      modal: true,
      width: Math.round(Constants.VIEWPORT_WIDTH / 3),
      height: Math.round(Constants.VIEWPORT_HEIGHT * 10 / 1.5 / 10),
      buttons: {}
    });
  const buttons = dialog.dialog("option", "buttons");
  $.extend(buttons, {
    Play: submitPlayInfo.bind(dialog)(socket),
    Cancel: () => {
      dialog.dialog("close");
    }
  });
  dialog.dialog("option", "buttons", buttons);
  return dialog;
}

/**
 * Polls the server for something, and returns a promise
 * with the value as the response that the server sent.
 * Method is always GET.
 * @param {AJAXOpts} opts Options.
 * @returns {Promise<string>}
 */
export function pollServer(opts) {
  return new Promise((resolve, reject) => {
    $.ajax({
      data: opts.data,
      headers: opts.headers,
      url: opts.url,
      method: "GET"
    })
      .done(data => {
        resolve(data);
      })
      .fail(err => {
        reject(err);
      });
  });
}
