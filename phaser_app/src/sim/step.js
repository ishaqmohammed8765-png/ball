import {
  maybeBlockDamage,
  modifyIncomingDamage,
  modifyOutgoingDamage,
  onCollisionEffects,
  onDamageDealt,
  updateAbilityTimersAndActives
} from "./abilities.js";
import { collectCollisions, getCollisionNormal, resolveCircleCollision } from "./collisions.js";

function q6(value) {
  return Math.round(value * 1e6) / 1e6;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sortById(a, b) {
  return a.id - b.id;
}

function capSpeed(ball) {
  const speed = Math.hypot(ball.vx, ball.vy);
  const max = ball.maxSpeed * ball.currentSpeedMultiplier;
  if (speed > max && speed > 1e-12) {
    const scale = max / speed;
    ball.vx *= scale;
    ball.vy *= scale;
  }
}

function wallBounce(ball, constants) {
  const minX = constants.border + ball.radius;
  const maxX = constants.width - constants.border - ball.radius;
  const minY = constants.border + ball.radius;
  const maxY = constants.height - constants.border - ball.radius;

  if (ball.x < minX) {
    ball.x = minX;
    ball.vx = Math.abs(ball.vx) * constants.wallDamping;
  } else if (ball.x > maxX) {
    ball.x = maxX;
    ball.vx = -Math.abs(ball.vx) * constants.wallDamping;
  }

  if (ball.y < minY) {
    ball.y = minY;
    ball.vy = Math.abs(ball.vy) * constants.wallDamping;
  } else if (ball.y > maxY) {
    ball.y = maxY;
    ball.vy = -Math.abs(ball.vy) * constants.wallDamping;
  }
}

function applyDamage(attacker, defender, rawDamage, constants) {
  let damage = rawDamage;
  damage = modifyOutgoingDamage(attacker, damage);
  damage = modifyIncomingDamage(defender, damage);
  damage = clamp(damage, constants.minDamage, constants.maxDamage);
  damage = maybeBlockDamage(defender, damage);
  if (damage <= 0) {
    return;
  }

  defender.hp -= damage;
  onDamageDealt(attacker, damage);
  onCollisionEffects(attacker, defender, constants);
}

function quantizeBall(ball) {
  ball.x = q6(ball.x);
  ball.y = q6(ball.y);
  ball.vx = q6(ball.vx);
  ball.vy = q6(ball.vy);
  ball.hp = q6(ball.hp);
  ball.cooldowns.shieldReadyIn = q6(ball.cooldowns.shieldReadyIn);
  ball.cooldowns.dashIn = q6(ball.cooldowns.dashIn);
  ball.status.slowTimer = q6(ball.status.slowTimer);
  ball.currentSpeedMultiplier = q6(ball.currentSpeedMultiplier);
}

export function stepSimulation(state, dt) {
  const constants = state.constants;
  state.stepCount += 1;
  state.balls.sort(sortById);

  for (let i = 0; i < state.balls.length; i += 1) {
    const ball = state.balls[i];
    updateAbilityTimersAndActives(ball, dt, constants);
    capSpeed(ball);
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    wallBounce(ball, constants);
  }

  const pairs = collectCollisions(state.balls);
  for (let i = 0; i < pairs.length; i += 1) {
    const pair = pairs[i];
    const a = state.balls.find((ball) => ball.id === pair.idA);
    const b = state.balls.find((ball) => ball.id === pair.idB);
    if (!a || !b || a.hp <= 0 || b.hp <= 0) {
      continue;
    }

    const normal = getCollisionNormal(a, b);
    const approach = Math.max(0, (a.vx - b.vx) * normal.nx + (a.vy - b.vy) * normal.ny);
    const rawDamage = clamp(
      constants.baseDamage + constants.damageImpactScale * approach,
      constants.minDamage,
      constants.maxDamage
    );

    resolveCircleCollision(a, b, constants, normal);

    applyDamage(a, b, rawDamage, constants);
    applyDamage(b, a, rawDamage, constants);
    capSpeed(a);
    capSpeed(b);
  }

  for (let i = 0; i < state.balls.length; i += 1) {
    quantizeBall(state.balls[i]);
  }

  state.balls = state.balls.filter((ball) => ball.hp > 0).sort(sortById);
}
