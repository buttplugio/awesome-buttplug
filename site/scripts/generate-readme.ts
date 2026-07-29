import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parse } from "yaml";

interface SectionConfig {
  id: string;
  heading: string;
  level: number;
  parent?: string;
  parent_level?: number;
  grandparent?: string;
  grandparent_level?: number;
  intro?: string;
}

interface OrderConfig {
  preamble: string;
  sections: SectionConfig[];
}

interface ProjectEntry {
  filename: string;
  title: string;
  url: string;
  section: string;
  readme_bullets: string[];
  order: number;
}

interface EmittedHeading {
  level: number;
  text: string;
}

// Anchored to this file rather than the CWD: the site lives in site/ but the
// README it generates has to sit at the repo root for GitHub to render it.
const SITE_ROOT = path.resolve(import.meta.dirname, "..");
const REPO_ROOT = path.resolve(SITE_ROOT, "..");
const PROJECTS_DIR = path.join(SITE_ROOT, "src/content/projects");
const ORDER_CONFIG = path.join(SITE_ROOT, "config/readme-order.yaml");
const GENERATED_README = path.join(REPO_ROOT, "README.generated.md");
const ROOT_README = path.join(REPO_ROOT, "README.md");
// Only used to bootstrap: when there is no committed README to compare against.
const BOOTSTRAP_MIN_ENTRIES = 189;
// Fraction of the committed README's entries that may disappear before we refuse to write.
const MAX_SHRINK_RATIO = 0.05;
const README_ENTRY_LINE = /^- \[/gm;
// Categories and their subsections. Level 4 is excluded because the language
// buckets include "C#" and "C++", which both slug to #c and are disambiguated
// only by document position.
const TOC_MAX_LEVEL = 3;
// validate-readme-parity.ts skips this section by exact name, and the `*` bullets
// below are invisible to both scripts' `- [` entry regexes. Changing either the
// casing or the bullet character makes the TOC parse as project entries.
const TOC_HEADING = "Table Of Contents";

function readEntries(): ProjectEntry[] {
  const files = fs.readdirSync(PROJECTS_DIR).filter((f) => f.endsWith(".md"));
  return files.map((filename) => {
    const content = fs.readFileSync(path.join(PROJECTS_DIR, filename), "utf-8");
    const { data } = matter(content);
    return {
      filename,
      title: data.title,
      url: data.url,
      section: data.section,
      readme_bullets: data.readme_bullets,
      order: data.order ?? Infinity,
    };
  });
}

function readOrderConfig(): OrderConfig {
  const raw = fs.readFileSync(ORDER_CONFIG, "utf-8");
  return parse(raw) as OrderConfig;
}

function formatEntry(entry: ProjectEntry): string {
  const lines = [`- [${entry.title}](${entry.url})`];
  for (const bullet of entry.readme_bullets) {
    lines.push(`  - ${bullet}`);
  }
  return lines.join("\n");
}

function generateHeading(level: number, text: string): string {
  return "#".repeat(level) + " " + text;
}

/** GitHub's heading anchor rules: lowercase, drop punctuation, spaces to hyphens. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\- ]/g, "")
    .replace(/ /g, "-");
}

/** Built from the headings actually emitted, so it cannot link to a section that
 *  was skipped for having no entries. */
function generateToc(headings: EmittedHeading[]): string[] {
  const lines = [generateHeading(2, TOC_HEADING), ""];
  // Counted over every heading, not just the linked ones, because GitHub's
  // "-1" disambiguation is positional across the whole document.
  const slugsSeen = new Map<string, number>();

  for (const { level, text } of headings) {
    const slug = slugify(text);
    const collisions = slugsSeen.get(slug) ?? 0;
    slugsSeen.set(slug, collisions + 1);
    if (level > TOC_MAX_LEVEL) continue;
    const anchor = collisions === 0 ? slug : `${slug}-${collisions}`;
    lines.push(`${"  ".repeat(level - 2)}* [${text}](#${anchor})`);
  }

  lines.push("");
  return lines;
}

function countCommittedReadmeEntries(): number | null {
  if (!fs.existsSync(ROOT_README)) return null;
  const matches = fs.readFileSync(ROOT_README, "utf-8").match(README_ENTRY_LINE);
  return matches ? matches.length : null;
}

function assertCanWriteRootReadme(entries: ProjectEntry[], orphans: ProjectEntry[]): void {
  const previous = countCommittedReadmeEntries();

  if (previous === null) {
    if (entries.length < BOOTSTRAP_MIN_ENTRIES) {
      throw new Error(
        `Refusing to write README.md: only ${entries.length} entries found and no existing README to compare against, expected at least ${BOOTSTRAP_MIN_ENTRIES}.`
      );
    }
  } else if (!process.argv.includes("--allow-shrink")) {
    const floor = Math.ceil(previous * (1 - MAX_SHRINK_RATIO));
    if (entries.length < floor) {
      throw new Error(
        `Refusing to write README.md: found ${entries.length} entries but the committed README has ${previous}. ` +
          `Re-run with --allow-shrink if the removal is intentional.`
      );
    }
  }

  if (orphans.length > 0) {
    throw new Error(
      `Refusing to write README.md: ${orphans.length} entries are not mapped in readme-order.yaml.`
    );
  }
}

function writeFileAtomically(outputFile: string, output: string): void {
  const tempFile = `${outputFile}.tmp`;
  fs.writeFileSync(tempFile, output);
  fs.renameSync(tempFile, outputFile);
}

function generate(): void {
  const entries = readEntries();
  const config = readOrderConfig();
  const isFullMigration = process.argv.includes("--full");

  const entriesBySection = new Map<string, ProjectEntry[]>();
  for (const entry of entries) {
    const list = entriesBySection.get(entry.section) || [];
    list.push(entry);
    entriesBySection.set(entry.section, list);
  }

  const knownSections = new Set(config.sections.map((s) => s.id));
  const orphans: ProjectEntry[] = [];
  for (const entry of entries) {
    if (!knownSections.has(entry.section)) {
      orphans.push(entry);
    }
  }

  if (orphans.length > 0) {
    for (const orphan of orphans) {
      console.warn(
        `WARNING: Entry "${orphan.title}" (${orphan.filename}) has section "${orphan.section}" which is not in readme-order.yaml`
      );
    }
  }

  const bodyLines: string[] = [];
  const emittedHeadings = new Set<string>();
  const headings: EmittedHeading[] = [];

  const emitHeading = (level: number, text: string): void => {
    const key = `${level}:${text}`;
    if (emittedHeadings.has(key)) return;
    emittedHeadings.add(key);
    headings.push({ level, text });
    bodyLines.push(generateHeading(level, text));
    bodyLines.push("");
  };

  for (const section of config.sections) {
    const sectionEntries = (entriesBySection.get(section.id) || [])
      .sort((a, b) => a.order - b.order);
    if (sectionEntries.length === 0) continue;

    // Ancestors are virtual: they exist only as strings on their children, so the
    // first child to appear is what emits them.
    if (section.grandparent && section.grandparent_level) {
      emitHeading(section.grandparent_level, section.grandparent);
    }
    if (section.parent && section.parent_level) {
      emitHeading(section.parent_level, section.parent);
    }
    emitHeading(section.level, section.heading);

    if (section.intro) {
      bodyLines.push(section.intro);
      bodyLines.push("");
    }

    for (const entry of sectionEntries) {
      bodyLines.push(formatEntry(entry));
    }
    bodyLines.push("");
  }

  const lines: string[] = [
    config.preamble.trimEnd(),
    "",
    ...generateToc(headings),
    ...bodyLines,
  ];

  const output = lines.join("\n").trimEnd() + "\n";
  const outputFile = isFullMigration ? ROOT_README : GENERATED_README;

  if (isFullMigration) {
    assertCanWriteRootReadme(entries, orphans);
    console.log(`Writing to README.md (full migration mode)`);
    writeFileAtomically(outputFile, output);
  } else {
    console.log(`Writing to README.generated.md (partial migration — use --full after complete migration)`);
    fs.writeFileSync(outputFile, output);
  }

  console.log(`Generated ${path.basename(outputFile)} with ${entries.length} entries across ${config.sections.length} sections`);

  if (orphans.length > 0) {
    console.warn(`\n${orphans.length} orphan entries not placed in any section (see warnings above)`);
  }
}

generate();
