# awesome-buttplug

Last verified: 2026-08-08

## Repo Layout

The repo root holds only `README.md`, `netlify.toml`, `.gitignore` and `site/`. GitHub
renders the file listing above the README, and on an awesome list the README *is* the
product, so everything else — this file included — lives under `site/`. **Run every npm
command from `site/`.**

`README.md` stays at the root because that is the only place GitHub renders it, even
though it is generated from `site/src/content/projects/`. The two scripts that touch it
resolve their paths from `import.meta.dirname`, not the CWD, so they are correct from
either directory.

Netlify builds the site: `netlify.toml` sets `base = "site"` and publishes `site/dist`.
That file is the whole deploy config — do not move the build back to the root without
updating it.

## Tech Stack
- Framework: Astro 6 (static output) + Preact islands
- Search: Pagefind (post-build indexing)
- Language: TypeScript
- Node: >=22
- Analytics: Matomo, in `BaseLayout.astro` (site 14 on metrics.nonpolynomial.com)

## Commands
- `npm run dev` - Start Astro dev server
- `npm run build` - Production build (also runs postbuild README generation)
- `npm run generate-readme` - Generate README.generated.md from content collection
- `npm run validate-readme-parity` - Regression check: confirms a change did not silently
  modify or drop existing README entries. Matches by title against `HEAD` by default
  (`--baseline-ref <ref>` to compare further back). Added entries are always fine; removals
  fail unless you pass `--allow-removals`.
- `npm run check-links` - Check the generated README for dead links. Python, run via `uv`;
  dependencies are declared inline (PEP 723) so there is no requirements file or venv to
  manage. Exits non-zero on dead links or connection errors, and reports redirects
  separately — read those, since a redirect is how a renamed repo hides a duplicate entry.

## Project Structure
All paths below are relative to `site/`.
- `src/content/projects/` - Content collection: one .md file per project (405 entries)
- `src/content.config.ts` - Zod schema for project frontmatter
- `src/components/` - Preact islands (ProjectFilter, CardGrid, TagBar, CategoryRail, ViewToggle, SortToggle) and Hero.astro
- `src/pages/` - Astro routes: index, `/projects/[id]`, `/tags/`, `/tags/[tag]`
- `src/layouts/` - BaseLayout (global shell, named `hero` slot, analytics), ProjectLayout
- `src/styles/` - fonts.css (@font-face), global.css (tokens + shell), filter.css (grid and tag filtering UI)
- `src/utils/` - categories.ts, monogram.ts, projectLinks.ts, displayText.ts, tagDisplay.ts,
  filterProjects.ts, filterState.ts, sortProjects.ts, and their vitest suites
- `src/types.ts` - Shared ProjectEntry interface
- `scripts/` - generate-readme.ts, validate-readme-parity.ts, check_links.py
- `public/fonts/` - Vendored Aller and Alternate Gothic (TTF, see licence note below)
- `public/img/` - Family logo and squidplug watermark
- `config/readme-order.yaml` - Section ordering and hierarchy for README generation

## Content Collection Schema
Every file in `src/content/projects/*.md` must have this frontmatter:
- `title` (string, required)
- `url` (string, valid URL, required)
- `repo` (string, valid URL, optional)
- `section` (string, required) - must match an id in `config/readme-order.yaml`
- `tags` (array of slug strings, min 1, required) - lowercase, hyphens only
- `image` (string, optional)
- `pricing` (string, optional)
- `platforms` (array of strings, optional)
- `summary` (string, required)
- `readme_bullets` (array of strings, min 1, required)
- `deprecation_reason` (string, optional)
- `order` (number, optional) - controls sort within section
- `added` (quoted `YYYY-MM-DD` string, required) - when the entry joined this list

