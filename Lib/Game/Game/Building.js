/**
 * @fileoverview A Buildings class to manage buildings physics.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const Projectile = require("./Projectile");
const Entity = require("../Physics/Entity");
const Vector = require("../Physics/Vector");
const Util = require("../../common/util");
const Constants = require("../../common/constants");

/**
 * Building class.
 * @extends Entity
 */
class Building extends Entity {
  /**
   * Constructor for a Building object.
   * @class
   * @param {Vector} position The current position of the Building.
   * @param {string} [type="tent"] The type of the Building.
   * @param {string} [team="Neutral"] The team of the building.
   */
  constructor(position, type = "tent", team = "Neutral") {
    const stats = Constants.BUILDING_STATS[type];

    super(
      position, Vector.zero(), Vector.zero(),
      stats.mass,
      stats.hitbox_size
    );

    this.type = type;
    this.team = team;
    this.health = stats.max_health;
    this.buildTime = stats.build_time;
    this.spawnedTroops = stats.spawned_troops;
    this.preventsTeamLoss = this.type === "main_base";
    this.preventsPlayerLoss =
      this.type === "main_tent" && !this.preventsTeamLoss;

    if (this.type === "cannon_tower") {
      this.range = stats.range;
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
    this.kills = 0;
    this.destroyed = false;
  }
  /**
   * Performs a physics update.
   * @param {number} lastUpdateTime The last timestamp an update occurred.
   * @param {number} deltaTime The timestep to compute the update with.
   */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    if (this.type === "cannon_tower") {
      this.turretAngle = Util.normalizeAngle(
        this.turretAngle + this.turnRate * deltaTime
      );
    }
  }
  // /**
  //  * Updates the building on input from the player or building defense AI.
  //  * @param {Object} data The JSON object that is storing the movement data.
  //  */
  // updateOnInput(data) {
  //   // TODO: CODE THE BUILDING DEFENSE AI!!!
  //   if (data.from === "Player") {
  //     //
  //   }
  // }
  /**
   * Returns a boolean based on whether the building can attack.
   * Only works if the building is a defensive automated machine.
   * @returns {boolean}
   */
  canAttack() {
    if (this.type === "cannon_tower") {
      return this.lastUpdateTime > this.lastShotTime + this.shotCoolDown;
    }
    throw new Error("Building type is not a cannon tower; Cannot attack.");
  }
  /**
   * Returns a Projectile instance.
   * This function does not do a shot cooldown check.
   * @returns {Projectile}
   */
  getProjectileFromShot() {
    if (this.type === "cannon_tower") {
      const projectile = Projectile.createFromBuilding(this);
      return projectile;
    }
    throw new Error(
      "Building type is not a cannon tower; Cannot get projectile from shot."
    );
  }
  /**
   * Damages the current building.
   * @param {number} amount The amount to damage the Building.
   */
  damage(amount) {
    this.health -= amount;
  }
  /**
   * Returns a boolean determining if the building is dead or not.
   * @returns {boolean}
   */
  isDead() {
    return this.health <= 0;
  }
  /**
   * Factory method for a building object.
   * @param {Vector} position The position of the building.
   * @param {string} type The type of the building.
   * @param {string} team The team the building is on.
   * @returns {Building}
   */
  static create(position, type, team) {
    // TODO: See if this factory function is necessary.
    const building = new Building(position, type, team);
    return building;
  }
}

/**
 * Module exports.
 */
module.exports = exports = Building;
