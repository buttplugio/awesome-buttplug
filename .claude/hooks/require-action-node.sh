#!/bin/bash
# require-action-node.sh
# Blocks Edit/Write tools if no recent action/goal node exists in deciduous
# Exit code 2 = block the tool and show error to Claude

# Check if deciduous is initialized
if [ ! -d ".deciduous" ]; then
    # No deciduous in this project, allow all edits
    exit 0
fi

# Check for any action or goal node created in the last 15 minutes
# We check both because starting new work creates a goal first
recent_node=$(deciduous nodes 2>/dev/null | grep -E '\[(goal|action)\]' | tail -5)

if [ -z "$recent_node" ]; then
    # No nodes at all - this is a fresh project, allow edits
    exit 0
fi

# Check if any node was created recently (within last 15 min)
# Parse the timestamps from nodes output
now=$(date +%s)
fifteen_min_ago=$((now - 900))

# Get the most recent node's timestamp
# deciduous nodes format: ID [type] Title [confidence%] [timestamp]
latest_timestamp=$(deciduous nodes 2>/dev/null | tail -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}' | tail -1)

if [ -n "$latest_timestamp" ]; then
    # Convert to epoch
    if [[ "$OSTYPE" == "darwin"* ]]; then
        node_epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "$latest_timestamp" +%s 2>/dev/null || echo "0")
    else
        node_epoch=$(date -d "$latest_timestamp" +%s 2>/dev/null || echo "0")
    fi

    if [ "$node_epoch" -gt "$fifteen_min_ago" ]; then
        # Recent node exists, allow the edit
        exit 0
    fi
fi

# No recent node - block and provide guidance
cat >&2 << 'EOF'
+===================================================================+
|  DECIDUOUS: No recent action/goal node found                      |
+===================================================================+
|  Before editing files, log what you're about to do:               |
|                                                                   |
|  For new work:                                                    |
|    deciduous add goal "What you're trying to achieve" -c 90       |
|                                                                   |
|  For implementation:                                              |
|    deciduous add action "What you're about to implement" -c 85    |
|                                                                   |
|  Then link to parent:                                             |
|    deciduous link <parent_id> <new_id> -r "reason"                |
+===================================================================+
EOF

exit 2
