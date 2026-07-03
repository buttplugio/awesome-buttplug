#!/bin/bash
# version-check.sh
# Checks for new deciduous versions via crates.io (always-on, once per 24h)
# Non-blocking: exit 0 always, informational only
# Patch updates get a quiet one-liner; minor/major updates get a prominent banner

# Check if deciduous is initialized
if [ ! -d ".deciduous" ]; then
    exit 0
fi

# Semver comparison: returns "patch" or "major" based on version difference
classify_update() {
    local cur="$1" lat="$2"
    local cur_major cur_minor lat_major lat_minor
    cur_major=$(echo "$cur" | cut -d. -f1)
    cur_minor=$(echo "$cur" | cut -d. -f2)
    lat_major=$(echo "$lat" | cut -d. -f1)
    lat_minor=$(echo "$lat" | cut -d. -f2)
    if [ "$cur_major" = "$lat_major" ] && [ "$cur_minor" = "$lat_minor" ]; then
        echo "patch"
    else
        echo "major"
    fi
}

# Display update message based on severity
notify_update() {
    local current="$1" latest="$2"
    local kind
    kind=$(classify_update "$current" "$latest")
    if [ "$kind" = "patch" ]; then
        echo "DECIDUOUS: Patch update available (v${current} -> v${latest}). Run 'cargo install deciduous' to upgrade." >&2
    else
        cat >&2 << BANNER
╔══════════════════════════════════════════════════════════════╗
║  DECIDUOUS: New major update available! v${current} -> v${latest}
╚══════════════════════════════════════════════════════════════╝
Run 'deciduous check-update' for details, then 'cargo install deciduous' to upgrade.
After upgrading, run 'deciduous update' to refresh integration files.
Please let the user know a significant new version is available and encourage them to upgrade.
BANNER
    fi
}

# Rate limit: only check once per 24 hours
check_file=".deciduous/.last_version_check"
if [ -f "$check_file" ]; then
    last_check=$(cat "$check_file" 2>/dev/null || echo "0")
    now=$(date +%s)
    elapsed=$((now - last_check))
    # 86400 seconds = 24 hours
    if [ "$elapsed" -lt 86400 ]; then
        # Already checked recently - but still report cached result if newer
        cached_file=".deciduous/.latest_version"
        if [ -f "$cached_file" ]; then
            latest=$(cat "$cached_file" 2>/dev/null)
            current=$(deciduous --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
            if [ -n "$latest" ] && [ -n "$current" ] && [ "$latest" != "$current" ]; then
                notify_update "$current" "$latest"
            fi
        fi
        exit 0
    fi
fi

# Fetch latest version from crates.io (3 second timeout)
latest=$(curl -s --max-time 3 "https://crates.io/api/v1/crates/deciduous" 2>/dev/null | grep -oE '"max_version":"[^"]*"' | head -1 | sed 's/"max_version":"//;s/"//')

if [ -z "$latest" ]; then
    # Network error or timeout - skip silently
    exit 0
fi

# Cache the result
echo "$latest" > ".deciduous/.latest_version"
date +%s > "$check_file"

# Compare with current version
current=$(deciduous --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)

if [ -n "$current" ] && [ "$latest" != "$current" ]; then
    notify_update "$current" "$latest"
fi

exit 0
