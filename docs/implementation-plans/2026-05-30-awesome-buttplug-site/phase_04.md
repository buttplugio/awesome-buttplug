# Awesome Buttplug Site Implementation Plan — Phase 4: Tag Filtering (Preact Island)

**Goal:** Replace the static card grid on the index page with an interactive Preact island that provides tag-based AND filtering. The island receives all project data as serialized props at build time and manages filter state client-side.

**Architecture:** Single Preact island hydrated with `client:visible`. Three components: `ProjectFilter.tsx` (orchestrator), `TagBar.tsx` (tag pills with counts), `CardGrid.tsx` (filtered cards). All project data is serialized into props at build time — no client-side data fetching.

**Tech Stack:** Preact (hooks: useState, useMemo, useCallback), Astro islands (`client:visible`), TypeScript (.tsx)

**Scope:** 8 phases from original design (this is phase 4 of 8)

**Codebase verified:** 2026-05-30 — Phase 3 creates `ProjectCard.astro` and a static card grid on index.astro. This phase replaces the static grid with an interactive Preact island. The `ProjectCard.astro` component becomes a reference for styling but won't be used directly by the island (Preact components can't embed Astro components).

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC4: Tag-based filtering
- **awesome-buttplug-site.AC4.1 Success:** Tag bar displays all tags present across entries
- **awesome-buttplug-site.AC4.2 Success:** Clicking a tag filters cards to show only entries matching that tag
- **awesome-buttplug-site.AC4.3 Success:** Clicking multiple tags filters with AND logic (entries must match ALL selected tags)
- **awesome-buttplug-site.AC4.4 Success:** Clearing all tag selections shows all entries

---

<!-- START_TASK_1 -->
### Task 1: Create shared types for project data

**Files:**
- Create: `src/types.ts`

**Step 1: Define the serializable project type**

This type represents the project data shape passed as props to the Preact island. It mirrors the content collection schema but only includes fields needed for card display and filtering.

```typescript
export interface ProjectEntry {
  id: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  image?: string;
  pricing?: string;
  deprecation_reason?: string;
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared ProjectEntry type for island props"
```
<!-- END_TASK_1 -->

<!-- START_SUBCOMPONENT_A (tasks 2-4) -->
<!-- START_TASK_2 -->
### Task 2: Create TagBar Preact component

**Verifies:** awesome-buttplug-site.AC4.1

**Files:**
- Create: `src/components/TagBar.tsx`

**Step 1: Create the tag bar component**

Displays all tags as toggleable pills with filtered counts. Tags that would produce zero results when added to the current selection are dimmed.

```tsx
import type { FunctionalComponent } from "preact";
import { useCallback } from "preact/hooks";

interface Props {
  tags: Map<string, number>;
  selected: string[];
  onToggle: (tag: string) => void;
  onClear: () => void;
}

const TagBar: FunctionalComponent<Props> = ({ tags, selected, onToggle, onClear }) => {
  return (
    <div class="tag-bar">
      {selected.length > 0 && (
        <button class="tag-clear" onClick={onClear}>
          Clear filters
        </button>
      )}
      <div class="tag-list">
        {Array.from(tags.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([tag, count]) => {
            const isActive = selected.includes(tag);
            return (
              <button
                key={tag}
                class={`tag-pill ${isActive ? "active" : ""} ${count === 0 && !isActive ? "dimmed" : ""}`}
                onClick={() => onToggle(tag)}
              >
                {tag} <span class="tag-count">({count})</span>
              </button>
            );
          })}
      </div>
    </div>
  );
};

export default TagBar;
```

**Step 2: Commit**

```bash
git add src/components/TagBar.tsx
git commit -m "feat: add TagBar Preact component"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Create CardGrid Preact component

**Verifies:** awesome-buttplug-site.AC4.2

**Files:**
- Create: `src/components/CardGrid.tsx`

**Step 1: Create the card grid component**

Renders the filtered list of projects as cards. This is the Preact equivalent of the ProjectCard.astro component — needed because Preact islands cannot use Astro components.

```tsx
import type { FunctionalComponent } from "preact";
import type { ProjectEntry } from "../types";

interface Props {
  projects: ProjectEntry[];
}

