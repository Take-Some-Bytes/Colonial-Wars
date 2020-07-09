/**
 * @fileoverview This is a player class to handle the players
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Imports
// const Troop = require("./Game/Troop");
// const Building = require("./Game/Building");
// const Projectile = require("./Game/Projectile");
const Button = require("./UI/Button");
const Icon = require("./UI/Icon");
const Vector = require("./Physics/Vector");
const Constants = require("../common/constants");
const {
  degreeToRadian, bind, multiplySomething, checkProperties
} = require("../common/util");

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
    this.buttons = [];
    this.icons = [];
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
   * Adds the UI elements this player is going to interact with
   */
  addUIElements() {
    //Declaration stuff
    const buttonsLength = Constants.BUTTON_KEYS.length;
    const buttonKeys = Constants.BUTTON_KEYS;
    const buttonY = 570;
    let buttonX = 1100;
    const iconLength = Constants.ICON_KEYS.length - 1;
    const iconKeys = Constants.ICON_KEYS;
    const iconsY = 15;
    const textOffset = new Vector(50, 30);
    const textOffsetHeight = new Vector(-28, 20);
    let iconsX = 685;

    //Add buttons
    for (let i = 0; i < buttonsLength; i++) {
      const btn = new Button({
        width: 60,
        height: 60,
        image: buttonKeys[i],
        position: new Vector(buttonX, buttonY),
        onClick: () => {
          btn.clicked = true;
          btn.lastClickTime = Date.now();
        },
        onHover: () => {
          btn.hovered = true;
        },
        onNotHover: () => {
          btn.hovered = false;
        },
        onNotClick: () => {
          btn.clicked = false;
          btn.lastClickTime = Date.now();
        }
      });
      this.buttons.push(btn);
      buttonX += 80;
    }
    //Add icons
    for (let i = 0; i < iconLength; i++) {
      const infoText = Constants.ICON_INFO_TEXT[iconKeys[i]];
      const value = this.resources[iconKeys[i]];

      const icon = new Icon({
        image: iconKeys[i],
        position: new Vector(iconsX, iconsY),
        infoText: infoText,
        value:
          `${value}`,
        valueIncrease: this.resourceRate[iconKeys[i]],
        name: iconKeys[i],
        textOffset: textOffset,
        textOffset2: textOffsetHeight,
        clickable: false,
        onHover: function() {
          icon.hovered = true;
          icon.displayInfoText = true;
        },
        onNotHover: function() {
          icon.hovered = false;
          icon.displayInfoText = false;
        }
      });

      this.icons.push(icon);
      iconsX += 110;
    }

    const icon = new Icon({
      image: "people",
      position: new Vector(iconsX, iconsY),
      infoText: Constants.ICON_INFO_TEXT.people,
      value:
        `${this.population.used} / ${this.population.max}`,
      name: "people",
      textOffset: textOffset,
      textOffset2: textOffsetHeight,
      clickable: false,
      onHover: function() {
        icon.hovered = true;
        icon.displayInfoText = true;
      },
      onNotHover: function() {
        icon.hovered = false;
        icon.displayInfoText = false;
      }
    });

    this.icons.push(icon);
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

    const totalResourceRate = {};

    const resourceMin = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    };
    const resourceGen = {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    };
    const resourceBonus = {
      woodIncrease: 0,
      stoneIncrease: 0,
      foodIncrease: 0,
      goldIncrease: 0,
      ammoIncrease: 0
    };

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

    totalResourceRate.wood = multiplySomething([
      resourceGen.wood, resourceBonus.woodIncrease
    ]) - resourceMin.wood;
    totalResourceRate.stone = multiplySomething([
      resourceGen.stone, resourceBonus.stoneIncrease
    ]) - resourceMin.stone;
    totalResourceRate.food = multiplySomething([
      resourceGen.food, resourceBonus.foodIncrease
    ]) - resourceMin.food;
    totalResourceRate.gold = multiplySomething([
      resourceGen.gold, resourceBonus.goldIncrease
    ]) - resourceMin.gold;
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
    * Updates this player's resources
    */
  updateResources() {
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
    * Increases this player's resource rates
    * @param {{
    * wood: Number,
    * stone: Number,
    * food: Number,
    * gold: Number,
    * ammo: Number
    * }} amounts The amounts to increase this player's resource rates by
    */
  updateResourceRate(amounts) {
    const newResourceRates = Object.getOwnPropertyNames(amounts);
    const resourceRates = Object.getOwnPropertyNames(this.resourceRate);
    const newResourceRatesLength = newResourceRates.length;

    for (let i = 0; i < newResourceRatesLength; i++) {
      this.resourceRate[resourceRates[i]] = amounts[newResourceRates[i]];
    }
  }
  /**
    * Update this player given the client's input data from Input.js
    * @param {{
    * up: Boolean,
    * down: Boolean,
    * right: Boolean,
    * left: Boolean,
    * mouse: {
    *  leftMousePressed: Boolean,
    *  rightMousePressed: Boolean,
    *  absMouseCoords: Vector,
    *  rltvMouseCoords: Vector
    }}} data A JSON Object storing the input state
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

    this.buttons.forEach(btn => {
      const event = {
        mouseX: data.mouse.rltvMouseCoords.x,
        mouseY: data.mouse.rltvMouseCoords.y,
        clicked: data.mouse.leftMousePressed
      };
      btn.handleMouseEvent(event);
    });
  }
  /**
    * Performs an update
    * @param {Number} lastUpdateTime The last time an update occured
    * @param {Number} deltaTime The current timestamp
    */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    this.position.add(Vector.scale(this.velocity, deltaTime));
    if (this.pastTroops !== this.troops ||
      this.pastBuildings !== this.buildings
    ) {
      const newResourceRates = this.calculateResourceRates();
      this.updateResourceRate(newResourceRates);

      for (let i = 0; i < this.icons.length - 1; i++) {
        this.icons[i].valueIncrease = this.resourceRate[this.icons[i].name];
      }
    }

    const allIsTrue = checkProperties(this.resourceRate);
    if (allIsTrue) {
      this.updateResources();
      for (let i = 0; i < this.icons.length - 1; i++) {
        this.icons[i].updateValue();
      }
    }
    this.bindToWorld();

    this.pastBuildings = this.buildings;
    this.pastTroops = this.troops;
  }
  /**
   * Initializes the player
   * @returns {Player}
   */
  init() {
    this.troops = [];
    this.buildings = [];
    this.buttons = [];
    this.icons = [];
    this.lastUpdateTime = Date.now();
    this.velocity = Vector.zero();

    this.addUIElements();
    this.update(this.lastUpdateTime, this.lastUpdateTime);
    return this;
  }
}
/**
 * Module exports
 */
module.exports = exports = Player;
