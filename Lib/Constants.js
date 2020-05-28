/**
 * @fileoverview Constants file to store all the js constants
 * @author Horton Cheng <horton0712@gmail.com>
 */

const { deepFreeze } = require("./Util");
const Vector = require("./Game/Physics/Vector");

const Constants = {
  //World max and min
  WORLD_MIN: -4500,
  WORLD_MAX: 4500,
  //Declaration arrays
  TROOPS: [
    "militia",
    "light_infantry",
    "line_infantry",
    "captain",
    "pikemen",
    "medic",
    "field_artillery",
    "siege_artillery",
    "howitzer",
    "mortar"
  ],
  PROJECTILES: [
    "musket_ball",
    "pistol_ball",
    "canister_shot",
    "solid_shot",
    "howitzer_shell",
    "mortar_shell"
  ],
  BUILDINGS: [
    "main_tent",
    "tent",
    "house",
    "farm",
    "woodcutter",
    "stone_quarry",
    "mill",
    "sawmill",
    "stonemason",
    "well",
    "barracks",
    "recruiting_office",
    "munitions_plant",
    "factory",
    "watchtower",
    "cannon_tower",
    "wall",
    "guard_post",
    "supply_depot",
    "main_base"
  ],
  //Bullet stuff
  BULLET_MAX_RANGE: {
    musket_ball: 90,
    pistol_ball: 75,
    field_artillery: 130,
    siege_artillery: 125,
    howitzer_shell: 95,
    mortar_shell: 100
  },
  BULLET_DAMAGE: {
    musket_ball: 150,
    pistol_ball: 100,
    field_artillery: 125,
    siege_artillery: 400,
    howitzer_shell: 250,
    mortar_shell: 160
  },
  BULLET_SPEED: {
    musket_ball: 12,
    pistol_ball: 10,
    field_artillery: 20,
    siege_artillery: 22,
    howitzer_shell: 21,
    mortar_shell: 19
  },
  BULLET_MASS: {
    musket_ball: 4.5,
    pistol_ball: 5,
    field_artillery: 60,
    siege_artillery: 240,
    howitzer_shell: 100,
    mortar_shell: 40
  },
  BULLET_HITBOX: {
    musket_ball: 3,
    pistol_ball: 4,
    field_artillery: 20,
    siege_artillery: 40,
    howitzer_shell: 25,
    mortar_shell: 18
  },
  //Splash damage stuff
  SPLASH_DAMAGE: {
    musket_ball: 0,
    pistol_ball: 0,
    field_artillery: 65,
    siege_artillery: 0,
    howitzer_shell: 180,
    mortar_shell: 90
  },
  SPLASH_DAMAGE_RADIUS: {
    musket_ball: 0,
    pistol_ball: 0,
    field_artillery: 23,
    siege_artillery: 0,
    howitzer_shell: 18,
    mortar_shell: 24
  },
  //Troop stuff
  TROOP_RANGE: {
    militia: 65,
    light_infantry: 85,
    line_infantry: 50,
    captain: 65,
    medic: 50,
    pikemen: 2,
    field_artillery: 120,
    siege_artillery: 105,
    howitzer: 90,
    mortar: 90
  },
  TROOP_MAX_HEALTH: {
    militia: 100,
    light_infantry: 150,
    line_infantry: 160,
    captain: 200,
    medic: 220,
    pikemen: 300,
    field_artillery: 120,
    siege_artillery: 180,
    howitzer: 200,
    mortar: 140
  },
  TROOP_SPEED: {
    militia: 2.9,
    light_infantry: 2,
    line_infantry: 1.5,
    captain: 1.51,
    medic: 1.85,
    field_artillery: 1.27,
    siege_artillery: 0.87,
    howitzer: 1,
    mortar: 0.21
  },
  TROOP_HITBOX_SIZE: {
    militia: 2,
    light_infantry: 2,
    line_infantry: 2,
    captain: 2,
    medic: 2,
    field_artillery: 4,
    siege_artillery: 4.7,
    howitzer: 4,
    mortar: 3.2
  },
  TROOP_MASS: {
    militia: 200,
    light_infantry: 240,
    line_infantry: 300,
    captain: 270,
    medic: 310,
    field_artillery: 400,
    siege_artillery: 540,
    howitzer: 420,
    mortar: 120
  },
  TROOP_BUILD_TIME: {
    militia: 3,
    light_infantry: 15,
    line_infantry: 15,
    captain: 18,
    medic: 20,
    field_artillery: 30,
    siege_artillery: 36,
    howitzer: 40,
    mortar: 32
  },
  TROOP_COST: {
    militia: {
      wood: 0,
      stone: 0,
      food: 2,
      gold: 30
    },
    light_infantry: {
      wood: 3,
      stone: 0,
      food: 3,
      gold: 50
    },
    line_infantry: {
      wood: 5,
      stone: 1,
      food: 3,
      gold: 110
    },
    captain: {
      wood: 5,
      stone: 2,
      food: 4,
      gold: 130
    },
    medic: {
      wood: 5,
      stone: 2,
      food: 4,
      gold: 120
    },
    field_artillery: {
      wood: 20,
      stone: 10,
      food: 5,
      gold: 360
    },
    siege_artillery: {
      wood: 30,
      stone: 20,
      food: 8,
      gold: 460
    },
    howitzer: {
      wood: 32,
      stone: 26,
      food: 6,
      gold: 500
    },
    mortar: {
      wood: 40,
      stone: 10,
      food: 6,
      gold: 300
    }
  },
  TROOP_RESOURCE_CONSUMPTION: {
    militia: {
      wood: 0,
      stone: 0,
      food: 2,
      gold: 5,
      ammo: 0
    },
    light_infantry: {
      wood: 0,
      stone: 0,
      food: 3,
      gold: 20,
      ammo: 0
    },
    line_infantry: {
      wood: 0,
      stone: 0,
      food: 3,
      gold: 30,
      ammo: 0
    },
    captain: {
      wood: 0,
      stone: 0,
      food: 4,
      gold: 50,
      ammo: 0
    },
    medic: {
      wood: 0,
      stone: 0,
      food: 4,
      gold: 65,
      ammo: 0
    },
    field_artillery: {
      wood: 0,
      stone: 2,
      food: 6,
      gold: 80,
      ammo: 0
    },
    siege_artillery: {
      wood: 0,
      stone: 5,
      food: 8,
      gold: 90,
      ammo: 0
    },
    howitzer: {
      wood: 0,
      stone: 6,
      food: 10,
      gold: 100,
      ammo: 0
    },
    mortar: {
      wood: 0,
      stone: 3,
      food: 5,
      gold: 45,
      ammo: 0
    }
  },
  //Building stuff
  BUILDING_RANGE: {
    cannon_tower: 95
  },
  BUILDING_MAX_HEALTH: {
    main_tent: 2500,
    tent: 300,
    house: 950,
    farm: 150,
    woodcutter: 900,
    stone_quarry: 900,
    mill: 1200,
    sawmill: 1200,
    stonemason: 1200,
    well: 200,
    barracks: 1150,
    recruiting_office: 1100,
    munitions_plant: 1350,
    factory: 1500,
    watchtower: 1000,
    cannon_tower: 2100,
    tower: 2100,
    wall: 2000,
    guard_post: 1100,
    supply_depot: 3000,
    main_base: 10000
  },
  BUILDING_HITBOX_SIZE: {
    main_tent: 300,
    tent: 100,
    house: 200,
    farm: 900,
    woodcutter: 170,
    stone_quarry: 200,
    mill: 450,
    sawmill: 450,
    stonemason: 450,
    well: 70,
    barracks: 1000,
    recruiting_office: 450,
    munitions_plant: 1350,
    factory: 1600,
    watchtower: 95,
    cannon_tower: 125,
    tower: 130,
    wall: 10,
    guard_post: 500,
    supply_depot: 1100,
    main_base: 300
  },
  BUILDINGS_SPAWNED_TROOP: {
    barracks: [
      "light_infantry",
      "line_infantry",
      "captain",
      "pikemen",
      "medic"
    ],
    recruiting_office: [
      "militia"
    ],
    factory: [
      "field_artillery",
      "siege_artillery",
      "howitzer",
      "mortar"
    ]
  },
  BUILDING_BUILD_TIME: {
    main_tent: 0,
    tent: 10,
    house: 30,
    farm: 12,
    woodcutter: 15,
    stone_quarry: 20,
    mill: 35,
    sawmill: 35,
    stonemason: 35,
    well: 18,
    barracks: 50,
    recruiting_office: 30,
    munitions_plant: 60,
    factory: 90,
    watchtower: 15,
    cannon_tower: 32,
    tower: 22,
    wall: 24,
    guard_post: 26,
    supply_depot: 40,
    main_base: 0
  },
  BUILDING_COST: {
    main_tent: {
      wood: 20,
      stone: 2,
      gold: 0
    },
    tent: {
      wood: 12,
      stone: 0,
      gold: 2
    },
    house: {
      wood: 30,
      stone: 5,
      gold: 0
    },
    farm: {
      wood: 5,
      stone: 2,
      gold: 0
    },
    woodcutter: {
      wood: 26,
      stone: 10,
      gold: 0
    },
    stone_quarry: {
      wood: 20,
      stone: 0,
      gold: 0
    },
    mill: {
      wood: 50,
      stone: 20,
      gold: 12
    },
    sawmill: {
      wood: 40,
      stone: 12,
      gold: 5
    },
    stonemason: {
      wood: 30,
      stone: 20,
      gold: 5
    },
    well: {
      wood: 6,
      stone: 30,
      gold: 0
    },
    barracks: {
      wood: 70,
      stone: 120,
      gold: 40
    },
    recruiting_office: {
      wood: 50,
      stone: 12,
      gold: 20
    },
    munitions_plant: {
      wood: 65,
      stone: 40,
      gold: 25
    },
    factory: {
      wood: 55,
      stone: 260,
      gold: 40
    },
    watchtower: {
      wood: 15,
      stone: 2,
      gold: 0
    },
    cannon_tower: {
      wood: 40,
      stone: 60,
      gold: 15
    },
    tower: {
      wood: 30,
      stone: 15,
      gold: 0
    },
    wall: {
      wood: 30,
      stone: 0,
      gold: 0
    },
    guard_post: {
      wood: 45,
      stone: 15,
      food: 30,
      gold: 30
    },
    supply_depot: {
      wood: 36,
      stone: 16,
      gold: 20
    },
    main_base: {
      wood: 0,
      stone: 0,
      gold: 0
    }
  },
  BUILDING_RESOURCE_GEN: {
    main_tent: {
      wood: 10,
      stone: 5,
      food: 10,
      gold: 10,
      ammo: 6
    },
    house: {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 12,
      ammo: 0
    },
    farm: {
      wood: 0,
      stone: 0,
      food: 12,
      gold: 0,
      ammo: 0
    },
    woodcutter: {
      wood: 18,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 0
    },
    stone_quarry: {
      wood: 0,
      stone: 10,
      food: 0,
      gold: 0,
      ammo: 0
    },
    munitions_plant: {
      wood: 0,
      stone: 0,
      food: 0,
      gold: 0,
      ammo: 12
    }
  },
  BUILDING_RESOURCE_BONUS: {
    mill: {
      woodIncrease: 0,
      stoneIncrease: 0,
      foodIncrease: 1.5,
      goldIncrease: 0,
      ammoIncrease: 0
    },
    sawmill: {
      woodIncrease: 1.5,
      stoneIncrease: 0,
      foodIncrease: 0,
      goldIncrease: 0,
      ammoIncrease: 0
    },
    stonemason: {
      woodIncrease: 0,
      stoneIncrease: 1.5,
      foodIncrease: 0,
      goldIncrease: 0,
      ammoIncrease: 0
    },
    well: {
      woodIncrease: 0,
      stoneIncrease: 0,
      foodIncrease: 0,
      goldIncrease: 1.5,
      ammoIncrease: 0
    }
  },
  BUILDING_RESOURCE_MIN: {
    cannon_tower: {
      wood: 2,
      stone: 0,
      food: 0,
      gold: 5,
      ammo: 1
    },
    house: {
      wood: 1,
      stone: 0,
      food: 2,
      gold: 0,
      ammo: 0
    },
    munitions_plant: {
      wood: 2,
      stone: 6,
      food: 0,
      gold: 10,
      ammo: 0
    },
    mill: {
      wood: 3,
      stone: 0,
      food: 0,
      gold: 7,
      ammo: 0
    },
    sawmill: {
      wood: 0,
      stone: 1,
      food: 0,
      gold: 8,
      ammo: 0
    },
    stonemason: {
      wood: 1,
      stone: 0,
      food: 0,
      gold: 8,
      ammo: 0
    }
  },
  BUILDING_MASS: {
    main_tent: 500,
    tent: 300,
    house: 1500,
    farm: 2000,
    woodcutter: 2250,
    stone_quarry: 2300,
    mill: 6000,
    sawmill: 4700,
    stonemason: 4500,
    well: 600,
    barracks: 5200,
    recruiting_office: 2000,
    munitions_plant: 5900,
    factory: 10000,
    watchtower: 950,
    cannon_tower: 1700,
    tower: 1600,
    wall: 1200,
    guard_post: 2100,
    supply_depot: 4500,
    main_base: 6000
  },
  //Weapons stuff
  MELEE_WEAPONS: {
    pikemen: "pike"
  },
  RANGED_WEAPONS: {
    militia: "new-england-style-fowler-musket",
    light_infantry: "baker-rifle",
    line_infantry: "brown-bess-musket",
    captain: "flintlock-pistol",
    medic: "flintlock-pistol",
    field_artillery: "6-pounder-gun",
    siege_artillery: "24-pounder-gun",
    howitzer: "10-inch-howitzer",
    mortar: "4-pounder-mortar",
    cannon_tower: "10-inch-howitzer"
  },
  //Attack cooldown
  ATTACK_COOLDOWN: {
    militia: 6.5,
    light_infantry: 5.7,
    line_infantry: 3.8,
    captain: 3.4,
    medic: 4.3,
    pikemen: 2,
    field_artillery: 9,
    siege_artillery: 10,
    howitzer: 10.75,
    mortar: 7.82,
    cannon_tower: 4.97
  },
  //Other troop things
  TROOP_HEAL_RATE: 8,
  TROOP_TURN_SPEED: 0.58,
  //Other building things
  BUILDING_REPAIR_RATE: 18,
  BUILDING_TURN_SPEED: 0.38,
  //Player stuff
  PLAYER_DEFAULT_SPEED: 0.4,
  //Game stuff
  MAX_PLAYERS: 60,
  MAX_GAMES: 6,
  GAME_UPDATE_SPEED: 1000 / 25,
  START_POSITIONS_TEAM_MAP_1: {
    British: new Vector(-3800, -3220),
    French: new Vector(-2200, -2800),
    Russian: new Vector(-1100, -1100),
    German: new Vector(3800, 3220),
    American: new Vector(0, 0),
    Italian: new Vector(2300, 1900)
  },
  TILE_SIZE: 100,
  MAP_1: "testing",

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
  SOCKET_PROCEED: "proceed",
  //Version
  VERSION: "0.7.2-ALPHA"
};

deepFreeze(Constants);

/**
 * Module exports
 */
module.exports = exports = Constants;
