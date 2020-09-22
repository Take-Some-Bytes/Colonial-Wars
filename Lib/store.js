/**
 * @fileoverview Experimental `SessionStore` class for server-side storage
 * of client sessions.
 * @author Horton Cheng <horton0712@gmail.com>
 */

/**
 * @typedef {Object} SessionEntry
 * @prop {Object} meta
 * @prop {Date} [meta.expires]
 * @prop {number} [meta.maxAge]
 * @prop {SessionData} sessionData
 */
/**
 * @typedef {Object<string, any>} SessionData
 */
/**
 * @typedef {Object} SessionStoreOpts
 * @prop {number} checkRate
 * @prop {number} ttl
 */
/**
 * @callback SessionCallback
 * @param {Error} err
 * @param {SessionData|Array<SessionData>} [sessions]
 * @returns {void}
 */
/**
 * @callback DeferCallback
 * @param {...any} args
 * @returns {void}
 */

/**
 * One day in milliseconds.
 */
const oneDay = 86400000;

/**
 * Gets a session.
 * @param {string} id The session ID.
 * @returns {SessionEntry|false}
 * @this {SessionStore}
 * @private
 */
function getSession(id) {
  const session = this._store.get(id);

  if (!session) {
    return false;
  }

  /**
   * @type {SessionEntry}
   */
  const parsed = JSON.parse(session);

  const expires = typeof parsed.meta.expires === "string" ?
    new Date(parsed.meta.expires) :
    parsed.meta.expires;
  // If the session is expired or has no expiry, delete it.
  if (
    expires === undefined || expires === null ||
    expires && expires <= Date.now()
  ) {
    this._store.delete(id);
    return false;
  }

  // All is well, return the session.
  return parsed;
}
/**
 * Stringifies a session.
 * @param {SessionEntry} session The session data.
 * @this {SessionStore}
 * @returns {string}
 */
function stringifySession(session) {
  let stringifiedSession = "";

  if (
    !session.meta ||
    (
      !(session.meta.expires instanceof Date) ||
      typeof session.meta.expires !== "string"
    ) &&
    typeof session.meta.maxAge !== "number"
  ) {
    if (!session.meta) {
      session.meta = {};
    }
    if (typeof this.opts.ttl === "number") {
      session.meta.expires = new Date(Date.now() + this.opts.ttl);
    } else {
      session.meta.expires = new Date(Date.now() + oneDay);
    }
  } else if (typeof session.meta.maxAge === "number") {
    session.meta.expires = new Date(Date.now() + session.meta.maxAge);
  }

  stringifiedSession = JSON.stringify(session);
  return stringifiedSession;
}
/**
 * Prunes expired sessions in a storage.
 * @param {Map<string, string>} [store] The actual storage to use. Must have all
 * functions and properties that a `Map` has.
 * @this {SessionStore}
 * @private
 */
function pruneSessions(store) {
  store.forEach((val, key) => {
    getSession.call(this, key);
  });
}

/**
 * SessionStore class.
 */
class SessionStore {
  /**
   * Constructor for a SessionStore class.
   * @class
   * @param {Map<string, string>} [store] The actual storage to use.
   * Must have all functions and properties that a `Map` has.
   * @param {SessionStoreOpts} [opts] Options.
   */
  constructor(store, opts) {
    /**
     * The actual storage to put the sessions. This doesn't actually have
     * to be a `Map`, just `Map` like.
     * @type {Map<string, string>}
     */
    this._store = store || new Map();
    this.opts = opts;

    this._checkInterval = null;

    this.startInterval();
  }
  /**
   * Gets a session.
   * @param {string} id The ID of the session.
   * @returns {Promise<SessionEntry|false>}
   */
  get(id) {
    let session = null;
    return new Promise((resolve, reject) => {
      try {
        session = getSession.call(this, id);
        if (typeof session !== "object") {
          throw new Error(`Session ${id} does not exist.`);
        }
        resolve(session);
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * Sets a session.
   * @param {string} id The ID of the session.
   * @param {SessionEntry} session The session data.
   * @returns {Promise<void>}
   */
  set(id, session) {
    return new Promise((resolve, reject) => {
      let stringifiedSession = "";

      try {
        stringifiedSession = stringifySession.call(this, session);
        this._store.set(id, stringifiedSession);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * Destroys a session.
   * @param {string|Array<string>} id The ID of the session.
   * @returns {Promise<void>}
   */
  destroy(id) {
    return new Promise((resolve, reject) => {
      try {
        if (id instanceof Array) {
          id.forEach(theID => {
            this._store.delete(theID);
          });
        } else {
          this._store.delete(id);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * Sets a session.
   * @param {string} id The ID of the session.
   * @param {SessionEntry} session The session data.
   * @returns {Promise<void>}
   */
  touch(id, session) {
    if (!session) {
      session = {};
    }
    return new Promise((resolve, reject) => {
      if (this._store.has(id)) {
        try {
          /**
           * @type {SessionEntry}
           */
          const parsedSession = getSession.call(this, id);
          if (typeof parsedSession !== "object") {
            resolve();
            return;
          }
          parsedSession.meta = session.meta;
          const stringifiedSession = stringifySession.call(this, parsedSession);
          this._store.set(id, stringifiedSession);
          resolve();
        } catch (err) {
          reject(err);
        }
      }
    });
  }
  /**
   * Clears all the sessions in this store.
   * @returns {Promise<void>}
   */
  clear() {
    return new Promise(resolve => {
      this._store.clear();
      resolve();
    });
  }
  /**
   * Gets all the sessions in this store.
   * @returns {Promise<Object<string, SessionEntry>>}
   */
  all() {
    return new Promise((resolve, reject) => {
      const result = {};
      try {
        this._store.forEach((sess, id) => {
          result[id] = JSON.parse(sess);
        });

        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
  /**
   * Starts the interval to prune sessions.
   */
  startInterval() {
    // Get the check rate.
    const checkRate = this.opts.checkRate;

    if (checkRate && typeof checkRate === "number") {
      clearInterval(this._checkInterval);
      this._checkInterval = setInterval(() => {
        pruneSessions.call(this, this._store);
      }, checkRate);
    }
  }
  /**
   * Stops the interval to prune sessions.
   */
  stopInterval() {
    clearInterval(this._checkInterval);
  }
  /**
   * Manually prunes the sessions.
   */
  prune() {
    pruneSessions.call(this, this._store);
  }
}

/**
 * Module exports.
 */
module.exports = exports = SessionStore;
