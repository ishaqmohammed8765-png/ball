export const AbilityType = Object.freeze({
  TANK: "TANK",
  SPIKY: "SPIKY",
  VAMPIRIC: "VAMPIRIC",
  SHIELDED: "SHIELDED",
  DASH: "DASH",
  SLOW_ON_HIT: "SLOW_ON_HIT"
});

export const ABILITY_ORDER = [
  AbilityType.TANK,
  AbilityType.SPIKY,
  AbilityType.VAMPIRIC,
  AbilityType.SHIELDED,
  AbilityType.DASH,
  AbilityType.SLOW_ON_HIT
];

export const ABILITY_LABEL = Object.freeze({
  [AbilityType.TANK]: "T",
  [AbilityType.SPIKY]: "S",
  [AbilityType.VAMPIRIC]: "V",
  [AbilityType.SHIELDED]: "Sh",
  [AbilityType.DASH]: "D",
  [AbilityType.SLOW_ON_HIT]: "Sl"
});

const QUANTIZE_FACTOR = 1e6;
const EPSILON = 1e-9;

const DEFAULT_CONFIG = Object.freeze({
  fixedDt: 1 / 120,
  arenaWidth: 1000,
  arenaHeight: 640,
  ballRadius: 16,
  baseMass: 1,
  baseMaxHp: 100,
  baseMaxSpeed: 240,
  speedClamp: 360,
  wallRestitution: 1,
  collisionRestitution: 1,
  baseDamage: 8,
  relativeDamageScale: 0.08,
  minDamage: 2,
  maxDamage: 30,
  shieldCooldownSeconds: 2,
  dashCooldownSeconds: 2.5,
  dashSpeed: 320,
  slowDurationSeconds: 1.5,
  slowMultiplier: 0.6,
  tankHpMultiplier: 1.5,
  tankSpeedMultiplier: 0.8,
  spikyOutgoingMultiplier: 1.3,
  spikyIncomingMultiplier: 1.1,
  vampiricHealRatio: 0.2,
  ballCount: 18
});

function quantize(value) {
  return Math.round(value * QUANTIZE_FACTOR) / QUANTIZE_FACTOR;
}

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function applyQuantization(ball) {
  ball.x = quantize(ball.x);
  ball.y = quantize(ball.y);
  ball.vx = quantize(ball.vx);
  ball.vy = quantize(ball.vy);
  ball.hp = quantize(ball.hp);
  ball.maxHp = quantize(ball.maxHp);
  ball.maxSpeed = quantize(ball.maxSpeed);
  ball.cooldown = quantize(ball.cooldown);
  ball.shieldTimer = quantize(ball.shieldTimer);
  ball.slowTimer = quantize(ball.slowTimer);
}

function normalize(x, y) {
  const length = Math.sqrt((x * x) + (y * y));
  if (length <= EPSILON) {
    return { x: 0, y: 0, length: 0 };
  }
  return { x: x / length, y: y / length, length };
}

function limitVelocity(ball, speedCap) {
  const speedSq = (ball.vx * ball.vx) + (ball.vy * ball.vy);
  if (speedSq <= speedCap * speedCap) return;
  const speed = Math.sqrt(speedSq);
  if (speed <= EPSILON) return;
  const scale = speedCap / speed;
  ball.vx *= scale;
  ball.vy *= scale;
}

function createBallBase(id, x, y, vx, vy, abilityType, cfg) {
  let maxHp = cfg.baseMaxHp;
  let maxSpeed = cfg.baseMaxSpeed;

  if (abilityType === AbilityType.TANK) {
    maxHp *= cfg.tankHpMultiplier;
    maxSpeed *= cfg.tankSpeedMultiplier;
  }

  return {
    id,
    radius: cfg.ballRadius,
    mass: cfg.baseMass,
    x,
    y,
    vx,
    vy,
    hp: maxHp,
    maxHp,
    maxSpeed,
    abilityType,
    cooldown: 0,
    shieldTimer: 0,
    slowTimer: 0
  };
}

function getInitialVelocity(id) {
  const velocityTable = [
    [130, 90],
    [-110, 100],
    [95, -120],
    [-140, -70],
    [160, 40],
    [-90, 145],
    [75, 155],
    [-150, 50],
    [120, -95],
    [-105, -125],
    [145, -30],
    [-80, 160]
  ];
  const pair = velocityTable[id % velocityTable.length];
  return { vx: pair[0], vy: pair[1] };
}

