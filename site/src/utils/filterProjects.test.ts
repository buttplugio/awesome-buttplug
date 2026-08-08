import { describe, expect, it } from "vitest";
import { filterProjects } from "./filterProjects";
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
  it("returns everything for all/no-tags, deprecated last", () => {
    const result = filterProjects(PROJECTS, "all", []);
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "paid-app", "dead-mod"]);
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

  it("preserves collection order within the non-deprecated partition", () => {
    const result = filterProjects(PROJECTS, "all", ["free"]);
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "dead-mod"]);
  });
});
