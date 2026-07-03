---
description: Build a deciduous decision graph capturing design evolution from commit history
allowed-tools: *
argument-hint: [repo-path]
---

# Decision Graph Construction

You are building a **deciduous decision graph** - a DAG that captures the evolution of design decisions in a codebase.

**Target repository:** $ARGUMENTS (if provided), otherwise the current directory.

Use the `deciduous` CLI (at ~/.cargo/bin/deciduous) to build the graph. Run deciduous commands in the current directory (not inside the source repo).

For git commands to explore commit history, use `git -C <repo-path>` to target the source repo.

**CRITICAL: Only use information from the repository itself (commits, code, comments, tests). Do not use your prior knowledge about the project. Everything must be grounded in what you find in the repo.**

## Commit Exploration

Use a layered strategy to find all relevant commits:

**Layer 1: See all commits.** Start with the full list when building narratives.

```bash
git log --oneline --after="..." --before="..." -- path/
```

**Layer 2: Keyword expansion.** Once you have narratives, search for spelling variations and related terms you might have missed (e.g., "cache" -> "caching", "cached", "LRU", "invalidate"). For each key identifier in your narratives, trace its full lifecycle:

- Introduction
- Changes and modifications
- Renames
- Deprecation or removal
- Replacement by other mechanisms
- Becoming stable/public API

If there's a feature flag controlling the feature, search for commits mentioning that flag.

**Layer 3: Follow authors.** If a narrative has a key author, check their commits +/-1 month from known commits. They often work on related things.

**Layer 4: Pull request context.** If the `gh` CLI is available, use it to find PRs associated with key commits and paths. PRs often contain design discussion, review comments, and rationale that never appears in commit messages.

```bash
# Find PRs that touched a specific path
gh pr list --state merged --search "path/to/module" --limit 50

# Find the PR that introduced a specific commit
gh pr list --state merged --search "<commit-sha>" --limit 5

# Read PR description and review comments for context
gh pr view <pr-number>
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments

# Search PR titles/bodies for keywords from your narratives
gh pr list --state merged --search "<keyword>" --limit 30
```

PR descriptions and review threads are goldmines for understanding **why** decisions were made. Reviewers often challenge approaches, surface alternatives that were considered, and document trade-offs - exactly the kind of reasoning that belongs in the decision graph.

When you find relevant PR discussion:
- Use it to enrich observation and decision node descriptions
- Quote reviewer comments as evidence (e.g., "PR #42 review: 'We should use Redis instead because...'")
- Note when a PR was blocked or revised - these are often pivot points

### DO NOT:

- `git log ... | head -100` -- **NO.** You will miss commits in the middle.
- `git log ... | tail -200` -- **NO.** Same problem.
- Start with keyword filtering -- **NO.** You'll miss things with unexpected names.

### DO:

- See all commits first, filter mentally while building narratives
- Include "remove", "delete", "disable", "deprecate" in keyword searches -- removals explain transitions
- Check the commit count first (`| wc -l`), but then see them all
- **Read full commit messages** for any commit whose title mentions an identifier or concept relevant to your narrative -- you need precise understanding of what happened to each one you care about

## Finding the Story

Not every commit matters. Look for commits that change **the model** - how the system conceptualizes the problem:

- Existing tests modified (contract changing, not just bugs fixed)
- Data structures replaced or reworked
- Heuristics changed significantly
- New abstractions introduced
- API behavior shifts

Skip commits that are pure implementation (same model, different code) or routine fixes that just add tests.

Among model-changing commits, find the **spine**: what question keeps getting re-answered? What approach keeps getting replaced or refined? That's your central thread - build the graph around it.

## Narrative Tracking

**Don't build the graph as you explore.** First, collect commits into narratives.

Maintain `narratives.md` as you explore:

1. For each significant commit, read `narratives.md`
2. Ask: "Does this commit evolve an existing narrative?"
3. If yes: append the commit to that narrative's section
4. If no: add a new narrative section

Example `narratives.md`:

```
## Cache Strategy
- a1b2c3d: Add in-memory cache
- e4f5g6h: Cache invalidation issues
- i7j8k9l: Switch to Redis

## API Rate Limiting
- m1n2o3p: Add basic throttling
- ...
```

**Before building the graph**, take a critical pass over `narratives.md`:

- Merge narratives that are essentially the same evolving thing
- Ensure each narrative clearly explains how one independent piece evolved
- Note where narratives branch from or feed into each other

## Hardening Phase

After building initial narratives, harden them to ensure nothing is missed.

### Step 1: Extract concepts per narrative

For each narrative, list the key concepts/APIs/identifiers and their lifecycle stage:

