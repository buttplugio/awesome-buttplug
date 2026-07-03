# Human Test Plan: Awesome Buttplug Site

## Prerequisites

- Node.js >= 22 installed
- Run `npm install` in the project root
- Run `npm test` and confirm exit code 0
- Run `npm run build` and confirm exit code 0 (validates Astro static output, Pagefind indexing, and postbuild README generation)
- Run `npm run validate-readme-parity` and confirm exit code 0
- Have a modern browser available (Chrome or Firefox recommended)

## Phase 1: Dev Server and Hot Reload

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Run `npm run dev` in the project root | Terminal shows local dev server URL (e.g., `http://localhost:4321`) |
| 1.2 | Open the URL in a browser | Home page loads with the soft-elevation dark theme, category rail, tag controls, and compact project cards |
| 1.3 | Edit `src/pages/index.astro` -- add a visible text string like "HOT RELOAD TEST" to the template | Browser automatically refreshes (or updates via HMR) showing the added text |
| 1.4 | Revert the edit | Page returns to original state |

## Phase 2: Home Page Visual Overhaul

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | On the home page, examine the header and footer | Header has site title, Tags nav, Pagefind search, charcoal background, and hairline rules matching the soft-elevation token set |
| 2.2 | Inspect the first project card in default mode | Compact card displays title, pricing/deprecated badge when applicable, summary, and up to 4 tag pills; no image/media area is shown |
| 2.3 | Scroll through the card grid | Cards are borderless raised surfaces with shadows, 12px radii, and responsive grid sizing |
| 2.4 | Find a card with pricing | Pricing badge uses a tinted background/foreground pair, not a solid green fill |
| 2.5 | Find a deprecated card | Deprecated card is muted and shows a tinted Deprecated badge; deprecated entries sort last in All |

## Phase 3: Category Rail

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Locate the category rail on the home page | Rail shows derived counts: All 189, Game Mods 58, Applications 48, Development & Libraries 28, Games 15, Virtual Worlds 8, Hardware 3, Deprecated 29 |
| 3.2 | Click Game Mods | Grid filters to Game Mods and the result count shows 58 projects |
| 3.3 | Click Applications | Game Mods is deselected and Applications becomes the only selected category |
| 3.4 | Click the selected Applications chip again or click All | Category filter resets to All |
| 3.5 | Click Hardware | Hardware includes both hardware-support and diy-hardware entries, with 3 projects total |
| 3.6 | Click Deprecated | Only deprecated entries are shown |
| 3.7 | Resize to 375px wide | Rail scrolls horizontally without causing page-wide horizontal overflow |

## Phase 4: Tag Filtering and Overflow

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | On the home page, locate the tag bar | Collapsed bar shows the top 12 tags sorted by usage count descending plus a `+N more` expander |
| 4.2 | Click `+N more` | All tags become visible and a `show fewer` control appears |
| 4.3 | Select a long-tail/low-usage tag, then collapse the bar | Selected low-usage tag remains visible even if it is outside the top 12 |
| 4.4 | Click `library` | Grid filters to entries tagged `library`; active tag styling appears |
| 4.5 | While `library` is selected, click `rust` | Grid narrows further to entries tagged with BOTH `library` AND `rust` |
| 4.6 | Click Clear | All tag filters clear and the grid returns to the active category's full result set |
| 4.7 | Select category Game Mods, then tag `vr` | Category and tag filters compose with AND logic; counts update without a page reload |

## Phase 5: URL State and View Toggle

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Select Game Mods and tag `vr` | Address bar updates to a query like `/?cat=game-mods&tags=vr` without reloading |
| 5.2 | Reload the filtered URL | Selected category, selected tags, and filtered grid restore from the URL |
| 5.3 | Navigate to `/?cat=bogus&tags=free,nope` | Unknown category resets to All; valid tag `free` remains selected; unknown tag `nope` is ignored |
| 5.4 | Navigate to `/?cat=bogus&tags=nope` | Invalid params are ignored and the default All/no-tags grid appears |
| 5.5 | Confirm Compact is the default view | Cards show no media/image area |
| 5.6 | Click Visual | Cards show a media slot; entries without images show deterministic gradient monogram fallbacks |
| 5.7 | Reload the page | Visual mode persists via localStorage |
| 5.8 | Toggle back to Compact | Media areas disappear and compact cards return |

## Phase 6: Detail Page Navigation and Metadata

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Click the "Buttplug Rust" card (or navigate to `/projects/buttplug-rust`) | Page loads at `/projects/buttplug-rust` showing the full title "Buttplug Rust" |
| 6.2 | Verify the detail page metadata block | Raised metadata block shows Visit Project link, Source Code link when available, platforms when available, and pricing when available |
| 6.3 | Verify detail page tags | Tags render as rounded token-styled pills linking to `/tags/{tag}` |
| 6.4 | Open a deprecated project detail page | Deprecated badge is tinted, article is muted, and deprecation reason uses warning-tinted styling |
| 6.5 | Click the browser back button | Returns to the home page |

