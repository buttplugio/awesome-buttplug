# Awesome Buttplug Site Design

## Summary

The awesome-buttplug project currently exists as a single handwritten README following the "awesome list" convention — a flat markdown file with ~196 links grouped into sections. This design replaces the project catalogue portion with an Astro-based static site that treats each project entry as a structured data file, enabling browsing, filtering, and search features that a plain markdown file cannot support. Community Links and Friends of Buttplug are intentionally removed from the migrated catalogue, leaving ~189 project entries. Visitors will be able to explore the Buttplug ecosystem through a card grid with tag-based filtering and full-text search, and drill into per-project detail pages. The site is fully static: no server, no database.

The implementation migrates each project entry from the README into an individual markdown file with YAML frontmatter validated at build time by a Zod schema. Interactive filtering on the main page is handled by a small Preact island (hydrated client-side), keeping the rest of the site as plain static HTML. To preserve the existing GitHub audience, a build script regenerates the root README.md from the same entry data after full migration, so the repo continues to render as a standard awesome list for anyone browsing it directly on GitHub.

## Definition of Done
- Astro static site rendering ~189 Buttplug ecosystem projects as searchable, tag-filterable cards
- One markdown+frontmatter file per project entry with structured metadata (name, URL, canonical README section, repo/source links, platform, pricing/status text, summary, tags, image)
- Flat tag system for browsing — entries tagged with any combination of stable tag slugs (type, platform, game, deprecated, etc.)
- Explicit canonical section field controls README placement; tags do not define README hierarchy
- Main browse page with tag cloud/filter bar to narrow displayed entries
- Detail page per project accessible by clicking a card
- "deprecated" is just another tag, visually distinguished on cards
- Pagefind-powered client-side search across all entries
- Build step generates a README.md in the repo root structurally equivalent to the migrated project sections of the current awesome-list markdown format, derived from the same entry data
- Matomo analytics integrated (metrics.nonpolynomial.com, new site ID)
- Placeholder images used where card images would go
- Community Links and Friends of Buttplug are not migrated to the site or generated README

## Acceptance Criteria

### awesome-buttplug-site.AC1: Site builds and serves as static output
- **awesome-buttplug-site.AC1.1 Success:** `npm run build` produces static HTML in `dist/` with no server required
- **awesome-buttplug-site.AC1.2 Success:** `npm run dev` starts local dev server with hot reload
- **awesome-buttplug-site.AC1.3 Failure:** Build fails with clear error when Zod schema validation rejects a malformed entry

### awesome-buttplug-site.AC2: Entry data model
- **awesome-buttplug-site.AC2.1 Success:** Entry with all required fields (title, url, section, tags, summary, readme_bullets) passes schema validation
- **awesome-buttplug-site.AC2.2 Failure:** Entry missing required field fails build with descriptive error
- **awesome-buttplug-site.AC2.3 Success:** Entry with optional fields omitted (repo, image, pricing, platforms, deprecation_reason) builds successfully with defaults applied
- **awesome-buttplug-site.AC2.4 Success:** All ~189 migrated project entries from current README exist as individual `.md` files and pass validation

### awesome-buttplug-site.AC3: Card display and detail pages
- **awesome-buttplug-site.AC3.1 Success:** Cards display title, summary, tag pills, placeholder image, and pricing/status badge when available
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
- **awesome-buttplug-site.AC7.1 Success:** `npm run generate-readme` produces `README.generated.md` during partial migration and `README.md` after full migration, with section hierarchy matching `readme-order.yaml`
- **awesome-buttplug-site.AC7.2 Success:** Each entry appears in the correct section formatted as name-link + indented bullet points
- **awesome-buttplug-site.AC7.3 Warning:** Entries not matching any section in ordering config produce a build warning
- **awesome-buttplug-site.AC7.4 Success:** Generated README is structurally equivalent to the migrated project sections of the current README: same project section hierarchy, same project ordering within sections, same project link targets, and equivalent metadata bullets. Byte-for-byte line wrapping and prose formatting are not required to match.

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
- **readme-order.yaml**: A manual configuration file that defines README section names and ordering, used by the README generation script to reconstruct the original awesome-list structure.
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
section: string         # required — canonical README section id, e.g. applications/utilities
tags: string[]          # required — stable lowercase tag slugs for browsing/filtering
image: string           # optional — card image path, defaults to placeholder
pricing: string         # optional — display text such as "Free, open source" or "Paid DLC"
platforms: string[]     # optional — display/filter data for supported platforms
summary: string         # required — short description for card display
readme_bullets: string[] # required — canonical bullets for generated README output
deprecation_reason: string  # optional — why this project is deprecated
```

`section` is the source of truth for README placement. `tags` are only browse/search facets and must not be used to infer canonical README hierarchy.

### Browsing & Filtering

The main page (`/`) renders a Preact island (`client:visible`, ~3.6KB) that receives all project data as serialized props at build time. The island provides:

- **Tag bar:** Displays all available tags as toggleable pills. Active tags filter the card grid with AND logic (entries must match ALL selected tags). Tag counts update dynamically as filters narrow.
- **Card grid:** Shows matching entries with title, summary snippet, tag pills, placeholder image, and pricing/status badge when available. Each card links to `/projects/{slug}`.

Static tag pages at `/tags/{tag}` are also generated via `getStaticPaths()` for SEO and direct linking.

Tags are stored as stable slugs (`windows`, `open-source`, `ffxiv`, etc.). Display labels are generated from slugs by default and may be overridden in a small tag metadata file if needed. Tag routes use the slug directly, so tags with display punctuation, whitespace, `#`, `+`, or `/` must be represented by URL-safe slugs (`c-sharp`, `cpp`, `video-sync`, etc.).

