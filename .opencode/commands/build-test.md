---
description: Build the project and run the test suite
arguments:
  - name: PATTERN
    description: Optional test pattern to filter tests
    required: false
---

# Build and Test

Build the project and run the test suite.

## Instructions

1. Run the full build and test cycle:
   ```bash
   cargo build --release && cargo test
   ```

2. If tests fail, analyze the failures and explain:
   - Which test failed
   - What it was testing
   - Likely cause of failure
   - Suggested fix

3. If all tests pass, report success and any warnings from the build.

4. If the user specifies a specific test pattern, run only those tests:
   ```bash
   cargo test $PATTERN
   ```

## Test categories in this project
- `test_public_exports` - API verification
- `test_filter_graph` - Graph filtering
- `test_extract_commit` - Commit extraction from metadata
- `test_extract_confidence` - Confidence extraction from metadata
- `test_graph_to_dot` - DOT export
- `test_generate_writeup` - PR writeup generation
