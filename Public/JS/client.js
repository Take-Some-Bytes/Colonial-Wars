/**
 * @fileoverview Client init file. This should be one of the only files that
 * have `no-undef` in eslint disabled.
 * @author Horton Cheng <horton0712@gmail.com>
 */
// TODO: Remove the `eslint-disable no-undef` statement. We won't be
// needing it now that we enabled jQuery globals in eslint.
// TODO: Get type definitions for Socket.IO client.
/* eslint-disable no-undef */

import { init, pollServer } from "./common/functions.js";
import Constants from "./Constants-client.js";
const pathname = window.location.pathname;
let dialog = null;

window.securityData = {};

if (pathname === "/") {
  $(document).ready(async() => {
    // Get Socket.IO auth.
    try {
      const passPhrase = JSON.parse(await pollServer({
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
    const socket = io();

    socket.on(Constants.SOCKET_SECURITY_DATA, data => {
      window.securityData = JSON.parse(data).securityData;
    });
    socket.on(Constants.SOCKET_ERROR, err => {
      // TODO: Find another way to report errors. With the way this
      // is currently set up, the error message would be cleared once the
      // `Play` dialog is opened.
      $("#error-span")
        .addClass("error")
        .text(`${err}`);
    });

    // TODO: Make this use `pollServer` instead.
    // Make a request to the server to get the available games.
    const params = {
      "for": "games_available"
    };
    $.get("/xhr", params, data2 => {
      const parsedData = JSON.parse(data2);
      const dataKeys = Object.getOwnPropertyNames(parsedData);
      const arrayLength = dataKeys.length;
      for (let i = 0; i < arrayLength; i++) {
        const game = parsedData[dataKeys[i]];
        const htmlToAdd =
            `<label for="game-opt-${game.id}">Game ${i + 1}
            <img src="imgs/Game_map_previews/${game.map}.png">
            <label/><input type="radio" id="game-opt-${game.id}"
            name="game" value="${game.id}">`;
        $("#game-select")
          .append(htmlToAdd);
      }
    });

    // Display the version.
    $("#version").html(
      `<a href="/version">Version ${Constants.VERSION}</a>.
      Licensed under the <a href="/license">AGPL-3.0 license.</a>`
    );

    // Create the `Play` dialog.
    // TODO: Move the code to create the `Play` dialog to another function.
    dialog = $("#dialog-form-container")
      .dialog({
        autoOpen: false,
        modal: true,
        width: Math.round(Constants.VIEWPORT_WIDTH / 3),
        height: Math.round(Constants.VIEWPORT_HEIGHT * 10 / 1.5 / 10),
        buttons: {
          Play: () => {
            init((err, data) => {
              if (err) {
                $("#error-span")
                  .addClass("error")
                  .text(`${err}`);
                return;
              }
              socket.emit(Constants.SOCKET_NEW_PLAYER, JSON.stringify({
                playerData: data,
                otherData: {}
              }), error => {
                if (error) {
                  $("#error-span")
                    .addClass("error")
                    .text(`${error}`);
                  return;
                }
                // TODO: Remove this call to set the client's previous
                // socket ID in localStorage.
                localStorage.setItem(
                  "prevSocketID",
                  socket.id
                );
                dialog.dialog("close");
                window.location.href =
                  `${window.location.protocol}//` +
                  `${window.location.hostname}` +
                  `:${window.location.port}/play`;
              });
            });
          },
          Cancel: () => {
            dialog.dialog("close");
          }
        }
      });
    // Handle when the client opens the `Play` dialog.
    $("#play").click(() => {
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
      $("#name-input").focus();
    });

    // Make sure the play "form" does not submit.
    $("#dialog-form").submit(e => {
      e.preventDefault();
      init((err, data) => {
        if (err) {
          $("#error-span")
            .addClass("error")
            .text(`${err}`);
          return;
        }
        socket.emit(Constants.SOCKET_NEW_PLAYER, JSON.stringify({
          securityData: {
            // TODO: Remove the need for the old security system.
            clientData: {
              id: window.securityData.clientData.id,
              token: window.securityData.clientData.token
            }
          },
          playerData: data,
          otherData: {}
        }), error => {
          if (error) {
            $("#error-span")
              .addClass("error")
              .text(`${error}`);
            return;
          }
          localStorage.setItem(
            "prevSocketID",
            socket.id
          );
          dialog.dialog("close");
          window.location.href =
            `${window.location.protocol}//
            ${window.location.hostname}/play`;
        });
      });
    });
  });
} else if (pathname === "/license") {
  $(document).ready(() => {
    // TODO: Also make this use `pollServer`.
    const params = {
      "for": "license_text.html"
    };
    $.get("/xhr", params, data => {
      const parsedData = JSON.parse(data);
      document.body.innerHTML = parsedData.html;
    });
  });
}
