import fs from "node:fs";

const ORIGINAL_README = "README.md";
const GENERATED_README = "README.generated.md";
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

function normalizeText(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReadme(filePath: string): Entry[] {
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
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

const originalEntries = parseReadme(ORIGINAL_README);
const generatedEntries = parseReadme(GENERATED_README);
const errors: string[] = [];

if (originalEntries.length !== generatedEntries.length) {
  errors.push(`Entry count mismatch: original=${originalEntries.length}, generated=${generatedEntries.length}`);
}

const count = Math.min(originalEntries.length, generatedEntries.length);
for (let i = 0; i < count; i++) {
  const original = originalEntries[i];
  const generated = generatedEntries[i];

  if (original.sections.join("/") !== generated.sections.join("/")) {
    errors.push(`Section mismatch at entry ${i + 1}: ${describe(original)} !== ${describe(generated)}`);
  }
  if (original.title !== generated.title) {
    errors.push(`Title mismatch at entry ${i + 1}: ${original.title} !== ${generated.title}`);
  }
  if (original.url !== generated.url) {
    errors.push(`URL mismatch for ${original.title}: ${original.url} !== ${generated.url}`);
  }
  if (original.bullets.length !== generated.bullets.length) {
    errors.push(`Bullet count mismatch for ${original.title}: ${original.bullets.length} !== ${generated.bullets.length}`);
    continue;
  }

  for (let j = 0; j < original.bullets.length; j++) {
    if (original.bullets[j] !== generated.bullets[j]) {
      errors.push(`Bullet mismatch for ${original.title}, bullet ${j + 1}: "${original.bullets[j]}" !== "${generated.bullets[j]}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`README parity OK: ${generatedEntries.length} migrated entries match structurally.`);
