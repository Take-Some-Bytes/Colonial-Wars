/**
 * @fileoverview Utility methods for various odd jobs
 * @author alvin@omgimanerd.tech (Alvin Lin)
 * edited by Horton Cheng for my purposes
 */

/**
 * Given a value, a minimum, and a maximum, returns true if value is
 * between the minimum and maximum, inclusive of both bounds. This
 * function will still work if min and max are switched.
 * @param {Number} val The value to compare
 * @param {Number} min The minumum bound
 * @param {Number} max The maximum bound
 * @returns {Boolean}
 */
function inBound(val, min, max) {
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
function bind(val, min, max) {
  if (min > max) { return Math.min(Math.max(val, max), min); }
  return Math.min(Math.max(val, min), max);
}
/**
 * Converts an angle in degrees into an angle in radians
 * @param {Number} degree The angle in degrees
 * @returns {Number}
 */
function degreeToRadian(degree) {
  return degree * (Math.PI / 180);
}
/**
 * Given an angle in radians, this function normalizes the angle to the range
 * 0 to 2 PI and returns the normalized angle.
 * @param {number} angle The angle to normalize
 * @return {number}
 */
function normalizeAngle(angle) {
  while(angle < 0) {
    angle += Math.PI * 2;
  }
  return angle % (Math.PI * 2);
}
/**
 * An ID maker function
 * @param {Number} length Length of the ID
 * @returns {String}
 */
function makeID(length) {
  let result = "";
  const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for(let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
/**
 * Deep-freezes an object
 * @param {{}} object The object to deep freeze
 * @returns {*}
 */
function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Object.getOwnPropertyNames(object);

  // Freeze properties before freezing self
  for(const name of propNames) {
    const value = object[name];

    if(value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
/**
 * Clears all of a object's stuff. Could delete properties if you want it to,
 * but by default it only gives them the value of `undefined`
 * @param {Map|Array|{}} variable Whatever object variable you need to clear
 * @param {Boolean} [deleteProperties=false] Delete properties?
 * @returns {*}
 */
function deepClear(variable, deleteProperties = false) {
  if(variable instanceof Map) {
    if(deleteProperties) {
      return variable.clear();
    }
    for(const [key, value] of variable) {
      if(value instanceof Map) {
        deepClear(value, deleteProperties);
      } else {
        variable.set(key, undefined);
      }
    }
  } else if(variable instanceof Array) {
    for(let i = 0; i < variable.length; i++) {
      if(deleteProperties) {
        delete variable[i];
        continue;
      } else {
        variable[i] = undefined;
        continue;
      }
    }
  } else if(typeof variable === "object") {
    const properties = Object.getOwnPropertyNames(variable);
    for(let i = 0; i < properties.length; i++) {
      const property = variable[properties[i]];
      if(deleteProperties) {
        delete variable[property];
        continue;
      } else {
        variable[property] = undefined;
        continue;
      }
    }
  } else {
    throw new TypeError(
      `Expected type Map, Array, or Object. Recieved type : ${typeof variable}.`
    );
  }
}
/**
   * Multiplies stuff. Skips a number if it is zero or negative
   * @param {Array<number>} factors First factor
   * @returns {number}
   */
function multiplySomething(factors) {
  let factor1 = 0;
  let factor2 = 0;
  let factor = 0;
  let preProduct = 0;
  let product = 0;
  let i = 0;

  while(i < factors.length) {
    if(!preProduct) {
      if(!factor1) {
        factor1 = factors[i];
        i++;
        continue;
      } else if(!factor2) {
        factor2 = factors[i];
        preProduct = factor1 * factor2;
        if(!preProduct) {
          if(factor1) {
            preProduct = factor1;
            break;
          } else if(factor2) {
            preProduct = factor2;
            break;
          }
        }
        i++;
        continue;
      } else {
        preProduct = factor1 * factor2;
        factor1 = 0;
        factor2 = 0;
        i++;
        continue;
      }
    } else {
      factor = factors[i];
      console.log(factor);
      if(!factor) {
        i++;
        continue;
      }
      preProduct *= factor;
      factor = 0;
      i++;
    }
  }

  product = preProduct;
  return product;
}

if(typeof module === "object") {
  /**
   * If Util is loaded as a Node module, then this line is called.
   */
  module.exports = exports = {
    inBound,
    bind,
    degreeToRadian,
    normalizeAngle,
    makeID,
    deepFreeze,
    deepClear,
    multiplySomething
  };
} else {
  /**
   * If Util is loaded into the browser, then this line is called.
   */
  window.Util = {
    inBound,
    bind,
    degreeToRadian,
    normalizeAngle,
    makeID,
    deepFreeze,
    deepClear,
    multiplySomething
  };
}
