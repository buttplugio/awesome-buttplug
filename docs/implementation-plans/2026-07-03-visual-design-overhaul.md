# Visual Design Overhaul Implementation Plan

> **For agentic workers:** Implement task-by-task using small, file-bounded agents where possible. Prefer `general-purpose-mini` for dependency setup, pure utilities/tests, token/layout styling, non-index route styling, and documentation/verification. Use a stronger general-purpose agent for the index behavior island if mini struggles. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's generic dark theme with the approved "soft elevation" design: category rail, usage-sorted tag bar, compact/visual card toggle, URL-synced filters, and restyled surfaces.

**Architecture:** All changes are presentation-layer. New pure utility modules (`categories`, `filterProjects`, `tagDisplay`, `filterState`, `monogram`) carry the logic and get vitest coverage; Preact components consume them. The content schema, README generation, and Pagefind indexing are untouched. Spec: `docs/design-plans/2026-07-03-visual-design-overhaul.md`.

**Tech Stack:** Astro 6 (static), Preact islands, vitest (new, ^4.1.9), @fontsource-variable/inter (new, ^5.2.8).

## Global Constraints

- Node >= 22; site stays fully static (no SSR)
- No external network assets: fonts self-hosted via fontsource, no CDN links
- `npm run build` and `npm run validate-readme-parity` must pass after every task
- Never edit `README.md`, `src/content/`, `src/content.config.ts`, `config/readme-order.yaml`, or `scripts/`
- Design tokens exactly as specified in the spec's token table; components must not hardcode colours
- Components are Preact (`import ... from "preact"`), not React
- Category counts must be derived from the current project data, never hardcoded. For the dataset at plan time, the derived counts should be: Game Mods 58, Applications 48, Deprecated 29, Development & Libraries 28, Games 15, Virtual Worlds 8, Hardware 3 (= 2 `hardware-support` + 1 `diy-hardware`), total 189.

---

### Task 1: Category rollup module + vitest setup

**Files:**
- Modify: `package.json` (add vitest, test script)
- Create: `src/utils/categories.ts`
- Test: `src/utils/categories.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `interface Category { label: string; slug: string }`, `const CATEGORIES: Category[]` (curated rail order, excludes "All"), `function categoryForSection(sectionId: string): Category` (throws on unknown section)

- [ ] **Step 1: Install vitest and add test script**

```bash
npm install -D vitest@^4.1.9
```

In `package.json` `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 2: Write the failing test**

Create `src/utils/categories.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CATEGORIES, categoryForSection } from "./categories";

describe("categoryForSection", () => {
  it("maps nested sections to their top-level category", () => {
    expect(categoryForSection("game-mods/ffxiv").slug).toBe("game-mods");
    expect(categoryForSection("applications/video-sync").slug).toBe("applications");
    expect(categoryForSection("development/general/rust").slug).toBe("development");
    expect(categoryForSection("virtual-worlds/vrchat").slug).toBe("virtual-worlds");
  });

  it("maps top-level sections directly", () => {
    expect(categoryForSection("games").slug).toBe("games");
    expect(categoryForSection("game-mods").slug).toBe("game-mods");
    expect(categoryForSection("deprecated").slug).toBe("deprecated");
  });

  it("merges hardware-support and diy-hardware into hardware", () => {
    expect(categoryForSection("hardware-support").slug).toBe("hardware");
    expect(categoryForSection("diy-hardware").slug).toBe("hardware");
  });

  it("throws on unknown sections so bad data fails the build", () => {
    expect(() => categoryForSection("nonsense")).toThrow(/nonsense/);
  });

  it("keeps the curated rail order", () => {
    expect(CATEGORIES.map((c) => c.slug)).toEqual([
      "game-mods",
      "applications",
      "development",
      "games",
      "virtual-worlds",
      "hardware",
      "deprecated",
    ]);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/utils/categories.test.ts`
Expected: FAIL — cannot resolve `./categories`

- [ ] **Step 4: Write the implementation**

Create `src/utils/categories.ts`:

```ts
export interface Category {
  label: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { label: "Game Mods", slug: "game-mods" },
  { label: "Applications", slug: "applications" },
  { label: "Development & Libraries", slug: "development" },
  { label: "Games", slug: "games" },
  { label: "Virtual Worlds", slug: "virtual-worlds" },
  { label: "Hardware", slug: "hardware" },
  { label: "Deprecated", slug: "deprecated" },
];

const TOP_LEVEL_TO_SLUG: Record<string, string> = {
  applications: "applications",
  games: "games",
  "game-mods": "game-mods",
  "virtual-worlds": "virtual-worlds",
  "hardware-support": "hardware",
  "diy-hardware": "hardware",
  development: "development",
  deprecated: "deprecated",
};

export function categoryForSection(sectionId: string): Category {
  const topLevel = sectionId.split("/")[0];
  const slug = TOP_LEVEL_TO_SLUG[topLevel];
  const category = CATEGORIES.find((c) => c.slug === slug);
  if (!category) {
    throw new Error(`No category mapping for section "${sectionId}"`);
  }
  return category;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/utils/categories.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/utils/categories.ts src/utils/categories.test.ts
git commit -m "feat: add category rollup module with vitest setup"
```

---

### Task 2: Design tokens, base styles, header/footer, self-hosted Inter

**Files:**
- Modify: `package.json` (add @fontsource-variable/inter)
- Modify: `src/styles/global.css` (full replacement)
- Modify: `src/layouts/BaseLayout.astro` (font import, header markup)

**Interfaces:**
- Consumes: nothing
- Produces: the CSS custom properties listed in Step 2 — all later tasks style exclusively via these tokens

- [ ] **Step 1: Install the font**

```bash
npm install @fontsource-variable/inter@^5.2.8
```

