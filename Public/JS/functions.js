/**
 * @fileoverview Utility methods for the client
 * @author Horton Cheng <horton0712@gmail.com>
 */
/* eslint-disable no-undef */

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
  if(min > max) { return val >= max && val <= min; }
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
  if(isDegree) {
    angle = degreeToRadian(angle);
  }

  if(angle < 0.7853981633974483 && angle > 0) {
    return 0;
  } else if(angle > 0.7853981633974483 && angle < 2.356194490192345) {
    return 1.5707963267948966;
  }
}

/**
 * Gets this client's game info
 * @param {function(Error, {}): void} cb The callback to run when
 * the function is done
 */
export async function init(cb) {
  const data = {
    name: $("#name-input").val(),
    game: $("input[name='game']:checked", "#game-select").val(),
    team: $("select#teams option:checked").val()
  }
  let err = null;

  if(!data.name || data.name.length > 22) {
    err = new Error("Name is too long or blank!");
    cb(err, data);
    return;
  } else if(!data.game) {
    err = new Error("Game not selected!");
    cb(err, data);
    return;
  }
  cb(err, data);
}