function resolveInitialOverlaps(balls) {
  const maxIterations = 10;
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let changed = false;
    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        const a = balls[i];
        const b = balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const norm = normalize(dx, dy);
        let nx = norm.x;
        let ny = norm.y;
        let distance = norm.length;
        const minDistance = a.radius + b.radius;
        if (distance <= EPSILON) {
          const fallback = getDeterministicFallbackDirection(Math.min(a.id, b.id));
          nx = fallback.x;
          ny = fallback.y;
          distance = 0;
        }
        if (distance + EPSILON < minDistance) {
          changed = true;
          const overlap = minDistance - distance;
          const correctionX = nx * overlap * 0.5;
          const correctionY = ny * overlap * 0.5;
          a.x -= correctionX;
          a.y -= correctionY;
          b.x += correctionX;
          b.y += correctionY;
        }
      }
    }
    if (!changed) break;
  }
}

function createInitialBalls(cfg) {
  const balls = [];
  const columns = 6;
  const spacingX = 140;
  const spacingY = 120;
  const startX = 170;
  const startY = 140;

  for (let id = 0; id < cfg.ballCount; id += 1) {
    const row = Math.floor(id / columns);
    const col = id % columns;
    const x = startX + (col * spacingX);
    const y = startY + (row * spacingY);
    const { vx, vy } = getInitialVelocity(id);
    const abilityType = ABILITY_ORDER[id % ABILITY_ORDER.length];
    const ball = createBallBase(id, x, y, vx, vy, abilityType, cfg);
    limitVelocity(ball, Math.min(cfg.speedClamp, ball.maxSpeed));
    balls.push(ball);
  }

  resolveInitialOverlaps(balls);
  balls.sort((a, b) => a.id - b.id);
  for (const ball of balls) {
    applyQuantization(ball);
  }
  return balls;
}

function getDeterministicFallbackDirection(id) {
  switch (id % 4) {
    case 0:
      return { x: 1, y: 0 };
    case 1:
      return { x: 0, y: 1 };
    case 2:
      return { x: -1, y: 0 };
    default:
      return { x: 0, y: -1 };
  }
}

function applyDash(ball, cfg) {
  if (ball.abilityType !== AbilityType.DASH) return;
  if (ball.cooldown > 0) return;

  const direction = normalize(ball.vx, ball.vy);
  let dx = direction.x;
  let dy = direction.y;

  if (direction.length <= EPSILON) {
    const fallback = getDeterministicFallbackDirection(ball.id);
    dx = fallback.x;
    dy = fallback.y;
  }

  ball.vx = dx * cfg.dashSpeed;
  ball.vy = dy * cfg.dashSpeed;
  ball.cooldown = cfg.dashCooldownSeconds;
}

function applyWallCollision(ball, cfg) {
  const left = ball.radius;
  const right = cfg.arenaWidth - ball.radius;
  const top = ball.radius;
  const bottom = cfg.arenaHeight - ball.radius;

  if (ball.x < left) {
    ball.x = left;
    ball.vx = Math.abs(ball.vx) * cfg.wallRestitution;
  } else if (ball.x > right) {
    ball.x = right;
    ball.vx = -Math.abs(ball.vx) * cfg.wallRestitution;
  }

  if (ball.y < top) {
    ball.y = top;
    ball.vy = Math.abs(ball.vy) * cfg.wallRestitution;
  } else if (ball.y > bottom) {
    ball.y = bottom;
    ball.vy = -Math.abs(ball.vy) * cfg.wallRestitution;
  }
}

function computeBaseCollisionDamage(a, b, cfg, nx, ny) {
  const rvx = a.vx - b.vx;
  const rvy = a.vy - b.vy;
  const relativeSpeedAlongNormal = Math.max(0, (rvx * nx) + (rvy * ny));
  const rawDamage = cfg.baseDamage + (cfg.relativeDamageScale * relativeSpeedAlongNormal);
  return clamp(rawDamage, cfg.minDamage, cfg.maxDamage);
}

