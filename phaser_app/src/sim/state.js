import { ABILITIES, applySpawnPassives, createTimersForAbility } from "./abilities.js";

export const SIM_DT = 1 / 120;

export const SIM_CONSTANTS = {
  width: 920,
  height: 620,
  border: 20,
  spawnCount: 20,
  radius: 16,
  baseMaxSpeed: 210,
  baseDamage: 7,
  damageImpactScale: 0.06,
  minDamage: 2,
  maxDamage: 30,
  restitution: 1,
  wallDamping: 1,
  positionalPercent: 0.8,
  slop: 0.01,
  dashSpeed: 300,
  slowMultiplier: 0.7
};

const BASE_HP = 100;
const BASE_MASS = 1;

const VELOCITY_LIST = [
  [120, 40],
  [100, -70],
  [-130, 60],
  [-110, -80],
  [70, 120],
  [90, -115],
  [-95, 105],
  [135, -45],
  [60, -130],
  [-140, 30]
];

function q6(value) {
  return Math.round(value * 1e6) / 1e6;
}

function makeBall(id, x, y, vx, vy) {
  const abilityType = ABILITIES[id % ABILITIES.length].key;
  const timers = createTimersForAbility(abilityType);
  const ball = {
    id,
    radius: SIM_CONSTANTS.radius,
    mass: BASE_MASS,
    x,
    y,
    vx,
    vy,
    hp: BASE_HP,
    maxHp: BASE_HP,
    abilityType,
    cooldowns: {
      shieldReadyIn: timers.shieldReadyIn,
      dashIn: timers.dashIn
    },
    status: {
      slowTimer: 0,
      slowMultiplier: 1
    },
    maxSpeed: SIM_CONSTANTS.baseMaxSpeed,
    currentSpeedMultiplier: 1
  };

  applySpawnPassives(ball);
  return ball;
}

function resolveInitialOverlaps(balls) {
  for (let pass = 0; pass < 6; pass += 1) {
    let moved = false;
    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (dist >= minDist) {
          continue;
        }
        const overlap = minDist - dist;
        let nx = 1;
        let ny = 0;
        if (dist > 1e-12) {
          nx = dx / dist;
          ny = dy / dist;
        }
        const move = overlap * 0.5;
        a.x -= nx * move;
        a.y -= ny * move;
        b.x += nx * move;
        b.y += ny * move;
        moved = true;
      }
    }
    if (!moved) {
      break;
    }
  }

  for (let i = 0; i < balls.length; i += 1) {
    balls[i].x = q6(balls[i].x);
    balls[i].y = q6(balls[i].y);
  }
}

function createSpawnBalls() {
  const balls = [];
  const columns = 5;
  const rows = 4;
  const spacingX = 165;
  const spacingY = 140;
  const startX = SIM_CONSTANTS.border + SIM_CONSTANTS.radius + 90;
  const startY = SIM_CONSTANTS.border + SIM_CONSTANTS.radius + 80;

  let id = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      if (id >= SIM_CONSTANTS.spawnCount) {
        break;
      }
      const speed = VELOCITY_LIST[id % VELOCITY_LIST.length];
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;
      balls.push(makeBall(id, x, y, speed[0], speed[1]));
      id += 1;
    }
  }

  resolveInitialOverlaps(balls);
  return balls;
}

export function createInitialState() {
  return {
    stepCount: 0,
    constants: SIM_CONSTANTS,
    balls: createSpawnBalls()
  };
}
