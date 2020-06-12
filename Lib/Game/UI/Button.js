/**
 * @fileoverview Button class for handling button clicks
 * @author Horton Cheng <horton0712@gmail.com>
 */

const Vector = require("../Physics/Vector");
const Constants = require("../../Constants");
const UIElement = require("./UIElement");

/**
 * Button class
 * @extends UIElement
 */
class Button extends UIElement {
  /**
   * Constructor for a Button class
   * @param {{
   * width: Number,
   * height: Number,
   * image: String,
   * position: Vector,
   * onClick: function():void,
   * onHover: function():void,
   * onNotClick: function():void,
   * onNotHover: function():void
   * }} config Button config
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
    this.lastClickTime = 0;
  }
  /**
   * Returns a boolean based on whether this button could be
   * clicked or not
   * @returns {Boolean}
   */
  canClick() {
    const canClick =
      Date.now() > this.lastClickTime + Constants.BUTTON_COOLDOWN
    return canClick;
  }
  /**
   * Handles a mouse event
   * @param {{
   * mouseX: Number,
   * mouseY: Number,
   * clicked: Boolean
   * }} event The mouse event that happened
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
 * Module exports
 */
module.exports = exports = Button;
