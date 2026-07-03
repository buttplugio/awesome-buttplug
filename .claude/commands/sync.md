---
description: Sync decision graph with teammates - pull events, rebuild, push
allowed-tools: Bash(deciduous:*, git:*)
---

# Multi-User Sync

Synchronize decision graph with your team using event-based sync.

## Step 1: Pull Latest

```bash
git pull --rebase
```

## Step 2: Check Sync Status

```bash
deciduous events status
```

Look for:
- **Pending events**: Events from teammates not yet in your local DB
- **Event files**: Each teammate has their own `.jsonl` file

## Step 3: Rebuild if Needed

If there are pending events:

```bash
# Preview what would change
deciduous events rebuild --dry-run

# Apply teammate events to your local database
deciduous events rebuild
```

## Step 4: Push Your Changes

```bash
# Stage sync files (events are auto-committed to your event file)
git add .deciduous/sync/

# Commit and push
git commit -m "sync: decision graph events"
git push
```

## Checkpoint (Periodic Maintenance)

To prevent repo bloat, periodically create a checkpoint:

```bash
# Create checkpoint and clear old events
deciduous events checkpoint --clear-events

# Commit the checkpoint
git add .deciduous/sync/
git commit -m "checkpoint: compact decision graph events"
git push
```

**When to checkpoint:**
- After major milestones
- When event files get large (>100KB)
- Before releases

## Troubleshooting

### Events not syncing?

1. Make sure `.deciduous/sync/` is tracked in git
2. Check that `deciduous events init` was run
3. Verify events are being emitted: `deciduous events status`

### Merge conflicts in event files?

Event files are append-only JSONL. Git should auto-merge them.
If conflicts occur, accept both versions (both sets of events are valid).

### Missing nodes after rebuild?

Nodes reference each other by `change_id` (UUID), not local `id`.
If edges fail, the referenced node may be in a teammate's events
that haven't been pulled yet. Pull and rebuild again.

## Quick Reference

| Command | What it does |
|---------|--------------|
| `deciduous events status` | Show pending events, authors, file sizes |
| `deciduous events rebuild` | Apply all events to local DB |
| `deciduous events rebuild --dry-run` | Preview without applying |
| `deciduous events checkpoint` | Snapshot current state |
| `deciduous events checkpoint --clear-events` | Snapshot + delete old events |
| `deciduous events emit <id>` | Manually emit event for a node |
