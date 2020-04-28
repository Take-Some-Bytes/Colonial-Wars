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
    this.mousePosition = [0, 0]
    this.pastMousePosition = [0, 0];
  }
  /**
   * Event handler for the `keydown` event
   * @param {KeyboardEvent} event The event to handle
   */
  onKeyDown(event) {
    switch(event.key) {
    case "A":
    case "ArrowLeft":
      this.left = true;
      break;
    case "W":
    case "ArrowUp":
      this.up = true;
      break;
    case "S":
    case "ArrowDown":
      this.down = true;
      break;
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
    switch(event.key) {
    case "A":
    case "ArrowLeft":
      this.left = false;
      break;
    case "W":
    case "ArrowUp":
      this.up = false;
      break;
    case "S":
    case "ArrowDown":
      this.down = false;
      break;
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
    if(event.button === 0) {
      this.leftMouseDown = true;
    } else if(event.button === 1) {
      this.rightMouseDown = true;
    }
  }
  /**
   * Handles a `mousedown` event
   * @param {MouseEvent} event The Mouse event to handle
   */
  onMouseUp(event) {
    if(event.button === 0) {
      this.leftMouseDown = false;
    } else if(event.button === 1) {
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
}