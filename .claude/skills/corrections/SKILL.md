---
name: corrections
description: Fix issues identified during verification or review. Root cause only — never bandaid.
user-invocable: true
disable-model-invocation: false
argument-hint: "<issue description or verification failure>"
---

# Corrections — Root Cause Resolution

Issue to fix: $ARGUMENTS

## Purpose

After verification or review identifies problems:
1. Understand the ACTUAL failure — not just the symptom
2. Find the ROOT CAUSE — not the closest file to patch
3. Fix the source — not the consumer
4. Verify the fix compiles AND passes `/gate`

## Root Cause Gate (MANDATORY)

Before writing ANY fix, answer these questions:

### Is this fix a bandaid?

A fix is a BANDAID if it:
- Restores a deleted file to satisfy imports
- Adds a re-export barrel to make old paths work
- Makes a schema field optional because consumers don't provide it
- Adds a type alias to map old names to new ones
- Wraps a value in `as any` or `as unknown` to silence a type error
- Creates a "compatibility" or "bridge" or "adapter" file
- Adds a default value to avoid fixing callers

**If the fix is a bandaid → STOP. Do not apply it.**

Instead:
1. Identify what SHOULD be true (the SSOT, the correct import path, the proper type)
2. Fix the CONSUMERS to use the correct source
3. If the correct source doesn't exist yet → that's the real fix: create it properly

### Is the error in the right place?

Sometimes the error appears in File A but the problem is in File B:
- Import error in consumer → the SSOT moved, redirect the import
- Type mismatch in component → the recipe schema changed, update the component
- Missing field in data → the schema was tightened, fix the data

**Fix where the problem IS, not where the error APPEARS.**

## Protocol

### 1. Read Before Fixing (MANDATORY)

Read EVERY file involved:
- The file showing the error
- The file it imports from
- The SSOT for the types involved
- Any barrel files in the import chain

### 2. Classify the Fix

| Classification | Action |
|---|---|
| Consumer uses wrong import path | Redirect import to SSOT |
| Consumer provides wrong data shape | Fix the data to match schema |
| Schema is wrong (confirmed with owner) | Fix schema, then fix all consumers |
| File should not exist (duplicate) | Invoke `/consolidate` |
| Unclear root cause | Invoke `/parkinglot` — do NOT guess |

### 3. Apply Root Cause Fix

Create todo list:
```
[ ] Root cause: {what's actually wrong}
[ ] Fix: {what to change and WHERE}
[ ] Verify: compile check
[ ] Gate: /gate check
```

### 4. Verify

After EACH fix:
```bash
cd interfaces/desktop && npx svelte-check --threshold error 2>&1 | tail -20
```

If new errors appear from your fix:
- They are CONSUMERS of the thing you fixed
- Fix the consumers too — do NOT revert your fix
- This is the cascade. Embrace it. Fix forward.

### 5. Store Correction in SurrealDB

After fixing, persist what was wrong and how it was fixed:

```bash
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: user" -H "DB: profile" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "CREATE corrections SET
    issue = '{what was wrong}',
    root_cause = '{actual root cause}',
    fix = '{what was changed}',
    files = ['{file1}', '{file2}'],
    created_at = time::now();"
```

If the correction reveals a pattern that should be avoided in future:
```bash
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "CREATE shared_learnings SET
    content = '{what to avoid and why}',
    severity = 'major',
    category = 'correction',
    created_at = time::now();"
```

If SurrealDB is not running, skip — but note the correction in the sprint doc.

### 6. Gate Check

After all corrections are complete, run `/gate` checks mentally:
- Did I create any new duplicate definitions? → NO
- Did I add any re-export barrels? → NO
- Did I make anything optional to avoid fixing callers? → NO
- Did I use `as any` anywhere? → NO

## Never

- Never restore a deleted file to fix an import error
- Never make a required field optional to fix a validation error
- Never add a re-export to make an old import path work
- Never use `as any` or `as unknown` to silence type errors
- Never fix more than the root cause (no drive-by refactors)
- Never skip reading the file before editing
- Never skip the compile verification
- Never guess when the root cause is unclear — ask
