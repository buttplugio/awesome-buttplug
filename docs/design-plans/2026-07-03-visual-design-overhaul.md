# Visual Design Overhaul Design

## Summary

The awesome-buttplug site is functionally complete (cards, tag filtering, search, detail pages) but visually generic: bootstrap-dark defaults, a 150px placeholder image repeated on all 189 cards (no entry has a real image), and the README's curated section hierarchy invisible on the index. This design replaces the visual layer with a "soft elevation" refined-dark treatment and restructures the index around a category rail derived from the existing section data, without touching the content schema or README generation.

Three decisions drive the design, each validated against mockups during brainstorming:

1. **Browsing model — category rail + flat grid.** The index stays a single flat grid, but gains an always-visible single-select category rail built by rolling section ids up to their top-level README parent. Curation appears as navigation, not page structure. Tag pills remain below the rail for cross-cutting narrowing (AND logic unchanged).
2. **View toggle — compact ⇄ visual.** Compact cards (text-first, no image slot) are the default and solve the dead-placeholder problem. Visual mode adds a media slot per card: the entry's image when present, otherwise a deterministic gradient-monogram fallback. The toggle persists in localStorage.
3. **Visual language — soft elevation.** Neutral charcoal surfaces (navy tint dropped), borderless cards lifted by layered shadows, 12px radii, self-hosted Inter Variable, calmer red accent reserved for interactive/selected states, and status colours as tints rather than solid fills. Chosen over flat hairline borders (reads as non-interactive) and tinted gradients (too noisy at 189 cards).

## Definition of Done

- Index page presents category rail (single-select), usage-sorted tag bar with overflow expander, view toggle, and card grid, all styled to the soft-elevation token set
- Compact card variant is default; visual variant shows image or gradient-monogram fallback; `public/images/placeholder.svg` removed
- Category + tag selections sync to URL query params; view mode persists in localStorage
- Deprecated entries appear under their own rail category, sort last in "All" with muted treatment
- Header, footer, detail pages, tag pages, and Pagefind UI restyled to the same tokens
- Inter Variable self-hosted via fontsource package (no CDN requests)
- `npm run build` and `npm run validate-readme-parity` stay green; content schema, README generation, Pagefind indexing, and Matomo untouched

## Implementation Handoff Addendum

This file remains the design source of truth. For execution, use it together with the detailed implementation plan at `docs/implementation-plans/2026-07-03-visual-design-overhaul.md`, but treat the review clarifications below as binding if the two documents differ.

### Goal

Replace the current generic dark UI with the approved soft-elevation visual system: category rail, compact/visual cards, usage-sorted tag controls, URL-synced filters, and restyled header/footer/detail/tag/search surfaces, while preserving static output, the content schema, README generation, Pagefind indexing, and conditional Matomo behavior.

### Current codebase touch points

- `src/types.ts` currently defines the index/card `ProjectEntry` contract without `section` or `category`; extend it for the index only with `section: string` and `category: CategorySlug`/`string` derived from `categoryForSection(p.data.section)`. Do not add `repo` or `platforms` unless cards explicitly start displaying them; detail pages already read those from `project.data`.
- `src/pages/index.astro` constructs `ProjectEntry[]`; it must pass through `section: p.data.section` and `category: categoryForSection(p.data.section).slug`.
- Index island behavior is concentrated in `src/components/ProjectFilter.tsx`, `TagBar.tsx`, and `CardGrid.tsx`. Because category, URL-state, tag overflow, and view-mode behavior change most of the old tag-only implementation, prefer clean replacement of these small files over surgical edits, backed by tests.
- Add new components `src/components/CategoryRail.tsx` and `src/components/ViewToggle.tsx`.
- Add pure utilities for behavior that can be tested without a browser: `src/utils/categories.ts`, `filterProjects.ts`, `tagDisplay.ts`, `filterState.ts`, and `monogram.ts`.
- `src/layouts/BaseLayout.astro` owns shared header/search/footer markup and should import Inter before `global.css`. `src/layouts/ProjectLayout.astro` is only a wrapper and should not be relied on for detail-page styling.
- Non-index route styling is currently scoped inside `src/pages/projects/[...id].astro`, `src/pages/tags/index.astro`, and `src/pages/tags/[tag].astro`; AC6 is not complete unless those scoped styles are updated too. Keep route paths unchanged (`/projects/{id}`, `/tags`, `/tags/{tag}`).
- `public/images/placeholder.svg` is currently hardcoded only by `CardGrid`; remove that reference before deleting the asset.
- The existing human test plan is `docs/test-plans/2026-05-30-awesome-buttplug-site.md` and currently describes the old placeholder-image/alphabetical-tag UI; update it as part of this overhaul.

