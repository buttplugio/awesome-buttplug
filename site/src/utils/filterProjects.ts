import type { ProjectEntry } from "../types";

export function filterProjects(
  projects: ProjectEntry[],
  category: string,
  tags: string[],
): ProjectEntry[] {
  const matched = projects.filter(
    (project) =>
      (category === "all" || project.category === category) &&
      tags.every((tag) => project.tags.includes(tag)),
  );

  if (category !== "all") return matched;

  return [
    ...matched.filter((project) => project.category !== "deprecated"),
    ...matched.filter((project) => project.category === "deprecated"),
  ];
}
