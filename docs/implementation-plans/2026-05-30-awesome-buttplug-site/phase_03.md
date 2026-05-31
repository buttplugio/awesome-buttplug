# Awesome Buttplug Site Implementation Plan — Phase 3: Card Grid & Detail Pages

**Goal:** Entries render as cards on the main page and as individual detail pages at `/projects/{id}`. Deprecated entries display with visual distinction.

**Architecture:** Astro static pages querying the content collection. `ProjectCard.astro` renders each entry as a card. Dynamic route `[...id].astro` generates detail pages. Minimal CSS for layout (full polish in Phase 8).

**Tech Stack:** Astro 6 (`getCollection`, `render` from `astro:content`), CSS

**Scope:** 8 phases from original design (this is phase 3 of 8)

**Codebase verified:** 2026-05-30 — Phase 1 creates BaseLayout with header/main/footer slot structure. Phase 2 creates content collection at `src/content.config.ts` with 13 seed entries and the `projects` collection using `glob()` loader.

**IMPORTANT: Astro 6 API notes.** `render()` is a standalone function import from `astro:content`, not `entry.render()`. Entries use `id` (from filename), not `slug`.

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC3: Card display and detail pages
- **awesome-buttplug-site.AC3.1 Success:** Cards display title, summary, tag pills, placeholder image, and pricing/status badge when available
- **awesome-buttplug-site.AC3.2 Success:** Clicking a card navigates to `/projects/{slug}` showing full markdown body and metadata
- **awesome-buttplug-site.AC3.3 Success:** Detail page displays clickable tag links

### awesome-buttplug-site.AC5: Deprecated entries
- **awesome-buttplug-site.AC5.1 Success:** Entries tagged `deprecated` display with visual distinction (badge, muted styling, deprecation reason shown)

---

<!-- START_TASK_1 -->
### Task 1: Add placeholder image

**Files:**
- Create: `public/images/placeholder.svg`

**Step 1: Create placeholder SVG**

Create `public/images/placeholder.svg` — a simple SVG placeholder with the Buttplug project colours. This is a minimal vector graphic, not a raster image.

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
  <rect width="300" height="200" fill="#1a1a2e"/>
  <text x="150" y="100" font-family="system-ui, sans-serif" font-size="16" fill="#e94560" text-anchor="middle" dominant-baseline="middle">Awesome Buttplug</text>
</svg>
```

**Step 2: Commit**

```bash
git add public/images/placeholder.svg
git commit -m "chore: add placeholder image for project cards"
```
<!-- END_TASK_1 -->

<!-- START_SUBCOMPONENT_A (tasks 2-3) -->
<!-- START_TASK_2 -->
### Task 2: Create ProjectCard component

**Verifies:** awesome-buttplug-site.AC3.1, awesome-buttplug-site.AC5.1

**Files:**
- Create: `src/components/ProjectCard.astro`

**Step 1: Create the card component**

The component receives project data as props and renders a card with title, summary, tag pills, placeholder image, and pricing badge. Deprecated entries get muted styling and a deprecation badge.

```astro
---
interface Props {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  image?: string;
  pricing?: string;
  deprecation_reason?: string;
}

const { id, title, summary, tags, image, pricing, deprecation_reason } = Astro.props;
const isDeprecated = tags.includes("deprecated");
const cardImage = image || "/images/placeholder.svg";
---

<a href={`/projects/${id}`} class:list={["card", { deprecated: isDeprecated }]}>
  <img src={cardImage} alt={title} class="card-image" loading="lazy" />
  <div class="card-body">
    <h3 class="card-title">{title}</h3>
    {isDeprecated && <span class="badge badge-deprecated">Deprecated</span>}
    {pricing && !isDeprecated && <span class="badge badge-pricing">{pricing}</span>}
    <p class="card-summary">{summary}</p>
    {deprecation_reason && (
      <p class="card-deprecation">{deprecation_reason}</p>
    )}
    <div class="card-tags">
      {tags.filter(t => t !== "deprecated").map(tag => (
        <span class="tag-pill">{tag}</span>
      ))}
    </div>
  </div>
</a>

<style>
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
  .tag-pill {
    background: #2a2a4a;
    color: #aaa;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.75rem;
  }
</style>
```

**Step 2: Commit**

```bash
git add src/components/ProjectCard.astro
git commit -m "feat: add ProjectCard component with deprecated styling"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Update index page with card grid

**Verifies:** awesome-buttplug-site.AC3.1, awesome-buttplug-site.AC5.1

**Files:**
- Modify: `src/pages/index.astro` (replace placeholder content from Phase 1)

**Step 1: Replace index.astro with card grid**

Replace the entire content of `src/pages/index.astro`:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import ProjectCard from "../components/ProjectCard.astro";
import { getCollection } from "astro:content";

const projects = await getCollection("projects");
---

