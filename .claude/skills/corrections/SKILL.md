---
name: corrections
description: Fix issues identified during verification or review
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, TodoWrite
argument-hint: "<issue description or verification failure>"
---

# Corrections — Issue Resolution

Issue to fix: $ARGUMENTS

## Purpose

After verification or review identifies problems:
1. Understand the specific failure
2. Locate the source
3. Apply minimal targeted fix
4. Verify fix works

## Protocol

### 1. Read Before Fixing
MANDATORY: Read every file before editing.
- Read the file with the issue
- Read related files to understand context
- Read the verification output or error message

### 2. Document the Correction
Create todo list with:
```
[ ] Understand: {what's broken and why}
[ ] Locate: {exact file and line}
[ ] Fix: {minimal change needed}
[ ] Verify: {how to confirm it's fixed}
```

### 3. Apply Minimal Fix
- Change ONLY what is necessary
- Do not refactor surrounding code
- Do not add "improvements"
- Do not add comments to unchanged code

### 4. Verify the Fix
After each fix:
1. Run the specific check that failed
2. If check passes → mark todo complete
3. If check fails → understand why, iterate

### 5. Update Sprint if Needed
If correction reveals:
- Missing prerequisites → add to sprint
- Additional work needed → add tasks
- Architectural issue → create parking lot entry

## Checklist Pattern

For each issue:
```
- [ ] READ: {file path}
- [ ] ISSUE: {specific problem}
- [ ] FIX: {what to change}
- [ ] VERIFY: {command to run}
```

After VERIFY passes, mark all as complete and move to next issue.

## Never

- Never edit without reading first
- Never fix more than what's broken
- Never skip verification step
- Never batch fixes without verifying each one
