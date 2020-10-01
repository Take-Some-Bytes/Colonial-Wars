/**
 * @fileoverview Manager class to manage to games running on the server.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
// const debug = require("../common/debug");
const { clearMap } = require("../common/util");
const crypto = require("crypto");
const Game = require("./Game");
const Vector = require("./Physics/Vector");
const Constants = require("../common/constants");

/**
 * @typedef {import("socket.io")} SocketIO
 */

// TODO: Clean up this class. Remove unneeded code, methods, and such.
/**
 * Manager class.
 */
class Manager {
  /**
   * Constructor for the manager class.
   * @class
   */
  constructor() {
    /**
     * This is a Map containing all of the games running
     * on the server.
     * @type {Map<string, Game>}
     */
    this.games = new Map();
  }
  /**
   * Gets all the games as an array.
   * @returns {Array<Game>}
   */
  get allGames() {
    const games = [];
    for (const game of this.games.values()) {
      games.push(game);
    }
    return games;
  }
  /**
   * Initializes the Manager state.
   */
  init() {
    this.games = clearMap(this.games);
  }
  /**
   * Adds a new game, then returns the made game.
   * @param {string} mode The game mode.
   * @param {string} gameID The game ID.
   * @param {string} mapName The name of the map that the game is
   * going to take place in.
   * @param {{
   * British: Vector,
   * French: Vector,
   * Russian: Vector,
   * German: Vector,
   * American: Vector,
   * Italian: Vector
   * }} startPositions The start positions of the players
   * that join a team.
   * @returns {Game}
   */
  addNewGame(mode, gameID, mapName, startPositions) {
    // TODO: Add a new `Manager` property stating the maximum number
    // of games this manager should manage.
    // TODO: Update this method to remove unneeded parameters.
    if (this.games.size === Constants.MAX_GAMES) {
      throw new Error("Max number of games is reached; cannot add game");
    }
    const token = crypto.randomBytes(16).toString("hex");
    const game = Game.create(mode, gameID, token, mapName, startPositions);
    this.games.set(gameID, game);
    return game;
  }
  /**
   * Removes an existing game.
   * @param {string} gameID The ID associated with the game.
   */
  removeGame(gameID) {
    // TODO: See if this is good enough or additional cleaning needs to
    // be done. I don't think clients will like the game suddenly freezing
    // on them or something.
    if (this.games.has(gameID)) {
      this.games.delete(gameID);
    }
  }
  /**
   * Gets the game with the specified game ID.
   * @param {string} gameID The game ID associated with the game
   * you want to get.
   * @returns {Game}
   */
  getGame(gameID) {
    if (this.games.has(gameID)) {
      const game = this.games.get(gameID);
      return game;
    }
    throw new Error("Game does not exist; cannot get game.");
  }
  /**
   * Performs updates for all the games this manager is managing.
   */
  update() {
    for (const game of this.games.values()) {
      game.update();
    }
  }
  /**
   * Sends the game state of all the games this manager is managing
   * to the clients that are connected.
   */
  sendState() {
    for (const game of this.games.values()) {
      game.sendState();
    }
  }
  /**
   * Adds a new client to the specified game.
   * @param {string} gameID The game's ID.
   * @param {SocketIO.Socket} client The socket object associated with the
   * client.
   * @param {string} name The display name of the client.
   * @param {string} team The team of the player.
   */
  addClientToGame(gameID, client, name, team) {
    if (this.games.has(gameID)) {
      const game = this.games.get(gameID);
      game.addNewPlayer(client, name, team);
      return;
    }
    throw new Error("Game does not exist; cannot add player to game.");
  }
  /**
   * Removes a client from the specified game.
   * @param {string} gameID The game's ID.
   * @param {SocketIO.Socket} client The socket object associated with the
   * client.
   */
  removeClientFromGame(gameID, client) {
    if (this.games.has(gameID)) {
      const game = this.games.get(gameID);
      game.removePlayer(client.id);
    }
    // TODO: See if we should throw an error in case the game doesn't exist,
    // or do something else.
  }
  /**
   * Create a new game manager.
   * @returns {Manager}
   */
  static create() {
    const manager = new Manager();
    // I think the manager `.init()` function is useless.
    manager.init();
    return manager;
  }
}

/**
 * Module exports.
 */
module.exports = exports = Manager;
