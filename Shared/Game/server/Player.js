/**
 * @fileoverview This is a player class to handle the players
 * @author Horton Cheng <horton0712@gmail.com>
 * @version
 */

//Imports
const Troop = require("./Game/Troop");
const Building = require("./Game/Building");
const Projectile = require("./Game/Projectile");
const Vector = require("./Physics/Vector");
const Constants = require("../../Constants");
const { degreeToRadian, bind } = require("../../Util");

/**
 * Player class
 */
class Player {
  /**
    * Constructor for a player
    * @param {Vector} position The starting position of the player
    * @param {String} name The name of the player
    * @param {String} socketID The socketID associated with this player
    */
  constructor(position, name, socketID) {
    this.position = position;
    this.name = name;
    this.socketID = socketID;

    this.troops = [];
    this.buildings = [];
    this.resources = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    }
    this.resourceRate = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    }

    this.velocity = Vector.zero();
    this.speed = Constants.PLAYER_DEFAULT_SPEED;
    this.lastUpdateTime = 0;
    this.deltaTime = 0;
  }
  /**
    * Binds this player's position within the world if it is outside of the 
    * game world
    */
  bindToWorld() {
    this.position.x = bind(
      this.position.x, Constants.WORLD_MIN, Constants.WORLD_MAX
    );
    this.position.y = bind(
      this.position.y, Constants.WORLD_MIN, Constants.WORLD_MAX
    );
  }
  /**
    * Calculates this player's resource rates
    */
  calculateResourceRates() {
    const buildings = this.buildings;
    // eslint-disable-next-line prefer-const
    let resourceGenBuildings = {
      numMainTents: 0,
      numWoodcutters: 0,
      numStoneQuarries: 0,
      numFarms: 0,
      numHouses: 0,
      numMunitionPlants: 0
    }
    // eslint-disable-next-line prefer-const
    let resourceBonusBuildings = {
      numMills: 0,
      numSawmills: 0,
      numStonemasons: 0,
      numWells: 0
    }
    
    for(let i = 0; i < buildings.length; i++) {
      switch(buildings[i].type) {
      case "main_tent":
        resourceGenBuildings.numMainTents += 1;
        break;
      case "house": 
        resourceGenBuildings.numHouses += 1;
        break;
      case "farm": 
        resourceGenBuildings.numFarms += 1;
        break;
      case "woodcutter": 
        resourceGenBuildings.numWoodcutters += 1;
        break;
      case "stone_quarry":
        resourceGenBuildings.numStoneQuarries += 1;
        break;
      case "munitions_plant":
        resourceGenBuildings.numMunitionPlants += 1;
        break;
      case "mill":
        resourceBonusBuildings.numMills += 1;
        break;
      case "sawmill":
        resourceBonusBuildings.numSawmills += 1;
        break;
      case "stonemason":
        resourceBonusBuildings.numMills += 1;
        break;
      case "well":
        resourceBonusBuildings.numWells += 1;
        break;
      }
    }
    //
  }
  /**
    * Updates this player's resources
    */
  updateResources() {
    const resourceRates = Object.getOwnPropertyNames(this.resourceRate);
    const resource = Object.getOwnPropertyNames(this.resources);

    for(let i = 0; i < resourceRates.length; i++) {
      const numMore = this.resourceRate[resourceRates[i]];

      this.resources[resource] += numMore;
    }
  }
  /**
    * Increases this player's resource rates
    * @param {{
    * wood: Number,
    * stone: Number,
    * food: Number,
    * gold: Number,
    * ammo: Number
      }} amounts The amounts to increase this player's resource rates by
    */
  updateResourceRate(amounts) {
    const newResourceRates = Object.getOwnPropertyNames(amounts);
    const resourceRates = Object.getOwnPropertyNames(this.resourceRate);

    for(let i = 0; i < newResourceRates.length; i++) {
      const newResourceRate = amounts[newResourceRates[i]];
      const oldResourceRate = this.resourceRate[resourceRates[i]];

      this.resourceRate[oldResourceRate] = newResourceRate;
    }
  }
  /**
    * Update this player given the client's input data from Input.js
    * @param {{
    * up: Number,
    * down: Number,
    * right: Number,
    * left: Number
    * }} data A JSON Object storing the input state
   */
  updateOnInput(data) {
    if(data.up) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(0));
    } else if(data.down) {
      this.velocity = Vector.fromPolar(-this.speed, degreeToRadian(180));
    } else if(data.right) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(90));
    } else if(data.left) {
      this.velocity = Vector.fromPolar(-this.speed, degreeToRadian(270));
    } else if(!(data.up ^ data.down) | !(data.right ^ data.left)) {
      this.velocity = Vector.zero();
    }
  }
  /**
    * Performs a physics update
    * @param {Number} lastUpdateTime The last time an update occured
    * @param {Number} deltaTime The current timestamp
    */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    this.position.add(Vector.scale(this.velocity, deltaTime));

    this.bindToWorld();
  }
}
/**
 * Module exports
 */
module.exports = exports = Player;
