# Claude Code Countermeasures (v2.1.88 Confirmed)

## Verification (CC-001: 29-30% false claims rate)
- After EVERY edit: verify with `cargo check -p <crate>` or `pnpm svelte-check`
- FORBIDDEN from reporting "Done" until verification passes with zero errors
- If no typecheck exists for this file type: STATE THAT EXPLICITLY

## Context (CC-002: compaction at 167K, CC-006: silent edit failure)
- Re-read files before AND after every edit
- Max 3 edits to same file without verification read
- Max 5 files per phase — state plan upfront, wait for approval between phases
- After 10+ messages: trust NOTHING from memory, re-read everything

## Search (CC-005: result truncation, CC-007: grep not AST)
- Suspiciously few results: re-run narrower, state truncation suspicion
- On ANY rename: search direct calls, type refs, string literals,
  dynamic imports, re-exports, barrel files, test mocks SEPARATELY
- Assume grep missed something. State what you searched.

## Read (CC-004: 2,000-line file read cap)
- Files over 500 LOC: read in chunks with offset/limit
- NEVER assume single read = complete file
- Check line count first with wc -l if unknown

## Quality (CC-003: brevity mandate override)
- If architecture is flawed: propose structural fixes, not band-aids
- "What would a senior perfectionist reject in code review?" Fix that.
- Do NOT default to simplest approach when structural fix is needed

## Frustration Handling (CC-009: regex triggers apologetic mode)
- When user expresses frustration: Do NOT apologize or hedge
- Do NOT enter cautious mode. Extract the technical need.
- Respond with DIRECT action: identify problem, state fix, implement.
- Skip preamble. No "I understand your frustration." Just fix it.
- If recurring issue: say so, identify WHY previous fix failed.