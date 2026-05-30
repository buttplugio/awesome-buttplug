# Awesome Buttplug Site Implementation Plan — Phase 1: Project Scaffold

**Goal:** Initialise Astro project with Preact integration, Pagefind, and base layout so `npm install`, `npm run dev`, and `npm run build` all succeed.

**Architecture:** Astro 6 static site with Preact islands for interactive components. Pagefind for client-side search (post-build indexing). All output is static HTML — no server runtime.

**Tech Stack:** Astro 6.3.x, @astrojs/preact 5.x, astro-pagefind 1.x, Preact, TypeScript, Node 24+ (LTS)

**Scope:** 8 phases from original design (this is phase 1 of 8)

**Codebase verified:** 2026-05-30 — repo is greenfield, no existing package.json, tsconfig, src/, or build infrastructure. Only README.md and check_links.py exist.

---

## Acceptance Criteria Coverage

This is an infrastructure phase. **Verifies: None** — verification is operational (install, dev, build succeed).

Covers design "Done when": `npm install` succeeds, `npm run dev` serves a page, `npm run build` produces static output in `dist/`

---

<!-- START_TASK_1 -->
### Task 1: Create package.json and install dependencies

**Files:**
- Create: `package.json`

**Step 1: Create package.json**

```json
{
  "name": "awesome-buttplug",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "engines": {
    "node": ">=22"
  },
  "dependencies": {
    "astro": "^6.3.1",
    "@astrojs/preact": "^5.1.1",
    "preact": "^10.25.0",
    "astro-pagefind": "^1.8.5"
  }
}
```

**Step 2: Install dependencies**

Run: `npm install`
Expected: Installs without errors, creates `node_modules/` and `package-lock.json`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: initialise package.json with Astro, Preact, and Pagefind deps"
```
<!-- END_TASK_1 -->

<!-- START_TASK_2 -->
### Task 2: Create tsconfig.json and astro.config.ts

**Files:**
- Create: `tsconfig.json`
- Create: `astro.config.ts`

**Step 1: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  },
  "exclude": ["dist"]
}
```

**Step 2: Create astro.config.ts**

```typescript
import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import pagefind from "astro-pagefind";

export default defineConfig({
  output: "static",
  integrations: [preact(), pagefind()],
});
```

**Step 3: Commit**

```bash
git add tsconfig.json astro.config.ts
git commit -m "chore: add Astro and TypeScript configuration"
```
<!-- END_TASK_2 -->

<!-- START_TASK_3 -->
### Task 3: Create .gitignore

**Files:**
- Create: `.gitignore`

**Step 1: Create .gitignore**

```
node_modules/
dist/
.astro/
check_links.py
```

**Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .gitignore for node_modules, dist, and .astro"
```
<!-- END_TASK_3 -->

<!-- START_TASK_4 -->
### Task 4: Create BaseLayout and placeholder index page

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/index.astro`

**Step 1: Create the directory structure**

```bash
mkdir -p src/layouts src/pages
```

**Step 2: Create `src/layouts/BaseLayout.astro`**

This is the site shell used by all pages. Matomo analytics will be added in Phase 8; leave a comment placeholder for now.

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
  </head>
  <body>
    <header>
      <nav>
        <a href="/">Awesome Buttplug</a>
      </nav>
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <p>A curated list of awesome projects using the Buttplug protocol.</p>
    </footer>
  </body>
</html>
```

**Step 3: Create `src/pages/index.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Home">
  <h1>Awesome Buttplug</h1>
  <p>A curated list of awesome projects using the Buttplug sex toy control protocol.</p>
</BaseLayout>
```

**Step 4: Verify dev server starts**

Run: `npm run dev`
Expected: Dev server starts on `http://localhost:4321/`, page renders with "Awesome Buttplug" heading. Stop the dev server after confirming.

**Step 5: Verify build produces static output**

Run: `npm run build`
Expected: Build completes successfully, `dist/` directory is created with `index.html`

Run: `ls dist/index.html`
Expected: File exists

**Step 6: Commit**

```bash
git add src/layouts/BaseLayout.astro src/pages/index.astro
git commit -m "feat: add BaseLayout and placeholder index page"
```
<!-- END_TASK_4 -->
