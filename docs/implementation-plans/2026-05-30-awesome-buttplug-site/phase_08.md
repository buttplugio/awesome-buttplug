# Awesome Buttplug Site Implementation Plan — Phase 8: Polish & Analytics

**Goal:** Add Matomo analytics, refine CSS for visual polish, ensure responsive layout on mobile/desktop, and add favicon and site metadata for production readiness.

**Architecture:** Matomo inline tracking script in BaseLayout. Global CSS for dark theme, typography, and responsive grid. Favicon and OpenGraph metadata in astro.config.ts.

**Tech Stack:** Matomo (self-hosted at metrics.nonpolynomial.com), CSS, Astro config

**Scope:** 8 phases from original design (this is phase 8 of 8)

**Codebase verified:** 2026-05-30 — BaseLayout.astro has basic header/main/footer structure with Pagefind search. Card grid and tag filtering are functional from Phases 3-4. No existing CSS reset or global styles.

---

## Acceptance Criteria Coverage

This phase implements and tests:

### awesome-buttplug-site.AC8: Analytics and polish
- **awesome-buttplug-site.AC8.1 Success:** Matomo tracking script loads on all pages with correct site ID
- **awesome-buttplug-site.AC8.2 Success:** Site is responsive on mobile and desktop viewports

---

<!-- START_TASK_1 -->
### Task 1: Add Matomo analytics to BaseLayout

**Verifies:** awesome-buttplug-site.AC8.1

**Files:**
- Modify: `src/layouts/BaseLayout.astro` (add Matomo tracking script)

**Note:** Since `ProjectLayout.astro` wraps `BaseLayout.astro` (see Phase 3), Matomo only needs to be added to BaseLayout. All pages inherit it automatically.

**Step 1: Add Matomo script to BaseLayout**

Create the site in the Matomo admin panel before this task, then configure the real site ID through `PUBLIC_MATOMO_SITE_ID`. Do not commit a placeholder site ID. If the variable is absent, omit the tracking script; AC8.1 is not complete until the real site ID is configured and visible in the built HTML.

The script should be placed after the Pagefind scripts. Add this block:

```astro
---
const matomoSiteId = import.meta.env.PUBLIC_MATOMO_SITE_ID;
---

{matomoSiteId && (
<script define:vars={{ matomoSiteId }}>
  var _paq = window._paq = window._paq || [];
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="//metrics.nonpolynomial.com/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', matomoSiteId]);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();
</script>
)}
```

**Step 2: Verify in dev tools**

Run with the real ID, for example: `PUBLIC_MATOMO_SITE_ID=123 npm run dev`
Open browser dev tools on any page. Check the page source and Network tab — the script must contain the configured site ID and request `metrics.nonpolynomial.com/matomo.js`.

**Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add Matomo analytics tracking to all pages"
```
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Add global CSS with dark theme

**Verifies:** awesome-buttplug-site.AC8.2

**Files:**
- Create: `src/styles/global.css`
- Modify: `src/layouts/BaseLayout.astro` (import global CSS)

**Note:** ProjectLayout wraps BaseLayout, so it inherits the global CSS import automatically.

**Step 1: Create global stylesheet**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #0d0d1a;
  --bg-card: #1a1a2e;
  --text: #e0e0e0;
  --text-muted: #888;
  --accent: #e94560;
  --accent-hover: #ff6b81;
  --border: #333;
  --success: #28a745;
  --warning: #f0ad4e;
  --danger: #dc3545;
  --tag-bg: #2a2a4a;
  --max-width: 1200px;
}

html {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  color: var(--accent-hover);
}

header {
  border-bottom: 1px solid var(--border);
  padding: 1rem;
}

header nav {
  max-width: var(--max-width);
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

header nav a:first-child {
  font-weight: bold;
  font-size: 1.2rem;
}

#search {
  max-width: var(--max-width);
  margin: 0.5rem auto 0;
  padding: 0 1rem;
}

main {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 2rem 1rem;
  flex: 1;
  width: 100%;
}

footer {
  border-top: 1px solid var(--border);
  padding: 1.5rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
}

h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

h3 {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  header nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  main {
    padding: 1rem 0.75rem;
  }
}
```

**Step 2: Import in BaseLayout**

Add to the frontmatter of `BaseLayout.astro`:

```astro
---
import "../styles/global.css";
---
```

**Step 3: Commit**

```bash
git add src/styles/global.css src/layouts/BaseLayout.astro
git commit -m "feat: add global dark theme CSS with responsive layout"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Add favicon and site metadata

**Files:**
- Create: `public/favicon.svg`
- Modify: `src/layouts/BaseLayout.astro` (add favicon and meta tags)
- Modify: `astro.config.ts` (add site URL)

**Note:** ProjectLayout wraps BaseLayout, so favicon and meta tags only need to be added to BaseLayout.

**Step 1: Create a simple favicon**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#e94560"/>
  <text x="16" y="22" font-family="system-ui" font-size="18" fill="white" text-anchor="middle">AB</text>
</svg>
```

**Step 2: Add metadata to layout heads**

Add to the `<head>` of `BaseLayout.astro`:

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="description" content="A curated list of awesome projects using the Buttplug sex toy control protocol." />
<meta property="og:title" content={`${title} | Awesome Buttplug`} />
<meta property="og:description" content="A curated list of awesome projects using the Buttplug sex toy control protocol." />
<meta property="og:type" content="website" />
```

**Step 3: Set site URL in astro.config.ts**

Add the `site` field to `astro.config.ts`. Use a placeholder URL that can be updated when deployment is configured:

```typescript
export default defineConfig({
  site: "https://awesome.buttplug.io",
  output: "static",
  integrations: [preact(), pagefind()],
});
```

**Step 4: Commit**

```bash
git add public/favicon.svg src/layouts/BaseLayout.astro astro.config.ts
git commit -m "feat: add favicon, meta tags, and site URL configuration"
```
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Verify responsive layout and production build

**Verifies:** awesome-buttplug-site.AC8.1, awesome-buttplug-site.AC8.2

**Step 1: Build and preview**

Run with the real Matomo site ID, for example: `PUBLIC_MATOMO_SITE_ID=123 npm run build`
Run: `npm run preview`

**Step 2: Verify desktop layout**

Open in browser at full width:
- Header with site name, "Tags" link, and Pagefind search bar
- Card grid with 3-4 columns on wide screens
- Tag bar wraps neatly
- Detail pages show metadata and content clearly
- Footer at bottom

**Step 3: Verify mobile layout**

Use browser dev tools to simulate mobile viewport (375px width):
- Header stacks vertically
- Card grid collapses to single column
- Tag pills wrap within viewport
- Search bar full width
- Text readable without horizontal scrolling

**Step 4: Verify Matomo script in page source**

View page source from a build run with the real `PUBLIC_MATOMO_SITE_ID` set — confirm the Matomo script block is present with the `metrics.nonpolynomial.com` URL and the real site ID, not a placeholder.

**Step 5: Final build verification**

Run with the real Matomo site ID, for example: `PUBLIC_MATOMO_SITE_ID=123 npm run build`
Expected: Clean build with no warnings. Check `dist/` contains:
- `index.html`
- `projects/` directory with ~189 HTML files
- `tags/` directory with tag pages
- `pagefind/` directory with search index
- `favicon.svg`

**Step 6: Commit (no changes needed — verification only)**
<!-- END_TASK_4 -->
