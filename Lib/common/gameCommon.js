/**
 * @fileoverview File for storing common game methods.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const Vector = require("../Game/Physics/Vector");
const Icon = require("../Game/UI/Icon");
const Button = require("../Game/UI/Button");
const Constants = require("./constants");

// JSDoc typedefs for VSCode.
/**
 * @typedef {"buttons"|"icons"} UITypes
 */
/**
 * @typedef {Object} Size
 * @prop {number} width
 * @prop {number} height
 */
/**
 * @typedef {Object} PopulationStats
 * @prop {number} used
 * @prop {number} max
 */
/**
 * @typedef {Object} ResourceStats
 * @prop {number} wood
 * @prop {number} stone
 * @prop {number} food
 * @prop {number} coins
 * @prop {number} ammo
 */
/**
 * @typedef {Object} UIOptions
 * @prop {ScaleOptions} [scaleOpts]
 * @prop {Size} [clientScreenSize]
 * @prop {Vector} [startPosition]
 * @prop {Object} [playerStats]
 * @prop {ResourceStats} [playerStats.resources]
 * @prop {ResourceStats} [playerStats.resourceRate]
 * @prop {PopulationStats} [playerStats.population]
 */
/**
 * @typedef {Object} ScreenSize
 * @prop {number} width
 * @prop {number} height
 */
/**
 * @typedef {Object} ScaleOptions Translate options. If the first
 * two properties are omitted, then the last two are required.
 * @prop {ScreenSize} [baseScreenSize] The base screen size to
 * translate the value to.
 * @prop {ScreenSize} [otherScreenSize] The other screen size that
 * the value is coming from.
 * @prop {number} [scaleBy] The scale by which to calculate by.
 */

/**
 * Gets the euclidean distance squared.
 * @param {Vector} p1 Point number 1.
 * @param {Vector} p2 Point number 2.
 * @returns {number}
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
 * Tests if a point is in a circle.
 * @param {Vector} circlePosition The circle's position.
 * @param {number} circleRadius The circle's radius.
 * @param {Vector} pointPosition The point that you want to test.
 * @returns {boolean}
 */
function inCircle(circlePosition, circleRadius, pointPosition) {
  // TODO: See if this is correct. Probably not.
  const euclideanDist = getEuclideanDist2(pointPosition, circlePosition);

  const isInCircle = euclideanDist < circleRadius;
  return isInCircle;
}
// TODO: Remove the following function. We will be moving UI management
// to the client side.
/**
 * Makes the UI for a player.
 * @param {UITypes} type The type of UI to make.
 * @param {UIOptions} opts Options.
 * @returns {Array<Icon>|Array<Button>}
 */
function makeUI(type, opts) {
  const uiToReturn = [];
  if (!opts.startPosition) {
    opts.startPosition = {};
  }
  if (type === "buttons") {
    // Declarations.
    const buttonKeys = Constants.BUTTON_KEYS;
    const buttonY = opts.startPosition.y || 570;
    let buttonX = opts.startPosition.x || 1100;

    for (const button of buttonKeys) {
      const btn = new Button({
        width: 60,
        height: 60,
        image: button,
        position: new Vector(buttonX, buttonY),
        onClick: () => {
          btn.clicked = true;
          btn.lastClickTime = Date.now();
        },
        onHover: () => {
          btn.hovered = true;
        },
        onNotHover: () => {
          btn.hovered = false;
        },
        onNotClick: () => {
          btn.clicked = false;
          btn.lastClickTime = Date.now();
        }
      });
      uiToReturn.push(btn);
      buttonX += 80;
    }
  } else if (type === "icons") {
    // Declarations.
    const iconKeys = Constants.ICON_KEYS;
    const textOffset = new Vector(50, 30);
    const textOffsetHeight = new Vector(-28, 20);
    const iconsY = opts.startPosition.x || 15;
    let iconsX = opts.startPosition.x || 685;
    // Add icons, except for the people icon.
    for (const icon of iconKeys) {
      const infoText = Constants.ICON_INFO_TEXT[icon];
      const value = opts.playerStats.resources[icon];
      const valueIncrease = opts.playerStats.resourceRate[icon];

      // FIXME: See if the following if statement should use `continue`.
      if (icon === "people") { break; }
      const iconToCreate = new Icon({
        image: icon,
        position: new Vector(iconsX, iconsY),
        value: `${value}`,
        valueIncrease: valueIncrease,
        infoText: infoText,
        clickable: false,
        textOffset: textOffset,
        textOffset2: textOffsetHeight,
        onHover: () => {
          iconToCreate.hovered = true;
          iconToCreate.displayInfoText = true;
        },
        onNotHover: () => {
          iconToCreate.hovered = false;
          iconToCreate.displayInfoText = false;
        }
      });

      uiToReturn.push(iconToCreate);
      iconsX += 110;
    }

    // NOW create the people icon.
    const iconToCreate = new Icon({
      image: "people",
      position: new Vector(iconsX, iconsY),
      value:
        `${
          opts.playerStats.population.used
        } / ${
          opts.playerStats.population.max
        }`,
      valueIncrease: null,
      infoText: Constants.ICON_INFO_TEXT.people,
      clickable: false,
      textOffset: textOffset,
      textOffset2: textOffsetHeight,
      onHover: () => {
        iconToCreate.hovered = true;
        iconToCreate.displayInfoText = true;
      },
      onNotHover: () => {
        iconToCreate.hovered = false;
        iconToCreate.displayInfoText = false;
      }
    });

    uiToReturn.push(iconToCreate);
  }
  return uiToReturn;
}

/**
 * Module exports.
 */
module.exports = exports = {
  getEuclideanDist2,
  inCircle,
  makeUI
};
