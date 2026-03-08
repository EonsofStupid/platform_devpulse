---
name: preflight
description: Mandatory orientation before any work. Loads context from SurrealDB, reads source-of-truth docs, verifies disk state, declares unknowns.
allowed-tools: [Bash, Read, Glob, Grep]
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
# Developer identity (WHO am I working with)
surreal sql --endpoint http://127.0.0.1:8822 --username root --password root --namespace global --database knowledge --hide-welcome --json <<< "SELECT * FROM dev_profile ORDER BY category;"

# Rejections (what NOT to suggest — EVER)
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

If SurrealDB is NOT running, say so and ask if the developer wants to start it.

## Step 2: Read Source of Truth

Read these files in order:
1. `CLAUDE.md`
2. `scripts/surrealdb/ARCHITECTURE.md`
3. Whatever sprint doc is referenced in the active context
4. `interfaces/desktop/src/lib/design/MASTER-PLAN.md`
5. `interfaces/desktop/src/lib/design/coldlight.config.ts`

## Step 3: Verify Disk State

```bash
git status
git branch --show-current
git log --oneline -5
```

Check that directories you plan to work in actually exist.

## Step 4: Report

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

### What I Know
- [list]

### What I DON'T Know
- [list]

### Ready to proceed: YES/NO
```

Do NOT proceed until reporting is done and the developer confirms.