## Phase 7: Static Tag Pages

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Navigate to `/tags` | Page lists all tags as rounded token-styled links |
| 7.2 | Click any tag link (e.g., `/tags/game-mod`) | Navigates to a tag detail page showing all entries with that tag |
| 7.3 | Inspect tag detail cards | Cards use raised soft-elevation styling and muted deprecated styling when applicable |
| 7.4 | Click tag pills within a tag detail card | Browser navigates to the corresponding static tag route |

## Phase 8: Pagefind Search

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Run `npm run build && npm run preview` | Preview server starts; Pagefind assets exist only after build |
| 8.2 | Open the preview URL in a browser | Home page loads with a search bar in the header |
| 8.3 | Type "Buttplug Rust" into the search bar | Search results appear showing "Buttplug Rust" as a match |
| 8.4 | Click the "Buttplug Rust" search result | Browser navigates to `/projects/buttplug-rust` detail page |
| 8.5 | Return to home page and search for a unique term from a project's body text | Pagefind finds the entry by body content, confirming full-text indexing |

## Phase 9: Responsiveness and Network Checks

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Open the site at desktop width (1200px+) | Header/search, category rail, toolbar, and card grid are properly aligned; grid has multiple columns |
| 9.2 | Resize browser to tablet width (~768px) | Layout adjusts with fewer columns; controls remain readable and tappable |
| 9.3 | Resize browser to mobile width (~375px) | Cards are single-column, toolbar wraps sanely, rail scrolls horizontally, and no page-wide horizontal overflow appears |
| 9.4 | Open a detail page at mobile width | Metadata block, tag pills, and content remain readable and tappable |
| 9.5 | In build preview, inspect browser network log | Inter font assets are served from the site origin; no requests go to Google Fonts, gstatic, jsDelivr, unpkg, or other external font/CDN origins |
| 9.6 | Build with `PUBLIC_MATOMO_SITE_ID` unset and inspect page source/network | Matomo script is absent when the env var is unset |

## End-to-End: Full Migration Pipeline

1. Start from a clean state: `rm -rf dist/ README.generated.md`
2. Run `npm test` -- confirms visual-overhaul pure logic tests pass
3. Run `npm run build` -- confirms all 189 entries pass Zod validation, static pages are generated, Pagefind indexes pages, and postbuild README generation completes
4. Verify `dist/` contains HTML: `ls dist/index.html dist/projects/buttplug-rust/index.html dist/tags/index.html`
5. Run `npm run generate-readme` -- produces `README.generated.md`
6. Run `npm run validate-readme-parity` -- confirms structural match with `README.md`
7. Run `npm run build` again (triggers postbuild hook) -- confirms full migration mode and build completion

## End-to-End: New Entry Addition

1. Create `src/content/projects/test-new-entry.md` with valid frontmatter (title, url, section, tags, summary, readme_bullets)
2. Run `npm run build` -- should succeed with 190 entries
3. Verify `dist/projects/test-new-entry/index.html` exists
4. Run `npm run dev`, navigate to `/projects/test-new-entry` -- detail page renders correctly
5. Run `npm run generate-readme` -- entry appears in the correct section
6. Delete `src/content/projects/test-new-entry.md` and rebuild to restore original state

## End-to-End: Invalid Entry Rejection

1. Create `src/content/projects/test-invalid.md` with missing required `url` field
2. Run `npm run build` -- should fail with exit code != 0
3. Verify stderr contains a Zod validation error mentioning the missing field
4. Delete the invalid file

## Traceability

| Acceptance Area | Automated Test | Manual Step |
|-----------------|----------------|-------------|
| Static build and content validation | `npm run build` | -- |
| Pure category/filter/tag/url/monogram behavior | `npm test` | -- |
| README parity | `npm run validate-readme-parity` | -- |
| Hot reload | -- | Phase 1 |
| Soft-elevation shell and compact cards | -- | Phase 2 |
| Category rail counts and filtering | `categories.test.ts`, `filterProjects.test.ts` | Phase 3 |
| Tag overflow and AND filtering | `tagDisplay.test.ts`, `filterProjects.test.ts` | Phase 4 |
| URL state | `filterState.test.ts` | Phase 5.1-5.4 |
| Compact/visual view toggle | `monogram.test.ts` | Phase 5.5-5.8 |
| Detail pages | `[...id].astro` static paths via build | Phase 6 |
| Static tag pages | `[tag].astro` static paths via build | Phase 7 |
| Pagefind search | Build Pagefind output | Phase 8 |
| Matomo conditional behavior | BaseLayout conditional script/source check | Phase 9.6 |
| Responsive design | -- | Phase 9.1-9.4 |
| Self-hosted font | Package/build/source check | Phase 9.5 |
