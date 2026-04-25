# Source-of-truth comparison table

> The table IS the contract. Each row is a decision already made.

**Verified triggers (corpus document-frequency):** `|---` (53 hits), `SSOT` (55), `source of truth` (54).
**Promote to:** skill — `obey-the-table`.

## When this mode is active

User has authored a markdown table with a `|---|---|` header separator. Column 1 is a stable identifier (Profile, Subsystem, Concern, Field, Crate); subsequent columns assign ownership, file path, or status. Often introduced by a heading like `## Slot Table`, `## What Is NOT In X`, or referenced as `SSOT`.

## What it means

The user has settled the contract. Each row is a decision already made. They want code that exactly populates that table — same identifiers, same assignments, no extra rows, no merged or dropped rows.

## Automatic actions

- Treat each row as a test case: every identifier in column 1 must resolve in code with the values in subsequent columns.
- When generating code, use the column-1 identifiers verbatim as struct / enum / const names.
- If a row says "lives in X", put it in X — don't reorganize.
- When verifying, walk the table top-to-bottom and report row-by-row pass/fail.
- Echo the table back at the end of the change with a status column appended.

## Anti-patterns

- Adding rows the user didn't author ("I also added a default row for…").
- Collapsing rows that look similar.
- Renaming the column-1 identifier to something "more idiomatic".
- Re-deriving the mapping from first principles instead of obeying the table.
- Asking "are you sure about row N?" when the table is already specific.
