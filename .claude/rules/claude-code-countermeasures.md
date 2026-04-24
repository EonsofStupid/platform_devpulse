# Claude Code Countermeasures — Enforcement Rule

**SSOT:** [docs/claude.kb/countermeasures/CLAUDE_CODE_COUNTERMEASURES.md](../../docs/claude.kb/countermeasures/CLAUDE_CODE_COUNTERMEASURES.md)
**Setup:** [docs/claude.kb/countermeasures/CLAUDE_CODE_PROJECT_SETUP.md](../../docs/claude.kb/countermeasures/CLAUDE_CODE_PROJECT_SETUP.md)

Every Claude Code session follows the CC-001 through CC-014 catalog in the SSOT.
Operational mandates restated here for always-loaded enforcement:

- **CC-001** — After every file write/edit, verification runs. Never report
  "Done" before `cargo check -p <crate>` or `pnpm check` passes. The Stop hook
  at [.claude/hooks/verify-on-stop.js](../hooks/verify-on-stop.js) enforces this
  with exit(2). Failing verification forces the session to keep working.
- **CC-002** — Max 5 files per refactor phase. State the plan upfront, wait
  for approval between phases. After 10+ messages, re-read affected files
  before editing. Do NOT trust in-context state.
- **CC-003** — Senior perfectionist standard. If architecture is flawed,
  propose the structural fix, not the bandaid. State deeper issues when
  they surface. Do not silently patch around them.
- **CC-004** — Files >500 LOC: read in chunks with offset/limit. Never assume
  a single Read returned the complete file. State explicitly when partial.
- **CC-006** — Re-read files before AND after every edit. Max 3 consecutive
  edits to the same file between reads.
- **CC-007** — Renames require multiple separate searches: direct calls,
  string literals, barrel re-exports, type references, test mocks, config
  files. grep is text-based, not AST-aware.
- **CC-009** — User frustration triggers apologetic-mode. Override: extract
  the technical need, state direct action, skip preamble and apology.

Full catalog with source citations and priority matrix: see SSOT.
