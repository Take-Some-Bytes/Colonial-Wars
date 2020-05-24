/**
 * @fileoverview Entity object to control entities in the game
 * @author Horton Cheng <horton0712@gmail.com>
 */

import * as Util from "../../functions.js";
import { Constants } from "../../Constants-client.js";
import { Vector } from "./Vector.js";

/**
 * Entity class
 */
export class Entity {
  /**
    * Constructor for the Entity class
    * @param {Vector} position The current position of the entity
    * @param {Vector} velocity The current velocity of the entity
    * @param {Vector} acceleration The acceleration of the entity
    * @param {Number} mass The mass of the entity
    * @param {Number} hitbox The circular hitbox of the entity
    */
  constructor(position, velocity, acceleration, mass, hitbox) {
    this.position = position || Vector.zero();
    this.velocity = velocity || Vector.zero();
    this.acceleration = acceleration || Vector.zero();
    this.mass = mass;
    this.hitbox = hitbox;
  }
  /**
    * Tests if an entity has collided with another one
    * @param {Entity} other The other Entity
    * @returns {Boolean}
    */
  collided(other) {
    const minDistance = other.hitbox + this.hitbox;
    return Vector.sub(this.position, other.position).mag2 <=
      minDistance * minDistance;
  }
  /**
    * Tests if an entity is inside the world bounds
    * @returns {Boolean}
    */
  inWorld() {
    return Util.inBound(
      this.position.x, Constants.WORLD_MIN, Constants.WORLD_MAX
    ) &&
      Util.inBound(
        this.position.y, Constants.WORLD_MIN, Constants.WORLD_MAX
      );
  }
  /**
    * Binds this entity's position within the world if it is outside of the
    * game world
    */
  bindToWorld() {
    this.position.x = Util.bind(
      this.position.x, Constants.WORLD_MIN, Constants.WORLD_MAX
    );
    this.position.y = Util.bind(
      this.position.y, Constants.WORLD_MIN, Constants.WORLD_MAX
    );
  }
}