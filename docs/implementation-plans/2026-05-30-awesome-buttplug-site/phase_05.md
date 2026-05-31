# Awesome Buttplug Site Implementation Plan — Phase 5: Tag Pages & Search

**Goal:** Generate static tag index pages for SEO/direct linking and integrate Pagefind client-side search in the site header.

**Architecture:** Static tag pages generated via `getStaticPaths()` from content collection data. Pagefind indexes the built HTML output via `astro-pagefind` integration (post-build step already configured in Phase 1). Search UI added to BaseLayout header.

**Tech Stack:** Astro 6 (`getStaticPaths`, `getCollection`), Pagefind (prebuilt UI), astro-pagefind integration

**Scope:** 8 phases from original design (this is phase 5 of 8)

**Codebase verified:** 2026-05-30 — Phase 1 configured `astro-pagefind` integration in `astro.config.ts`. Phase 4 provides the Preact filtering island. Tag data is available from content collection. BaseLayout.astro has a simple header with nav.

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC4: Tag-based filtering
- **awesome-buttplug-site.AC4.5 Success:** Static tag pages at `/tags/{tag}` list all entries with that tag

### awesome-buttplug-site.AC6: Search
- **awesome-buttplug-site.AC6.1 Success:** Pagefind search bar in header finds entries by text content
- **awesome-buttplug-site.AC6.2 Success:** Search results link to the correct detail page

---

<!-- START_TASK_1 -->
### Task 1: Create tag index page

**Verifies:** awesome-buttplug-site.AC4.5

**Files:**
- Create: `src/pages/tags/index.astro`

**Step 1: Create the tag listing page**

This page lists all tags across all project entries with counts, linking to each tag's dedicated page.

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

const projects = await getCollection("projects");

const tagCounts = new Map<string, number>();
for (const project of projects) {
  for (const tag of project.data.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
}

const sortedTags = Array.from(tagCounts.entries()).sort(([a], [b]) =>
  a.localeCompare(b)
);
---

<BaseLayout title="All Tags">
  <h1>Tags</h1>
  <div class="tag-index">
    {sortedTags.map(([tag, count]) => (
      <a href={`/tags/${tag}`} class="tag-index-item">
        {tag} <span class="tag-count">({count})</span>
      </a>
    ))}
  </div>
</BaseLayout>

<style>
  .tag-index {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  .tag-index-item {
    background: #2a2a4a;
    color: #ccc;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.95rem;
    transition: background 0.15s;
  }
  .tag-index-item:hover {
    background: #e94560;
    color: white;
  }
  .tag-count {
    font-size: 0.8rem;
    opacity: 0.7;
  }
</style>
```

**Step 2: Commit**

```bash
git add src/pages/tags/index.astro
git commit -m "feat: add tag index page listing all tags with counts"
```
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create per-tag static pages

**Verifies:** awesome-buttplug-site.AC4.5

**Files:**
- Create: `src/pages/tags/[tag].astro`

**Step 1: Create the dynamic tag page**

Each tag gets a static page at `/tags/{tag}` listing all projects with that tag.

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  const allTags = new Set(projects.flatMap((p) => p.data.tags));

  return Array.from(allTags).map((tag) => ({
    params: { tag },
    props: {
      tag,
      projects: projects.filter((p) => p.data.tags.includes(tag)),
    },
  }));
}

const { tag, projects } = Astro.props;
---

<BaseLayout title={`Tag: ${tag}`}>
  <h1>Tag: {tag}</h1>
  <p>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
  <a href="/tags">← All Tags</a>

  <div class="tag-projects">
    {projects.map((project) => {
      const isDeprecated = project.data.tags.includes("deprecated");
      return (
        <div class:list={["tag-project-card", { deprecated: isDeprecated }]}>
          <h3>
            <a href={`/projects/${project.id}`}>{project.data.title}</a>
          </h3>
          {isDeprecated && <span class="badge-deprecated">Deprecated</span>}
          <p>{project.data.summary}</p>
          <div class="tag-pills">
            {project.data.tags.map((t) => (
              <a
                href={`/tags/${t}`}
                class:list={["tag-pill", { active: t === tag }]}
              >
                {t}
              </a>
            ))}
          </div>
        </div>
      );
    })}
  </div>
</BaseLayout>

<style>
  .tag-projects {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .tag-project-card {
    border: 1px solid #333;
    border-radius: 8px;
    padding: 1rem;
  }
  .tag-project-card.deprecated {
    opacity: 0.7;
  }
  .tag-project-card h3 {
    margin: 0 0 0.5rem;
  }
  .tag-project-card h3 a {
    color: #e94560;
    text-decoration: none;
  }
  .tag-project-card p {
    color: #ccc;
    font-size: 0.9rem;
    margin: 0.5rem 0;
  }
  .badge-deprecated {
    display: inline-block;
    background: #dc3545;
    color: white;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.75rem;
  }
  .tag-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-top: 0.5rem;
  }
  .tag-pill {
    background: #2a2a4a;
    color: #aaa;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    font-size: 0.75rem;
    text-decoration: none;
  }
  .tag-pill:hover {
    background: #3a3a5a;
    color: #fff;
  }
  .tag-pill.active {
    background: #e94560;
    color: white;
  }
</style>
```

**Step 2: Verify tag pages build**

Run: `npm run build`
Expected: Static pages generated for each unique tag across the 13 seed entries.

**Step 3: Commit**

```bash
git add src/pages/tags/
git commit -m "feat: add per-tag static pages via getStaticPaths"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Add Pagefind search bar to header

**Verifies:** awesome-buttplug-site.AC6.1, awesome-buttplug-site.AC6.2

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (add Pagefind UI to header)

**Step 1: Add Pagefind search UI to BaseLayout**

The `astro-pagefind` integration (configured in Phase 1's `astro.config.ts`) handles indexing at build time. We add the Pagefind prebuilt UI to the header.

Update `src/layouts/BaseLayout.astro` — add the Pagefind CSS link in `<head>` and the search div + script in the header:

```astro
---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} | Awesome Buttplug</title>
    <link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Awesome Buttplug</a>
        <a href="/tags">Tags</a>
      </nav>
      <div id="search"></div>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>A curated list of awesome projects using the Buttplug protocol.</p>
    </footer>
	    <script is:inline src="/pagefind/pagefind-ui.js"></script>
	    <script is:inline>
	      window.addEventListener('DOMContentLoaded', () => {
	        if (window.PagefindUI) {
	          new window.PagefindUI({
	            element: "#search",
	            showSubResults: true,
	            showImages: false,
	          });
	        }
	      });
	    </script>
  </body>
</html>
```

**Step 2: Verify search works after build**

Search requires a full build (Pagefind indexes the `dist/` output).

Run: `npm run build`
Run: `npm run preview`

Verify:
- Search bar appears in the header on all pages
- Typing a project name returns relevant results
- Clicking a search result navigates to the correct project detail page

Note: During `npm run dev`, the Pagefind assets and index may not exist. The guard around `window.PagefindUI` prevents a runtime error; search only works against a built site.

**Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add Pagefind search bar to site header"
```
<!-- END_TASK_3 -->
