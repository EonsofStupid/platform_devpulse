---
name: preflight
description: Mandatory orientation before any work. Loads context, reads SSOTs, verifies disk state, scans for duplicates, declares unknowns.
user-invocable: true
disable-model-invocation: false
argument-hint: "[optional: specific area to focus preflight on]"
---

# /preflight — Mandatory AI Orientation

Run this BEFORE starting any task. No exceptions.

## Step 1: Check SurrealDB and Load Memory

```bash
# Test connectivity
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --hide-welcome --json <<< "INFO FOR ROOT;"
```

If SurrealDB is up, load context in priority order:

```bash
# Developer identity
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace global --database knowledge --hide-welcome --json <<< "SELECT * FROM dev_profile ORDER BY category;"

# Rejections (NEVER suggest these)
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace global --database knowledge --hide-welcome --json <<< "SELECT * FROM rejections;"

# Critical learnings (mistakes to NEVER repeat)
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace global --database knowledge --hide-welcome --json <<< "SELECT * FROM learnings WHERE severity = 'critical';"

# Active context
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace projects --database devpulse --hide-welcome --json <<< "SELECT * FROM context ORDER BY priority DESC LIMIT 10;"

# Architecture rules
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace projects --database devpulse --hide-welcome --json <<< "SELECT layer, rule, description FROM architecture;"

# Active decisions
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace projects --database devpulse --hide-welcome --json <<< "SELECT title, decision FROM decisions ORDER BY created_at DESC LIMIT 10;"

# Pending tasks
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace projects --database devpulse --hide-welcome --json <<< "SELECT * FROM tasks WHERE status IN ['pending', 'in_progress'] ORDER BY priority DESC;"

# Preferences
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace global --database knowledge --hide-welcome --json <<< "SELECT * FROM preferences;"
```

If SurrealDB is NOT running, say so and proceed with file-based context.

## Step 2: Read Source of Truth

Read these files in order:
1. `CLAUDE.md` (project root instructions)
2. `scripts/surrealdb/ARCHITECTURE.md` (database architecture)
3. Whatever sprint doc is referenced in the active context
4. `interfaces/desktop/src/lib/design/MASTER-PLAN.md` (ColdLight architecture)
5. `interfaces/desktop/src/lib/design/coldlight.config.ts` (ColdLight config)

## Step 3: Verify Disk State

```bash
git status
git branch --show-current
git log --oneline -5
```

Check that directories you plan to work in actually exist.
**READ files you plan to modify — do not assume their contents from docs.**

## Step 4: Quick Duplicate Scan

Before any work, check for the most common anti-pattern — competing definitions:

```
Grep for known SSOT types across the design system:
- SizeToken, RadiusToken → should only be in recipes/_base/schema.ts
- Preset, EncodingIndices → should only be in registry/token-categories.ts
- DsSurfaceProps, RecipeDefinition → should only be in recipes/_base/schema.ts
- SurfaceId, GlowId, BevelId → should only be in registry/token-categories.ts
```

If duplicates found → flag them immediately. They must be consolidated
(via `/consolidate`) before any sprint work begins.

Also check for stale patterns:
```
Grep for: "tokens/types.js", "tokens/schema.js", "tokens/index.js"
```
These files were deleted. Any import referencing them is broken.

## Step 5: Report

Output a structured summary:

```
## Preflight Complete

### Developer Profile
- [loaded or not available]

### Rejections (DO NOT SUGGEST)
- [list]

### Critical Learnings
- [list]

### Active Context
- Branch: X
- Sprint: Y
- Active tasks: Z

### Architecture Rules
- [list]

### Duplicate Scan
- [CLEAN or list of duplicates found]

### Stale Imports
- [CLEAN or list of broken imports]

### What I Know
- [list]

### What I DON'T Know
- [list]

### Ready to proceed: YES/NO
- If NO: {what needs to be fixed first — consolidation, stale imports, etc.}
```

Do NOT proceed until reporting is done and the developer confirms.

## Never

- Never skip the duplicate scan
- Never assume files exist — verify
- Never assume docs describe reality — read the actual code
- Never proceed with "ready: NO" without fixing the blockers
