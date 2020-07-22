/**
 * @fileoverview Game class for managing client-side game
 * @author Horton Cheng <horton0712@gmail.com>
 */
//Imports
import { Constants } from "../Constants-client.js";
import { Drawing } from "./Drawing.js";
import { Input } from "./Input.js";
import { Vector } from "./Physics/Vector.js";
import { Viewport } from "./Viewport.js";

/**
 * @typedef {Object} InputState
 * @property {Object} directionData
 * @property {Boolean} directionData.up
 * @property {Boolean} directionData.down
 * @property {Boolean} directionData.right
 * @property {Boolean} directionData.left
 * @property {Object} mouseData
 * @property {Boolean} mouseData.leftMousePressed
 * @property {Boolean} mouseData.rightMousePressed
 * @property {Array<Number>} mouseData.mouseCoords
 */
/**
 * Game class
 */
export class Game {
  /**
   * Constructor for a Game class
   * @param {Socket} socket The socket object associated with this player
   * @param {Viewport} viewport Viewport object
   * @param {Drawing} drawing Drawing object
   * @param {Input} input Input object
   * @param {String} expectedToken The expected token for the server-side game
   * @param {String} token The token of the client.
   * @param {String} id The ID of the server-side game this client is
   * connected to
   */
  constructor(socket, viewport, drawing, input, expectedToken, token, id) {
    this.socket = socket;

    this.viewport = viewport;
    this.drawing = drawing;
    this.input = input;
    this.expectedToken = expectedToken;
    this.token = token;
    this.id = id;

    this.projectiles = [];
    this.troops = [];
    this.buildings = [];

    this.buttons = [];
    this.icons = [];
    this.resources = {};
    this.resourceRates = {};
    this.population = {};
    this.uiBackgrounds = [];
    //this.obstacles = [];

    this.self = null;
    this.deltaTime = 0;
    this.lastUpdateTime = 0;
    this.animationFrameId = null;
  }
  /**
   * Initializes the Game object and binds the socket event listener.
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
      this.buildings.forEach(this.drawing.drawBuilding.bind(this.drawing));
      this.uiBackgrounds.forEach(
        this.drawing.drawUIBackground.bind(this.drawing)
      );
      this.buttons.forEach(this.drawing.drawButton.bind(this.drawing));
      this.icons.forEach(this.drawing.drawStat.bind(this.drawing));
    }
  }
  /**
   * Does stuff when the game receives an update from the server
   * @param {{}} data The received state
   */
  onReceiveGameState(data) {
    const parsedData = JSON.parse(data);
    const gameData = parsedData.gameData.gameStats;
    const playerData = parsedData.gameData.playerStats;

    if (this.expectedToken !== parsedData.securityData.gameToken) {
      const body = document.body;
      body.innerHTML = "";
      body.innerHTML =
        "<h1>Oops! It looks like your connection has been hacked</h1>\n" +
        "<h3>The received game token does not match " +
        "the expected game token.<br>\nIt is assumed that your connection has" +
        "been hacked. We are sorry for the inconvenience.</h3>";
      return;
    }
    this.self = parsedData.gameData.self;
    // this.players = state.players;
    // this.projectiles = state.projectiles;
    this.buildings = gameData.buildings;
    // this.troops = state.troops;
    this.buttons = playerData.playerUi[0].children;
    this.icons = playerData.playerUi[1].children;
    this.resources = playerData.resources;
    this.resourceRates = playerData.resourceRates;
    this.population = playerData.population;
    this.uiBackgrounds = playerData.playerUi;
    console.log(playerData.playerUi);

    this.viewport.updateTrackingPosition(parsedData.gameData.self);
  }
  /**
   * Updates this game object on input
   * @param {InputState} state The current input state
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
  /**
   * Resets this client's token
   * @param {String} newToken The new token for the client
   */
  resetToken(newToken) {
    this.token = newToken;
  }
  /**
   * Factory method for creating a Game class instance.
   * @param {Socket} socket The socket connected to the server
   * @param {String} canvasElementID The ID of the canvas element to render the
   * game to
   * @param {String} mapName The map's name of the game that the
   * client is playing on
   * @param {String} expectedToken The expected token for the server-side game
   * @param {String} token The token of the client.
   * @param {String} id The ID of the server-side game this client is
   * connected to
   * @returns {Game}
   */
  static create(
    socket, canvasElementID, mapName,
    expectedToken, token, id
  ) {
    const canvas = document.getElementById(canvasElementID);
    canvas.width = Constants.VIEWPORT_WIDTH;
    canvas.height = Constants.VIEWPORT_HEIGHT;

    const viewport = Viewport.create(canvas);
    const drawing = Drawing.create(canvas, viewport, mapName);
    const input = Input.create(document, canvas);

    const game = new Game(
      socket, viewport, drawing, input, expectedToken, token, id
    );
    game.init();
    return game;
  }
}
