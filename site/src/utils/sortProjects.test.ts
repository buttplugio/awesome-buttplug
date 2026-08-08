import { describe, expect, it } from "vitest";
import {
  DEFAULT_RANDOM_SEED,
  DEFAULT_SORT_MODE,
  SORT_MODES,
  newRandomSeed,
  sortProjects,
} from "./sortProjects";
import type { ProjectEntry } from "../types";
import type { SortMode } from "./sortProjects";

function entry(id: string, title: string, added = "2020-01-01"): ProjectEntry {
  return {
    id,
    title,
    url: `https://example.com/${id}`,
    summary: "",
    tags: [],
    section: "applications",
    category: "applications",
    added,
  };
}

describe("sortProjects", () => {
  it("orders alphabetically by title, not id", () => {
    const projects = [entry("z-id", "Alpha"), entry("a-id", "Beta")];
    const result = sortProjects(projects, "alphabetical", DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id)).toEqual(["z-id", "a-id"]);
  });

  it("is numeric-aware, so 'Buttplug 2' sorts before 'Buttplug 10'", () => {
    const projects = [entry("b10", "Buttplug 10"), entry("b2", "Buttplug 2")];
    const result = sortProjects(projects, "alphabetical", DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id)).toEqual(["b2", "b10"]);
  });

  it("breaks base-sensitivity ties deterministically by id", () => {
    const projects = [entry("z", "Widget"), entry("a", "WIDGET")];
    const result = sortProjects(projects, "alphabetical", DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id)).toEqual(["a", "z"]);
  });

  it("orders newest first descending by added date", () => {
    const projects = [
      entry("old", "Old", "2020-01-01"),
      entry("new", "New", "2022-01-01"),
      entry("mid", "Mid", "2021-01-01"),
    ];
    const result = sortProjects(projects, "newest", DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id)).toEqual(["new", "mid", "old"]);
  });

  it("orders oldest first ascending by added date", () => {
    const projects = [
      entry("old", "Old", "2020-01-01"),
      entry("new", "New", "2022-01-01"),
      entry("mid", "Mid", "2021-01-01"),
    ];
    const result = sortProjects(projects, "oldest", DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id)).toEqual(["old", "mid", "new"]);
  });

  it("breaks same-date ties ascending in BOTH directions, so oldest !== reverse(newest)", () => {
    const projects = [
      entry("c", "Charlie", "2021-01-01"),
      entry("a", "Alpha", "2021-01-01"),
      entry("b", "Bravo", "2021-01-01"),
    ];
    const newest = sortProjects(projects, "newest", DEFAULT_RANDOM_SEED);
    const oldest = sortProjects(projects, "oldest", DEFAULT_RANDOM_SEED);

    expect(newest.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(oldest.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(oldest.map((p) => p.id)).not.toEqual([...newest.map((p) => p.id)].reverse());
  });

  it("produces a reproducible order for a fixed seed", () => {
    const projects = [entry("a", "Alpha"), entry("b", "Bravo"), entry("c", "Charlie")];
    const first = sortProjects(projects, "random", 7).map((p) => p.id);
    const second = sortProjects(projects, "random", 7).map((p) => p.id);
    expect(first).toEqual(second);
  });

  it("produces different orders for different seeds", () => {
    const projects = Array.from({ length: 20 }, (_, i) => entry(`p${i}`, `Project ${i}`));
    const a = sortProjects(projects, "random", 1).map((p) => p.id);
    const b = sortProjects(projects, "random", 2).map((p) => p.id);
    expect(a).not.toEqual(b);
  });

  it("keeps a filtered subset in the same relative order as the full random sort", () => {
    const all = Array.from({ length: 30 }, (_, i) => entry(`p${i}`, `Project ${i}`));
    const seed = 7;
    const subsetIds = new Set(["p3", "p11", "p12", "p20", "p29", "p0"]);
    const subset = all.filter((p) => subsetIds.has(p.id));

    const sortedSubset = sortProjects(subset, "random", seed).map((p) => p.id);
    const sortedFromAll = sortProjects(all, "random", seed)
      .filter((p) => subsetIds.has(p.id))
      .map((p) => p.id);

    expect(sortedSubset).toEqual(sortedFromAll);
  });

  it("returns a permutation of the input for random mode", () => {
    const projects = Array.from({ length: 15 }, (_, i) => entry(`p${i}`, `Project ${i}`));
    const result = sortProjects(projects, "random", 42);
    expect(result.map((p) => p.id).sort()).toEqual(projects.map((p) => p.id).sort());
    expect(result.length).toBe(projects.length);
  });

  it("treats DEFAULT_RANDOM_SEED as a valid seed for the SSR path", () => {
    const projects = [entry("a", "Alpha"), entry("b", "Bravo")];
    expect(() => sortProjects(projects, "random", DEFAULT_RANDOM_SEED)).not.toThrow();
    const result = sortProjects(projects, "random", DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id).sort()).toEqual(["a", "b"]);
  });

  it("does not mutate the input array in any mode", () => {
    const modes: SortMode[] = [...SORT_MODES];
    for (const mode of modes) {
      const projects = [entry("z", "Zeta"), entry("a", "Alpha")];
      const original = [...projects];
      sortProjects(projects, mode, DEFAULT_RANDOM_SEED);
      expect(projects).toEqual(original);
    }
  });

  it("falls back to alphabetical for an unknown mode", () => {
    const projects = [entry("z-id", "Alpha"), entry("a-id", "Beta")];
    const result = sortProjects(projects, "bogus" as SortMode, DEFAULT_RANDOM_SEED);
    expect(result.map((p) => p.id)).toEqual(["z-id", "a-id"]);
  });

  it("exposes a sane default sort mode", () => {
    expect(DEFAULT_SORT_MODE).toBe("alphabetical");
  });

  it("generates a random seed via newRandomSeed", () => {
    const seed = newRandomSeed();
    expect(typeof seed).toBe("number");
    expect(Number.isFinite(seed)).toBe(true);
  });
});
