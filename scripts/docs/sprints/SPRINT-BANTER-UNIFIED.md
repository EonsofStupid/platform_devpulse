# SPRINT: Banter Unified — Persistent AI Memory System

**Date**: 2026-03-07
**Status**: PLAN — awaiting owner approval
**Priority**: P0 — unblocks every session going forward
**Depends on**: SurrealDB 3.0.2 standalone running on port 8822 (DONE)

---

## Problem Statement

Banter was a working system for over a year. A previous AI session destroyed the data and deleted the schema/seed files without migrating. The files have been recovered from git (`57d9775`, `1dcb7e0`). The current 3-namespace architecture (`global/knowledge`, `projects/devpulse`, `agents/claude`) is the evolution of Banter's single `banter/sessions` namespace. The schemas are seeded and live on port 8822. But the hooks don't work because they were never updated to match the evolved schema — specifically, the `agents/claude` tables require `session: record<sessions>` (a typed record link, not a string), and the hooks don't create sessions before writing.

## What This Sprint Delivers

After this sprint:
1. **SessionStart hook** creates/finds an active session, restores full context from all 3 namespaces
2. **UserPromptSubmit hook** saves every user message to `agents/claude/chat` with proper session record link
3. **PreCompact hook** saves state snapshot before context is lost
4. **SessionEnd hook** closes the active session with a summary
5. **PostToolUse hook** tracks file operations to `agents/claude/files_touched` with proper session record link
6. **`/banter commit` skill** saves conventional commits to `projects/devpulse/commits`
7. **`banter-archive.js`** restored and updated for port 8822
8. **VS Code tasks.json** cleaned up — no dead references
9. **All recovered Banter files** properly archived or merged into the established structure

---

## Architecture (How It Actually Works)

### The Flow

```
Claude Code Session Start
  |
  +--> SessionStart hook fires (matcher: startup|resume|clear)
  |      |
  |      +--> surreal sql: find or create active session in agents/claude
  |      |    returns session record ID (e.g. sessions:abc123)
  |      |
  |      +--> surreal sql: query global/knowledge (preferences, critical learnings)
  |      +--> surreal sql: query projects/devpulse (context, pending tasks, arch rules)
  |      +--> surreal sql: query agents/claude (recent sessions, blockers)
  |      |
  |      +--> stdout: structured markdown context --> Claude sees it
  |
  +--> PostCompact hook fires (matcher: compact)
  |      same as SessionStart (re-queries everything, finds active session)
  |
  +--> During session:
  |      |
  |      +--> UserPromptSubmit hook (async, non-blocking)
  |      |    reads session_id from env file, links chat record to session
  |      |
  |      +--> PostToolUse hook (async, matcher: Write|Edit)
  |           logs to files_touched with session record link
  |
  +--> PreCompact hook fires
  |      saves timestamp + trigger to projects/devpulse/context
  |
  +--> SessionEnd hook fires
         closes session: UPDATE sessions SET ended_at, summary
```

### Session Lifecycle (Critical Design)

The `agents/claude` schema enforces `session: TYPE record<sessions>` on `chat`, `files_touched`, and `blockers`. This is correct — it ensures every record is linked to a real session. The hooks must respect this:

1. **SessionStart** creates a session via `CREATE sessions SET session_id = rand::uuid(), project = $cwd, started_at = time::now()` and writes the record ID to `CLAUDE_ENV_FILE` so subsequent hooks can read it
2. **UserPromptSubmit** reads the session record ID from the env file, uses it as `session: sessions:$id` in INSERT
3. **PostToolUse** same pattern — reads session record ID, links file operations
4. **SessionEnd** closes the session with `UPDATE sessions SET ended_at = time::now()`

The `CLAUDE_ENV_FILE` env var (documented in Claude Code hooks reference) persists environment variables across hook invocations within a session. This is how the session record ID flows from SessionStart to all subsequent hooks without global state.

### Namespace Map

| Namespace | Database | Tables | Hook Access |
|-----------|----------|--------|-------------|
| `global` | `knowledge` | preferences, patterns, decisions, learnings | READ on SessionStart |
| `projects` | `devpulse` | architecture, patterns, context, decisions, tasks, file_conventions, commits, lesson_progress, lesson_replays | READ on SessionStart, WRITE for /banter commit |
| `agents` | `claude` | sessions, chat, files_touched, blockers | READ/WRITE on all hooks |