### Self-hosted font/package requirements

- Add `@fontsource-variable/inter` and commit both `package.json` and `package-lock.json`.
- Import the font once from `src/layouts/BaseLayout.astro` before `../styles/global.css`:

  ```astro
  import "@fontsource-variable/inter";
  import "../styles/global.css";
  ```

- Set `font-family: "Inter Variable", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` through a `--font-sans` token in `global.css`.
- Verify build/preview network logs do not show font requests to Google Fonts, gstatic, jsDelivr, unpkg, or other external font/CDN origins.

### Smaller-model implementation packages

These packages are sized for `general-purpose-mini` unless noted. Avoid running agents that edit the same files in parallel.

1. **Dependency owner (mini, first):** install `vitest` and `@fontsource-variable/inter`; add `npm test`; update only `package.json` and `package-lock.json`; run `npm test` if tests already exist, otherwise `npm run build`.
2. **Pure utilities and tests (mini, after dependency owner):** create `categories`, `filterProjects`, `tagDisplay`, `filterState`, and `monogram` utilities plus Vitest coverage. No component or CSS edits.
3. **Design tokens and shared shell (mini, can run after dependency owner; avoid overlap with route restyle):** replace `global.css` token/base/Pagefind styles; update `BaseLayout.astro` for Inter import and header/search/footer markup; preserve conditional Matomo script.
4. **Index behavior island (larger model preferred if mini struggles; after utilities):** update `types.ts`, `index.astro`, `ProjectFilter.tsx`, `CategoryRail.tsx`, `TagBar.tsx`, `ViewToggle.tsx`, `CardGrid.tsx`, and `filter.css`; implement category filtering, tag overflow, URL state, view toggle, card variants, deprecated ordering, and placeholder removal.
5. **Non-index routes (mini, after design tokens):** restyle `projects/[...id].astro`, `/tags/`, and `/tags/[tag]` scoped styles and metadata markup to the same token set.
6. **Documentation and verification (mini/reviewer, last):** update the human test plan, run `npm test`, `npm run build`, `npm run validate-readme-parity`, grep for `placeholder.svg` and external font/CDN references, and perform browser checks at 375/768/1200px.

If commits are made during implementation, stage files explicitly by path. Do not use broad staging commands such as `git add -A`, `git add .`, or `git commit -am`.

## Acceptance Criteria

### visual-overhaul.AC1: Design tokens

- **visual-overhaul.AC1.1 Success:** `global.css` defines the soft-elevation token set (charcoal backgrounds, shadow levels, radii, accent, status tints) as CSS custom properties; no component styles hardcode colours
- **visual-overhaul.AC1.2 Success:** Inter Variable loads from the site's own origin; no external font/CDN requests appear in the network log
- **visual-overhaul.AC1.3 Success:** Pricing and deprecation badges render as tinted backgrounds with readable contrast, not solid green/red fills

### visual-overhaul.AC2: Category rail

