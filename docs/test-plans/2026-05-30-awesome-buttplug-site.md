# Human Test Plan: Awesome Buttplug Site

## Prerequisites

- Node.js >= 22 installed
- Run `npm install` in the project root
- Run `npm run build` and confirm exit code 0 (validates all Build Validation criteria)
- Run `npm run generate-readme` and confirm it produces `README.generated.md`
- Run `npm run validate-readme-parity` and confirm exit code 0
- Have a modern browser available (Chrome or Firefox recommended)

## Phase 1: Dev Server and Hot Reload (AC1.2)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Run `npm run dev` in the project root | Terminal shows local dev server URL (e.g., `http://localhost:4321`) |
| 1.2 | Open the URL in a browser | Home page loads showing project cards |
| 1.3 | Edit `src/pages/index.astro` -- add a visible text string like "HOT RELOAD TEST" to the template | Browser automatically refreshes (or updates via HMR) showing the added text |
| 1.4 | Revert the edit | Page returns to original state |

## Phase 2: Card Display (AC3.1)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | On the home page, examine any project card | Card displays: project title, summary text, colored tag pills, a placeholder image (or image if provided), and pricing/status badge if applicable |
| 2.2 | Find a card for an entry with `pricing` set in its frontmatter | A pricing badge is visible on the card |
| 2.3 | Scroll through the card grid | Cards are laid out in a responsive grid with consistent sizing |

## Phase 3: Detail Page Navigation (AC3.2)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Click on the "Buttplug Rust" card (or navigate to `/projects/buttplug-rust`) | Page loads at `/projects/buttplug-rust` showing the full title "Buttplug Rust" |
| 3.2 | Verify the detail page content | Page shows: title, "Visit Project" link, tag links (library, rust), and the markdown body text |
| 3.3 | Click the browser back button | Returns to the home page |

## Phase 4: Tag Filtering (AC4.1 - AC4.4)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | On the home page, locate the tag bar (rendered by the Preact island) | Tag bar displays multiple tag pills representing all tags present across entries |
| 4.2 | Click the "library" tag | Card grid filters to show only entries tagged with "library"; other entries disappear |
| 4.3 | While "library" is selected, also click "rust" | Card grid narrows further to show only entries tagged with BOTH "library" AND "rust" |
| 4.4 | Click both active tags to deselect them (or click "Clear filters") | All entries reappear in the card grid |
| 4.5 | Navigate to `/tags` page | Page lists all tags as links |
| 4.6 | Click any tag link (e.g., "game-mod") | Navigates to `/tags/game-mod` showing all entries with that tag |

## Phase 5: Deprecated Entries (AC5.1)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | On the home page, find an entry tagged "deprecated" | The card displays with visual distinction: muted/reduced opacity styling and a "Deprecated" badge |
| 5.2 | Click the deprecated entry to view its detail page | Detail page shows the "Deprecated" badge and deprecation reason with distinct styling (italic text with left border) |
| 5.3 | On `/tags/deprecated`, verify deprecated entries are listed | Entries appear with reduced opacity CSS class applied |

## Phase 6: Search (AC6.1 - AC6.2)

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Run `npm run build && npm run preview` | Preview server starts (Pagefind index is only generated during build) |
| 6.2 | Open the preview URL in a browser | Home page loads with a search bar in the header |
| 6.3 | Type "Buttplug Rust" into the search bar | Search results appear showing "Buttplug Rust" as a match |
| 6.4 | Click the "Buttplug Rust" search result | Browser navigates to `/projects/buttplug-rust` detail page |
| 6.5 | Return to home page and search for a unique term from a project's body text | Pagefind finds the entry by body content, confirming full-text indexing |

## Phase 7: Responsiveness (AC8.2)

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Open the site at desktop width (1280px+) | Card grid displays in multiple columns; header, tag bar, and footer are properly laid out |
| 7.2 | Resize browser to tablet width (~768px) | Layout adjusts: fewer columns in grid, elements remain readable and properly spaced |
| 7.3 | Resize browser to mobile width (~375px) | Layout stacks to single column; tag bar wraps; search bar remains accessible; no horizontal overflow |
| 7.4 | Open a detail page at mobile width | Content is readable; tag pills wrap; links are tappable |

## End-to-End: Full Migration Pipeline

1. Start from a clean state: `rm -rf dist/ README.generated.md`
2. Run `npm run build` -- confirms all 189 entries pass Zod validation and static pages are generated
3. Verify `dist/` contains HTML: `ls dist/index.html dist/projects/buttplug-rust/index.html dist/tags/index.html`
4. Run `npm run generate-readme` -- produces `README.generated.md`
5. Run `npm run validate-readme-parity` -- confirms structural match with `README.md`
6. Run `npm run build` again (triggers postbuild hook) -- confirms full migration mode and build completion

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

| Acceptance Criterion | Automated Test | Manual Step |
|----------------------|----------------|-------------|
| AC1.1 Static build | `npm run build` exit code | -- |
| AC1.2 Hot reload | -- | Phase 1 |
| AC1.3 Malformed entry fails | Zod schema | E2E: Invalid Entry |
| AC2.1 Required fields pass | 189 entries + build | -- |
| AC2.2 Missing field fails | Zod schema | E2E: Invalid Entry |
| AC2.3 Optional fields default | Entries with omissions + build | -- |
| AC2.4 189 entries migrated | File count + build | -- |
| AC3.1 Card display | -- | Phase 2 |
| AC3.2 Detail pages | `[...id].astro` static paths | Phase 3 |
| AC3.3 Tag links on detail | Template renders tag hrefs | -- |
| AC4.1 Tag bar | -- | Phase 4.1 |
| AC4.2 Single tag filter | -- | Phase 4.2 |
| AC4.3 AND filter | -- | Phase 4.3 |
| AC4.4 Clear filter | -- | Phase 4.4 |
| AC4.5 Static tag pages | `[tag].astro` static paths | Phase 4.5-4.6 |
| AC5.1 Deprecated styling | -- | Phase 5 |
| AC6.1 Pagefind search | -- | Phase 6.2-6.5 |
| AC6.2 Search result links | -- | Phase 6.4 |
| AC7.1 generate-readme output | `npm run generate-readme` | -- |
| AC7.2 Entry formatting | `validate-readme-parity.ts` | -- |
| AC7.3 Unmapped section warning | `generate-readme.ts` orphan detection | -- |
| AC7.4 Structural equivalence | `validate-readme-parity.ts` | -- |
| AC8.1 Matomo tracking | BaseLayout conditional script | -- |
| AC8.2 Responsive design | -- | Phase 7 |
