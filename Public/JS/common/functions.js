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
 * @typedef {Object} AJAXOpts
 * @prop {string} url
 * @prop {Object<string, any>|string|Array<any>} data
 * @prop {Object<string, string>} headers
 */
/**
 * @typedef {Object<string, string>} ParsedCookies
 */

/**
 * Export RegExp to check for signed cookies.
 */
export const signedCookieRegExp = /^s:(.+)\..+/;
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

// TODO: Update the method that gets the client's play info, and give
// it a better name.
/**
 * Gets this client's game info.
 * @param {AJAXCallback} cb The callback to run when
 * the function is done.
 */
export async function init(cb) {
  // Yes, I know this gives me a warning with ESLint... but I
  // don't want to change the code right now. Maybe in v0.4.2 or 0.4.3.
  const data = {
    name: $("#name-input").val(),
    game: $("input[name='game']:checked", "#game-select").val(),
    team: $("select#teams option:checked").val()
  };
  let err = null;
  console.log(data.name);
  console.log(typeof data.name);

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
