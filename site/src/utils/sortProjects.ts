import type { ProjectEntry } from "../types";

export type SortMode = "alphabetical" | "random" | "newest" | "oldest";

export const SORT_MODES = ["alphabetical", "random", "newest", "oldest"] as const;

export const DEFAULT_SORT_MODE: SortMode = "alphabetical";

export const DEFAULT_RANDOM_SEED = 0;

const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });

// FNV-1a over the id mixed with the seed, then an avalanche step to decorrelate
// ids sharing a prefix.
function seededKey(id: string, seed: number): number {
  let h = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = (h ^ id.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 0x2545f491) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function byTitle(a: ProjectEntry, b: ProjectEntry): number {
  return collator.compare(a.title, b.title) || a.id.localeCompare(b.id);
}

export function sortProjects(
  projects: ProjectEntry[],
  mode: SortMode,
  seed: number,
): ProjectEntry[] {
  switch (mode) {
    case "random":
      return [...projects].sort((a, b) => {
        return seededKey(a.id, seed) - seededKey(b.id, seed) || a.id.localeCompare(b.id);
      });

    // Both directions tie-break ascending, so oldest is deliberately not the
    // reverse of newest. Same-day ties are common and this is what keeps them
    // rendering stably.
    case "newest":
      return [...projects].sort((a, b) => b.added.localeCompare(a.added) || byTitle(a, b));

    case "oldest":
      return [...projects].sort((a, b) => a.added.localeCompare(b.added) || byTitle(a, b));

    default:
      return [...projects].sort(byTitle);
  }
}

export function newRandomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}
