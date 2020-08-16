/**
 * @fileoverview Client init file. This should be one of the only files that
 * have `no-undef` in eslint disabled
 * @author Horton Cheng <horton0712@gmail.com>
 */
/* eslint-disable no-undef */

import { Constants } from "./Constants-client.js";
import { init } from "./common/functions.js";
const pathname = window.location.pathname;
let dialog = null;

window.securityData = {};

if (pathname === "/") {
  $(document).ready(() => {
    // Socket.io stuff
    const socket = io();

    socket.on(Constants.SOCKET_SECURITY_DATA, data => {
      window.securityData = JSON.parse(data).securityData;
    });
    socket.on(Constants.SOCKET_ERROR, err => {
      console.error(JSON.stringify(JSON.parse(err)));
      $("#error-span")
        .addClass("error")
        .text(`${JSON.parse(err).otherData.msg}`);
    });

    // XHR
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

    // Version display
    $("#version").html(
      `<a href="/version">Version ${Constants.VERSION}</a>.
      Licensed under the <a href="/license">AGPL-3.0 license.</a>`
    );

    // Dialog
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
                securityData: {
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
    const params = {
      "for": "license_text.html"
    };
    $.get("/xhr", params, data => {
      const parsedData = JSON.parse(data);
      document.body.innerHTML = parsedData.html;
    });
  });
}
