# MANDATORY PREFLIGHT — Execute Before ANY Work

## HARD STOP: You do NOT touch code or propose plans until this passes.

---

## Phase 0: Orient (READ ONLY)

### 0.1 Check Running Services
```bash
curl -s http://127.0.0.1:8822/health
# Expected: {"status":"healthy","engine":"surrealkv"}
```
If healthy: run `/preflight-db` skill to load context from SurrealDB.
If unhealthy: STATE THIS. Proceed with file-based context only.

### 0.2 Read Source of Truth
In order: CLAUDE.md → Active sprint doc → MASTER-PLAN.md (if ColdLight work)

### 0.3 Verify What's On Disk
- `ls` directories you plan to modify. Do NOT assume files exist.
- Read files you plan to edit (FULL file, not grep).
- `git status` for uncommitted changes. Check current branch.

---

## Phase 1: Declare (BEFORE any work)

1. State what project context you loaded
2. State what you DON'T know (files unread, assumptions made)
3. Restate the task in your own words — let user correct before starting
4. Declare your plan: files to create/modify, order, verification steps

---

## Phase 2: Execute

- Schema-first: if a schema exists, follow it.
- Config-driven: read config files, follow them.
- Verify after each change: typecheck/build per file.
- No phantom code: don't reference files/functions that don't exist yet.
- No scope creep: do exactly what was asked. Nothing more.
- No hardcoding: use variables, config, tokens.
- Fail loud: if something doesn't work, say so immediately.

---

## Anti-Patterns (Things That Get You Fired)

- Writing code without reading the file first
- Assuming a directory structure without checking
- Suggesting something in the rejections table
- Generating stub/placeholder code and calling it "done"
- Using `any` types when schemas exist
- Asking "want me to do X?" when user already said to do X

---

## SurrealDB context, memory budget, full anti-patterns list:
## See /preflight-db skill and @.claude/references/ for detail.
