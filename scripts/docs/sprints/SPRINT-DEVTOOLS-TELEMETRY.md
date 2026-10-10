# SPRINT-DEVTOOLS-TELEMETRY

> **Status:** UNBLOCKED — SPRINT-TELEMETRY-FOUNDATION P4 done (OTel wired into Tauri boot)
> **Authored:** 2026-04-17
> **Last updated:** 2026-04-18
> **Depends on:** SPRINT-TELEMETRY-FOUNDATION P4 (init_early wired into Tauri boot so spans flow to OTLP JSONL + DuckDB)
> **Related ADR:** `scripts/docs/adr/ADR-002-TELEMETRY-PRIMITIVES.md`
> **Related memory:** `project_devtools_telemetry_spec.md`
>
> **Pre-existing infrastructure (already built, available now):**
> - 4 Tauri IPC commands: `get_lane_config`, `set_lane_config`, `query_span_traces`, `query_lane_baselines`
> - DuckDB tables: `span_traces`, `lane_traces`, `lane_baselines` (schema in `lanes.rs`)
> - DevTools grid at `/devtools` with 16+ cards, tab-organized (Overview/Lanes/Config)
> - Lane tracing UI with presets (Off/Standard/Debug), per-lane toggles, DuckDB persistence toggle
> - Specta-generated TS bindings: `LaneTraceConfig`, `SpanTraceRow`, `LaneBaselineRow`

---

## Purpose

Build the Telemetry devtool: a three-view span browser, baseline manager, and OTel
configuration panel inside the existing DevTools window (Ctrl+Shift+Z). Establish
the "one devtool per capability" pattern where each `systems/infra/*` crate gets
a matching frontend domain + devtools route + overview card.

## Principles

1. **Three views, not ten.** Each answers one question: "Is it slower?", "Which request and why?", "Should I reset baseline?"
2. **DuckDB IS the analytics engine.** No Prometheus, no Grafana, no server. All visualization queries run against DuckDB in-process.
3. **Start from a question, not a list.** Honeycomb's paradigm: landing is a heatmap, not a trace table. Drill by drawing a box on the anomaly.
4. **<100ms per interaction.** Mosaic's DuckDB push-down handles this. If a view is slow, the query is wrong, not the tool.
5. **ColdLight owns the visual layer.** Dashboard components use ColdLight presets, not library defaults.

## Non-goals

- General-purpose dashboarding framework (Grafana-clone syndrome)
- Metrics pipeline / Prometheus scraping / external backends
- Multi-user / multi-machine observability (this is a local desktop app)
- Generic panels with vague labels ("System Health")

---

## Visualization Stack (Locked 2026-04-17)

| Concern | Library | Version |
|---|---|---|
| Span histograms + latency heatmaps | Mosaic vgplot | 0.24.2 |
| Raw data grid / pivot (power-user) | Perspective | 4.4.1 |
| Metric sparklines (overview cards) | LayerChart | 1.0.13 |
| Streaming time-series (tokens/sec) | Lightweight Charts (TradingView) | latest |
| Span waterfall | Custom Svelte 5 component | n/a |

---

## Phase Plan

### P1 — Frontend domain scaffold + route wiring

**Goal:** `/devtools/telemetry` route exists, card on DevTools overview grid, domain follows Nx library-types.

1. Create `src/lib/domains/infra/` (new domain category for infrastructure devtools).
2. Create `src/lib/domains/infra/telemetry/` with full Nx library-type structure:
   - `index.ts` — public API
   - `util/telemetry.contract.ts` — ArkType schemas: `BaselineConfig`, `HistogramBucket`, `RetentionPolicy`, `SpanRow`
   - `util/telemetry.types.ts` — `BaselineSnapshot`, `RegressionAlert`, `TelemetryConfigState`
   - `data-access/telemetry.state.svelte.ts` — rune state: active view, selected span, baselines, config
   - `data-access/telemetry.service.ts` — Tauri IPC stubs: `querySpans()`, `getBaselines()`, `setBaseline()`, `getTelemetryConfig()`, `setTelemetryConfig()`
   - `feature/dashboard/TelemetryDashboard.svelte` — placeholder landing view
3. Create `src/routes/(devtools)/devtools/telemetry/+page.svelte` — tab-organized: Dashboard | Spans | Baselines | Config.
4. Add Telemetry card to the DevTools overview grid in `src/routes/(devtools)/devtools/+page.svelte`.