function outgoingMultiplier(ball, cfg) {
  if (ball.abilityType === AbilityType.SPIKY) return cfg.spikyOutgoingMultiplier;
  return 1;
}

function incomingMultiplier(ball, cfg) {
  if (ball.abilityType === AbilityType.SPIKY) return cfg.spikyIncomingMultiplier;
  return 1;
}

function applyShield(ball, damage, cfg) {
  if (ball.abilityType !== AbilityType.SHIELDED) return damage;
  if (ball.shieldTimer <= 0) {
    ball.shieldTimer = cfg.shieldCooldownSeconds;
    return 0;
  }
  return damage;
}

function applySlowOnHit(attacker, defender, cfg) {
  if (attacker.abilityType !== AbilityType.SLOW_ON_HIT) return;
  defender.slowTimer = Math.max(defender.slowTimer, cfg.slowDurationSeconds);
  defender.vx *= cfg.slowMultiplier;
  defender.vy *= cfg.slowMultiplier;
}

function applyVampiric(ball, dealtDamage, cfg) {
  if (ball.abilityType !== AbilityType.VAMPIRIC) return;
  if (dealtDamage <= 0) return;
  const healAmount = dealtDamage * cfg.vampiricHealRatio;
  ball.hp = Math.min(ball.maxHp, ball.hp + healAmount);
}

function applyCollisionDamage(a, b, cfg, nx, ny) {
  const baseDamage = computeBaseCollisionDamage(a, b, cfg, nx, ny);

  let damageToB = baseDamage * outgoingMultiplier(a, cfg) * incomingMultiplier(b, cfg);
  let damageToA = baseDamage * outgoingMultiplier(b, cfg) * incomingMultiplier(a, cfg);

  damageToB = applyShield(b, damageToB, cfg);
  damageToA = applyShield(a, damageToA, cfg);

  a.hp -= damageToA;
  b.hp -= damageToB;

  applyVampiric(a, damageToB, cfg);
  applyVampiric(b, damageToA, cfg);

  applySlowOnHit(a, b, cfg);
  applySlowOnHit(b, a, cfg);
}

function resolveCollisionPair(a, b, cfg) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const norm = normalize(dx, dy);
  let nx = norm.x;
  let ny = norm.y;
  let distance = norm.length;
  let hadDegenerateDistance = false;
  const minDistance = a.radius + b.radius;

  if (distance <= EPSILON) {
    const fallback = getDeterministicFallbackDirection(Math.min(a.id, b.id));
    nx = fallback.x;
    ny = fallback.y;
    distance = minDistance;
    hadDegenerateDistance = true;
  }

  const overlap = minDistance - distance;
  if (overlap > 0) {
    const totalMass = a.mass + b.mass;
    const correction = overlap + 1e-6;
    const moveA = correction * (b.mass / totalMass);
    const moveB = correction * (a.mass / totalMass);

    a.x -= nx * moveA;
    a.y -= ny * moveA;
    b.x += nx * moveB;
    b.y += ny * moveB;
  }

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = (rvx * nx) + (rvy * ny);

  if (velAlongNormal < 0) {
    const invMassA = 1 / a.mass;
    const invMassB = 1 / b.mass;
    const impulseMag = -(1 + cfg.collisionRestitution) * velAlongNormal / (invMassA + invMassB);
    const impulseX = impulseMag * nx;
    const impulseY = impulseMag * ny;

    a.vx -= impulseX * invMassA;
    a.vy -= impulseY * invMassA;
    b.vx += impulseX * invMassB;
    b.vy += impulseY * invMassB;
  }

  const isImpact = hadDegenerateDistance || overlap > EPSILON || velAlongNormal < -EPSILON;
  if (isImpact) {
    applyCollisionDamage(a, b, cfg, nx, ny);
  }
}

function createStateHasher() {
  // 64-bit FNV-1a
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  function addInt(value) {
    let v = BigInt(value >>> 0);
    for (let i = 0; i < 4; i += 1) {
      const byte = v & 0xffn;
      hash ^= byte;
      hash = (hash * prime) & mask;
      v >>= 8n;
    }
  }

  function addScaledFloat(value) {
    addInt(Math.round(value * 1000));
  }

  return {
    addInt,
    addScaledFloat,
    digest() {
      return hash.toString(16).padStart(16, "0");
    }
  };
}

