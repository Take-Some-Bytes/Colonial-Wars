/**
 * @fileoverview Input class for managing client input.
 * @author Horton Cheng <horton0712@gmail.com>
 */

import EventEmitter from "../common/EventEmitter.js";

/**
 * Input class.
 * @extends EventEmitter
 */
export default class Input extends EventEmitter {
  /**
   * Constructor for an Input class.
   * @class
   */
  constructor() {
    super();
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;

    this.leftMouseDown = false;
    this.rightMouseDown = false;
    this.mousePosition = [0, 0];
    // TODO: See if this property is needed.
    this.pastMousePosition = [0, 0];
  }
  /**
   * Event handler for the `keydown` event.
   * @param {KeyboardEvent} event The event to handle.
   */
  onKeyDown(event) {
    // TODO: See if this should use `event.code` instead. The current code
    // won't work if the client does NOT have a QWERTY keyboard.
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
    const state = {
      directionData: {
        up: this.up,
        down: this.down,
        right: this.right,
        left: this.left
      },
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    };
    this.emit("input", state);
  }
  /**
   * Event handler for the `keyup` event.
   * @param {KeyboardEvent} event The event to handle.
   */
  onKeyUp(event) {
    // TODO: See if this should use `event.code` instead. The current code
    // won't work if the client does NOT have a QWERTY keyboard.
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
    const state = {
      directionData: {
        up: this.up,
        down: this.down,
        right: this.right,
        left: this.left
      },
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    };
    this.emit("input", state);
  }
  /**
   * Handles a `mousedown` event.
   * @param {MouseEvent} event The Mouse event to handle.
   */
  onMouseDown(event) {
    if (event.button === 0) {
      this.leftMouseDown = true;
    }
    if (event.button === 1) {
      this.rightMouseDown = true;
    }
    const state = {
      directionData: {
        up: this.up,
        down: this.down,
        right: this.right,
        left: this.left
      },
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    };
    this.emit("input", state);
  }
  /**
   * Handles a `mouseup` event.
   * @param {MouseEvent} event The Mouse event to handle.
   */
  onMouseUp(event) {
    if (event.button === 0) {
      this.leftMouseDown = false;
    }
    if (event.button === 1) {
      this.rightMouseDown = false;
    }
    const state = {
      directionData: {
        up: this.up,
        down: this.down,
        right: this.right,
        left: this.left
      },
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    };
    this.emit("input", state);
  }
  /**
   * Handles a `mousemove` event.
   * @param {MouseEvent} event The Mouse event to handle.
   */
  onMouseMove(event) {
    this.mousePosition[0] = event.offsetX;
    this.mousePosition[1] = event.offsetY;

    const state = {
      directionData: {
        up: this.up,
        down: this.down,
        right: this.right,
        left: this.left
      },
      mouseData: {
        leftMousePressed: this.leftMouseDown,
        rightMousePressed: this.rightMouseDown,
        mouseCoords: this.mousePosition
      }
    };
    this.emit("input", state);
  }
  /**
   * Applies the event handlers to elements in the DOM.
   * @param {Element} keyElement The element to track keypresses on.
   * @param {Element} mouseClickElement The element to track mouse clicks on.
   * @param {Element} mouseMoveElement The element to track mouse movement
   * relative to.
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
   * Factory method for a Input class.
   * @param {Element} keyElement The element to listen for keypresses and
   * mouse clicks on.
   * @param {Element} mouseMoveElement The element to track mouse coordinates
   * relative to.
   * @returns {Input}
   */
  static create(keyElement, mouseMoveElement) {
    const input = new Input();
    input.applyEventHandlers(keyElement, keyElement, mouseMoveElement);
    return input;
  }
}
