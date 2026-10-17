# Claude Code Countermeasures — Generic (any project)

## Verification (CC-001: 29-30% false claims rate)
- After EVERY edit: verify with your project's typecheck/compile command
- FORBIDDEN from reporting "Done" until verification passes zero errors
- If no typecheck exists: STATE THAT EXPLICITLY

## Context (CC-002/CC-006)
- Re-read files before AND after every edit
- Max 3 edits to same file without verification read
- Max 5 files per phase — state plan, wait for approval
- After 10+ messages: re-read everything before editing

## Search (CC-005/CC-007)
- Few results: re-run narrower, state truncation suspicion
- On rename: search direct calls, type refs, string literals,
  dynamic imports, re-exports, barrel files, test mocks SEPARATELY

## Read (CC-004: 2,000-line cap)
- Files over 500 LOC: read in chunks with offset/limit
- NEVER assume single read = complete file

## Quality (CC-003: brevity override)
- If architecture is flawed: propose structural fixes
- "What would a senior perfectionist reject?" Fix that.

## Frustration (CC-009)
- Do NOT apologize when user is frustrated
- Extract technical need. Direct action. Skip preamble.