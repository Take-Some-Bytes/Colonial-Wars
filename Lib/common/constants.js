/**
 * @fileoverview Constants file to store all the js constants
 * @author Horton Cheng <horton0712@gmail.com>
 */

const { deepFreeze } = require("./util");
const Vector = require("../Game/Physics/Vector");

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
  BULLET_STATS: {
    musket_ball: {
      name: "musket_ball",
      max_range: 90,
      damage: 150,
      speed: 12,
      mass: 4.5,
      hitbox:3
    },
    pistol_ball: {
      name: "pistol_ball",
      max_range: 75,
      damage: 100,
      speed: 10,
      mass: 5,
      hitbox: 5
    },
    canister_shot: {
      name: "canister_shot",
      max_range: 130,
      damage: 125,
      speed: 20,
      mass: 60,
      hitbox: 20
    },
    solid_shot: {
      name: "solid_shot",
      max_range: 125,
      damage: 400,
      speed: 22,
      mass: 240,
      hitbox: 40
    },
    howitzer_shell: {
      name: "howitzer_shell",
      max_range: 95,
      damage: 250,
      speed: 21,
      mass: 100,
      hitbox: 25
    },
    mortar_shell: {
      name: "mortar_shell",
      max_range: 100,
      damage: 160,
      speed: 19,
      mass: 40,
      hitbox: 18
    }
  },
  //Splash damage stuff
  SPLASH_STATS: {
    musket_ball: {
      does_splash: false,
      damage: 0,
      radius: 0
    },
    pistol_ball: {
      does_splash: false,
      damage: 0,
      radius: 0
    },
    canister_shot: {
      does_splash: true,
      damage: 65,
      radius: 23
    },
    solid_shot: {
      does_splash: false,
      damage: 0,
      radius: 0
    },
    howitzer_shell: {
      does_splash: true,
      damage: 180,
      radius: 18
    },
    mortar_shell: {
      does_splash: true,
      damage: 90,
      radius: 24
    }
  },
  //Troop stuff
  TROOP_STATS: {
    militia: {
      range: 65,
      max_health: 100,
      speed: 2.9,
      hitbox_size: 2,
      mass: 200,
      build_time: 10,
      cost: {
        wood: 0,
        stone: 0,
        food: 2,
        coins: 30,
        people: 1
      },
      resource_min: {
        wood: 0,
        stone: 0,
        food: 1,
        coins: 2,
        ammo: 0
      }
    },
    light_infantry: {
      range: 85,
      max_health: 150,
      speed: 2,
      hitbox_size: 2,
      mass: 240,
      build_time: 20,
      cost: {
        wood: 3,
        stone: 0,
        food: 3,
        coins: 50,
        people: 1
      },
      resource_min: {
        wood: 0,
        stone: 0,
        food: 2,
        coins: 5,
        ammo: 0
      }
    },
    line_infantry: {
      range: 50,
      max_health: 160,
      speed: 1.5,
      hitbox_size: 2,
      mass: 300,
      build_time: 20,
      cost: {
        wood: 5,
        stone: 1,
        food: 3,
        coins: 95,
        people: 2
      },
      resource_min: {
        wood: 0,
        stone: 0,
        food: 3,
        coins: 8,
        ammo: 0
      }
    },
    captain: {
      range: 65,
      max_health: 200,
      speed: 1.51,
      hitbox_size: 2,
      mass: 270,
      build_time: 32,
      cost: {
        wood: 5,
        stone: 1,
        food: 5,
        coins: 120,
        people: 2
      },
      resource_min: {
        wood: 0,
        stone: 0,
        food: 4,
        coins: 12,
        ammo: 0
      }
    },
    medic: {
      range: 50,
      max_health: 220,
      speed: 1.85,
      hitbox_size: 2,
      mass: 290,
      build_time: 40,
      cost: {
        wood: 5,
        stone: 2,
        food: 4,
        coins: 145,
        people: 2
      },
      resource_min: {
        wood: 2,
        stone: 0,
        food: 4,
        coins: 10,
        ammo: 0
      }
    },
    pikemen: {
      range: 2,
      max_health: 300,
      speed: 2,
      hitbox_size: 2,
      mass: 240,
      build_time: 20,
      cost: {
        wood: 5,
        stone: 1,
        food: 2,
        coins: 45,
        people: 1
      },
      resource_min: {
        wood: 0,
        stone: 0,
        food: 2,
        coins: 4,
        ammo: 0
      }
    },
    field_artillery: {
      range: 120,
      max_health: 120,
      speed: 1.27,
      hitbox_size: 4,
      mass: 400,
      build_time: 50,
      cost: {
        wood: 20,
        stone: 10,
        food: 6,
        coins: 225,
        people: 4
      },
      resource_min: {
        wood: 0,
        stone: 3,
        food: 4,
        coins: 16,
        ammo: 0
      }
    },
    siege_artillery: {
      range: 105,
      max_health: 180,
      speed: 0.87,
      hitbox_size: 4.7,
      mass: 540,
      build_time: 65,
      cost: {
        wood: 30,
        stone: 15,
        food: 6,
        coins: 350,
        people: 5
      },
      resource_min: {
        wood: 0,
        stone: 3,
        food: 6,
        coins: 25,
        ammo: 0
      }
    },
    howitzer: {
      range: 90,
      max_health: 200,
      speed: 1,
      hitbox_size: 4,
      mass: 420,
      build_time: 70,
      cost: {
        wood: 40,
        stone: 20,
        food: 6,
        coins: 400,
        people: 5
      },
      resource_min: {
        wood: 0,
        stone: 6,
        food: 10,
        coins: 20,
        ammo: 0
      }
    },
    mortar: {
      range: 200,
      max_health: 140,
      speed: 0.21,
      hitbox_size: 3.2,
      mass: 120,
      build_time: 45,
      cost: {
        wood: 20,
        stone: 5,
        food: 3,
        coins: 165,
        people: 2
      },
      resource_min: {
        wood: 0,
        stone: 1,
        food: 3,
        coins: 14,
        ammo: 0
      }
    }
  },
  //Building stuff
  BUILDING_STATS: {
    main_base: {
      max_health: 10000,
      hitbox_size: 300,
      mass: 6000,
      spawned_troops: [],
      build_time: 0,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 0,
      cost: {},
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    },
    main_tent: {
      max_health: 2500,
      hitbox_size: 300,
      mass: 500,
      spawned_troops: [],
      build_time: 0,
      can_attack: false,
      range: 0,
      populationIncrease: 20,
      populationCost: 0,
      cost: {},
      resource_gen: {
        wood: 10,
        stone: 5,
        food: 10,
        coins: 10,
        ammo: 6
      },
      resource_min: {},
      resource_bonus: {}
    },
    house: {
      max_health: 950,
      hitbox_size: 150,
      mass: 1500,
      spawned_troops: [],
      build_time: 36,
      can_attack: false,
      range: 0,
      populationIncrease: 15,
      populationCost: 0,
      cost: {
        wood: 30,
        stone: 8,
        coins: 5
      },
      resource_gen: {
        wood: 0,
        stone: 0,
        food: 0,
        coins: 25,
        ammo: 0
      },
      resource_min: {
        wood: 1,
        stone: 0,
        food: 1,
        coins: 0,
        ammo: 0
      },
      resource_bonus: {}
    },
    farm: {
      max_health: 150,
      hitbox_size: 350,
      mass: 2000,
      spawned_troops: [],
      build_time: 18,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 3,
      cost: {
        wood: 15,
        stone: 5,
        coins: 2
      },
      resource_gen: {
        wood: 0,
        stone: 0,
        food: 20,
        coins: 0,
        ammo: 0
      },
      resource_min: {
        wood: 1,
        stone: 1,
        food: 0,
        coins: 1,
        ammo: 0
      },
      resource_bonus: {}
    },
    woodcutter: {
      max_health: 900,
      hitbox_size: 180,
      mass: 2250,
      spawned_troops: [],
      build_time: 28,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 2,
      cost: {
        wood: 26,
        stone: 10,
        coins: 2
      },
      resource_gen: {
        wood: 16,
        stone: 0,
        food: 0,
        coins: 0,
        ammo: 0
      },
      resource_min: {
        wood: 0,
        stone: 1,
        food: 0,
        coins: 1,
        ammo: 0
      },
      resource_bonus: {}
    },
    stone_quarry: {
      max_health: 900,
      hitbox_size: 200,
      mass: 2250,
      spawned_troops: [],
      build_time: 32,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 2,
      cost: {
        wood: 20,
        stone: 2,
        coins: 5
      },
      resource_gen: {
        wood: 0,
        stone: 16,
        food: 0,
        coins: 0,
        ammo: 0
      },
      resource_min: {
        wood: 1,
        stone: 0,
        food: 0,
        coins: 1,
        ammo: 0
      },
      resource_bonus: {}
    },
    munitions_plant: {
      max_health: 1350,
      hitbox_size: 250,
      mass: 2600,
      spawned_troops: [],
      build_time: 60,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 2,
      cost: {
        wood: 65,
        stone: 40,
        coins: 25
      },
      resource_gen: {
        wood: 0,
        stone: 0,
        food: 0,
        coins: 0,
        ammo: 20
      },
      resource_min: {
        wood: 1,
        stone: 4,
        food: 0,
        coins: 3,
        ammo: 0
      },
      resource_bonus: {}
    },
    mill: {
      max_health: 1200,
      hitbox_size: 300,
      mass: 2250,
      spawned_troops: [],
      build_time: 40,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 2,
      cost: {
        wood: 100,
        stone: 40,
        coins: 20
      },
      resource_gen: {},
      resource_min: {
        wood: 1,
        stone: 1,
        food: 0,
        coins: 2,
        ammo: 0
      },
      resource_bonus: {
        woodIncrease: 0,
        stoneIncrease: 0,
        foodIncrease: 1.5,
        coinsIncrease: 0,
        ammoIncrease: 0
      }
    },
    sawmill: {
      max_health: 1200,
      hitbox_size: 300,
      mass: 2250,
      spawned_troops: [],
      build_time: 40,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 2,
      cost: {
        wood: 95,
        stone: 25,
        coins: 12
      },
      resource_gen: {},
      resource_min: {
        wood: 0,
        stone: 1,
        food: 0,
        coins: 2,
        ammo: 0
      },
      resource_bonus: {
        woodIncrease: 1.5,
        stoneIncrease: 0,
        foodIncrease: 0,
        coinsIncrease: 0,
        ammoIncrease: 0
      }
    },
    stonemason: {
      max_health: 1200,
      hitbox_size: 300,
      mass: 2250,
      spawned_troops: [],
      build_time: 40,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 2,
      cost: {
        wood: 40,
        stone: 60,
        coins: 16
      },
      resource_gen: {},
      resource_min: {
        wood: 0,
        stone: 1,
        food: 0,
        coins: 3,
        ammo: 0
      },
      resource_bonus: {
        woodIncrease: 0,
        stoneIncrease: 1.5,
        foodIncrease: 0,
        coinsIncrease: 0,
        ammoIncrease: 0
      }
    },
    well: {
      max_health: 200,
      hitbox_size: 80,
      mass: 600,
      spawned_troops: [],
      build_time: 24,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 0,
      cost: {
        wood: 15,
        stone: 30,
        coins: 10
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {
        woodIncrease: 0,
        stoneIncrease: 0,
        foodIncrease: 0,
        coinsIncrease: 1.5,
        ammoIncrease: 0
      }
    },
    barracks: {
      max_health: 1150,
      hitbox_size: 350,
      mass: 2800,
      spawned_troops: [
        "light_infantry",
        "line_infantry",
        "captain",
        "pikemen",
        "medic"
      ],
      build_time: 60,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 1,
      cost: {
        wood: 70,
        stone: 80,
        coins: 40
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    },
    recruiting_office: {
      max_health: 1000,
      hitbox_size: 200,
      mass: 500,
      spawned_troops: [
        "militia"
      ],
      build_time: 34,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 1,
      cost: {
        wood: 30,
        stone: 15,
        coins: 20
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    },
    factory: {
      max_health: 1500,
      hitbox_size: 400,
      mass: 3200,
      spawned_troops: [
        "field_artillery",
        "siege_artillery",
        "howitzer",
        "mortar"
      ],
      build_time: 90,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 4,
      cost: {
        wood: 65,
        stone: 110,
        coins: 60
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    },
    watchtower: {
      max_health: 1000,
      hitbox_size: 85,
      mass: 750,
      spawned_troops: [],
      build_time: 28,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 1,
      cost: {
        wood: 15,
        stone: 2,
        coins: 0
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    },
    cannon_tower: {
      max_health: 2100,
      hitbox_size: 100,
      mass: 1200,
      spawned_troops: [],
      build_time: 46,
      can_attack: true,
      range: 95,
      populationIncrease: 0,
      populationCost: 1,
      cost: {
        wood: 50,
        stone: 80,
        coins: 30
      },
      resource_gen: {},
      resource_min: {
        wood: 2,
        stone: 1,
        food: 0,
        coins: 3,
        ammo: 1
      },
      resource_bonus: {}
    },
    tower: {
      max_health: 2100,
      hitbox_size: 100,
      mass: 900,
      spawned_troops: [],
      build_time: 46,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 0,
      cost: {
        wood: 20,
        stone: 80,
        coins: 20
      },
      resource_gen: {},
      resource_min: {
        wood: 2,
        stone: 1,
        food: 0,
        coins: 3,
        ammo: 1
      },
      resource_bonus: {}
    },
    wall: {
      max_health: 2000,
      hitbox_size: 30,
      mass: 1000,
      spawned_troops: [],
      build_time: 38,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 0,
      cost: {
        wood: 20,
        stone: 30,
        coins: 8
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    },
    supply_depot: {
      max_health: 3000,
      hitbox_size: 400,
      mass: 3000,
      spawned_troops: [],
      build_time: 56,
      can_attack: false,
      range: 0,
      populationIncrease: 0,
      populationCost: 0,
      cost: {
        wood: 40,
        stone: 90,
        coins: 40
      },
      resource_gen: {},
      resource_min: {},
      resource_bonus: {}
    }
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
    Prussian: new Vector(3800, 3220),
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
  SOCKET_ERROR: "error",
  SOCKET_SECURITY_DATA: "security-data",
  SOCKET_PROCEED: "proceed",
  //Version
  VERSION: "0.8.4-ALPHA",
  //UI things
  BUTTON_COOLDOWN: 500,
  BUTTON_KEYS: [
    "civil_button",
    "defense_button",
    "military_button"
  ],
  ICON_KEYS: [
    "wood",
    "stone",
    "food",
    "coins",
    "ammo",
    "people"
  ],
  ICON_INFO_TEXT: {
    wood: "The amount of wood you have.",
    stone: "The amount of stone you have.",
    food: "The amount of food you have to feed your people.",
    coins: "The amount of coins you have",
    ammo: "The amount of ammo your troops can use",
    people: "Your people. The left number is about how many " +
      "people you you are using, the right number is " +
      "about how many people you have in total"
  },
  //Logging things
  WINSTON_LOGGING_LEVELS: {
    levels: {
      fatal: 0,
      error: 1,
      warning: 2,
      notice: 3,
      info: 4,
      debug: 5,
      trace: 6
    },
    colors: {
      fatal: "red",
      error: "red",
      warning: "yellow",
      notice: "blue",
      info: "green",
      debug: "white",
      trace: "grey"
    }
  },
  WINSTON_LOGGING_TIMESTAMP_FORMAT: "ddd[,] DD MMM YYYY HH:mm:ss Z",
  MORGAN_LOGGING_FORMAT: ":date[web]: Request received at :reqPath, " +
    "with method :method. Request full url: :url",
  //Other stuff
  SEC_ALLOWED_METHODS: [
    "GET", "POST", "HEAD"
  ],
  REQ_URL_MAX_LEN: 150
};

deepFreeze(Constants);

/**
 * Module exports
 */
module.exports = exports = Constants;
