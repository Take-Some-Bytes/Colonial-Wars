/**
 * @fileoverview Game class for managing the client-side game.
 * @author Horton Cheng <horton0712@gmail.com>
 */

import Constants from "../Constants-client.js";
import Drawing from "./Drawing.js";
import Input from "./Input.js";
import Vector from "./Physics/Vector.js";
import Viewport from "./Viewport.js";

// JSDoc typedefs for easier development.
/**
 * @typedef {Object} InputState
 * @prop {Object} directionData
 * @prop {boolean} directionData.up
 * @prop {boolean} directionData.down
 * @prop {boolean} directionData.right
 * @prop {boolean} directionData.left
 * @prop {Object} mouseData
 * @prop {boolean} mouseData.leftMousePressed
 * @prop {boolean} mouseData.rightMousePressed
 * @prop {Array<number>} mouseData.mouseCoords
 */
// Not sure why we have to do this twice, but only this works.
/**
 * @typedef {import("socket.io-client")} SocketIOStatic
 * @typedef {SocketIOStatic} SocketIOClient
 */

/**
 * Game class.
 */
export default class Game {
  /**
   * Constructor for a Game class.
   * @class
   * @param {SocketIOClient.Socket} socket
   * The socket object associated with this player.
   * @param {Viewport} viewport Viewport object.
   * @param {Drawing} drawing Drawing object.
   * @param {Input} input Input object.
   * @param {string} id The ID of the server-side game this client is
   * connected to.
   */
  constructor(socket, viewport, drawing, input, id) {
    this.socket = socket;

    this.viewport = viewport;
    this.drawing = drawing;
    this.input = input;
    this.id = id;

    this.projectiles = [];
    this.troops = [];
    this.buildings = [];

    // TODO: Remove all these properties for now. We won't be needing
    // them yet. And, UI management is going to be done in another class.
    this.buttons = [];
    this.icons = [];
    this.resources = {};
    this.resourceRates = {};
    this.population = {};
    this.uiBackgrounds = [];
    // this.obstacles = [];

    this.self = null;
    this.deltaTime = 0;
    this.lastUpdateTime = 0;
    this.animationFrameId = null;
  }
  /**
   * Initializes the Game object and binds the socket and input event listener.
   */
  init() {
    this.lastUpdateTime = Date.now();
    this.socket.on(
      Constants.SOCKET_UPDATE,
      this.onReceiveGameState.bind(this)
    );
    this.input.on(
      "input", this.onInput.bind(this)
    );
  }
  /**
   * Starts the animation and update loop to run the game.
   */
  run() {
    const currentTime = Date.now();
    this.deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // this.update(this.token);
    if (this.self) {
      this.viewport.update(this.deltaTime);
    }
    this.draw();
    this.animationFrameId = window.requestAnimationFrame(this.run.bind(this));
  }
  /**
   * Stops the animation and update loop for the game.
   */
  stop() {
    window.cancelAnimationFrame(this.animationFrameId);
  }
  /**
   * Draws the state of the game to the canvas.
   */
  draw() {
    if (this.self) {
      this.drawing.clear();

      this.drawing.drawTiles();
      // TODO: Comment out all the following code. We don't need it right now.
      this.buildings.forEach(this.drawing.drawBuilding.bind(this.drawing));
      this.uiBackgrounds.forEach(
        this.drawing.drawUIBackground.bind(this.drawing)
      );
      this.buttons.forEach(this.drawing.drawButton.bind(this.drawing));
      this.icons.forEach(this.drawing.drawStat.bind(this.drawing));
    }
  }
  /**
   * Handles the receiving of the game state from the server.
   * @param {string} data The received state
   */
  onReceiveGameState(data) {
    const parsedData = JSON.parse(data);
    const gameData = parsedData.gameData.gameStats;
    const playerData = parsedData.gameData.playerStats;

    this.self = parsedData.gameData.self;
    // this.players = state.players;
    // this.projectiles = state.projectiles;
    // TODO: Comment out the rest of the property assigning.
    this.buildings = gameData.buildings;
    // this.troops = state.troops;
    this.buttons = playerData.playerUi[0].children;
    this.icons = playerData.playerUi[1].children;
    this.resources = playerData.resources;
    this.resourceRates = playerData.resourceRates;
    this.population = playerData.population;
    this.uiBackgrounds = playerData.playerUi;

    this.viewport.updateTrackingPosition(parsedData.gameData.self);
  }
  /**
   * Updates this game object on input from the client.
   * @param {InputState} state The current input state.
   */
  onInput(state) {
    if (this.self) {
      const absoluteMouseCoords = this.viewport.toWorld(
        Vector.fromArray(state.mouseData.mouseCoords)
      );
      // const playerToMouseVector = Vector.sub(
      //   this.self.position,
      //   absoluteMouseCoords
      // );

      this.socket.emit(Constants.SOCKET_PLAYER_ACTION, JSON.stringify({
        playerData: {
          actionData: {
            up: state.directionData.up,
            down: state.directionData.down,
            left: state.directionData.left,
            right: state.directionData.right,
            mouse: {
              leftMousePressed: state.mouseData.leftMousePressed,
              rightMousePressed: state.mouseData.rightMousePressed,
              absMouseCoords: absoluteMouseCoords,
              rltvMouseCoords: Vector.fromArray(state.mouseData.mouseCoords)
            }
          },
          game: this.id
        },
        otherData: {}
      }));
    }
  }
  // TODO: Remove the following function. It is not needed.
  /**
   * Resets this client's token.
   * @param {string} newToken The new token for the client.
   */
  resetToken(newToken) {
    this.token = newToken;
  }
  /**
   * Factory method for creating a Game class instance.
   * @param {SocketIOClient.Socket} socket The socket connected to the server.
   * @param {string} canvasElementID The ID of the canvas element to render the
   * game to.
   * @param {string} mapName The map's name of the game that the
   * client is playing on.
   * @param {string} id The ID of the server-side game this client is
   * connected to.
   * @returns {Game}
   */
  static create(
    socket, canvasElementID, mapName,
    id
  ) {
    const canvas = document.getElementById(canvasElementID);
    canvas.width = Constants.VIEWPORT_WIDTH;
    canvas.height = Constants.VIEWPORT_HEIGHT;

    const viewport = Viewport.create(canvas);
    const drawing = Drawing.create(canvas, viewport, mapName);
    const input = Input.create(document, canvas);

    const game = new Game(
      socket, viewport, drawing, input, id
    );
    game.init();
    return game;
  }
}
