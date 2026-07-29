import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// The README sits at the repo root, one level above site/. The `git show` path
// below stays bare because git resolves ref-qualified paths from the root.
const ROOT_README = path.resolve(import.meta.dirname, "..", "..", "README.md");
const DEFAULT_BASELINE_REF = "HEAD";
const EXCLUDED_TOP_LEVEL_SECTIONS = new Set([
  "Table Of Contents",
  "Community Links",
  "Friends of Buttplug",
]);

interface Entry {
  sections: string[];
  title: string;
  url: string;
  bullets: string[];
}

interface Options {
  baselinePath?: string;
  baselineRef?: string;
  generatedPath: string;
  allowRemovals: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { generatedPath: ROOT_README, allowRemovals: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--baseline") {
      options.baselinePath = argv[++i];
    } else if (arg === "--baseline-ref") {
      options.baselineRef = argv[++i];
    } else if (arg === "--generated") {
      options.generatedPath = argv[++i];
    } else if (arg === "--allow-removals") {
      options.allowRemovals = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.baselinePath && options.baselineRef) {
    throw new Error("Use only one baseline source: --baseline or --baseline-ref.");
  }

  if (!options.baselinePath && !options.baselineRef) {
    options.baselineRef = DEFAULT_BASELINE_REF;
  }

  return options;
}

function readBaseline(options: Options): string {
  if (options.baselinePath) {
    return fs.readFileSync(options.baselinePath, "utf-8");
  }

  return execFileSync("git", ["show", `${options.baselineRef}:README.md`], {
    encoding: "utf-8",
  });
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .trim();
}

function parseReadme(content: string): Entry[] {
  const lines = content.split("\n");
  const entries: Entry[] = [];
  let currentSections: string[] = [];
  let currentEntry: Entry | null = null;
  let inExcludedSection = false;

  function flushEntry(): void {
    if (!currentEntry) return;
    currentEntry.bullets = currentEntry.bullets.map(normalizeText);
    entries.push(currentEntry);
    currentEntry = null;
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,4})\s+(.+)/);
    if (headingMatch) {
      flushEntry();
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();

      if (level === 2) currentSections = [heading];
      if (level === 3) currentSections = [currentSections[0], heading];
      if (level === 4) currentSections = [currentSections[0], currentSections[1], heading];

      inExcludedSection = EXCLUDED_TOP_LEVEL_SECTIONS.has(currentSections[0]);
      continue;
    }

    if (inExcludedSection) continue;

    const entryMatch = line.match(/^- \[(.+?)\]\((.+?)\)\s*$/);
    if (entryMatch) {
      flushEntry();
      currentEntry = {
        sections: [...currentSections],
        title: entryMatch[1],
        url: entryMatch[2],
        bullets: [],
      };
      continue;
    }

    if (!currentEntry) continue;

    const bulletMatch = line.match(/^\s{2,4}- (.+)/);
    if (bulletMatch) {
      currentEntry.bullets.push(bulletMatch[1]);
      continue;
    }

    if (/^\s{4,}\S/.test(line) && currentEntry.bullets.length > 0) {
      currentEntry.bullets[currentEntry.bullets.length - 1] += " " + line.trim();
      continue;
    }

    if (line.trim() !== "") {
      flushEntry();
    }
  }

  flushEntry();
  return entries;
}

function describe(entry: Entry): string {
  return `${entry.sections.join(" > ")} / ${entry.title}`;
}

const options = parseArgs(process.argv.slice(2));
const originalEntries = parseReadme(readBaseline(options));
const generatedEntries = parseReadme(fs.readFileSync(options.generatedPath, "utf-8"));
const errors: string[] = [];

// Titles are the match key, so ambiguity here would silently skip comparisons.
function indexByTitle(entries: Entry[], label: string): Map<string, Entry> {
  const map = new Map<string, Entry>();
  for (const entry of entries) {
    if (map.has(entry.title)) {
      errors.push(`Duplicate title in ${label}: ${describe(entry)}`);
      continue;
    }
    map.set(entry.title, entry);
  }
  return map;
}

const originalByTitle = indexByTitle(originalEntries, "baseline");
const generatedByTitle = indexByTitle(generatedEntries, "current");

const removed: Entry[] = [];
let modified = 0;

for (const original of originalByTitle.values()) {
  const current = generatedByTitle.get(original.title);
  if (!current) {
    removed.push(original);
    continue;
  }

  const diffs: string[] = [];
  if (original.sections.join("/") !== current.sections.join("/")) {
    diffs.push(`section ${original.sections.join(" > ")} -> ${current.sections.join(" > ")}`);
  }
  if (original.url !== current.url) {
    diffs.push(`url ${original.url} -> ${current.url}`);
  }
  if (original.bullets.length !== current.bullets.length) {
    diffs.push(`bullet count ${original.bullets.length} -> ${current.bullets.length}`);
  } else {
    for (let j = 0; j < original.bullets.length; j++) {
      if (original.bullets[j] !== current.bullets[j]) {
        diffs.push(`bullet ${j + 1}: "${original.bullets[j]}" -> "${current.bullets[j]}"`);
      }
    }
  }

  if (diffs.length > 0) {
    modified++;
    errors.push(`Modified: ${original.title}\n    ${diffs.join("\n    ")}`);
  }
}

for (const entry of removed) {
  const message = `Removed: ${describe(entry)}`;
  if (options.allowRemovals) console.warn(message);
  else errors.push(message);
}

const added = generatedEntries.length - (originalEntries.length - removed.length);

if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(
    `\nREADME parity FAILED against ${options.baselinePath ?? options.baselineRef}: ` +
      `${modified} modified, ${removed.length} removed. ` +
      `Pass --allow-removals if entries were dropped intentionally.`
  );
  process.exit(1);
}

console.log(
  `README parity OK against ${options.baselinePath ?? options.baselineRef}: ` +
    `${originalEntries.length - removed.length} existing entries unchanged, ${added} added, ${removed.length} removed.`
);
