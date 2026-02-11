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

export const CLASS_PROFILE = Object.freeze({
  [AbilityType.TANK]: Object.freeze({
    className: "Juggernaut",
    ability: "High HP but lower top speed."
  }),
  [AbilityType.SPIKY]: Object.freeze({
    className: "Brawler",
    ability: "Deals and takes more collision damage."
  }),
  [AbilityType.VAMPIRIC]: Object.freeze({
    className: "Leech",
    ability: "Heals from damage dealt."
  }),
  [AbilityType.SHIELDED]: Object.freeze({
    className: "Aegis",
    ability: "Blocks one hit, then recharges."
  }),
  [AbilityType.DASH]: Object.freeze({
    className: "Striker",
    ability: "Periodically dashes in its movement direction."
  }),
  [AbilityType.SLOW_ON_HIT]: Object.freeze({
    className: "Frost",
    ability: "Applies slow on contact."
  })
});

const QUANTIZE_FACTOR = 1e6;
const EPSILON = 1e-9;

const DEFAULT_CONFIG = Object.freeze({
  fixedDt: 1 / 120,
  arenaWidth: 920,
  arenaHeight: 600,
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
  damageRampPerSecond: 0.02,
  maxTimeDamageBonus: 1.25,
  damageStackGainPerHit: 0.09,
  maxDamageStack: 1.8,
  damageStackDecayPerSecond: 0.04,
  fairnessHpGapScale: 0.4,
  fairnessMinMultiplier: 0.8,
  fairnessMaxMultiplier: 1.25,
  shieldCooldownSeconds: 2,
  dashCooldownSeconds: 2.5,
  dashSpeed: 320,
  slowDurationSeconds: 1.5,
  slowMultiplier: 0.6,
  coreHazardStartSeconds: 18,
  coreHazardBaseRadius: 56,
  coreHazardPulseAmplitude: 24,
  coreHazardPulseFrequency: 1.4,
  coreHazardDps: 13,
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
  ball.damageStack = quantize(ball.damageStack);
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
  const profile = CLASS_PROFILE[abilityType];

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
    damageStack: 0,
    className: profile?.className ?? "Unknown",
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
  const padding = cfg.ballRadius + 24;
  const usableWidth = Math.max(0, cfg.arenaWidth - (padding * 2));
  const usableHeight = Math.max(0, cfg.arenaHeight - (padding * 2));
  const aspect = cfg.arenaWidth / Math.max(1, cfg.arenaHeight);
  const columns = Math.max(1, Math.ceil(Math.sqrt(cfg.ballCount * aspect)));
  const rows = Math.max(1, Math.ceil(cfg.ballCount / columns));
  const spacingX = columns > 1 ? usableWidth / (columns - 1) : 0;
  const spacingY = rows > 1 ? usableHeight / (rows - 1) : 0;
  const startX = padding;
  const startY = padding;

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
  return rawDamage;
}

function computeTimeDamageMultiplier(simTime, cfg) {
  return 1 + Math.min(cfg.maxTimeDamageBonus, cfg.damageRampPerSecond * simTime);
}

function computeFairnessMultiplier(attacker, defender, cfg) {
  const attackerHpPct = attacker.maxHp > EPSILON ? attacker.hp / attacker.maxHp : 0;
  const defenderHpPct = defender.maxHp > EPSILON ? defender.hp / defender.maxHp : 0;
  const hpGap = defenderHpPct - attackerHpPct;
  const raw = 1 + (hpGap * cfg.fairnessHpGapScale);
  return clamp(raw, cfg.fairnessMinMultiplier, cfg.fairnessMaxMultiplier);
}

function damageStackMultiplier(ball, cfg) {
  return 1 + clamp(ball.damageStack, 0, cfg.maxDamageStack);
}

function gainDamageStack(ball, dealtDamage, cfg) {
  if (dealtDamage <= EPSILON) return;
  const gain = cfg.damageStackGainPerHit * (dealtDamage / Math.max(cfg.baseDamage, EPSILON));
  ball.damageStack = clamp(ball.damageStack + gain, 0, cfg.maxDamageStack);
}

function decayDamageStack(ball, dt, cfg) {
  if (ball.damageStack <= EPSILON) return;
  ball.damageStack = Math.max(0, ball.damageStack - (cfg.damageStackDecayPerSecond * dt));
}

function computeCoreHazardRadius(time, cfg) {
  if (time < cfg.coreHazardStartSeconds) return 0;
  const hazardTime = time - cfg.coreHazardStartSeconds;
  const pulse = (Math.sin(hazardTime * cfg.coreHazardPulseFrequency * Math.PI * 2) + 1) * 0.5;
  return cfg.coreHazardBaseRadius + (cfg.coreHazardPulseAmplitude * pulse);
}

function applyCoreHazard(ball, time, dt, cfg) {
  const radius = computeCoreHazardRadius(time, cfg);
  if (radius <= EPSILON) return;
  const centerX = cfg.arenaWidth * 0.5;
  const centerY = cfg.arenaHeight * 0.5;
  const dx = ball.x - centerX;
  const dy = ball.y - centerY;
  if ((dx * dx) + (dy * dy) <= (radius * radius)) {
    ball.hp -= cfg.coreHazardDps * dt;
  }
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

function applyCollisionDamage(a, b, cfg, nx, ny, simTime) {
  const rawDamage = computeBaseCollisionDamage(a, b, cfg, nx, ny);
  const timeMultiplier = computeTimeDamageMultiplier(simTime, cfg);
  const scaledDamage = rawDamage * timeMultiplier;
  const cappedDamage = clamp(scaledDamage, cfg.minDamage, cfg.maxDamage * timeMultiplier);

  let damageToB = cappedDamage
    * outgoingMultiplier(a, cfg)
    * incomingMultiplier(b, cfg)
    * damageStackMultiplier(a, cfg)
    * computeFairnessMultiplier(a, b, cfg);
  let damageToA = cappedDamage
    * outgoingMultiplier(b, cfg)
    * incomingMultiplier(a, cfg)
    * damageStackMultiplier(b, cfg)
    * computeFairnessMultiplier(b, a, cfg);

  damageToB = applyShield(b, damageToB, cfg);
  damageToA = applyShield(a, damageToA, cfg);

  a.hp -= damageToA;
  b.hp -= damageToB;

  applyVampiric(a, damageToB, cfg);
  applyVampiric(b, damageToA, cfg);

  gainDamageStack(a, damageToB, cfg);
  gainDamageStack(b, damageToA, cfg);

  applySlowOnHit(a, b, cfg);
  applySlowOnHit(b, a, cfg);
}

function resolveCollisionPair(a, b, cfg, simTime) {
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
    applyCollisionDamage(a, b, cfg, nx, ny, simTime);
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
      decayDamageStack(ball, dt, cfg);

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
      resolveCollisionPair(a, b, cfg, this.time);
    }

    for (const ball of this.balls) {
      if (ball.hp <= 0) continue;
      applyCoreHazard(ball, this.time, dt, cfg);
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
      hasher.addScaledFloat(ball.damageStack);
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
        damageStack: ball.damageStack,
        radius: ball.radius,
        className: ball.className,
        abilityType: ball.abilityType
      }))
    };
  }

  getCoreHazardState() {
    const radius = computeCoreHazardRadius(this.time, this.config);
    return {
      active: radius > EPSILON,
      radius,
      x: this.config.arenaWidth * 0.5,
      y: this.config.arenaHeight * 0.5
    };
  }

  getRenderState() {
    this._renderState.stepCount = this.stepCount;
    this._renderState.aliveCount = this.balls.length;
    this._renderState.balls = this.balls;
    return this._renderState;
  }
}
