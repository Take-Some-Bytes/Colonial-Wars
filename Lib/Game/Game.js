/**
 * @fileoverview Game class to manage the game functions
 * @author Horton Cheng <horton0712@gmail.com>
 */

const { deepClear } = require("../Util");
const Player = require("./Player");
const Vector = require("../../Shared/Vector");
const Constants = require("../Constants");

/**
 * Game class
 */
class Game {
  /**
    * Constructor for the game class
    * @param {String} mode The game mode
    * @param {String} id The game ID
    * @param {{
    * British: Vector,
    * French: Vector,
    * Russian: Vector,
    * German: Vector,
    * American: Vector,
    * Italian: Vector
    * }} startPositions The start positions of the players
    * that join a team
    */
  constructor(mode, id, startPositions) {
    /**
       * This is a Map containing all of the connected players
       * and socket ids associated with them
       */
    this.players = new Map();
    /**
       * This is a Map containing all of the connected clients
       */
    this.clients = new Map();

    this.projectiles = [];
    this.troops = [];
    this.buildings = [];
    this.obstacles = [];
    this.mode = mode;
    this.id = id;
    this.startPositions = startPositions;

    if(mode === "team_battles") {
      this.teams = new Map();
      this.teams.set("British", new Map());
      this.teams.set("French", new Map());
      this.teams.set("Russian", new Map());
      this.teams.set("German", new Map());
      this.teams.set("American", new Map());
      this.teams.set("Italian", new Map());
      this.teams.set("Neutral", []);
    }

    this.lastUpdateTime = 0;
    this.deltaTime = 0;
    this.numPlayers = 0;
    this.maxPlayers = Constants.MAX_PLAYERS;
    this.closed = false;
  }
  /**
    * Gets the status of the game. Returns a string based on whether the
    * game has reached the max amount of players.
    * @returns {String}
    */
  get status() {
    const isClosed = this.closed ? "Game is closed" : "Game is open";
    return isClosed;
  }
  /**
    * Initializes the game state
    */
  init() {
    this.lastUpdateTime = Date.now();
    this.numPlayers = 0;
    this.closed = false;

    deepClear(this.teams);
    deepClear(this.projectiles, Array.isArray(this.projectiles));
    deepClear(this.troops, Array.isArray(this.projectiles));
    deepClear(this.obstacles, Array.isArray(this.projectiles));
    deepClear(this.buildings, Array.isArray(this.projectiles));
    deepClear(this.players);
    deepClear(this.clients);
  }
  /**
    * Adds a new player
    * @param {Object} socket The socket object associated with the player
    * @param {String} name The name of the player
    * @param {String} team The team of the player
    */
  addNewPlayer(socket, name, team) {
    if(this.closed) {
      throw new Error("Max number of players reached; game is closed.")
    }
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, new Player(
      this.startPositions[team],
      name,
      socket.id
    ));
    this.numPlayers++;
    if(this.numPlayers === this.maxPlayers) {
      this.closed = true;
    }
  }
  /**
    * Removes the player with the given socket ID and returns the name of the
    * player removed
    * @param {String} socketID The socket ID associated with the player you
    * want to remove
    * @returns {String}
    */
  removePlayer(socketID) {
    if(this.clients.has(socketID)) {
      this.clients.delete(socketID);
    }
    if(this.players.has(socketID)) {
      const player = this.players.get(socketID);
      this.players.delete(socketID);
      this.numPlayers--;
      if(this.numPlayers < this.maxPlayers) {
        this.closed = false;
      }
      return player.name;
    }
  }
  /**
    * Gets a player's name by their socketID
    * @param {String} socketID The socketID associated with the player
    * @returns {String}
    */
  getPlayerNameBySocketID(socketID) {
    if(this.players.has(socketID)) {
      const playerName = this.players.get(socketID).name;
      return playerName;
    }
  }
  /**
   * Updates the specified player on input
   * @param {String} socketID The socket ID associated with this player
   * @param {{
    * up: Number,
    * down: Number,
    * right: Number,
    * left: Number
    * }} data A JSON object containing the update data
   */
  updatePlayerOnInput(socketID, data) {
    const player = this.players.get(socketID);
    if(player) {
      player.updateOnInput(data);
    }
  }
  /**
    * Factory method for a game
    * @param {String} mode The game mode
    * @param {String} id The game ID
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
  static create(mode, id, startPositions) {
    const game = new Game(mode, id, startPositions);
    game.init();
    return game;
  }
}

/**
 * Module exports
 */
module.exports = exports = Game;
