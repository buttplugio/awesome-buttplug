import { describe, expect, it } from "vitest";
import { parseFilterState, serializeFilterState } from "./filterState";

const VALID_TAGS = new Set(["free", "vr", "open-source"]);

describe("parseFilterState", () => {
  it("parses category and tags", () => {
    expect(parseFilterState("?cat=game-mods&tags=free,vr", VALID_TAGS)).toEqual({
      category: "game-mods",
      tags: ["free", "vr"],
      sort: "alphabetical",
    });
  });

  it("defaults on empty search", () => {
    expect(parseFilterState("", VALID_TAGS)).toEqual({
      category: "all",
      tags: [],
      sort: "alphabetical",
    });
  });

  it("ignores unknown categories and tags", () => {
    expect(parseFilterState("?cat=bogus&tags=free,nope", VALID_TAGS)).toEqual({
      category: "all",
      tags: ["free"],
      sort: "alphabetical",
    });
  });

  it("parses a known sort mode", () => {
    expect(parseFilterState("?sort=newest", VALID_TAGS)).toEqual({
      category: "all",
      tags: [],
      sort: "newest",
    });
  });

  it("falls back to the default sort mode for an unknown value", () => {
    expect(parseFilterState("?sort=bogus", VALID_TAGS)).toEqual({
      category: "all",
      tags: [],
      sort: "alphabetical",
    });
  });
});

describe("serializeFilterState", () => {
  it("returns empty string for defaults", () => {
    expect(serializeFilterState({ category: "all", tags: [], sort: "alphabetical" })).toBe("");
  });

  it("serializes only what is set", () => {
    expect(
      serializeFilterState({ category: "hardware", tags: [], sort: "alphabetical" }),
    ).toBe("cat=hardware");
    expect(
      serializeFilterState({ category: "all", tags: ["free", "vr"], sort: "alphabetical" }),
    ).toBe("tags=free%2Cvr");
    expect(
      serializeFilterState({ category: "games", tags: ["free"], sort: "alphabetical" }),
    ).toBe("cat=games&tags=free");
  });

  it("omits sort when it is the default", () => {
    expect(
      serializeFilterState({ category: "hardware", tags: ["free"], sort: "alphabetical" }),
    ).toBe("cat=hardware&tags=free");
  });

  it("serializes a non-default sort mode", () => {
    expect(serializeFilterState({ category: "all", tags: [], sort: "newest" })).toBe(
      "sort=newest",
    );
  });

  it("round-trips", () => {
    const state = { category: "game-mods", tags: ["free", "vr"], sort: "alphabetical" as const };
    const qs = serializeFilterState(state);
    expect(parseFilterState(`?${qs}`, VALID_TAGS)).toEqual(state);
  });

  it("round-trips cat, tags, and sort together", () => {
    const state = { category: "game-mods", tags: ["free", "vr"], sort: "newest" as const };
    const qs = serializeFilterState(state);
    expect(qs).toBe("cat=game-mods&tags=free%2Cvr&sort=newest");
    expect(parseFilterState(`?${qs}`, VALID_TAGS)).toEqual(state);
  });
});