## Key Invariants
- README.md is auto-generated from the content collection via postbuild hook
- **The README TOC is derived from the headings actually emitted, not from `readme-order.yaml`.**
  Sections with no entries are skipped (`chilloutvr` is configured but empty), so a TOC built
  from the config would link to anchors that do not exist. Two conventions in `generateToc()`
  are load-bearing: the heading must stay exactly `## Table Of Contents` (capital `O` — it is
  matched by name in `EXCLUDED_TOP_LEVEL_SECTIONS`), and bullets must stay `*`, because both
  scripts detect project entries with a `^- \[` regex. Switching to `-` would parse every TOC
  link as a project and inflate the shrink-guard baseline.
- generate-readme.ts refuses to write README.md if fewer than 189 entries or orphaned sections exist.
  That floor is the original migration baseline, not the current count — it protects against a failed
  collection load clobbering the README, so it stays well below the live total.
- **Dedupe project URLs by canonical `full_name` from the GitHub API, never by the URL string.**
  Renamed accounts keep redirecting, so a moved repo still returns HTTP 200 and a plain link check
  calls it healthy while the same project sits in the list twice under two owners.
- **`repo` equals `url` on 245 of 405 entries** — for libraries and mods the repo *is* the
  project home. Anything rendering both as separate links must route through
  `projectActions()` in `src/utils/projectLinks.ts`, or 60% of cards get two links to one
  destination.
- **The hero's social icons are inlined Simple Icons paths, not an icon font.** The site
  makes no third-party requests — it vendors its own fonts — so keep new icons as inline
  `<path>` data in `Hero.astro` rather than adding a webfont or CDN link.
- `pricing` is a **site-only display field**; the README is generated from `readme_bullets`,
  which often duplicates the same sentence. Editing `pricing` alone leaves README.md
  byte-identical, so the two can legitimately disagree: badges stay short, README keeps the
  "available at <url>" prose.
- **Never initialise island state from `localStorage` in a `useState` initialiser.** The server
  has no `localStorage`, so the first client render disagrees with the SSR HTML. Read it in a
  `useEffect` instead. Two things make this bite harder than a console warning:
  `preact.hydrate()` never diffs attributes against existing DOM, so a class computed only
  during hydration is silently dropped; and it *does* repair structural mismatches, so
  conditionally-rendered nodes "work" by accident via DOM surgery. Keep card DOM identical
  across view modes and switch with a class (`.card-grid.view-compact`) so shape can never diverge.
- **The same rule binds `sort`, even though it comes from the URL rather than `localStorage`.**
  The site is fully static: one HTML file serves every query string, so the grid is always
  rendered in the default order. `cat` and `tags` get away with being read during render
  because filtering only ever *removes* cards, leaving an order-preserving subsequence that
  Preact repairs quietly. Sorting **reorders** them, and seeding `sortMode` from the URL in
  the `useState` initialiser produced 184 hydration errors on `?sort=newest` — measured, not
  theorised. `sortMode` therefore starts at `DEFAULT_SORT_MODE` and adopts the URL value in
  the mount effect. The cost is a visible reorder just after paint on a `?sort=` deep link,
  which is the same trade the Visual view mode already makes.
- **The Matomo site id and endpoint are hardcoded constants, not env vars.** They ship in
  the page source to every visitor, so gating them behind `PUBLIC_MATOMO_SITE_ID` bought no
  secrecy and cost a silent failure: the variable was never set anywhere, so the tracker was
  absent from every build for the site's whole life with nothing reporting it. The gate is
  now `import.meta.env.PROD`, which is false under `astro dev` — but *true* under
  `astro preview`, so local previews register real hits.
- **`added` is a quoted string, never a bare YAML date.** Bare `2021-01-23` parses as a
  YAML timestamp and arrives as a `Date`, failing the schema on every entry. The field is
  also deliberately a regex'd `z.string()` rather than `z.coerce.date()`: a `Date` crossing
  the Astro→Preact island boundary is JSON-serialised and arrives client-side as a string,
  so a `Date`-typed `ProjectEntry` would be a lie at exactly the point the sort runs.
  `YYYY-MM-DD` compares chronologically under `<` with no timezone semantics. Dates were
  mined from `README.md`'s git history by `scripts/backfill-added-dates.ts`; new entries
  need the field by hand, and the build fails by filename if it is missing.
