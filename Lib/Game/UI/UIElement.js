/**
 * @fileoverview UIElement base class for all the UI in the game
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const Vector = require("../Physics/Vector");

// TODO: Move this class to the client-side.
/**
 * UI element class.
 */
class UIElement {
  /**
   * Constructor for a UIElement class.
   * @class
   * @param {{
   * width: number,
   * height: number,
   * image: string,
   * position: Vector,
   * clickable: boolean,
   * value: any,
   * children: Array<any>,
   * onHover: function():void,
   * onNotHover: function():void
   * }} config Config.
   */
  constructor(config) {
    this.width = config.width || 133;
    this.height = config.height || 25;
    this.image = config.image || undefined;
    this.value = config.value;

    this.position = config.position || Vector.zero();
    // TODO: Update these default functions to something more useful.
    this.onHover = config.onHover || function onHover() { return false; };
    this.onNotHover =
      config.onNotHover || function onNotHover() { return false; };
    this.clickable = config.clickable || false;
    this.children = config.children;

    this.hovered = false;
  }
  /**
   * Test if the mouse is inside the UI element.
   * @param {{
   * mouseX: number,
   * mouseY: number
   * }} event The mouse event that happened.
   * @returns {boolean}
   */
  isMouseInside(event) {
    // TODO: Clean up this expression.
    return event.mouseX > this.position.x &&
      event.mouseX < this.position.x + this.width &&
      event.mouseY > this.position.y &&
      event.mouseY < this.position.y + this.height;
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
    if (this.isMouseInside(event)) {
      this.children.forEach(elem => {
        elem.handleMouseEvent(event);
      });
    }
  }
  /**
   * Updates the stuff inside the ```children``` property of
   * this UIElement.
   */
  updateChildren() {
    for (const child of this.children) {
      try {
        child.updateValue();
      } catch (err) {
        continue;
      }
    }
  }
}

/**
 * Module exports.
 */
module.exports = exports = UIElement;
