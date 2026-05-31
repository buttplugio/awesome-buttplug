# awesome-buttplug

Last verified: 2026-05-30

## Tech Stack
- Framework: Astro 6 (static output) + Preact islands
- Search: Pagefind (post-build indexing)
- Language: TypeScript
- Node: >=22
- Analytics: Matomo (conditional on MATOMO env vars)

## Commands
- `npm run dev` - Start Astro dev server
- `npm run build` - Production build (also runs postbuild README generation)
- `npm run generate-readme` - Generate README.generated.md from content collection
- `npm run validate-readme-parity` - Check README.md matches generated output

## Project Structure
- `src/content/projects/` - Content collection: one .md file per project (189 entries)
- `src/content.config.ts` - Zod schema for project frontmatter
- `src/components/` - Preact islands (ProjectFilter, CardGrid, TagBar) and Astro components (ProjectCard)
- `src/pages/` - Astro routes: index, `/projects/[id]`, `/tags/`, `/tags/[tag]`
- `src/layouts/` - BaseLayout (global shell + analytics), ProjectLayout
- `src/styles/` - global.css (dark theme), filter.css (tag filtering UI)
- `src/types.ts` - Shared ProjectEntry interface
- `scripts/` - generate-readme.ts, migrate-readme.ts, validate-readme-parity.ts
- `config/readme-order.yaml` - Section ordering and hierarchy for README generation
- `docs/implementation-plans/` - Design and implementation plans

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

## Key Invariants
- README.md is auto-generated from the content collection via postbuild hook
- generate-readme.ts refuses to write README.md if fewer than 189 entries or orphaned sections exist
- Tags must be URL-safe slugs (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`)
- Every project section must be listed in `config/readme-order.yaml`
- The site is fully static (no SSR)

## Conventions
- Tags are for filtering (cross-cutting concerns like "open-source", "free", "utility")
- Sections are for categorical grouping (matches README hierarchy)
- Preact islands handle client-side interactivity (tag filtering with AND logic)
- Static tag pages at `/tags/[tag]` for SEO; client-side filtering on index for UX

## Boundaries
- Safe to edit: `src/`, `scripts/`, `config/`
- Never hand-edit: `README.md` (auto-generated from content collection)
- Never commit: `node_modules/`, `dist/`, `.astro/`, `README.generated.md`