- **Introduced**: First appearance of the concept
- **Changed**: Modifications to behavior or implementation
- **Renamed/Deprecated/Removed**: End of life or replacement
- **Marked stable**: Became public API or removed "unstable_" prefix

Example addition to narrative:

```
## Cache Strategy
Concepts: cache, LRUCache, cacheTimeout, invalidate

Lifecycle:
- cache: introduced (a1b2c3d), changed (e4f5g6h), renamed to LRUCache (x1y2z3)
- cacheTimeout: introduced (e4f5g6h), removed (i7j8k9l)
- LRUCache: introduced via rename (x1y2z3), marked stable (p1q2r3)

Commits:
- a1b2c3d: Add in-memory cache
- ...
```

### Step 2: Exhaustive search per concept

For each concept, search full commit messages (not just subject lines):

```bash
git log --all --after="..." --before="..." --grep="<concept>" --format="%H %s" -- path/
```

For each match, read the full commit message:

```bash
git show <sha> --format="%B" --no-patch
```

### Step 3: Rewrite narratives with gaps filled

Rewrite `narratives.md` integrating any newly discovered commits. The rewritten version should:

- Include ALL commits found for each concept
- Update the lifecycle tracking for each concept
- Ensure the arc is complete (if something was introduced, when was it changed/removed?)

