export const BORDER_THICKNESS = 8;
export const FIXED_DT = 1 / 120;
export const POSITION_ROUNDING = 1_000_000;
export const MAX_SPEED = 760;
export const PIXEL_SIZE = 3;

export const RESTITUTION = 0.98;
export const BASE_DAMAGE = 1.2;
export const DAMAGE_SCALE = 0.1;
export const MIN_DAMAGE = 0.35;
export const MAX_DAMAGE = 24;
export const IMPACT_DAMAGE_THRESHOLD = 18;
export const SPEED_DAMAGE_SCALE = 1.2;
export const SPEED_DAMAGE_BONUS_CAP = 1.25;
export const COLLISION_DAMAGE_COOLDOWN = 0.09;
export const COLLISION_DAMAGE_CACHE_TTL = 2.2;
export const MAX_EFFECTS = 1100;
export const MAX_TOTAL_BALLS = 420;

export const FAST_FORWARD_STEPS = 4;
export const NORMAL_STEPS = 1;
export const MODE_KEYS = ["classic", "blitz", "tournament"];
export const ARENA_MODE_KEYS = ["standard", "crossfire", "sanctum", "gauntlet"];
export const MODIFIER_KEYS = ["none", "iron_wall", "glass_cannon", "turbo"];

export const UPGRADE_DEFS = {
  hp: {
    label: "HP",
    maxLevel: 8,
    baseCost: 120,
    costScale: 1.35,
    hpPerLevel: 0.08
  },
  speed: {
    label: "Speed",
    maxLevel: 8,
    baseCost: 115,
    costScale: 1.32,
    speedPerLevel: 0.06
  },
  mastery: {
    label: "Mastery",
    maxLevel: 8,
    baseCost: 140,
    costScale: 1.4,
    outgoingPerLevel: 0.05,
    incomingReductionPerLevel: 0.03
  }
};

export const EVOLUTION_DEFS = {
  maxLevel: 5,
  hpPerLevel: 0.1,
  speedPerLevel: 0.04,
  outgoingPerLevel: 0.06,
  incomingReductionPerLevel: 0.025,
  radiusPerLevel: 0.6
};

export const MUTATION_DEFS = {
  quick_dash: {
    label: "Quick Dash",
    description: "Borrows Trickster dash, but weaker.",
    ability: "dash",
    cooldown: 3.8,
    dashMultiplier: 1.22,
    hpPenalty: 0.92,
    outgoingPenalty: 0.9
  },
  minor_regen: {
    label: "Minor Regen",
    description: "Borrows Medic regen, but weaker.",
    ability: "regen",
    regenPerSecond: 1.8,
    hpPenalty: 0.9,
    outgoingPenalty: 0.92
  },
  blade_echo: {
    label: "Blade Echo",
    description: "Borrows Swordsman slash, but weaker.",
    ability: "sword",
    slashCooldown: 1.75,
    slashRadius: 76,
    slashDamage: 6.5,
    slashPush: 58,
    hpPenalty: 0.9,
    outgoingPenalty: 0.91
  },
  arrow_echo: {
    label: "Arrow Echo",
    description: "Borrows Archer shot, but weaker.",
    ability: "archer",
    shotCooldown: 1.35,
    shotRange: 246,
    shotDamage: 7.2,
    shotPush: 48,
    hpPenalty: 0.9,
    outgoingPenalty: 0.91
  }
};

export const CLASS_KEYS = ["tank", "striker", "medic", "trickster", "sniper", "vampire", "bulwark", "splitter", "swordsman", "archer", "boss"];