**Verification gate:** `pnpm check` green. Card appears on DevTools overview. Route navigates to placeholder.

---

### P2 — Tauri IPC commands + DuckDB query layer 🔶 PARTIALLY PRE-EXISTING

**Goal:** Rust-side commands that query DuckDB `spans` table and return typed results via specta.

**Already exists (`src-tauri/src/commands/sys/telemetry.rs`, registered in lib.rs lines 60-63):**
- ✅ `get_lane_config()` → `LaneTraceConfig`
- ✅ `set_lane_config(config)` → `()`
- ✅ `query_span_traces(trace_id?, limit?)` → `Vec<SpanTraceRow>`
- ✅ `query_lane_baselines()` → `Vec<LaneBaselineRow>`

**Still needed (extend existing file):**
1. `get_span_histogram(metric: &str, bucket_boundaries: Vec<f64>) -> Vec<HistogramBucket>` — TTFT/TPOT histogram
2. `get_baseline(name: &str) -> Option<BaselineSnapshot>` — read named baseline
3. `set_baseline(name: &str, sample_count: u32) -> BaselineSnapshot` — snapshot current p50/p95/p99
4. `get_telemetry_config() -> TelemetryConfig` — OTel exporter config (not lane config)
5. `set_telemetry_config(config: TelemetryConfig) -> ()` — toggle file exporter, set retention

**Verification gate:** specta generates typed TS bindings. `pnpm check` green. New commands callable from frontend.

---

### P3 — Latency heatmap landing view (Mosaic vgplot)

**Goal:** The "start from a question" entry point. TTFT distribution over time, baseline overlay, click-to-drill.

1. Install Mosaic: `pnpm add @uwdata/mosaic-core @uwdata/vgplot`.
2. Author `feature/dashboard/TelemetryDashboard.svelte`:
   - Mosaic coordinator connected to DuckDB via Tauri IPC (not WASM — DuckDB runs in Rust)
   - Heatmap: X = time, Y = TTFT buckets, color = count
   - Baseline overlay: green zone (within p95 baseline), red zone (above)
   - Click/drag selection → updates span browser filter
3. Author `feature/dashboard/MetricCards.svelte`:
   - LayerChart sparklines for p50/p95/p99 TTFT, tokens/sec, cache hit rate
   - Each card shows current value + delta from baseline (green/red arrow)

**Verification gate:** `pnpm check` green. Visual: heatmap renders with real span data from DuckDB. Clicking a region filters the span list.

---

### P4 — Span waterfall browser (custom Svelte 5 component)

**Goal:** Drill view. Parent/child nesting, time-proportional bars, attribute detail panel.

1. Author `feature/spans/SpanWaterfall.svelte`:
   - Tree layout: spans nested by parent_span_id, collapsible
   - Each bar: proportional width to duration, color-coded by span kind (inference=teal, ipc=purple, rro=amber)
   - Click span → detail panel slides in
2. Author `feature/spans/SpanDetail.svelte`:
   - All wide-event attributes: `devpulse.termination_reason`, `devpulse.vram_start_mb`, `devpulse.vram_end_mb`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `devpulse.cache_hit`, etc.
   - JSON raw view toggle for power users
3. Wire to DuckDB query: `SELECT * FROM spans WHERE trace_id = ? ORDER BY start_time_unix_nano`

**Verification gate:** `pnpm check` green. Visual: waterfall renders for a real trace. Parent/child stitching works across flume boundaries (proves Envelope<T> instrumentation).

---

### P5 — Baseline manager

**Goal:** Establish, compare, flag regressions. Pure DuckDB SQL, no external deps.

1. Author `feature/baselines/BaselineManager.svelte`:
   - Table of active baselines: name, model_sha, established date, sample count, p50/p95/p99
   - "Establish Baseline" button: calls `set_baseline(name, sample_count)` → snapshots current rolling percentiles into a named DuckDB table
   - Regression indicator: current p95 > baseline p99 → red flag with regression ratio
   - Delete / rename baseline
2. Author DuckDB queries in `telemetry.service.ts`:
   - Rolling percentiles: `QUANTILE_CONT([0.5, 0.95, 0.99]) WITHIN GROUP (ORDER BY duration_ns)`
   - Regression detection: `SELECT current.p95 / baseline.p95 AS regression_ratio`
   - Z-score anomaly: `(value - AVG(value) OVER w) / STDDEV(value) OVER w > 3.0`

