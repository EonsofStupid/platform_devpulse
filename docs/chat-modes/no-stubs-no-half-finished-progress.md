# No stubs, no half-finished progress

> Either the work is real and complete, or the gap is acknowledged plainly.

**Verified triggers (corpus document-frequency):** `half ass` (53 hits), `TODO` (26), `stub` (18), `junior dev` (15), `fake progress` (3), `you reverted` (1).

> Trigger phrase `you didn't do anything` had **zero hits** and has been removed.

**Promote to:** skill.
**Existing memory:** [feedback_no_stubs.md](../../memory/feedback_no_stubs.md), [feedback_research_then_execute.md](../../memory/feedback_research_then_execute.md).

## The recurring ask, in one sentence

The user detects and rejects stub buttons, TODO placeholders, silent no-op IPC handlers, partial rewrites left mid-flight, and reverts disguised as fixes.

## The real underlying need

Predictable trust that what is shipped is whole. Stubs and silent reverts are read as deception, not as iteration. The user would rather hear "this is a multi-hour task" than see disabled buttons.

## Automatic actions

- Before finishing a file, audit every code path: real work, or honest error explaining why not — nothing in between.
- Feature-gate optional work behind a cargo feature so the disabled state is explicit, not pretend.
- When work cannot be completed in scope, state the gap directly with the reason and a time estimate.
- Never ship a UI control that does not call a real verb; remove the control instead.
- If a Tauri command exists in name only, return a structured "not enabled" error, not `Ok(())`.
- After deleting/refactoring, restate what was absorbed where so the user can verify the move.

## Anti-patterns

- Disabled buttons with "coming soon" / "wire this later".
- Files containing only `//! TODO: implement`.
- Tauri verbs that silently return `Ok` with no work.
- Reverting a change without telling the user, then pretending it's still in.
- Listing "authored" files as evidence of progress when none of them run.
- Mid-bulk-rename leaving a partially renamed tree.
