/**
 * @fileoverview Drawing class to handle game-drawing on client
 * side
 * @author Horton Cheng <horton0712@gmail.com>
 */

import { Constants } from "../Constants-client.js";
import { Viewport } from "./Viewport.js";

/**
 * Drawing class
 */
export class Drawing {
  /**
   * Constructor for the Drawing class.
   * @param {CanvasRenderingContext2D} context The canvas context to draw to
   * @param {Object<string, Image>} images The image assets for each entity
   * @param {Viewport} viewport The viewport class to translate from absolute
   * world coordinates to relative player coordinates.
   * @param {String} mapName The map name of the map that the player is playing
   * on
   */
  constructor(context, images, viewport, mapName) {
    this.context = context;
    this.images = images;
    this.viewport = viewport;

    this.width = context.canvas.width;
    this.height = context.canvas.height;
    this.mapName = mapName;
    this.tilesCanDraw =
      mapName === "testing" ?
        ["test_tile"] :
        [""];
  }
  /**
   * Clears the canvas
   */
  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }
  /**
   * Draws the background tiles to the canvas.
   */
  drawTiles() {
    if(this.mapName === "testing") {
      const start = this.viewport.toCanvas(
        { x: Constants.WORLD_MIN, y: Constants.WORLD_MIN });
      const end = this.viewport.toCanvas(
        { x: Constants.WORLD_MAX, y: Constants.WORLD_MAX });
      for(let x = start.x; x < end.x; x += Constants.DRAWING_TILE_SIZE) {
        for(let y = start.y; y < end.y; y += Constants.DRAWING_TILE_SIZE) {
          this.context.drawImage(this.images[this.tilesCanDraw[0]], x, y)
        }
      }
    }
  }
  /**
   * Draws a building to the game world
   * @param {Building} building The building to draw
   */
  drawBuilding(building) {
    this.context.save();
    const canvasPosition = this.viewport.toCanvas(building.position);
    this.context.translate(canvasPosition.x, canvasPosition.y);
    this.drawCenteredImage(this.images[building.type]);
    this.context.restore();
  }
  /**
   * Draws a centered image
   * @param {Image} image The image to draw
   */
  drawCenteredImage(image) {
    this.context.drawImage(image, -image.width / 2, -image.height / 2);
  }
  /**
   * Creates a Drawing class
   * @param {HTMLCanvasElement} canvas The canvas element to draw to
   * @param {Viewport} viewport The viewport object for coordinate translation
   * @param {String} mapName The map name of the map that the player is playing
   * on
   * @returns {Drawing}
   */
  static create(canvas, viewport, mapName) {
    const context = canvas.getContext("2d");
    const images = {};
    //Add tiles
    if(mapName === "testing") {
      images.test_tile = new Image();
      images.test_tile.src =
        `${Constants.DRAWING_TILE_BASE_PATH}/test_tile.png`;
    } else {
      for(const tile of Constants.DRAWING_TILE_KEYS) {
        images[tile] = new Image();
        images[tile].src = `${Constants.DRAWING_TILE_BASE_PATH}/${tile}.png`;
      }
    }

    //Add buildings
    for(const building of Constants.DRAWING_BUILDING_KEYS) {
      images[building] = new Image();
      images[building].src =
        `${Constants.DRAWING_BUILDING_BASE_PATH}/${building}.png`;
    }
    return new Drawing(context, images, viewport, mapName);
  }
}
