---
description: Recover context from decision graph and recent activity - USE THIS ON SESSION START
allowed-tools: Bash(deciduous:*, git:*, cat:*, tail:*)
argument-hint: [focus-area]
---

# Context Recovery

**RUN THIS AT SESSION START.** The decision graph is your persistent memory.

## Step 1: Query the Graph

```bash
# See all decisions (look for recent ones and pending status)
deciduous nodes

# Filter by current branch (useful for feature work)
deciduous nodes --branch $(git rev-parse --abbrev-ref HEAD)

# See how decisions connect
deciduous edges

# What commands were recently run?
deciduous commands

# Check for attached documents
deciduous doc list
```

**Branch-scoped context**: If working on a feature branch, filter nodes to see only decisions relevant to this branch. Main branch nodes are tagged with `[branch: main]`.

## Step 1.5: Audit Graph Integrity

**CRITICAL: Check that all nodes are logically connected.**

```bash
# Find nodes with no incoming edges (potential missing connections)
deciduous edges | cut -d'>' -f2 | cut -d' ' -f2 | sort -u > /tmp/has_parent.txt
deciduous nodes | tail -n+3 | awk '{print $1}' | while read id; do
  grep -q "^$id$" /tmp/has_parent.txt || echo "CHECK: $id"
done
```

**Review each flagged node (flow: goal -> options -> decision -> actions -> outcomes):**
- Root `goal` nodes are VALID without parents
- `option` nodes MUST link to their parent goal
- `decision` nodes MUST link from the option(s) being chosen
- `action` nodes MUST link to their parent decision
- `outcome` nodes MUST link back to their action

**Fix missing connections:**
```bash
deciduous link <parent_id> <child_id> -r "Retroactive connection - <reason>"
```

## Step 2: Check Git State

```bash
git status
git log --oneline -10
git diff --stat
```

## Step 3: Check Session Log

```bash
cat git.log | tail -30
```

## After Gathering Context, Report:

1. **Current branch** and pending changes
2. **Branch-specific decisions** (filter by branch if on feature branch)
3. **Recent decisions** (especially pending/active ones)
4. **Last actions** from git log and command log
5. **Open questions** or unresolved observations
6. **Attached documents** - diagrams, specs, or screenshots on key nodes
7. **Suggested next steps**

### Branch Configuration

Check `.deciduous/config.toml` for branch settings:
```toml
[branch]
main_branches = ["main", "master"]  # Which branches are "main"
auto_detect = true                    # Auto-detect branch on node creation
```

---

## REMEMBER: Real-Time Logging Required

After recovering context, you MUST follow the logging workflow:

```
EVERY USER REQUEST -> Log goal/decision first
BEFORE CODE CHANGES -> Log action
AFTER CHANGES -> Log outcome, link nodes
BEFORE GIT PUSH -> deciduous sync
```

**The user is watching the graph live.** Log as you go, not after.

### Quick Logging Commands

```bash
# Root goal with user prompt (capture what the user asked for)
deciduous add goal "What we're trying to do" -c 90 -p "User asked: <their request>"

deciduous add action "What I'm about to implement" -c 85
deciduous add outcome "What happened" -c 95
deciduous link FROM TO -r "Connection reason"

# Capture prompt when user redirects mid-stream
deciduous add action "Switching approach" -c 85 -p "User said: use X instead"

deciduous sync  # Do this frequently!
```

**When to use `--prompt`:** On root goals (always) and when user gives new direction mid-stream. Downstream nodes inherit context via edges.

---

## Focus Areas

If $ARGUMENTS specifies a focus, prioritize context for:

- **auth**: Authentication-related decisions
- **ui** / **graph**: UI and graph viewer state
- **cli**: Command-line interface changes
- **api**: API endpoints and data structures

---

## The Memory Loop

```
SESSION START
    |
Run /recover -> See past decisions
    |
AUDIT -> Fix any orphan nodes first!
    |
DO WORK -> Log BEFORE each action
    |
CONNECT -> Link new nodes immediately
    |
AFTER CHANGES -> Log outcomes, observations
    |
AUDIT AGAIN -> Any new orphans?
    |
BEFORE PUSH -> deciduous sync
    |
PUSH -> Live graph updates
    |
SESSION END -> Final audit
    |
(repeat)
```

**Live graph**: https://notactuallytreyanastasio.github.io/deciduous/

---

## Multi-User Sync

If working in a team, sync decision graphs automatically via events:

```bash
# Check sync status
deciduous events status

# Apply teammate events (after git pull)
deciduous events rebuild

# Periodic maintenance (compact old events)
deciduous events checkpoint --clear-events
```

Events are auto-emitted when you use `add`, `link`, `status`, etc.
Git handles merging everyone's event files automatically.

## Why This Matters

- Context loss during compaction loses your reasoning
- The graph survives - query it early, query it often
- Retroactive logging misses details - log in the moment
- The user sees the graph live - show your work
- Patches share reasoning with teammates
