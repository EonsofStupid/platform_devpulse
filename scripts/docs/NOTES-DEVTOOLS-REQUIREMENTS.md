# DevTools — Pending Requirements Scrape (2026-04-21)

> Collected from sprint documents in `scripts/docs/sprints/` and in-flight git status.
> Scope: everything DevTools-related (the `/devtools/*` route surface + backing IPC + domain state) that is NOT-YET-BUILT, IN-FLIGHT, or FLAGGED-FOR-CHANGE.

---

## 1. SPRINT-PHASE-B-DEVTOOLS-CLAUDE.md — READY TO SHIP

**Status:** READY. Owner directive 2026-04-20: *"Subscription is default used until the fucking local LLM has been saved/applied."*
**Scope:** S-M — 3 NEW files, 1 EDIT.

### What this finishes
1. **Default Brain card** on `/devtools/claude` Subscription tab — picker over loaded local models, bound to `chat.brain` slot.
2. **Auto-fallback routing** — `LocalClaudeSubscription` (default) ↔ `LocalFirst` (when local LLM assigned + applied + loaded to `chat.brain`).
3. **Live routing badge** on Subscription tab showing current mode.

### Files
| Action | Path |
|---|---|
| NEW | `interfaces/desktop/src/lib/domains/app/models/data-access/routing.state.svelte.ts` |
| NEW | `interfaces/desktop/src/lib/domains/app/models/ui/DefaultBrainCard.svelte` |
| NEW | `interfaces/desktop/src/lib/domains/app/models/index.ts` (export additions) |
| EDIT | `interfaces/desktop/src/routes/(devtools)/devtools/claude/+page.svelte` |

### Contract for `routing.state.svelte.ts`
- `$state<InferenceProvider> current`
- Listen to `provider:changed` event, update `current`
- `ensureAutoFallback(brainReady, brainAssigned)` — auto-switches routing based on brain state
- NO user-facing "pick routing mode" button — automatic

### Contract for `DefaultBrainCard.svelte`
- Reads `modelsState.slots['chat.brain']`
- `$derived` model metadata + availableModels (TextGeneration capability only)
- `$effect` watches slot assignment + ready → calls `ensureAutoFallback`
- Apply: `modelsState.assign → modelsState.load → auto-fallback`
- Clear: unload → revert to Subscription
- ColdLight Card/Badge/Button/Spinner. No raw hex/px.

### Edit `/devtools/claude/+page.svelte`
- Import `routingState` + `DefaultBrainCard`
- `$effect` mount: `routingState.start()`, cleanup `stop()`
- Replace hardcoded MCP badge with live routing badge (LocalClaudeSubscription=teal, LocalFirst=green, Council=purple)
- Insert `<DefaultBrainCard />` between Sidecar and Internal Lane Usage cards

### Verification gate
- [ ] `pnpm check` green
- [ ] `cargo check -p devpulse_desktop_backend` green (no backend changes)
- [ ] Round-trip: assign local model → routing flips LocalFirst; unload → reverts
- [ ] Session JSONL shows `provider:changed` + `ensureAutoFallback` transitions
- [ ] No duplicate listeners on repeated open/close

### Out of scope (Phase B scope lock)
- RoutingModeRadio in wizard (superseded)
- Settings-page routing reuse (deferred)
- MCP/sidecar/Claude Code probes (deferred)
- OpenAI/Gemini cloud_chat (deferred)
- API Providers tab key-entry (deferred)
- Lane usage live counters (deferred)

---

## 2. SPRINT-DEVTOOLS-TELEMETRY.md — UNBLOCKED (depends on TELEMETRY-FOUNDATION P4, done)

**Purpose:** Build Telemetry devtool as three-view span browser + baseline manager + OTel config panel. Establishes **"one devtool per infra crate"** pattern.

### Stack locked (2026-04-17)
- Mosaic vgplot 0.24.2
- LayerChart 1.0.13
- TradingView Lightweight Charts
- Custom Svelte 5 waterfall
- DuckDB is THE analytics engine (no Prometheus, no Grafana, all queries in-process)

### Doctrine
- **Three views, not ten** — heatmap answers "slower?", waterfall answers "which request?", baselines answer "reset baseline?"
- **<100ms per interaction** — Mosaic push-down + correct queries
- Establishes pattern for future infra devtools (config, health, ipc, logging, signals)

### Phases