- [ ] **Step 2: Replace `src/styles/global.css` entirely**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #121217;
  --bg-raised: #1a1a21;
  --bg-inset: #1c1c24;
  --text: #d7d7de;
  --text-muted: #8f8f9c;
  --text-bright: #f5f5f7;
  --accent: #e5484d;
  --accent-hover: #ec5d62;
  --hairline: #26262e;
  --success-bg: rgba(70, 167, 88, 0.14);
  --success-fg: #63d489;
  --warning-bg: rgba(240, 173, 78, 0.14);
  --warning-fg: #f0ad4e;
  --danger-bg: rgba(229, 72, 77, 0.16);
  --danger-fg: #ff8589;
  --pill-bg: #24242e;
  --pill-fg: #8d8d9d;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.5), 0 4px 14px rgb(0 0 0 / 0.25);
  --shadow-card-hover: 0 2px 6px rgb(0 0 0 / 0.5), 0 8px 24px rgb(0 0 0 / 0.35);
  --radius: 12px;
  --radius-sm: 6px;
  --font-sans: "Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --max-width: 1200px;

  --pagefind-ui-scale: 0.8;
  --pagefind-ui-primary: var(--accent);
  --pagefind-ui-text: var(--text);
  --pagefind-ui-background: var(--bg-inset);
  --pagefind-ui-border: var(--hairline);
  --pagefind-ui-border-width: 1px;
  --pagefind-ui-border-radius: var(--radius-sm);
  --pagefind-ui-font: var(--font-sans);
}

html {
  font-family: var(--font-sans);
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
}

