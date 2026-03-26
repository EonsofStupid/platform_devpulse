---
name: preflight
description: Mandatory orientation before any work. Loads context from SurrealDB for the ACTIVE project, reads SSOTs, verifies disk state, scans for duplicates, declares unknowns.
user-invocable: true
disable-model-invocation: false
argument-hint: "[optional: specific area to focus preflight on]"
---

# /preflight — Mandatory AI Orientation

Run this BEFORE starting any task. No exceptions.

## Step 0: Detect Active Project

Determine the active project from the current working directory:
- If CWD contains `platform_devpulse` → project = `devpulse`
- If CWD contains another known project → use that project ID
- If unknown → ASK the developer which project this is

The project ID determines which SurrealDB namespace to query for project-specific context.

## Step 1: Check SurrealDB and Load Memory

```bash
# Test connectivity — DevPulse embeds SurrealKV, exposed via axum on :8822
# Auth: Basic Auth with engine credentials
curl -s http://127.0.0.1:8822/health
```

Expected: `{"status":"healthy","engine":"surrealkv"}`
If connection refused: app is not running. Say so and proceed with file-based context.

**IMPORTANT:**
- Do NOT use `surreal sql` CLI — `/rpc` WebSocket is not exposed
- Do NOT use `root:root` — credentials are `devpulse_engine:dp_sys_2026!`
- Use `curl` ONLY

### Query pattern

```bash
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" \
  -H "NS: {namespace}" \
  -H "DB: {database}" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "{SURREALQL}"
```

### Available namespaces

| Namespace | Database | Purpose | Tables |
|-----------|----------|---------|--------|
| `global` | `knowledge` | Cross-project shared knowledge | dev_profile, rejections, shared_learnings, patterns, technologies, tech_relates, kv, promotion_signals |
| `system` | `engine` | Kernel internals, reasoning state | nodes, relates, states, transitions, rumination_state, costar_prompts, agent_outputs, kv |
| `user` | `profile` | User memory, corrections | concepts, corrections, memories, relates_to, remembers, kv |
| `project` | `{project_id}` | Per-project context (created on demand) | context, tasks, architecture, decisions (when seeded) |

### Priority load order

Run ALL of these. Report which returned data and which were empty.

```bash
# 1. Developer identity (WHO am I working with)
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM dev_profile ORDER BY category;"

# 2. Rejections (NEVER suggest these — hard stop)
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM rejections;"

# 3. Learnings (mistakes to NEVER repeat)
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM shared_learnings;"

# 4. Patterns (best practices)
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM patterns;"

# 5. Technologies & relationships
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM technologies; SELECT * FROM tech_relates;"

# 6. User memories & corrections (personal context)
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: user" -H "DB: profile" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM memories; SELECT * FROM corrections;"

# 7. System reasoning state (what the engine is thinking)
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: system" -H "DB: engine" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "SELECT * FROM rumination_state; SELECT * FROM nodes LIMIT 20;"
```

### Project-specific context (if namespace exists)

```bash
# 8. Project context — replace {project_id} with detected project
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: project" -H "DB: {project_id}" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "INFO FOR DB;"
```

If this returns tables, query them. If it errors (namespace doesn't exist yet), note it and move on.

**NOTE:** Tables may be empty if not yet seeded. Empty `[]` is valid — report it, don't fail on it.

## Step 2: Read Source of Truth

Read these files in order (paths relative to project root):
1. `CLAUDE.md` (project root instructions)
2. `ADR.md` if it exists (architecture decisions — AUTHORITATIVE)
3. Whatever sprint doc is referenced in the active context or memory
4. Project-specific SSOT docs (varies by project)

For DevPulse specifically also read:
- `interfaces/desktop/src/lib/design/MASTER-PLAN.md` (ColdLight architecture)
- `systems/devpulse-engine/platform.default.toml` (service configuration)

## Step 3: Verify Disk State

```bash
git status
git branch --show-current
git log --oneline -5
```

Check that directories you plan to work in actually exist.
**READ files you plan to modify — do not assume their contents from docs.**

## Step 4: Quick Duplicate Scan

Before any work, check for the most common anti-pattern — competing definitions.

Scan for stale directories/imports that should not exist:
```
- design/css/ — DELETED
- design/style/ — DELETED (styles/ is correct)
- registry/ — DELETED
- recipes/ — DELETED
- Any import referencing "design/style/index.js" (should be "design/styles/index.js")
```

Scan for SSOT violations:
```
- Multiple CSS files defining the same --var
- Hardcoded oklch values outside of SD5 output or aliases.css
- Component files importing from deleted paths
```

If duplicates found → flag them immediately. They must be consolidated
(via `/consolidate`) before any sprint work begins.

## Step 5: Report

Output a structured summary:

```
## Preflight Complete

### Active Project
- Project: {detected project ID}
- CWD: {working directory}

### SurrealDB Status
- Connection: [UP/DOWN]
- Tables with data: [list]
- Tables empty: [list]
- Project namespace: [exists/not created yet]

### Developer Profile
- [loaded or "empty — needs seeding"]

### Rejections (DO NOT SUGGEST)
- [list or "none seeded"]

### Critical Learnings
- [list or "none seeded"]

### Active Context
- Branch: X
- Sprint: Y
- Active tasks: Z

### Architecture Rules (from ADR + SurrealDB)
- [list key locked decisions]

### Duplicate Scan
- [CLEAN or list of duplicates found]

### Stale Imports
- [CLEAN or list of broken imports]

### What I Know
- [list]

### What I DON'T Know
- [list]

### Ready to proceed: YES/NO
- If NO: {what needs to be fixed first}
```

Do NOT proceed until reporting is done and the developer confirms.

## Step 6: Write Back (during and after work)

When you learn something during a session that should persist:

```bash
# Store a learning
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "CREATE shared_learnings SET
    content = 'description of what was learned',
    severity = 'critical',
    category = 'architecture',
    created_at = time::now();"

# Store a rejection
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "CREATE rejections SET
    what = 'thing that was rejected',
    reason = 'why it was rejected',
    created_at = time::now();"

# Store a pattern
curl -s -X POST http://127.0.0.1:8822/sql \
  -H "Accept: application/json" -H "NS: global" -H "DB: knowledge" \
  -H "Authorization: Basic $(echo -n 'devpulse_engine:dp_sys_2026!' | base64)" \
  -d "CREATE patterns SET
    name = 'pattern name',
    description = 'what this pattern is',
    example = 'code or usage example',
    created_at = time::now();"
```

**Rule:** If the developer explicitly rejects something, store it in `rejections` immediately.
If a critical mistake is discovered, store it in `shared_learnings` immediately.
Do not wait until end of session.

## Never

- Never skip the duplicate scan
- Never assume files exist — verify
- Never assume docs describe reality — read the actual code
- Never proceed with "ready: NO" without fixing the blockers
- Never use `surreal sql` CLI — use `curl` to the HTTP API
- Never use `root:root` credentials — use `devpulse_engine:dp_sys_2026!`
- Never hardcode a project ID — detect from CWD or ask
- Never skip writing rejections/learnings back to SurrealDB when they happen
