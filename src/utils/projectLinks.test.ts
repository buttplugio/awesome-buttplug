import { describe, expect, it } from "vitest";
import { projectActions, sameLink } from "./projectLinks";

const base = { id: "restim", title: "Restim" };

describe("sameLink", () => {
  it("ignores a trailing slash", () => {
    expect(sameLink("https://example.com/a/", "https://example.com/a")).toBe(true);
  });

  it("ignores scheme and host case", () => {
    expect(sameLink("HTTPS://GitHub.com/x/y", "https://github.com/x/y")).toBe(true);
  });

  it("keeps path case significant", () => {
    expect(sameLink("https://github.com/x/Y", "https://github.com/x/y")).toBe(false);
  });

  it("separates distinct hosts", () => {
    expect(sameLink("https://example.com", "https://example.org")).toBe(false);
  });
});

describe("projectActions", () => {
  it("offers Visit and Details when there is no repo", () => {
    const actions = projectActions({ ...base, url: "https://example.com" });
    expect(actions.map((a) => a.label)).toEqual(["Visit", "Details"]);
  });

  it("offers Visit, Source and Details when the repo differs", () => {
    const actions = projectActions({
      ...base,
      url: "https://ahegao-detector.pages.dev",
      repo: "https://github.com/Sir-Prise/ahegao-detector",
    });
    expect(actions.map((a) => a.label)).toEqual(["Visit", "Source", "Details"]);
    expect(actions[1].href).toBe("https://github.com/Sir-Prise/ahegao-detector");
  });

  it("collapses to a single Source link when the url is the repo", () => {
    const actions = projectActions({
      ...base,
      url: "https://github.com/diglet48/restim",
      repo: "https://github.com/diglet48/restim",
    });
    expect(actions.map((a) => a.label)).toEqual(["Source", "Details"]);
  });

  it("collapses when the two differ only by a trailing slash", () => {
    const actions = projectActions({
      ...base,
      url: "https://github.com/diglet48/restim/",
      repo: "https://github.com/diglet48/restim",
    });
    expect(actions.map((a) => a.label)).toEqual(["Source", "Details"]);
  });

  it("names the project in every accessible label", () => {
    const actions = projectActions({
      ...base,
      url: "https://example.com",
      repo: "https://github.com/x/y",
    });
    for (const action of actions) {
      expect(action.ariaLabel).toContain("Restim");
    }
  });

  it("marks only off-site links as external", () => {
    const actions = projectActions({ ...base, url: "https://example.com" });
    expect(actions.map((a) => a.external)).toEqual([true, false]);
  });

  it("points Details at the project page", () => {
    const [, details] = projectActions({ ...base, url: "https://example.com" });
    expect(details.href).toBe("/projects/restim");
  });
});
