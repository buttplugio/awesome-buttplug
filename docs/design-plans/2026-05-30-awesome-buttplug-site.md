# Awesome Buttplug Site Design

## Summary

The awesome-buttplug project currently exists as a single handwritten README following the "awesome list" convention — a flat markdown file with ~196 entries grouped into sections. This design replaces that with an Astro-based static site that treats each project entry as a structured data file, enabling browsing, filtering, and search features that a plain markdown file cannot support. Visitors will be able to explore the Buttplug ecosystem through a card grid with tag-based filtering and full-text search, and drill into per-project detail pages. The site is fully static: no server, no database.

The implementation migrates each entry from the README into an individual markdown file with YAML frontmatter validated at build time by a Zod schema. Interactive filtering on the main page is handled by a small Preact island (hydrated client-side), keeping the rest of the site as plain static HTML. To preserve the existing GitHub audience, a build script regenerates the root README.md from the same entry data on each build, so the repo continues to render as a standard awesome list for anyone browsing it directly on GitHub.

## Definition of Done
- Astro static site rendering ~196 Buttplug ecosystem projects as searchable, tag-filterable cards
- One markdown+frontmatter file per project entry with structured metadata (name, URL, repo, platform, pricing, description, tags, image)
- Flat tag system — entries tagged freely with any combination of tags (type, platform, game, deprecated, etc.)
- Main browse page with tag cloud/filter bar to narrow displayed entries
- Detail page per project accessible by clicking a card
- "deprecated" is just another tag, visually distinguished on cards
- Pagefind-powered client-side search across all entries
- Build step generates a README.md in the repo root matching the current awesome-list markdown format, derived from the same entry data
- Matomo analytics integrated (metrics.nonpolynomial.com, new site ID)
- Placeholder images used where card images would go

## Acceptance Criteria

### awesome-buttplug-site.AC1: Site builds and serves as static output
- **awesome-buttplug-site.AC1.1 Success:** `npm run build` produces static HTML in `dist/` with no server required
- **awesome-buttplug-site.AC1.2 Success:** `npm run dev` starts local dev server with hot reload
- **awesome-buttplug-site.AC1.3 Failure:** Build fails with clear error when Zod schema validation rejects a malformed entry

### awesome-buttplug-site.AC2: Entry data model
- **awesome-buttplug-site.AC2.1 Success:** Entry with all required fields (title, url, tags, pricing, description) passes schema validation
- **awesome-buttplug-site.AC2.2 Failure:** Entry missing required field fails build with descriptive error
- **awesome-buttplug-site.AC2.3 Success:** Entry with optional fields omitted (repo, image, deprecation_reason) builds successfully with defaults applied
- **awesome-buttplug-site.AC2.4 Success:** All ~196 entries from current README exist as individual `.md` files and pass validation

### awesome-buttplug-site.AC3: Card display and detail pages
- **awesome-buttplug-site.AC3.1 Success:** Cards display title, description, tag pills, placeholder image, and pricing badge
- **awesome-buttplug-site.AC3.2 Success:** Clicking a card navigates to `/projects/{slug}` showing full markdown body and metadata
- **awesome-buttplug-site.AC3.3 Success:** Detail page displays clickable tag links

### awesome-buttplug-site.AC4: Tag-based filtering
- **awesome-buttplug-site.AC4.1 Success:** Tag bar displays all tags present across entries
- **awesome-buttplug-site.AC4.2 Success:** Clicking a tag filters cards to show only entries matching that tag
- **awesome-buttplug-site.AC4.3 Success:** Clicking multiple tags filters with AND logic (entries must match ALL selected tags)
- **awesome-buttplug-site.AC4.4 Success:** Clearing all tag selections shows all entries
- **awesome-buttplug-site.AC4.5 Success:** Static tag pages at `/tags/{tag}` list all entries with that tag

### awesome-buttplug-site.AC5: Deprecated entries
- **awesome-buttplug-site.AC5.1 Success:** Entries tagged `deprecated` display with visual distinction (badge, muted styling, deprecation reason shown)

