/**
 * @fileoverview File to store utility methods used throughout this project.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// JSDoc typedefs for VSCode.
/**
 * @typedef {"array"|"object"|"nested array"} OutAsFormat
 */
/**
 * @typedef {"object"|"nested array"} InAsFormat
 */

/**
 * Special `NO_FREEZE` symbol.
 */
const no_freeze = Symbol("NO_FREEZE");
/**
 * Given a value, a minimum, and a maximum, returns true if value is
 * between the minimum and maximum, inclusive of both bounds. This
 * function will still work if min and max are switched.
 * @param {number} val The value to compare.
 * @param {number} min The minumum bound.
 * @param {number} max The maximum bound.
 * @returns {boolean}
 */
function inBound(val, min, max) {
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
function bind(val, min, max) {
  if (min > max) { return Math.min(Math.max(val, max), min); }
  return Math.min(Math.max(val, min), max);
}
/**
 * Converts an angle in degrees into an angle in radians.
 * @param {number} degree The angle in degrees.
 * @returns {number}
 */
function degreeToRadian(degree) {
  return degree * (Math.PI / 180);
}
/**
 * Given an angle in radians, this function normalizes the angle to the range
 * 0 to 2 PI and returns the normalized angle.
 * @param {number} angle The angle to normalize.
 * @returns {number}
 */
function normalizeAngle(angle) {
  while (angle < 0) {
    angle += Math.PI * 2;
  }
  return angle % (Math.PI * 2);
}
/**
 * An ID maker function.
 * @param {number} length Length of the ID.
 * @returns {string}
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
 * Deep-freezes an object.
 * @param {{}} object The object to deep freeze.
 * @returns {*}
 */
function deepFreeze(object) {
  // Retrieve the property names defined on object.
  const propNames = Object.getOwnPropertyNames(object);
  // Check for a special "NO_FREEZE" symbol.
  if (object[no_freeze] === true) {
    return;
  }

  // Freeze properties before freezing self.
  for (const name of propNames) {
    const value = object[name];

    if (value && typeof value === "object") {
      // Check for a special "NO_FREEZE" symbol.
      if (value[no_freeze] === true) {
        return;
      }
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
/**
 * Clears a `Map`. If the parameter supplied is not a `Map`, then this function
 * will create a new one.
 * @param {Map} map The `Map` to clear.
 * @returns {Map}
 */
function clearMap(map) {
  if (map instanceof Map) {
    map.clear();
    return map;
  }
  return new Map();
}
/**
 * Multiplies stuff. Skips a number if it is zero or negative.
 * @param {Array<number>} factors Factors to multiply.
 * @returns {number}
 */
function multiplySomething(factors) {
  // TODO: Do more testing on this function to see if it works as
  // intended. You'll be surprised how hard it is to multiply numbers
  // without getting a "0" as the product.
  // TODO: See if this function leaks memory. It is used for an important
  // function, and if it does leak memory... Well, that isn't good.
  let factor1 = 0;
  let factor2 = 0;
  let factor = 0;
  let preProduct = 0;
  let product = 0;
  let i = 0;

  // We use a while loop here because we need to conditionally
  // increment the counter.
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
 * properties are true, otherwise returns false.
 * @param {Object<string, any>} obj The object to check for the properties.
 * @returns {boolean}
 */
function checkProperties(obj) {
  for (const key in obj) {
    const property = obj[key];
    if (!property) {
      return false;
    }
  }
  return true;
}
// TODO: See if the following function is needed.
/**
 * Gets all the non-callable (Non-function) properties of an object.
 * @param {Object} obj The object to get the non-callable properties from.
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
    if (typeof prop === "function") {
      delete props[key];
    }
  }

  return props;
}
/**
 * Mixes up a string real good.
 * @param {string} string The string to mix up.
 * @param {string} additionalLetters Any additional letters to mix the
 * string up with.
 * @param {number} maxLength The max length of the string that is returned.
 * @returns {string}
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

    // TODO: Maybe we should ACTUALLY mix up the string with additional letters?
    // Because all we are doing is adding it on to the result.
    result += additionalLetter;
  }

  return result;
}
/**
 * Gets all the values of a map, and returns them in the specified format.
 * @param {Map} map The map to get values as.
 * @param {OutAsFormat} outAs The format to output the values.
 * @returns {Array<any>|Array<Array<any>>|{}}
 */
function getMapValues(map, outAs) {
  // TODO: Implement typechecks on the parameters of this function, because
  // an exception will be thrown if the parameters are not the type
  // they are supposed to be.
  if (
    outAs.toLowerCase() === "nested array" || outAs.toLowerCase() === "object"
  ) {
    const valueToReturn = outAs === "object" ?
      {} :
      [];

    // FIXME: Fix this to use `map.entries()`. Just iterating over the
    // map does not do anything.
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
 * Removes a specific value from an array. Returns true if the value
 * was removed, false otherwise.
 * @param {Array<any>} array The array to remove the value from.
 * @param {any} val The value to remove from the array.
 * @returns {boolean}
 */
function removeFromArray(array, val) {
  const index = array.indexOf(val);
  if (index > -1) {
    array.splice(index, 1);
    return true;
  }
  return false;
}
/**
 * Checks if a string is valid JSON. If it is, return it. If not,
 * return false.
 * @param {string} str The string to check.
 * @returns {Object<string, any>|false}
 */
function isJson(str) {
  try {
    const obj = JSON.parse(str);

    if (obj && typeof obj === "object") {
      return obj;
    }
  } catch (err) {
    return false;
  }
}

/**
 * Export utility methods.
 */
module.exports = exports = {
  // Functions.
  inBound,
  bind,
  degreeToRadian,
  normalizeAngle,
  makeID,
  deepFreeze,
  clearMap,
  multiplySomething,
  checkProperties,
  getNonCallableProps,
  mixUp,
  getMapValues,
  removeFromArray,
  isJson,
  // Symbols.
  no_freeze
};
