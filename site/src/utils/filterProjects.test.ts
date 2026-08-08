import { describe, expect, it } from "vitest";
import { deprecatedLast, filterProjects } from "./filterProjects";
import type { ProjectEntry } from "../types";

function entry(id: string, category: string, tags: string[]): ProjectEntry {
  return {
    id,
    title: id,
    url: `https://example.com/${id}`,
    summary: "",
    tags,
    section: category,
    category,
    added: "2024-01-01",
  };
}

const PROJECTS: ProjectEntry[] = [
  entry("saber", "game-mods", ["free", "vr"]),
  entry("anki", "applications", ["free", "utility"]),
  entry("dead-mod", "deprecated", ["deprecated", "free"]),
  entry("paid-app", "applications", ["paid"]),
];

describe("filterProjects", () => {
  it("returns everything for all/no-tags in collection order", () => {
    const result = filterProjects(PROJECTS, "all", []);
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "dead-mod", "paid-app"]);
  });

  it("filters by category slug", () => {
    const result = filterProjects(PROJECTS, "applications", []);
    expect(result.map((p) => p.id)).toEqual(["anki", "paid-app"]);
  });

  it("shows deprecated entries only via their own category", () => {
    expect(filterProjects(PROJECTS, "deprecated", []).map((p) => p.id)).toEqual(["dead-mod"]);
    expect(filterProjects(PROJECTS, "game-mods", []).map((p) => p.id)).toEqual(["saber"]);
  });

  it("ANDs tags with category", () => {
    expect(filterProjects(PROJECTS, "applications", ["free"]).map((p) => p.id)).toEqual(["anki"]);
    expect(filterProjects(PROJECTS, "all", ["free", "vr"]).map((p) => p.id)).toEqual(["saber"]);
  });

  it("no longer partitions deprecated entries itself", () => {
    const result = filterProjects(PROJECTS, "all", ["free"]);
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "dead-mod"]);
  });
});

describe("deprecatedLast", () => {
  it("moves deprecated entries to the end", () => {
    const result = deprecatedLast(filterProjects(PROJECTS, "all", []));
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "paid-app", "dead-mod"]);
  });

  it("preserves the incoming order within each partition", () => {
    const ordered = [...PROJECTS].reverse();
    expect(deprecatedLast(ordered).map((p) => p.id)).toEqual([
      "paid-app",
      "anki",
      "saber",
      "dead-mod",
    ]);
  });

  it("does not mutate its input", () => {
    const input = [...PROJECTS];
    deprecatedLast(input);
    expect(input.map((p) => p.id)).toEqual(PROJECTS.map((p) => p.id));
  });
});
