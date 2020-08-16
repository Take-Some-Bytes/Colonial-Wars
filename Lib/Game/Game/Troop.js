/**
 * @fileoverview A Troops class to manage troop
 * physics
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports
const Projectile = require("./Projectile");
const Entity = require("../Physics/Entity");
const Vector = require("../Physics/Vector");
const Building = require("./Building");
const Util = require("../../common/util");
const Constants = require("../../common/constants");

/**
 * Troop class
 * @extends {Entity}
 */
class Troop extends Entity {
  /**
    * Troop constructor
    * @param {Vector} position The current position of the Troop
    * @param {String} [type="light_infantry"] The type of the Troop
    * @param {Boolean} [isHuman=true] Is the troop human?
    * @param {String} [team="Neutral"] The troop's team
    */
  constructor(position, type = "light_infantry",
    isHuman = true, team = "Neutral"
  ) {
    const stats = Constants.TROOP_STATS[type];
    super(position, Vector.zero(), stats.mass, stats.hitbox_size);

    this.type = type;
    this.team = team;
    this.isHuman = isHuman;
    this.isMechanical = !isHuman;
    this.canGetRepaired = !isHuman;
    this.attackCooldown = Constants.ATTACK_COOLDOWN[type];
    this.attackRange = stats.range;
    this.health = stats.max_health;
    this.movementSpeed = stats.speed;
    this.shotCoolDown = Constants.ATTACK_COOLDOWN[type];
    this.buildTime = stats.build_time;

    switch (this.type) {
    case Constants.TROOPS[0]:
    case Constants.TROOPS[1]:
    case Constants.TROOPS[2]:
      this.firedProjectile = Constants.PROJECTILES[0];
      break;
    case Constants.TROOPS[3]:
    case Constants.TROOPS[5]:
      this.firedProjectile = Constants.PROJECTILES[1];
      break;
    case Constants.TROOPS[6]:
      this.firedProjectile = Constants.PROJECTILES[2];
      break;
    case Constants.TROOPS[7]:
      this.firedProjectile = Constants.PROJECTILES[3];
      break;
    case Constants.TROOPS[8]:
      this.firedProjectile = Constants.PROJECTILES[4];
      break;
    case Constants.TROOPS[9]:
      this.firedProjectile = Constants.PROJECTILES[5];
      break;
    case Constants.TROOPS[4]:
      this.firedProjectile = "none";
      break;
    default:
      throw new Error("Troop type not recognized!");
    }

    this.usedWeapon =
    !this.firedProjectile && this.isHuman ?
      Constants.MELEE_WEAPONS[type] :
      Constants.RANGED_WEAPONS[type];

    this.lastUpdateTime = 0;
    this.lastShotTime = 0;
    this.angle = 0;
    this.turnRate = 0;
    this.kills = 0;
    this.destroyed = false;
  }
  /**
    * Returns a boolean based on whether the
    * troop can attack
    * @returns {Boolean}
    */
  canAttack() {
    return this.lastUpdateTime > this.lastShotTime + this.shotCoolDown;
  }
  /**
    * Damages the current troop
    * @param {Number} amount The amount to damage the Troop
    */
  damage(amount) {
    this.health -= amount;
  }
  /**
   * Returns a boolean determining if the troop is dead or not.
   * @return {Boolean}
   */
  isDead() {
    return this.health <= 0;
  }
  /**
    * Updates this troop on input from the Troop AI
    * @param {{
    * up: Boolean,
    * down: Boolean,
    * right: Boolean,
    * left: Boolean,
    * angle: Number
    * }} data A JSON object containing the movement data
    */
  updateOnInput(data) {
    if (data.up) {
      this.velocity = Vector.fromPolar(
        this.movementSpeed, Util.degreeToRadian(this.angle)
      );
    } else if (data.down) {
      this.velocity = Vector.fromPolar(
        this.movementSpeed, Util.degreeToRadian(this.angle)
      );
    } else if (!(data.up ^ data.down)) {
      this.velocity = Vector.zero();
    }

    if (data.right) {
      this.turnRate = Constants.TROOP_TURN_SPEED;
    } else if (data.left) {
      this.turnRate = -Constants.TROOP_TURN_SPEED;
    } else if (!(data.left ^ data.right)) {
      this.turnRate = 0;
    }

    this.angle = data.angle;
  }
  /**
   * Performs a physics update.
   * @param {Number} lastUpdateTime The last timestamp an update occurred
   * @param {Number} deltaTime The timestep to compute the update with
   */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    this.position.add(Vector.scale(this.velocity, deltaTime));
    this.bindToWorld();
    this.angle = Util.normalizeAngle(
      this.angle + this.turnRate * deltaTime);
  }
  /**
    * Returns a Projectile instance. This function
    * does not do a shot cooldown check
    * @returns {Projectile}
    */
  getProjectileFromShot() {
    const projectile = Projectile.createFromTroop(this);
    return projectile;
  }
  /**
    * Creates a troop from a building
    * @param {Building} building The building to create the troop from
    * @param {String} type The type of the Troop to spawn
    * @param {Vector} spawnPoint The spawn point of the troop
    * @returns {Troop}
    */
  static createFromBuilding(building, type, spawnPoint) {
    const buildingSpawnedTroopLength = building.spawnedTroops.length;
    const buildingSpawnedTroops = building.spawnedTroops;
    let isHuman = null;

    if (buildingSpawnedTroopLength < 1) {
      throw new Error("The specified building cannot spawn troops!");
    }

    for (let i = 0; i < buildingSpawnedTroopLength; i++) {
      if (type !== buildingSpawnedTroops[i] &&
        i === buildingSpawnedTroopLength - 1
      ) {
        throw new Error(
          "Troop type cannot be spawned from specified building!"
        );
      } else if (type === buildingSpawnedTroops[i]) {
        break;
      }
    }
    for (let i = 0; i < Constants.TROOPS.length - 4; i++) {
      if (type !== Constants.TROOPS[i] && i === Constants.TROOPS.length - 1) {
        isHuman = false;
      } else if (type === Constants.TROOPS[i]) {
        isHuman = true;
      }
    }

    return new Troop(
      spawnPoint,
      type,
      isHuman,
      building.team
    );
  }
}

/**
 * Module exports
 */
module.exports = exports = Troop;
