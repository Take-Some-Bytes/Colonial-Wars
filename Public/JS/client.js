/**
 * @fileoverview Client init file. This should be one of the only files that
 * have `no-undef` in eslint disabled.
 * @author Horton Cheng <horton0712@gmail.com>
 */
/**
 * Get the type definitions
 * @typedef {import("jquery")} jQuery
 * @typedef {import("socket.io-client")} SocketIOStatic
 */

import {
  changeViewportStats, createPlayDialog,
  pollServer, submitPlayInfo
} from "./common/functions.js";
import Constants from "./Constants-client.js";
const pathname = window.location.pathname;
let dialog = null;
let socket = null;

if (pathname === "/") {
  $(window).on("resize", () => {
    changeViewportStats();
    if (socket && socket.connected) {
      dialog = createPlayDialog("#dialog-form-container", socket);
    }
  });
  $(async() => {
    const connect = io;
    // Get Socket.IO auth.
    try {
      // TODO: See if this could use the newer `fetch` API instead.
      const passPhrase = (await pollServer({
        url: "/xhr",
        headers: {},
        data: {
          "for": "passPhrases"
        }
      })).passPhrase;
      console.log(passPhrase);
      await pollServer({
        url: "/xhr",
        headers: {},
        data: {
          "for": "socketIOAuth",
          passPhrase: passPhrase
        }
      });
    } catch (err) {
      console.error(err);
    }
    // Now connect to the root Socket.IO namespace.
    socket = connect();

    socket.on(Constants.SOCKET_ERROR, err => {
      console.error(new Error(err));
    });

    const data =
      await pollServer({ url: "/xhr", data: { "for": "games_available" } });
    Object.getOwnPropertyNames(data).forEach((key, i) => {
      const game = data[key];
      const htmlToAdd =
        `<label for="game-opt-${game.id}">Game ${i + 1}
        <img src="imgs/Game_map_previews/${game.map}.png">
        <label/><input type="radio" id="game-opt-${game.id}"
        name="game" value="${game.id}">`;
      $("#game-select")
        .append(htmlToAdd);
    });

    // Display the version.
    $("#version").html(
      `<a href="/version">Version ${Constants.VERSION}</a>.
      Licensed under the <a href="/license">AGPL-3.0 license.</a>`
    );

    dialog = createPlayDialog("#dialog-form-container", socket);
    // Handle when the client opens the `Play` dialog.
    $("#play").on("click", () => {
      dialog.dialog("open");
      $("#error-span")
        .removeClass("error")
        .text("");
      $("#game-select")
        .controlgroup();
      $("#teams")
        .selectmenu({
          disabled: false
        });
      $("#name-input").trigger("focus");
    });

    // Make sure the play "form" does not submit.
    $("#dialog-form").on("submit", e => {
      e.preventDefault();
      submitPlayInfo(socket).call(dialog);
    });
  });

  setInterval(async() => {
    try {
      const passPhrase = (await pollServer({
        url: "/xhr",
        headers: {},
        data: {
          "for": "passPhrases"
        }
      })).passPhrase;
      console.log(passPhrase);
      await pollServer({
        url: "/xhr",
        headers: {},
        data: {
          "for": "socketIOAuth",
          passPhrase: passPhrase
        }
      });
    } catch (err) {
      console.error(err);
    }
  }, 1000 * 60 * 60 * 2 - 1000 * 60 * 20);
} else if (pathname === "/license") {
  $(async() => {
    document.body.innerHTML = await pollServer({
      url: "/xhr",
      headers: {},
      data: {
        "for": "license_text.html"
      }
    });
  });
}
