/**
 * @fileoverview SessionStorage class to handle sessions
 * @author Horton Cheng <horton0712@gmail.com>
 */

const { randomBytes } = require("crypto");

/**
 * @callback fn
 * @param {{}} session The session
 * @param {String} ID The session ID
 * @returns {void}
 */

/**
 * SessionStorage class
 */
class SessionStorage {
  /**
   * Constructor for a SessionStorage object
   * @param {String} token The token of the session storage
   * @param {String} serverToken The token of the server
   * @param {Number} maxAge The max age of the sessions in this storage
   */
  constructor(token, serverToken, maxAge) {
    this.token = token;
    this.serverToken = serverToken;
    this.maxAge = maxAge;
    this.storage = new Map();
  }
  /**
   * Gets all sessions in this storage
   * @returns {{}}
   */
  get allSessions() {
    return this.storage;
  }
  /**
   * Adds a new session
   * @param {{
   * serverToken: String,
   * id: String,
   * token: String,
   * startTime: Number,
   * maxAge: Number,
   * otherData: {}
   * }} data The data for the new session
   */
  addNewSession(data) {
    if (!data.token) {
      throw new TypeError("No token specified!");
    } else if (!data.id) {
      throw new TypeError("No id specified!");
    } else if (data.maxAge > this.maxAge) {
      throw new Error(
        "The requested session's maxAge is greater than the configured maxAge!"
      );
    }

    if (data.serverToken !== this.serverToken) {
      throw new Error("Given server token is not correct!");
    }
    this.storage.set(data.id, {
      id: data.id,
      token: data.token,
      startTime: data.startTime,
      maxAge: data.maxAge,
      storedData: data.otherData
    });
  }
  /**
   * Adds data to a session. Please use this method because it always
   * verifys the token for you.
   * @param {{
   * id: String,
   * token: String,
   * dataToAdd: {}
   * }} data The data to add
   */
  addDataToSession(data) {
    const currentSession = this.storage.get(data.id);
    if (!currentSession) {
      throw new Error("Session does not exist.");
    } else if (data.token !== currentSession.token) {
      throw new Error("Supplied token does not match expected token.");
    }

    for (const key in data.dataToAdd) {
      currentSession.storedData[key] = data.dataToAdd[key];
    }
  }
  /**
   * Changes a session's ID
   * @param {String} newID The new ID to give this session
   * @param {String} oldID The old ID of the session
   */
  changeSessionID(newID, oldID) {
    const session = this.storage.get(oldID);
    if (!session) {
      throw new Error("Session does not exist");
    }

    session.id = newID;
    this.storage.set(newID, session);
    this.storage.delete(oldID);
  }
  /**
   * Refreshes all of this object's sessions
   */
  refreshAll() {
    for (const key of this.storage.keys()) {
      const currentSession = this.storage.get(key);

      currentSession.token = randomBytes(16).toString("hex");
      currentSession.startTime = Date.now();

      this.storage.set(key, currentSession);
    }
  }
  /**
   * Refreshes a specific client's session
   * @param {String} ID The ID of the client
   */
  refresh(ID) {
    const session = this.storage.get(ID);
    if (!session) {
      throw new Error("Session does not exist!");
    }
    session.token = randomBytes(16).toString("hex");
    session.startTime = Date.now();
  }
  /**
   * Gets a specific client's session
   * @param {String} ID The ID of the client
   * @returns {{}}
   */
  getSessionInfo(ID) {
    const session = this.storage.get(ID);
    if (!session) {
      return {};
    }
    return session;
  }
  /**
   * Calls a function for each of the sessions in the
   * session storage
   * @param {fn} fn The function
   * to call for each session
   */
  forEach(fn) {
    for (const ID in this.storage.keys()) {
      const session = this.storage.get(ID);

      fn(session, ID);
    }
  }
  /**
   * Deletes a session
   * @param {String} ID The ID associated with the session
   */
  deleteSession(ID) {
    const session = this.storage.get(ID);
    if (!session) {
      throw new Error("Session does not exist!");
    }
    this.storage.delete(ID);
  }
}

/**
 * Module exports
 */
module.exports = exports = SessionStorage;
