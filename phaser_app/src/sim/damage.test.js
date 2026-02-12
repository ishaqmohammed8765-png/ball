import { describe, expect, it } from "vitest";
import { calculateCollisionDamage } from "./damage.js";

function makeBall(overrides = {}) {
  return {
    classKey: "tank",
    hp: 100,
    maxHp: 100,
    vx: 200,
    vy: 0,
    abilityState: {
      bulwarkShieldTimeLeft: 0
    },
    ...overrides
  };
}

describe("calculateCollisionDamage", () => {
  it("returns zero damage when damage gate is closed", () => {
    const result = calculateCollisionDamage({
      a: makeBall({ classKey: "striker" }),
      b: makeBall({ classKey: "tank", vx: -200 }),
      impact: 200,
      normalX: 1,
      normalY: 0,
      canDealDamage: false
    });

    expect(result.damageToA).toBe(0);
    expect(result.damageToB).toBe(0);
    expect(result.healingForA).toBe(0);
    expect(result.healingForB).toBe(0);
  });

  it("applies vampire lifesteal from dealt damage", () => {
    const result = calculateCollisionDamage({
      a: makeBall({ classKey: "vampire", vx: 260 }),
      b: makeBall({ classKey: "tank", vx: -120 }),
      impact: 220,
      normalX: 1,
      normalY: 0,
      canDealDamage: true
    });

    expect(result.damageToB).toBeGreaterThan(0);
    expect(result.healingForA).toBeGreaterThan(0);
    expect(result.healingForB).toBe(0);
  });

  it("reduces incoming damage and reflects thorns for active bulwark shield", () => {
    const result = calculateCollisionDamage({
      a: makeBall({ classKey: "bulwark", abilityState: { bulwarkShieldTimeLeft: 0.8 } }),
      b: makeBall({ classKey: "striker", vx: -250, hp: 30, maxHp: 100 }),
      impact: 240,
      normalX: 1,
      normalY: 0,
      canDealDamage: true
    });

    expect(result.damageToA).toBeGreaterThan(0);
    expect(result.thornsToB).toBeGreaterThan(0);
  });
});
