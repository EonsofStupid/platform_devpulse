# SPRINT: Wire Real Data

**Date**: 2026-03-07
**Research**: [SPRINT-WIRE-REAL-DATA.research.md](SPRINT-WIRE-REAL-DATA.research.md)
**Status**: READY

## Goal

Connect the frontend to the already-booted database stores via Tauri IPC.
Replace ALL stub/hardcoded data with real store queries.
After this sprint: dashboard shows real data, chat sends real messages, DB status is visible.

## Prerequisites

- [x] Platform boots 4 stores (LibSQL, DuckDB, SurrealDB, Moka)
- [x] Health polling works (`get_status`)
- [x] Schemas exist in all stores (created at boot)
- [x] Frontend type system ready (DashboardData, SystemHealth)
- [x] ColdLight components render correctly

## Phase 1: Dashboard + DB Status

### Task 1.1: Rust — `fetch_dashboard` Tauri command
**File**: `interfaces/desktop/src-tauri/src/commands/devpulse/mod.rs` (NEW)

- [ ] Create `commands/devpulse/` module
- [ ] Add `fetch_dashboard` command that:
  - Queries LibSQL: `SELECT COUNT(*) FROM projects`, `SELECT * FROM projects ORDER BY last_accessed DESC LIMIT 8`
  - Queries DuckDB: `SELECT * FROM daily_stats ORDER BY date DESC LIMIT 20`
  - Queries Moka: `cache.stats()` for entry_count/capacity
  - Returns `DashboardPayload` struct (serde Serialize)
- [ ] Register in `lib.rs` invoke_handler
- [ ] `cargo build` passes

### Task 1.2: Rust — Dev seed data on first boot
**File**: `systems/devpulse-engine/src/platform/mod.rs` (EDIT)

- [ ] After all stores boot, check if `projects` table is empty
- [ ] If empty AND `cfg!(debug_assertions)`: insert seed data
  - 4 projects (platform_devpulse, maestro-kernel, coldlight-tokens, signal-router)
  - 1 session per project
  - 5 messages per session (sample dev conversations)
  - 20 daily_stats rows in DuckDB (last 20 days)
  - 3 user_metrics events in DuckDB
- [ ] Guard: only seed once (check row count first)
- [ ] `cargo build` passes

### Task 1.3: TypeScript — Dashboard types + IPC
**File**: `src/lib/sys/generated/dashboard.types.ts` (NEW)
**File**: `src/lib/domains/app/devpulse/services/devpulse.service.ts` (EDIT)

- [ ] Create `dashboard.types.ts` matching Rust `DashboardPayload`:
  ```typescript
  interface ProjectRow { id: string; name: string; root_path: string; project_type: string; last_accessed: number; }
  interface DailyStatsRow { date: string; total_signals: number; total_messages: number; total_tokens: number; avg_latency_ms: number; }
  interface CacheStats { entry_count: number; max_capacity: number; }
  interface DashboardPayload { projects: ProjectRow[]; project_count: number; daily_stats: DailyStatsRow[]; cache_stats: CacheStats; uptime_secs: number; }
  ```
- [ ] Replace `getDashboardData()` stub with `invoke("fetch_dashboard")`
- [ ] Map `DashboardPayload` → existing `DashboardData` shape (adapter function)
- [ ] `pnpm svelte-check` passes

### Task 1.4: Svelte — DevPulse runes use real data
**File**: `src/lib/domains/app/devpulse/runes/devpulse.runes.svelte.ts` (EDIT)

- [ ] Change `getDashboardData()` call to async `fetchDashboardData()`
- [ ] Add `async refresh()` that calls `invoke("fetch_dashboard")`
- [ ] Initialize with loading state, fetch on construction
- [ ] Handle error state (platform not ready yet)
- [ ] `pnpm svelte-check` passes

### Task 1.5: Svelte — DB Status widget on dashboard
**File**: `src/routes/(app)/devpulse/+page.svelte` (EDIT)

- [ ] Import `platformState`
- [ ] Add "System Status" widget showing:
  - Each subsystem name + health status (Healthy/Degraded/Down)
  - Ping latency per store
  - Uptime
  - Cache stats (entries/capacity)
- [ ] Use existing ColdLight Widget + Badge components
- [ ] Style status indicators with accent tokens
- [ ] `pnpm svelte-check` passes

