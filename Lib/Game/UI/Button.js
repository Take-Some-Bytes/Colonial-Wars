/**
 * @fileoverview Button class for handling button clicks
 * @author Horton Cheng <horton0712@gmail.com>
 */

const Vector = require("../Physics/Vector");
const Constants = require("../../Constants");

/**
 * Button class
 */
class Button {
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
    this.width = config.width || 133;
    this.height = config.height || 25;
    this.image = config.image || undefined;
    this.position = config.position;
    this.onClick = config.onClick;
    this.onHover = config.onHover;
    this.onNotClick = config.onNotClick;
    this.onNotHover = config.onNotHover;
    this.clicked = false;
    this.hovered = false;
    this.clickable = true;
    this.lastClickTime = 0;
  }
  /**
   * Test if the mouse is inside the button
   * @param {{
   * mouseX: Number,
   * mouseY: Number
   * }} event The mouse event that happened
   * @returns {Boolean}
   */
  isMouseInside(event) {
    return event.mouseX > this.position.x &&
        event.mouseX < this.position.x + this.width &&
        event.mouseY > this.position.y &&
        event.mouseY < this.position.y + this.height;
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
    } else if (isMouseInside && !event.clicked && this.clickable) {
      this.onHover();
    } else if (!isMouseInside && this.clickable) {
      this.onNotHover();
    }
  }
}

/**
 * Module exports
 */
module.exports = exports = Button;