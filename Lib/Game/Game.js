/**
 * @fileoverview Game class to manage the game functions
 * @author Horton Cheng <horton0712@gmail.com>
 */

const {
  deepClear, getEuclideanDist2, inCircle, getNonCallableProps
} = require("../Util");
const Player = require("./Player");
const Vector = require("./Physics/Vector");
const Projectile = require("./Game/Projectile");
const Building = require("./Game/Building");
const Troop = require("./Game/Troop");
const Constants = require("../Constants");

const socketIO = require("socket.io");
/**
 * Game class
 */
class Game {
  /**
    * Constructor for the game class
    * @param {String} mode The game mode
    * @param {String} id The game ID
    * @param {String} token The token of the game
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
    */
  constructor(mode, id, token, mapName, startPositions) {
    /**
       * This is a Map containing all of the connected players
       * and socket ids associated with them
       */
    this.players = new Map();
    /**
       * This is a Map containing all of the connected clients
       */
    this.clients = new Map();

    this.troops = [];
    this.buildings = [];
    this.projectiles = [];
    //this.obstacles = [];
    this.mode = mode;
    this.id = id;
    this.token = token;
    this.startPositions = startPositions;
    this.mapName = mapName;

    if (mode !== "FFA") {
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
    /**
     * For dev purposes only
     */
    this.numEmits = 0;
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
    deepClear(this.troops, Array.isArray(this.troops));
    // deepClear(this.obstacles, Array.isArray(this.obstacles));
    deepClear(this.buildings, Array.isArray(this.buildings));
    deepClear(this.players);
    deepClear(this.clients);

    this.addMainBases();
  }
  /**
   * Adds the game's main bases, if any are needed
   */
  addMainBases() {
    if (this.mode !== "FFA") {
      const objKeys = Object.getOwnPropertyNames(this.startPositions);
      const objKeysLength = objKeys.length;

      for (let i = 0; i < objKeysLength; i++) {
        const startPosition = this.startPositions[objKeys[i]];
        const mainBaseToCreate = Building.create(
          startPosition,
          "main_base",
          objKeys[i]
        );

        this.buildings.push(mainBaseToCreate);
      }
    }
  }
  /**
    * Adds a new player
    * @param {socketIO.Socket} socket The socket object associated
    * with the player
    * @param {String} name The name of the player
    * @param {String} team The team of the player
    */
  addNewPlayer(socket, name, team) {
    if (this.closed) {
      throw new Error("Max number of players reached; game is closed.")
    }
    const startPosition = this.startPositions[team].copy();
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, new Player(
      startPosition,
      name,
      socket.id,
      team
    ));
    this.numPlayers++;
    if (this.numPlayers === this.maxPlayers) {
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
    if (this.clients.has(socketID)) {
      this.clients.delete(socketID);
    }
    if (this.players.has(socketID)) {
      const player = this.players.get(socketID);
      this.players.delete(socketID);
      this.numPlayers--;
      if (this.numPlayers < this.maxPlayers) {
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
    if (this.players.has(socketID)) {
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
    if (player) {
      player.updateOnInput(data);
    }
  }
  /**
   * Performs a physics update
   */
  update() {
    const currentTime = Date.now();
    this.deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    const players = [
      ...this.players.values()
    ];

    const entities = [
      ...this.projectiles,
      ...this.troops,
      ...this.buildings
    ];
    if (players) {
      players.forEach(player => {
        player.update(this.lastUpdateTime, this.deltaTime);
      });
    }
    if (entities) {
      entities.forEach(entity => {
        entity.update(this.lastUpdateTime, this.deltaTime);
      });
      const entitiesLength = entities.length;
      if (entitiesLength < 2) {
        return;
      }
      for (let i = 0; i < entitiesLength; i++) {
        for (let j = i + 1; j < entitiesLength; j++) {
          let e1 = entities[i];
          let e2 = entities[j];

          if (!e1.collided(e2)) {
            continue;
          }

          //Projectile--Building + Troop interaction
          if (e1 instanceof Projectile && e2 instanceof Building ||
          e1 instanceof Projectile && e2 instanceof Troop
          ) {
            e1 = entities[j];
            e2 = entities[i];
          }
          if (
            e1 instanceof Building && e2 instanceof Projectile &&
          e2.source !== e1 ||
          e1 instanceof Troop && e2 instanceof Projectile &&
          e2.source !== e1
          ) {
            if (e2.explodes) {
              const AOE = e2.splashDamageRadius;

              entities.forEach(entity => {
                if (inCircle(e2.position, AOE, entity.position)) {
                  const totalDamage = e2.splashDamage;

                  entity.damage(totalDamage);
                  if (entity.isDead()) {
                    entity.destroyed = true;
                    e2.source.kills++;
                  }
                }
              });
            }
            if (e1.isDead()) {
              e1.destroyed = true;
              e2.source.kills++;
              continue;
            }
            e1.damage(e2.damage);
            if (e1.isDead()) {
              e1.destroyed = true;
              e2.source.kills++;
              continue;
            }
            e2.destroyed = true;
            continue;
          }

          //Troop-Building interaction
          if (e1 instanceof Building && e2 instanceof Troop) {
            e1 = entities[j];
            e2 = entities[i];
          }
          if (e1 instanceof Troop && e2 instanceof Building) {
          //Physics stuff
            const vCollision = Vector.sub(e1.position, e2.position);
            const distance = getEuclideanDist2(e1.position, e2.position);
            const vCollisionNorm = new Vector(
              vCollision.x / distance,
              vCollision.y / distance
            );
            const vRelativeVelocity = Vector.sub(e2.velocity, e1.velocity);
            const speed = vRelativeVelocity.x * vCollisionNorm.x +
            vRelativeVelocity.y * vCollisionNorm.y;
            const impulse = 2 * speed / (e2.mass + e1.mass);

            if (speed < 0) {
              continue;
            }

            e1.velocity.x += impulse * e2.mass * vCollisionNorm.x;
            e1.velocity.y += impulse * e2.mass * vCollisionNorm.y;
          }

          //Troop-Troop interaction
          if (e1 instanceof Troop && e2 instanceof Troop) {
          //Physics stuff
            const vCollision = Vector.sub(e1.position, e2.position);
            const distance = getEuclideanDist2(e1.position, e2.position);
            const vCollisionNorm = new Vector(
              vCollision.x / distance,
              vCollision.y / distance
            );
            const vRelativeVelocity = Vector.sub(e2.velocity, e1.velocity);
            const speed = vRelativeVelocity.x * vCollisionNorm.x +
            vRelativeVelocity.y * vCollisionNorm.y;
            const impulse = 2 * speed / (e2.mass + e1.mass);

            if (speed < 0) {
              continue;
            }

            e1.velocity.x -= impulse * e2.mass * vCollisionNorm.x;
            e1.velocity.y -= impulse * e2.mass * vCollisionNorm.y;
            e2.velocity.x += impulse * e1.mass * vCollisionNorm.x;
            e2.velocity.y += impulse * e1.mass * vCollisionNorm.y;
          }

          //Projectile-Projectile interaction
          if (e1 instanceof Projectile && e2 instanceof Projectile) {
            if (e1.explodes && e2.explodes) {
              const AOE1 = e1.splashDamageRadius;
              const AOE2 = e2.splashDamageRadius;

              entities.forEach(entity => {
                if (inCircle(e1.position, AOE1, entity.position) &&
                inCircle(e1.position, AOE2, entity.position)
                ) {
                  const totalDamage = e1.splashDamage + e2.splashDamage;

                  entity.damage(totalDamage);
                  if (entity.isDead()) {
                    entity.destroyed = true;
                    e1.source.kills++;
                    e2.source.kills++;
                  }
                }
              });
            } else if (e1.explodes) {
              const AOE = e1.splashDamageRadius;

              entities.forEach(entity => {
                if (inCircle(e1.position, AOE, entity.position)) {
                  const totalDamage = e1.splashDamage;

                  entity.damage(totalDamage);
                  if (entity.isDead()) {
                    entity.destroyed = true;
                    e1.source.kills++;
                  }
                }
              });
            } else if (e2.explodes) {
              const AOE = e2.splashDamageRadius;

              entities.forEach(entity => {
                if (inCircle(e2.position, AOE, entity.position)) {
                  const totalDamage = e2.splashDamage;

                  entity.damage(totalDamage);
                  if (entity.isDead()) {
                    entity.destroyed = true;
                    e2.source.kills++;
                  }
                }
              });
            }

            e1.destroyed = true;
            e2.destroyed = true;
          }
        }
      }
    }

    //Filter out destroyed stuff
    this.projectiles = this.projectiles.filter(projectile => {
      return !projectile.destroyed;
    });
    this.troops.filter(troop => {
      return !troop.destroyed;
    });
    this.buildings.filter(building => {
      return !building.destroyed;
    });
  }
  /**
   * Sends the game state to all connected clients in this game
   */
  sendState() {
    const players = [...this.players.values()];

    this.clients.forEach((client, socketID) => {
      const currentPlayer = this.players.get(socketID);

      const dataToEmit = JSON.stringify({
        securityData: {
          gameToken: this.token
        },
        playerData: {
          self: getNonCallableProps(currentPlayer),
          // players: players,
          // projectiles: this.projectiles,
          buildings: this.buildings.map(building => {
            const newProps = getNonCallableProps(building);
            return newProps;
          }),
          // troops: this.troops
          buttons: currentPlayer.buttons.map(button => {
            const newProps = getNonCallableProps(button);
            return newProps;
          }),
          resourceAmounts: currentPlayer.resources
        },
        otherData: {}
      });

      this.numEmits++;
      if (this.numEmits > 40 * 2 * 20) {
        console.log("Packet size: ",
          Buffer.from(dataToEmit, "utf-8").byteLength
        );
        this.numEmits = 0;
      }

      this.clients.get(socketID).emit(Constants.SOCKET_UPDATE, dataToEmit);
    });
  }
  /**
    * Factory method for a game
    * @param {String} mode The game mode
    * @param {String} id The game ID
    * @param {String} token The token of the game
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
  static create(mode, id, token, mapName, startPositions) {
    const game = new Game(mode, id, token, mapName, startPositions);
    game.init();
    return game;
  }
}

/**
 * Module exports
 */
module.exports = exports = Game;
