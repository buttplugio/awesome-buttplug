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

const PROJECTS_DIR = path.resolve("src/content/projects");
const ORDER_CONFIG = path.resolve("config/readme-order.yaml");
const GENERATED_README = path.resolve("README.generated.md");
const ROOT_README = path.resolve("README.md");
const MIN_FULL_MIGRATION_ENTRIES = 189;

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

function assertCanWriteRootReadme(entries: ProjectEntry[], orphans: ProjectEntry[]): void {
  if (entries.length < MIN_FULL_MIGRATION_ENTRIES) {
    throw new Error(
      `Refusing to write README.md: only ${entries.length} entries found, expected at least ${MIN_FULL_MIGRATION_ENTRIES}.`
    );
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

  const lines: string[] = [config.preamble.trimEnd(), ""];

  const emittedHeadings = new Set<string>();

  for (const section of config.sections) {
    const sectionEntries = (entriesBySection.get(section.id) || [])
      .sort((a, b) => a.order - b.order);
    if (sectionEntries.length === 0) continue;

    if (section.grandparent && section.grandparent_level) {
      const gpKey = `${section.grandparent_level}:${section.grandparent}`;
      if (!emittedHeadings.has(gpKey)) {
        lines.push(generateHeading(section.grandparent_level, section.grandparent));
        lines.push("");
        emittedHeadings.add(gpKey);
      }
    }

    if (section.parent && section.parent_level) {
      const pKey = `${section.parent_level}:${section.parent}`;
      if (!emittedHeadings.has(pKey)) {
        lines.push(generateHeading(section.parent_level, section.parent));
        lines.push("");
        emittedHeadings.add(pKey);
      }
    }

    lines.push(generateHeading(section.level, section.heading));
    emittedHeadings.add(`${section.level}:${section.heading}`);
    lines.push("");

    if (section.intro) {
      lines.push(section.intro);
      lines.push("");
    }

    for (const entry of sectionEntries) {
      lines.push(formatEntry(entry));
    }
    lines.push("");
  }

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
