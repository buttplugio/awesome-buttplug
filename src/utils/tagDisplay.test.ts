import { describe, expect, it } from "vitest";
import { computeTagDisplay } from "./tagDisplay";

function counts(entries: [string, number][]): Map<string, number> {
  return new Map(entries);
}

describe("computeTagDisplay", () => {
  const MANY = counts([
    ["free", 148],
    ["open-source", 126],
    ["windows", 94],
    ["game-mod", 58],
    ["utility", 48],
    ["cross-platform", 43],
    ["deprecated", 29],
    ["library", 28],
    ["web", 21],
    ["vr", 20],
    ["game", 15],
    ["paid", 12],
    ["video-sync", 11],
    ["linux", 9],
    ["haskell", 1],
  ]);

  it("sorts by usage descending, alphabetical on ties", () => {
    const tied = counts([["zeta", 5], ["alpha", 5], ["mid", 7]]);
    const { visible } = computeTagDisplay(tied, [], false);
    expect(visible.map(([t]) => t)).toEqual(["mid", "alpha", "zeta"]);
  });

  it("caps collapsed view at the limit and reports hidden count", () => {
    const { visible, hiddenCount } = computeTagDisplay(MANY, [], false);
    expect(visible).toHaveLength(12);
    expect(visible[0][0]).toBe("free");
    expect(hiddenCount).toBe(3);
  });

  it("shows everything when expanded", () => {
    const { visible, hiddenCount } = computeTagDisplay(MANY, [], true);
    expect(visible).toHaveLength(15);
    expect(hiddenCount).toBe(0);
  });

  it("pins selected long-tail tags into the collapsed view", () => {
    const { visible, hiddenCount } = computeTagDisplay(MANY, ["haskell"], false);
    expect(visible.map(([t]) => t)).toContain("haskell");
    expect(visible).toHaveLength(13);
    expect(hiddenCount).toBe(2);
  });
});
