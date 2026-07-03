# Sync Decision Graph to GitHub Pages

Export the current decision graph to docs/graph-data.json so it's deployed to GitHub Pages.

## Steps

1. Run `deciduous sync` to export the graph
2. Show the user how many nodes/edges were exported
3. If there are changes, stage them: `git add docs/graph-data.json`

This should be run before any push to main to ensure the live site has the latest decisions.
