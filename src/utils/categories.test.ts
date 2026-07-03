import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryForSection } from "./categories";

describe("categoryForSection", () => {
  it("maps nested sections to their top-level category", () => {
    expect(categoryForSection("game-mods/ffxiv").slug).toBe("game-mods");
    expect(categoryForSection("applications/video-sync").slug).toBe("applications");
    expect(categoryForSection("development/general/rust").slug).toBe("development");
    expect(categoryForSection("virtual-worlds/vrchat").slug).toBe("virtual-worlds");
  });

  it("maps top-level sections directly", () => {
    expect(categoryForSection("games").slug).toBe("games");
    expect(categoryForSection("game-mods").slug).toBe("game-mods");
    expect(categoryForSection("deprecated").slug).toBe("deprecated");
  });

  it("merges hardware-support and diy-hardware into hardware", () => {
    expect(categoryForSection("hardware-support").slug).toBe("hardware");
    expect(categoryForSection("diy-hardware").slug).toBe("hardware");
  });

  it("throws on unknown sections so bad data fails the build", () => {
    expect(() => categoryForSection("nonsense")).toThrow(/nonsense/);
  });

  it("keeps the curated rail order", () => {
    expect(CATEGORIES.map((c) => c.slug)).toEqual([
      "game-mods",
      "applications",
      "development",
      "games",
      "virtual-worlds",
      "hardware",
      "deprecated",
    ]);
  });
});
