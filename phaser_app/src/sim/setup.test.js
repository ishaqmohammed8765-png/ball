import { describe, expect, it } from "vitest";
import { createClassPool, createInitialBalls } from "./setup.js";

describe("setup helpers", () => {
  it("allows all class counts to be zero", () => {
    const classPool = createClassPool({});
    expect(classPool).toHaveLength(0);

    const balls = createInitialBalls({
      arenaWidth: 900,
      arenaHeight: 600,
      classCounts: {}
    });
    expect(balls).toEqual([]);
  });
});