export const CLASS_DEFS = {
  tank: {
    label: "Tank",
    description: "Heavy body. Very durable but slower and lower damage.",
    color: 0x2f6fdb,
    radius: 22,
    mass: 1.65,
    maxHp: 148,
    speed: 175,
    outgoingDamageMult: 0.9,
    incomingDamageMult: 0.74,
    wallBounceMult: 0.9
  },
  striker: {
    label: "Striker",
    description: "Aggressive burst damage class with high impact attacks.",
    color: 0xe64b3c,
    radius: 17,
    mass: 1.0,
    maxHp: 100,
    speed: 255,
    outgoingDamageMult: 1.24,
    incomingDamageMult: 1.02,
    wallBounceMult: 1.0
  },
  medic: {
    label: "Medic",
    description: "Regenerates health over time, excels in long fights.",
    color: 0x23b46e,
    radius: 18,
    mass: 1.05,
    maxHp: 112,
    speed: 210,
    outgoingDamageMult: 1.0,
    incomingDamageMult: 0.95,
    wallBounceMult: 1.0,
    regenPerSecond: 4.2
  },
  trickster: {
    label: "Trickster",
    description: "Dashes periodically and gains speed from wall rebounds.",
    color: 0xf0b429,
    radius: 16,
    mass: 0.8,
    maxHp: 92,
    speed: 240,
    outgoingDamageMult: 1.06,
    incomingDamageMult: 1.08,
    wallBounceMult: 1.08,
    dashCooldown: 2.8,
    dashMultiplier: 1.45
  },
  sniper: {
    label: "Sniper",
    description: "Glass cannon. High impact collisions deal extra precision damage.",
    color: 0x8f47ff,
    radius: 15,
    mass: 0.9,
    maxHp: 88,
    speed: 230,
    outgoingDamageMult: 1.17,
    incomingDamageMult: 1.1,
    wallBounceMult: 1.02,
    impactThreshold: 210,
    impactBonusMult: 1.55
  },
  vampire: {
    label: "Vampire",
    description: "Lifesteal class. Heals from damage dealt to enemies.",
    color: 0x8d123f,
    radius: 17,
    mass: 1.02,
    maxHp: 105,
    speed: 218,
    outgoingDamageMult: 1.1,
    incomingDamageMult: 1.0,
    wallBounceMult: 1.0,
    lifesteal: 0.24
  },
  bulwark: {
    label: "Bulwark",
    description: "Periodic shield and damage reflection (thorns).",
    color: 0x54717a,
    radius: 20,
    mass: 1.35,
    maxHp: 130,
    speed: 185,
    outgoingDamageMult: 0.96,
    incomingDamageMult: 0.92,
    wallBounceMult: 0.96,
    shieldCooldown: 4.4,
    shieldDuration: 1.2,
    shieldReductionMult: 0.5,
    thorns: 0.17
  },
  splitter: {
    label: "Splitter",
    description: "Every heavy hit can split it into two smaller fragments.",
    color: 0x13b8a6,
    radius: 16,
    mass: 0.86,
    maxHp: 90,
    speed: 230,
    outgoingDamageMult: 0.95,
    incomingDamageMult: 1.06,
    wallBounceMult: 1.05,
    splitImpactThreshold: 0,
    splitCooldown: 0.24,
    maxSplitDepth: 2,
    childHpRatio: 0.52,
    childRadiusMult: 0.78,
    childSpeedMult: 1.1
  },
  swordsman: {
    label: "Swordsman",
    description: "Melee duelist with periodic sword slashes that cut nearby enemies.",
    color: 0xf97316,
    radius: 18,
    mass: 1.08,
    maxHp: 116,
    speed: 228,
    outgoingDamageMult: 1.08,
    incomingDamageMult: 0.98,
    wallBounceMult: 1.02,
    slashCooldown: 1.15,
    slashRadius: 94,
    slashDamage: 10.5,
    slashPush: 74
  },
  archer: {
    label: "Archer",
    description: "Ranged hunter that periodically shoots the nearest enemy.",
    color: 0x22c55e,
    radius: 16,
    mass: 0.92,
    maxHp: 94,
    speed: 238,
    outgoingDamageMult: 1.11,
    incomingDamageMult: 1.05,
    wallBounceMult: 1.03,
    shotCooldown: 0.95,
    shotRange: 320,
    shotDamage: 11,
    shotPush: 62
  },
  boss: {
    label: "Boss",
    description: "Huge elite with shockwave slams, roar pulses, regen, and an enrage phase.",
    color: 0xd97706,
    radius: 28,
    mass: 2.3,
    maxHp: 320,
    speed: 188,
    outgoingDamageMult: 1.18,
    incomingDamageMult: 0.62,
    wallBounceMult: 0.9,
    bonusDamageReduction: 0.96,
    regenPerSecond: 3.6,
    shockwaveIntervalSteps: 6,
    shockwavePush: 108,
    shockwaveRecoil: 0.14,
    shockwaveCooldown: 0.35,
    roarCooldown: 1.1,
    roarRadius: 176,
    roarPush: 124,
    roarDamage: 9,
    chargeCooldown: 1.7,
    chargeForce: 122,
    enrageThreshold: 0.45,
    enrageSpeedMult: 1.24,
    enrageOutgoingBonus: 0.2,
    enrageIncomingReduction: 0.11
  }
};

export const DEFAULT_SETUP = {
  arenaWidth: 980,
  arenaHeight: 640,
  classCounts: {
    tank: 4,
    striker: 5,
    medic: 3,
    trickster: 4,
    sniper: 3,
    vampire: 3,
    bulwark: 3,
    splitter: 3,
    swordsman: 4,
    archer: 4,
    boss: 1
  }
};

export const DIRECTION_VECTORS = [
  [1, 0.6],
  [1, -0.6],
  [-1, 0.6],
  [-1, -0.6],
  [0.6, 1],
  [-0.6, 1],
  [0.6, -1],
  [-0.6, -1],
  [0.25, 1],
  [-0.25, 1]
];

export const COLLISION_CELL_SIZE = 56;
