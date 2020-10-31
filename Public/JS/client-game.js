/**
 * @fileoverview This is the client main file for the game page.
 * @author Horton Cheng <horton0712@gmai.com>
 */
// NOTICE: THE CODE IN THIS FILE IS EXPERIMENTAL.
// We're seeing how well we do without jQuery.
/**
 * Get the type definitions
 * @typedef {import("socket.io-client")} SocketIOStatic
 */

import Constants from "./Constants-client.js";
import Game from "./Game/Game.js";
import { changeViewportStats } from "./common/functions.js";

const pathname = window.location.pathname;
let game = null;

if (pathname === "/play") {
  // Connect to the /play namespace.
  const socket = io("/play", {
    reconnection: false,
    autoConnect: false,
    reconnectionAttempts: 5
  });

  // NO CONTEXT MENU FOR YOU!!!
  document.addEventListener("contextmenu", e => {
    e.preventDefault();
    return false;
  });
  window.addEventListener("resize", () => {
    changeViewportStats();
  });
  window.addEventListener("load", () => {
    const documentBody = document.body;
    const main = document.querySelector("main");
    documentBody.style.height = `${Constants.VIEWPORT_HEIGHT}px`;
    documentBody.style.width = `${Constants.VIEWPORT_WIDTH}px`;
    main.style.height = `${Constants.VIEWPORT_HEIGHT}px`;
    main.style.width = `${Constants.VIEWPORT_WIDTH}px`;

    socket.on(Constants.SOCKET_DISCONNECT, reason => {
      if (reason === "io server disconnect") {
        while (document.body.hasChildNodes()) {
          document.body.removeChild(document.body.firstChild);
        }
        document.body.insertAdjacentHTML(
          "afterbegin", "<h1>Connection lost.</h1>"
        );
        return;
      }
      socket.connect();
    });
    socket.on("reconnect_attempt", attemptNumber => {
      if (attemptNumber > 2) {
        while (document.body.hasChildNodes()) {
          document.body.removeChild(document.body.firstChild);
        }
        document.body.insertAdjacentHTML(
          "afterbegin",
          "<h1>Unable to connect to game. Click <a href=\"/\">" +
          "here</a> to go back to the main page.</h1>"
        );
        return;
      }
      socket.connect();
    });
    socket.on("connect_error", err => {
      console.error(err);
      while (document.body.hasChildNodes()) {
        document.body.removeChild(document.body.firstChild);
      }
      document.body.insertAdjacentHTML(
        "afterbegin",
        "<h1>Unable to connect to game. Click <a href=\"/\">" +
        "here</a> to go back to the main page.</h1>"
      );
    });
    socket.on(Constants.SOCKET_ERROR, err => {
      console.error(err);
      while (document.body.hasChildNodes()) {
        document.body.removeChild(document.body.firstChild);
      }
      document.body.insertAdjacentHTML(
        "afterbegin",
        "<h1>An error has occured. Click <a href=\"/\">" +
        "here</a> to go back to the main page.</h1>\n" +
        `<h3>Error is: ${err}</h3>`
      );
    });

    socket.connect();

    // We have to wait for a "proceed" event to make sure that the
    // server is ready for us.
    socket.on(Constants.SOCKET_PROCEED, data => {
      const parsedData = JSON.parse(data);
      const gameID = parsedData.playerData.gameID;
      const map = parsedData.playerData.gameMap;

      game = Game.create(
        socket, "game-board", map, gameID
      );
      game.run();
    });
  });
}
