# Narrative Tracking

**Narratives are the source of truth. Commits are just evidence.**

## Step 1: Initialize narratives file

```bash
deciduous narratives init
```

This creates `.deciduous/narratives.md` pre-populated with your active goal titles.

## Step 2: Understand the system first

Before looking at git, read the code. Ask: **What are the major pieces of this system?**

Each major piece probably has a narrative behind it.

## Step 3: Fill in the narratives

Edit `.deciduous/narratives.md`. For each section:

1. Describe the **current state** (how it works today)
2. Infer the **evolution** (how it likely got this way)
3. Identify **PIVOTs** (when the conceptual model changed)
4. Find evidence (PRs, commits, docs) - optional
5. Check attached documents (`deciduous doc list`) - diagrams or specs may provide evidence

Signs of a pivot:
- Two approaches coexisting (migration in progress)
- Comments explaining "we used to do X"
- Config for old + new system
- Deprecation warnings

## Step 4: Review narratives

```bash
deciduous narratives show
```

## Step 5: Check existing pivots

```bash
deciduous narratives pivots
```

This shows all revisit nodes already in the graph with their full chains.

## Output Format

Each narrative section in `.deciduous/narratives.md`:

```markdown
## <Name>
> <One sentence: what this piece of the system does>

**Current state:** <How it works today>

**Evolution:**
1. <First approach> - <why>
2. **PIVOT:** <what changed> - <why it changed>
3. <Current approach> - <why this is better>

**Evidence:** <Optional: PRs, commits, docs>
**Connects to:** <Other narratives this influenced>
**Status:** active | superseded | abandoned
```

## What Makes a Good Narrative

- Coherent story about ONE design aspect
- Explains HOW something works and WHY it evolved
- Would help a new team member understand the system
- NOT a list of commits or feature changelog

## Next Step

After narratives are written, run `/archaeology` to transform them into a queryable decision graph.
