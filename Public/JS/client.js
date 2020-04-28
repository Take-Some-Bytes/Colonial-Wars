/**
 * @fileoverview Client init file. This should be one of the only files that
 * have `no-def` in esling disabled
 * @author Horton Cheng <horton0712@gmail.com>
 */
/* eslint-disable no-undef */

import { Constants } from "./Constants-client.js";
import { Game } from "./Game/Game.js";
const io = require("socket.io-client");
const url = window.location.pathname;
const socket = io();

if(url === "/play") {
  $(document).ready(() => {
    $("#version").html(
      `Version ${Constants.VERSION}. Licensed under the GPL-3.0 license.` +
      "<a href=\"/version\">View all versions</a>"
    );
  });
} else if(url === "/") {
  $(document).ready(() => {
    $("#version").html(
      `Version ${Constants.VERSION}. Licensed under the GPL-3.0 license.` +
      "<a href=\"/version\">View all versions</a>"
    );
  });
}
