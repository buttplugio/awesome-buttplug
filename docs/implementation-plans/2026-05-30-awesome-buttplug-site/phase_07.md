# Awesome Buttplug Site Implementation Plan — Phase 7: Full Migration

**Goal:** Migrate all ~189 in-scope project entries from the current README into individual markdown files, validate them against the schema, and enable root `README.md` generation with structural equivalence to the original.

**Architecture:** One-time migration script (`scripts/migrate-readme.ts`) parses the current README's markdown structure, extracts entries with their metadata bullets, and generates individual `.md` files with frontmatter. After migration, the README generation script (Phase 6) produces a `README.md` structurally equivalent to the migrated sections of the original.

**Tech Stack:** Node.js (ESM), tsx, gray-matter (for writing frontmatter), regex-based markdown parsing

**Scope:** 8 phases from original design (this is phase 7 of 8)

**Codebase verified:** 2026-05-30 — README has ~189 in-scope entries across ~30 sections with 3-4 levels of nesting. Entry format is consistently `- [Name](url)` with 2-space-indented sub-bullets. Some sections (Game Mods, Virtual Worlds) have entries directly under the parent heading before subsections. Community Links (5 entries) and Friends of Buttplug (2 entries) are excluded.

**IMPORTANT: readme-order.yaml audit required.** After migration, verify that all entries map to a section in `readme-order.yaml`. The config must include sections for entries directly under parent headings (e.g., `game-mods` for entries under "## Game Mods" before subsections, `virtual-worlds` for entries under "## Virtual Worlds" before VRChat/ChilloutVR). If the migration script reports orphans, add the missing section IDs to both `readme-order.yaml` and the script's `SECTION_MAP`.

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC2: Entry data model
- **awesome-buttplug-site.AC2.4 Success:** All ~189 migrated project entries from current README exist as individual `.md` files and pass validation

### awesome-buttplug-site.AC7: README generation
- **awesome-buttplug-site.AC7.1 Success:** `npm run generate-readme` produces `README.generated.md` during partial migration and `README.md` after full migration, with section hierarchy matching `readme-order.yaml` (completion: enables `README.md` output)
- **awesome-buttplug-site.AC7.4 Success:** Generated README is structurally equivalent to the migrated project sections of the current README: same project section hierarchy, same project ordering within sections, same project link targets, and equivalent metadata bullets. Byte-for-byte line wrapping and prose formatting are not required to match.

---

<!-- START_TASK_1 -->
### Task 1: Audit readme-order.yaml for top-level sections

**Files:**
- Modify: `config/readme-order.yaml`

**Step 1: Verify direct-entry parent sections**

Verify that the Phase 6 config includes sections for entries that sit directly under parent headings (not in subsections):

1. `game-mods` section (level 2, no parent) — for entries like "Intiface Game Haptics Router", "Playful Plugins", etc. that appear under `## Game Mods` before the game-specific subsections. It must appear BEFORE `game-mods/counter-strike`.

2. `virtual-worlds` section (level 2, no parent) — for entries like "ButtplugLite" before VRChat/ChilloutVR subsections. It must appear BEFORE `virtual-worlds/vrchat`.

The section order in the YAML must match the README order exactly. If either section is missing or misordered, fix `config/readme-order.yaml` before continuing.

**Step 2: Commit**

```bash
git add config/readme-order.yaml
git commit -m "fix: audit top-level README section ordering"
```
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create migration script

**Files:**
- Create: `scripts/migrate-readme.ts`

**Implementation:**

The migration script parses the current `README.md` and generates individual `.md` files in `src/content/projects/`. It needs to:

1. Parse the README line by line, tracking the current section hierarchy (##, ###, ####)
2. Detect entry starts: lines matching `- [Title](url)`
3. Collect sub-bullets (indented lines starting with `  - `)
4. Map section hierarchy to section IDs matching `readme-order.yaml`
5. Extract metadata from sub-bullets: pricing/licensing info, platform info, description
6. Generate a URL-safe slug from the entry title
7. Skip entries in "Community Links" and "Friends of Buttplug" sections
8. Write each entry as a `.md` file with frontmatter
9. Skip entries that already exist (seed entries from Phase 2)

Key parsing challenges:
- Multi-line bullets that wrap to the next line (continued with indentation)
- Inline markdown links within bullets
- Entries with no sub-bullets (rare but possible in Community Links)
- Section IDs must map correctly for nested sections (e.g., `#### Rust` under `### General Development` under `## Development and Libraries` → `development/general/rust`)

The script should be conservative: if parsing fails for an entry, warn and skip rather than generate a malformed file. Manual fixup after initial migration is acceptable.

```typescript
import fs from "node:fs";
import path from "node:path";

const README_PATH = path.resolve("README.md");
const OUTPUT_DIR = path.resolve("src/content/projects");

const EXCLUDED_SECTIONS = new Set([
  "Community Links",
  "Friends of Buttplug",
  "Table Of Contents",
]);

const SECTION_MAP: Record<string, string> = {
  "Utilities": "applications/utilities",
  "Video Sync / Movies": "applications/video-sync",
  "Audio Sync": "applications/audio-sync",
  "Games": "games",
  "Game Mods": "game-mods",
  "Counter-Strike": "game-mods/counter-strike",
  "Overwatch 2": "game-mods/overwatch-2",
  "Risk of Rain 2": "game-mods/risk-of-rain-2",
  "Minecraft": "game-mods/minecraft",
  "FFXIV": "game-mods/ffxiv",
  "Terraria": "game-mods/terraria",
  "Virtual Worlds": "virtual-worlds",
  "VRChat": "virtual-worlds/vrchat",
  "ChilloutVR": "virtual-worlds/chilloutvr",
  "Hardware Support": "hardware-support",
  "General Development": "development/general",
  "Rust": "development/general/rust",
  "C#": "development/general/csharp",
  "C++": "development/general/cpp",
  "Java": "development/general/java",
  "Kotlin": "development/general/kotlin",
  "JS/Typescript": "development/general/js-typescript",
  "Python": "development/general/python",
  "Haskell": "development/general/haskell",
  "Go": "development/general/go",
  "Lua": "development/general/lua",
  "LISP": "development/general/lisp",
  "Dart": "development/general/dart",
  "Gleam": "development/gleam",
  "Game Development": "development/game-development",
  "Other Frameworks and Plugins": "development/other-frameworks",
  "DIY Hardware Projects": "diy-hardware",
  "Deprecated Projects": "deprecated",
};

const TAG_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateTag(tag: string): boolean {
  return TAG_SLUG_REGEX.test(tag);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferTags(sectionId: string, bullets: string[], title: string): string[] {
  const tags: string[] = [];

  if (sectionId === "deprecated") tags.push("deprecated");
  if (sectionId.startsWith("applications/")) tags.push("utility");
  if (sectionId === "applications/video-sync") tags.push("video-sync");
  if (sectionId === "applications/audio-sync") tags.push("audio-sync");
  if (sectionId === "games") tags.push("game");
  if (sectionId.startsWith("game-mods")) tags.push("game-mod");
  if (sectionId.startsWith("virtual-worlds")) tags.push("virtual-world");
  if (sectionId.startsWith("virtual-worlds/vrchat")) tags.push("vrchat");
  if (sectionId.startsWith("development")) tags.push("library");
  if (sectionId === "hardware-support") tags.push("hardware");
  if (sectionId === "diy-hardware") tags.push("diy", "hardware");

  const bulletText = bullets.join(" ").toLowerCase();
  if (bulletText.includes("open source")) tags.push("open-source");
  if (bulletText.includes("free")) tags.push("free");
  if (bulletText.includes("paid") || bulletText.includes("crowdfunded")) tags.push("paid");
  if (bulletText.includes("windows")) tags.push("windows");
  if (bulletText.includes("cross platform")) tags.push("cross-platform");
  if (bulletText.includes("web based") || bulletText.includes("webgl") || bulletText.includes("web)")) tags.push("web");
  if (bulletText.includes("vr")) tags.push("vr");
  if (bulletText.includes("linux")) tags.push("linux");
  if (bulletText.includes("android")) tags.push("android");
  if (bulletText.includes("quest")) tags.push("meta-quest");

  const langMap: Record<string, string> = {
    "development/general/rust": "rust",
    "development/general/csharp": "c-sharp",
    "development/general/cpp": "cpp",
    "development/general/java": "java",
    "development/general/kotlin": "kotlin",
    "development/general/js-typescript": "javascript",
    "development/general/python": "python",
    "development/general/haskell": "haskell",
    "development/general/go": "go",
    "development/general/lua": "lua",
    "development/general/lisp": "lisp",
    "development/general/dart": "dart",
    "development/gleam": "gleam",
  };
  if (langMap[sectionId]) tags.push(langMap[sectionId]);

  const gameMap: Record<string, string> = {
    "game-mods/counter-strike": "counter-strike",
    "game-mods/overwatch-2": "overwatch-2",
    "game-mods/risk-of-rain-2": "risk-of-rain-2",
    "game-mods/minecraft": "minecraft",
    "game-mods/ffxiv": "ffxiv",
    "game-mods/terraria": "terraria",
  };
  if (gameMap[sectionId]) tags.push(gameMap[sectionId]);

  return [...new Set(tags)];
}

function extractPricing(bullets: string[]): string | undefined {
  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    if (lower.startsWith("free,") || lower.startsWith("paid") || lower.startsWith("crowdfunded") || lower.startsWith("commercial")) {
      return bullet.replace(/,?\s*repo at\s+https?:\/\/\S+/i, "").trim();
    }
    if (lower.match(/^free\b/) && !lower.includes("freedom")) {
      return bullet.replace(/,?\s*repo at\s+https?:\/\/\S+/i, "").trim();
    }
  }
  return undefined;
}

function extractPlatforms(bullets: string[]): string[] | undefined {
  const platforms: string[] = [];
  for (const bullet of bullets) {
    if (/windows/i.test(bullet)) platforms.push("Windows");
    if (/cross platform/i.test(bullet)) platforms.push("Cross-platform");
    if (/web based|webgl/i.test(bullet)) platforms.push("Web");
    if (/linux/i.test(bullet)) platforms.push("Linux");
    if (/mac/i.test(bullet)) platforms.push("macOS");
    if (/android/i.test(bullet)) platforms.push("Android");
    if (/quest/i.test(bullet)) platforms.push("Meta Quest");
    if (/\bvr\b/i.test(bullet) && !/vrchat/i.test(bullet)) platforms.push("VR");
  }
  return platforms.length > 0 ? [...new Set(platforms)] : undefined;
}

function extractDeprecationReason(bullets: string[]): string | undefined {
  for (const bullet of bullets) {
    if (bullet.toLowerCase().startsWith("deprecation reason:")) {
      return bullet.replace(/^deprecation reason:\s*/i, "").trim();
    }
  }
  return undefined;
}

function extractRepo(bullets: string[]): string | undefined {
  for (const bullet of bullets) {
    const match = bullet.match(/repo at\s+(https?:\/\/\S+)/i);
    if (match) return match[1];
    const availMatch = bullet.match(/available on\s+\[.*?\]\((https?:\/\/(?:github|gitlab|codeberg|sr\.ht)\S+)\)/i);
    if (availMatch) return availMatch[1];
  }
  return undefined;
}

function extractSummary(bullets: string[], title: string): string {
  for (const bullet of bullets) {
    const lower = bullet.toLowerCase();
    if (lower.startsWith("free") || lower.startsWith("paid") || lower.startsWith("crowdfunded")) continue;
    if (lower.startsWith("commercial")) continue;
    if (/^(windows|cross platform|web based|linux|mac|android|desktop|meta quest)/i.test(lower)) continue;
    if (lower.includes("repo at ")) continue;
    if (lower.startsWith("available on") || lower.startsWith("available at")) continue;
    if (lower.startsWith("deprecation reason:")) continue;
    if (lower.startsWith("maintained by")) continue;
    if (bullet.trim().length > 10) return bullet;
  }
  return title;
}

interface ParsedEntry {
  title: string;
  url: string;
  bullets: string[];
  section: string;
  order: number;
}

function parseReadme(): ParsedEntry[] {
  const content = fs.readFileSync(README_PATH, "utf-8");
  const lines = content.split("\n");
  const entries: ParsedEntry[] = [];

  let currentSections: string[] = [];
  let inExcludedSection = false;
  let currentEntry: ParsedEntry | null = null;
  let currentBulletLines: string[] = [];
  const sectionOrderCounters = new Map<string, number>();

  function flushEntry() {
    if (currentEntry && currentBulletLines.length > 0) {
      currentEntry.bullets = currentBulletLines;
      entries.push(currentEntry);
    } else if (currentEntry) {
      entries.push(currentEntry);
    }
    currentEntry = null;
    currentBulletLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const headingMatch = line.match(/^(#{2,4})\s+(.+)/);
    if (headingMatch) {
      flushEntry();
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();

      if (level === 2) currentSections = [heading];
      else if (level === 3) currentSections = [currentSections[0], heading];
      else if (level === 4) currentSections = [currentSections[0], currentSections[1], heading];

      inExcludedSection = EXCLUDED_SECTIONS.has(heading) || EXCLUDED_SECTIONS.has(currentSections[0]);

      continue;
    }

    if (inExcludedSection) continue;

    const entryMatch = line.match(/^- \[(.+?)\]\((.+?)\)\s*$/);
    if (entryMatch) {
      flushEntry();
      const mostSpecificHeading = currentSections[currentSections.length - 1];
      const sectionId = SECTION_MAP[mostSpecificHeading];

      if (!sectionId) {
        console.warn(`WARNING: No section mapping for heading "${mostSpecificHeading}" (entry: ${entryMatch[1]})`);
        continue;
      }

      const orderInSection = (sectionOrderCounters.get(sectionId) || 0) + 1;
      sectionOrderCounters.set(sectionId, orderInSection);

      currentEntry = {
        title: entryMatch[1],
        url: entryMatch[2],
        bullets: [],
        section: sectionId,
        order: orderInSection,
      };
      currentBulletLines = [];
      continue;
    }

    if (currentEntry) {
      const bulletMatch = line.match(/^\s{2}- (.+)/);
      if (bulletMatch) {
        currentBulletLines.push(bulletMatch[1]);
      } else if (line.match(/^\s{4}\S/) && currentBulletLines.length > 0) {
        currentBulletLines[currentBulletLines.length - 1] += " " + line.trim();
      } else if (line.trim() === "") {
        // blank line might end entry or just be spacing
      } else {
        flushEntry();
      }
    }
  }

  flushEntry();
  return entries;
}

function writeEntry(entry: ParsedEntry): void {
  const slug = slugify(entry.title);
  const outputPath = path.join(OUTPUT_DIR, `${slug}.md`);

  if (fs.existsSync(outputPath)) {
    console.log(`SKIP: ${slug}.md already exists`);
    return;
  }

  const rawTags = inferTags(entry.section, entry.bullets, entry.title);
  if (rawTags.length === 0) rawTags.push("uncategorised");
  const tags = rawTags.filter((tag) => {
    if (!validateTag(tag)) {
      console.warn(`WARNING: Tag "${tag}" for entry "${entry.title}" is not a valid slug, skipping`);
      return false;
    }
    return true;
  });
  if (tags.length === 0) tags.push("uncategorised");

  const pricing = extractPricing(entry.bullets);
  const platforms = extractPlatforms(entry.bullets);
  const repo = extractRepo(entry.bullets);
  const deprecationReason = extractDeprecationReason(entry.bullets);
  const summary = extractSummary(entry.bullets, entry.title);

  const frontmatter: Record<string, unknown> = {
    title: entry.title,
    url: entry.url,
    section: entry.section,
    tags,
    summary,
    readme_bullets: entry.bullets,
  };

  if (repo) frontmatter.repo = repo;
  if (pricing) frontmatter.pricing = pricing;
  if (platforms) frontmatter.platforms = platforms;
  if (deprecationReason) frontmatter.deprecation_reason = deprecationReason;

  const yamlLines = ["---"];
  yamlLines.push(`title: ${JSON.stringify(entry.title)}`);
  yamlLines.push(`url: ${JSON.stringify(entry.url)}`);
  if (repo) yamlLines.push(`repo: ${JSON.stringify(repo)}`);
  yamlLines.push(`section: ${JSON.stringify(entry.section)}`);
  yamlLines.push("tags:");
  for (const tag of tags) yamlLines.push(`  - ${tag}`);
  if (pricing) yamlLines.push(`pricing: ${JSON.stringify(pricing)}`);
  if (platforms) {
    yamlLines.push("platforms:");
    for (const p of platforms) yamlLines.push(`  - ${JSON.stringify(p)}`);
  }
  yamlLines.push(`summary: ${JSON.stringify(summary)}`);
  yamlLines.push("readme_bullets:");
  for (const bullet of entry.bullets) yamlLines.push(`  - ${JSON.stringify(bullet)}`);
  if (deprecationReason) yamlLines.push(`deprecation_reason: ${JSON.stringify(deprecationReason)}`);
  yamlLines.push(`order: ${entry.order}`);
  yamlLines.push("---");
  yamlLines.push("");
  yamlLines.push(`${summary}`);
  yamlLines.push("");

  fs.writeFileSync(outputPath, yamlLines.join("\n"));
  console.log(`CREATED: ${slug}.md`);
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const entries = parseReadme();

  console.log(`Parsed ${entries.length} entries from README.md`);

  for (const entry of entries) {
    writeEntry(entry);
  }

  console.log("\nMigration complete. Run 'npm run build' to validate all entries against the schema.");
}

main();
```

**Step 2: Commit**

```bash
git add scripts/migrate-readme.ts
git commit -m "feat: add one-time README migration script"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Run migration and validate

**Step 1: Run the migration script**

Run: `npx tsx scripts/migrate-readme.ts`
Expected: Script parses README and creates ~176 new `.md` files (13 seed entries already exist and are skipped). Console shows `CREATED` for each new file and `SKIP` for existing seed entries. If it creates more than expected, check for seed filenames whose slugs do not match the README titles.

**Step 2: Validate all entries pass schema**

Run: `npm run build`
Expected: Astro build succeeds, validating all ~189 entry files against the Zod schema.

If build fails with schema validation errors:
- Read the error messages to identify malformed entries
- Fix frontmatter issues in the affected files (common issues: missing required fields, invalid URL format, tag slugs with uppercase or spaces)
- Re-run build until clean

**Step 3: Count migrated entries**

Run: `ls src/content/projects/*.md | wc -l`
Expected: exactly the parser's in-scope entry count, currently 189 files. A higher count usually means duplicate seed entries were created because a seed filename/title did not match the migration slug.

**Step 4: Commit**

```bash
git add src/content/projects/
git commit -m "feat: migrate all project entries from README to content collection"
```
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Add automated README parity validator

**Verifies:** awesome-buttplug-site.AC7.4

**Files:**
- Create: `scripts/validate-readme-parity.ts`
- Modify: `package.json`

**Step 1: Add npm script**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "validate-readme-parity": "tsx scripts/validate-readme-parity.ts"
  }
}
```

**Step 2: Create parity validator**

This script compares the original root `README.md` to `README.generated.md` before root README overwrite. It ignores the intentionally removed `Community Links` and `Friends of Buttplug` sections, ignores the old table of contents, and normalizes whitespace plus markdown links inside metadata bullets.

```typescript
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

    const bulletMatch = line.match(/^\s{2}- (.+)/);
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
```

**Step 3: Commit**

```bash
git add scripts/validate-readme-parity.ts package.json
git commit -m "test: add README structural parity validator"
```
<!-- END_TASK_4 -->

<!-- START_TASK_5 -->
### Task 5: Validate generated README matches original and enable root output

**Verifies:** awesome-buttplug-site.AC7.1, awesome-buttplug-site.AC7.4

**Step 1: Generate comparison README**

Run: `npm run generate-readme`
Expected: Script writes `README.generated.md` with all migrated entries. Root `README.md` remains the original source-of-truth file at this point.

**Step 2: Run automated parity validator**

Run: `npm run validate-readme-parity`
Expected: Script exits 0 and reports that the migrated project entries match structurally.

If validation fails, fix the affected `.md` files' `title`, `url`, `section`, `order`, or `readme_bullets`, and/or update `config/readme-order.yaml`, then re-run `npm run generate-readme` and `npm run validate-readme-parity`.

**Step 3: Write root README**

Run: `npm run generate-readme -- --full`
Expected: Script passes its full-migration guards and atomically writes `README.md`.

**Step 4: Add postbuild hook to package.json**

Update `package.json` scripts to automatically regenerate README after every build:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
	    "postbuild": "tsx scripts/generate-readme.ts --full",
	    "preview": "astro preview",
	    "generate-readme": "tsx scripts/generate-readme.ts",
	    "validate-readme-parity": "tsx scripts/validate-readme-parity.ts"
	  }
	}
```

This ensures `npm run build` always regenerates `README.md` from the content collection, keeping the repo front page in sync with content changes. Do not add this hook until `npm run validate-readme-parity` passes.

**Step 5: Commit**

```bash
git add README.md config/readme-order.yaml package.json
git commit -m "feat: enable root README generation with postbuild hook"
```
<!-- END_TASK_5 -->

<!-- START_TASK_6 -->
### Task 6: Verify complete site builds with all entries

**Step 1: Full build**

Run: `npm run build`
Expected: Build completes with all ~189 entries. Static pages generated for:
- Index page
- ~189 project detail pages
- Tag pages for all unique tags

**Step 2: Spot-check with dev server**

Run: `npm run dev`
Verify:
- Index page loads with all entries as filterable cards
- Tag filtering works across the full dataset
- A few random project detail pages load correctly
- Deprecated entries display with proper styling

**Step 3: No commit needed — verification only**
<!-- END_TASK_6 -->