- **visual-overhaul.AC2.1 Success:** Rail labels are fixed/order-curated, but counts are derived from the current `projects` data, never hardcoded. For the current 189-entry dataset the derived counts show All (189), Game Mods (58), Applications (48), Development & Libraries (28), Games (15), Virtual Worlds (8), Hardware (3), Deprecated (29).
- **visual-overhaul.AC2.2 Success:** Selecting a category filters the grid to entries whose section rolls up to that category; selecting another category replaces the selection (single-select); All resets
- **visual-overhaul.AC2.3 Success:** Hardware category includes both `hardware-support` and `diy-hardware` sections
- **visual-overhaul.AC2.4 Success:** Deprecated entries appear only under the Deprecated category and in All; in All they sort after all non-deprecated entries with muted styling
- **visual-overhaul.AC2.5 Success:** Category selection and tag filters compose (AND)

### visual-overhaul.AC3: Tag bar

- **visual-overhaul.AC3.1 Success:** Tags render sorted by usage count descending; the top 12 are visible with the remainder behind a "+N more" expander
- **visual-overhaul.AC3.2 Success:** Expanding reveals all tags; selected tags always remain visible even if low-usage
- **visual-overhaul.AC3.3 Success:** Multi-tag AND filtering and live counts behave as before

### visual-overhaul.AC4: View toggle

- **visual-overhaul.AC4.1 Success:** Compact mode (default) renders cards with title, pricing badge, summary, and up to 4 tag pills — no image area
- **visual-overhaul.AC4.2 Success:** Visual mode renders a media slot: the entry image when frontmatter provides one, otherwise a gradient-monogram derived deterministically from the project id (same entry always gets the same gradient)
- **visual-overhaul.AC4.3 Success:** Toggle state persists across page loads via localStorage
- **visual-overhaul.AC4.4 Success:** `public/images/placeholder.svg` is deleted and unreferenced

### visual-overhaul.AC5: URL state

- **visual-overhaul.AC5.1 Success:** Selecting category/tags updates query params (e.g. `/?cat=game-mods&tags=vr,free`) without page reload
- **visual-overhaul.AC5.2 Success:** Loading a URL with query params restores the corresponding filter state
- **visual-overhaul.AC5.3 Success:** Invalid or unknown param values are ignored gracefully with field-level fallback: unknown `cat` resets only category to All; unknown tag slugs are dropped individually; if all provided params are invalid, the grid shows all entries. Example: `/?cat=bogus&tags=free,nope` restores category All and selected tags `[free]`; `/?cat=bogus&tags=nope` restores defaults and shows all entries.

### visual-overhaul.AC6: Other surfaces

- **visual-overhaul.AC6.1 Success:** Header presents site title, nav, and restyled Pagefind search consistent with the token set; search behaviour unchanged
- **visual-overhaul.AC6.2 Success:** Detail pages present a structured metadata block (project link, source link, platforms, pricing) styled to the token set
- **visual-overhaul.AC6.3 Success:** `/tags/` index and `/tags/[tag]` pages restyled to the token set
- **visual-overhaul.AC6.4 Success:** All pages usable at 375px, 768px, and 1200px+ widths; rail scrolls horizontally on narrow viewports

### visual-overhaul.AC7: Non-regression

- **visual-overhaul.AC7.1 Success:** `npm run build` completes; README generation and parity validation pass unchanged
- **visual-overhaul.AC7.2 Success:** Pagefind search returns results and links to detail pages
- **visual-overhaul.AC7.3 Success:** Matomo loads conditionally as before

## Design Detail

### Visual language

Token replacement in `src/styles/global.css`:

| Token | Current | New |
|---|---|---|
| `--bg` | `#0d0d1a` (navy) | `#121217` (charcoal) |
| `--bg-card` | `#1a1a2e` | `#1a1a21` |
| `--accent` | `#e94560` | `#e5484d` |
| `--border` | `#333` | retired for cards (shadows instead); hairline `#26262e` kept for header/footer rules |
| `--success` / `--danger` / `--warning` | solid fills | tint pairs: translucent background + saturated foreground (e.g. `rgba(70,167,88,0.14)` / `#63d489`) |
| shadows | none | `--shadow-card: 0 1px 3px rgb(0 0 0 / 0.5), 0 4px 14px rgb(0 0 0 / 0.25)` |
| radii | 4–8px mixed | `--radius: 12px` cards, `--radius-sm: 6px` inputs/badges, pills fully rounded |