### awesome-buttplug-site.AC6: Search
- **awesome-buttplug-site.AC6.1 Success:** Pagefind search bar in header finds entries by text content
- **awesome-buttplug-site.AC6.2 Success:** Search results link to the correct detail page

### awesome-buttplug-site.AC7: README generation
- **awesome-buttplug-site.AC7.1 Success:** `npm run generate-readme` produces a README.md with section hierarchy matching `readme-order.yaml`
- **awesome-buttplug-site.AC7.2 Success:** Each entry appears in the correct section formatted as name-link + indented bullet points
- **awesome-buttplug-site.AC7.3 Warning:** Entries not matching any section in ordering config produce a build warning

### awesome-buttplug-site.AC8: Analytics and polish
- **awesome-buttplug-site.AC8.1 Success:** Matomo tracking script loads on all pages with correct site ID
- **awesome-buttplug-site.AC8.2 Success:** Site is responsive on mobile and desktop viewports

## Glossary

- **Astro**: A static site framework that renders pages to HTML at build time. Supports "islands" of interactive JavaScript embedded in otherwise static pages.
- **Preact**: A lightweight alternative to React; used here to provide the interactive tag-filtering component without a heavy JavaScript bundle.
- **Island (Astro island)**: A self-contained interactive component hydrated on the client inside an otherwise static HTML page. `client:visible` means hydration is deferred until the element enters the viewport.
- **Content Collections (Astro)**: Astro's built-in API for treating a folder of markdown/frontmatter files as a typed, queryable data source, with schema validation at build time.
- **Zod**: A TypeScript-first schema validation library. Used here to define and enforce the required shape of each project entry's frontmatter.
- **Frontmatter**: YAML metadata block at the top of a markdown file, delimited by `---`. Astro's Content Collections reads this as structured data.
- **Pagefind**: A static search library that indexes the built HTML output and provides a client-side search UI with no server required.
- **Matomo**: An open-source web analytics platform (self-hosted). This project reuses an existing instance at metrics.nonpolynomial.com.
- **Awesome list**: A community convention for curated GitHub repositories (formatted as a README) that list resources around a specific topic.
- **`getStaticPaths()`**: An Astro API function used in dynamic route files to enumerate all paths that should be pre-rendered at build time (e.g. one page per tag).
- **Slug**: A URL-safe identifier derived from a project's name, used to form paths like `/projects/{slug}`.
- **readme-order.yaml**: A manual configuration file that maps tags to README section names and their ordering, used by the README generation script to reconstruct the original awesome-list structure.
- **AND logic (tag filtering)**: When multiple tags are selected, only entries that carry all selected tags are shown — not entries matching any one of them.
- **Docusaurus**: A React-based documentation site framework (mentioned only as context for the sibling project `docs.intiface.com`; not used here).

## Architecture

Astro static site with Preact islands for interactive filtering. All project data lives as individual markdown files with YAML frontmatter, validated by Zod schemas via Astro's Content Collections API.

### Data Layer

Each project is a markdown file in `src/content/projects/{slug}.md`. Frontmatter contains structured metadata; the markdown body provides extended detail page content. A Zod schema in `src/content/config.ts` validates all entries at build time.

**Entry frontmatter contract:**

```yaml
title: string           # required — project display name
url: string             # required — primary project URL
repo: string            # optional — source code repository URL
tags: string[]          # required — flat tags (type, platform, game, status, etc.)
image: string           # optional — card image path, defaults to placeholder
pricing: enum           # required — free | paid | crowdfunded | freemium
description: string     # required — short description for card display
deprecation_reason: string  # optional — why this project is deprecated
```

### Browsing & Filtering

The main page (`/`) renders a Preact island (`client:visible`, ~3.6KB) that receives all project data as serialized props at build time. The island provides:

