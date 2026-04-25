# Pre-release mode — no backcompat, no migration questions

> The repo is unreleased. Replace, align, no shims.

**Verified triggers (corpus document-frequency):** `align` (frequent), `delete` (frequent), `pre-release` / `no backwards compat` (low single-digit but distinctive when they fire).

**Promote to:** none — already covered by existing memory; doc kept for cross-reference.
**Existing memory:** [feedback_no_backcompat_questions.md](../../memory/feedback_no_backcompat_questions.md), [feedback_reference_vs_implement.md](../../memory/feedback_reference_vs_implement.md).

## The recurring ask, in one sentence

The user refuses to entertain backcompat / migration / grandfathering questions — the project is unreleased and the answer is always "replace, align, no shims."

## The real underlying need

Move at full speed. The repo is private and unreleased; carrying old shapes only slows execution. When the user pivots, the old version disappears.

## Automatic actions

- Never ask "how should we handle existing X?" — replace it.
- Frame migration work as "I'll align existing X to the new shape" (statement, not question).
- Delete legacy code paths when their replacement lands; do not leave deprecation aliases.
- When the user reverts a typed direction, treat it as if it never happened — no archive note.
- Save question budget for genuine forks (format, ownership, strictness modes), not migration logistics.

## Anti-patterns

- Asking "should we keep the old API for backcompat?".
- Adding `_v2` suffixes when the v1 will be replaced.
- Leaving deprecated re-exports "for safety".
- Authoring a migration script for unreleased internal data.
- Treating prior session's decisions as immutable when the user has reversed them.