export class ArenaSimulation {
  constructor(config = {}) {
    this.config = Object.freeze({ ...DEFAULT_CONFIG, ...config });
    // Reused buffers to reduce per-step allocations and GC pressure.
    this._pairBuffer = [];
    this._renderState = { stepCount: 0, aliveCount: 0, balls: [] };
    this.reset();
  }

  reset() {
    this.stepCount = 0;
    this.time = 0;
    this.balls = createInitialBalls(this.config);
  }

  step() {
    const cfg = this.config;
    const dt = cfg.fixedDt;

    for (const ball of this.balls) {
      if (ball.cooldown > 0) ball.cooldown = Math.max(0, ball.cooldown - dt);
      if (ball.shieldTimer > 0) ball.shieldTimer = Math.max(0, ball.shieldTimer - dt);
      if (ball.slowTimer > 0) ball.slowTimer = Math.max(0, ball.slowTimer - dt);

      applyDash(ball, cfg);

      const slowFactor = ball.slowTimer > 0 ? cfg.slowMultiplier : 1;
      const speedCap = Math.min(cfg.speedClamp, ball.maxSpeed * slowFactor);
      limitVelocity(ball, speedCap);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      applyWallCollision(ball, cfg);
      limitVelocity(ball, speedCap);
    }

    const pairBuffer = this._pairBuffer;
    pairBuffer.length = 0;
    for (let i = 0; i < this.balls.length; i += 1) {
      for (let j = i + 1; j < this.balls.length; j += 1) {
        const a = this.balls[i];
        const b = this.balls[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDistance = a.radius + b.radius;
        if ((dx * dx) + (dy * dy) <= (minDistance * minDistance)) {
          pairBuffer.push(i, j);
        }
      }
    }

    for (let i = 0; i < pairBuffer.length; i += 2) {
      const a = this.balls[pairBuffer[i]];
      const b = this.balls[pairBuffer[i + 1]];
      if (!a || !b) continue;
      if (a.hp <= 0 || b.hp <= 0) continue;
      resolveCollisionPair(a, b, cfg);
    }

    // In-place compaction preserves deterministic order and avoids extra arrays.
    let writeIndex = 0;
    for (let i = 0; i < this.balls.length; i += 1) {
      const ball = this.balls[i];
      if (ball.hp > 0) {
        this.balls[writeIndex] = ball;
        writeIndex += 1;
      }
    }
    this.balls.length = writeIndex;

    for (const ball of this.balls) {
      const slowFactor = ball.slowTimer > 0 ? cfg.slowMultiplier : 1;
      const speedCap = Math.min(cfg.speedClamp, ball.maxSpeed * slowFactor);
      limitVelocity(ball, speedCap);
      // Determinism: quantize mutable state each fixed step to reduce drift.
      applyQuantization(ball);
    }

    this.stepCount += 1;
    this.time += dt;
    this.time = quantize(this.time);
  }

  stepMany(count) {
    for (let i = 0; i < count; i += 1) {
      this.step();
    }
  }

  hashState() {
    const hasher = createStateHasher();
    hasher.addInt(this.stepCount);
    hasher.addInt(this.balls.length);

    const sortedBalls = [...this.balls].sort((a, b) => a.id - b.id);
    for (const ball of sortedBalls) {
      hasher.addInt(ball.id);
      hasher.addScaledFloat(ball.x);
      hasher.addScaledFloat(ball.y);
      hasher.addScaledFloat(ball.vx);
      hasher.addScaledFloat(ball.vy);
      hasher.addScaledFloat(ball.hp);
      hasher.addScaledFloat(ball.maxHp);
    }

    return hasher.digest();
  }

  getSnapshot() {
    return {
      stepCount: this.stepCount,
      aliveCount: this.balls.length,
      balls: this.balls.map((ball) => ({
        id: ball.id,
        x: ball.x,
        y: ball.y,
        vx: ball.vx,
        vy: ball.vy,
        hp: ball.hp,
        maxHp: ball.maxHp,
        radius: ball.radius,
        abilityType: ball.abilityType
      }))
    };
  }

  getRenderState() {
    this._renderState.stepCount = this.stepCount;
    this._renderState.aliveCount = this.balls.length;
    this._renderState.balls = this.balls;
    return this._renderState;
  }
}
