export interface Category {
  label: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { label: "Game Mods", slug: "game-mods" },
  { label: "Applications", slug: "applications" },
  { label: "Development & Libraries", slug: "development" },
  { label: "Games", slug: "games" },
  { label: "Virtual Worlds", slug: "virtual-worlds" },
  { label: "Hardware", slug: "hardware" },
  { label: "Deprecated", slug: "deprecated" },
];

const TOP_LEVEL_TO_SLUG: Record<string, string> = {
  applications: "applications",
  games: "games",
  "game-mods": "game-mods",
  "virtual-worlds": "virtual-worlds",
  "hardware-support": "hardware",
  "diy-hardware": "hardware",
  development: "development",
  deprecated: "deprecated",
};

export function isDeprecated(project: { section: string; tags: string[] }): boolean {
  return (
    categoryForSection(project.section).slug === "deprecated" ||
    project.tags.includes("deprecated")
  );
}

export function categoryForSection(sectionId: string): Category {
  const topLevel = sectionId.split("/")[0];
  const slug = TOP_LEVEL_TO_SLUG[topLevel];
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) {
    throw new Error(`No category mapping for section "${sectionId}"`);
  }
  return category;
}
