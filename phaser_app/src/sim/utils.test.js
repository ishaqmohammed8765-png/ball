import { describe, expect, it } from "vitest";
import { capClassCounts } from "./utils.js";

describe("capClassCounts", () => {
  it("returns original totals when under cap", () => {
    const result = capClassCounts({ tank: 5, striker: 4 }, 20, ["tank", "striker"]);
    expect(result.wasCapped).toBe(false);
    expect(result.total).toBe(9);
    expect(result.classCounts).toEqual({ tank: 5, striker: 4 });
  });

  it("caps totals and removes from largest pools first", () => {
    const result = capClassCounts({ tank: 9, striker: 3, medic: 2 }, 10, ["tank", "striker", "medic"]);
    expect(result.wasCapped).toBe(true);
    expect(result.total).toBe(10);
    expect(result.classCounts).toEqual({ tank: 5, striker: 3, medic: 2 });
  });
});