#### P1 — Frontend domain scaffold (NOT STARTED)
- [ ] Create `src/lib/domains/infra/telemetry/` Nx lib-types:
  - `index.ts`
  - `util/telemetry.contract.ts`
  - `util/telemetry.types.ts`
  - `data-access/telemetry.state.svelte.ts`
  - `data-access/telemetry.service.ts`
- [ ] Create `/devtools/telemetry` route — 4 tabs: Dashboard | Spans | Baselines | Config
- [ ] Add Telemetry card to `/devtools/+page.svelte` overview grid

#### P2 — Extend Tauri IPC (PARTIAL)
File: `interfaces/desktop/src-tauri/src/commands/sys/telemetry.rs`
- EXISTING: `get_lane_config`, `set_lane_config`, `query_span_traces`, `query_lane_baselines`
- [ ] NEW `get_span_histogram`
- [ ] NEW `get_baseline`
- [ ] NEW `set_baseline`
- [ ] NEW `get_telemetry_config`
- [ ] NEW `set_telemetry_config`

#### P3 — Latency heatmap landing view (NOT STARTED)
- [ ] Install `@uwdata/mosaic-core`, `@uwdata/vgplot`
- [ ] Author `TelemetryDashboard.svelte` — heatmap X=time, Y=TTFT buckets, color=count; baseline overlay; click-to-drill into Spans tab
- [ ] Author `MetricCards.svelte` — LayerChart sparklines for p50/p95/p99 TTFT, tokens/sec, cache hit %, deltas from baseline

#### P4 — Span waterfall (NOT STARTED)
- [ ] Author `SpanWaterfall.svelte` (custom Svelte 5): tree layout, parent/child nesting across flume boundaries, time-proportional bars, color-coded by span kind
- [ ] Author `SpanDetail.svelte`: wide-event attributes (`devpulse.termination_reason`, `devpulse.vram_*_mb`, `gen_ai.usage.*`, `devpulse.cache_hit`), JSON raw toggle

#### P5 — Baseline manager (NOT STARTED)
- [ ] Author `BaselineManager.svelte`: table of baselines, Establish button, regression detection, z-score anomaly
- [ ] DuckDB SQL: `QUANTILE_CONT`, rolling percentiles, regression ratio calc

#### P6 — Telemetry config panel (NOT STARTED)
- [ ] Author `TelemetryConfig.svelte`: toggle OTLP file exporter, toggle DuckDB sink, histogram buckets, retention policy, regression threshold, lane presets
- [ ] Persist to TOML + compose into `PlatformConfig`

#### P7 — Overview card polish (NOT STARTED)
- [ ] Live p95 TTFT sparkline on card
- [ ] Baseline status badge
- [ ] 7-day rolling retention
- [ ] ColdLight presets on all components

### Definition of Done (all 10 pending)
- [ ] `/devtools/telemetry` with 4 tabs + Telemetry card on overview
- [ ] `src/lib/domains/infra/telemetry/` follows Nx library-types strictly
- [ ] Mosaic heatmap renders real TTFT from DuckDB
- [ ] Custom waterfall shows parent/child nesting across flume boundaries
- [ ] Baseline mgmt: establish/compare/regression detection via pure DuckDB SQL
- [ ] Config persists to TOML + composes into PlatformConfig
- [ ] <100ms per interaction
- [ ] ColdLight visual system applied (no raw hex/px, no inline colors)
- [ ] `pnpm check` + `pnpm build` green
- [ ] Handoff doc: "one devtool per capability" pattern

---

## 3. SPRINT-REALITY-GAP-CLOSE.md — ACTIVE AUDIT

**Mandate:** *"Zero devtools show green when they are not."* Every devtool page is either REAL or HONEST-PLACEHOLDER (dated + annotated).

### Four gaps

| Gap | Action | Devtools Impact |
|---|---|---|
| **G1: Ollama sidecar** | Full service + 4 Tauri commands + devtool wiring | Create `/devtools/ollama_sidecar` — Status + Extras (models list) + Actions (Start/Stop/Restart) |
| **G2: Rename `ollama_embedded` → `llama_cpp_embedded`** | Rename route folder, landing grid label, config slot, module entry | Regardless of STOP-2 outcome |
| **G3: Candle devtool** | Backend exists — add devtool commands + frontend | Create `/devtools/candle` — Status (health) + Extras (Loaded Slots from model-loader) + Actions (Restart pool) |
| **G4: Cache devtool** | Pending STOP-3: does cache SERVICE exist? | If yes: commands + `/devtools/cache` wiring. If no: update placeholder annotation. Currently "Not wired yet". |

