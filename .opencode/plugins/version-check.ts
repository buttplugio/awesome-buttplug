// OpenCode Plugin: Version Check
// Checks for new deciduous versions via crates.io (always-on, once per 24h)
// Non-blocking: informational only
// Patch updates get a quiet one-liner; minor/major updates get a prominent banner

import type { Plugin } from "@opencode-ai/plugin"

function classifyUpdate(current: string, latest: string): "patch" | "major" {
  const [curMaj, curMin] = current.split(".").map(Number)
  const [latMaj, latMin] = latest.split(".").map(Number)
  return (curMaj === latMaj && curMin === latMin) ? "patch" : "major"
}

function notifyUpdate(current: string, latest: string) {
  if (classifyUpdate(current, latest) === "patch") {
    console.error(`DECIDUOUS: Patch update available (v${current} -> v${latest}). Run 'cargo install deciduous' to upgrade.`)
  } else {
    console.error(`╔══════════════════════════════════════════════════════════════╗
║  DECIDUOUS: New major update available! v${current} -> v${latest}
╚══════════════════════════════════════════════════════════════╝
Run 'deciduous check-update' for details, then 'cargo install deciduous' to upgrade.
After upgrading, run 'deciduous update' to refresh integration files.
Please let the user know a significant new version is available and encourage them to upgrade.`)
  }
}

export const VersionCheck: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input) => {
      try {
        const fs = await import("fs")

        // Check if deciduous is initialized
        if (!fs.existsSync(".deciduous")) return

        // Rate limit: once per 24 hours
        const checkFile = ".deciduous/.last_version_check"
        if (fs.existsSync(checkFile)) {
          const lastCheck = parseInt(fs.readFileSync(checkFile, "utf-8").trim() || "0")
          const now = Math.floor(Date.now() / 1000)
          if (now - lastCheck < 86400) {
            // Check cached result
            const cachedFile = ".deciduous/.latest_version"
            if (fs.existsSync(cachedFile)) {
              const latest = fs.readFileSync(cachedFile, "utf-8").trim()
              const versionResult = await $`deciduous --version 2>/dev/null`.quiet().nothrow()
              const current = versionResult.stdout.toString().match(/(\d+\.\d+\.\d+)/)?.[1]
              if (current && latest && latest !== current) {
                notifyUpdate(current, latest)
              }
            }
            return
          }
        }

        // Fetch latest version from crates.io
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        try {
          const resp = await fetch("https://crates.io/api/v1/crates/deciduous", {
            signal: controller.signal,
            headers: { "User-Agent": "deciduous-version-check" }
          })
          clearTimeout(timeout)
          const data = await resp.json() as any
          const latest = data?.crate?.max_version
          if (!latest) return

          // Cache result
          fs.writeFileSync(".deciduous/.latest_version", latest)
          fs.writeFileSync(".deciduous/.last_version_check", Math.floor(Date.now() / 1000).toString())

          // Compare
          const versionResult = await $`deciduous --version 2>/dev/null`.quiet().nothrow()
          const current = versionResult.stdout.toString().match(/(\d+\.\d+\.\d+)/)?.[1]
          if (current && latest !== current) {
            notifyUpdate(current, latest)
          }
        } catch {
          // Network error or timeout - skip silently
        }
      } catch {
        // Any error - skip silently
      }
    }
  }
}
