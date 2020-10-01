/**
 * @fileoverview This is a player class to handle player logic.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
// const Troop = require("./Game/Troop");
// const Building = require("./Game/Building");
// const Projectile = require("./Game/Projectile");
const Vector = require("./Physics/Vector");
const Constants = require("../common/constants");
const {
  degreeToRadian, bind, multiplySomething, checkProperties
} = require("../common/util");
const debug = require("../common/debug");

// TODO: Remove the UI management nonsense in this class.
/**
 * Player class.
 */
class Player {
  /**
   * Constructor for a player.
   * @class
   * @param {Vector} position The starting position of the player.
   * @param {string} name The name of the player.
   * @param {string} socketID The socketID associated with this player.
   * @param {string} team The team of the player.
   */
  constructor(position, name, socketID, team = "British") {
    this.position = position;
    this.name = name;
    this.socketID = socketID;
    this.team = team;

    this.troops = [];
    this.buildings = [];

    this.resources = {
      wood: 0,
      stone: 0,
      food: 0,
      coins: 0,
      ammo: 0
    };
    this.resourceRate = {
      wood: 0,
      stone: 0,
      food: 0,
      coins: 0,
      ammo: 0
    };
    this.population = {
      used: 0,
      max: 0
    };

    this.velocity = Vector.zero();
    this.speed = Constants.PLAYER_DEFAULT_SPEED;
    this.lastUpdateTime = 0;
    this.deltaTime = 0;
    this.pastBuildings = null;
    this.pastTroops = null;
  }
  /**
   * Binds this player's position within the world if it is outside of the
   * game world.
   */
  bindToWorld() {
    // We have to declare this method because the `Player` class does
    // not inherit from `Entity`.
    this.position.x = bind(
      this.position.x, Constants.WORLD_MIN, Constants.WORLD_MAX
    );
    this.position.y = bind(
      this.position.y, Constants.WORLD_MIN, Constants.WORLD_MAX
    );
  }
  /**
   * Calculates this player's resource rates.
   * @returns {{
   * wood: number,
   * stone: number,
   * food: number,
   * coins: number,
   * ammo: number
   * }}
   */
  calculateResourceRates() {
    const buildings = this.buildings;
    const troops = this.troops;

    const totalResourceRate = {};

    const resourceMin = {
      wood: 0,
      stone: 0,
      food: 0,
      coins: 0,
      ammo: 0
    };
    const resourceGen = {
      wood: 0,
      stone: 0,
      food: 0,
      coins: 0,
      ammo: 0
    };
    const resourceBonus = {
      woodIncrease: 0,
      stoneIncrease: 0,
      foodIncrease: 0,
      coinsIncrease: 0,
      ammoIncrease: 0
    };

    // Determine the resouce generation, resource consumption, and
    // resource bonus that each building and troop that the player
    // has gives.
    buildings.forEach(building => {
      const stats = Constants.BUILDING_STATS[building.type];

      for (const resource in stats.resource_gen) {
        resourceGen[resource] += stats.resource_gen[resource] || 0;
        resourceMin[resource] += stats.resource_min[resource] || 0;
      }

      for (const resource in stats.resource_bonus) {
        resourceBonus[resource] += stats.resource_bonus[resource] || 0;
      }
    });

    troops.forEach(troop => {
      const stats = Constants.TROOP_STATS[troop.type];

      for (const resource in stats.resource_min) {
        resourceMin[resource] += stats.resource_min[resource] || 0;
      }
    });

    // Calculate the total resource rate for the player.
    totalResourceRate.wood = multiplySomething([
      resourceGen.wood, resourceBonus.woodIncrease
    ]) - resourceMin.wood;
    totalResourceRate.stone = multiplySomething([
      resourceGen.stone, resourceBonus.stoneIncrease
    ]) - resourceMin.stone;
    totalResourceRate.food = multiplySomething([
      resourceGen.food, resourceBonus.foodIncrease
    ]) - resourceMin.food;
    totalResourceRate.coins = multiplySomething([
      resourceGen.coins, resourceBonus.coinsIncrease
    ]) - resourceMin.coins;
    totalResourceRate.ammo = multiplySomething([
      resourceGen.ammo, resourceBonus.ammoIncrease
    ]) - resourceMin.ammo;

    // debug("Resource Gen");
    // console.table(resourceGen);
    // debug("Resource Min");
    // console.table(resourceMin);
    // debug("Resource Bonus");
    // console.table(resourceBonus);

    return totalResourceRate;
  }
  /**
   * Updates this player's resources.
   */
  updateResources() {
    // TODO: See if `Object.keys()` would work here.
    const resourceRates = Object.getOwnPropertyNames(this.resourceRate);
    const resource = Object.getOwnPropertyNames(this.resources);

    for (let i = 0; i < resourceRates.length; i++) {
      const numMore = this.resourceRate[resourceRates[i]];

      this.resources[resource] += numMore;
      if (this.resources[resource] > this.maxResources[resource]) {
        const resourcesToMin =
          this.maxResources[resource] - this.resources[resource];

        this.resources[resource] -= resourcesToMin;
      }
    }
  }
  /**
   * Increases this player's resource rates.
   * @param {{
   * wood: number,
   * stone: number,
   * food: number,
   * coins: number,
   * ammo: number
   * }} amounts The amounts to increase this player's resource rates by.
   */
  updateResourceRate(amounts) {
    // TODO: See if `Object.keys()` would work here.
    const newResourceRates = Object.getOwnPropertyNames(amounts);
    const resourceRates = Object.getOwnPropertyNames(this.resourceRate);
    const newResourceRatesLength = newResourceRates.length;

    for (let i = 0; i < newResourceRatesLength; i++) {
      this.resourceRate[resourceRates[i]] = amounts[newResourceRates[i]];
    }
  }
  /**
   * Update this player given the client's input data from Input.js.
   * @param {{
   * up: boolean,
   * down: boolean,
   * right: boolean,
   * left: boolean,
   * mouse: {
   *  leftMousePressed: boolean,
   *  rightMousePressed: boolean,
   *  absMouseCoords: Vector,
   *  rltvMouseCoords: Vector
   * }}} data An Object storing the input state.
   */
  updateOnInput(data) {
    if (data.up) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(270));
    } else if (data.down) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(90));
    } else if (data.right) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(0));
    } else if (data.left) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(180));
    } else if (!(data.up ^ data.down) | !(data.right ^ data.left)) {
      this.velocity = Vector.zero();
    }

    // const event = {
    //   mouseX: data.mouse.rltvMouseCoords.x,
    //   mouseY: data.mouse.rltvMouseCoords.y,
    //   clicked: data.mouse.leftMousePressed
    // };
  }
  /**
   * Performs an update.
   * @param {number} lastUpdateTime The last time an update occured.
   * @param {number} deltaTime The current timestamp.
   */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    this.position.add(Vector.scale(this.velocity, deltaTime));
    this.bindToWorld();
    if (this.pastTroops !== this.troops ||
      this.pastBuildings !== this.buildings
    ) {
      const newResourceRates = this.calculateResourceRates();
      this.updateResourceRate(newResourceRates);
    }

    const allIsTrue = checkProperties(this.resourceRate);
    if (allIsTrue) {
      this.updateResources();
    }

    this.pastBuildings = this.buildings;
    this.pastTroops = this.troops;
  }
  /**
   * Initializes the player.
   * @returns {Player}
   */
  init() {
    debug("Initializing player...");
    this.troops = [];
    this.buildings = [];
    this.lastUpdateTime = Date.now();
    this.velocity = Vector.zero();

    this.update(this.lastUpdateTime, this.lastUpdateTime);
    debug("Done");
    return this;
  }
}
/**
 * Module exports.
 */
module.exports = exports = Player;
