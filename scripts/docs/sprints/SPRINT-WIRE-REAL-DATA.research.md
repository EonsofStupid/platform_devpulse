# Research: Wire Real Data Through Tauri IPC

**Date**: 2026-03-07
**Sprint**: SPRINT-WIRE-REAL-DATA
**Status**: COMPLETE

## Question/Goal

Wire the DevPulse application to use REAL data from the already-booted database stores
(LibSQL, DuckDB, SurrealDB, Moka cache) via Tauri IPC commands. The platform boots 4 stores
successfully but nothing reads from or writes to them. The frontend shows hardcoded stubs.

## Codebase Analysis

### What's REAL (already wired)

| Layer | What | Files |
|-------|------|-------|
| Platform boot | 4 stores boot with progress events | `systems/devpulse-engine/src/platform/mod.rs` |
| Health polling | `get_status` returns real SystemHealth every 15s | `src-tauri/src/commands/devmaestro/mod.rs` |
| Boot events | `platform:subsystem-status` + `platform:boot-phase` | `src/lib/sys/runes/platformState.svelte.ts` |
| Window mgmt | `open_chat_window`, `close_window`, `focus_window` | `src-tauri/src/commands/window/mod.rs` |
| Config | `get_settings` returns PlatformConfig | `src-tauri/src/commands/sys/config.rs` |

### What's STUB (hardcoded/empty)

| Layer | What | Current State | Files |
|-------|------|---------------|-------|
| Dashboard data | `getDashboardData()` | Returns hardcoded `{ totalProjects: 12, totalCommits: 347, ... }` | `src/lib/domains/app/devpulse/services/devpulse.service.ts` |
| Chat send | `send_message(content)` | Returns `"Echo: {content}"` | `src-tauri/src/commands/chat/mod.rs` |
| Chat history | `load_recent()` | Returns `vec![]` | `src-tauri/src/commands/chat/history.rs` |
| Chat frontend | Messages array | Local `$state` with 2 hardcoded messages, no IPC | `src/routes/(chat)/chat/+page.svelte` |
| DB status UI | Health data | Available in `platformState.health` but NOT displayed | Dashboard page |
| Other commands | 5 stubs | Empty fn bodies | `post_reaction`, `verify`, `log`, `create_canvas`, `connect_peer` |

### Database Schemas (Already Created at Boot)

**LibSQL (Relational):**
- `kv_store` — key/value blob with updated_at
- `projects` — id, name, root_path, project_type, created_at, last_accessed
- `sessions` — id, project_id (FK), created_at, ended_at
- `messages` — id, session_id (FK), role, content, metadata (JSON), created_at
- `platform_config` — key, value, category, updated_at
- `user_config` — key, value, category, updated_at

**DuckDB (Analytics):**
- `kv_store` — key/value blob
- `user_metrics` — session_id, event_type, event_data (JSON), created_at
- `ai_metrics` — trace_id, model, prompt_tokens, completion_tokens, latency_ms
- `signal_metrics` — signal_kind, processing_tier, latency_ms
- `daily_stats` — date, total_signals, total_messages, total_tokens, avg_latency_ms

**SurrealDB (Graph):**
- `kv` — key/value blob
- `nodes` — node_type, content, metadata, created_at
- `relates` — relation_type, weight, created_at (edge table)
- `states` — name, probability, emissions (HMM)
- `transitions` — from_state, to_state, probability, trigger

**Moka (Cache):**
- In-memory LRU, 10k entries, 300s TTL, 60s idle
- `stats()` returns (entry_count, max_capacity)

### Maestro Traits (Available for Store Access)

```rust
// All stores implement:
PersistenceAdapter { set, get, delete, exists }
TypedPersistence { set_json<T>, get_json<T> }  // extension

// SQL stores (LibSQL + DuckDB):
SqlAdapter { query(sql, params), execute(sql, params), execute_batch(sql) }

// DuckDB only:
AnalyticsAdapter { analytics_query(sql), append(table, data) }

// SurrealDB only:
GraphAdapter { create_node, create_edge, query_nodes, traverse }

// Moka only:
CacheAdapter { invalidate_prefix, stats, clear, entry_count }
```

### Frontend TypeScript Types (Generated/Manual)

- `sys/generated/health.types.ts` — SystemHealth, SubsystemHealth, HealthStatus
- `sys/generated/init.types.ts` — InitEvent, InitStatus
- `domains/app/devpulse/types/devpulse.types.ts` — DashboardData (matches stub output)
- No generated types for chat messages, projects, sessions, config, metrics

### Frontend invoke() Usage (Only 2 Active)

1. `invoke("get_status")` — platformState health poll
2. `invoke("open_chat_window")` — TopBar button

### Frontend listen() Usage (Only 2 Events)

1. `platform:subsystem-status` — boot progress
2. `platform:boot-phase` — boot phase transitions

## Findings

### Key Insight: The Backend Has Everything, The Frontend Has Nothing

The Rust backend is properly architected:
- 4 stores boot reliably with schemas
- Health monitoring works
- Platform facade exposes store accessors: `platform.relational()`, `platform.analytics()`, etc.
- Maestro traits provide full CRUD (SQL queries, graph traversal, analytics, cache)