### What Banter Was vs What It Is Now

| Banter (old) | Unified (now) | Notes |
|---|---|---|
| Single NS: `banter/sessions` | 3 NS: `global`, `projects`, `agents` | Data split by access pattern |
| Plain `session_id: string` | `session: record<sessions>` | Typed graph edge, traversable |
| No vector indexes | HNSW on learnings, patterns, decisions, architecture | Semantic retrieval ready |
| No computed fields | `duration_s`, `full_text`, `updated_at` computed | DB does the work, not app |
| No DEFINE API | 6 API endpoints baked into DB | `/session/start`, `/session/current`, `/session/end`, `/context`, `/provision/*` |
| Port 8000 | Port 8822 | Patched surrealkv for Windows |

---

## Phase 1: Fix the Hooks (Core Loop)

### Task 1.1: Rewrite `restore-memory.js` (SessionStart + PostCompact)

**File**: `.claude/hooks/restore-memory.js`
**Trigger**: SessionStart (matchers: startup, resume, clear, compact)

Must:
- [x] Connect to SurrealDB on port 8822
- [x] Query all 3 namespaces for context
- [ ] Find active session (`SELECT * FROM sessions WHERE ended_at = NONE ORDER BY started_at DESC LIMIT 1`)
- [ ] If no active session: CREATE one, capture the record ID
- [ ] Write `SURREAL_SESSION_ID=sessions:xxxx` to `CLAUDE_ENV_FILE` (from hook stdin JSON)
- [ ] Write `SURREAL_SESSION_SID=<session_id string>` for display
- [ ] Output structured markdown to stdout (context, learnings, tasks, blockers, preferences)
- [ ] Graceful fallback if SurrealDB not running (exit 0, print warning)

### Task 1.2: Rewrite `save-chat.js` (UserPromptSubmit)

**File**: `.claude/hooks/save-chat.js`
**Trigger**: UserPromptSubmit (async)

Must:
- [ ] Read `CLAUDE_ENV_FILE` path from stdin JSON
- [ ] Source `SURREAL_SESSION_ID` from that file
- [ ] INSERT into `agents/claude/chat` with `session: <record ID>`, not just `session_id: string`
- [ ] UPSERT session `message_count += 1`
- [ ] Strip IDE selection noise
- [ ] Cap at 2000 chars
- [ ] Silent fail (async, non-blocking)

### Task 1.3: Rewrite `save-state.js` (PreCompact)

**File**: `.claude/hooks/save-state.js`
**Trigger**: PreCompact

Must:
- [ ] UPSERT `context:last_compact` in `projects/devpulse`
- [ ] Record compact trigger if available
- [ ] Silent on success

### Task 1.4: Create `session-end.js` (SessionEnd)

**File**: `.claude/hooks/session-end.js`
**Trigger**: SessionEnd

