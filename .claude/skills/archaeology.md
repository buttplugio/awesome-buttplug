# Archaeology

**Transform narratives into a queryable decision graph.**

Run `/narratives` first to create `.deciduous/narratives.md`.

## Step 1: Read the narratives

```bash
deciduous narratives show
```

For each narrative, you'll create a subgraph.

## Step 2: Create root goals

For each narrative, create a backdated goal:

```bash
deciduous add goal "<Narrative title>" -c 90 --date "YYYY-MM-DD"
```

## Step 3: Build initial approaches

```bash
deciduous add decision "<First approach>" -c 85 --date "YYYY-MM-DD"
deciduous link <goal> <decision> -r "Initial design"
```

## Step 4: Create pivots with `archaeology pivot`

For each **PIVOT** in a narrative, use the atomic pivot command:

```bash
# One command replaces 7 manual add/link/status commands
deciduous archaeology pivot <from_id> "<what was learned>" "<new approach>" -c 85 -r "<why it failed>"
```

This automatically creates:
- observation node (what was learned)
- revisit node (reconsidering the old approach)
- decision node (the new approach)
- All 3 linking edges
- Marks the old approach as superseded

Preview before executing:
```bash
deciduous archaeology pivot <from_id> "observation" "new approach" --dry-run
```

## Step 5: Connect narratives

When narratives reference each other:

```bash
deciduous link <auth_observation> <ratelimit_decision> \
  -r "Auth failures drove rate limit redesign"
```

## Step 6: Mark superseded paths

For nodes that were replaced but not part of a pivot:

```bash
# Single node
deciduous archaeology supersede <id>

# Node and all descendants
deciduous archaeology supersede <id> --cascade
```

## Step 7: Review the timeline

```bash
# See all nodes chronologically
deciduous archaeology timeline

# Filter by type
deciduous archaeology timeline --type revisit

# See existing pivot chains
deciduous narratives pivots

# Visual exploration
deciduous serve
```

## Attach Evidence Documents

If you find diagrams, screenshots, or specs that support the archaeology:

```bash
deciduous doc attach <goal_id> evidence/old-architecture.png -d "Architecture before refactor"
deciduous doc attach <revisit_id> evidence/perf-report.pdf --ai-describe
```

Documents provide visual/tangible evidence alongside commit-based grounding.

## Querying the Graph

```bash
# Current state
deciduous pulse

# Pivot points
deciduous narratives pivots

# Timeline
deciduous archaeology timeline

# By status
deciduous nodes --type revisit
```

## What NOT to Do

- **Don't create nodes for every commit.** Commits are evidence, not graph nodes.
- **Don't create implementation nodes.** The graph is about the MODEL, not the code.
- **Don't over-structure.** Simple narratives might just be: goal → option → decision.
