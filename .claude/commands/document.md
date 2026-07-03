---
description: Document a file or directory comprehensively - shaking the tree to truly understand it
allowed-tools: Read, Glob, Grep, Bash(ls:*, find:*, wc:*, git log:*, git blame:*, deciduous:*), Write, Edit
argument-hint: <file-or-directory>
---

# Document

**Comprehensive documentation that shakes the tree to understand everything.**

This skill generates in-depth documentation for a file or directory, focusing on:
- Human readability while covering ALL surface area
- Linking to tests as working examples
- Refining tests to look more real-world if needed
- Integration with the deciduous decision graph

---

## Step 1: Create Documentation Goal Node

Before documenting, log what you're about to do:

```bash
deciduous add goal "Document $ARGUMENTS" -c 90 --prompt-stdin << 'EOF'
[User's verbatim documentation request]
EOF
```

Store the goal ID for linking later.

---

## Step 2: Understand the Target

### For a File

1. **Read the file completely**
   - Understand every function, class, type, and export
   - Note all imports and dependencies
   - Identify the file's role in the larger system

2. **Find tests for this file**
   - Look for test files with similar names
   - Search for imports/references in test directories
   - These will become working examples in the docs

3. **Trace callers/callees**
   - Who calls this file?
   - What does this file call?
   - Map the dependency graph

### For a Directory

1. **Map the structure**
   - List all files and their purposes
   - Identify the public API (index/mod files)
   - Find the entry point

2. **Understand relationships**
   - How do files in this directory interact?
   - What's the data flow?

3. **Find related tests**
   - Test directories that cover this code
   - Integration tests that exercise the whole module

---

## Step 3: Document Each Component

For each file/component, document:

### 3.1 Purpose
- One sentence: what does this do?
- Why does it exist? (The "why" is more important than the "what")

### 3.2 API Surface
For every public function/method/class:

```markdown
### `function_name(param1: Type, param2: Type) -> ReturnType`

**Purpose:** What this does and why you'd call it.

**Parameters:**
- `param1` - Description and valid values
- `param2` - Description and valid values

**Returns:** What the return value means

**Throws/Errors:** What can go wrong

**Example:**
```code
// From: tests/example_test.rs:42
let result = function_name("input", 42);
assert_eq!(result, expected);
```

**Related:** Links to related functions
```

### 3.3 Internal Architecture
- How does it work internally?
- What are the key data structures?
- What are the invariants?

### 3.4 Dependencies
- What does this depend on?
- What depends on this?

### 3.5 Tests as Examples

For each relevant test:
- Show the test as a working example
- Explain what the test demonstrates
- **If test is too synthetic/artificial, REFINE IT:**
  - Make variable names descriptive
  - Add comments explaining the scenario
  - Use realistic values instead of "foo", "bar", 123
  - Create a deciduous observation node noting the refinement

---

## Step 4: Create Documentation File

**Output location:**
- For file `src/auth/jwt.rs` -> `docs/src/auth/jwt.rs.md`
- For directory `src/auth/` -> `docs/src/auth/README.md`

**Document structure:**

```markdown
# <Component Name>

> One-sentence description

## Overview

High-level explanation of what this does and why it exists.

## Quick Start

```code
// Most common usage pattern - from real tests
```

## API Reference

[For each public function/type/constant]

### `function_name(...)`

[Generated from Step 3.2]

## Architecture

[Internal design, data flow, key invariants - from Step 3.3]

## Examples

[Tests converted to examples - from Step 3.5]

## Dependencies

[What this depends on, what depends on this - from Step 3.4]

## Related Documentation

- Links to other relevant docs
- Links to test files
```

---

## Step 5: Refine Tests If Needed

If tests are too synthetic (meaningless variable names, unrealistic values):

1. Read the test file
2. Improve it with:
   - Descriptive variable names (user_email, order_total, not x, y)
   - Realistic values (not "foo", "bar", 123)
   - Comments explaining the scenario
3. Edit the test file with improvements
4. Create observation node:

```bash
deciduous add observation "Refined tests for <component> - made more real-world" -c 85
deciduous link <action_id> <observation_id> -r "Test improvements during documentation"
```

---

## Step 6: Link to Decision Graph

After documentation is complete:

```bash
# Create documentation action (if not already created)
deciduous add action "Documented <target>" -c 95 -f "<files-created>"

# Link to goal
deciduous link <goal_id> <action_id> -r "Documentation complete"

# Create outcome
deciduous add outcome "Documentation complete for <target>" -c 95
deciduous link <action_id> <outcome_id> -r "Successfully documented"

# Sync
deciduous sync
```

---

## Step 7: Verify Coverage

**Checklist before completing:**

- [ ] Every public function documented
- [ ] Every parameter explained
- [ ] Every return value explained
- [ ] Every error case documented
- [ ] At least one example per function (from tests)
- [ ] Architecture overview included
- [ ] Dependencies mapped
- [ ] Links to tests included
- [ ] Tests refined if they were synthetic

If anything is missing, go back and fill it in. **Do not miss any surface area.**

---

## Decision Criteria

**What to document:**
- Public APIs (always)
- Complex internal logic (when it's not obvious)
- Design decisions (why, not just what)
- Edge cases and error handling
- Integration points

**What NOT to document:**
- Trivial getters/setters
- Auto-generated code
- Implementation details obvious from code

**How deep to go:**
- Deep enough that someone new could understand and use the code
- Deep enough that someone could modify it without breaking things
- Capture the "why" behind design decisions

---

## Example Usage

```bash
# Document a single file
/document src/auth/jwt.rs

# Document a directory
/document src/auth/

# Document the whole project
/document .
```

**What happens:**
1. Goal node created
2. Code analyzed thoroughly
3. Tests found and used as examples
4. Tests refined if synthetic
5. Documentation written to docs/
6. Action/outcome nodes created
7. Graph synced

---

## Integration with Documentation Enforcement

When documentation is created, the `require-documentation.sh` hook will recognize it exists. This creates a virtuous cycle:

1. Can't edit code without documentation (hook blocks)
2. Run `/document` to create documentation
3. Now code edits are allowed
4. When code changes significantly, re-run `/document`

---

## Quick Reference

```bash
# Document and generate docs
/document <path>

# After documenting, you can edit the file
# The require-documentation.sh hook will allow it
```

**Always creates:**
- Goal node (before starting)
- Action node (for the documentation work)
- Outcome node (on completion)
- Observation nodes (for test refinements)

**Now document: $ARGUMENTS**