Typography: Inter Variable via `@fontsource-variable/inter` (verify latest version at implementation time), `letter-spacing: -0.01em` on headings, type scale unchanged in structure but tightened sizes for card content. Pagefind UI dark-theme overrides via its CSS custom properties in `global.css`.

### Category rollup

New module `src/utils/categories.ts`: maps a section id to a display category by longest-prefix rule.

| Section id prefix | Category | URL slug | Count |
|---|---|---|---|
| `applications/` | Applications | `applications` | 48 |
| `games` | Games | `games` | 15 |
| `game-mods` | Game Mods | `game-mods` | 58 |
| `virtual-worlds` | Virtual Worlds | `virtual-worlds` | 8 |
| `hardware-support`, `diy-hardware` | Hardware | `hardware` | 3 |
| `development/` | Development & Libraries | `development` | 28 |
| `deprecated` | Deprecated | `deprecated` | 29 |

Each category carries a stable URL slug (used by `?cat=`), defined alongside the mapping in `categories.ts`.

Hardware merges two README sections because one-entry rail chips are useless; README structure is unaffected. The rail is presentation-layer rollup only — `readme-order.yaml` remains the canonical hierarchy. Category order in the rail: fixed curated order (All, Game Mods, Applications, Development & Libraries, Games, Virtual Worlds, Hardware, Deprecated), not count-sorted, so positions stay stable as entries are added.

### Components and data flow

- `src/types.ts`: `ProjectEntry` gains `section: string` and derived `category: string`
- `src/pages/index.astro`: passes `section` through; category derived at build time via `categories.ts`
- `src/components/ProjectFilter.tsx`: owns state `{ category, selectedTags, viewMode }`; composes filtering (category AND tags); syncs category/tags to `URLSearchParams` via `history.replaceState`, reads them on mount; persists `viewMode` to localStorage
- `src/components/CategoryRail.tsx` (new): single-select chip row with counts
- `src/components/TagBar.tsx`: usage-sorted, slice top 12, "+N more" expander (local `expanded` state); selected tags pinned visible
- `src/components/CardGrid.tsx`: renders compact or visual variant per `viewMode` prop; monogram fallback picks from a fixed set of 8 curated gradient pairs by hashing the project id, overlaid with the title's first character
- `src/styles/filter.css`: rail, toggle, revised card/tag styles; grid `minmax(260px, 1fr)`, `gap: 0.875rem`

Deprecated ordering: `CardGrid` receives entries pre-sorted (non-deprecated first) from `ProjectFilter`; collection order otherwise preserved (matches README curation).

### Out of scope

- No changes to content schema, frontmatter, or any file in `src/content/`
- No changes to `scripts/`, `config/readme-order.yaml`, or README generation/parity
- No unification of Pagefind search with client-side filtering (future enhancement)
- No tag taxonomy cleanup (usage-sorting makes the long tail livable without renames)
- No new routes

### Test Strategy

Regression coverage should combine fast utility tests, build/parity checks, and targeted browser/manual verification. The repo currently has no browser harness; if Playwright or equivalent is not added, the browser-only checks below remain explicit manual acceptance items and should be recorded as residual risk.

- Add `vitest` and `npm test` for pure logic that does not require a browser.
- Prefer pure utility modules for category rollup, category/tag composition, tag overflow display, URL parse/serialize, and gradient selection so smaller agents can implement and verify behavior independently.
- Run `npm test`, `npm run build`, and `npm run validate-readme-parity` before final handoff.
- Use `npm run build && npm run preview` for Pagefind and network-log verification because Pagefind assets exist only after build.

