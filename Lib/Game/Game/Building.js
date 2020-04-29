/**
 * @fileoverview A Buildings class to manage buildings
 * physics
 * @author Horton Cheng <horton0712@gmail.com>
 */

//Imports
const Projectile = require("./Projectile");
const Entity = require("../Physics/Entity");
const Vector = require("../Physics/Vector");
const Constants = require("../../Constants");
const Util = require("../../Util");

/**
 * Building class
 */
class Building extends Entity {
  /**
    * Constructor for a Building object
    * @param {Vector} position The current position of the Building
    * @param {Number} mass The mass of the building
    * @param {String} [type="tent"] The type of the Building
    * @param {String} [team="Neutral"] The team of the building
    */
  constructor(position, mass, type = "tent", team = "Neutral") {
    super(
      position, Vector.zero(), Vector.zero(), mass,
      Constants.BUILDING_HITBOX_SIZE[type]
    );

    this.type = type;
    this.team = team;
    this.health = Constants.BUILDING_MAX_HEALTH[type];
    this.buildTime = Constants.BUILDING_BUILD_TIME[type];
    if(this.type === "barracks" ||
    this.type === "recruiting_office" || this.type === "factory"
    ) {
      this.spawnedTroops = Constants.BUILDINGS_SPAWNED_TROOP[type];
    } else {
      this.spawnedTroops = [];
    }
    if(this.type === "cannon_tower") {
      this.range = Constants.BUILDING_RANGE[type];
      this.shotCoolDown = Constants.ATTACK_COOLDOWN[type];
      this.firedProjectile = Constants.PROJECTILES[3];
      this.turnRate = 0;
    } else {
      this.range = 0;
      this.shotCoolDown = 0;
      this.firedProjectile = "none";
    }

    this.turretAngle = 0;
    this.lastUpdateTime = 0;
    this.lastShotTime = 0;
  }
  /**
   * Performs a physics update.
   * @param {Number} lastUpdateTime The last timestamp an update occurred
   * @param {Number} deltaTime The timestep to compute the update with
   */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    this.turretAngle = Util.normalizeAngle(
      this.turretAngle + this.turnRate * deltaTime
    );
  }
  /**
    * Updates the building on input from the player or building defense AI
    * @param {Object} data The JSON object that is storing the movement data
    */
  updateOnInput(data) {
    if(data.from === "Player") {
      //
    }
  }
  /**
    * Returns a boolean based on whether the
    * building can attack. Only works if the building is a
    * defensive automated machine
    * @returns {Boolean}
    */
  canAttack() {
    if(this.type === "cannon_tower") {
      return this.lastUpdateTime > this.lastShotTime + this.shotCoolDown;
    }
    throw new Error("Building type is not a cannon tower; Cannot attack.");
  }
  /**
    * Returns a Projectile instance. This function
    * does not do a shot cooldown check
    * @returns {Projectile}
    */
  getProjectileFromShot() {
    if(this.type === "cannon_tower") {
      const projectile = Projectile.createFromBuilding(this);
      return projectile;
    }
    throw new Error(
      "Building type is not a cannon tower; Cannot get projectile from shot."
    );
  }
  /**
    * Damages the current building
    * @param {Number} amount The amount to damage the Building
    */
  damage(amount) {
    this.health -= amount;
  }
  /**
   * Returns a boolean determining if the building is destroyed or not
   * @return {Boolean}
   */
  isDestroyed() {
    return this.health <= 0;
  }
}

/**
 * Module exports
 */
module.exports = exports = Building;
