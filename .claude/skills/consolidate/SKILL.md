---
name: consolidate
description: Find duplicate definitions across codebase, pick the SSOT, redirect all consumers, delete the rest. Pre-release mode — no shims, no backwards compat.
user-invocable: true
disable-model-invocation: false
argument-hint: "<type name, module path, or 'scan' to find all duplicates>"
---

# Consolidate — Duplicate Elimination

Target: $ARGUMENTS

## Purpose

Pre-release codebases accumulate duplicate type definitions, competing re-exports,
and stale barrel files across sessions. This skill finds them, picks the single
source of truth, redirects every consumer, and deletes the rest.

**This is merge-forward, not backwards-compat.** No shims. No re-export facades.
No "for backward compatibility" comments. One definition. One import path. Done.

## Protocol

### 1. SCAN — Find All Definitions

If `$ARGUMENTS` is "scan", search the entire design system for competing definitions:

```
Grep for: export (type|interface|const) {Name}
Glob for: **/types.ts, **/*.d.ts, **/schema.ts, **/index.ts
```

Build a map:
```
{TypeName}:
  - DEFINED in: {file1}:{line} (original/authoritative)
  - DEFINED in: {file2}:{line} (duplicate)
  - DEFINED in: {file3}:{line} (duplicate)
  - IMPORTED by: {consumer1}, {consumer2}, ...
```

If `$ARGUMENTS` is a specific name, search only for that.

### 2. PICK — Identify the SSOT

Rules for picking the SSOT (in priority order):
1. **Registry-derived** beats hand-authored. If `token-categories.ts` generates it, that's the SSOT.
2. **Closest to the domain** wins. Recipe types live in recipes/. Token types live in registry/.
3. **Most complete** wins. The definition with validation (Zod schema) beats the bare type.
4. **Deepest in the dependency chain** wins. If A imports from B which imports from C, C is the SSOT.

If ambiguous — STOP and ask the owner. Do not guess.

### 3. REDIRECT — Update Every Consumer

For each consumer of a duplicate:
1. Read the file (MANDATORY — never edit blind)
2. Change the import path to point at the SSOT
3. Verify the import resolves (check that the SSOT actually exports the name)

Track in TodoWrite:
```
[ ] Redirect: {consumer file} → import from {SSOT path}
```

### 4. DELETE — Remove All Duplicates

After ALL consumers are redirected:
1. Verify no remaining imports point to the duplicate file
2. Delete the duplicate file
3. If the duplicate was in a barrel (index.ts), remove the re-export line
4. If the barrel is now empty, delete the barrel

Track in TodoWrite:
```
[ ] Delete: {duplicate file} (0 remaining consumers)
[ ] Clean barrel: {index.ts} (removed re-export of {name})
```

### 5. VERIFY — Compile Check

After all redirects and deletions:
```bash
cd interfaces/desktop && npx svelte-check --threshold error
```

If errors:
- If the error is "Cannot find module" → a consumer was missed. Find and redirect it.
- If the error is a type mismatch → the SSOT definition differs from the duplicate. The SSOT wins. Fix the consumer.
- NEVER restore a deleted file to fix an error. That's a bandaid.

## Anti-Patterns (REJECT THESE)

- "Re-export for backward compatibility" → NO. Change the import.
- "Keep both and alias" → NO. One definition.
- "Add a facade that maps old names to new" → NO. Rename at the consumer.
- "Make it optional to avoid breaking" → NO. Fix the consumer.
- "Restore the deleted file" → ABSOLUTELY NOT.

## Output

```
CONSOLIDATE: {target}

SSOT: {file}:{line} — {why this is authoritative}

DUPLICATES FOUND:
  - {file1} (X consumers) → REDIRECTED, DELETED
  - {file2} (Y consumers) → REDIRECTED, DELETED

CONSUMERS REDIRECTED: {count}
FILES DELETED: {count}
COMPILE: PASS/FAIL
```

## Never

- Never create a new file to "bridge" old and new
- Never add re-exports to make old paths work
- Never skip the compile verification
- Never restore a deleted duplicate
- Never proceed if SSOT is ambiguous — ask the owner