| Acceptance area | Named verification |
| --- | --- |
| AC1.1 tokens | Build succeeds; component/page styles use CSS custom properties rather than hardcoded component colours, except intentional monogram gradient values in `monogram.ts`. |
| AC1.2 self-hosted Inter | Browser network log in build preview shows font assets served from the site origin and no requests to Google Fonts, gstatic, jsDelivr, unpkg, or other font/CDN origins. |
| AC1.3 tint badges | Browser/manual or component render check confirms pricing/deprecated badges use tint foreground/background token pairs, not solid green/red fills. |
| AC2.1-AC2.5 category rail | `categories.test.ts` and `filterProjects.test.ts` cover rollup, hardware merge, derived counts, deprecated partitioning, single-select category behavior, and category+tag AND composition. Browser check confirms current live counts. |
| AC3.1-AC3.3 tag bar | `tagDisplay.test.ts` covers usage sorting, top-12 collapse, `+N more`, selected-tag pinning, and selected low-usage visibility. `filterProjects.test.ts` covers AND counts. |
| AC4.1-AC4.4 view toggle/cards | `monogram.test.ts` covers deterministic fallback selection. Browser/manual check confirms compact default, visual media/fallback mode, `localStorage` persistence, max 4 visible card tags, and no image area in compact mode. `grep -R "placeholder.svg" src public` must find no live references. |
| AC5.1-AC5.3 URL state | `filterState.test.ts` covers parse/serialize, round trip, unknown category fallback, unknown tag dropping, and all-invalid defaults. Browser check confirms `history.replaceState` updates without reload and URL reload restores state. |
| AC6.1-AC6.4 other surfaces | Browser/manual or Playwright checks cover header/search/footer, `src/pages/projects/[...id].astro`, `/tags/`, `/tags/[tag]`, and widths 375px, 768px, and 1200px+. |
| AC7.1 non-regression | `npm run build` and `npm run validate-readme-parity`. |
| AC7.2 Pagefind | `npm run build && npm run preview`; search for “Buttplug Rust” and follow result to `/projects/buttplug-rust`. |
| AC7.3 Matomo | Source/build check confirms the existing conditional `PUBLIC_MATOMO_SITE_ID` gate remains in `BaseLayout.astro`; with the env var unset, Matomo is absent from built pages. |

Update `docs/test-plans/2026-05-30-awesome-buttplug-site.md` with the new UI paths:

- Replace placeholder-image card expectations with compact-default and visual fallback expectations.
- Add category rail checks for counts, single-select behavior, hardware merge, deprecated category, and horizontal mobile scrolling.
- Add tag overflow checks: top 12 collapsed, `+N more`, selected low-usage tags remain visible.
- Add URL restore checks for `cat` and comma-separated `tags` params, including invalid values.
- Add view-toggle `localStorage` persistence.
- Add network-log check for no external font/CDN requests.
- Keep Pagefind search validation under `npm run build && npm run preview`.

### Review Strategy

Before implementation handoff, run a plan-focused review subagent against this design and the detailed implementation plan. After implementation, run an implementation review subagent against the changed files and acceptance criteria; fix or explicitly rebut all high/critical findings before final validation.

### Risks, Blockers, and Required Decisions

- Browser-only behaviors (URL restore, `localStorage`, Pagefind UI, responsive rail scrolling, and network-log font checks) are manual unless a browser test harness is added.
- Category count numbers in the acceptance criteria are a snapshot for the current 189-entry dataset; implementation must compute counts from data so future content changes do not require code changes.
- Pagefind cannot be fully checked from `npm run dev`; use build/preview.
- Keep scope presentation-layer only. Do not modify `src/content/`, `src/content.config.ts`, `config/readme-order.yaml`, `scripts/`, generated `README.md`, or Matomo behavior.

## Glossary

- **Category rail**: horizontal single-select chip row of top-level categories rolled up from section ids; a filter control, not page structure
- **View toggle**: compact ⇄ visual card switch; compact is text-only, visual adds a media slot
- **Gradient-monogram fallback**: deterministic gradient + first-letter tile shown in visual mode for entries without an image
- **Soft elevation**: the chosen visual direction — borderless surfaces distinguished from the background by shadow and lightness rather than borders
- **Tint pair**: translucent background plus saturated foreground of the same hue, used for status badges instead of solid fills
