# Foundational Code Authoring Workflow

Before touching ANY code in this project, execute this workflow exactly.

## Phase 1: Read Every File Involved

1. Identify EVERY file in the change chain — Rust, Svelte, state runes, services, components
2. Read each file IN FULL (chunk if >500 lines)
3. Write findings to the plan file AS YOU READ — do not batch
4. Document for each file:
   - File path and line count
   - Every public function/method and its signature
   - Every $state/$derived declaration (Svelte)
   - Every IPC call (invoke, listen, emit)
   - Every event name subscribed or emitted
   - ColdLight token usage (YES/NO + which tokens)
   - Bugs found with exact line numbers
   - Status: CORRECT / BROKEN / NEEDS CHANGE

## Phase 2: Verify Prerequisites

1. Check feature flags: `grep "feature" Cargo.toml` through the full dep chain
2. Check binaries exist on disk: `ls` the binaries directory
3. Check model files exist: `find models/ -name "*.gguf"`
4. Check sidecar config in tauri.conf.json
5. Verify Rust compiles BEFORE changes: `cargo check -p devpulse_desktop_backend`
6. Verify Svelte compiles BEFORE changes: `pnpm check`

## Phase 3: Document All Bugs

Create a numbered bug list in the plan. Each bug must have:
- File path and line number
- Exact code that's broken (verbatim from the file)
- Why it's broken (root cause chain)
- Exact fix (verbatim replacement code)
- Dependencies (does this fix depend on another fix?)

## Phase 4: Write Execution Plan

Ordered phases. Each phase:
- Which file(s) to edit
- Exact line numbers
- Verbatim old code → new code
- Verification step after each phase

## Phase 5: Execute

- Re-read each file BEFORE editing (countermeasure CC-002)
- Make the edit
- Re-read AFTER editing to verify
- Run `cargo check` or `pnpm check` after EVERY file
- Do NOT proceed to next phase if current phase has errors

## Phase 6: Verify End-to-End

- `cargo check -p devpulse_desktop_backend` — 0 errors
- `pnpm check` — 0 errors
- Check session logs for expected events firing
- Document what was changed and what was verified

## Rules

- NEVER assume file contents from memory — READ IT
- NEVER skip the plan — WRITE IT
- NEVER claim "done" without verification — CHECK IT
- NEVER patch one error without understanding the chain — TRACE IT
- If architecture is wrong, propose structural fix — DON'T BANDAID
- Max 5 files per phase. State phase plan. Wait for approval between phases.
