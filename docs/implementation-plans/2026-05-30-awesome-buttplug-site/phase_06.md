# Awesome Buttplug Site Implementation Plan — Phase 6: README Generation

**Goal:** Build a README generation script that reads project content entries and a section ordering config to produce the project sections of a README in the original awesome-list format. During partial migration (seed data only), output goes to `README.generated.md` for comparison — the script refuses to overwrite the root `README.md` until full migration is complete.

**Architecture:** Standalone Node.js script (`scripts/generate-readme.ts`) that reads markdown files with `gray-matter`, reads ordering config with `yaml`, groups entries by section, and writes formatted markdown output. Cannot use Astro's `getCollection()` — that API is build-time only.

**Tech Stack:** Node.js (ESM), gray-matter (frontmatter parsing), yaml (config parsing), zod (schema validation), tsx (TypeScript execution)

**Scope:** 8 phases from original design (this is phase 6 of 8)

**Codebase verified:** 2026-05-30 — README section hierarchy fully mapped. Current README has ~30 sections with nested hierarchy up to 4 levels (## > ### > #### for dev language subsections). Entry format is `- [Name](url)` with indented metadata bullets.

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC7: README generation
- **awesome-buttplug-site.AC7.1 Success:** `npm run generate-readme` produces `README.generated.md` during partial migration and `README.md` after full migration, with section hierarchy matching `readme-order.yaml` (partial: generates `README.generated.md` only)
- **awesome-buttplug-site.AC7.2 Success:** Each entry appears in the correct section formatted as name-link + indented bullet points
- **awesome-buttplug-site.AC7.3 Warning:** Entries not matching any section in ordering config produce a build warning

---

<!-- START_TASK_1 -->
### Task 1: Add script dependencies

**Files:**
- Modify: `package.json` (add dev dependencies and generate-readme script)

**Step 1: Install dependencies**

```bash
npm install --save-dev gray-matter yaml zod tsx
```

**Step 2: Add npm script**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "generate-readme": "tsx scripts/generate-readme.ts"
  }
}
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add gray-matter, yaml, zod, tsx for README generation"
```
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create readme-order.yaml

**Files:**
- Create: `config/readme-order.yaml`

**Step 1: Create the section ordering config**

This config defines the README section hierarchy, heading levels, display names, and ordering. Each section has an `id` that matches the `section` field in project entries.

```yaml
preamble: |
  # 🍑🔌 List of Awesome Buttplug Projects! 🍑🔌

  This is a list of different projects that use Buttplug in some way!

  Want to request for a game or app you'd like Buttplug support in? [Reply to this thread on our forum or contact qDot directly!](https://discuss.buttplug.io/t/buttplug-io-apps-games-support-request-list/228) (Instructions for direct contact are in post.)

  Have a finished (or even work in progress but generally working) project you'd like to see on this
  list? [Submit an issue to this repo and let us know!](https://github.com/buttplugio/awesome-buttplug/issues)

sections:
  - id: applications/utilities
    heading: "Utilities"
    level: 3
    parent: "Applications"
    parent_level: 2

  - id: applications/video-sync
    heading: "Video Sync / Movies"
    level: 3
    parent: "Applications"
    parent_level: 2

  - id: applications/audio-sync
    heading: "Audio Sync"
    level: 3
    parent: "Applications"
    parent_level: 2

  - id: games
    heading: "Games"
    level: 2

  - id: game-mods
    heading: "Game Mods"
    level: 2

  - id: game-mods/counter-strike
    heading: "Counter-Strike"
    level: 3
    parent: "Game Mods"
    parent_level: 2

  - id: game-mods/overwatch-2
    heading: "Overwatch 2"
    level: 3
    parent: "Game Mods"
    parent_level: 2

  - id: game-mods/risk-of-rain-2
    heading: "Risk of Rain 2"
    level: 3
    parent: "Game Mods"
    parent_level: 2

  - id: game-mods/minecraft
    heading: "Minecraft"
    level: 3
    parent: "Game Mods"
    parent_level: 2

  - id: game-mods/ffxiv
    heading: "FFXIV"
    level: 3
    parent: "Game Mods"
    parent_level: 2

  - id: game-mods/terraria
    heading: "Terraria"
    level: 3
    parent: "Game Mods"
    parent_level: 2

  - id: virtual-worlds
    heading: "Virtual Worlds"
    level: 2

  - id: virtual-worlds/vrchat
    heading: "VRChat"
    level: 3
    parent: "Virtual Worlds"
    parent_level: 2

  - id: virtual-worlds/chilloutvr
    heading: "ChilloutVR"
    level: 3
    parent: "Virtual Worlds"
    parent_level: 2

  - id: hardware-support
    heading: "Hardware Support"
    level: 2

  - id: development/general/rust
    heading: "Rust"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/csharp
    heading: "C#"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/cpp
    heading: "C++"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/java
    heading: "Java"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/kotlin
    heading: "Kotlin"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/js-typescript
    heading: "JS/Typescript"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/python
    heading: "Python"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/haskell
    heading: "Haskell"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/go
    heading: "Go"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/lua
    heading: "Lua"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/lisp
    heading: "LISP"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/general/dart
    heading: "Dart"
    level: 4
    parent: "General Development"
    parent_level: 3
    grandparent: "Development and Libraries"
    grandparent_level: 2

  - id: development/gleam
    heading: "Gleam"
    level: 3
    parent: "Development and Libraries"
    parent_level: 2

  - id: development/game-development
    heading: "Game Development"
    level: 3
    parent: "Development and Libraries"
    parent_level: 2

  - id: development/other-frameworks
    heading: "Other Frameworks and Plugins"
    level: 3
    parent: "Development and Libraries"
    parent_level: 2

  - id: diy-hardware
    heading: "DIY Hardware Projects"
    level: 2

  - id: deprecated
    heading: "Deprecated Projects"
    level: 2
    intro: "**Projects listed here are assumed to not work anymore, either due to developer attrition or related service shutdown. The list here is preserved so other developers can use the projects for inspiration and examples.**"
```

**Step 2: Commit**

```bash
mkdir -p config
git add config/readme-order.yaml
git commit -m "feat: add readme-order.yaml with full section hierarchy"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Create README generation script

**Verifies:** awesome-buttplug-site.AC7.1 (partial), awesome-buttplug-site.AC7.2, awesome-buttplug-site.AC7.3

**Files:**
- Create: `scripts/generate-readme.ts`

**Implementation:**

The script:
1. Reads all `.md` files from `src/content/projects/`, parses frontmatter with `gray-matter`
2. Reads `config/readme-order.yaml` with `yaml`
3. Groups entries by `section` field
4. Outputs sections in order, with entries formatted as `- [Title](url)` + indented bullets from `readme_bullets`
5. Warns on entries whose `section` doesn't match any section in the ordering config
6. Writes to `README.generated.md` (partial migration mode)
7. Accepts a `--full` flag to write to `README.md` (only after full migration validates)

The script tracks which parent/grandparent headings have already been emitted to avoid duplicating them when consecutive sections share the same parent.

```typescript
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
  const outputFile = isFullMigration ? "README.md" : "README.generated.md";

  if (isFullMigration) {
    console.log(`Writing to ${outputFile} (full migration mode)`);
  } else {
    console.log(`Writing to ${outputFile} (partial migration — use --full after complete migration)`);
  }

  fs.writeFileSync(outputFile, output);
  console.log(`Generated ${outputFile} with ${entries.length} entries across ${config.sections.length} sections`);

  if (orphans.length > 0) {
    console.warn(`\n${orphans.length} orphan entries not placed in any section (see warnings above)`);
  }
}

generate();
```

**Step 2: Commit**

```bash
git add scripts/generate-readme.ts
git commit -m "feat: add README generation script with section ordering"
```
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Verify README generation with seed data

**Step 1: Run the generator**

Run: `npm run generate-readme`
Expected: Script produces `README.generated.md` with:
- The preamble text
- Seed entries grouped under their correct sections
- Entries formatted as `- [Title](url)` with indented bullets
- Console output showing entry count and no orphan warnings (all seed entries use sections defined in readme-order.yaml)

**Step 2: Inspect the output**

Run: `cat README.generated.md`
Expected: Preamble followed by sections containing the 13 seed entries, each formatted correctly.

**Step 3: Verify orphan warning works**

Temporarily edit one seed entry to have a section that doesn't exist in readme-order.yaml (e.g., change `section: "applications/utilities"` to `section: "nonexistent/section"` in one file).

Run: `npm run generate-readme`
Expected: Console shows `WARNING: Entry "..." has section "nonexistent/section" which is not in readme-order.yaml`

Revert the temporary edit.

**Step 4: Commit**

The `README.generated.md` output should be added to `.gitignore` since it's for comparison only during partial migration:

Add `README.generated.md` to `.gitignore`.

```bash
git add .gitignore
git commit -m "chore: add README.generated.md to gitignore"
```
<!-- END_TASK_4 -->
