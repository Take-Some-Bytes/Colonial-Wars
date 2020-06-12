/**
 * @fileoverview Drawing class to handle game-drawing on client
 * side
 * @author Horton Cheng <horton0712@gmail.com>
 */

import { Constants } from "../Constants-client.js";
import { Vector } from "./Physics/Vector.js";
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
    if (this.mapName === "testing") {
      const start = this.viewport.toCanvas(
        { x: Constants.WORLD_MIN, y: Constants.WORLD_MIN });
      const end = this.viewport.toCanvas(
        { x: Constants.WORLD_MAX, y: Constants.WORLD_MAX });
      for (let x = start.x; x < end.x; x += Constants.DRAWING_TILE_SIZE) {
        for (let y = start.y; y < end.y; y += Constants.DRAWING_TILE_SIZE) {
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
   * Draws a button to the player's viewport
   * @param {Button} button The button to draw
   */
  drawButton(button) {
    if (!button.hovered && !button.clicked) {
      const canvasPosition = button.position;
      const framePosition = [0, 0];

      this.context.drawImage(
        this.images[button.image],
        framePosition[0] * button.width,
        framePosition[1] * button.height,
        button.width, button.height,
        canvasPosition.x, canvasPosition.y,
        button.width, button.height
      );
    } else if (button.hovered) {
      const canvasPosition = button.position;
      const framePosition = [1, 0];

      this.context.drawImage(
        this.images[button.image],
        framePosition[0] * button.width,
        framePosition[1] * button.height,
        button.width, button.height,
        canvasPosition.x, canvasPosition.y,
        button.width, button.height
      );
    } else if (button.clicked) {
      const canvasPosition = button.position;
      const framePosition = [1, 0];

      this.context.drawImage(
        this.images[button.image],
        framePosition[0] * button.width,
        framePosition[1] * button.height,
        button.width, button.height,
        canvasPosition.x, canvasPosition.y,
        button.width, button.height
      );
    }
  }
  /**
   * Draws a section of the UI background
   * @param {String} sectionName The section of the UI background that you want
   * to draw
   */
  drawUIBackground(sectionName) {
    let position = null;
    let size = null;
    switch (sectionName) {
    case "background_1":
      position = new Vector(1060, 538);
      size = {
        width: 313,
        height: 125
      };
      break;
    case "resource_stats_background":
      position = new Vector(667, 0);
      size = {
        width: 700,
        height: 75
      };
      break;
    default:
      throw new Error("Section name not recognized!");
    }

    this.context.drawImage(
      this.images[sectionName],
      position.x, position.y,
      size.width, size.height
    );
  }
  /**
   * Draws an icon to the game world
   * @param {Icon} icon The icon to draw
   */
  drawIcon(icon) {
    const position = icon.position;

    this.context.drawImage(
      this.images[icon.image],
      position.x, position.y,
      40, 40
    );
  }
  /**
   * Draws the stats on to the canvas
   * @param {{
   * wood: Number,
   * stone: Number,
   * food: Number,
   * coin: Number,
   * peopleMax: Number,
   * peopleUsed: Number
   * }} stats The stats to draw
   */
  drawStats(stats) {
    if (stats) {
      const statNames = Object.getOwnPropertyNames(stats);
      const statLength = statNames.length - 2;

      const y = 45;
      let x = 735;
      this.context.font = "20px system-ui";

      for (let i = 0; i < statLength; i++) {
        this.context.fillText(
          stats[statNames[i]],
          x, y
        );

        x += 110;
      }

      this.context.fillText(
        `${stats.peopleUsed} /  ${stats.peopleUsed}`,
        x, y
      );
    }
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
    //Add UI elements
    for (const btn of Constants.DRAWING_BUTTON_KEYS) {
      images[btn] = new Image();
      images[btn].src =
        `${Constants.DRAWING_UI_BASE_PATH}/buttons/${btn}.png`;
    }
    for (const bg of Constants.DRAWING_UI_BACKGROUND_KEYS) {
      images[bg] = new Image();
      images[bg].src =
        `${Constants.DRAWING_UI_BASE_PATH}/backgrounds/${bg}.png`
    }
    for (const icon of Constants.DRAWING_ICON_KEYS) {
      images[icon] = new Image();
      images[icon].src =
        `${Constants.DRAWING_UI_BASE_PATH}/icons/${icon}_icon.png`
    }
    //Add tiles
    if (mapName === "testing") {
      images.test_tile = new Image();
      images.test_tile.src =
        `${Constants.DRAWING_TILE_BASE_PATH}/test_tile.png`;
    } else {
      for (const tile of Constants.DRAWING_TILE_KEYS) {
        images[tile] = new Image();
        images[tile].src = `${Constants.DRAWING_TILE_BASE_PATH}/${tile}.png`;
      }
    }
    //Add buildings
    for (const building of Constants.DRAWING_BUILDING_KEYS) {
      images[building] = new Image();
      images[building].src =
        `${Constants.DRAWING_BUILDING_BASE_PATH}/${building}.png`;
    }
    return new Drawing(context, images, viewport, mapName);
  }
}
