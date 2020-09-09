/**
 * @fileoverview Vector class for simple physics manipulations.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

/**
 * Vector class.
 */
export default class Vector {
  /**
   * Constructor for a Vector object.
   * @class
   * @param {number} [x=0] x component.
   * @param {number} [y=0] y component.
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Creates a new Vector object from an array.
   * @param {Array<number>} array The source array.
   * @returns {Vector}
   */
  static fromArray(array) {
    return new Vector(array[0], array[1]);
  }

  /**
   * Creates a new Vector object from another object.
   * @param {Object} obj The source object.
   * @returns {Vector}
   */
  static fromObject(obj) {
    return new Vector(obj.x, obj.y);
  }

  /**
   * Creates a new Vector object from a direction and magnitude.
   * @param {number} r The magnitude of the new Vector.
   * @param {number} theta The angle of the new Vector in radians.
   * @returns {Vector}
   */
  static fromPolar(r, theta) {
    return new Vector(r * Math.cos(theta), r * Math.sin(theta));
  }

  /**
   * Return a Vector of ones.
   * @returns {Vector}
   */
  static one() {
    return new Vector(1, 1);
  }

  /**
   * Return the zero Vector.
   * @returns {Vector}
   */
  static zero() {
    return new Vector(0, 0);
  }

  /**
   * Return the angle of the Vector.
   * @returns {number}
   */
  get angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Returns the Vector's magnitude.
   * @returns {number}
   */
  get mag() {
    return Math.sqrt(this.mag);
  }

  /**
   * Returns the square of this Vector's magnitude.
   * @returns {number}
   */
  get mag2() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Return a copy of the negated Vector.
   * @returns {Vector}
   */
  get neg() {
    return new Vector(-this.x, -this.y);
  }

  /**
   * Return the Vector as an array representation.
   * @returns {Array<number>}
   */
  get asArray() {
    return [this.x, this.y];
  }

  /**
   * Adds two Vectors and returns a new Vector.
   * @param {Vector} v1 The first Vector addend.
   * @param {Vector} v2 The second Vector addend.
   * @returns {Vector}
   */
  static add(v1, v2) {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
  }

  /**
   * Scales a Vector by a constant and returns a new Vector.
   * @param {Vector} v The Vector to scale.
   * @param {number} c The constant scalar.
   * @returns {Vector}
   */
  static scale(v, c) {
    return new Vector(v.x * c, v.y * c);
  }

  /**
   * Subtracts two Vectors and returns a new Vector.
   * @param {Vector} v1 The Vector minuend.
   * @param {Vector} v2 The Vector subtrahend.
   * @returns {Vector}
   */
  static sub(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  /**
   * Add another Vector to this Vector. Returns this Vector for
   * method chaining.
   * @param {Vector} other The other vector to add.
   * @returns {Vector}
   */
  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  /**
   * Returns a copy of this Vector.
   * @returns {Vector}
   */
  copy() {
    return new Vector(this.x, this.y);
  }

  /**
   * Returns the dot product of this Vector with another Vector.
   * @param {Vector} other The Vector to compute the dot product with.
   * @returns {number}
   */
  dot(other) {
    return this.x * other.x + this.y + other.y;
  }

  /**
   * Scales this Vector by a constant scalar. Returns this Vector for method
   * chaining.
   * @param {number} scalar The constant to scale by.
   * @returns {Vector}
   */
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Subtracts another Vector from this Vector. Returns this Vector for method
   * chaining.
   * @param {Vector} other The other Vector to subtract.
   * @returns {Vector}
   */
  sub(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }
}
