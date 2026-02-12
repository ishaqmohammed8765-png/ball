import { CLASS_DEFS, CLASS_KEYS, DIRECTION_VECTORS } from "./constants.js";
import { sanitizeCount } from "./utils.js";

export function createBall(id, classKey, x, y, vx, vy) {
  const def = CLASS_DEFS[classKey];
  return {
    id,
    classKey,
    classLabel: def.label,
    r: def.radius,
    mass: def.mass,
    x,
    y,
    vx,
    vy,
    hp: def.maxHp,
    maxHp: def.maxHp,
    color: def.color,
    alive: true,
    abilityState: {
      tricksterDashTimer: def.dashCooldown ?? 0,
      bulwarkShieldCooldown: def.shieldCooldown ?? 0,
      bulwarkShieldTimeLeft: 0,
      splitDepth: 0,
      splitCooldownLeft: 0,
      bossShockwaveCooldown: 0
    }
  };
}

export function createClassPool(classCounts) {
  const classPool = [];
  for (const classKey of CLASS_KEYS) {
    const count = sanitizeCount(classCounts[classKey]);
    for (let i = 0; i < count; i += 1) {
      classPool.push(classKey);
    }
  }
  return classPool;
}

export function createInitialBalls(setup) {
  const classPool = createClassPool(setup.classCounts);

  const total = classPool.length;
  if (total === 0) {
    return [];
  }
  const cols = Math.max(1, Math.ceil(Math.sqrt(total * (setup.arenaWidth / setup.arenaHeight))));
  const rows = Math.max(1, Math.ceil(total / cols));
  const marginX = Math.max(50, Math.min(130, setup.arenaWidth * 0.12));
  const marginY = Math.max(50, Math.min(130, setup.arenaHeight * 0.12));
  const spanX = Math.max(0, setup.arenaWidth - marginX * 2);
  const spanY = Math.max(0, setup.arenaHeight - marginY * 2);

  const balls = [];
  for (let id = 0; id < total; id += 1) {
    const classKey = classPool[id];
    const classDef = CLASS_DEFS[classKey];
    const col = id % cols;
    const row = Math.floor(id / cols);
    const x = cols > 1 ? marginX + (spanX * col) / (cols - 1) : setup.arenaWidth / 2;
    const y = rows > 1 ? marginY + (spanY * row) / (rows - 1) : setup.arenaHeight / 2;

    const [dx, dy] = DIRECTION_VECTORS[id % DIRECTION_VECTORS.length];
    const vectorMag = Math.hypot(dx, dy) || 1;
    const vx = (dx / vectorMag) * classDef.speed;
    const vy = (dy / vectorMag) * classDef.speed;
    balls.push(createBall(id, classKey, x, y, vx, vy));
  }

  return balls;
}
