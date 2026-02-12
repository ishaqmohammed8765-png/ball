export const ABILITIES = [
  { key: "TANK", label: "T" },
  { key: "SPIKY", label: "Sp" },
  { key: "VAMPIRIC", label: "V" },
  { key: "SHIELDED", label: "Sh" },
  { key: "DASH", label: "D" },
  { key: "SLOW_ON_HIT", label: "Sl" }
];

export function createTimersForAbility(abilityType) {
  return {
    shieldReadyIn: abilityType === "SHIELDED" ? 0 : 999999,
    dashIn: abilityType === "DASH" ? 4 : 999999
  };
}

export function applySpawnPassives(ball) {
  if (ball.abilityType === "TANK") {
    ball.maxHp *= 1.5;
    ball.hp = ball.maxHp;
    ball.maxSpeed *= 0.8;
  }
}

export function updateAbilityTimersAndActives(ball, dt, constants) {
  ball.cooldowns.shieldReadyIn -= dt;
  ball.cooldowns.dashIn -= dt;
  ball.status.slowTimer -= dt;

  if (ball.status.slowTimer <= 0) {
    ball.status.slowTimer = 0;
    ball.currentSpeedMultiplier = 1;
  } else {
    ball.currentSpeedMultiplier = ball.status.slowMultiplier;
  }

  if (ball.abilityType === "DASH" && ball.cooldowns.dashIn <= 0) {
    let dx = ball.vx;
    let dy = ball.vy;
    const len = Math.hypot(dx, dy);
    if (len < 1e-12) {
      dx = 1;
      dy = 0;
    } else {
      dx /= len;
      dy /= len;
    }
    ball.vx = dx * constants.dashSpeed;
    ball.vy = dy * constants.dashSpeed;
    ball.cooldowns.dashIn += 4;
  }
}

export function modifyOutgoingDamage(ball, damage) {
  if (ball.abilityType === "SPIKY") {
    return damage * 1.3;
  }
  return damage;
}

export function modifyIncomingDamage(ball, damage) {
  if (ball.abilityType === "SPIKY") {
    return damage * 1.1;
  }
  return damage;
}

export function maybeBlockDamage(ball, damage) {
  if (ball.abilityType === "SHIELDED" && ball.cooldowns.shieldReadyIn <= 0) {
    ball.cooldowns.shieldReadyIn = 3;
    return 0;
  }
  return damage;
}

export function onDamageDealt(attacker, dealtDamage) {
  if (dealtDamage <= 0) {
    return;
  }
  if (attacker.abilityType === "VAMPIRIC") {
    const heal = dealtDamage * 0.2;
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
  }
}

export function onCollisionEffects(attacker, defender, constants) {
  if (attacker.abilityType === "SLOW_ON_HIT") {
    defender.status.slowTimer = Math.max(defender.status.slowTimer, 2);
    defender.status.slowMultiplier = constants.slowMultiplier;
    defender.currentSpeedMultiplier = constants.slowMultiplier;
  }
}

export function pickDeterministicTarget(balls, selfId) {
  let best = null;
  for (let i = 0; i < balls.length; i += 1) {
    const b = balls[i];
    if (b.id === selfId || b.hp <= 0) {
      continue;
    }
    if (best === null || b.hp < best.hp || (b.hp === best.hp && b.id < best.id)) {
      best = b;
    }
  }
  return best;
}

export function labelForAbility(abilityType) {
  for (let i = 0; i < ABILITIES.length; i += 1) {
    if (ABILITIES[i].key === abilityType) {
      return ABILITIES[i].label;
    }
  }
  return "?";
}
