---
name: gate
description: Pre-commit quality gate. Scans for anti-patterns, duplicate types, bandaid code, and SSOT violations. Blocks commit if violations found.
user-invocable: true
disable-model-invocation: false
argument-hint: "[optional: specific check to run, e.g. 'dupes', 'imports', 'types']"
---

# Gate — Pre-Commit Quality Enforcement

Check: $ARGUMENTS (or "all" if blank)

## Purpose

Run BEFORE committing. Catches anti-patterns that compile but violate architecture.
Compilation passing does NOT mean the code is correct. This gate catches what
the compiler can't.

## Checks

### 1. DUPLICATE DEFINITIONS

Scan for the same type/const/interface defined in multiple files:

```
Grep: "export (const|type|interface) (SizeToken|RadiusToken|AccentToken|...)"
```

**Known SSOTs** (update this list as architecture evolves):
- 8-axis encoding types → `registry/token-categories.ts`
- Size/Radius types → `recipes/_base/schema.ts`
- Recipe types → `recipes/_base/schema.ts`
- Preset type → `registry/token-categories.ts`

FAIL if any SSOT type is also defined elsewhere.

### 2. IMPORT CHAIN DEPTH

Scan for imports that go through unnecessary barrels:

```
File A imports from barrel B, which re-exports from source C.
If A could import directly from C → FLAG.
```

Exception: The design system public API (`design/index.ts`) is a legitimate barrel.
Internal code should import from source, not from the public barrel.

### 3. BANDAID INDICATORS

Scan for telltale signs of bandaid code:

```
Grep: "backward compat", "backwards compat", "legacy", "temporary",
      "TODO: remove", "HACK:", "FIXME:", "for now"
```

In pre-release, these are not acceptable. Fix or remove.

### 4. STALE RE-EXPORTS

Find barrel files (index.ts) that re-export from files that no longer exist:

```
For each index.ts:
  Read the file
  For each export ... from "./path.js":
    Check if path.ts exists
    If not → STALE RE-EXPORT
```

### 5. ANY TYPES

```
Grep: ": any" or "as any" or "<any>"
```

Zero tolerance. If a type is unknown, use `unknown` with a type guard.

### 6. DELETED CONCEPT REFERENCES

```
Grep: "taxonomy/", "catalog/", "semantics/", "molecules/",
      "shortcodes/", "/ui/", "builders/"
```

These concepts are deleted. Any reference is stale drift.

### 7. COMPILE CHECK

```bash
cd interfaces/desktop && npx svelte-check --threshold error 2>&1 | tail -20
```

Zero errors. Warnings are noted but don't block.

## Output Format

```
GATE CHECK: {timestamp}

[PASS] Duplicate definitions: 0 found
[FAIL] Import chain depth: 3 unnecessary barrels
  - packages/coldlight/recipes/utils.ts imports from tokens/index.js instead of tokens/types.js
[PASS] Bandaid indicators: 0 found
[FAIL] Stale re-exports: 1 found
  - packages/coldlight/tokens/index.ts re-exports from ./schema.js (file deleted)
[PASS] Any types: 0 found
[PASS] Deleted concepts: 0 found
[PASS] Compile: 0 errors

RESULT: BLOCKED (2 failures) / CLEAR (0 failures)
```

## Store Violations in SurrealDB

When gate finds FAIL results, store them as learnings so future sessions see the pattern:

```bash
# Store a gate violation as a learning
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "CREATE shared_learnings SET
    content = '{description of the violation}',
    severity = 'major',
    category = 'gate-violation',
    check = '{which check failed}',
    file = '{file path}',
    created_at = time::now();"
```

If SurrealDB is not running, skip — violations are still reported in gate output.

## Integration

Run `/gate` before every commit. If BLOCKED:
1. Fix each failure
2. Re-run `/gate`
3. Only commit when CLEAR

The `/fixes` and `/corrections` skills should invoke `/gate` after completing work.

## Never

- Never bypass gate for "just this once"
- Never weaken a check to make it pass
- Never add exceptions for known violations (fix them instead)