### Checkpoint 1
- [ ] `cargo build` — 0 errors
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Dashboard shows real project count from LibSQL
- [ ] Dashboard shows real store health status
- [ ] Dashboard shows real uptime

---

## Phase 2: Chat IPC

### Task 2.1: Rust — Wire `send_message` to LibSQL
**File**: `interfaces/desktop/src-tauri/src/commands/chat/mod.rs` (EDIT)

- [ ] Change `send_message` to async, accept `State<PlatformState>`
- [ ] Create/reuse session: check for active session, create if none
- [ ] INSERT message into LibSQL `messages` table (role="user", content, created_at)
- [ ] Return stored `ChatMessage` struct (with id, timestamp)
- [ ] `cargo build` passes

### Task 2.2: Rust — Wire `load_recent` to LibSQL
**File**: `interfaces/desktop/src-tauri/src/commands/chat/history.rs` (EDIT)

- [ ] Change `load_recent` to async, accept `State<PlatformState>`
- [ ] Accept optional `session_id` parameter
- [ ] SELECT from `messages` WHERE session_id, ORDER BY created_at DESC, LIMIT 50
- [ ] Return `Vec<ChatMessage>` (serde Serialize)
- [ ] `cargo build` passes

### Task 2.3: TypeScript — Chat types + IPC
**File**: `src/lib/sys/generated/chat.types.ts` (NEW)

- [ ] Create ChatMessage type matching Rust:
  ```typescript
  interface ChatMessage { id: number; session_id: string; role: "user" | "assistant"; content: string; metadata: Record<string, unknown> | null; created_at: number; }
  interface ChatSession { id: string; project_id: string | null; created_at: number; }
  ```

### Task 2.4: Svelte — Wire chat page to Tauri IPC
**File**: `src/routes/(chat)/chat/+page.svelte` (EDIT)

- [ ] Import `invoke` from `@tauri-apps/api/core`
- [ ] On mount: `invoke("load_recent")` → populate messages
- [ ] On send: `invoke("send_message", { content })` → append returned message
- [ ] Remove hardcoded messages array
- [ ] Handle loading/error states
- [ ] `pnpm svelte-check` passes

### Checkpoint 2
- [ ] `cargo build` — 0 errors
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Chat loads history from LibSQL on open
- [ ] Sending a message persists to LibSQL
- [ ] Messages survive app restart

---

## Phase 3: Analytics Pipeline (stretch)

### Task 3.1: Rust — Wire `sys::log` to DuckDB
**File**: `interfaces/desktop/src-tauri/src/commands/sys/logger.rs` (EDIT)

- [ ] Accept `event_type: String`, `event_data: serde_json::Value`
- [ ] INSERT into DuckDB `user_metrics` table
- [ ] Fire-and-forget (don't block frontend)

### Task 3.2: Rust — `fetch_analytics` command
**File**: `interfaces/desktop/src-tauri/src/commands/devpulse/mod.rs` (EDIT)

- [ ] Query DuckDB `daily_stats` for sparkline data
- [ ] Query DuckDB `ai_metrics` for Maestro load gauge
- [ ] Return analytics payload for dashboard charts

### Task 3.3: Frontend — Log page views
- [ ] Call `invoke("log", { event_type: "page_view", event_data: { route } })` on navigation
- [ ] Activity timeline sparkline uses real DuckDB data

---

## Verification

- [ ] `cargo build` — 0 errors
- [ ] `pnpm svelte-check` — 0 errors, 0 warnings
- [ ] `pnpm dev` — app starts, dashboard shows real data
- [ ] Chat window opens, loads history, sends messages that persist
- [ ] DB status widget shows all 4 stores with health badges
- [ ] Restart app — data persists (LibSQL on disk)

## Risk Mitigation

- **SurrealDB Windows flakiness**: Phase 1+2 use LibSQL + DuckDB only. SurrealDB not touched.
- **Empty DB on first run**: Dev seed handles it. Production gets empty state UI.
- **Type drift**: Generated types are manually maintained. Keep Rust structs and TS interfaces in sync.

## Out of Scope

- Maestro AI responses (requires kernel integration beyond persistence)
- P2P collaboration (WiredFront)
- Thinking canvas (ThinkMaestro)
- Signal routing (Overmind)
- Full analytics dashboard with charts
