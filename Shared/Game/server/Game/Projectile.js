/**
 * @fileoverview Projectile class to handle the projectiles
 * in the game
 * @author Horton Cheng <horton0712@gmail.com>
 * @version
 */

//Imports
const Entity = require("../Physics/Entity");
const Vector = require("../Physics/Vector");
const Constants = require("../../../Constants");
const Building = require("./Building");
const Troop = require("./Troop");
const Util = require("../../../Util");

/**
 * Projectile class to control projectile physics
 */
class Projectile extends Entity {
  /**
    * Constructor for the Projectile class
    * @param {Vector} position The position of the projectile
    * @param {Vector} velocity The velocity of the projectile
    * @param {Number} mass The mass of the projectile
    * @param {Number} hitbox The circular hitbox of the projectile
    * @param {Number} angle The orientation of the projectile(in degrees)
    * @param {Building|Troop} source The Troop or Building object 
    * firing the projectile
    * @param {String} type The type of projectile
    */
  constructor(position, velocity, mass, hitbox, angle, source, type) {
    super(position, velocity, Vector.zero(), mass, hitbox);

    this.angle = angle;
    this.source = source;

    this.type = type;
    this.damage = Constants.BULLET_DAMAGE[type];
    this.splashDamage = Constants.SPLASH_DAMAGE[type];
    this.splashDamageRadius = Constants.SPLASH_DAMAGE_RADIUS[type];
    this.maxDistance = Constants.BULLET_MAX_RANGE[type];
    this.distanceTraveled = 0;
    this.destroyed = false;
    this.lastUpdateTime = 0;
  }
  /**
    * Does a physics update
    * @param {Number} lastUpdateTime The last update time
    * @param {Number} deltaTime The time now
    */
  update(lastUpdateTime, deltaTime) {
    this.lastUpdateTime = lastUpdateTime;
    const distanceStep = Vector.scale(this.velocity, deltaTime);
    this.position.add(distanceStep);
    this.distanceTraveled += distanceStep.mag2;
      
    if(this.type === "mortar_shell") {
      this.velocity.y -= 0.0015;
    }
    if(this.distanceTraveled >= this.maxDistance - 90) {
      this.velocity.x -= 0.0002;
    }
    if(this.distanceTraveled > this.maxDistance || !this.inWorld()) {
      this.destroyed = true;
    }
  }
  /**
    * Creates a new Projectile from a Troop
    * @param {Troop} troop The Troop object to create the Projectile from
    * @param {Number} [angleDeviation=0] The angle deviation if the projectile 
    * is not traveling in the direction of the Troop
    * @returns {Projectile}
    */
  static createFromTroop(troop, angleDeviation = 0) {
    const angle = Util.degreeToRadian(troop.angle + angleDeviation);
    const firedProjectile = troop.firedProjectile;
    return new Projectile(
      troop.position.copy(),
      Vector.fromPolar(Constants.BULLET_SPEED, angle),
      Constants.BULLET_MASS[firedProjectile],
      Constants.BULLET_HITBOX[firedProjectile],
      angle,
      troop,
      firedProjectile
    );
  }
  /**
    * Creates a new Projectile from a Building
    * @param {Building} building The Building object to create the 
    * Projectile from
    * @param {Number} [angleDeviation=0] The angle deviation if the projectile 
    * is not traveling in the direction of the Building
    * @returns {Projectile}
    */
  static createFromBuilding(building, angleDeviation = 0) {
    const angle = Util.degreeToRadian(building.turretAngle + angleDeviation);
    const firedProjectile = building.firedProjectile;
    return new Projectile(
      building.position.copy(),
      Vector.fromPolar(Constants.BULLET_SPEED, angle),
      Constants.BULLET_MASS[firedProjectile],
      Constants.BULLET_HITBOX[firedProjectile],
      angle,
      building,
      firedProjectile
    );
  }
}

/**
 * Module exports
 */
module.exports = exports = Projectile;
