/**
 * @fileoverview Main JS client file.
 * @author Horton Cheng <horton0712@gmail.com>
 */
// NOTICE: THE CODE IN THIS FILE IS EXPERIMENTAL.
// We're seeing how well we do without jQuery.
/**
 * Get the type definitions
 * @typedef {import("socket.io-client")} SocketIOStatic
 */

import {
  changeViewportStats,
  createPlayDialog, submitPlayInfo
} from "./common/functions.js";
import Constants from "./Constants-client.js";
const pathname = window.location.pathname;
const appVersion = Constants.VERSION;
let dialog = null;
let socket = null;

if (pathname === "/") {
  window.addEventListener("resize", () => {
    changeViewportStats();
    if (socket && socket.connected) {
      dialog = createPlayDialog("#dialog-form-container", socket);
    }
  });
  window.addEventListener("load", async() => {
    const connect = io;

    // Get Socket.IO auth.
    let response = null;
    const passPhrase =
        (response = await fetch("/xhr?for=passPhrases", {
          method: "GET",
          headers: {
            "X-App-Version": appVersion,
            "X-Is-Trusted": "1",
            "X-Requested-With": "Client-JavaScript::Fetch-API"
          }
        })).status === 200 ?
          (await response.json()).passPhrase :
          new Error("Failed to fetch passPhrase!");
    if (passPhrase instanceof Error) {
      throw passPhrase;
    }
    response = await fetch(`/xhr?for=socketIOAuth&passPhrase=${passPhrase}`, {
      method: "GET",
      headers: {
        "X-App-Version": appVersion,
        "X-Is-Trusted": "1",
        "X-Requested-With": "Client-JavaScript::Fetch-API"
      }
    });
    if (response.status > 299 || response.status < 200) {
      throw new Error("Failed to fetch socketIOAuth!");
    }

    // Now connect to the root Socket.IO namespace.
    socket = connect();

    socket.on(Constants.SOCKET_ERROR, err => {
      console.error(new Error(err));
    });

    const data = (response = await fetch("/xhr?for=games_available", {
      method: "GET",
      headers: {
        "X-App-Version": appVersion,
        "X-Is-Trusted": "1",
        "X-Requested-With": "Client-JavaScript::Fetch-API"
      }
    })).status === 200 ?
      await response.json() :
      new Error("Failed to get available games!");
    if (data instanceof Error) {
      throw data;
    }

    const gameSelect = document.querySelector("#game-select");
    Object.getOwnPropertyNames(data).forEach((key, i) => {
      const game = data[key];
      const htmlToAdd = `
        <input type="radio" id="game-opt-${game.id}" 
        name="game" value="${game.id}">
        <label for="game-opt-${game.id}">
          Game ${i + 1}
          <img src="imgs/Game_map_previews/${game.map}.png">
        <label/>
        `;

      gameSelect.insertAdjacentHTML("beforeend", htmlToAdd);
    });

    // Display the version.
    const versionElem = document.querySelector("#version");
    versionElem.insertAdjacentHTML(
      "afterbegin",
      `<a href="/version">Version ${Constants.VERSION}</a>.
      Licensed under the <a href="/license">AGPL-3.0 license.</a>`
    );

    dialog = createPlayDialog("#dialog-form-container", socket);
    // Handle when the client opens the `Play` dialog.
    document.querySelector("#play").addEventListener("click", e => {
      const errorSpan = document.querySelector("#error-span");

      e.preventDefault();
      dialog.dialog("open");

      errorSpan.classList.remove("error");
      while (errorSpan.hasChildNodes()) {
        const child = errorSpan.firstChild;
        if (child.nodeType === 3) {
          errorSpan.removeChild(child);
        }
      }

      $("#game-select")
        .controlgroup();
      $("#teams")
        .selectmenu({
          disabled: false
        });
      document.querySelector("#name-input").focus();
    });

    // Make sure the play "form" does not submit.
    document.querySelector("#dialog-form").addEventListener("submit", e => {
      e.preventDefault();
      submitPlayInfo(socket).call(dialog);
    });
  });

  setInterval(async() => {
    // Get Socket.IO auth.
    let response2 = null;
    const passPhrase =
        (response2 = await fetch("/xhr?for=passPhrases", {
          method: "GET",
          headers: {
            "X-App-Version": appVersion,
            "X-Is-Trusted": "1",
            "X-Requested-With": "Client-JavaScript::Fetch-API"
          }
        })).status === 200 ?
          (await response2.json()).passPhrase :
          new Error("Failed to fetch passPhrase!");
    if (passPhrase instanceof Error) {
      throw passPhrase;
    }
    response2 = await fetch(`/xhr?for=socketIOAuth&passPhrase=${passPhrase}`, {
      method: "GET",
      headers: {
        "X-App-Version": appVersion,
        "X-Is-Trusted": "1",
        "X-Requested-With": "Client-JavaScript::Fetch-API"
      }
    });
    if (response2.status > 299 || response2.status < 200) {
      throw new Error("Failed to fetch socketIOAuth!");
    }
  }, 1000 * 60 * 60 * 2 - 1000 * 60 * 20);
} else if (pathname === "/license") {
  window.addEventListener("load", async() => {
    let response = null;
    const body =
      (response = await fetch("/xhr?for=license_text.html", {
        method: "GET",
        headers: {
          "X-App-Version": appVersion,
          "X-Is-Trusted": "1",
          "X-Requested-With": "Client-JavaScript::Fetch-API"
        }
      })).status === 200 ?
        await response.text() :
        new Error("Failed to get license text!");

    if (body instanceof Error) {
      throw body;
    }
    while (document.body.hasChildNodes()) {
      document.body.removeChild(document.body.firstChild);
    }
    document.body.insertAdjacentHTML("afterbegin", body);
  });
}
