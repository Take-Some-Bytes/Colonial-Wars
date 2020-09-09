/**
 * @fileoverview Client constants file.
 * @author Horton Cheng <horton0712@gmail.com>
 */

import { deepSeal } from "./common/functions.js";

// IDEA: Maybe think about using a JSON file to store these constants?
const Constants = {
  // World max and min.
  WORLD_MIN: -4500,
  WORLD_MAX: 4500,
  // Version.
  VERSION: "0.4.1-DEV",
  // Drawing constants.
  DRAWING_TROOP_BASE_PATH: "/imgs/troops",
  DRAWING_BUILDING_BASE_PATH: "/imgs/buildings",
  DRAWING_OBSTACLE_BASE_PATH: "/imgs/obstacles",
  DRAWING_TILE_BASE_PATH: "/imgs/tiles",
  DRAWING_UI_BASE_PATH: "/imgs/UI",
  DRAWING_TILE_KEYS: [
    "grass_tile",
    "dirt_tile",
    "water_tile",
    "rocky_tile",
    "sand_tile"
  ],
  DRAWING_BUILDING_KEYS: [
    "main_base"
  ],
  DRAWING_UI_KEYS: [
    "all_buttons",
    "all_icons"
  ],
  DRAWING_UI_BACKGROUND_KEYS: [
    "button_background",
    "resource_stats_background"
  ],
  DRAWING_TILE_SIZE: 100,
  DRAWING_TEAM_COLUMNS: {
    British: 0,
    French: 1,
    Russian: 2,
    Prussian: 3,
    American: 4,
    Italian: 5
  },
  DRAWING_BUTTON_ROWS: {
    civil_button: 0,
    defense_button: 1,
    military_button: 2
  },
  DRAWING_ICON_POSITIONS: {
    wood: [2, 1],
    stone: [1, 1],
    food: [2, 0],
    coins: [1, 0],
    ammo: [0, 0],
    people: [0, 1]
  },
  // Viewport stats.
  VIEWPORT_STICKINESS: 0.004,
  VIEWPORT_WIDTH: (() => {
    if (window.innerWidth !== undefined) {
      const vw = window.innerWidth;
      return vw;
    }
    const vw = document.documentElement.clientWidth;
    return vw;
  })(),
  VIEWPORT_HEIGHT: (() => {
    if (window.innerHeight !== undefined) {
      const vh = window.innerHeight;
      return vh;
    }
    const vh = document.documentElement.clientHeight;
    return vh;
  })(),

  // Socket.IO communications.
  SOCKET_UPDATE: "update",
  SOCKET_NEW_PLAYER: "new-player",
  SOCKET_PLAYER_ACTION: "player-action",
  /* SOCKET_CHAT_CLIENT_SERVER: "chat-client-to-server",
  SOCKET_CHAT_SERVER_CLIENT: "chat-server-to-client",*/
  SOCKET_DISCONNECT: "disconnect",
  SOCKET_AVAILABLE_GAMES: "available-games",
  SOCKET_ERROR: "error",
  SOCKET_SECURITY_DATA: "security-data",
  SOCKET_PROCEED: "proceed",
  SOCKET_SCREEN_RESIZE: "screen-resize"
};

// Seal the constants so that no keys could be removed or added,
// but values could still be changed.
deepSeal(Constants);

export default Constants;
