/**
 * @fileoverview This is the client main file for the game page.
 * @author Horton Cheng <horton0712@gmai.com>
 */
/**
 * Get the type definitions
 * @typedef {import("jquery")} jQuery
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
  $(document).on("contextmenu", e => {
    e.preventDefault();
    return false;
  });
  // BUG: This doesn't seem to be working.
  $("#reconnect").on("click", e => {
    e.preventDefault();

    socket.connect();
  });
  $(window).on("resize", () => {
    changeViewportStats();

    socket.emit(Constants.SOCKET_SCREEN_RESIZE, JSON.stringify({
      gameData: {},
      otherData: {
        screen_size: {
          height: Constants.VIEWPORT_HEIGHT,
          width: Constants.VIEWPORT_WIDTH
        }
      }
    }));
  });
  $(() => {
    $("body")
      .height(Constants.VIEWPORT_HEIGHT)
      .width(Constants.VIEWPORT_WIDTH);
    $("main")
      .height(Constants.VIEWPORT_HEIGHT)
      .width(Constants.VIEWPORT_WIDTH);

    socket.on(Constants.SOCKET_DISCONNECT, reason => {
      if (reason === "io server disconnect") {
        $("body")
          .html("")
          .html(
            "<h1>Connection lost."
          );
        return;
      }
      socket.connect();
    });
    socket.on("reconnect_attempt", attemptNumber => {
      if (attemptNumber > 2) {
        $("body")
          .html("")
          .html(
            "<h1>Unable to connect to game. Click <a href=\"/\">" +
            "here</a> to go back to the main page.</h1>"
          );
        return;
      }
      socket.connect();
    });
    socket.on("connect_error", err => {
      console.error(err);
      $("body")
        .html("")
        .html(
          "<h1>Unable to connect to game. Click <a href=\"/\">" +
          "here</a> to go back to the main page.</h1>"
        );
    });
    socket.on(Constants.SOCKET_ERROR, err => {
      $("body")
        .html("")
        .html(
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