- **Random sort uses a seeded per-entry key, not a shuffle.** Only a total order over *all*
  entries survives filtering. Shuffling a filtered subset with seed 7 gives a different
  relative order than those same items extracted from a seed-7 shuffle of all 405, so every
  category or tag click would visibly rearrange the survivors even though the seed never
  moved. `sortProjects` hashes `(id, seed)`, which makes subset-stability a property by
  construction rather than luck. There is a test for it.
- **Sort runs before `deprecatedLast`, not after.** The partition is a display policy, so it
  has to wrap the sorted list; sorting a pre-partitioned list would interleave deprecated
  entries back into the body. `filterProjects` filters only — it no longer partitions.
- Tags must be URL-safe slugs (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`)
- Every project section must be listed in `config/readme-order.yaml`
- The site is fully static (no SSR)
- **The site measures zero WCAG AA contrast failures.** Verify in-browser after any
  colour change, over all four page types, both view modes, and with the tag bar
  expanded. Hand-checking has twice missed near-miss failures here.

## Visual Identity

Shares the buttplug.io / intiface.com family identity. Dark-only; `--bp-*` in
`global.css` is the raw family palette and is remapped by the semantic tokens
below it. A light mode would remap the semantic layer only.

Load-bearing constraints, each of which was measured:

- **`--accent` and `--accent-solid` are not interchangeable.** `--accent` (#f06292)
  is link/text pink at 5.02:1 on `--bg-raised`. White on it is 3.06:1, and white on
  the brand pink `--bp-pink` is 4.27:1 — both fail. Filled controls must use
  `--accent-solid` (#c4146a), where white is 5.75:1.
- **The footer has its own text pair.** On `--bp-footer` (#303846), `--text-muted`
  is 4.09:1 and `--accent` is 3.86:1. Use `--footer-muted` and `--footer-link`.
- **Hero text is `#fff` or 85% white only.** `--bp-ice` is 4.28:1 on the lightest
  gradient stop and fails — the family's own hero has this bug; do not copy it.
- **Monogram gradients must clear 4.5:1 against 85% white at both endpoints.**
  Automated checkers report text over a gradient as "incomplete", not "fail", so
  this needs checking by hand. Keep 8 entries so `hash % 8` is unchanged.
- **Card action buttons are the tightest measured pair on the site.** `.card-action` is
  `--accent` text on `--pill-bg`, measured at 4.62:1 — it passes AA with 0.12 to spare, so do
  not darken `--pill-bg` or dim the text. Hover fills with `--accent-solid` (5.75:1). The
  rules live in `global.css` and are scoped through `.card-actions` because `.pill` is
  equal-specificity and loads later; unscoping them silently reverts the colour to
  `--pill-fg`.
- Aller is a static two-weight family: use 400/700, never 650, and no italics
  (none is shipped, so browsers would synthesise an oblique).
- The `Aller Fallback` `size-adjust` is a *measured* rendered-width ratio. The usual
  OS/2 `xAvgCharWidth` formula overshoots by 23% for this pair. Re-measure if the
  font files change.
- Fonts ship as TTF, not woff2: the Dalton Maag EULA permits conversion only to
  formats it names.

## Conventions
- Tags are for filtering (cross-cutting concerns like "open-source", "free", "utility")
- Sections are for categorical grouping (matches README hierarchy)
- Preact islands handle client-side interactivity (tag filtering with AND logic)
- Static tag pages at `/tags/[tag]` for SEO; client-side filtering on index for UX

## Boundaries
- Safe to edit: `site/src/`, `site/scripts/`, `site/config/`
- Never hand-edit: `README.md` (auto-generated from the content collection). Its preamble,
  including the badges and the "Adding A Project" section, lives in
  `site/config/readme-order.yaml`.
- Never commit: `node_modules/`, `dist/`, `.astro/`, `README.generated.md`
- There is no typecheck step: TypeScript is not a dependency and Astro strips types via
  esbuild, so editor errors about missing `@types/node` in `scripts/` are cosmetic. `npm test`
  (vitest) and `npm run validate-readme-parity` are the real gates.
