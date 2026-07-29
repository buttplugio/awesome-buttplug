import { describe, expect, it } from "vitest";
import { GRADIENTS, gradientForId } from "./monogram";

describe("gradientForId", () => {
  it("is deterministic", () => {
    expect(gradientForId("butt-saber")).toEqual(gradientForId("butt-saber"));
  });

  it("returns a gradient from the curated set", () => {
    expect(GRADIENTS).toContainEqual(gradientForId("anki-haptics"));
  });

  it("spreads across the set", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const distinct = new Set(ids.map((id) => gradientForId(id).join()));
    expect(distinct.size).toBeGreaterThan(2);
  });
});
