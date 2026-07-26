# awesome-buttplug

Last verified: 2026-07-25

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
- `src/components/` - Preact islands (ProjectFilter, CardGrid, TagBar, CategoryRail, ViewToggle) and Hero.astro
- `src/pages/` - Astro routes: index, `/projects/[id]`, `/tags/`, `/tags/[tag]`
- `src/layouts/` - BaseLayout (global shell, named `hero` slot, analytics), ProjectLayout
- `src/styles/` - fonts.css (@font-face), global.css (tokens + shell), filter.css (grid and tag filtering UI)
- `src/utils/` - categories.ts, monogram.ts, and their vitest suites
- `src/types.ts` - Shared ProjectEntry interface
- `scripts/` - generate-readme.ts, migrate-readme.ts, validate-readme-parity.ts
- `public/fonts/` - Vendored Aller and Alternate Gothic (TTF, see licence note below)
- `public/img/` - Family logo and squidplug watermark
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
- Safe to edit: `src/`, `scripts/`, `config/`
- Never hand-edit: `README.md` (auto-generated from content collection)
- Never commit: `node_modules/`, `dist/`, `.astro/`, `README.generated.md`

<!-- deciduous:start -->
## Decision Graph Workflow

**THIS IS MANDATORY. Log decisions IN REAL-TIME, not retroactively.**

### Available Slash Commands

| Command | Purpose |
|---------|---------|
| `/decision` | Manage decision graph - add nodes, link edges, sync |
| `/recover` | Recover context from decision graph on session start |
| `/work` | Start a work transaction - creates goal node before implementation |
| `/document` | Generate comprehensive documentation for a file or directory |
| `/build-test` | Build the project and run the test suite |
| `/serve-ui` | Start the decision graph web viewer |
| `/sync-graph` | Export decision graph to GitHub Pages |
| `/decision-graph` | Build a decision graph from commit history |
| `/sync` | Multi-user sync - pull events, rebuild, push |

### Available Skills

| Skill | Purpose |
|-------|---------|
| `/pulse` | Map current design as decisions (Now mode) |
| `/narratives` | Understand how the system evolved (History mode) |
| `/archaeology` | Transform narratives into queryable graph |

### The Node Flow Rule - CRITICAL

The canonical flow through the decision graph is:

```
goal -> options -> decision -> actions -> outcomes
```

- **Goals** lead to **options** (possible approaches to explore)
- **Options** lead to a **decision** (choosing which option to pursue)
- **Decisions** lead to **actions** (implementing the chosen approach)
- **Actions** lead to **outcomes** (results of the implementation)
- **Observations** attach anywhere relevant
- Goals do NOT lead directly to decisions -- there must be options first
- Options do NOT come after decisions -- options come BEFORE decisions
- Decision nodes should only be created when an option is actually chosen, not prematurely

### The Core Rule

```
BEFORE you do something -> Log what you're ABOUT to do
AFTER it succeeds/fails -> Log the outcome
CONNECT immediately -> Link every node to its parent
AUDIT regularly -> Check for missing connections
```

### Behavioral Triggers - MUST LOG WHEN:

| Trigger | Log Type | Example |
|---------|----------|---------|
| User asks for a new feature | `goal` **with -p** | "Add dark mode" |
| Exploring possible approaches | `option` | "Use Redux for state" |
| Choosing between approaches | `decision` | "Choose state management" |
| About to write/edit code | `action` | "Implementing Redux store" |
| Something worked or failed | `outcome` | "Redux integration successful" |
| Notice something interesting | `observation` | "Existing code uses hooks" |

### What NOT to Log - CRITICAL

**The decision graph records the USER'S project decisions, not your internal process.**

Nodes should capture what the user is building, choosing, and accomplishing. Do NOT create nodes for your own thinking, planning, or tooling steps.

**DO NOT create nodes for:**
- Reading/exploring the codebase ("Analyzing project structure", "Reading config files")
- Your planning process ("Planning implementation approach", "Evaluating options internally")
- Tool usage ("Running tests to check status", "Checking git log")
- Context gathering ("Understanding existing auth code", "Reviewing PR comments")
- Meta-commentary ("Starting work on this task", "Preparing to implement")

**DO create nodes for:**
- What the user asked for (goals)
- Concrete approaches being considered (options)
- Choices made between approaches (decisions)
- Code being written or changed (actions)
- Results of implementation (outcomes)
- Technical findings that affect decisions (observations)

**Rule of thumb:** If a node describes something the user would put on a project timeline or in a PR description, log it. If it describes your internal process of reading and thinking, don't.

### Document Attachments

Attach files (images, PDFs, diagrams, specs, screenshots) to decision graph nodes for rich context.

```bash
# Attach a file to a node
deciduous doc attach <node_id> <file_path>
deciduous doc attach <node_id> <file_path> -d "Architecture diagram"
deciduous doc attach <node_id> <file_path> --ai-describe

# List documents
deciduous doc list              # All documents
deciduous doc list <node_id>    # Documents for a specific node

# Manage documents
deciduous doc show <doc_id>     # Show document details
deciduous doc describe <doc_id> "Updated description"
deciduous doc describe <doc_id> --ai   # AI-generate description
deciduous doc open <doc_id>     # Open in default application
deciduous doc detach <doc_id>   # Soft-delete (recoverable)
deciduous doc gc                # Remove orphaned files from disk
```

**When to suggest document attachment:**

| Situation | Action |
|-----------|--------|
| User shares an image or screenshot | Ask: "Want me to attach this to the current goal/action node?" |
| User references an external document | Ask: "Should I attach a copy to the decision graph?" |
| Architecture diagram is discussed | Suggest attaching it to the relevant goal node |
| Files not in the project are dropped in | Attach to the most relevant active node |

