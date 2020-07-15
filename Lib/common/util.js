/**
 * @fileoverview File to store utility methods used
 * throughout this project
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Imports
const debug = require("./debug");

/**
 * @typedef {"array"|"object"|"nested array"} OutAsFormat
 */
/**
 * @typedef {"object"|"nested array"} InAsFormat
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
  while (angle < 0) {
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
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
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
  for (const name of propNames) {
    const value = object[name];

    if (value && typeof value === "object") {
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
  if (variable instanceof Map) {
    if (deleteProperties) {
      return variable.clear();
    }
    for (const [key, value] of variable) {
      if (value instanceof Map) {
        deepClear(value, deleteProperties);
      } else {
        variable.set(key, undefined);
      }
    }
  } else if (variable instanceof Array) {
    if (deleteProperties) {
      return variable.splice(0);
    }
    for (let i = 0; i < variable.length; i++) {
      variable[i] = undefined;
      continue;
    }
  } else if (typeof variable === "object") {
    const properties = Object.getOwnPropertyNames(variable);
    for (let i = 0; i < properties.length; i++) {
      const property = variable[properties[i]];
      if (deleteProperties) {
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
   * @param {Array<number>} factors Factors to multiply
   * @returns {number}
   */
function multiplySomething(factors) {
  let factor1 = 0;
  let factor2 = 0;
  let factor = 0;
  let preProduct = 0;
  let product = 0;
  let i = 0;

  while (i < factors.length) {
    if (!preProduct) {
      if (!factor1) {
        factor1 = factors[i];
        i++;
        continue;
      } else if (!factor2) {
        factor2 = factors[i];
        preProduct = factor1 * factor2;
        if (!preProduct) {
          if (factor1) {
            preProduct = factor1;
            break;
          } else if (factor2) {
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
      if (!factor) {
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
/**
 * Checks an object's properties. Returns true if the object's
 * properties are true, otherwise returns false
 * @param {{}} obj The object to check for the properties
 * @returns {Boolean}
 */
function checkProperties(obj) {
  for (const key in obj) {
    const property = obj[key];
    if (!property === true) {
      return false;
    }
  }
  return true;
}
/**
 * Gets the euclidean distance squared
 * @param {Vector} p1 Point number 1
 * @param {Vector} p2 Point number 2
 * @returns {Number}
 */
function getEuclideanDist2(p1, p2) {
  const distance = Math.sqrt(
    (p2.x - p1.x) * (p2.x - p1.x) +
    (p2.y - p1.y) * (p2.y - p1.y)
  );

  if (isNaN(distance)) {
    throw new TypeError(
      "Arguments are not valid Vectors, or " +
      "the properties of the Vectors are not valid numbers!"
    );
  }
  return distance;
}
/**
 * Tests if a point is in a circle
 * @param {Vector} circlePosition The circle's position
 * @param {Number} circleRadius The circle's radius
 * @param {Vector} pointPosition The point that you want to test
 * @returns {Boolean}
 */
function inCircle(circlePosition, circleRadius, pointPosition) {
  const euclideanDist = getEuclideanDist2(pointPosition, circlePosition);

  const isInCircle = euclideanDist < circleRadius;
  return isInCircle;
}
/**
 * Logs the memory usage of the current node js process
 */
function logMemoryUsage() {
  debug("----Memory Usage----");
  const used = process.memoryUsage();
  for (const key in used) {
    debug(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
}

/**
 * Gets all the non-callable (Non-function) properties of an object
 * @param {Object} obj The object to get the non-callable properties
 * from
 * @returns {Object}
 */
function getNonCallableProps(obj) {
  const propsNames = Object.getOwnPropertyNames(obj);
  const props = {};

  for (let i = 0; i < propsNames.length; i++) {
    props[propsNames[i]] = obj[propsNames[i]];
  }

  for (const key in props) {
    const prop = props[key];
    if (!(typeof prop !== "function")) {
      delete props[key];
    }
  }

  return props;
}
/**
 * Mixes up a string real good.
 * @param {String} string The string to mix up
 * @param {String} additionalLetters Any additional letters to mix the
 * string up with
 * @param {Number} maxLength The max length of the string that is returned
 * @returns {String}
 */
function mixUp(string, additionalLetters, maxLength) {
  const splitString = string.split("");
  const stringLength = additionalLetters.length;
  let result = "";
  let i = 0;

  while (i < string.length) {
    const indexToGet = bind(
      Math.floor(Math.random() * splitString.length),
      0, splitString.length
    );
    result += splitString.splice(indexToGet, 1)[0];
    i++;
  }
  while (result.length < maxLength) {
    const additionalLetter = additionalLetters.charAt(
      Math.round(Math.random() * stringLength)
    );

    result += additionalLetter;
  }

  return result;
}
/**
 * Gets all the values of a map, and returns them in the specified format
 * @param {Map} map The map to get values as.
 * @param {OutAsFormat} outAs The format to output the
 * values.
 * @returns {Array<any>|Array<Array<any>>|{}}
 */
function getMapValues(map, outAs) {
  if (
    outAs.toLowerCase() === "nested array" || outAs.toLowerCase() === "object"
  ) {
    const valueToReturn = outAs === "object" ?
      {} :
      [];

    for (const [key, value] of map) {
      if (valueToReturn instanceof Array) {
        valueToReturn.push([key, value]);
      } else {
        valueToReturn[key] = value;
      }
    }
    return valueToReturn;
  } else if (outAs.toLowerCase() === "array") {
    const valueToReturn = [];

    for (const value of map.values()) {
      valueToReturn.push(value);
    }
    return valueToReturn;
  }
  throw new TypeError("Invalid outAs parameter!");
}
/**
 * Creates a map from a value
 * @param {{}|Array<Array<any>>} val The value to create the map from.
 * @param {InAsFormat} inAs The format that the map is to be created from.
 * @returns {Map}
 */
function createMapFrom(val, inAs) {
  if (inAs.toLowerCase() === "object") {
    const arr = [];

    for (const key in val) {
      arr.push([
        key, val[key]
      ]);
    }

    return new Map(arr);
  } else if (inAs.toLowerCase() === "nested array") {
    return new Map(val);
  }
  throw new TypeError("Invalid inAs parameter!");
}

/**
 * Export utility methods
 */
module.exports = exports = {
  inBound,
  bind,
  degreeToRadian,
  normalizeAngle,
  makeID,
  deepFreeze,
  deepClear,
  multiplySomething,
  checkProperties,
  getEuclideanDist2,
  inCircle,
  logMemoryUsage,
  getNonCallableProps,
  mixUp,
  getMapValues
};
