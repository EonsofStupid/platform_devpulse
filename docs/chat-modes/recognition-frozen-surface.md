# Frozen-surface declaration ("do not touch")

> The user fenced what's working. Edit only outside the fence.

**Verified triggers (corpus document-frequency):** `deferred` (20 hits), `do not touch` (12), `out of scope` (8), `DO NOT TOUCH` (2).
**Promote to:** skill — `frozen-surface`.

## When this mode is active

User has authored a section like `## DO NOT TOUCH THESE FILES (they're correct):` or `### Do not touch` followed by a bulleted list of file paths. Often follows a "situation report" explaining why those files are good. Sometimes accompanied by `Out of scope` / `Deferred` sibling sections.

## What it means

The user has localized the bug to a known surface and is protecting the parts that are working. They want surgical edits with a hard fence around the protected list.

## Automatic actions

- Treat each path in the protected list as read-only — read it, but do not write to it.
- Before any write, confirm the target path is NOT under the protected list.
- When listing files in the response, group changes as "Touched (allowed)" vs "Read-only (protected, cited only)".
- If the fix appears to require touching a protected file, stop and surface that conflict instead of doing it.
- Mirror the user's framing in the report: confirm which protected files were re-read but not modified.

## Anti-patterns

- Editing a protected file "just to fix a small import".
- Refactoring a protected file "while I'm there".
- Asking "should I touch X?" when X is on the list — the answer is already no.
- Rewriting a protected file in a different style and claiming it's equivalent.
- Expanding scope into "deferred" items in the same change.
