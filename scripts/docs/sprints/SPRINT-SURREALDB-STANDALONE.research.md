# Research: SurrealDB v3 Standalone Setup — Full Vision

**Date**: 2026-02-19
**Sprint**: SPRINT-SURREALDB-STANDALONE
**Status**: COMPLETE — ready for execution

---

## The Vision (Owner's Intent)

**DevPulse is a 1% dev tool.** Not another cloud AI wrapper. A portable, local-first
AI dev OS that no one publicly discusses at this level:

- You OWN your AI stack. No vendor lock-in. No data leaving your machine.
- Persistent memory across EVERY tool — Claude, Cursor, Copilot, custom agents.
- SurrealDB is the brain. It remembers everything so AI doesn't have to re-learn
  your architecture every session.
- VS Code extension surfaces the whole stack visually — start/stop SurrealDB,
  inspect memory, fire off seeds, manage namespaces.
- Portable — clone the repo on any machine, run start-surreal.cmd, seed-all.cmd,
  done. Full context restored in seconds.

**This is the thing the 1% do that no one talks about.**
They don't use ChatGPT. They build private AI infrastructure that compounds.

---

## Current State Audit (2026-02-19)

### SurrealDB Process
- **Running**: YES — PID 100044
- **Path**: `d:\localdev\platform_devpulse\data\devpulse.db` (RocksDB)
- **Backend**: `rocksdb:` (NOT the canonical `surrealkv://`)
- **Started by**: `start-surrealdb.cmd` (project root — the OLD launcher)
- **Status**: Process was killed by user. Needs restart.

### Data Directory
- `data/devpulse.db/` exists at project root
- Created today (Feb 19). Contains session data from this session.
- **The v2.6 data is gone.** Lost in a previous session (destructive action by AI).
- The 6 schema/seed files have NOT been applied to this instance yet.

### Canonical Path (per ARCHITECTURE.md)
- `D:\localdev\deps\surrealdb\data` — **does NOT exist**
- `start-surreal.cmd` (scripts/surrealdb/) references this non-existent path
- `start-surrealdb.cmd` (project root) uses `data/devpulse.db` — different path

### MCP Configuration (.mcp.json)
- **WRONG**: Currently points to `banter/sessions` namespace — stale from old Banter project
- **WRONG**: Uses `uvx surreal-mcp` — this is a 3rd party PyPI package, NOT official
- **CORRECT**: Should use official `surrealmcp` (Docker or binary from `surrealdb/surrealmcp`)
- **CORRECT**: Should point to `projects/devpulse` namespace

### Hooks
- `~/.claude/hooks/` does NOT exist
- No session-start hook, no file-write hook
- This is WHY context is lost every session

### VS Code Extensions (available)
- **DBCode** — full GUI: connect, browse namespaces/tables, run SurrealQL queries
  - `https://dbcode.io/docs/supported-databases/surrealdb`
- **SurrealQL** (official) — syntax highlighting for `.surql` files
  - `https://marketplace.visualstudio.com/items?itemName=surrealdb.surrealql`

---

## Key Research Findings

### 1. SurrealDB 3.0 is DESIGNED for this use case

SurrealDB 3.0 (released Feb 17, 2026, raised $23M) is explicitly positioned as
"persistent memory engine for AI agents." The features map directly to this vision:

- **First-class agent memory** — context graphs inside the DB
- **DEFINE API** — custom HTTP endpoints defined in SurrealQL (your provisioning API)
- **Surrealism** — WASM plugin ecosystem (run logic inside the DB)
- **Record References** — bidirectional schema-level links (graph traversal for memory)
- **File Storage** — direct file integration (attach code files to sessions)
- **Client-Side Transactions** — ACID from application code

This is not a coincidence. SurrealDB IS the right choice for this stack.

### 2. Official SurrealMCP replaces uvx surreal-mcp

