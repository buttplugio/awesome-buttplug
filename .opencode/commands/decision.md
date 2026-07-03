---
description: Manage decision graph - track algorithm choices and reasoning
arguments:
  - name: ACTION
    description: "Command: add <type> <title>, link <from> <to>, nodes, edges, sync, etc."
    required: true
---

# Decision Graph Management

**Log decisions IN REAL-TIME as you work, not retroactively.**

## When to Use This

| You're doing this... | Log this type | Command |
|---------------------|---------------|---------|
| Starting a new feature | `goal` **with -p** | `/decision add goal "Add user auth" -p "user request"` |
| Choosing between approaches | `decision` | `/decision add decision "Choose auth method"` |
| Considering an option | `option` | `/decision add option "JWT tokens"` |
| About to write code | `action` | `/decision add action "Implementing JWT"` |
| Noticing something | `observation` | `/decision add obs "Found existing auth code"` |
| Finished something | `outcome` | `/decision add outcome "JWT working"` |
| Reconsidering a past decision | `revisit` | `/decision add revisit "Reconsidering auth"` |

## Quick Commands

Based on $ACTION:

### View Commands
- `nodes` or `list` -> `deciduous nodes`
- `edges` -> `deciduous edges`
- `graph` -> `deciduous graph`
- `commands` -> `deciduous commands`

### Create Nodes (with optional metadata)
- `add goal <title>` -> `deciduous add goal "<title>" -c 90`
- `add decision <title>` -> `deciduous add decision "<title>" -c 75`
- `add option <title>` -> `deciduous add option "<title>" -c 70`
- `add action <title>` -> `deciduous add action "<title>" -c 85`
- `add obs <title>` -> `deciduous add observation "<title>" -c 80`
- `add outcome <title>` -> `deciduous add outcome "<title>" -c 90`
- `add revisit <title>` -> `deciduous add revisit "<title>" -c 75`

### Optional Flags for Nodes
- `-c, --confidence <0-100>` - Confidence level
- `-p, --prompt "..."` - Store the user prompt that triggered this node
- `-f, --files "file1.rs,file2.rs"` - Associate files with this node
- `-b, --branch <name>` - Git branch (auto-detected by default)
- `--no-branch` - Skip branch auto-detection
- `--commit <hash|HEAD>` - Link to a git commit (use HEAD for current commit)
- `--date "YYYY-MM-DD"` - Backdate node (for archaeology/retroactive logging)

### CRITICAL: Link Commits to Actions/Outcomes

**After every git commit, link it to the decision graph!**

```bash
git commit -m "feat: add auth"
deciduous add action "Implemented auth" -c 90 --commit HEAD
deciduous link <goal_id> <action_id> -r "Implementation"
```

## CRITICAL: Capture VERBATIM User Prompts

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

## Branch-Based Grouping

**Nodes are automatically tagged with the current git branch.** This enables filtering by feature/PR.

### How It Works
- When you create a node, the current git branch is stored in `metadata_json`
- Configure which branches are "main" in `.deciduous/config.toml`:
  ```toml
  [branch]
  main_branches = ["main", "master"]  # Branches not treated as "feature branches"
  auto_detect = true                    # Auto-detect branch on node creation
  ```
- Nodes on feature branches (anything not in `main_branches`) can be grouped/filtered

### CLI Filtering
```bash
# Show only nodes from specific branch
deciduous nodes --branch main
deciduous nodes --branch feature-auth
deciduous nodes -b my-feature

# Override auto-detection when creating nodes
deciduous add goal "Feature work" -b feature-x  # Force specific branch
deciduous add goal "Universal note" --no-branch  # No branch tag
```

### Web UI Branch Filter
The graph viewer shows a branch dropdown in the stats bar:
- "All branches" shows everything
- Select a specific branch to filter all views (Chains, Timeline, Graph, DAG)

### When to Use Branch Grouping
- **Feature work**: Nodes created on `feature-auth` branch auto-grouped
- **PR context**: Filter to see only decisions for a specific PR
- **Cross-cutting concerns**: Use `--no-branch` for universal notes
- **Retrospectives**: Filter by branch to see decision history per feature

### Create Edges
- `link <from> <to> [reason]` -> `deciduous link <from> <to> -r "<reason>"`

### Document Attachments
- `doc attach <node_id> <file>` -> `deciduous doc attach <node_id> <file>`
- `doc attach <node_id> <file> -d "desc"` -> attach with description
- `doc attach <node_id> <file> --ai-describe` -> attach with AI-generated description
- `doc list` -> `deciduous doc list` (all documents)
- `doc list <node_id>` -> `deciduous doc list <node_id>` (documents for one node)
- `doc show <id>` -> `deciduous doc show <id>`
- `doc describe <id> "desc"` -> `deciduous doc describe <id> "desc"`
- `doc describe <id> --ai` -> AI-generate description
- `doc open <id>` -> `deciduous doc open <id>` (open in default app)
- `doc detach <id>` -> `deciduous doc detach <id>` (soft-delete)
- `doc gc` -> `deciduous doc gc` (garbage-collect orphaned files)

### Sync Graph
- `sync` -> `deciduous sync`

### Multi-User Sync (Event-Based) - RECOMMENDED
- `events init` -> `deciduous events init` (initialize event-based sync)
- `events status` -> `deciduous events status` (show pending events)
- `events rebuild` -> `deciduous events rebuild` (apply teammate events)
- `events checkpoint` -> `deciduous events checkpoint` (create snapshot)
- `events checkpoint --clear-events` -> snapshot and clear old events