### Search

Pagefind indexes the built HTML output. A search bar in the site header provides full-text search across all entries, separate from tag-based filtering. `npm run build` runs `astro build` followed by Pagefind indexing against `dist/`; development search can either be disabled with a clear empty state or run against the most recent local build.

### Detail Pages

Each entry generates a static page at `/projects/{slug}` showing the full markdown body, all metadata, and clickable tag links to `/tags/{tag}`.

### README Generation

A build script (`scripts/generate-readme.ts`) reads all project entries and a manual ordering config (`config/readme-order.yaml`) to produce the project sections of `README.md` in the repo root. The ordering config defines explicit hierarchy and ordering by section id. Entries not matching any section emit a build warning.

During partial migration, the generator writes to `README.generated.md` for comparison only. The script writes the checked-in root `README.md` and participates in post-build checks only after the full migrated entry set validates, preventing a partial seed dataset from replacing the repo front page.

### Analytics

Matomo tracking script in `BaseLayout.astro` using the existing metrics.nonpolynomial.com instance with a new site ID. No plugin needed — inline `<script>` tag.

## Existing Patterns

Investigation found no existing site infrastructure in this repo — it's currently a single README.md. The sibling project `docs.intiface.com` uses Docusaurus with Matomo, but this design deliberately starts fresh with Astro.

The Matomo integration follows the same pattern as docs.intiface.com (same metrics server, different site ID).

The README format follows the established awesome-list convention already present in the current README.md — name as link with indented metadata bullets. Structural equivalence is required for migrated project sections: same project section hierarchy, same project ordering within sections, same project link targets, and equivalent metadata bullets. Byte-for-byte wrapping and prose formatting do not need to match.

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
- `src/content/config.ts` — Zod schema defining the entry frontmatter contract, including canonical `section` and URL-safe tag slugs
- `src/content/projects/` — 10-15 seed entries migrated from the current README (covering different categories, deprecated entries, various tag combos)

**Dependencies:** Phase 1

**Done when:** Astro builds successfully with seed entries, schema validation catches malformed entries
- Covers: `awesome-buttplug-site.AC2.1`, `awesome-buttplug-site.AC2.2`, `awesome-buttplug-site.AC2.3`
<!-- END_PHASE_2 -->

<!-- START_PHASE_3 -->
### Phase 3: Card Grid & Detail Pages
**Goal:** Entries render as cards on the main page and as individual detail pages

**Components:**
- `src/components/ProjectCard.astro` — card component showing title, summary, tags, image, and pricing/status when available
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
**Goal:** README generator can reproduce the migrated project sections without writing over the root README during partial migration

**Components:**
- `config/readme-order.yaml` — section ordering config defining explicit README hierarchy by section id
- `scripts/generate-readme.ts` — reads project entries and ordering config, writes `README.generated.md` for comparison during partial migration
- npm script (`generate-readme`) without post-build root README writing yet

**Dependencies:** Phase 2 (needs content collection, doesn't need UI)

**Done when:** `npm run generate-readme` produces a comparison README with proper section hierarchy, migrated entries appear in correct sections, orphan entries produce build warnings, and the script refuses to overwrite root `README.md` until full migration is complete
- Covers: partial `awesome-buttplug-site.AC7.1`, `awesome-buttplug-site.AC7.2`, `awesome-buttplug-site.AC7.3`
<!-- END_PHASE_6 -->

<!-- START_PHASE_7 -->
### Phase 7: Full Migration
**Goal:** All ~189 in-scope project entries migrated from current README to individual markdown files

**Components:**
- `scripts/migrate-readme.ts` — one-time migration script that parses the current README and generates individual `.md` files with frontmatter
- Remaining in-scope project entries in `src/content/projects/`
- Complete `config/readme-order.yaml` covering all in-scope project README sections
- Enable root `README.md` generation and post-build parity check once migration is complete

**Dependencies:** Phase 6 (migration script should validate against schema and ordering config)

**Done when:** All in-scope project entries from current README exist as individual files, schema validates all entries, generated README is structurally equivalent to the migrated project sections of the current README, and Community Links/Friends sections are absent by design
- Covers: `awesome-buttplug-site.AC2.4`, completion of `awesome-buttplug-site.AC7.1`, `awesome-buttplug-site.AC7.4`
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

**README as checked-in artifact:** The generated README.md is committed to the repo, not just a build output. This ensures GitHub renders it for visitors who find the repo directly. Root README writing is enabled only after the full project migration is complete and parity checks pass.

**Migration script is one-time:** `scripts/migrate-readme.ts` parses the current README format and is not intended for ongoing use. After migration, new entries are added as individual `.md` files directly.

**Tag taxonomy is emergent but slugged:** No predefined browse taxonomy is required, but tags must be URL-safe stable slugs. The tag bar and tag pages are generated from whatever tags exist in the data. Consistency is maintained by schema validation for slug shape plus convention, not by a closed vocabulary (though a linting script could be added later).

**Removed README sections:** Community Links and Friends of Buttplug are out of scope for the migrated site and generated README.
