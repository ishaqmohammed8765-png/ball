import {
  BASE_DAMAGE,
  CLASS_DEFS,
  DAMAGE_SCALE,
  IMPACT_DAMAGE_THRESHOLD,
  MAX_DAMAGE,
  MAX_SPEED,
  MIN_DAMAGE,
  SPEED_DAMAGE_BONUS_CAP,
  SPEED_DAMAGE_SCALE
} from "./constants.js";
import { clamp } from "./utils.js";

export function calculateCollisionDamage({
  a,
  b,
  impact,
  normalX,
  normalY,
  canDealDamage
}) {
  const aForwardSpeed = Math.max(0, a.vx * normalX + a.vy * normalY);
  const bForwardSpeed = Math.max(0, -(b.vx * normalX + b.vy * normalY));
  const aSpeedBonus = clamp((aForwardSpeed / MAX_SPEED) * SPEED_DAMAGE_SCALE, 0, SPEED_DAMAGE_BONUS_CAP);
  const bSpeedBonus = clamp((bForwardSpeed / MAX_SPEED) * SPEED_DAMAGE_SCALE, 0, SPEED_DAMAGE_BONUS_CAP);

  let damageFromA = 0;
  let damageFromB = 0;

  if (canDealDamage && impact >= IMPACT_DAMAGE_THRESHOLD) {
    const impactDamage = clamp(BASE_DAMAGE + DAMAGE_SCALE * impact, MIN_DAMAGE, MAX_DAMAGE);
    damageFromA = impactDamage * (1 + aSpeedBonus);
    damageFromB = impactDamage * (1 + bSpeedBonus);
  }

  if (a.classKey === "sniper" && impact >= CLASS_DEFS.sniper.impactThreshold) {
    damageFromA *= CLASS_DEFS.sniper.impactBonusMult;
  }
  if (b.classKey === "sniper" && impact >= CLASS_DEFS.sniper.impactThreshold) {
    damageFromB *= CLASS_DEFS.sniper.impactBonusMult;
  }

  if (a.classKey === "striker" && a.hp / a.maxHp < 0.35) {
    damageFromA *= 1.2;
  }
  if (b.classKey === "striker" && b.hp / b.maxHp < 0.35) {
    damageFromB *= 1.2;
  }

  let damageToB =
    damageFromA *
    CLASS_DEFS[a.classKey].outgoingDamageMult *
    CLASS_DEFS[b.classKey].incomingDamageMult;
  let damageToA =
    damageFromB *
    CLASS_DEFS[b.classKey].outgoingDamageMult *
    CLASS_DEFS[a.classKey].incomingDamageMult;

  if (a.classKey === "bulwark" && a.abilityState.bulwarkShieldTimeLeft > 0) {
    damageToA *= CLASS_DEFS.bulwark.shieldReductionMult;
  }
  if (b.classKey === "bulwark" && b.abilityState.bulwarkShieldTimeLeft > 0) {
    damageToB *= CLASS_DEFS.bulwark.shieldReductionMult;
  }
  if (a.classKey === "boss") {
    damageToA *= CLASS_DEFS.boss.bonusDamageReduction;
  }
  if (b.classKey === "boss") {
    damageToB *= CLASS_DEFS.boss.bonusDamageReduction;
  }

  const healingForA = canDealDamage && a.classKey === "vampire" ? damageToB * CLASS_DEFS.vampire.lifesteal : 0;
  const healingForB = canDealDamage && b.classKey === "vampire" ? damageToA * CLASS_DEFS.vampire.lifesteal : 0;

  const thornsToB =
    canDealDamage && a.classKey === "bulwark" && a.abilityState.bulwarkShieldTimeLeft > 0
      ? damageToA * CLASS_DEFS.bulwark.thorns
      : 0;

  const thornsToA =
    canDealDamage && b.classKey === "bulwark" && b.abilityState.bulwarkShieldTimeLeft > 0
      ? damageToB * CLASS_DEFS.bulwark.thorns
      : 0;

  if (!canDealDamage) {
    damageToA = 0;
    damageToB = 0;
  }

  return {
    damageToA,
    damageToB,
    healingForA,
    healingForB,
    thornsToA,
    thornsToB
  };
}
