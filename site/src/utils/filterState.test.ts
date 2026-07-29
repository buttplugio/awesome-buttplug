import { describe, expect, it } from "vitest";
import { parseFilterState, serializeFilterState } from "./filterState";

const VALID_TAGS = new Set(["free", "vr", "open-source"]);

describe("parseFilterState", () => {
  it("parses category and tags", () => {
    expect(parseFilterState("?cat=game-mods&tags=free,vr", VALID_TAGS)).toEqual({
      category: "game-mods",
      tags: ["free", "vr"],
    });
  });

  it("defaults on empty search", () => {
    expect(parseFilterState("", VALID_TAGS)).toEqual({ category: "all", tags: [] });
  });

  it("ignores unknown categories and tags", () => {
    expect(parseFilterState("?cat=bogus&tags=free,nope", VALID_TAGS)).toEqual({
      category: "all",
      tags: ["free"],
    });
  });
});

describe("serializeFilterState", () => {
  it("returns empty string for defaults", () => {
    expect(serializeFilterState({ category: "all", tags: [] })).toBe("");
  });

  it("serializes only what is set", () => {
    expect(serializeFilterState({ category: "hardware", tags: [] })).toBe("cat=hardware");
    expect(serializeFilterState({ category: "all", tags: ["free", "vr"] })).toBe(
      "tags=free%2Cvr",
    );
    expect(serializeFilterState({ category: "games", tags: ["free"] })).toBe(
      "cat=games&tags=free",
    );
  });

  it("round-trips", () => {
    const state = { category: "game-mods", tags: ["free", "vr"] };
    const qs = serializeFilterState(state);
    expect(parseFilterState(`?${qs}`, VALID_TAGS)).toEqual(state);
  });
});