const CardGrid: FunctionalComponent<Props> = ({ projects }) => {
  if (projects.length === 0) {
    return <p class="no-results">No projects match the selected filters.</p>;
  }

  return (
    <div class="card-grid">
      {projects.map((project) => {
        const isDeprecated = project.tags.includes("deprecated");
        const cardImage = project.image || "/images/placeholder.svg";

        return (
          <a
            key={project.id}
            href={`/projects/${project.id}`}
            class={`card ${isDeprecated ? "deprecated" : ""}`}
          >
            <img src={cardImage} alt={project.title} class="card-image" loading="lazy" />
            <div class="card-body">
              <h3 class="card-title">{project.title}</h3>
              {isDeprecated && <span class="badge badge-deprecated">Deprecated</span>}
              {project.pricing && !isDeprecated && (
                <span class="badge badge-pricing">{project.pricing}</span>
              )}
              <p class="card-summary">{project.summary}</p>
              {project.deprecation_reason && (
                <p class="card-deprecation">{project.deprecation_reason}</p>
              )}
              <div class="card-tags">
                {project.tags
                  .filter((t) => t !== "deprecated")
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

**Step 2: Commit**

```bash
git add src/components/CardGrid.tsx
git commit -m "feat: add CardGrid Preact component"
```
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Create ProjectFilter orchestrator and update index page

**Verifies:** awesome-buttplug-site.AC4.1, awesome-buttplug-site.AC4.2, awesome-buttplug-site.AC4.3, awesome-buttplug-site.AC4.4

**Files:**
- Create: `src/components/ProjectFilter.tsx`
- Modify: `src/pages/index.astro` (replace static grid with Preact island)

**Step 1: Create the ProjectFilter component**

This is the top-level Preact island. It receives all project data as props, manages selected tag state, computes filtered projects, and renders TagBar + CardGrid.

```tsx
import type { FunctionalComponent } from "preact";
import { useState, useMemo, useCallback } from "preact/hooks";
import type { ProjectEntry } from "../types";
import TagBar from "./TagBar";
import CardGrid from "./CardGrid";

interface Props {
  projects: ProjectEntry[];
}

const ProjectFilter: FunctionalComponent<Props> = ({ projects }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (selectedTags.length === 0) return projects;
    return projects.filter((p) =>
      selectedTags.every((tag) => p.tags.includes(tag))
    );
  }, [projects, selectedTags]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const allTags = new Set(projects.flatMap((p) => p.tags));
    for (const tag of allTags) {
      const wouldMatch = filtered.filter((p) => p.tags.includes(tag)).length;
      counts.set(tag, wouldMatch);
    }
    return counts;
  }, [projects, filtered]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const clearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  return (
    <div>
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

**Step 2: Update index.astro to use the Preact island**

Replace the entire content of `src/pages/index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ProjectFilter from "../components/ProjectFilter";
import { getCollection } from "astro:content";
import type { ProjectEntry } from "../types";

const rawProjects = await getCollection("projects");
const projects: ProjectEntry[] = rawProjects.map((p) => ({
  id: p.id,
  title: p.data.title,
  url: p.data.url,
  summary: p.data.summary,
  tags: p.data.tags,
  image: p.data.image,
  pricing: p.data.pricing,
  deprecation_reason: p.data.deprecation_reason,
}));
---

<BaseLayout title="Home">
  <h1>Awesome Buttplug</h1>
  <p>A curated list of awesome projects using the Buttplug sex toy control protocol.</p>
  <ProjectFilter client:visible projects={projects} />
</BaseLayout>
```

**Step 3: Verify interactive filtering works**

Run: `npm run dev`

Verify:
- Tag bar displays all tags from seed entries, sorted alphabetically
- Clicking a tag highlights it and filters cards to show only matching projects
- Clicking a second tag applies AND logic (both tags must match)
- Result count updates (e.g., "Showing 3 of 13 projects")
- Clicking an active tag deselects it
- "Clear filters" button appears when tags are selected and resets to showing all
- Deprecated entries still display with muted styling

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds. The Preact island is bundled for client-side hydration.

**Step 5: Commit**

```bash
git add src/components/ProjectFilter.tsx src/pages/index.astro
git commit -m "feat: add interactive tag filtering with Preact island"
```
<!-- END_TASK_4 -->
<!-- END_SUBCOMPONENT_A -->

<!-- START_TASK_5 -->
### Task 5: Add CSS for tag bar and card grid

**Files:**
- Create: `src/styles/filter.css`
- Modify: `src/components/ProjectFilter.tsx` (import stylesheet)

**Step 1: Create the filter stylesheet**

Create `src/styles/filter.css` with styles for the tag bar, card grid, and interactive states. These styles will be imported by the Preact island.

```css
.tag-bar {
  margin-bottom: 1rem;
}

.tag-clear {
  background: #e94560;
  color: white;
  border: none;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tag-pill {
  background: #2a2a4a;
  color: #aaa;
  border: 1px solid #333;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.15s;
}

.tag-pill:hover {
  border-color: #e94560;
  color: #fff;
}

.tag-pill.active {
  background: #e94560;
  color: white;
  border-color: #e94560;
}

.tag-pill.dimmed {
  opacity: 0.4;
}

.tag-count {
  font-size: 0.7rem;
  opacity: 0.7;
}

.result-count {
  font-size: 0.9rem;
  color: #888;
  margin: 1rem 0;
}

.no-results {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 3rem 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  display: block;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s;
}

.card:hover {
  border-color: #e94560;
}

.card.deprecated {
  opacity: 0.7;
}

.card-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.card-body {
  padding: 1rem;
}

.card-title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.badge-deprecated {
  background: #dc3545;
  color: white;
}

.badge-pricing {
  background: #28a745;
  color: white;
}

.card-summary {
  font-size: 0.9rem;
  color: #ccc;
  margin: 0.5rem 0;
}

.card-deprecation {
  font-size: 0.8rem;
  color: #f0ad4e;
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
  background: #2a2a4a;
  color: #aaa;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.75rem;
}
```

**Step 2: Import the stylesheet in index.astro (NOT the Preact component)**

CSS imports in Preact island components may not be bundled correctly by Astro's hydration system. Import the stylesheet in the Astro page that hosts the island instead.

Add this import to the frontmatter of `src/pages/index.astro`:

```astro
---
import "../styles/filter.css";
---
```

**Step 3: Commit**

```bash
git add src/styles/filter.css src/pages/index.astro
git commit -m "feat: add CSS for tag filtering and card grid"
```
<!-- END_TASK_5 -->
