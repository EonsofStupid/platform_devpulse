# Research first, then EXECUTE

> No infinite planning. Research is the precursor to shipping, not a substitute. (Merged with the prior `no-rushing-foundational-best-practice` theme — same impulse, different framing.)

**Verified triggers (corpus document-frequency):** `SSOT` (88 hits), `best practice` (49), `research notes` (18), `parking lot` (12), `circle jerking` (9), `stay in planning` (6), `stop guessing` (5).

**Promote to:** skill.
**Existing memory:** [feedback_research_then_execute.md](../../memory/feedback_research_then_execute.md), [feedback_ask_before_guessing.md](../../memory/feedback_ask_before_guessing.md), [project_service_pattern.md](../../memory/project_service_pattern.md), [project_devtool_pattern.md](../../memory/project_devtool_pattern.md).

## The recurring ask, in one sentence

The user wants the planning skill / research notes / SSOT mapping done before writing code, but only as a precursor to actually executing — they reject planning loops where research repeats and code never lands. They also expect senior-dev craftsmanship on foundational work (no shortcuts, no bandaids), but craftsmanship paid for by reading the codebase, not by re-deriving from filenames.

## The real underlying need

Disciplined sequence — read existing code, write findings to disk, get owner sign-off on forks, then ship. Avoid both:
1. Writing code without reading the codebase ("rushing").
2. Producing endless plans with no execution ("circle jerking").

## Automatic actions

- Open the planning skill / write a research doc to disk before non-trivial implementation.
- Map SSOTs first: list every place a concept already lives, flag duplicates.
- Surface STOP points as one-line questions, not multi-option decision matrices.
- After plan approval, EXECUTE the plan — do not commit infrastructure docs as if they were the work.
- If research uncovers a blocking compile error or broken foundation, fix that BEFORE the new feature.
- On foundational code (xtask, services, lifecycle, telemetry): use `tracing` with structured fields, not `println` / `eprintln`.
- Add integration tests (not just unit) for cross-module behavior on foundations.
- Implement graceful-then-forced shutdown patterns with retry windows.

## Anti-patterns

- Writing 5 plans without shipping a single feature.
- Re-researching what was already decided last session.
- Producing decision-tree proposals when a one-line confirm would do.
- Researching forever to avoid executing on something hard.
- Skipping the read-the-actual-files step and inferring from filenames.
- `println!` / `eprintln!` in production-scope orchestrators.
- Catch-all `exit-code 1` for every failure mode.
- Silent error swallowing (`let _ = writeln!(...)`).
