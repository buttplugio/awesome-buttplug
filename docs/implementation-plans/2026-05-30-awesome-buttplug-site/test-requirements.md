# Test Requirements: awesome-buttplug-site

Maps each acceptance criterion to its verification method. Given this is an Astro 6 static site with no existing test infrastructure, many criteria are verified by the build process itself (Zod schema validation, Astro content collections, static page generation) rather than a dedicated test runner.

## Verification Method Legend

| Method | Description |
|--------|-------------|
| **Build Validation** | The Astro build process itself catches violations. No separate test runner needed. |
| **Script Validation** | A project script (e.g., `npm run generate-readme`) validates the criterion when executed. |
| **Automated Test** | Requires a test runner (vitest) or automated check script. |
| **Human Verification** | Requires visual inspection in a browser or manual interaction. |

---

## AC1: Site builds and serves as static output

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC1.1** `npm run build` produces static HTML in `dist/` with no server required | Build Validation | Run `npm run build` and assert exit code 0; verify `dist/` directory contains `.html` files. Can be a CI step: `npm run build && test -d dist && ls dist/*.html` |
| **AC1.2** `npm run dev` starts local dev server with hot reload | Human Verification | Run `npm run dev`, open browser, confirm page loads and edits trigger reload. **Justification:** Hot reload behavior requires interactive observation of file-change responsiveness. |
| **AC1.3** Build fails with clear error when Zod schema validation rejects a malformed entry | Build Validation | Create a deliberately malformed entry file (missing required field), run `npm run build`, assert exit code != 0 and stderr contains a Zod validation error message. |

---

## AC2: Entry data model

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC2.1** Entry with all required fields passes schema validation | Build Validation | Seed entries with all required fields exist and `npm run build` succeeds. Verified implicitly every build. |
| **AC2.2** Entry missing required field fails build with descriptive error | Build Validation | Same negative-test approach as AC1.3. Create entry missing `url`, run build, assert failure. |
| **AC2.3** Entry with optional fields omitted builds successfully with defaults applied | Build Validation | Seed entries that omit optional fields exist in the seed set. Build succeeding with these entries is the verification. |
| **AC2.4** All ~189 migrated project entries exist as individual `.md` files and pass validation | Build Validation + Automated Test | `npm run build` passing validates all entries. Count check should equal the migration script's in-scope entry count, currently 189; greater-than checks are not sufficient because duplicate seed slugs can inflate the count. |

---

## AC3: Card display and detail pages

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC3.1** Cards display title, summary, tag pills, placeholder image, and pricing/status badge | Human Verification | **Justification:** Visual layout and element rendering require browser inspection. |
| **AC3.2** Clicking a card navigates to `/projects/{slug}` showing full markdown body and metadata | Build Validation + Human Verification | Build validation: verify detail page HTML files exist. Human: click-through navigation and rendered markdown body. |
| **AC3.3** Detail page displays clickable tag links | Build Validation | Grep detail page HTML for tag link elements: `grep -c 'href="/tags/' dist/projects/*/index.html`. |

---

## AC4: Tag-based filtering

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC4.1** Tag bar displays all tags present across entries | Human Verification | **Justification:** Tag bar is rendered by a Preact island hydrated client-side; requires JS execution. |
| **AC4.2** Clicking a tag filters cards to show only entries matching that tag | Human Verification | **Justification:** Client-side interactive filtering requires JS execution and DOM observation. |
| **AC4.3** Clicking multiple tags filters with AND logic | Human Verification | **Justification:** Client-side interaction requiring JS execution. Select two tags, verify only entries with BOTH tags appear. |
| **AC4.4** Clearing all tag selections shows all entries | Human Verification | **Justification:** Client-side state reset. Select tags, clear, verify all entries return. |
| **AC4.5** Static tag pages at `/tags/{tag}` list all entries with that tag | Build Validation | Verify tag page files exist: `ls dist/tags/*/index.html | wc -l` should match unique tag count. |

---

## AC5: Deprecated entries

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC5.1** Entries tagged `deprecated` display with visual distinction | Human Verification | **Justification:** "Visual distinction" (muted styling, badge appearance) is inherently a visual criterion. |

---

## AC6: Search

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC6.1** Pagefind search bar in header finds entries by text content | Human Verification | **Justification:** Pagefind requires `npm run build` + `npm run preview`. Search is client-side JS. Build, preview, type a known project name, confirm results. |
| **AC6.2** Search results link to the correct detail page | Human Verification | **Justification:** Requires running search and clicking a result. Partial build validation: `test -d dist/pagefind`. |

---

## AC7: README generation

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC7.1** `npm run generate-readme` produces correct output file | Script Validation | Run `npm run generate-readme`, verify expected output file exists. |
| **AC7.2** Each entry appears in the correct section formatted as name-link + indented bullet points | Automated Test | Covered by `scripts/validate-readme-parity.ts` during migration, then by `npm run generate-readme -- --full && git diff --exit-code README.md` after generated README output is enabled. |
| **AC7.3** Entries not matching any section produce a build warning | Script Validation | Add test entry with unmapped section, run `npm run generate-readme 2>&1`, assert warning in output. |
| **AC7.4** Generated README is structurally equivalent to migrated project sections | Automated Test | Structural diff script comparing generated README against original. **Suggested:** `scripts/validate-readme-parity.ts` |

---

## AC8: Analytics and polish

| Criterion | Method | Verification |
|-----------|--------|--------------|
| **AC8.1** Matomo tracking script loads on all pages with correct site ID | Build Validation | `grep -rl 'metrics.nonpolynomial.com' dist/ | wc -l` should match total page count. |
| **AC8.2** Site is responsive on mobile and desktop viewports | Human Verification | **Justification:** Responsive design assessment requires rendering at multiple viewport widths. |

---

## Summary Matrix

| AC | Count | Build Validation | Automated Test | Script Validation | Human Verification |
|----|-------|-------------------|----------------|--------------------|--------------------|
| AC1 | 3 | 2 | 0 | 0 | 1 |
| AC2 | 4 | 4 | 1 | 0 | 0 |
| AC3 | 3 | 1 | 0 | 0 | 2 |
| AC4 | 5 | 1 | 0 | 0 | 4 |
| AC5 | 1 | 0 | 0 | 0 | 1 |
| AC6 | 2 | 0 | 0 | 0 | 2 |
| AC7 | 4 | 0 | 2 | 2 | 0 |
| AC8 | 2 | 1 | 0 | 0 | 1 |
| **Total** | **24** | **9** | **3** | **2** | **11** |

## Recommendations

1. **No vitest needed initially.** Zod schema validation via Astro's content collections and build-time page generation cover 9 of 24 criteria without any test runner.
2. **One custom validation script covers migration parity.** `scripts/validate-readme-parity.ts` is required before the first root README overwrite. After that, CI should regenerate README and fail on uncommitted drift.
3. **Playwright is the path to automating the 11 human-verification criteria**, particularly AC4.1-AC4.4 (tag filtering) and AC6.1-AC6.2 (Pagefind search). Not needed for initial delivery.
4. **CI pipeline suggestion during migration:** `npm run build && npm run generate-readme && npm run validate-readme-parity`.
5. **CI pipeline suggestion after root README generation is enabled:** `npm run build && npm run generate-readme -- --full && git diff --exit-code README.md`.
