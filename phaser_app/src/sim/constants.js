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
    maxLevel: 6,
    baseCost: 120,
    costScale: 1.35,
    hpPerLevel: 0.08
  },
  speed: {
    label: "Speed",
    maxLevel: 6,
    baseCost: 115,
    costScale: 1.32,
    speedPerLevel: 0.06
  },
  mastery: {
    label: "Mastery",
    maxLevel: 6,
    baseCost: 140,
    costScale: 1.4,
    outgoingPerLevel: 0.05,
    incomingReductionPerLevel: 0.03
  }
};

export const CLASS_KEYS = ["tank", "striker", "medic", "trickster", "sniper", "vampire", "bulwark", "splitter", "boss"];

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
  boss: {
    label: "Boss",
    description: "Huge elite ball with massive health, high knockback, and damage resistance.",
    color: 0xd97706,
    radius: 28,
    mass: 2.3,
    maxHp: 252,
    speed: 165,
    outgoingDamageMult: 1.05,
    incomingDamageMult: 0.7,
    wallBounceMult: 0.9,
    bonusDamageReduction: 0.98,
    shockwaveIntervalSteps: 8
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
