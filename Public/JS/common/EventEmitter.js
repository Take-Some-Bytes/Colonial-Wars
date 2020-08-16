/**
 * @fileoverview Browser-side EventEmitter API
 * @author Horton Cheng <horton0712@gmail.com>
 */

/**
 * @callback ListeningListener
 * @param {...any} [args] Arguments
 * @returns {void}
 */
/**
 * The default amount of maximum listeners on
 * a single instance of the EventEmitter class.
 * @readonly
 */
export const defaultMaxListeners = 10;
/**
 * EventEmitter class.
 */
export class EventEmitter {
  /**
   * Constructor for an EventEmitter class.
   */
  constructor() {
    this.listeners = {};

    this.maxListeners = defaultMaxListeners;
  }
  /**
   * Adds an event listener
   * @param {String} type The type of the event.
   * @param {ListeningListener} callback The callback to call.
   */
  addListener(type, callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }
    if (this.listeners[type].length > this.maxListeners) {
      console.warn("Exceeded max listeners on event: ", type);
    }
    this.listeners[type].push(callback);
  }
  /**
   * Dispatches an event.
   * @param {String} event The event to dispatch.
   * @param  {...any} [args] Arguments.
   * @returns {Boolean}
   */
  dispatchEvent(event, ...args) {
    if (!(event in this.listeners)) {
      return false;
    }
    const stack = this.listeners[event].slice();

    for (let i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, ...args);
    }
    return true;
  }
  /**
   * Emits an event on this EventEmitter.
   * @param {String} event The event to emit.
   * @param  {...any} [args] Arguments.
   * @returns {Boolean}
   */
  emit(event, ...args) {
    return this.dispatchEvent(event, ...args);
  }
  /**
   * Alias for ``emitter.addListener()``.
   * @param {String} type The type of the event.
   * @param {ListeningListener} callback The callback to call.
   */
  on(type, callback) {
    this.addListener(type, callback);
  }
  /**
   * Alias for ``emitter.removeListener()``.
   * @param {String} type The type of the event.
   * @param {ListeningListener} callback The callback to call.
   */
  off(type, callback) {
    this.removeListener(type, callback);
  }
  /**
   * Removes a listener.
   * @param {String} type The type of the event.
   * @param {ListeningListener} callback The listening listener.
   */
  removeListener(type, callback) {
    if (!(type in this.listeners)) {
      return;
    }
    const stack = this.listeners[type];
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1);
        return;
      }
    }
  }
}
