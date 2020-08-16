/**
 * @fileoverview Utility methods for the client
 * @author Horton Cheng <horton0712@gmail.com>
 */
/* eslint-disable no-undef */

/**
 * @callback AJAXCallback
 * @param {Error} err
 * @param {{}} data
 * @returns {void}
 */
/**
 * @typedef {Object<string, string|boolean|number>} ParsedCookies
 */

/**
 * Export RegExp to check for signed cookies.
 */
export const signedCookieRegExp = /^s:(.+)\..+/;
/**
 * Given a value, a minimum, and a maximum, returns true if value is
 * between the minimum and maximum, inclusive of both bounds. This
 * function will still work if min and max are switched.
 * @param {Number} val The value to compare
 * @param {Number} min The minumum bound
 * @param {Number} max The maximum bound
 * @returns {Boolean}
 */
export function inBound(val, min, max) {
  if (min > max) { return val >= max && val <= min; }
  return val >= min && val <= max;
}
/**
 * Binds a number to the given minimum and maximum, inclusive of both
 * binds. This function will still work if min and max are switched.
 * @param {Number} val The value to check.
 * @param {Number} min The minimum number to bound to.
 * @param {Number} max The maximum number to bound to.
 * @return {Number}
 */
export function bind(val, min, max) {
  if (min > max) { return Math.min(Math.max(val, max), min); }
  return Math.min(Math.max(val, min), max);
}
/**
 * Converts an angle in degrees into an angle in radians
 * @param {Number} degree The angle in degrees
 * @returns {Number}
 */
export function degreeToRadian(degree) {
  return degree * (Math.PI / 180);
}
/**
 * Normalizes an angle into radians that are equvilent to 0 degrees,
 * 90 degrees, 180 degrees, and 270 degrees
 * @param {Number} angle The angle in either degrees or radians
 * @param {Boolean} [isDegree] Is the angle supplied in degrees?
 * Default is false
 * @returns {Number}
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
 * Changes the viewport stats in the Constants object
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
 * Deep seals an object
 * @param {*} obj The object to deep seal
 * @returns {*}
 */
export function deepSeal(obj) {
  // Retrieve the property names defined on object
  const propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self
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
 * @param {String} cookies The document cookies.
 * @returns {ParsedCookies}
 */
export function parseCookies(cookies) {
  const objToReturn = {};
  cookies
    .split("; ")
    .forEach(cookie => {
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
 * Gets this client's game info
 * @param {AJAXCallback} cb The callback to run when
 * the function is done
 */
export async function init(cb) {
  const data = {
    name: $("#name-input").val(),
    game: $("input[name='game']:checked", "#game-select").val(),
    team: $("select#teams option:checked").val()
  };
  let err = null;

  if (!data.name || data.name.length > 22) {
    err = new Error("Name is too long or blank!");
    cb(err, data);
    return;
  } else if (!data.game) {
    err = new Error("Game not selected!");
    cb(err, data);
    return;
  }
  cb(err, data);
}
