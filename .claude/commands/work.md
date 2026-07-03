---
description: Start a work transaction - creates goal node BEFORE any implementation
allowed-tools: Bash(deciduous:*)
argument-hint: <goal title>
---

# Work Transaction

**USE THIS BEFORE STARTING ANY IMPLEMENTATION.**

This skill creates the required deciduous nodes BEFORE you write any code. The Edit/Write hooks will BLOCK you if you don't have a recent node.

## Step 1: Create the Goal Node

Based on $ARGUMENTS (or the user's most recent request), create a goal node:

```bash
# Create goal with the user's request captured verbatim
deciduous add goal "$ARGUMENTS" -c 90 --prompt-stdin << 'EOF'
[INSERT THE EXACT USER REQUEST HERE - VERBATIM, NOT SUMMARIZED]
EOF
```

**IMPORTANT**: The prompt must be the user's EXACT words, not your summary.

## Step 2: Announce the Goal ID

After creating the goal, tell the user:
- The goal ID that was created
- What you're about to implement
- That you'll create action nodes as you work

## Step 3: Before Each Major Edit

Before editing files, create an action node:

```bash
deciduous add action "What you're about to implement" -c 85 -f "file1.rs,file2.rs"
deciduous link <goal_id> <action_id> -r "Implementation step"
```

## Step 4: After Completion

When the work is done:

```bash
# After committing
deciduous add outcome "What was accomplished" -c 95 --commit HEAD
deciduous link <action_id> <outcome_id> -r "Implementation complete"

# Sync the graph
deciduous sync
```

## Step 5: Attach Supporting Documents (Optional)

If the work produced or referenced important files (diagrams, specs, screenshots):

```bash
deciduous doc attach <goal_id> path/to/diagram.png -d "Architecture diagram"
deciduous doc attach <action_id> path/to/spec.pdf --ai-describe
```

If the user shares images or drops in files not in the project, attach them to the most relevant active node.

## The Transaction Model

```
/work "Add feature X"
    |
Goal node created (ID: N)
    |
Action node before each edit (links to goal)
    |
Implementation happens (Edit/Write now allowed)
    |
git commit
    |
Outcome node with --commit HEAD (links to action)
    |
Attach supporting documents (optional)
    |
deciduous sync
```

## What NOT to Log

**Only create nodes for user-visible project work, not your internal process.**

Do NOT create action nodes for reading code, running tests to check status, exploring the codebase, or planning your approach. These are your process, not the user's project decisions.

Action nodes should describe code being written or changed. Outcome nodes should describe results the user cares about. If the user wouldn't put it in a PR description, don't log it.

## Why This Matters

- **Hooks will block you** if no recent action/goal exists
- **Commits will remind you** to link them to the graph
- **The graph captures your reasoning** for future sessions
- **Context recovery works** because the graph has everything

## Quick Reference

```bash
# Start work
deciduous add goal "Feature title" -c 90 -p "User request"

# Before editing (required!)
deciduous add action "What I'm implementing" -c 85
deciduous link <goal> <action> -r "Implementation"

# After committing
deciduous add outcome "Result" -c 95 --commit HEAD
deciduous link <action> <outcome> -r "Complete"

# Attach documents (optional)
deciduous doc attach <goal> diagram.png -d "Description"

# Always sync
deciduous sync
```

**Now create the goal node for: $ARGUMENTS**
