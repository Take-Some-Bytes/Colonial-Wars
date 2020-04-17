/**
 * @fileoverview Manager class to manage to games running on the server
 * @author Horton Cheng <horton0712@gmail.com>
 * @version
 */

const Game = require("./Game");
const { deepClear } = require("../../Util");

/**
 * Manager class
 */
class Manager {
  /**
    * Constructor for the manager class
    */
  constructor() {
    /**
       * This is a Map containing all of the connected clients
       */
    this.clients = new Map();
    /**
       * This is a Map containing all of the games running
       * on the server
       */
    this.games = new Map();

    this.deltaTime = 0;
    this.lastUpdateTime = 0;
  }
  /**
    * Gets the total amount of clients on the server
    * @returns {Number}
    */
  get numPlayers() {
    return this.clients.size;
  }
  /**
    * Initializes the Manager state
    */
  init() {
    this.lastUpdateTime = Date.now();

    deepClear(this.games, true);
    deepClear(this.clients, true);
  }
  /**
    * Adds a new client
    * @param {Object} socket The socket object associated with this client
    */
  addNewClient(socket) {
    this.clients.set(socket.id, socket);
  }
  /**
    * Adds a new game, then returns the made game
    * @param {String} mode The game mode
    * @param {String} gameID The game ID
    * @param {Object<Vector>} startPositions The start positions of the players
    * that join a team
    * @returns {Game}
    */
  addNewGame(mode, gameID, startPositions) {
    const game = new Game(mode, gameID, startPositions);
    this.games.set(gameID, game);
    return game;
  }
  /**
    * Removes an existing game
    * @param {String} gameID The ID associated with the game
    */
  removeGame(gameID) {
    if(this.games.has(gameID)) {
      this.games.delete(gameID);
    }
  }
  /**
    * Gets the game with the specified game ID
    * @param {String} gameID The game ID associated with the game you want to get
    * @returns {Game}
    */
  getGame(gameID) {
    if(this.games.has(gameID)) {
      const game = this.games.get(gameID);
      return game;
    }
    throw new Error("Game does not exist; cannot get game.")
  }
  /**
    * Create a new game manager
    * @returns {Manager}
    */
  static create() {
    const manager = new Manager();
    manager.init();
    return manager;
  }
}

/**
 * Module exports
 */
module.exports = exports = Manager;