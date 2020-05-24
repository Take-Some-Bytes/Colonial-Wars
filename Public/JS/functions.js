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