Must:
- [ ] Read `SURREAL_SESSION_ID` from env file
- [ ] UPDATE sessions SET `ended_at = time::now()`
- [ ] No summary (can't get it from SessionEnd hook — no transcript access)
- [ ] Silent, best-effort

### Task 1.5: Create `track-files.js` (PostToolUse)

**File**: `.claude/hooks/track-files.js`
**Trigger**: PostToolUse (matcher: `Write|Edit`)

Must:
- [ ] Read `SURREAL_SESSION_ID` from env file
- [ ] Extract file path from hook input (`tool_input.file_path`)
- [ ] Determine action: Write = "created" or "modified", Edit = "modified"
- [ ] INSERT into `agents/claude/files_touched` with session record link
- [ ] Async, non-blocking

### Task 1.6: Update `.claude/settings.json` hook registrations

**File**: `.claude/settings.json` (project-level)

Must register:
- [ ] `SessionStart` (matchers: startup, resume, clear, compact) -> `restore-memory.js`
- [ ] `UserPromptSubmit` -> `save-chat.js` (async)
- [ ] `PreCompact` -> `save-state.js`
- [ ] `SessionEnd` -> `session-end.js`
- [ ] `PostToolUse` (matcher: `Write|Edit`) -> `track-files.js` (async)

### Checkpoint 1
- [ ] Start new Claude Code session -> see context restored from all 3 namespaces
- [ ] Send a message -> verify it appears in `agents/claude/chat` with valid session record link
- [ ] Edit a file -> verify it appears in `agents/claude/files_touched`
- [ ] Close session -> verify session gets `ended_at` timestamp
- [ ] Start another session -> see previous session in "Recent Sessions"

---

## Phase 2: /banter commit Skill

### Task 2.1: Create skill definition

**File**: `.claude/skills/banter-commit/SKILL.md`

```yaml
---
name: banter-commit
description: Save progress to SurrealDB with conventional commit format
allowed-tools: [Bash]
---
```

Skill instructions:
- Parse: `type(scope): message` from user input
- Validate type against: feat, fix, refactor, chore, docs, test, style, perf, breaking, revert
- Get modified files from `git diff --name-only`
- INSERT into `projects/devpulse/commits` via `surreal sql`
- Confirm with summary

### Checkpoint 2
- [ ] `/banter commit feat(hooks): Wire session lifecycle` -> saved to DB
- [ ] Query: `SELECT * FROM commits ORDER BY created_at DESC LIMIT 1` shows it

---

## Phase 3: Archive + Launcher Alignment

### Task 3.1: Restore `banter-archive.js`

**File**: `scripts/surrealdb/banter-archive.js`

Update from recovered version:
- [ ] Port 8822
- [ ] Query correct namespaces (agents/claude for session data, projects/devpulse for commits/tasks)
- [ ] Archive path: `scripts/surrealdb/archives/`
- [ ] 30-day retention

### Task 3.2: Update `start-surreal.cmd`

**File**: `scripts/surrealdb/start-surreal.cmd`

- [ ] Port 8822 (match running instance)
- [ ] Data path: `D:\localdev\deps\surrealdb\data` or `D:\localdev\.surrealdb\data` (confirm with owner)
- [ ] surrealkv backend

### Task 3.3: Update `seed-all.cmd`

**File**: `scripts/surrealdb/seed-all.cmd`

- [ ] Port 8822
- [ ] Add step 7: `schema-lessons.surql` -> `projects/devpulse`
- [ ] Verify all 7 steps pass

### Task 3.4: Clean up VS Code tasks.json

**File**: `.vscode/tasks.json` (if it exists)

- [ ] Remove dead `~/.claude/hooks/` references
- [ ] Point to project-level `.claude/hooks/` paths
- [ ] Or remove Banter tasks entirely if hooks handle everything

### Checkpoint 3
- [ ] `seed-all.cmd` runs clean on fresh DB
- [ ] `start-surreal.cmd` starts on port 8822
- [ ] Archive script runs without errors (even if nothing to archive)

---

## Phase 4: DevPulse Embedded Path (Design Only)

This phase is DESIGN ONLY — no code until owner approves.

### How Data Flows from Standalone to Embedded

The standalone SurrealDB (port 8822) is the dev-time memory. The embedded SurrealDB (compiled into DevPulse via `surrealdb` Rust crate, kv-surrealkv) is the runtime memory.

```
Standalone (dev machine, port 8822)          Embedded (DevPulse binary)
+----------------------------------+        +---------------------------+
| global/knowledge                 |  --->  | maestro/knowledge         |
|   preferences, learnings,        | export |   same tables,            |
|   patterns, decisions            |  JSON  |   imported at build/boot  |
+----------------------------------+        +---------------------------+
| projects/devpulse                |  --->  | maestro/devpulse          |
|   architecture, context,         | export |   project rules,          |
|   tasks, decisions, commits      |  JSON  |   active context          |
+----------------------------------+        +---------------------------+
| agents/claude                    |   X    | (not imported)            |
|   sessions, chat, files_touched  | agent  |                           |
|   blockers                       | only   |                           |
+----------------------------------+        +---------------------------+
```

The `agents/` namespace stays on the standalone instance only — session logs don't ship with the product. `global/` and `projects/` knowledge gets exported to JSON and imported into the embedded instance at build time or first boot.

### IP Protection Mapping

The embedded instance lives under `kernel/devpulse-maestro/`. The IP protection system (`ip_term!()` macro, `kernel_terms.toml`) maps:

| Kernel Term | Public Term | Location |
|---|---|---|
| Maestro | Gus | `kernel/devpulse-maestro/` |
| Cortex | knowledge engine | `cortex/` module |
| SurrealAdapter | graph store | `cortex/persistence/surreal.rs` |
| maestro/knowledge | knowledge graph | embedded namespace |

The existing `systems/devpulse-engine/src/platform/stores/graph.rs` wraps the kernel's SurrealAdapter with the public-facing `GraphStore` interface. This is already built (49 lines, verified real).

### VibePulse Bridge

VibePulse (`D:\localdev\deps\vibepulse\`) has:
- `platform/lesson-engine/devpulse-bridge.ts` — adapter pattern, exports `createLessonBridge(config)`
- `platform/memory-engine/standalone-client.ts` — WebSocket client for the standalone SurrealDB
- `platform/memory-engine/schema.ts` — runtime schema (single source of truth for table definitions)

VibePulse manages the standalone SurrealDB visually. DevPulse owns the embedded instance. The bridge is the lesson engine adapter + shared schema definitions. No runtime dependency between them — they share a database, not code.

---

## Files Created/Modified

| File | Action | Phase |
|------|--------|-------|
| `.claude/hooks/restore-memory.js` | REWRITE | 1 |
| `.claude/hooks/save-chat.js` | REWRITE | 1 |
| `.claude/hooks/save-state.js` | REWRITE | 1 |
| `.claude/hooks/session-end.js` | CREATE | 1 |
| `.claude/hooks/track-files.js` | CREATE | 1 |
| `.claude/settings.json` | MODIFY | 1 |
| `.claude/skills/banter-commit/SKILL.md` | CREATE | 2 |
| `scripts/surrealdb/banter-archive.js` | RESTORE + UPDATE | 3 |
| `scripts/surrealdb/start-surreal.cmd` | MODIFY | 3 |
| `scripts/surrealdb/seed-all.cmd` | MODIFY | 3 |
| `.vscode/tasks.json` | MODIFY or REMOVE tasks | 3 |

## Recovered Files (Reference Archive)

These files were recovered from git and their content has been merged into the current architecture. They are kept as reference only:

| File | Git Commit | Lines | Status |
|------|-----------|-------|--------|
| `BANTER_IMPLEMENTATION_PLAN.md` | `1dcb7e0^` | 590 | Content merged into this sprint doc |
| `banter-archive.js` | `1dcb7e0^` | 109 | Being restored and updated (Phase 3) |
| `banter-schema.surql` | `57d9775^` | 154 | Superseded by schema-global + schema-projects + schema-agents |
| `banter-seed.surql` | `57d9775^` | 86 | Superseded by seed-global + seed-devpulse |

## 2026 State of the Art (Research)

What the bleeding edge is doing:

1. **SurrealDB 3.0 as agent memory engine** — SurrealDB raised $23M specifically for this use case. DEFINE API endpoints, Record References for graph traversal, HNSW vector search, Surrealism WASM plugins for in-DB model execution. We're using all of this correctly.

2. **Context compounding** — Continuous-Claude-v3 uses PostgreSQL + pgvector + BGE embeddings with a daemon that extracts learnings from session transcripts asynchronously. Our approach is simpler (SurrealDB does graph + vector + relational in one) and doesn't require a separate daemon.

3. **Claude Code hooks** — 17 lifecycle events. SessionStart stdout goes directly into Claude's context. `CLAUDE_ENV_FILE` persists env vars across hooks within a session. PostToolUse can track Write/Edit operations. SessionEnd fires on session close. This is the correct integration surface.

4. **Local-first knowledge graph** — MCP memory services (Basic-Memory, mcp-memory-service) use SQLite or file-based stores with knowledge graphs. Our SurrealDB approach is more capable (multi-model, graph-native, vector-native) but same philosophy: data never leaves the machine.

5. **What we're NOT doing that others are**: Separate daemon for embedding extraction, cloud sync, team collaboration via shared DB. These are future (Phase 4+ territory, not this sprint).

## Execution Order

1. Phase 1 first (hooks) — the core loop that makes sessions compound
2. Phase 2 (skill) — nice to have, not blocking
3. Phase 3 (archive + launcher) — housekeeping
4. Phase 4 (embedded path) — DESIGN ONLY, needs owner decision on data flow

## Risk Mitigation

- **SurrealDB not running**: All hooks gracefully exit 0 with a warning. Zero disruption.
- **CLAUDE_ENV_FILE not available**: Fallback to session_id string, skip record linking.
- **Schema drift**: The `.surql` files are the source of truth. `seed-all.cmd` is idempotent.
- **Port changes**: Single constant at top of each hook. One change propagates.
