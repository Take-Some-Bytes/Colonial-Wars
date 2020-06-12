/**
 * @fileoverviewIcon element class for handling icons
 * @author Horton Cheng <horton0712@gmail.com>
 */

const UIElement = require("./UIElement");
const Vector = require("../Physics/Vector");
const Constants = require("../../Constants");

/**
 * Icon class
 * @extends UIElement
 */
class Icon extends UIElement {
  /**
   * Constructor for a StatBoardElem class
   * @param {{
   * image: String,
   * position: Vector,
   * infoText: String,
   * value: any,
   * name: String,
   * clickable: Boolean,
   * onClick: function():void,
   * onHover: function():void,
   * onNotClick: function():void,
   * onNotHover: function():void
   * }} config Configurations
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
    this.onClick = config.onClick;
    this.onNotClick = config.onNotClick;

    this.displayInfoText = false;
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
module.exports = exports = Icon;