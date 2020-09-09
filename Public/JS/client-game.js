/**
 * @fileoverview This is the client main file for the game page. This file
 * should also be one of the only files to disable eslint-no-def.
 * @author Horton Cheng <horton0712@gmai.com>
 */
// TODO: Remove the need to disable `no-undef` for this entire file.
// TODO: Get type definitions for Socket.IO client.
/* eslint-disable no-undef */

import Constants from "./Constants-client.js";
import Game from "./Game/Game.js";
import { changeViewportStats } from "./common/functions.js";

const pathname = window.location.pathname;
let game = null;

// TODO: Remove the old security ways.
window.securityData = {};

if (pathname === "/play") {
  // Connect to the /play namespace.
  const socket = io("/play", {
    query: {
      prevSocketID:
        // TODO: Remove the `prevSocketID` item in the query.
        // This type of security is not used anymore.
        localStorage.getItem("prevSocketID")
    },
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
      securityData: {
        // TODO: Stop using "securityData".
        clientData: {
          id: securityData.clientData.id,
          token: securityData.clientData.token
        }
      },
      gameData: {},
      otherData: {
        screen_size: {
          height: Constants.VIEWPORT_HEIGHT,
          width: Constants.VIEWPORT_WIDTH
        }
      }
    }));
  });
  $(document).ready(() => {
    $("body")
      .height(Constants.VIEWPORT_HEIGHT)
      .width(Constants.VIEWPORT_WIDTH);
    $("main")
      .height(Constants.VIEWPORT_HEIGHT)
      .width(Constants.VIEWPORT_WIDTH);
    // BUG: This also doesn't seem to be working.
    $("#reconnect").click(() => {
      socket.connect();
    });

    // TODO: Change the error messages so that they make more sense.
    socket.on(Constants.SOCKET_DISCONNECT, reason => {
      if (reason === "io server disconnect") {
        $("body")
          .html("")
          .html(
            "<h1>Connection lost. Click <a id=\"reconnect\">" +
            "here</a> to reconnect.</h1>"
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
          "<h1>The server has rejected your request. Click <a href=\"/\">" +
          "here</a> to go back to the main page.</h1>\n" +
          `<h3>Error is: ${err}</h3>`
        );
    });

    socket.connect();

    // TODO: This shouldn't be needed anymore. Remove it.
    socket.on(Constants.SOCKET_SECURITY_DATA, data => {
      window.securityData = JSON.parse(data).securityData;

      if (game && game instanceof Game) {
        game.resetToken(window.securityData.clientData.token);
      }
    });
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
