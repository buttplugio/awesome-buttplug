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

## Acceptance Criteria

### visual-overhaul.AC1: Design tokens

- **visual-overhaul.AC1.1 Success:** `global.css` defines the soft-elevation token set (charcoal backgrounds, shadow levels, radii, accent, status tints) as CSS custom properties; no component styles hardcode colours
- **visual-overhaul.AC1.2 Success:** Inter Variable loads from the site's own origin; no external font/CDN requests appear in the network log
- **visual-overhaul.AC1.3 Success:** Pricing and deprecation badges render as tinted backgrounds with readable contrast, not solid green/red fills

### visual-overhaul.AC2: Category rail

- **visual-overhaul.AC2.1 Success:** Rail shows All (189), Game Mods (58), Applications (48), Development & Libraries (28), Games (15), Virtual Worlds (8), Hardware (3), Deprecated (29), with live counts
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
- **visual-overhaul.AC5.3 Success:** Invalid or unknown param values are ignored gracefully (grid shows all entries)

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

### Testing

- `npm run build` + `npm run validate-readme-parity` as the regression gate
- Manual golden-path verification in browser at 375/768/1200px: category selection, tag AND filtering, both view modes, URL restore, deprecated treatment, search overlay, detail page
- Update `docs/test-plans/` entry for the site with the new UI paths

## Glossary

- **Category rail**: horizontal single-select chip row of top-level categories rolled up from section ids; a filter control, not page structure
- **View toggle**: compact ⇄ visual card switch; compact is text-only, visual adds a media slot
- **Gradient-monogram fallback**: deterministic gradient + first-letter tile shown in visual mode for entries without an image
- **Soft elevation**: the chosen visual direction — borderless surfaces distinguished from the background by shadow and lightness rather than borders
- **Tint pair**: translucent background plus saturated foreground of the same hue, used for status badges instead of solid fills
