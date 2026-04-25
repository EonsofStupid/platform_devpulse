# Pre-authored phased execution plan

> The user already did the planning. Execute one phase per turn.

**Verified triggers (corpus document-frequency):** `Phase 1` (35 hits), `Phase 2` (35), `Phase 0` (26), `Phase A` (17), `### Files` (10).
**Promote to:** skill — `execute-the-phases`.

## When this mode is active

User has authored a prompt with `## Phase N — <name>` or `### Phase A` headings. Each phase has a `Files:` line with bulleted file paths, a fenced bash block with `cargo check` / `cargo test` / `pnpm check` / `git diff`, and sometimes a final `## Verification gate` tying phases together.

## What it means

The user has already done the planning skill's job. They want literal execution of phase 0, then a stop, then phase 1, etc. — not a re-plan, not a merged super-phase, not a parallelized variant.

## Automatic actions

- Execute exactly one phase per turn unless the user says otherwise.
- Touch only the files listed under that phase's `Files:` bullet.
- Run the verify block as written, paste the output, and stop at the gate.
- Report results per-phase using the user's phase numbering and headings.
- If a verify command fails, fix the cause inside that phase's file list — do not pull from later phases.

## Anti-patterns

- Combining phases ("I did 0, 1, and 2 in one commit").
- Substituting a different verify command.
- Adding a "Phase 0.5" the user didn't author.
- Re-running the planning skill on top of a prompt that is already a plan.
- Touching files outside the phase's listed set "while I'm in there".
