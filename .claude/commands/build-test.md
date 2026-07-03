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
   cargo test <pattern>
   ```

$ARGUMENTS