### Verification mandate
- [ ] Manually click through every devtool page in the audit
- [ ] Each is REAL or HONEST-PLACEHOLDER (dated + annotated)
- [ ] Zero green cards for unimplemented devtools

---

## 4. Git status — devtools files in flight

### Modified (wiring to real state)
- `interfaces/desktop/src/routes/(devtools)/devtools/+page.svelte` — **+57 lines** (adding new service cards to overview grid)
- `interfaces/desktop/src/routes/(devtools)/devtools/devforge/+page.svelte`
- `interfaces/desktop/src/routes/(devtools)/devtools/duckdb/+page.svelte`
- `interfaces/desktop/src/routes/(devtools)/devtools/libsql/+page.svelte`
- `interfaces/desktop/src/routes/(devtools)/devtools/surreal/+page.svelte`

### Untracked (placeholder shells — need real wiring)
- `interfaces/desktop/src/routes/(devtools)/devtools/cache/`
- `interfaces/desktop/src/routes/(devtools)/devtools/candle/`
- `interfaces/desktop/src/routes/(devtools)/devtools/ollama_embedded/` (RENAME → `llama_cpp_embedded/`)
- `interfaces/desktop/src/routes/(devtools)/devtools/ollama_sidecar/`
- `interfaces/desktop/src/routes/(devtools)/devtools/project_db/`

---

## 5. CONSOLIDATED "NEEDS CHANGE RIGHT NOW"

### A. Ship Phase B — `/devtools/claude` auto-fallback (BLOCKED READY)
- [ ] Create `routing.state.svelte.ts`
- [ ] Create `DefaultBrainCard.svelte`
- [ ] Export from `domains/app/models/index.ts`
- [ ] Edit `/devtools/claude/+page.svelte` — mount card + live routing badge + lifecycle
- [ ] Verify round-trip assign/unload flips badge

### B. Telemetry devtool — P1 scaffold (START HERE for telemetry)
- [ ] `src/lib/domains/infra/telemetry/` Nx lib-type scaffold (5 files)
- [ ] `/devtools/telemetry` route with 4 tabs
- [ ] Telemetry card on overview grid
- [ ] `pnpm check` green

### C. Telemetry devtool — P2–P7 (visualization + config)
- [ ] Install Mosaic vgplot 0.24.2 + LayerChart 1.0.13
- [ ] Extend `src-tauri/src/commands/sys/telemetry.rs` with 5 new IPC commands
- [ ] Author `TelemetryDashboard.svelte` (heatmap + baseline + click-drill)
- [ ] Author `MetricCards.svelte` (sparklines + deltas)
- [ ] Author `SpanWaterfall.svelte` (custom Svelte 5 tree)
- [ ] Author `SpanDetail.svelte` (wide-event attrs)
- [ ] Author `BaselineManager.svelte` (DuckDB SQL regression detection)
- [ ] Author `TelemetryConfig.svelte` (persist to TOML)
- [ ] Overview card: live p95 sparkline + baseline badge

### D. Reality-gap close — honest devtools
- [ ] Ollama sidecar: service + 4 Tauri commands + `/devtools/ollama_sidecar` real wiring
- [ ] Rename `ollama_embedded` → `llama_cpp_embedded` (route folder + landing grid + config slot + module entry)
- [ ] Candle: add commands + `/devtools/candle` Status/Extras/Actions
- [ ] Cache: resolve STOP-3, then either wire `/devtools/cache` or annotate placeholder
- [ ] `/devtools/project_db`: wire real `project_db_health` + `init_project_db` action
- [ ] Overview grid: zero green cards for unimplemented devtools

### E. Doctrine handoff (future-proofing)
- [ ] Document "one devtool per capability" pattern:
  `systems/infra/<name>/` crate → `src/lib/domains/infra/<name>/` → `/devtools/<name>` + overview card
- [ ] Queue future devtool sprints: logging, signals, ipc, config, health, secrets

---

## Priority order

1. **Phase B** — tiny, code-specced, unblocks routing UX (owner explicit directive 2026-04-20)
2. **Reality-gap G1/G2/G3** — close the lies in the overview grid (Ollama sidecar, rename, Candle)
3. **Telemetry P1** — scaffold (establishes infra devtool pattern)
4. **Telemetry P2–P7** — visualization stack
5. **Reality-gap G4** — cache (depends on STOP-3 answer)
6. **Doctrine handoff** — so future infra crates follow the established pattern
