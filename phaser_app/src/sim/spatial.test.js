import { describe, expect, it } from "vitest";
import { buildCollisionPairs } from "./spatial.js";

function ball(x, y, r = 10) {
  return { x, y, r };
}

describe("buildCollisionPairs", () => {
  it("finds close-neighbor candidate pairs", () => {
    const pairs = buildCollisionPairs([ball(10, 10), ball(18, 10), ball(500, 500)], 32);
    expect(pairs).toContainEqual([0, 1]);
    expect(pairs.some(([a, b]) => (a === 0 && b === 2) || (a === 2 && b === 0))).toBe(false);
  });

  it("does not duplicate pairs when circles span many cells", () => {
    const pairs = buildCollisionPairs([ball(40, 40, 30), ball(62, 50, 30)], 20);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual([0, 1]);
  });
});
