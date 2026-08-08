import type { ProjectEntry } from "../types";

export function filterProjects(
  projects: ProjectEntry[],
  category: string,
  tags: string[],
): ProjectEntry[] {
  return projects.filter(
    (project) =>
      (category === "all" || project.category === category) &&
      tags.every((tag) => project.tags.includes(tag)),
  );
}

export function deprecatedLast(projects: ProjectEntry[]): ProjectEntry[] {
  return [
    ...projects.filter((project) => project.category !== "deprecated"),
    ...projects.filter((project) => project.category === "deprecated"),
  ];
}
