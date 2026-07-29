import type { ProjectEntry } from "../types";

export interface ProjectAction {
  kind: "visit" | "source" | "details";
  href: string;
  label: string;
  /** "Visit" repeated across 400 cards is useless in a screen reader link list. */
  ariaLabel: string;
  external: boolean;
}

/** Presentation-only comparison: differs from the content-dedupe invariant in
 *  CLAUDE.md, which must resolve GitHub redirects via the API. Here we only need
 *  to know whether two links would send the reader to the same place. */
export function sameLink(a: string, b: string): boolean {
  const normalise = (value: string) =>
    value
      .trim()
      .replace(/\/+$/, "")
      .replace(
        /^(https?):\/\/([^/]+)/i,
        (_match, scheme: string, host: string) =>
          `${scheme.toLowerCase()}://${host.toLowerCase()}`
      );
  return normalise(a) === normalise(b);
}

type LinkFields = Pick<ProjectEntry, "id" | "title" | "url" | "repo">;

export function projectActions(project: LinkFields): ProjectAction[] {
  const { id, title, url, repo } = project;
  const urlIsRepo = repo !== undefined && sameLink(url, repo);

  const source = (href: string): ProjectAction => ({
    kind: "source",
    href,
    label: "Source",
    ariaLabel: `${title} source code`,
    external: true,
  });

  const details: ProjectAction = {
    kind: "details",
    href: `/projects/${id}`,
    label: "Details",
    ariaLabel: `More about ${title}`,
    external: false,
  };

  // For libraries and mods the repo *is* the project home, so a "Visit" button
  // next to an identical "Source" button would be two links to one destination.
  if (urlIsRepo) return [source(url), details];

  const visit: ProjectAction = {
    kind: "visit",
    href: url,
    label: "Visit",
    ariaLabel: `Visit the ${title} site`,
    external: true,
  };

  return repo === undefined ? [visit, details] : [visit, source(repo), details];
}