- **Tag bar:** Displays all available tags as toggleable pills. Active tags filter the card grid with AND logic (entries must match ALL selected tags). Tag counts update dynamically as filters narrow.
- **Card grid:** Shows matching entries with title, description snippet, tag pills, placeholder image, and pricing badge. Each card links to `/projects/{slug}`.

Static tag pages at `/tags/{tag}` are also generated via `getStaticPaths()` for SEO and direct linking.

### Search

Pagefind indexes the built HTML output. A search bar in the site header provides full-text search across all entries, separate from tag-based filtering.

### Detail Pages

Each entry generates a static page at `/projects/{slug}` showing the full markdown body, all metadata, and clickable tag links to `/tags/{tag}`.

### README Generation

A build script (`scripts/generate-readme.ts`) reads all project entries and a manual ordering config (`config/readme-order.yaml`) to produce a `README.md` in the repo root matching the current awesome-list markdown format. The ordering config maps tags to README sections with explicit hierarchy and ordering. Entries not matching any section emit a build warning.

### Analytics

Matomo tracking script in `BaseLayout.astro` using the existing metrics.nonpolynomial.com instance with a new site ID. No plugin needed — inline `<script>` tag.

## Existing Patterns

Investigation found no existing site infrastructure in this repo — it's currently a single README.md. The sibling project `docs.intiface.com` uses Docusaurus with Matomo, but this design deliberately starts fresh with Astro.

The Matomo integration follows the same pattern as docs.intiface.com (same metrics server, different site ID).

The README format follows the established awesome-list convention already present in the current README.md — name as link, indented bullet points for pricing, platform, description, and optional deprecation reason.

## Implementation Phases

<!-- START_PHASE_1 -->
### Phase 1: Project Scaffold
**Goal:** Astro project initialised with Preact integration, Pagefind, and base layout

**Components:**
- `package.json` with Astro, Preact integration, Pagefind, and dev dependencies
- `astro.config.ts` with Preact and Pagefind integrations, static output mode
- `tsconfig.json`
- `src/layouts/BaseLayout.astro` — site shell with header, footer, Matomo script
- `src/pages/index.astro` — placeholder landing page

**Dependencies:** None (first phase)

**Done when:** `npm install` succeeds, `npm run dev` serves a page, `npm run build` produces static output in `dist/`
<!-- END_PHASE_1 -->

<!-- START_PHASE_2 -->
### Phase 2: Content Collection & Schema
**Goal:** Entry data model defined and validated, with a handful of seed entries migrated from the current README

**Components:**
- `src/content/config.ts` — Zod schema defining the entry frontmatter contract
- `src/content/projects/` — 10-15 seed entries migrated from the current README (covering different categories, deprecated entries, various tag combos)

**Dependencies:** Phase 1

**Done when:** Astro builds successfully with seed entries, schema validation catches malformed entries
- Covers: `awesome-buttplug-site.AC2.1`, `awesome-buttplug-site.AC2.2`, `awesome-buttplug-site.AC2.3`
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: Card Grid & Detail Pages
**Goal:** Entries render as cards on the main page and as individual detail pages

**Components:**
- `src/components/ProjectCard.astro` — card component showing title, description, tags, image, pricing
- `src/pages/projects/[...slug].astro` — detail page generated from each entry's markdown body
- `src/layouts/ProjectLayout.astro` — layout for detail pages
- Placeholder image in `public/images/`

**Dependencies:** Phase 2

**Done when:** Main page shows seed entries as cards, clicking a card navigates to a detail page with full content, deprecated entries show visual distinction
- Covers: `awesome-buttplug-site.AC3.1`, `awesome-buttplug-site.AC3.2`, `awesome-buttplug-site.AC3.3`, `awesome-buttplug-site.AC5.1`
<!-- END_PHASE_3 -->

<!-- START_PHASE_4 -->
### Phase 4: Tag Filtering (Preact Island)
**Goal:** Interactive tag-based filtering on the main page

**Components:**
- `src/components/ProjectFilter.tsx` — Preact island receiving all project data as props, rendering tag bar and filtered card grid
- `src/components/TagBar.tsx` — toggleable tag pills with counts
- `src/components/CardGrid.tsx` — filtered card rendering
- Update `src/pages/index.astro` to pass serialized project data to the Preact island