If a concept has an incomplete arc (e.g., introduced but never removed, yet it's not in current code), investigate further.

## Cross-Narrative Connections

When building the graph, don't just branch everything from the goal. Capture how narratives relate:

**Branch from the spine, not goal:** If a narrative arose from work in another narrative, branch from that work.

- Wrong: `goal -> "How to preserve state?"`
- Right: `outcome("timeout works") -> "How to preserve state?"` (the question arose after implementing timeout)

**Observations feed back:** If an observation in one narrative influenced decisions in another, add an edge.

- Example: An observation about nested boundary timing might inform heuristics refinement in the main narrative

**Keep truly independent things from goal:** If a narrative is genuinely a separate concern that doesn't arise from other work, branching from goal is appropriate.

After consolidating, build the graph - one decision chain per narrative, with cross-links where they connect.

## Node Types

| Type            | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| **goal**        | High-level objective being pursued                    |
| **decision**    | A choice point with multiple possible paths           |
| **option**      | A possible approach to a decision                     |
| **observation** | Learning, insight, or new information discovered      |
| **action**      | Something that was done (must reference a commit)     |
| **outcome**     | Result or consequence of an action                    |
| **revisit**     | Pivot point where a previous approach is reconsidered |

## CLI Commands

```bash
# Add nodes (returns node ID)
deciduous add goal "Title of the goal"
deciduous add decision "The question or choice point"
deciduous add option "One possible approach"
deciduous add observation "Something learned or discovered"
deciduous add action "Descriptive title of what was done"
deciduous add outcome "What resulted from the action"
deciduous add revisit "Reconsidering previous approach"

# Add nodes with descriptions (use -d for explanations and sources)
deciduous add action "Title" -d "Explanation of what happened and why.

Sources:
- abc123: 'Relevant quote from commit message'"

# Set status on options
deciduous status <id> rejected    # option that wasn't chosen
deciduous status <id> completed   # option that was chosen

# Connect nodes (from -> to means "from leads_to to")
deciduous link <from-id> <to-id>
deciduous link <from-id> <to-id> -r "Why this led to that"

# View/restructure
deciduous nodes           # list all
deciduous edges           # list connections
deciduous unlink <from> <to>   # remove edge
deciduous delete <id>          # remove node and edges
```

## Narrative Discipline

You're not collecting facts - you're crafting a story. Every node needs a _raison d'etre_.

Before adding a node, stop and ask: **Why does this exist? What prompted it?**

- Is this commit evolving something that's already in the graph? Then connect it there - it's a continuation, not a new branch.
- Is this a response to an observation about existing work? Then chain from that observation - something was learned, and this is the reaction.
- Did the winds change? Look for the moment the team realized the old approach wasn't working. That's an observation node, and it's the bridge to what came next.

**Don't branch from the goal unless it's genuinely new.** If you're about to draw an edge from the root goal, ask: does this replace or refine something we already designed? If yes, find that thing and connect there instead.

The test: can someone read your graph and understand not just _what_ happened, but _why_ each thing happened? Every node should feel inevitable given what came before it.

Think of commits as chapters in a story. Each chapter exists because of what happened in previous chapters. Your job is to find those causal threads and make them explicit.

## Temporal Rule

**Time flows forward. Past influences future, never reverse.**

Options under a decision are alternatives considered _at the same time_. If an approach was tried, failed, and a new approach was designed later - that's a **new decision node**, connected by observations about why the old approach failed.

Example - DON'T model sequential attempts as parallel options:

```
# WRONG - these were decided years apart, not simultaneously
decision: "How to handle caching?"
  |-> option: in-memory cache (2019)
  |-> option: Redis (2020)
  |-> option: CDN (2021)
```

Example - DO model as chain of decisions with learning:

```
# RIGHT - each attempt informs the next, options are simultaneous alternatives
decision: "How to handle caching?" (2019)
  |-> option: in-memory cache [chosen]
  |-> option: no caching [rejected] "Perf requirements too strict"
        |
option: in-memory cache -> action -> outcome
        |
observation: "Doesn't scale across instances"
        |
decision: "How to share cache across instances?" (2020)
  |-> option: Redis [chosen] "Team has Redis experience"
  |-> option: Memcached [rejected] "Less feature-rich"
  |-> option: database caching [rejected] "Adds DB load"
        |
option: Redis -> action -> outcome
        |
observation: "Latency too high for hot paths"
        |
decision: "How to reduce latency for static assets?" (2021)
  |-> option: CDN [chosen]
```

Multiple observations can converge into one decision. Multiple options can branch from one decision. But the graph flows forward in time.

## Edge Types

Use specific edge types to show relationships:

```bash
deciduous link <from> <to> -t chosen -r "Why this was selected"
deciduous link <from> <to> -t rejected -r "Why this wasn't selected"
deciduous link <from> <to> -t leads_to -r "How this led to that"
```

- `decision --chosen--> option` - This option was selected
- `decision --rejected--> option` - This option was considered but not selected (with rationale)
- `decision --leads_to--> option` - Lists available options

For post-hoc abandonment (tried something, it failed later):

- Mark the option status as `rejected`: `deciduous status <id> rejected`
- Create an observation explaining why it failed
- Link observation to the new decision it triggered

## Link Patterns (goal -> options -> decision -> actions -> outcomes)

- `goal -> option` - Goal leads to possible approaches
- `option -> decision` - Options lead to choosing (use chosen/rejected edge types)
- `decision -> action` - Chosen option leads to implementation
- `action -> outcome` - Action produces result
- `outcome -> observation` - Result reveals new insight
- `observation -> option` - Insight suggests new approach (feeds back to options)
- `observation -> revisit` - Insight forces reconsideration of previous approach
- `revisit -> option` - Pivot leads to exploring new options

When a design approach is abandoned and replaced:

```bash
deciduous add observation "JWT too large for mobile"
deciduous add revisit "Reconsidering token strategy"
deciduous link <observation> <revisit> -r "forced rethinking"
deciduous status <old_decision> superseded
```

Revisit nodes connect old approaches to new ones, capturing WHY things changed.

## Grounding Requirements

1. **Actions must cite commits**: Every action node must reference a real commit SHA in its description. Use `-d` when adding the node.

2. **Observations from evidence**: Observations should come from commit messages, code comments, or test descriptions you find in the repo.

3. **No speculation**: If you can't find evidence for something in the repo, don't include it. An incomplete but grounded graph is better than a complete but speculative one.

4. **Quote sources**: When possible, quote or paraphrase the actual commit message or comment that supports a node.

## Rich Node Content

The graph is an **alternative interface to browsing commit history**. Someone reading a node should understand what happened without looking up commits.

**Every node needs a description** - especially outcome and observation nodes. The description should be readable to someone exploring the graph who doesn't have the commits open.

### Structure: Explanation first, then sources

1. **Start with a readable explanation** that makes sense within the narrative. What happened? Why? How does it connect to what came before?
2. **Add sources below** with direct quotes from commits that support the explanation.

If you find your explanation doesn't make sense in context - something feels like a leap or a gap - that's a signal to dig deeper. There's probably a missing commit or transition you haven't found yet.

The relationship is many-to-many:

- One node may reference multiple commits (a decision informed by several changes)
- One commit may appear in multiple nodes (a large commit touching several concerns)

### Example

```bash
deciduous add decision "Should we switch from SQL to a document store?" -d "The team decided to switch from SQL to a document store.
This eliminated the impedance mismatch between the object model and storage,
at the cost of losing ad-hoc query capability (which wasn't being used anyway).

Sources:
- a1b2c3d: 'Our access patterns are almost entirely key-value lookups. The
  JOIN operations we wrote are never actually used in production.'
- e4f5g6h: 'Document store removes the ORM layer entirely - one less thing
  to maintain and debug.'"
```

### DO NOT:

- Leave nodes with just a title and no description
- Put quotes first without explaining what they mean
- Write explanations that don't make sense in the narrative flow (this signals missing context)

### DO:

- Write explanations that flow naturally from previous nodes
- Include direct quotes that support the explanation
- Treat gaps in the story as prompts to investigate further

## Output

When done, run `deciduous graph > graph.json` to export.
