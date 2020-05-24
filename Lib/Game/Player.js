/**
 * @fileoverview This is a player class to handle the players
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Imports
const Troop = require("./Game/Troop");
const Building = require("./Game/Building");
const Projectile = require("./Game/Projectile");
const Vector = require("./Physics/Vector");
const Constants = require("../Constants");
const {
  degreeToRadian, bind, multiplySomething, checkProperties, delay
} = require("../Util");

/**
 * Player class
 */
class Player {
  /**
    * Constructor for a player
    * @param {Vector} position The starting position of the player
    * @param {String} name The name of the player
    * @param {String} socketID The socketID associated with this player
    * @param {String} team The team of the player
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
    this.pastBuildings = null;
    this.pastTroops = null;
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
    * @returns {{
      * wood: number,
      * stone: number,
      * food: number,
      * gold: number,
      * ammo: number
      * }}
      */
  calculateResourceRates() {
    const buildings = this.buildings;
    const troops = this.troops;
    const resourceGenBuildings = {
      numMainTents: 0,
      numWoodcutters: 0,
      numStoneQuarries: 0,
      numFarms: 0,
      numHouses: 0,
      numMunitionPlants: 0
    };
    const resourceBonusBuildings = {
      numMills: 0,
      numSawmills: 0,
      numStonemasons: 0,
      numWells: 0
    };
    const baseResourceRate = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    };
    const baseResourceMinRate = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    };
    const resourceMinBuildings = {
      numCannonTowers: 0,
      numHouses: 0,
      numMunitionPlants: 0,
      numMills: 0,
      numSawmills: 0,
      numStonemasons: 0
    };
    const resourceMinTroops = {
      numMilitia: 0,
      numLightInfantry: 0,
      numLineInfantry: 0,
      numCaptains: 0,
      numPikemen: 0,
      numMedics: 0,
      numFieldArtillery: 0,
      numSiegeArtillery:0,
      numHowitzers: 0,
      numMortars: 0
    };
    const totalResourceRate = {};
    const buildingsLength = buildings.length;
    const troopsLength = troops.length;

    for(let i = 0; i < buildingsLength; i++) {
      switch(buildings[i].type) {
      case "main_tent":
        resourceGenBuildings.numMainTents++;
        break;
      case "house":
        resourceGenBuildings.numHouses++;
        resourceMinBuildings.numHouses++;
        break;
      case "farm":
        resourceGenBuildings.numFarms++;
        break;
      case "woodcutter":
        resourceGenBuildings.numWoodcutters++;
        break;
      case "stone_quarry":
        resourceGenBuildings.numStoneQuarries++;
        break;
      case "munitions_plant":
        resourceGenBuildings.numMunitionPlants++;
        resourceMinBuildings.numMunitionPlants++;
        break;
      case "mill":
        resourceBonusBuildings.numMills++;
        resourceMinBuildings.numMills++;
        break;
      case "sawmill":
        resourceBonusBuildings.numSawmills++;
        resourceMinBuildings.numSawmills++;
        break;
      case "stonemason":
        resourceBonusBuildings.numStonemasons++;
        resourceMinBuildings.numStonemasons++;
        break;
      case "well":
        resourceBonusBuildings.numWells++;
        break;
      case "cannon_tower":
        resourceMinBuildings.numCannonTowers++;
        break;
      default:
        continue;
      }
    }
    for(let i = 0; i < troopsLength; i++) {
      switch(troops[i].type) {
      case "militia":
        resourceMinTroops.numMilitia++;
        break;
      case "light_infantry":
        resourceMinTroops.numLightInfantry++;
        break;
      case "line_infantry":
        resourceMinTroops.numLineInfantry++;
        break;
      case "captain":
        resourceMinTroops.numCaptains++;
        break;
      case "pikemen":
        resourceMinTroops.numPikemen++;
        break;
      case "medic":
        resourceMinTroops.numMedics++;
        break;
      case "field_artillery":
        resourceMinTroops.numFieldArtillery++;
        break;
      case "siege_artillery":
        resourceMinTroops.numSiegeArtillery++;
        break;
      case "howitzer":
        resourceMinTroops.numHowitzers++;
        break;
      case "mortar":
        resourceMinTroops.numMortars++;
        break;
      default:
        throw new TypeError(
          "Troop type does not match any of the default troop types!"
        );
      }
    }

    const totalResGenBuildings =
      Object.getOwnPropertyNames(resourceGenBuildings);
    totalResGenBuildings.shift();
    const resources = Object.getOwnPropertyNames(baseResourceRate);
    const resourceBuildings =
      Object.getOwnPropertyNames(Constants.BUILDING_RESOURCE_GEN);
    resourceBuildings.shift();
    const minBuildings = Object.getOwnPropertyNames(
      Constants.BUILDING_RESOURCE_MIN
    );
    const totalResMinBuildings = Object.getOwnPropertyNames(
      resourceMinBuildings
    );
    const minTroops = Object.getOwnPropertyNames(
      Constants.TROOP_RESOURCE_CONSUMPTION
    );
    const totalMinTroops = Object.getOwnPropertyNames(resourceMinTroops);
    for(let i = 0; i < resources.length; i++) {
      baseResourceRate[resources[i]] =
        resourceGenBuildings.numMainTents *
        Constants.BUILDING_RESOURCE_GEN.main_tent[resources[i]];
      for(let j = 0; j < resourceBuildings.length; j++) {
        baseResourceRate[resources[i]] +=
          resourceGenBuildings[totalResGenBuildings[i]] *
          Constants.BUILDING_RESOURCE_GEN[resourceBuildings[j]][resources[i]];
      }
      for(let otherJ = 0; otherJ < minBuildings.length; otherJ++) {
        baseResourceMinRate[resources[i]] +=
          resourceMinBuildings[totalResMinBuildings[otherJ]] *
          Constants.BUILDING_RESOURCE_MIN[minBuildings[otherJ]][resources[i]];
      }
      for(let a = 0; a < minTroops.length; a++) {
        baseResourceMinRate[resources[i]] +=
          resourceMinTroops[totalMinTroops[a]] *
          Constants.TROOP_RESOURCE_CONSUMPTION[minTroops[a]][resources[i]];
      }
    }
    totalResourceRate.wood = Math.round(multiplySomething([
      baseResourceRate.wood,
      resourceBonusBuildings.numSawmills *
      Constants.BUILDING_RESOURCE_BONUS.sawmill.woodIncrease
    ])) - baseResourceMinRate.wood;
    totalResourceRate.stone = Math.round(multiplySomething([
      baseResourceRate.stone,
      resourceBonusBuildings.numStonemasons *
      Constants.BUILDING_RESOURCE_BONUS.stonemason.stoneIncrease
    ])) - baseResourceMinRate.stone;
    totalResourceRate.food = Math.round(multiplySomething([
      baseResourceRate.food,
      resourceBonusBuildings.numMills *
      Constants.BUILDING_RESOURCE_BONUS.mill.foodIncrease
    ])) - baseResourceMinRate.food;
    totalResourceRate.gold = Math.round(multiplySomething([
      baseResourceRate.gold,
      resourceBonusBuildings.numWells *
      Constants.BUILDING_RESOURCE_BONUS.well.goldIncrease
    ])) - baseResourceMinRate.gold;
    totalResourceRate.ammo = baseResourceRate.ammo - baseResourceMinRate.ammo;

    return totalResourceRate;
  }
  /**
   * Adds another building to this player's list of buildings
   * @param {String} type The type of the building
   * @param {Vector} position The position of the building
   */
  buildBuilding(type, position) {
    const resourcesMissing = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    };
    const resources = [
      "wood",
      "stone",
      "food",
      "gold",
      "ammo"
    ];

    for(let i = 0; i < resources.length; i++) {
      if(this.resources[resources[i]] <
        Constants.BUILDING_COST[type][resources[i]]) {
        resourcesMissing[resources[i]] =
          Constants.BUILDING_COST[type][resources[i]] -
          this.resources[resources[i]];
        continue;
      }
      continue;
    }

    const allIsFalse = checkProperties(resourcesMissing);
    if(!allIsFalse) {
      let errorMessage =
        "Some resources are missing; cannot build building.\n" +
        "Resources missing:\n";
      for(let i = 0; i < resources.length; i++) {
        errorMessage += `\t ${resourcesMissing[resources[i]]}\n`;
      }
      throw new Error(errorMessage);
    }

    delay(Constants.BUILDING_BUILD_TIME[type], () => {
      this.buildings.push(new Building(position, type, this.team));
    });
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
    * up: Boolean,
    * down: Boolean,
    * right: Boolean,
    * left: Boolean
    * }} data A JSON Object storing the input state
   */
  updateOnInput(data) {
    if(data.up) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(270));
    } else if(data.down) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(90));
    } else if(data.right) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(0));
    } else if(data.left) {
      this.velocity = Vector.fromPolar(this.speed, degreeToRadian(180));
    } else if(!(data.up ^ data.down) | !(data.right ^ data.left)) {
      this.velocity = Vector.zero();
    }
  }
  /**
    * Performs an update
    * @param {Number} lastUpdateTime The last time an update occured
    * @param {Number} deltaTime The current timestamp
    */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    this.position.add(Vector.scale(this.velocity, deltaTime));
    if(this.pastTroops !== this.troops ||
      this.pastBuildings !== this.buildings
    ) {
      const newResourceRates = this.calculateResourceRates();
      this.updateResourceRate(newResourceRates);
    }

    const allIsTrue = checkProperties(this.resourceRate);
    if(allIsTrue) {
      this.updateResources();
    }
    this.bindToWorld();

    this.pastBuildings = this.buildings;
    this.pastTroops = this.troops;
  }
  /**
   * Initializes the player
   */
  init() {
    this.troops = [];
    this.buildings = [];
    this.lastUpdateTime = Date.now();
    this.velocity = Vector.zero();

    this.update(this.lastUpdateTime, this.lastUpdateTime);
  }
}
/**
 * Module exports
 */
module.exports = exports = Player;
