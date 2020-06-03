/**
 * @fileoverview Session class to handle sessions
 * @author Horton Cheng <horton0712@gmail.com>
 */

const { randomBytes } = require("crypto");

/**
 * Session class
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
    this.storage = {};
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
    this.storage[data.id] = {
      id: data.id,
      token: data.token,
      startTime: data.startTime,
      maxAge: data.maxAge,
      storedData: data.otherData
    };
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
    const currentSession = this.storage[data.id];
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
    const session = this.storage[oldID];
    if (!session) {
      throw new Error("Session does not exist");
    }

    session.id = newID;
    this.storage[newID] = session;
    delete this.storage[oldID];
  }
  /**
   * Refreshes all of this object's sessions
   */
  refreshAll() {
    for (const key in this.storage) {
      const currentSession = this.storage[key];

      currentSession.token = randomBytes(16).toString("hex");
      currentSession.startTime = Date.now();
    }
  }
  /**
   * Refreshes a specific client's session
   * @param {String} ID The ID of the client
   */
  refresh(ID) {
    const session = this.storage[ID];
    if (!session) {
      throw new ReferenceError("Session does not exist!");
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
    const session = this.storage[ID];
    if (!session) {
      return null;
    }
    return session;
  }
  /**
   * Calls a function for each of the sessions in the
   * session storage
   * @param {function({}, String):void} fn The function
   * to call for each session
   */
  forEach(fn) {
    for (const session in this.storage) {
      const sessionInfo = this.storage[session];
      fn(sessionInfo, session);
    }
  }
  /**
   * Deletes a session
   * @param {String} ID The ID associated with the session
   */
  deleteSession(ID) {
    const session = this.storage[ID];
    if (!session) {
      throw new Error("Session does not exist!");
    }
    delete this.storage[ID];
  }
}

module.exports = exports = SessionStorage;