h1,
h2,
h3 {
  color: var(--text-bright);
  letter-spacing: -0.01em;
  font-weight: 650;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.25rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

h3 {
  font-size: 1.15rem;
}

header {
  border-bottom: 1px solid var(--hairline);
  padding: 0.875rem 1rem;
}

header nav {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.brand {
  font-weight: 700;
  font-size: 1.15rem;
  color: var(--text-bright);
  letter-spacing: -0.01em;
}

.brand:hover {
  color: var(--text-bright);
}

header nav a:not(.brand) {
  color: var(--text-muted);
  font-size: 0.95rem;
}

header nav a:not(.brand):hover {
  color: var(--text-bright);
}

#search {
  max-width: var(--max-width);
  margin: 0.5rem auto 0;
  padding: 0 1rem;
}

main {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem 1rem;
  flex: 1;
  width: 100%;
}

.lede {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

footer {
  border-top: 1px solid var(--hairline);
  padding: 1.5rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  header nav {
    gap: 1rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  main {
    padding: 1.25rem 0.75rem;
  }
}
```

Retired tokens (`--bg-card`, `--border`, `--tag-bg`, `--tag-bg-hover`, `--success`, `--warning`, `--danger`): still referenced by `filter.css` and page-scoped styles until Tasks 4–8 replace them. The site must still build; visual polish lands per-surface in later tasks.

- [ ] **Step 3: Update `src/layouts/BaseLayout.astro`**

Add the font import as the first line of the frontmatter imports, and give the brand link its class:

```astro
---
import "@fontsource-variable/inter";
import "../styles/global.css";
```

In the header markup, change:

```html
<a href="/">Awesome Buttplug</a>
```

to:

```html
<a href="/" class="brand">Awesome Buttplug</a>
```

- [ ] **Step 4: Update the index lede**

In `src/pages/index.astro`, change:

```html
<p>A curated list of awesome projects using the Buttplug sex toy control protocol.</p>
```

to:

```html
<p class="lede">A curated list of awesome projects using the Buttplug sex toy control protocol.</p>
```

- [ ] **Step 5: Verify build and look**

Run: `npm run build`
Expected: build succeeds, README parity postbuild passes.

Run: `npm run dev`, open http://localhost:4321/ — charcoal background (not navy), Inter rendering (compare a capital "G" against system-ui), header hairline, no console errors, no external font requests in the network tab.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/styles/global.css src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "feat: replace theme with soft-elevation design tokens and self-hosted Inter"
```

---

### Task 3: Data plumbing + filter composition logic

**Files:**
- Modify: `src/types.ts`
- Modify: `src/pages/index.astro`
- Create: `src/utils/filterProjects.ts`
- Test: `src/utils/filterProjects.test.ts`

**Interfaces:**
- Consumes: `categoryForSection` from Task 1
- Produces: `ProjectEntry` gains `section: string` and `category: string` (category slug); `function filterProjects(projects: ProjectEntry[], category: string, tags: string[]): ProjectEntry[]` where `category` is a slug or `"all"`

- [ ] **Step 1: Extend `ProjectEntry`**

Replace `src/types.ts`:

```ts
export interface ProjectEntry {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  section: string;
  category: string;
  image?: string;
  pricing?: string;
  deprecation_reason?: string;
}
```

- [ ] **Step 2: Pass section/category through in `src/pages/index.astro`**

Add the import and extend the mapping:

```ts
import { categoryForSection } from "../utils/categories";

const rawProjects = await getCollection("projects");
const projects: ProjectEntry[] = rawProjects.map((p) => ({
  id: p.id,
  title: p.data.title,
  url: p.data.url,
  summary: p.data.summary,
  tags: p.data.tags,
  section: p.data.section,
  category: categoryForSection(p.data.section).slug,
  image: p.data.image,
  pricing: p.data.pricing,
  deprecation_reason: p.data.deprecation_reason,
}));
```

- [ ] **Step 3: Write the failing test**

Create `src/utils/filterProjects.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { filterProjects } from "./filterProjects";
import type { ProjectEntry } from "../types";

function entry(id: string, category: string, tags: string[]): ProjectEntry {
  return {
    id,
    title: id,
    url: `https://example.com/${id}`,
    summary: "",
    tags,
    section: category,
    category,
  };
}

const PROJECTS: ProjectEntry[] = [
  entry("saber", "game-mods", ["free", "vr"]),
  entry("anki", "applications", ["free", "utility"]),
  entry("dead-mod", "deprecated", ["deprecated", "free"]),
  entry("paid-app", "applications", ["paid"]),
];

describe("filterProjects", () => {
  it("returns everything for all/no-tags, deprecated last", () => {
    const result = filterProjects(PROJECTS, "all", []);
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "paid-app", "dead-mod"]);
  });

  it("filters by category slug", () => {
    const result = filterProjects(PROJECTS, "applications", []);
    expect(result.map((p) => p.id)).toEqual(["anki", "paid-app"]);
  });

  it("shows deprecated entries only via their own category", () => {
    expect(filterProjects(PROJECTS, "deprecated", []).map((p) => p.id)).toEqual(["dead-mod"]);
    expect(filterProjects(PROJECTS, "game-mods", []).map((p) => p.id)).toEqual(["saber"]);
  });

  it("ANDs tags with category", () => {
    expect(filterProjects(PROJECTS, "applications", ["free"]).map((p) => p.id)).toEqual(["anki"]);
    expect(filterProjects(PROJECTS, "all", ["free", "vr"]).map((p) => p.id)).toEqual(["saber"]);
  });

  it("preserves collection order within the non-deprecated partition", () => {
    const result = filterProjects(PROJECTS, "all", ["free"]);
    expect(result.map((p) => p.id)).toEqual(["saber", "anki", "dead-mod"]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/utils/filterProjects.test.ts`
Expected: FAIL — cannot resolve `./filterProjects`

- [ ] **Step 5: Write the implementation**

Create `src/utils/filterProjects.ts`:

```ts
import type { ProjectEntry } from "../types";

export function filterProjects(
  projects: ProjectEntry[],
  category: string,
  tags: string[],
): ProjectEntry[] {
  const matched = projects.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      tags.every((tag) => p.tags.includes(tag)),
  );
  if (category !== "all") return matched;
  return [
    ...matched.filter((p) => p.category !== "deprecated"),
    ...matched.filter((p) => p.category === "deprecated"),
  ];
}
```

- [ ] **Step 6: Run all tests and build**

Run: `npm test`
Expected: PASS (categories + filterProjects suites)

Run: `npm run build`
Expected: succeeds — proves every real section id maps to a category (unknown sections throw at build time).

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/pages/index.astro src/utils/filterProjects.ts src/utils/filterProjects.test.ts
git commit -m "feat: plumb section/category into entries and add filter composition"
```

---

### Task 4: Category rail

**Files:**
- Create: `src/components/CategoryRail.tsx`
- Modify: `src/components/ProjectFilter.tsx`
- Modify: `src/styles/filter.css` (rail styles appended; old `.tag-*`/`.card*` styles remain until Tasks 5–6)

**Interfaces:**
- Consumes: `CATEGORIES` (Task 1), `filterProjects` (Task 3)
- Produces: `CategoryRail` component with props `{ counts: Map<string, number>; total: number; selected: string; onSelect: (slug: string) => void }`; `ProjectFilter` state `category: string` (slug or `"all"`) that Task 7 will sync to the URL

- [ ] **Step 1: Create `src/components/CategoryRail.tsx`**

```tsx
import type { FunctionalComponent } from "preact";
import { CATEGORIES } from "../utils/categories";

interface Props {
  counts: Map<string, number>;
  total: number;
  selected: string;
  onSelect: (slug: string) => void;
}

const CategoryRail: FunctionalComponent<Props> = ({ counts, total, selected, onSelect }) => {
  return (
    <div class="category-rail" role="group" aria-label="Categories">
      <button
        class={`rail-chip ${selected === "all" ? "on" : ""}`}
        onClick={() => onSelect("all")}
      >
        All <span class="rail-count">{total}</span>
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category.slug}
          class={`rail-chip ${selected === category.slug ? "on" : ""}`}
          onClick={() => onSelect(selected === category.slug ? "all" : category.slug)}
        >
          {category.label} <span class="rail-count">{counts.get(category.slug) ?? 0}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryRail;
```

- [ ] **Step 2: Rework `src/components/ProjectFilter.tsx`**

Full replacement (view toggle and URL sync arrive in Tasks 6–7):

```tsx
import type { FunctionalComponent } from "preact";
import { useState, useMemo, useCallback } from "preact/hooks";
import type { ProjectEntry } from "../types";
import { filterProjects } from "../utils/filterProjects";
import CategoryRail from "./CategoryRail";
import TagBar from "./TagBar";
import CardGrid from "./CardGrid";

interface Props {
  projects: ProjectEntry[];
}

const ProjectFilter: FunctionalComponent<Props> = ({ projects }) => {
  const [category, setCategory] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = useMemo(
    () => filterProjects(projects, category, selectedTags),
    [projects, category, selectedTags],
  );

  const railCounts = useMemo(() => {
    const tagFiltered = filterProjects(projects, "all", selectedTags);
    const counts = new Map<string, number>();
    for (const p of tagFiltered) {
      counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    }
    return counts;
  }, [projects, selectedTags]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const allTags = new Set(projects.flatMap((p) => p.tags));
    for (const tag of allTags) {
      counts.set(tag, filtered.filter((p) => p.tags.includes(tag)).length);
    }
    return counts;
  }, [projects, filtered]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  return (
    <div data-pagefind-ignore>
      <CategoryRail
        counts={railCounts}
        total={projects.length}
        selected={category}
        onSelect={setCategory}
      />
      <TagBar
        tags={tagCounts}
        selected={selectedTags}
        onToggle={toggleTag}
        onClear={clearTags}
      />
      <p class="result-count">
        Showing {filtered.length} of {projects.length} projects
      </p>
      <CardGrid projects={filtered} />
    </div>
  );
};

export default ProjectFilter;
```

- [ ] **Step 3: Append rail styles to `src/styles/filter.css`**

```css
.category-rail {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.875rem;
}

.rail-chip {
  background: var(--bg-inset);
  color: var(--text-muted);
  border: none;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-family: var(--font-sans);
  font-weight: 500;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
}

.rail-chip:hover {
  color: var(--text-bright);
}

.rail-chip.on {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(229, 72, 77, 0.35);
}

.rail-count {
  opacity: 0.7;
  font-size: 0.75rem;
  font-weight: 400;
}

@media (max-width: 768px) {
  .category-rail {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    -webkit-overflow-scrolling: touch;
  }

  .rail-chip {
    flex-shrink: 0;
  }
}
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`, open http://localhost:4321/
- Rail shows All 189, Game Mods 58, Applications 48, Development & Libraries 28, Games 15, Virtual Worlds 8, Hardware 3, Deprecated 29
- Clicking a chip filters the grid; clicking it again returns to All; chips are single-select
- Selecting tag `vr` then category Game Mods composes (AND)
- In All view, deprecated cards appear at the end
- At 375px width the rail scrolls horizontally

- [ ] **Step 5: Build and commit**

Run: `npm run build` — expected: green.

```bash
git add src/components/CategoryRail.tsx src/components/ProjectFilter.tsx src/styles/filter.css
git commit -m "feat: add single-select category rail with live counts"
```

---

### Task 5: Usage-sorted tag bar with overflow expander

**Files:**
- Create: `src/utils/tagDisplay.ts`
- Test: `src/utils/tagDisplay.test.ts`
- Modify: `src/components/TagBar.tsx`
- Modify: `src/styles/filter.css` (replace `.tag-bar`/`.tag-pill` block)

**Interfaces:**
- Consumes: nothing new
- Produces: `interface TagDisplayResult { visible: [string, number][]; hiddenCount: number }`, `function computeTagDisplay(counts: Map<string, number>, selected: string[], expanded: boolean, limit?: number): TagDisplayResult` (limit defaults to 12)

- [ ] **Step 1: Write the failing test**

Create `src/utils/tagDisplay.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeTagDisplay } from "./tagDisplay";

function counts(entries: [string, number][]): Map<string, number> {
  return new Map(entries);
}

describe("computeTagDisplay", () => {
  const MANY = counts([
    ["free", 148],
    ["open-source", 126],
    ["windows", 94],
    ["game-mod", 58],
    ["utility", 48],
    ["cross-platform", 43],
    ["deprecated", 29],
    ["library", 28],
    ["web", 21],
    ["vr", 20],
    ["game", 15],
    ["paid", 12],
    ["video-sync", 11],
    ["linux", 9],
    ["haskell", 1],
  ]);

  it("sorts by usage descending, alphabetical on ties", () => {
    const tied = counts([["zeta", 5], ["alpha", 5], ["mid", 7]]);
    const { visible } = computeTagDisplay(tied, [], false);
    expect(visible.map(([t]) => t)).toEqual(["mid", "alpha", "zeta"]);
  });

  it("caps collapsed view at the limit and reports hidden count", () => {
    const { visible, hiddenCount } = computeTagDisplay(MANY, [], false);
    expect(visible).toHaveLength(12);
    expect(visible[0][0]).toBe("free");
    expect(hiddenCount).toBe(3);
  });

  it("shows everything when expanded", () => {
    const { visible, hiddenCount } = computeTagDisplay(MANY, [], true);
    expect(visible).toHaveLength(15);
    expect(hiddenCount).toBe(0);
  });

  it("pins selected long-tail tags into the collapsed view", () => {
    const { visible, hiddenCount } = computeTagDisplay(MANY, ["haskell"], false);
    expect(visible.map(([t]) => t)).toContain("haskell");
    expect(visible).toHaveLength(13);
    expect(hiddenCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/tagDisplay.test.ts`
Expected: FAIL — cannot resolve `./tagDisplay`

- [ ] **Step 3: Write the implementation**

Create `src/utils/tagDisplay.ts`:

```ts
export interface TagDisplayResult {
  visible: [string, number][];
  hiddenCount: number;
}

export function computeTagDisplay(
  counts: Map<string, number>,
  selected: string[],
  expanded: boolean,
  limit = 12,
): TagDisplayResult {
  const sorted = Array.from(counts.entries()).sort(
    ([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB),
  );
  if (expanded) {
    return { visible: sorted, hiddenCount: 0 };
  }
  const visible = sorted.filter(
    ([tag], index) => index < limit || selected.includes(tag),
  );
  return { visible, hiddenCount: sorted.length - visible.length };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/tagDisplay.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Rework `src/components/TagBar.tsx`**

Full replacement:

```tsx
import type { FunctionalComponent } from "preact";
import { useState } from "preact/hooks";
import { computeTagDisplay } from "../utils/tagDisplay";

interface Props {
  tags: Map<string, number>;
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}

const TagBar: FunctionalComponent<Props> = ({ tags, selected, onToggle, onClear }) => {
  const [expanded, setExpanded] = useState(false);
  const { visible, hiddenCount } = computeTagDisplay(tags, selected, expanded);

  return (
    <div class="tag-bar">
      <div class="tag-list">
        {visible.map(([tag, count]) => {
          const isActive = selected.includes(tag);
          return (
            <button
              key={tag}
              class={`tag-pill ${isActive ? "active" : ""} ${count === 0 && !isActive ? "dimmed" : ""}`}
              onClick={() => onToggle(tag)}
            >
              {tag} <span class="tag-count">{count}</span>
            </button>
          );
        })}
        {hiddenCount > 0 && (
          <button class="tag-expander" onClick={() => setExpanded(true)}>
            +{hiddenCount} more
          </button>
        )}
        {expanded && (
          <button class="tag-expander" onClick={() => setExpanded(false)}>
            show fewer
          </button>
        )}
        {selected.length > 0 && (
          <button class="tag-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default TagBar;
```

- [ ] **Step 6: Replace the tag styles in `src/styles/filter.css`**

Delete the existing `.tag-bar`, `.tag-clear`, `.tag-list`, `.tag-pill`, `.tag-pill:hover`, `.tag-pill.active`, `.tag-pill.dimmed`, `.tag-count` rules and add:

```css
.tag-bar {
  margin-bottom: 0.5rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  align-items: center;
}

.tag-pill,
.tag-expander,
.tag-clear {
  border: none;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 0.78rem;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  transition: background 0.15s, color 0.15s;
}

.tag-pill {
  background: var(--pill-bg);
  color: var(--pill-fg);
}

.tag-pill:hover {
  color: var(--text-bright);
}

.tag-pill.active {
  background: var(--accent);
  color: #fff;
}

.tag-pill.dimmed {
  opacity: 0.4;
}

.tag-count {
  font-size: 0.68rem;
  opacity: 0.7;
}

.tag-expander {
  background: transparent;
  color: var(--text-muted);
  text-decoration: underline dotted;
}

.tag-expander:hover {
  color: var(--text-bright);
}

.tag-clear {
  background: transparent;
  color: var(--accent);
  font-weight: 500;
}

.tag-clear:hover {
  color: var(--accent-hover);
}
```

- [ ] **Step 7: Verify in browser**

Run: `npm run dev`
- Collapsed bar shows 12 pills, highest-usage first (`free`, `open-source`, `windows`, …), plus "+N more"
- Expanding shows all tags plus "show fewer"; collapsing keeps any selected long-tail tag visible
- AND filtering and counts still work; "Clear" appears only with a selection

- [ ] **Step 8: Run all tests, build, commit**

Run: `npm test && npm run build` — expected: green.

```bash
git add src/utils/tagDisplay.ts src/utils/tagDisplay.test.ts src/components/TagBar.tsx src/styles/filter.css
git commit -m "feat: usage-sorted tag bar with overflow expander"
```

---

### Task 6: View toggle, card variants, gradient monograms

**Files:**
- Create: `src/utils/monogram.ts`
- Test: `src/utils/monogram.test.ts`
- Create: `src/components/ViewToggle.tsx`
- Modify: `src/components/CardGrid.tsx`
- Modify: `src/components/ProjectFilter.tsx`
- Modify: `src/styles/filter.css` (replace `.card*`/`.badge*` block)
- Delete: `public/images/placeholder.svg`

**Interfaces:**
- Consumes: `ProjectEntry` (Task 3)
- Produces: `type ViewMode = "compact" | "visual"` (exported from `ViewToggle.tsx`); `function gradientForId(id: string): [string, string]`; `CardGrid` gains prop `viewMode: ViewMode`; `ViewToggle` props `{ mode: ViewMode; onChange: (mode: ViewMode) => void }`; localStorage key `"ab-view-mode"`

- [ ] **Step 1: Write the failing monogram test**

Create `src/utils/monogram.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GRADIENTS, gradientForId } from "./monogram";

describe("gradientForId", () => {
  it("is deterministic", () => {
    expect(gradientForId("butt-saber")).toEqual(gradientForId("butt-saber"));
  });

  it("returns a gradient from the curated set", () => {
    expect(GRADIENTS).toContainEqual(gradientForId("anki-haptics"));
  });

  it("spreads across the set", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
    const distinct = new Set(ids.map((id) => gradientForId(id).join()));
    expect(distinct.size).toBeGreaterThan(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/monogram.test.ts`
Expected: FAIL — cannot resolve `./monogram`

- [ ] **Step 3: Write the implementation**

Create `src/utils/monogram.ts`:

```ts
export const GRADIENTS: [string, string][] = [
  ["#e5484d", "#7f2b2e"],
  ["#e5734c", "#7f3f2b"],
  ["#d9a521", "#77590f"],
  ["#3fa66b", "#1f5c3a"],
  ["#3aa6a6", "#1f5c5c"],
  ["#4c6fe5", "#2b3d7f"],
  ["#8a4ce5", "#4c2b7f"],
  ["#d44c9e", "#752b57"],
];

export function gradientForId(id: string): [string, string] {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 33) ^ id.charCodeAt(i);
  }
  return GRADIENTS[(hash >>> 0) % GRADIENTS.length];
}
```

Run: `npx vitest run src/utils/monogram.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 4: Create `src/components/ViewToggle.tsx`**

```tsx
import type { FunctionalComponent } from "preact";

export type ViewMode = "compact" | "visual";

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const ViewToggle: FunctionalComponent<Props> = ({ mode, onChange }) => {
  return (
    <div class="view-toggle" role="group" aria-label="View mode">
      <button
        class={mode === "compact" ? "on" : ""}
        aria-pressed={mode === "compact"}
        onClick={() => onChange("compact")}
      >
        Compact
      </button>
      <button
        class={mode === "visual" ? "on" : ""}
        aria-pressed={mode === "visual"}
        onClick={() => onChange("visual")}
      >
        Visual
      </button>
    </div>
  );
};

export default ViewToggle;
```

- [ ] **Step 5: Rework `src/components/CardGrid.tsx`**

Full replacement:

```tsx
import type { FunctionalComponent } from "preact";
import type { ProjectEntry } from "../types";
import type { ViewMode } from "./ViewToggle";
import { stripInlineMarkdown } from "../utils/displayText";
import { gradientForId } from "../utils/monogram";

interface Props {
  projects: ProjectEntry[];
  viewMode: ViewMode;
}

const CardGrid: FunctionalComponent<Props> = ({ projects, viewMode }) => {
  if (projects.length === 0) {
    return <p class="no-results">No projects match the selected filters.</p>;
  }

  return (
    <div class="card-grid">
      {projects.map((project) => {
        const isDeprecated = project.category === "deprecated";
        const pricing = project.pricing ? stripInlineMarkdown(project.pricing) : undefined;
        const summary = stripInlineMarkdown(project.summary);
        const deprecationReason = project.deprecation_reason
          ? stripInlineMarkdown(project.deprecation_reason)
          : undefined;
        const [from, to] = gradientForId(project.id);

        return (
          <a
            key={project.id}
            href={`/projects/${project.id}`}
            class={`card ${isDeprecated ? "deprecated" : ""}`}
          >
            {viewMode === "visual" &&
              (project.image ? (
                <img src={project.image} alt="" class="card-media" loading="lazy" />
              ) : (
                <div
                  class="card-media card-monogram"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  {project.title.charAt(0).toUpperCase()}
                </div>
              ))}
            <div class="card-body">
              <h3 class="card-title">{project.title}</h3>
              {isDeprecated && <span class="badge badge-deprecated">Deprecated</span>}
              {pricing && !isDeprecated && (
                <span class="badge badge-pricing">{pricing}</span>
              )}
              <p class="card-summary">{summary}</p>
              {deprecationReason && (
                <p class="card-deprecation">{deprecationReason}</p>
              )}
              <div class="card-tags">
                {project.tags
                  .filter((t) => t !== "deprecated")
                  .slice(0, 4)
                  .map((tag) => (
                    <span key={tag} class="tag-pill-display">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default CardGrid;
```

- [ ] **Step 6: Wire the toggle into `src/components/ProjectFilter.tsx`**

Add imports:

```tsx
import ViewToggle from "./ViewToggle";
import type { ViewMode } from "./ViewToggle";
```

Add state below `selectedTags` (localStorage-guarded so the build-time prerender works):

```tsx
const [viewMode, setViewMode] = useState<ViewMode>(() => {
  if (typeof window === "undefined") return "compact";
  return window.localStorage.getItem("ab-view-mode") === "visual" ? "visual" : "compact";
});

const changeViewMode = useCallback((mode: ViewMode) => {
  setViewMode(mode);
  window.localStorage.setItem("ab-view-mode", mode);
}, []);
```

Replace the result-count paragraph and grid with a toolbar row:

```tsx
<div class="toolbar">
  <p class="result-count">
    Showing {filtered.length} of {projects.length} projects
  </p>
  <ViewToggle mode={viewMode} onChange={changeViewMode} />
</div>
<CardGrid projects={filtered} viewMode={viewMode} />
```

- [ ] **Step 7: Replace card/badge styles in `src/styles/filter.css`**

Delete the existing `.card-grid`, `.card`, `.card:hover`, `.card.deprecated`, `.card-image`, `.card-body`, `.card-title`, `.badge`, `.badge-deprecated`, `.badge-pricing`, `.card-summary`, `.card-deprecation`, `.card-tags`, `.tag-pill-display`, `.result-count` rules and add:

```css
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0.75rem 0 1rem;
}

.result-count {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.view-toggle {
  display: inline-flex;
  background: var(--bg-inset);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.view-toggle button {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.view-toggle button.on {
  background: var(--bg-raised);
  color: var(--text-bright);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.875rem;
}

.card {
  display: block;
  background: var(--bg-raised);
  border-radius: var(--radius);
  overflow: hidden;
  color: inherit;
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.15s, transform 0.15s;
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
  color: inherit;
}

.card.deprecated {
  opacity: 0.65;
}

.card-media {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.card-monogram {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 800;
  color: rgb(255 255 255 / 0.85);
}

.card-body {
  padding: 0.875rem 1rem 1rem;
}

.card-title {
  font-size: 1rem;
  margin-bottom: 0.35rem;
}

.badge {
  display: inline-block;
  max-width: 100%;
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.72rem;
  line-height: 1.4;
  margin-bottom: 0.4rem;
  white-space: normal;
}

.badge-deprecated {
  background: var(--danger-bg);
  color: var(--danger-fg);
}

.badge-pricing {
  background: var(--success-bg);
  color: var(--success-fg);
}

.card-summary {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0.35rem 0;
}

.card-deprecation {
  font-size: 0.78rem;
  color: var(--warning-fg);
  font-style: italic;
  margin: 0.25rem 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.tag-pill-display {
  background: var(--pill-bg);
  color: var(--pill-fg);
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.72rem;
}
```

- [ ] **Step 8: Delete the placeholder**

```bash
rm public/images/placeholder.svg
grep -rn "placeholder.svg" src/
```

Expected: grep returns nothing.

- [ ] **Step 9: Verify in browser**

Run: `npm run dev`
- Compact mode (default): no image areas, dense grid, shadow-lifted cards, tinted badges, max 4 tag pills per card
- Visual mode: every card shows a gradient monogram (no broken images); the same entry always shows the same gradient across reloads
- Toggle survives a page reload (localStorage)
- Deprecated cards muted, deprecation reason visible

- [ ] **Step 10: Run all tests, build, commit**

Run: `npm test && npm run build` — expected: green.

```bash
git add src/utils/monogram.ts src/utils/monogram.test.ts src/components/ViewToggle.tsx src/components/CardGrid.tsx src/components/ProjectFilter.tsx src/styles/filter.css public/images/placeholder.svg
git commit -m "feat: compact/visual view toggle with gradient monogram fallback"
```

---

### Task 7: URL-synced filter state

**Files:**
- Create: `src/utils/filterState.ts`
- Test: `src/utils/filterState.test.ts`
- Modify: `src/components/ProjectFilter.tsx`

**Interfaces:**
- Consumes: `CATEGORIES` (Task 1)
- Produces: `interface FilterState { category: string; tags: string[] }`, `function parseFilterState(search: string, validTags: Set<string>): FilterState`, `function serializeFilterState(state: FilterState): string` (returns `""` for the default state, otherwise a query string without leading `?`)

- [ ] **Step 1: Write the failing test**

Create `src/utils/filterState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseFilterState, serializeFilterState } from "./filterState";

const VALID_TAGS = new Set(["free", "vr", "open-source"]);

describe("parseFilterState", () => {
  it("parses category and tags", () => {
    expect(parseFilterState("?cat=game-mods&tags=free,vr", VALID_TAGS)).toEqual({
      category: "game-mods",
      tags: ["free", "vr"],
    });
  });

  it("defaults on empty search", () => {
    expect(parseFilterState("", VALID_TAGS)).toEqual({ category: "all", tags: [] });
  });

  it("ignores unknown categories and tags", () => {
    expect(parseFilterState("?cat=bogus&tags=free,nope", VALID_TAGS)).toEqual({
      category: "all",
      tags: ["free"],
    });
  });
});

describe("serializeFilterState", () => {
  it("returns empty string for defaults", () => {
    expect(serializeFilterState({ category: "all", tags: [] })).toBe("");
  });

  it("serializes only what is set", () => {
    expect(serializeFilterState({ category: "hardware", tags: [] })).toBe("cat=hardware");
    expect(serializeFilterState({ category: "all", tags: ["free", "vr"] })).toBe(
      "tags=free%2Cvr",
    );
    expect(serializeFilterState({ category: "games", tags: ["free"] })).toBe(
      "cat=games&tags=free",
    );
  });

  it("round-trips", () => {
    const state = { category: "game-mods", tags: ["free", "vr"] };
    const qs = serializeFilterState(state);
    expect(parseFilterState(`?${qs}`, VALID_TAGS)).toEqual(state);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/filterState.test.ts`
Expected: FAIL — cannot resolve `./filterState`

- [ ] **Step 3: Write the implementation**

Create `src/utils/filterState.ts`:

```ts
import { CATEGORIES } from "./categories";

export interface FilterState {
  category: string;
  tags: string[];
}

const VALID_CATEGORY_SLUGS = new Set(CATEGORIES.map((c) => c.slug));

export function parseFilterState(search: string, validTags: Set<string>): FilterState {
  const params = new URLSearchParams(search);
  const cat = params.get("cat") ?? "all";
  const category = VALID_CATEGORY_SLUGS.has(cat) ? cat : "all";
  const tags = (params.get("tags") ?? "")
    .split(",")
    .filter((tag) => validTags.has(tag));
  return { category, tags };
}

export function serializeFilterState(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.category !== "all") params.set("cat", state.category);
  if (state.tags.length > 0) params.set("tags", state.tags.join(","));
  return params.toString();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/filterState.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Wire into `src/components/ProjectFilter.tsx`**

Add imports (`useEffect` joins the existing hooks import, `useMemo` is already there):

```tsx
import { useState, useMemo, useCallback, useEffect } from "preact/hooks";
import { parseFilterState, serializeFilterState } from "../utils/filterState";
```

Replace the `category`/`selectedTags` state declarations with URL-seeded initializers:

```tsx
const validTags = useMemo(() => new Set(projects.flatMap((p) => p.tags)), [projects]);

const initialState = useMemo(() => {
  if (typeof window === "undefined") return { category: "all", tags: [] as string[] };
  return parseFilterState(window.location.search, validTags);
}, [validTags]);

const [category, setCategory] = useState<string>(initialState.category);
const [selectedTags, setSelectedTags] = useState<string[]>(initialState.tags);
```

Add the write-back effect after the state declarations:

```tsx
useEffect(() => {
  if (typeof window === "undefined") return;
  const qs = serializeFilterState({ category, tags: selectedTags });
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}, [category, selectedTags]);
```

The `tagCounts` memo already derives every tag from `projects`; leave it, but reuse `validTags` in it to avoid recomputing the flatMap:

```tsx
const tagCounts = useMemo(() => {
  const counts = new Map<string, number>();
  for (const tag of validTags) {
    counts.set(tag, filtered.filter((p) => p.tags.includes(tag)).length);
  }
  return counts;
}, [validTags, filtered]);
```

- [ ] **Step 6: Verify in browser**

Run: `npm run dev`
- Select Game Mods + tag `vr` → address bar shows `/?cat=game-mods&tags=vr` without reloading
- Reload that URL → rail and tags restore, grid pre-filtered
- Load `/?cat=bogus&tags=vr,fake` → no errors, `vr` applied, category All
- Clear everything → URL returns to `/`

- [ ] **Step 7: Run all tests, build, commit**

Run: `npm test && npm run build` — expected: green.

```bash
git add src/utils/filterState.ts src/utils/filterState.test.ts src/components/ProjectFilter.tsx
git commit -m "feat: sync category and tag filters to URL query params"
```

---

### Task 8: Detail page and tag pages restyle

**Files:**
- Modify: `src/pages/projects/[...id].astro` (metadata block + scoped styles)
- Modify: `src/pages/tags/index.astro` (scoped styles)
- Modify: `src/pages/tags/[tag].astro` (scoped styles)

**Interfaces:**
- Consumes: design tokens (Task 2)
- Produces: nothing consumed downstream

- [ ] **Step 1: Restructure the detail page metadata**

In `src/pages/projects/[...id].astro`, replace the markup between `<h1>` and `<div class="content">` (keep frontmatter unchanged):

```astro
<ProjectLayout title={title}>
  <article class:list={[{ deprecated: isDeprecated }]}>
    <h1>{title}</h1>
    {isDeprecated && <span class="badge-deprecated">Deprecated</span>}
    {displayPricing && <span class="badge-pricing">{displayPricing}</span>}
    {displayDeprecationReason && (
      <p class="deprecation-reason">Deprecation Reason: {displayDeprecationReason}</p>
    )}

    <div class="meta">
      <a href={url} class="meta-link">Visit Project →</a>
      {repo && <a href={repo} class="meta-link">Source Code →</a>}
      {platforms && platforms.length > 0 && (
        <span class="meta-platforms">Platforms: {platforms.join(", ")}</span>
      )}
    </div>

    <div class="tags">
      {tags.map((tag) => (
        <a href={`/tags/${tag}`} class="tag-link">{tag}</a>
      ))}
    </div>

    <div class="content">
      <Content />
    </div>
  </article>
</ProjectLayout>
```

Replace the `<style>` block:

```css
article.deprecated {
  opacity: 0.8;
}
.badge-deprecated,
.badge-pricing {
  display: inline-block;
  padding: 0.15rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  margin: 0 0.5rem 0.5rem 0;
}
.badge-deprecated {
  background: var(--danger-bg);
  color: var(--danger-fg);
}
.badge-pricing {
  background: var(--success-bg);
  color: var(--success-fg);
}
.deprecation-reason {
  color: var(--warning-fg);
  font-style: italic;
  border-left: 3px solid var(--warning-fg);
  padding-left: 0.75rem;
  margin: 0.75rem 0;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  align-items: baseline;
  background: var(--bg-raised);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 0.875rem 1.25rem;
  margin: 1.25rem 0;
}
.meta-link {
  font-weight: 500;
}
.meta-platforms {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1rem 0;
}
.tag-link {
  background: var(--pill-bg);
  color: var(--pill-fg);
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.82rem;
}
.tag-link:hover {
  color: var(--text-bright);
}
.content {
  margin-top: 2rem;
  line-height: 1.6;
}
```

- [ ] **Step 2: Restyle `src/pages/tags/index.astro`**

Replace the `<style>` block:

```css
.tag-index {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.tag-index-item {
  background: var(--pill-bg);
  color: var(--pill-fg);
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  transition: background 0.15s, color 0.15s;
}
.tag-index-item:hover {
  background: var(--accent);
  color: #fff;
}
.tag-count {
  font-size: 0.78rem;
  opacity: 0.7;
}
```

- [ ] **Step 3: Restyle `src/pages/tags/[tag].astro`**

Replace the `<style>` block:

```css
.tag-projects {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.tag-project-card {
  background: var(--bg-raised);
  border-radius: var(--radius);
  box-shadow: var(--shadow-card);
  padding: 1rem 1.25rem;
}
.tag-project-card.deprecated {
  opacity: 0.65;
}
.tag-project-card h3 {
  margin: 0 0 0.35rem;
}
.tag-project-card p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0.35rem 0;
}
.badge-deprecated {
  display: inline-block;
  background: var(--danger-bg);
  color: var(--danger-fg);
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
}
.tag-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.5rem;
}
.tag-pill {
  background: var(--pill-bg);
  color: var(--pill-fg);
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
}
.tag-pill:hover {
  color: var(--text-bright);
}
.tag-pill.active {
  background: var(--accent);
  color: #fff;
}
```

- [ ] **Step 4: Confirm no retired tokens remain**

```bash
grep -rn "var(--bg-card)\|var(--border)\|var(--tag-bg\|var(--success)\|var(--warning)\|var(--danger)" src/
```

Expected: no matches.

- [ ] **Step 5: Verify in browser**

Run: `npm run dev`
- Open any project detail page: metadata card (links, platforms), tinted badges, pill tags
- Open a deprecated project: muted article, tinted deprecated badge, warning-tinted reason
- `/tags/` and `/tags/free`: pills and raised cards match the index styling

- [ ] **Step 6: Build and commit**

Run: `npm run build` — expected: green.

```bash
git add src/pages/projects src/pages/tags
git commit -m "feat: restyle detail and tag pages to soft-elevation tokens"
```

---

### Task 9: Full verification and test plan update

**Files:**
- Modify: `docs/test-plans/` (add/update manual test plan for the new UI)

**Interfaces:**
- Consumes: everything
- Produces: nothing

- [ ] **Step 1: Full automated gate**

```bash
npm test && npm run build && npm run validate-readme-parity
```

Expected: all green. `git status` shows no unexpected changes to `README.md`.

- [ ] **Step 2: Browser golden paths**

Run `npm run dev` and verify at 1200px, 768px, and 375px widths:

1. Index loads: rail (All 189 … Deprecated 29), 12 tag pills + expander, compact cards
2. Category Game Mods → 58 shown; add tag `vr` → counts drop; URL reflects both
3. Reload the filtered URL → state restores
4. Toggle Visual → gradient monograms, no broken images; reload → still Visual
5. All view → deprecated cards last and muted
6. Pagefind search for "saber" → results link to detail page
7. Detail page and `/tags/` pages match the theme
8. 375px: rail scrolls horizontally, cards single column, toolbar wraps sanely

- [ ] **Step 3: Update the manual test plan**

Check `docs/test-plans/` for the existing site test plan and extend it with the golden paths from Step 2 (category rail, view toggle, URL restore, tag expander). Follow the existing document's format.

- [ ] **Step 4: Commit**

```bash
git add docs/test-plans
git commit -m "docs: extend test plan with visual overhaul golden paths"
```