**Dependencies:** Phase 3

**Done when:** Tag pills display on main page, clicking tags filters cards with AND logic, tag counts update, clearing filters shows all entries
- Covers: `awesome-buttplug-site.AC4.1`, `awesome-buttplug-site.AC4.2`, `awesome-buttplug-site.AC4.3`, `awesome-buttplug-site.AC4.4`
<!-- END_PHASE_4 -->

<!-- START_PHASE_5 -->
### Phase 5: Tag Pages & Search
**Goal:** Static tag index pages and Pagefind full-text search

**Components:**
- `src/pages/tags/[tag].astro` — static pages per tag via `getStaticPaths()`
- `src/pages/tags/index.astro` — tag index page listing all tags with counts
- Pagefind search bar component in `BaseLayout.astro` header

**Dependencies:** Phase 4

**Done when:** `/tags/{tag}` pages list all entries with that tag, tag links from detail pages navigate to tag pages, Pagefind search finds entries by text content
- Covers: `awesome-buttplug-site.AC4.5`, `awesome-buttplug-site.AC6.1`, `awesome-buttplug-site.AC6.2`
<!-- END_PHASE_5 -->

<!-- START_PHASE_6 -->
### Phase 6: README Generation
**Goal:** Build step produces a README.md matching the current awesome-list format

**Components:**
- `config/readme-order.yaml` — section ordering config mapping tags to README sections
- `scripts/generate-readme.ts` — reads project entries and ordering config, writes `README.md`
- npm script (`generate-readme`) and post-build hook

**Dependencies:** Phase 2 (needs content collection, doesn't need UI)

**Done when:** `npm run generate-readme` produces a README.md in repo root with proper section hierarchy, all entries appear in correct sections, orphan entries produce build warnings
- Covers: `awesome-buttplug-site.AC7.1`, `awesome-buttplug-site.AC7.2`, `awesome-buttplug-site.AC7.3`
<!-- END_PHASE_6 -->

<!-- START_PHASE_7 -->
### Phase 7: Full Migration
**Goal:** All ~196 entries migrated from current README to individual markdown files

**Components:**
- `scripts/migrate-readme.ts` — one-time migration script that parses the current README and generates individual `.md` files with frontmatter
- Remaining ~180 entries in `src/content/projects/`
- Complete `config/readme-order.yaml` covering all current README sections

**Dependencies:** Phase 6 (migration script should validate against schema and ordering config)

**Done when:** All entries from current README exist as individual files, schema validates all entries, generated README matches current README structure
- Covers: `awesome-buttplug-site.AC2.4`
<!-- END_PHASE_7 -->

<!-- START_PHASE_8 -->
### Phase 8: Polish & Analytics
**Goal:** Matomo analytics, visual polish, production readiness

**Components:**
- Matomo tracking script in `BaseLayout.astro` with configurable site ID
- CSS/styling refinement for cards, tag bar, detail pages
- Responsive layout for mobile
- Favicon and site metadata in `astro.config.ts`

**Dependencies:** Phase 7

**Done when:** Matomo tracking verified in dev tools, site renders well on mobile and desktop, build produces clean static output ready for deployment
- Covers: `awesome-buttplug-site.AC8.1`, `awesome-buttplug-site.AC8.2`
<!-- END_PHASE_8 -->

## Additional Considerations

**README as checked-in artifact:** The generated README.md is committed to the repo, not just a build output. This ensures GitHub renders it for visitors who find the repo directly.

**Migration script is one-time:** `scripts/migrate-readme.ts` parses the current README format and is not intended for ongoing use. After migration, new entries are added as individual `.md` files directly.

**Tag taxonomy is emergent:** No predefined tag vocabulary — tags are whatever entries use. The tag bar and tag pages are generated from whatever tags exist in the data. Consistency is maintained by convention, not enforcement (though a linting script could be added later).