**Verification gate:** `pnpm check` green. Visual: baseline established, regression detected on a synthetic slow request, red flag appears.

---

### P6 — Telemetry config panel

**Goal:** Configure OTel file exporter, histogram boundaries, retention, lane tracing.

1. Author `feature/config/TelemetryConfig.svelte`:
   - Toggle: OTLP file exporter on/off
   - Toggle: DuckDB span sink on/off
   - Input: histogram bucket boundaries (editable array)
   - Input: retention policy (keep N session files, default 7)
   - Input: baseline regression threshold (default 1.2 = 20%)
   - Lane tracing presets (Off / Standard / Debug) — either cross-link existing lanes tab or consolidate here
2. All config changes → Tauri IPC → Rust `devpulse-telemetry` runtime config, persisted to TOML
3. Compose `TelemetryConfig` into `PlatformConfig` so the main Config Inspector tab shows it

**Verification gate:** `pnpm check` green. Config changes persist across app restart. Main Config Inspector reflects telemetry section.

---

### P7 — DevTools overview card + polish

**Goal:** The Telemetry card on the DevTools overview grid is a live mini-dashboard, not a dead link.

1. Update the Telemetry card on `/devtools` overview:
   - Live p95 TTFT value (LayerChart sparkline)
   - Baseline status: green checkmark or red regression indicator
   - Click → navigates to `/devtools/telemetry`
2. Set retention policy on DuckDB span data (7-day rolling, baselines permanent).
3. Visual polish: ColdLight presets on all components, match the glass/glow/bevel aesthetic of the rest of the app.

**Verification gate:** `pnpm check` green. `pnpm build` green. Visual: devtools overview shows live telemetry card with real data.

---

## Critical Path

```
SPRINT-TELEMETRY-FOUNDATION P4 (wire init_early)
  → OTel spans flow to OTLP JSONL + existing DuckDB layer
    → P1 here (frontend domain scaffold)
      → P2 (extend IPC commands for histogram/baseline/config)
        → P3-P7 (visualization + config)
```

**Minimum viable devtool:** P1 + P2 + existing lane tracing UI. The pattern is established even before heatmaps/waterfalls land.

## Definition of Done

- [ ] `/devtools/telemetry` route with 4 tabs: Dashboard | Spans | Baselines | Config
- [ ] Telemetry card on DevTools overview grid with live p95 + baseline status
- [ ] `src/lib/domains/infra/telemetry/` follows Nx library-types (feature/ui/data-access/util)
- [ ] Mosaic vgplot heatmap renders real TTFT data from DuckDB
- [ ] Custom span waterfall shows parent/child nesting across flume boundaries
- [ ] Baseline management: establish, compare, regression detection — pure DuckDB SQL
- [ ] Telemetry config persists to TOML, composes into PlatformConfig
- [ ] All visualizations respond <100ms per interaction
- [ ] ColdLight visual system applied (no library-default styling)
- [ ] `pnpm check` + `pnpm build` green
- [ ] Handoff: document the "one devtool per capability" pattern for future infra crates

---

## Out of scope

- Devtools for other infra crates (config, health, ipc) — follow same pattern, separate sprints
- Metrics pipeline / Prometheus / Grafana
- Multi-user or network-accessible dashboards
- Perspective data grid (optional power-user feature, defer)
- CrabNebula DevTools integration (complementary, separate evaluation)

## References

- Memory: `project_devtools_telemetry_spec.md`
- Existing devtools: `interfaces/desktop/src/routes/(devtools)/devtools/+page.svelte`
- Mosaic: github.com/uwdata/mosaic
- LayerChart: github.com/techniq/layerchart
- Teley trace viewer: github.com/logaretm/teley
- Honeycomb BubbleUp: honeycomb.io/platform/bubbleup
- vLLM metrics model: docs.vllm.ai/en/latest/design/metrics/
- DuckDB window functions: duckdb.org/2021/10/13/windowing
- Anofox anomaly detection: github.com/DataZooDE/anofox-tabular
- CrabNebula DevTools: github.com/crabnebula-dev/devtools
- Evil Martians devtools anti-patterns: evilmartians.com/chronicles/six-things-developer-tools-must-have