The official MCP server is `github.com/surrealdb/surrealmcp`.
- Supports stdio (recommended for local), HTTP, Unix sockets
- Bearer token auth for cloud
- Environment variables: `SURREALDB_URL`, `SURREALDB_NS`, `SURREALDB_DB`,
  `SURREALDB_USER`, `SURREALDB_PASS`
- Available as Docker image or Cargo binary

The `uvx surreal-mcp` in the current `.mcp.json` is a 3rd party package —
it should be replaced with official `surrealmcp`.

**Docker is the recommended approach** (no local binary needed, always latest):
```json
{
  "mcpServers": {
    "surrealdb": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--pull", "always",
               "surrealdb/surrealmcp:latest", "start"],
      "env": {
        "SURREALDB_URL": "ws://host.docker.internal:8000/rpc",
        "SURREALDB_NS": "projects",
        "SURREALDB_DB": "devpulse",
        "SURREALDB_USER": "root",
        "SURREALDB_PASS": "root"
      }
    }
  }
}
```

**If Docker is not available**, use the surrealmcp binary directly:
```json
{
  "mcpServers": {
    "surrealdb": {
      "command": "surrealmcp",
      "args": ["start"],
      "env": {
        "SURREALDB_URL": "ws://localhost:8000/rpc",
        "SURREALDB_NS": "projects",
        "SURREALDB_DB": "devpulse",
        "SURREALDB_USER": "root",
        "SURREALDB_PASS": "root"
      }
    }
  }
}
```

### 3. Storage Path — Decision Required

**Problem**: Two launchers, two paths, one backend (rocksdb). Neither is canonical.

| Launcher | Path | Backend |
|----------|------|---------|
| `start-surrealdb.cmd` (root) | `data/devpulse.db` (relative) | rocksdb |
| `start-surreal.cmd` (scripts/) | `D:\localdev\deps\surrealdb\data` (absent) | surrealkv |

**Architecture says**: `surrealkv://D:/localdev/deps/surrealdb/data`

**Recommendation**: Consolidate to `D:\localdev\.surrealdb\data` with `surrealkv://`.

Rationale:
- `surrealkv` is SurrealDB 3.0's native storage — better performance, designed for v3
- Path outside the git repo avoids accidental commits of DB files
- Single canonical location both launchers point to
- `D:\localdev\.surrealdb\` matches the pattern from session history

**What this means**: The current `data/devpulse.db` (rocksdb) will be abandoned.
Since schemas haven't been seeded yet, there's no meaningful data to migrate.
The session chat data in the log will be re-seeded from `history.txt` after Phase 1.

### 4. Elite Dev Workflow Pattern (2026)

What the 1% actually do:
```
Session Start
  └─> Hook fires on-session-start.js
      └─> Queries SurrealDB: context + learnings + active sprint
          └─> Claude sees: "Active sprint: SURREALDB-STANDALONE.
                           Current blockers: MCP not connected.
                           Critical learnings: [list]"
              └─> Claude KNOWS what you're working on WITHOUT you explaining it

During Session
  └─> Every file write: hook fires on-file-write.js
      └─> Logs to files_touched: path, action, session_id
          └─> End of session: full audit trail of what changed

Commit
  └─> /banter commit logs to projects/devpulse/commits
      └─> Type, scope, message, files, session_id — all recorded

Next Session (even weeks later)
  └─> Hook fires, Claude reads the DB, knows EXACTLY where you left off
```

This is context compounding. Most devs explain their project to AI 10 times a day.
You explain it zero times.

---

## Execution Plan (Updated)

### Phase 0: Path Decision and Cleanup (5 min)

**Task 0.1** — Kill any running SurrealDB process (already done by user)

**Task 0.2** — Create canonical data directory:
```bash
mkdir -p D:\localdev\.surrealdb\data
```

**Task 0.3** — Update BOTH launchers to use canonical path + surrealkv backend

**Task 0.4** — Add `data/` to `.gitignore` if not already there

### Phase 1: Start + Seed (10 min)

**Task 1.1** — Start SurrealDB using updated `start-surreal.cmd`

**Task 1.2** — Run seed-all.cmd:
```
[1/6] schema-global.surql     → NS: global    / DB: knowledge
[2/6] schema-projects.surql   → NS: projects  / DB: devpulse
[3/6] schema-agents.surql     → NS: agents    / DB: claude
[4/6] schema-access.surql     → NS: global    / DB: knowledge (users)
[5/6] seed-global.surql       → preferences, learnings, patterns
[6/6] seed-devpulse.surql     → architecture rules, context, conventions
```

**Task 1.3** — Verify via surreal sql:
```sql
USE NS global DB knowledge;
SELECT * FROM learnings WHERE severity = 'critical';

