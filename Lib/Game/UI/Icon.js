/**
 * @fileoverview Icon element class for handling icons
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const UIElement = require("./UIElement");
const Vector = require("../Physics/Vector");
const Constants = require("../../common/constants");

// TODO: Move this class to the client-side.
/**
 * Icon class.
 * @extends UIElement
 */
class Icon extends UIElement {
  /**
   * Constructor for a Icon class.
   * @class
   * @param {{
   * image: string,
   * position: Vector,
   * infoText: string,
   * value: any,
   * valueIncrease: number,
   * name: string,
   * clickable: boolean,
   * textOffset: Vector,
   * textOffset2: Vector,
   * onClick: function():void,
   * onHover: function():void,
   * onNotClick: function():void,
   * onNotHover: function():void
   * }} config Configurations.
   */
  constructor(config) {
    super({
      width: 40,
      height: 40,
      image: config.image,
      position: config.position,
      clickable: config.clickable,
      value: config.value,
      onHover: config.onHover,
      onNotHover: config.onNotHover
    });

    this.name = config.name;
    this.infoText = config.infoText;
    this.textOffset = config.textOffset;
    this.textOffset2 = config.textOffset2;
    this.valueIncrease = config.valueIncrease;
    this.onClick = config.onClick;
    this.onNotClick = config.onNotClick;

    this.displayInfoText = false;
    this.clicked = false;
    this.lastClickTime = 0;
  }
  /**
   * Returns a boolean based on whether this button could be
   * clicked or not.
   * @returns {boolean}
   */
  canClick() {
    const canClick =
      Date.now() > this.lastClickTime + Constants.BUTTON_COOLDOWN;
    return canClick;
  }
  /**
   * Updates this icon's ```value``` property.
   */
  updateValue() {
    let parsedValue = typeof this.value === "number" ?
      this.value :
      parseInt(this.value, 10);
    if (isNaN(this.value)) {
      throw new TypeError(
        "Value is not a number; cannot update value property"
      );
    }
    parsedValue += this.valueIncrease;
    this.value = parsedValue;
  }
  /**
   * Updates the value increase of this icon.
   * @param {number|string} newIncrease The new number to increase by. Must
   * be a number or a string that could be parsed into a number.
   */
  updateValueIncrease(newIncrease) {
    const parsedValue =
      typeof newIncrease === "number" ?
        newIncrease :
        parseInt(newIncrease, 10);

    // debug("Updating valueIncrease of icon: ", this.image);
    // debug(
    //   `New valueIncrease: ${parsedValue}. Type of it: ${typeof parsedValue}`
    // );
    if (typeof parsedValue !== "number") {
      throw new TypeError(
        "The supplied parameter is not, and could not be converted to a number!"
      );
    } else if (isNaN(parsedValue)) {
      throw new TypeError("Value is NaN!");
    }

    this.valueIncrease = parsedValue;
  }
  /**
   * Handles a mouse event.
   * @param {{
   * mouseX: number,
   * mouseY: number,
   * clicked: boolean
   * }} event The mouse event that happened.
   */
  handleMouseEvent(event) {
    const isMouseInside = this.isMouseInside(event);
    const canClick = this.canClick();

    if (
      canClick && isMouseInside &&
      event.clicked && !this.clicked &&
      this.clickable
    ) {
      this.onClick();
    } else if (
      canClick && isMouseInside && event.clicked &&
      this.clicked && this.clickable
    ) {
      this.onNotClick();
    } else if (isMouseInside && !event.clicked) {
      this.onHover();
    } else if (!isMouseInside) {
      this.onNotHover();
    }
  }
}

/**
 * Module exports.
 */
module.exports = exports = Icon;