**Do NOT aggressively prompt for documents.** Only suggest when files are directly relevant to a decision node. Files are stored in `.deciduous/documents/` with content-hash naming for deduplication.

### CRITICAL: Capture VERBATIM User Prompts

**Prompts must be the EXACT user message, not a summary.** When a user request triggers new work, capture their full message word-for-word.

**BAD - summaries are useless for context recovery:**
```bash
# DON'T DO THIS - this is a summary, not a prompt
deciduous add goal "Add auth" -p "User asked: add login to the app"
```

**GOOD - verbatim prompts enable full context recovery:**
```bash
# Use --prompt-stdin for multi-line prompts
deciduous add goal "Add auth" -c 90 --prompt-stdin << 'EOF'
I need to add user authentication to the app. Users should be able to sign up
with email/password, and we need OAuth support for Google and GitHub. The auth
should use JWT tokens with refresh token rotation.
EOF

# Or use the prompt command to update existing nodes
deciduous prompt 42 << 'EOF'
The full verbatim user message goes here...
EOF
```

**When to capture prompts:**
- Root `goal` nodes: YES - the FULL original request
- Major direction changes: YES - when user redirects the work
- Routine downstream nodes: NO - they inherit context via edges

**Updating prompts on existing nodes:**
```bash
deciduous prompt <node_id> "full verbatim prompt here"
cat prompt.txt | deciduous prompt <node_id>  # Multi-line from stdin
```

Prompts are viewable in the web viewer.

### CRITICAL: Maintain Connections

**The graph's value is in its CONNECTIONS, not just nodes.**

| When you create... | IMMEDIATELY link to... |
|-------------------|------------------------|
| `outcome` | The action that produced it |
| `action` | The decision that spawned it |
| `decision` | The option(s) it chose between |
| `option` | Its parent goal |
| `observation` | Related goal/action |
| `revisit` | The decision/outcome being reconsidered |

**Root `goal` nodes are the ONLY valid orphans.**

### Quick Commands

```bash
deciduous add goal "Title" -c 90 -p "User's original request"
deciduous add action "Title" -c 85
deciduous link FROM TO -r "reason"  # DO THIS IMMEDIATELY!
deciduous serve   # View live (auto-refreshes every 30s)
deciduous sync    # Export for static hosting

# Metadata flags
# -c, --confidence 0-100   Confidence level
# -p, --prompt "..."       Store the user prompt (use when semantically meaningful)
# -f, --files "a.rs,b.rs"  Associate files
# -b, --branch <name>      Git branch (auto-detected)
# --commit <hash|HEAD>     Link to git commit (use HEAD for current commit)
# --date "YYYY-MM-DD"      Backdate node (for archaeology)

# Branch filtering
deciduous nodes --branch main
deciduous nodes -b feature-auth
```

### CRITICAL: Link Commits to Actions/Outcomes

**After every git commit, link it to the decision graph!**

```bash
git commit -m "feat: add auth"
deciduous add action "Implemented auth" -c 90 --commit HEAD
deciduous link <goal_id> <action_id> -r "Implementation"
```

The `--commit HEAD` flag captures the commit hash and links it to the node. The web viewer will show commit messages, authors, and dates.

### Git History & Deployment

```bash
# Export graph AND git history for web viewer
deciduous sync

# This creates:
# - docs/graph-data.json (decision graph)
# - docs/git-history.json (commit info for linked nodes)
```

To deploy to GitHub Pages:
1. `deciduous sync` to export
2. Push to GitHub
3. Settings > Pages > Deploy from branch > /docs folder

Your graph will be live at `https://<user>.github.io/<repo>/`

### Branch-Based Grouping

Nodes are auto-tagged with the current git branch. Configure in `.deciduous/config.toml`:
```toml
[branch]
main_branches = ["main", "master"]
auto_detect = true
```

### Audit Checklist (Before Every Sync)

1. Does every **outcome** link back to what caused it?
2. Does every **action** link to why you did it?
3. Any **dangling outcomes** without parents?

### Git Staging Rules - CRITICAL

**NEVER use broad git add commands that stage everything:**
- ❌ `git add -A` - stages ALL changes including untracked files
- ❌ `git add .` - stages everything in current directory
- ❌ `git add -a` or `git commit -am` - auto-stages all tracked changes
- ❌ `git add *` - glob patterns can catch unintended files

**ALWAYS stage files explicitly by name:**
- ✅ `git add src/main.rs src/lib.rs`
- ✅ `git add Cargo.toml Cargo.lock`
- ✅ `git add .claude/commands/decision.md`

**Why this matters:**
- Prevents accidentally committing sensitive files (.env, credentials)
- Prevents committing large binaries or build artifacts
- Forces you to review exactly what you're committing
- Catches unintended changes before they enter git history

### Session Start Checklist

```bash
deciduous check-update    # Update needed? Run 'deciduous update' if yes
                          # (auto-checked every 24h if auto-update is on)
deciduous nodes           # What decisions exist?
deciduous edges           # How are they connected? Any gaps?
deciduous doc list        # Any attached documents to review?
git status                # Current state
```

### Multi-User Sync

Sync decisions with teammates via event logs:

```bash
# Check sync status
deciduous events status

# Apply teammate events (after git pull)
deciduous events rebuild

# Compact old events periodically
deciduous events checkpoint --clear-events
```

Events auto-emit on add/link/status commands. Git merges event files automatically.
<!-- deciduous:end -->
