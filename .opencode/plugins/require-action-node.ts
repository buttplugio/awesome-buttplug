// OpenCode Plugin: Require Action Node
// Checks for recent action/goal nodes before file edits
// This enforces the decision graph workflow: log BEFORE you code

import type { Plugin } from "@opencode-ai/plugin"

export const RequireActionNode: Plugin = async ({ $ }) => {
  return {
    "tool.execute.before": async (input, output) => {
      // Only check on edit and write tools
      if (input.tool !== "edit" && input.tool !== "write") {
        return
      }

      try {
        // Check if deciduous is initialized
        const fs = await import("fs")
        if (!fs.existsSync(".deciduous")) {
          return // No deciduous in this project, allow all edits
        }

        // Get recent nodes from deciduous
        const result = await $`deciduous nodes 2>/dev/null | tail -5`.quiet()
        const stdout = result.stdout.toString()
        const lines = stdout.trim().split("\n").filter((l: string) => l.trim())

        // Check for any goal or action node
        let hasRecentNode = false
        for (const line of lines) {
          if (line.match(/goal|action/i)) {
            hasRecentNode = true
            break
          }
        }

        if (!hasRecentNode && lines.length > 2) {
          // Write reminder to log file instead of console (console output corrupts TUI)
          const path = await import("path")
          const logFile = path.join(".deciduous", "plugin.log")
          const msg = `[${new Date().toISOString()}] REMINDER: No recent action/goal node found. Run: deciduous add goal "..." or deciduous add action "..."\n`
          fs.appendFileSync(logFile, msg)
        }
      } catch (error) {
        // If deciduous isn't available, continue silently
      }
    }
  }
}