USE NS projects DB devpulse;
SELECT * FROM context ORDER BY priority DESC;
SELECT count() FROM architecture GROUP ALL;
```

**CHECKPOINT**: All 3 namespaces created, data verified. STOP.

### Phase 2: MCP Connection (10 min)

**Task 2.1** — Check if Docker is available. If yes → Docker config. If no → install surrealmcp binary.

**Task 2.2** — Update `.mcp.json`:
- Replace `surrealdb-banter` key with `surrealdb`
- Replace `uvx surreal-mcp` with official surrealmcp
- Update namespace to `projects`, database to `devpulse`
- Keep context7 as-is

**Task 2.3** — Restart Claude Code

**Task 2.4** — Test: Claude should be able to query SurrealDB via MCP tools

**CHECKPOINT**: Claude reads `context`, `learnings`, `architecture`. STOP.

### Phase 3: Hooks (20 min)

**Task 3.1** — Create `~/.claude/hooks/` directory

**Task 3.2** — Write `on-session-start.js`:
- Connects to SurrealDB (ws://localhost:8000)
- Queries: global/knowledge (preferences, critical learnings)
- Queries: projects/devpulse (context ORDER BY priority, active tasks)
- Queries: agents/claude (last 3 sessions summary)
- Outputs structured markdown to stdout (inject: system)
- Graceful fallback if SurrealDB not running

**Task 3.3** — Write `on-file-write.js`:
- Triggered on Write/Edit tool calls
- Reads file_path and action from hook env
- Inserts into agents/claude/files_touched
- Silent (no output)

**Task 3.4** — Register both hooks in `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [...],
    "PostToolUse": [on-file-write],
    "session-start": [on-session-start],
    "post-compact": [on-session-start]
  }
}
```

**Task 3.5** — Test: start new session → see context block at top

**CHECKPOINT**: Hooks working. Context auto-loads. Files tracked.

### Phase 4: VS Code Integration

**Task 4.1** — Install DBCode extension (full GUI for SurrealDB)
- One-click install: `dbcode.io`
- Connect to localhost:8000 with root/root
- Browse all 3 namespaces visually

**Task 4.2** — Install official SurrealQL extension for syntax highlighting

**Task 4.3** — Verify `.surql` files get proper highlighting in VS Code

### Phase 5: Banter Commit Skill + Archive (deferred)

Track in backlog. Not blocking.

---

## Files To Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `scripts/surrealdb/start-surreal.cmd` | MODIFY | Update path to `D:\localdev\.surrealdb\data` |
| `start-surrealdb.cmd` (root) | MODIFY | Same — point to canonical path |
| `.mcp.json` | MODIFY | Official surrealmcp, correct namespace |
| `~/.claude/hooks/on-session-start.js` | CREATE | Context restore hook |
| `~/.claude/hooks/on-file-write.js` | CREATE | File tracking hook |
| `~/.claude/settings.json` | MODIFY | Register hooks |
| `.gitignore` | VERIFY | `data/` must be excluded |

---

## Blockers / Decisions Needed

1. **Docker available?** — Determines MCP install method.
   Run `docker --version` to check.

2. **Confirm canonical path**: `D:\localdev\.surrealdb\data` — confirm this is acceptable
   vs keeping `data/devpulse.db` in project root.

3. **session-start hook output format** — inject: system vs inject: user vs file.
   Need to verify Claude Code hook documentation for correct format.

---

## ADRs — Architecture Decision Records

### ADR-001: Record References over string IDs

**Decision**: All inter-table links use `TYPE record<table>` not `TYPE string`.

**Why**: SurrealDB 3.0 Record References are typed, traversable graph edges.
`decisions.superseded_by: record<decisions>` enables:
```sql
SELECT ->superseded_by->decisions.title FROM decisions WHERE id = $id
```
String IDs require app-side joins. Record References are DB-native graph traversal.
Zero app code for relationship queries. Decision genealogy, session-to-chat linkage,
raw_chat-to-decision promotion chains — all traversable in one query.

**Rejected**: String foreign keys — no type safety, no graph traversal, app-side joins only.

---

### ADR-002: Computed Fields (VALUE) over app-side assembly

**Decision**: `full_text`, `duration_s`, `updated_at` use `DEFINE FIELD ... VALUE ...` not `DEFAULT`.

**Why**: `VALUE` recalculates on every write. `DEFAULT` only sets on creation.
- `updated_at VALUE time::now()` is always accurate. `DEFAULT` would freeze at creation time.
- `full_text VALUE title + ': ' + body + ...` means the DB assembles context — not app code.
- Embeddings get generated against `full_text`, which the DB always keeps current.
- `duration_s VALUE IF ended_at { ... }` — no app code needed to calculate session length.

**Rejected**: App-side assembly — every write path must manually update derived fields. Error-prone.

---

### ADR-003: Vector Search (MTREE) on all semantic tables

**Decision**: `embedding` field + `MTREE DIMENSION 1536 DIST COSINE` on learnings, patterns, decisions, architecture.

**Why**: Session-start hook retrieves relevant context by semantic similarity.
```sql
SELECT * FROM learnings WHERE embedding <|5|> $task_embedding ORDER BY score DESC
```
Returns the 5 most relevant learnings for the current task — not all learnings.
This is context compounding in practice: retrieve what matters, not everything.

**Rejected**: Full-table SELECT with keyword filtering — noisy, no relevance ranking, scales badly.

---

### ADR-004: DEFINE API baked into DB schema

**Decision**: Provisioning and context endpoints defined in SurrealQL, not in app code.

**Why**: The DB IS the API layer for agent memory. No middleware.
- `GET /api/projects/devpulse/context` → full session-start payload in one request.
- `POST /api/agents/claude/session/start` → creates session inside DB directly.
- `POST /api/projects/devpulse/provision/project/:name` → provisions new project DB.
Agents talk directly to SurrealDB HTTP. No Node.js proxy needed for these operations.

**Rejected**: App-layer REST API — adds a process, adds latency, adds a failure point.

---

### ADR-005: raw_chat ≠ decisions — enforced at DB schema level

**Decision**: Two separate tables. `source` assertion on raw_chat. `status` assertion on decisions.

**Why**: raw_chat is an append-only audit log — immutable after creation.
decisions are curated truth — editable, promotable, supersedable.
`promoted_from: record<raw_chat>` preserves lineage without merging the data.
ASSERT in DEFINE FIELD enforces valid enum values at DB level — no app validation needed.
The separation is non-negotiable and now enforced structurally, not just by convention.

**Rejected**: Single chat+decisions table — conflates verbatim record with curated truth.

---

## Sources

- [SurrealDB 3.0 Launch](https://surrealdb.com/3.0)
- [SurrealDB raises $23M](https://techstartups.com/2026/02/17/surrealdb-raises-23m-to-fix-ai-agents-memory-launches-surrealdb-3-0-as-persistent-memory-engine/)
- [SurrealMCP Official](https://surrealdb.com/blog/introducing-surrealmcp)
- [surrealmcp GitHub](https://github.com/surrealdb/surrealmcp)
- [DBCode SurrealDB](https://dbcode.io/docs/supported-databases/surrealdb)
- [mcp-memory-service](https://github.com/doobidoo/mcp-memory-service)
