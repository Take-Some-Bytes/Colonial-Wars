/**
 * @fileoverview Input class for managing client input
 * @author Horton Cheng <horton0712@gmail.com>
 */

/**
 * Input class
 */
export class Input {
  /**
   * Constructor for an Input class
   */
  constructor() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;

    this.leftMouseDown = false;
    this.rightMouseDown = false;
    this.mousePosition = [0, 0];
    this.pastMousePosition = [0, 0];
  }
  /**
   * Event handler for the `keydown` event
   * @param {KeyboardEvent} event The event to handle
   */
  onKeyDown(event) {
    switch (event.key) {
    case "a":
    case "A":
    case "ArrowLeft":
      this.left = true;
      break;
    case "w":
    case "W":
    case "ArrowUp":
      this.up = true;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      this.down = true;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      this.right = true;
      break;
    }
  }
  /**
   * Event handler for the `keyup` event
   * @param {KeyboardEvent} event The event to handle
   */
  onKeyUp(event) {
    switch (event.key) {
    case "a":
    case "A":
    case "ArrowLeft":
      this.left = false;
      break;
    case "w":
    case "W":
    case "ArrowUp":
      this.up = false;
      break;
    case "s":
    case "S":
    case "ArrowDown":
      this.down = false;
      break;
    case "d":
    case "D":
    case "ArrowRight":
      this.right = false;
      break;
    }
  }
  /**
   * Handles a `mousedown` event
   * @param {MouseEvent} event The Mouse event to handle
   */
  onMouseDown(event) {
    if (event.button === 0) {
      this.leftMouseDown = true;
    }
    if (event.button === 1) {
      this.rightMouseDown = true;
    }
  }
  /**
   * Handles a `mouseup` event
   * @param {MouseEvent} event The Mouse event to handle
   */
  onMouseUp(event) {
    if (event.button === 0) {
      this.leftMouseDown = false;
    }
    if (event.button === 1) {
      this.rightMouseDown = false;
    }
  }
  /**
   * Handles a `mousemove` event
   * @param {MouseEvent} event The Mouse event to handle
   */
  onMouseMove(event) {
    this.mousePosition[0] = event.offsetX;
    this.mousePosition[1] = event.offsetY;
  }
  /**
   * Applies the event handlers to elements in the DOM.
   * @param {Element} keyElement The element to track keypresses on
   * @param {Element} mouseClickElement The element to track mouse clicks on
   * @param {Element} mouseMoveElement The element to track mouse movement
   *   relative to
   */
  applyEventHandlers(keyElement, mouseClickElement, mouseMoveElement) {
    keyElement.addEventListener("keydown", this.onKeyDown.bind(this));
    keyElement.addEventListener("keyup", this.onKeyUp.bind(this));
    mouseClickElement.addEventListener(
      "mousedown", this.onMouseDown.bind(this)
    );
    mouseClickElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    mouseMoveElement.setAttribute("tabindex", 1);
    mouseMoveElement.addEventListener("mousemove", this.onMouseMove.bind(this));
  }
  /**
   * Factory method for a Input class
   * @param {Element} keyElement The element to listen for keypresses and
   * mouse clicks on
   * @param {Element} mouseMoveElement The element to track mouse coordinates
   * relative to
   * @returns {Input}
   */
  static create(keyElement, mouseMoveElement) {
    const input = new Input();
    input.applyEventHandlers(keyElement, keyElement, mouseMoveElement);
    return input;
  }
}
