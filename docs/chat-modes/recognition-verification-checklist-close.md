# Sprint-close verification checklist

> The `[ ]` list is the definition of done. Walk it, prove each item.

**Verified triggers (corpus document-frequency):** `## Verification` (14 hits), `Verification Gate` (7), `Verification Checklist` (4), `verification gate` (4).
**Promote to:** skill — `walk-the-checklist`.

## When this mode is active

User has authored a section under `## Verification Checklist`, `## Verification Gate`, or `Verification gates` containing markdown checkboxes (`- [ ]` or `- [x]`). Items reference concrete commands (cargo, pnpm, lefthook) or concrete behavior (set X → reload → see Y). Sometimes paired with a "Zero errors means zero" statement.

## What it means

The user has fully specified the success criteria. They are not asking what "done" means — they are asking Claude to walk that list and prove each item.

## Automatic actions

- Run each item in order; capture the literal command output.
- Report back as the same list with `[x]` or `[ ]` flipped, not a prose summary.
- Treat warnings as failures unless the item explicitly carves out "errors only".
- If an item fails, fix it before marking the next item.
- Do not invent additional checklist items.

## Anti-patterns

- Marking `[x]` without running the underlying command.
- Skipping items the user wrote because "they look redundant".
- Summarizing "mostly green" instead of listing each box.
- Adding "I also checked Z" items the user didn't author.
- Treating a pre-existing baseline error as "not in scope".