<BaseLayout title="Home">
  <h1>Awesome Buttplug</h1>
  <p>A curated list of awesome projects using the Buttplug sex toy control protocol.</p>
  <div class="card-grid">
    {projects.map((project) => (
      <ProjectCard
        id={project.id}
        title={project.data.title}
        summary={project.data.summary}
        tags={project.data.tags}
        image={project.data.image}
        pricing={project.data.pricing}
        deprecation_reason={project.data.deprecation_reason}
      />
    ))}
  </div>
</BaseLayout>

<style>
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }
</style>
```

**Step 2: Verify dev server shows cards**

Run: `npm run dev`
Expected: Index page shows 13 cards in a grid layout. The "In Heat Overwatch Mod" card displays with muted styling and a red "Deprecated" badge.

**Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: render project cards on index page"
```
<!-- END_TASK_3 -->
<!-- END_SUBCOMPONENT_A -->

<!-- START_SUBCOMPONENT_B (tasks 4-5) -->
<!-- START_TASK_4 -->
### Task 4: Create ProjectLayout and detail pages

**Verifies:** awesome-buttplug-site.AC3.2, awesome-buttplug-site.AC3.3, awesome-buttplug-site.AC5.1

**Files:**
- Create: `src/layouts/ProjectLayout.astro`
- Create: `src/pages/projects/[...id].astro`

**Step 1: Create ProjectLayout**

`ProjectLayout` wraps `BaseLayout` — it does NOT duplicate the HTML shell. This ensures Matomo, global CSS, favicon, and any future head additions only need to be maintained in one place.

```astro
---
import BaseLayout from "./BaseLayout.astro";

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<BaseLayout title={title}>
  <slot />
</BaseLayout>
```

**Step 2: Create the dynamic route page**

`src/pages/projects/[...id].astro`:

```astro
---
import ProjectLayout from "../../layouts/ProjectLayout.astro";
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return projects.map((project) => ({
    params: { id: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await render(project);
const { title, url, repo, tags, pricing, platforms, deprecation_reason } = project.data;
const isDeprecated = tags.includes("deprecated");
---

<ProjectLayout title={title}>
  <article class:list={[{ deprecated: isDeprecated }]}>
    <h1>{title}</h1>
    {isDeprecated && <span class="badge badge-deprecated">Deprecated</span>}
    {pricing && <p class="pricing">{pricing}</p>}
    {deprecation_reason && (
      <p class="deprecation-reason">Deprecation Reason: {deprecation_reason}</p>
    )}

    <div class="meta">
      <p><a href={url}>Visit Project →</a></p>
      {repo && <p><a href={repo}>Source Code →</a></p>}
      {platforms && platforms.length > 0 && (
        <p>Platforms: {platforms.join(", ")}</p>
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

<style>
  article.deprecated {
    opacity: 0.8;
  }
  .badge-deprecated {
    display: inline-block;
    background: #dc3545;
    color: white;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }
  .pricing {
    color: #28a745;
    font-weight: bold;
  }
  .deprecation-reason {
    color: #f0ad4e;
    font-style: italic;
    border-left: 3px solid #f0ad4e;
    padding-left: 0.75rem;
  }
  .meta {
    margin: 1rem 0;
  }
  .meta a {
    color: #e94560;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1rem 0;
  }
  .tag-link {
    background: #2a2a4a;
    color: #aaa;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .tag-link:hover {
    background: #3a3a5a;
    color: #fff;
  }
  .content {
    margin-top: 2rem;
    line-height: 1.6;
  }
</style>
```

**Step 3: Commit**

```bash
git add src/layouts/ProjectLayout.astro src/pages/projects/
git commit -m "feat: add project detail pages with metadata and tag links"
```
<!-- END_TASK_4 -->

<!-- START_TASK_5 -->
### Task 5: Verify card grid and detail pages

**Verifies:** awesome-buttplug-site.AC3.1, awesome-buttplug-site.AC3.2, awesome-buttplug-site.AC3.3, awesome-buttplug-site.AC5.1

**Step 1: Verify build succeeds**

Run: `npm run build`
Expected: Build completes. Static pages generated for index and all 13 project detail pages.

**Step 2: Verify with dev server**

Run: `npm run dev`

Verify the following manually:
- Index page shows 13 cards with title, summary, tags, placeholder image
- The "In Heat Overwatch Mod" card shows deprecation styling (muted, red badge)
- Cards with `pricing` data show a green pricing badge
- Clicking any card navigates to `/projects/{id}` (e.g., `/projects/intiface-central`)
- Detail page shows full metadata, markdown body, and clickable tag links
- Tag links point to `/tags/{tag}` (these pages don't exist yet — expected 404)

**Step 3: No commit needed — verification only**
<!-- END_TASK_5 -->
<!-- END_SUBCOMPONENT_B -->