The frontend is properly architected:
- `platformState` pattern is the right reactive model
- Domain services pattern exists (`devpulse.service.ts`)
- Type system is ready (`DashboardData` type already defined)
- Component layer is production-ready (ColdLight renders correctly)

**The gap is purely in the MIDDLE — Tauri commands that bridge stores to frontend.**

### What Needs to Happen (Prioritized)

**Phase 1: Dashboard + DB Status (highest visual impact)**
1. New Tauri command: `fetch_dashboard` — queries LibSQL projects + DuckDB daily_stats
2. Wire `devpulse.service.ts` to call `invoke("fetch_dashboard")`
3. Display `platformState.health` on dashboard (store status cards)
4. Show real project count, real uptime, real store health

**Phase 2: Chat IPC (core feature)**
1. Wire `send_message` to INSERT into LibSQL messages table
2. Wire `load_recent` to SELECT from LibSQL messages (last N per session)
3. Create/manage sessions in LibSQL
4. Frontend: call `invoke("send_message")` + `invoke("load_recent")` on mount
5. Generate TypeScript types for ChatMessage matching Rust struct

**Phase 3: Analytics + Metrics (depth)**
1. New Tauri command: `fetch_analytics` — queries DuckDB for dashboard charts
2. Wire `sys::log` to INSERT into DuckDB user_metrics
3. Frontend event tracking: page views, interactions → DuckDB

### Architecture Decision: Seed Data

The stores have schemas but NO data. Options:
- **A) Seed on first boot** — Insert sample projects/sessions/messages during Platform::boot
- **B) Seed via Tauri command** — `dev_seed()` command for dev mode only
- **C) Empty state UI** — Show "No projects yet" empty states

**Recommendation: A + C** — Seed basic data on first boot (dev mode), show empty states in production.

## Recommendations

### Sprint Scope (achievable in one session)

Focus on Phase 1 + Phase 2 — that's the dashboard showing real data and chat actually working.
Phase 3 (analytics) can follow.

### Implementation Order

1. **Rust: Add `fetch_dashboard` command** — queries LibSQL for project count, DuckDB for stats
2. **Rust: Add dev seed** — insert sample projects/messages on first boot (dev only)
3. **Rust: Wire `send_message`** — INSERT into messages table, return stored message
4. **Rust: Wire `load_recent`** — SELECT from messages with proper types
5. **TS: Generate chat types** — ChatMessage type matching Rust
6. **TS: Wire dashboard service** — `invoke("fetch_dashboard")` in devpulse.service.ts
7. **TS: Wire chat page** — `invoke("send_message")` + `invoke("load_recent")`
8. **Svelte: Add DB status widget** — Show store health from platformState on dashboard
9. **Verify** — `cargo build`, `pnpm svelte-check`, manual test

### Risk: SurrealDB on Windows

SurrealDB has been flaky on Windows (file lock issues, stale data recovery already coded).
Phase 1+2 don't need SurrealDB — they use LibSQL + DuckDB only. Safe to proceed.

## Files Referenced

### Rust (Backend)
- `systems/devpulse-engine/src/platform/mod.rs` — Platform facade, boot, health
- `systems/devpulse-engine/src/platform/stores/mod.rs` — Store trait
- `systems/devpulse-engine/src/platform/stores/relational.rs` — LibSQL wrapper
- `systems/devpulse-engine/src/platform/stores/analytics.rs` — DuckDB wrapper
- `systems/devpulse-engine/src/platform/stores/graph.rs` — SurrealDB wrapper
- `systems/devpulse-engine/src/platform/stores/cache.rs` — Moka wrapper
- `kernel/devpulse-maestro/src/cortex/persistence/libsql.rs` — LibSQL adapter (SQL schema)
- `kernel/devpulse-maestro/src/cortex/persistence/duckdb.rs` — DuckDB adapter (analytics schema)
- `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs` — SurrealDB adapter (graph schema)
- `kernel/devpulse-maestro/src/cortex/persistence/moka.rs` — Moka adapter (cache)
- `interfaces/desktop/src-tauri/src/lib.rs` — Tauri setup + invoke_handler
- `interfaces/desktop/src-tauri/src/commands/chat/mod.rs` — send_message (stub)
- `interfaces/desktop/src-tauri/src/commands/chat/history.rs` — load_recent (stub)
- `interfaces/desktop/src-tauri/src/commands/devmaestro/mod.rs` — get_status (real)
- `interfaces/desktop/src-tauri/src/commands/sys/config.rs` — get_settings (real)
- `interfaces/desktop/src-tauri/src/state.rs` — PlatformState wrapper

### Frontend (TypeScript/Svelte)
- `src/lib/sys/runes/platformState.svelte.ts` — Boot/health state
- `src/lib/sys/generated/health.types.ts` — SystemHealth types
- `src/lib/sys/generated/init.types.ts` — InitEvent types
- `src/lib/domains/app/devpulse/services/devpulse.service.ts` — Stub data
- `src/lib/domains/app/devpulse/runes/devpulse.runes.svelte.ts` — Dashboard state
- `src/lib/domains/app/devpulse/types/devpulse.types.ts` — DashboardData type
- `src/routes/(app)/devpulse/+page.svelte` — Dashboard page
- `src/routes/(chat)/chat/+page.svelte` — Chat page
