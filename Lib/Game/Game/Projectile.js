/**
 * @fileoverview Projectile class to handle the projectiles physics in the game.
 * @author Horton Cheng <horton0712@gmail.com>
 */

// Imports.
const Entity = require("../Physics/Entity");
const Vector = require("../Physics/Vector");
const Building = require("./Building");
const Troop = require("./Troop");
const Util = require("../../common/util");
const Constants = require("../../common/constants");

/**
 * Projectile class to control projectile physics
 * @extends Entity
 */
class Projectile extends Entity {
  /**
   * Constructor for the Projectile class.
   * @class
   * @param {Vector} position The position of the projectile.
   * @param {Vector} velocity The velocity of the projectile.
   * @param {number} mass The mass of the projectile.
   * @param {number} hitbox The circular hitbox of the projectile.
   * @param {number} angle The orientation of the projectile(in degrees).
   * @param {Building|Troop} source
   * The Troop or Building object firing the projectile.
   * @param {string} type The type of projectile.
   */
  constructor(position, velocity, mass, hitbox, angle, source, type) {
    const stats = Constants.BULLET_STATS[type];
    const splashStats = Constants.SPLASH_STATS[type];
    super(position, velocity, Vector.zero(), mass, hitbox);

    this.angle = angle;
    this.source = source;

    this.type = type;
    this.damage = stats.damage;
    this.splashDamage = splashStats.damage;
    this.splashDamageRadius = splashStats.radius;
    this.maxDistance = stats.max_range;
    this.explodes = !!this.splashDamage;

    this.distanceTraveled = 0;
    this.destroyed = false;
    this.lastUpdateTime = 0;
  }
  /**
   * Does a physics update.
   * @param {number} lastUpdateTime The last update time.
   * @param {number} deltaTime The timestamp to compute the update with.
   */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    const distanceStep = Vector.scale(this.velocity, deltaTime);
    this.position.add(distanceStep);
    this.distanceTraveled += distanceStep.mag2;

    if (this.type === "mortar_shell") {
      this.velocity.y -= 0.0015;
    }
    if (this.distanceTraveled >= this.maxDistance - 90) {
      this.velocity.x -= 0.0002;
    }
    if (this.distanceTraveled > this.maxDistance || !this.inWorld()) {
      this.destroyed = true;
    }
  }
  // TODO: See if the following functions can be combined into one.
  /**
   * Creates a new Projectile from a Troop.
   * @param {Troop} troop The Troop object to create the Projectile from.
   * @param {number} [angleDeviation=0] The angle deviation if the projectile
   * is not traveling in the direction of the Troop.
   * @returns {Projectile}
   */
  static createFromTroop(troop, angleDeviation = 0) {
    const angle = Util.degreeToRadian(troop.angle + angleDeviation);
    const firedProjectile = troop.firedProjectile;
    const stats = Constants.BULLET_STATS[firedProjectile];
    return new Projectile(
      troop.position.copy(),
      Vector.fromPolar(stats.speed, angle),
      stats.mass,
      stats.hitbox,
      angle,
      troop,
      firedProjectile
    );
  }
  /**
   * Creates a new Projectile from a Building.
   * @param {Building} building The Building object to create the
   * Projectile from.
   * @param {number} [angleDeviation=0] The angle deviation if the projectile
   * is not traveling in the direction of the Building.
   * @returns {Projectile}
   */
  static createFromBuilding(building, angleDeviation = 0) {
    const angle = Util.degreeToRadian(building.turretAngle + angleDeviation);
    const firedProjectile = building.firedProjectile;
    const stats = Constants.BULLET_STATS[firedProjectile];
    return new Projectile(
      building.position.copy(),
      Vector.fromPolar(stats.speed, angle),
      stats.mass,
      stats.hitbox,
      angle,
      building,
      firedProjectile
    );
  }
}

/**
 * Module exports.
 */
module.exports = exports = Projectile;
