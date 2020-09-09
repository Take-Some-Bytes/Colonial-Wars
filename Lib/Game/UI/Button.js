/**
 * @fileoverview Button class for handling button clicks
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const Vector = require("../Physics/Vector");
const Constants = require("../../common/constants");
const UIElement = require("./UIElement");

// TODO: Move this class to the client-side.
/**
 * Button class.
 * @extends UIElement
 */
class Button extends UIElement {
  /**
   * Constructor for a Button class.
   * @class
   * @param {{
   * width: number,
   * height: number,
   * image: string,
   * position: Vector,
   * onClick: function():void,
   * onHover: function():void,
   * onNotClick: function():void,
   * onNotHover: function():void
   * }} config Button config.
   */
  constructor(config) {
    super({
      width: config.width,
      height: config.height,
      image: config.image,
      position: config.position,
      clickable: true,
      value: null,
      onHover: config.onHover,
      onNotHover: config.onNotHover
    });

    this.onClick = config.onClick;
    this.onNotClick = config.onNotClick;

    this.clicked = false;
    // We need the `lastClickTime` property to make sure the button
    // gets clicked properly.
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
   * Handles a mouse event.
   * @param {{
   * mouseX: number,
   * mouseY: number,
   * clicked: boolean
   * }} event The mouse event that happened.
   */
  handleMouseEvent(event) {
    // We need to check if the mouse is inside this button,
    // and whether this button could be clicked at this specific moment,
    // and then act accordingly.
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
module.exports = exports = Button;
