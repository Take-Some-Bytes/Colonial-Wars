/**
 * @fileoverview Client constants file.
 * @author Horton Cheng <horton0712@gmail.com>
 */

export const Constants = {
  //World max and min
  WORLD_MIN: -3000,
  WORLD_MAX: 3000,
  //Version
  VERSION: "0.7.1-ALPHA",
  //Drawing
  DRAWING_TROOP_BASE_PATH: "/imgs/troops",
  DRAWING_BUILDING_BASE_PATH: "/imgs/troops",
  DRAWING_OBSTACLE_BASE_PATH: "/imgs/obstacles",
  DRAWING_TILE_BASE_PATH: "/imgs/tiles",
  DRAWING_TILE_KEYS: [
    "test_tile"
  ],
  DRAWING_TILE_SIZE: 100,
  //Viewport
  VIEWPORT_STICKINESS: 0.004,
  //Viewport
  VIEWPORT_WIDTH: (function() {
    if(window.innerWidth !== undefined) {
      const vw = window.innerWidth;
      return vw;
    }
    const vw = document.documentElement.clientWidth;
    return vw;
  })(),
  VIEWPORT_HEIGHT: (function() {
    if(window.innerHeight !== undefined) {
      const vh = window.innerHeight;
      return vh;
    }
    const vh = document.documentElement.clientHeight;
    return vh;
  })(),

  //Communications
  SOCKET_UPDATE: "update",
  SOCKET_NEW_PLAYER: "new-player",
  SOCKET_PLAYER_ACTION: "player-action",
  /*SOCKET_CHAT_CLIENT_SERVER: "chat-client-to-server",
  SOCKET_CHAT_SERVER_CLIENT: "chat-server-to-client",*/
  SOCKET_DISCONNECT: "disconnect",
  SOCKET_AVAILABLE_GAMES: "available-games",
  SOCKET_ERROR: "err",
  SOCKET_SECURITY_DATA: "security-data",
  SOCKET_PROCEED: "proceed"
};
