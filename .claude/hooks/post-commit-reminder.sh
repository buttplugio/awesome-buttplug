#!/bin/bash
# post-commit-reminder.sh
# Runs after git commit to nudge Claude to link the commit to deciduous.
# Advisory only (exit 0) — does not block or error.

# Check if deciduous is initialized
if [ ! -d ".deciduous" ]; then
    exit 0
fi

# Read the input JSON to check if this was a git commit
input=$(cat)
command=$(echo "$input" | grep -o '"command":"[^"]*"' | head -1 | sed 's/"command":"//;s/"$//')

# Only trigger on git commit commands
if ! echo "$command" | grep -qE '^git commit'; then
    exit 0
fi

# Get the commit hash that was just created
commit_hash=$(git rev-parse --short HEAD 2>/dev/null)
commit_msg=$(git log -1 --format=%s 2>/dev/null)

# Soft reminder on stdout — exit 0 so it's advisory, not blocking
echo "deciduous: commit $commit_hash — remember to link with --commit HEAD"

exit 0