### Multi-User Sync (Legacy Diff/Patch)
- `diff export -o <file>` -> `deciduous diff export -o <file>` (export nodes as patch)
- `diff export --nodes 1-10 -o <file>` -> export specific nodes
- `diff export --branch feature-x -o <file>` -> export nodes from branch
- `diff apply <file>` -> `deciduous diff apply <file>` (apply patch, idempotent)
- `diff apply --dry-run <file>` -> preview without applying
- `diff status` -> `deciduous diff status` (list patches in .deciduous/patches/)
- `migrate` -> `deciduous migrate` (add change_id columns for sync)

### Export & Visualization
- `dot` -> `deciduous dot` (output DOT to stdout)
- `dot --png` -> `deciduous dot --png -o graph.dot` (generate PNG)
- `dot --nodes 1-11` -> `deciduous dot --nodes 1-11` (filter nodes)
- `writeup` -> `deciduous writeup` (generate PR writeup)
- `writeup -t "Title" --nodes 1-11` -> filtered writeup

## Node Types

| Type | Purpose | Example |
|------|---------|---------|
| `goal` | High-level objective | "Add user authentication" |
| `decision` | Choice point with options | "Choose auth method" |
| `option` | Possible approach | "Use JWT tokens" |
| `action` | Something implemented | "Added JWT middleware" |
| `outcome` | Result of action | "JWT auth working" |
| `observation` | Finding or data point | "Existing code uses sessions" |
| `revisit` | Pivot point / reconsideration | "Reconsidering auth approach" |

## Edge Types

| Type | Meaning |
|------|---------|
| `leads_to` | Natural progression |
| `chosen` | Selected option |
| `rejected` | Not selected (include reason!) |
| `requires` | Dependency |
| `blocks` | Preventing progress |
| `enables` | Makes something possible |

## Graph Integrity - CRITICAL

**Every node MUST be logically connected.** Floating nodes break the graph's value.

### Connection Rules (goal -> options -> decision -> actions -> outcomes)
| Node Type | MUST connect to | Example |
|-----------|----------------|---------|
| `goal` | Can be a root (no parent needed) | Root goals are valid orphans |
| `option` | Its parent goal | "Use JWT" -> links FROM "Add auth" |
| `decision` | The option(s) it chose between | "Choose JWT" -> links FROM "Use JWT" option |
| `action` | The decision that spawned it | "Implementing JWT" -> links FROM "Choose JWT" |
| `outcome` | The action that produced it | "JWT working" -> links FROM "Implementing JWT" |
| `observation` | Related goal/action/decision | "Found existing code" -> links TO relevant node |
| `revisit` | The decision/outcome being reconsidered | "Reconsidering auth" -> links FROM original decision |

### Audit Checklist
Ask yourself after creating nodes:
1. Does every **outcome** link back to the action that produced it?
2. Does every **action** link to the decision that spawned it?
3. Does every **option** link to its parent goal?
4. Does every **decision** link from the option(s) being chosen?
5. Are there **dangling outcomes** with no parent action?

### Find Disconnected Nodes
```bash
# List nodes with no incoming edges (potential orphans)
deciduous edges | cut -d'>' -f2 | cut -d' ' -f2 | sort -u > /tmp/has_parent.txt
deciduous nodes | tail -n+3 | awk '{print $1}' | while read id; do
  grep -q "^$id$" /tmp/has_parent.txt || echo "CHECK: $id"
done
```
Note: Root goals are VALID orphans. Outcomes/actions/options usually are NOT.

### Fix Missing Connections
```bash
deciduous link <parent_id> <child_id> -r "Retroactive connection - <why>"
```

### When to Audit
- Before every `deciduous sync`
- After creating multiple nodes quickly
- At session end
- When the web UI graph looks disconnected

## Git Staging Rules - CRITICAL

**NEVER use broad git add commands that stage everything:**
- `git add -A` - stages ALL changes including untracked files
- `git add .` - stages everything in current directory
- `git add -a` or `git commit -am` - auto-stages all tracked changes
- `git add *` - glob patterns can catch unintended files

**ALWAYS stage files explicitly by name:**
- `git add src/main.rs src/lib.rs`
- `git add Cargo.toml Cargo.lock`
- `git add .claude/commands/decision.md`

**Why this matters:**
- Prevents accidentally committing sensitive files (.env, credentials)
- Prevents committing large binaries or build artifacts
- Forces you to review exactly what you're committing
- Catches unintended changes before they enter git history

## Multi-User Sync

**Problem**: Multiple users work on the same codebase, each with a local `.deciduous/deciduous.db` (gitignored). How to share decisions?

**Solution**: Event-based sync with append-only logs. Each user has their own event file that git merges automatically.

### Event-Based Sync (Recommended)

**Setup (once per repo):**
```bash
deciduous events init
git add .deciduous/sync/
git commit -m "feat: enable event-based sync"
```

**Daily workflow:**
```bash
git pull                    # Get teammate events
deciduous events rebuild    # Apply to local DB
# Work normally - events auto-emit on add/link/etc.
git add .deciduous/sync/ && git commit -m "sync" && git push
```

**Periodic maintenance:**
```bash
deciduous events checkpoint --clear-events  # Compact old events
git add .deciduous/sync/ && git commit -m "checkpoint"
```

### Legacy Patch Workflow

For manual control, use the older patch system:

```bash
# Export nodes as a patch file
deciduous diff export --branch feature-x -o .deciduous/patches/my-feature.json

# Apply patches from teammates
deciduous diff apply .deciduous/patches/*.json
```

## The Rule

```
LOG BEFORE YOU CODE, NOT AFTER.
CONNECT EVERY NODE TO ITS PARENT.
AUDIT FOR ORPHANS REGULARLY.
SYNC BEFORE YOU PUSH.
EXPORT PATCHES FOR YOUR TEAMMATES.
```

**Live graph**: https://notactuallytreyanastasio.github.io/deciduous/
