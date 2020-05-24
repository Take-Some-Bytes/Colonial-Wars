/**
 * @fileoverview Manager class to manage to games running on the server
 * @author Horton Cheng <horton0712@gmail.com>
 */

const Game = require("./Game");
const Vector = require("./Physics/Vector");
const Constants = require("../Constants");
const crypto = require("crypto");
const socketIO = require("socket.io");
const { deepClear } = require("../Util");

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
   * Gets all the games as an array
   * @returns {Array<Game>}
   */
  get allGames() {
    const games = [];
    for(const game of this.games.values()) {
      games.push(game);
    }
    return games;
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
    * @param {socketIO.Socket} socket The socket object associated with
    * this client
    * @param {{
    * token: String
    * }} session The session of the client
    */
  addNewClient(socket, session) {
    this.clients.set(socket.id, {
      clientID: socket.id,
      clientToken: session.token,
      socket: socket
    });
  }
  /**
   * Removes a client
   * @param {String} socketID The socket ID associated with this client
   */
  removeClient(socketID) {
    if(this.clients.has(socketID)) {
      this.clients.delete(socketID);
    }
  }
  /**
   * Changes a client's stats
   * @param {{
   * id: String,
   * token: String,
   * socket: socketIO.Socket
   * }} newStats The new stats to give the client
   * @param {String} ID The ID of the client. Must be the original ID
   */
  changeStats(newStats, ID) {
    let client = {};
    if(!this.clients.has(ID)) {
      throw new Error("Client does not exist!");
    }
    client = {
      clientID: newStats.id,
      clientToken: newStats.token,
      socket: newStats.socket
    }
    this.clients.delete(ID);
    this.clients.set(newStats.id, client);
  }
  /**
    * Adds a new game, then returns the made game
    * @param {String} mode The game mode
    * @param {String} gameID The game ID
    * @param {String} mapName The name of the map that the game is
    * going to take place in
    * @param {{
    * British: Vector,
    * French: Vector,
    * Russian: Vector,
    * German: Vector,
    * American: Vector,
    * Italian: Vector
    * }} startPositions The start positions of the players
    * that join a team
    * @returns {Game}
    */
  addNewGame(mode, gameID, mapName, startPositions) {
    if(this.games.size === Constants.MAX_GAMES) {
      throw new Error("Max number of games is reached; cannot add game");
    }
    const token = crypto.randomBytes(16).toString("hex");
    const game = new Game(mode, gameID, token, mapName, startPositions);
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
    * @param {String} gameID The game ID associated with the game
    * you want to get
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
   * Performs a game update
   */
  update() {
    for(const game of this.games.values()) {
      game.update();
    }
  }
  /**
   * Sends the player state to all clients
   */
  sendState() {
    for(const game of this.games.values()) {
      game.sendState();
    }
  }
  /**
   * Adds a new client to the specified game
   * @param {String} gameID The game's ID
   * @param {socketIO.Socket} client The socket object associated with the
   * client
   * @param {String} name The display name of the client
   * @param {String} team The team of the player
   */
  addClientToGame(gameID, client, name, team) {
    if(this.games.has(gameID)) {
      const game = this.games.get(gameID);
      game.addNewPlayer(client, name, team);
      return;
    }
    throw new Error("Game does not exist; cannot add player to game.");
  }
  /**
   * Removes a client from the specified game
   * @param {String} gameID The game's ID
   * @param {socketIO.Socket} client The socket object associated with the
   * client
   */
  removeClientFromGame(gameID, client) {
    if(this.games.has(gameID)) {
      const game = this.games.get(gameID);
      game.removePlayer(client.id);
    }
  }
  /**
   * Gets a specific client
   * @param {String} ID The ID associated with the client
   * @returns {{}}
   */
  getClient(ID) {
    const client = this.clients.get(ID);
    if(!client) {
      return {};
    }
    return client;
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
