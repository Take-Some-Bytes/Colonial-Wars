/**
 * @fileoverview Viewport class to manage client viewport
 * @author Horton Cheng <horton0712@gmail.com>
 */

import { Constants } from "../Constants-client.js";
import { Entity } from "./Physics/Entity.js";
import { Vector } from "./Physics/Vector.js";

/**
 * Viewport class
 */
export class Viewport extends Entity {
  /**
   * Constructor for a Viewport object. The position of the viewport will hold
   * the absolute world coordinates for the top left of the view (which
   * correspond to canvas coordinates [width / 2, height / 2]).
   * @param {Vector} position The starting position of the viewport
   * @param {Vector} velocity The starting velocity of the viewport
   * @param {number} canvasWidth The width of the canvas for this viewport
   * @param {number} canvasHeight The height of the canvas for this viewport
   */
  constructor(position, velocity, canvasWidth, canvasHeight) {
    super(position, velocity);

    this.playerPosition = null;
    this.canvasOffset = new Vector(canvasWidth / 2, canvasHeight / 2);
  }
  /**
   * Updates the specified player's tracking position
   * @param {Player} player The player to track
   */
  updateTrackingPosition(player) {
    this.playerPosition = Vector.sub(player.position, this.canvasOffset);
  }
  /**
   * Performs a physics update
   * @param {Number} deltaTime The timestep to perform the update with
   */
  update(deltaTime) {
    this.velocity = Vector.sub(this.playerPosition, this.position).scale(
      Constants.VIEWPORT_STICKINESS * deltaTime);
    this.position.add(this.velocity);
  }
  /**
   * Converts an absolute world coordinate to a position on the canvas in this
   * viewport's field of view.
   * @param {Vector} position The absolute world coordinate to convert.
   * @return {Vector}
   */
  toCanvas(position) {
    return Vector.sub(position, this.position);
  }
  /**
   * Converts a canvas coordinate to an absolute world coordinate in this
   * viewport's field of view.
   * @param {Vector} position The canvas coordinate to convert
   * @return {Vector}
   */
  toWorld(position) {
    return Vector.add(position, this.position);
  }
  /**
   * Factory method for a Viewport object
   * @param {HTMLCanvasElement} canvas The canvas element
   * to attach this viewport
   * object to
   * @returns {Viewport}
   */
  static create(canvas) {
    return new Viewport(
      Vector.zero(), Vector.zero(),
      canvas.width, canvas.height
    )
  }
}
