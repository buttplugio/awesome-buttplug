# Start Decision Graph Viewer

Launch the deciduous web server for viewing and navigating the decision graph.

## Instructions

1. Start the server:
   ```bash
   deciduous serve --port 3000
   ```

2. Inform the user:
   - The server is running at http://localhost:3000
   - The graph auto-refreshes every 30 seconds
   - They can browse decisions, chains, and timeline views
   - Changes made via CLI will appear automatically

3. The server will run in the foreground. Remind user to stop it when done (Ctrl+C).

## UI Features
- **Chains View**: See decision chains grouped by goals
- **Timeline View**: Chronological view of all decisions
- **Graph View**: Interactive force-directed graph
- **DAG View**: Directed acyclic graph visualization
- **Detail Panel**: Click any node to see full details including:
  - Node metadata (confidence, commit, prompt, files)
  - Connected nodes (incoming/outgoing edges)
  - Timestamps and status

## Alternative: Static Hosting

For GitHub Pages or other static hosting:
```bash
deciduous sync  # Exports to docs/graph-data.json
```

Then push to GitHub - the graph is viewable at your GitHub Pages URL.

$ARGUMENTS
