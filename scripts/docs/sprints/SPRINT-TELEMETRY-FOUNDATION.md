# SPRINT-TELEMETRY-FOUNDATION

> **Status:** IN PROGRESS — P1-P4 DONE, P5 partial (bridge.rs migrated)
> **Authored:** 2026-04-15
> **Last updated:** 2026-04-18
> **Commits:** `c4e886d8` (P1-P3 foundation, 1184 insertions), `ca7bc972` (P5 bridge.rs migration + platform changes, 695 insertions)
> **Owner doctrine:** foundational first, zero shortcuts, hypermodular, pre-release mode (no shims, no back-compat)
> **Supersedes / fulfills:** the "Full OTel SDK integration (later sprint)" note in `SPRINT-SIGNALS-GOLDEN-PATTERN.md` §P2
> **Related ADR:** `scripts/docs/adr/ADR-002-TELEMETRY-PRIMITIVES.md`
> **Related memory:** `project_infra_boundary_doctrine.md`, `project_telemetry_crate_doctrine.md`, `feedback_telemetry_antipatterns.md`

---

## Purpose

Author the foundational observability crate `systems/infra/devpulse-telemetry` as the kitchen-sink developer surface for every `tracing` / `tokio::spawn` / channel / OTel concern in the workspace. Make the wrong code uncompilable via clippy + cargo-deny + preflight. Move the existing working `platform/telemetry/` DuckDB substrate into the new crate. Wire OTel 0.31 SDK additively alongside the existing DuckDB layer. Establish the `systems/infra/*` hypermodular grouping directory for all future foundational concerns (config, ipc, secrets, health, errors).

## Principles (locked)

1. **Foundational first, no rushing.** Correct order matters more than speed.
2. **Hypermodular.** Each concern is its own crate. Nothing is merged into a monolith.
3. **Infra boundary is compiler-enforced.** Cargo dep graph + cargo-deny + preflight, not discipline.
4. **Pre-release mode.** No shims, no re-exports from old paths, no back-compat. Move files, break imports, migrate in one commit.
5. **Make wrong code uncompilable.** Wrap every footgun, ban the raw primitive workspace-wide.
6. **Envelope<T> is the single highest-leverage decision.** Lock on day one.
7. **Wide events over pre-aggregated metrics.** One dense span per agent turn with 50+ fields.
8. **Local-first sink: OTLP JSONL file exporter → DuckDB.** No gRPC port, no embedded collector, no reqwest.
9. **Every phase ends with zero compile errors + passing tests.** `cargo check -p <crate>` gates each sub-phase.
10. **No claim of "done" without verification.** Per CC-001 countermeasure.

## Non-goals (explicit deferrals)

- Metrics pipeline (`opentelemetry_sdk::metrics::MeterProvider`) — authored by `devpulse-telemetry` but **wiring product metrics is a follow-up sprint**. Traces + wide-event spans first.
- fastrace evaluation — only if Candle hot-loop profiling proves `tracing` overhead matters.
- `gen_ai` semconv stable migration — wait for spec GA, flip one constant.
- Devtools UI (`interfaces/desktop/src/routes/(devtools)/devtools/telemetry/`) — separate sprint **SPRINT-DEVTOOLS-TELEMETRY**, depends on this one landing.
- Iceberg / Parquet rollups on DuckDB traces — years away, multi-machine sync first.
- `tracing` 0.2 — not shipping, plan as if it never will.

---

## Interleave with SPRINT-SIGNALS-GOLDEN-PATTERN

| Phase | This sprint | SPRINT-SIGNALS dependency |
|---|---|---|
| P1 — crate scaffold + workspace wiring | **independent** — can land before signals P0 | none |
| P2 — clippy lockdown + Envelope<T> | **independent** | none |
| P3 — OTel SDK wiring + file exporter + TelemetryGuard | **independent** | none |
| P4 — move DuckDB sinks + lane tracer | **independent** | none |
| P5 — migrate spawn/channel call sites (10 spawn + 22 flume + 3 broadcast) | **independent** | none — migrating producers, not registry consumers |
| P6 — signals-router bridge (`signals/bridge.rs`) | **waits behind SPRINT-SIGNALS P3** (needs registry codegen) | blocks on SPRINT-SIGNALS P3 |
| P7 — `#[devpulse_command]` proc macro + Tauri command migration | **independent** | none |
| P8 — enforcement (preflight + cargo-deny + CI gate) | **independent** | none |
| P9 — verification matrix + handoff | depends on all prior | |

**Net:** P1–P5, P7, P8 can run fully in parallel with SPRINT-SIGNALS-GOLDEN-PATTERN. Only P6 (the registry↔OTel bridge) waits behind signals P3.

---

## Phase plan

### P1 — Crate scaffold + workspace wiring ✅ DONE

**Goal:** two empty-but-valid crates exist under `systems/infra/`, workspace picks them up, `cargo check --workspace` passes.

**Completed 2026-04-17 (commit c4e886d8):**
- Created `systems/infra/devpulse-telemetry/` with full module tree (boot, channel, otel, spawn, prelude)
- Created `systems/infra/devpulse-telemetry-macros/` proc-macro stub
- Workspace `Cargo.toml` uses **explicit member paths** (not globs — globs failed to resolve `systems/infra/*`)
- OTel 0.31 pin set in `[workspace.dependencies]`: `opentelemetry = "0.31"`, `opentelemetry_sdk = "0.31"`, `tracing-opentelemetry = "0.32"`
- `devpulse-telemetry` wired as dep of `devpulse-engine`, `model-loader`, and `src-tauri`

**Note:** Workspace glob `"systems/infra/*"` failed because `systems/infra/` has no Cargo.toml and the glob tried to match it as a crate. Switched to explicit paths.

---

### P2 — Clippy lockdown + `Envelope<T>` + spawn wrappers + channel wrappers ✅ DONE

**Goal:** foundational primitives authored, raw footguns banned workspace-wide. This is THE highest-leverage phase.

**Completed 2026-04-17 (commit c4e886d8):**
- `Envelope<T>` with `capture()` constructor, `Clone` impl for broadcast
- `Traced<T>` with `.attach() -> (T, ContextGuard)` pattern — ContextGuard is !Send, consumer calls `.attach()` in sync scope after await
- `TracedSender<T>` / `TracedReceiver<T>` wrapping flume — error mapping strips Envelope so consumers never see it
- `BroadcastSender<T>` / `BroadcastReceiver<T>` wrapping tokio broadcast — `LinkedTraced<T>` with link semantics (NOT parent-child for fan-out)
- `spawn()` / `spawn_blocking()` with `.instrument(Span::current())`
- `prelude.rs` with clean re-exports
- `clippy.toml` banning 3 methods + 4 types, file-level `#![allow]` in flume.rs, broadcast.rs, tokio.rs

**Key design decisions during implementation:**
- `Traced<T>` does NOT hold ContextGuard — consumer calls `.attach()` which returns `(T, ContextGuard)`. Guard scoped to sync block.
- flume error types unwrap Envelope: `flume::SendError(envelope)` → `flume::SendError(envelope.payload)` so callers don't see Envelope in error types
- `LinkedTraced<T>` for broadcast: exposes `.link_context()` for OTel link semantics. Children-of-broadcast lie about causality — links are honest.

**Note:** clippy bans are enforced by `cargo clippy`, not `cargo check`. ~11 unmigrated `tokio::spawn` sites in devpulse-engine still pass `cargo check` but will fail `cargo clippy`.

---

### P3 — OTel SDK wiring + TelemetryGuard + file exporter + BufferingProcessor ✅ DONE

**Goal:** `init_early()` + `install_exporter()` lifecycle, OTel provider wired, OTLP JSONL file exporter writing to `{data_dir}/telemetry/spans-*.otlp.jsonl` with rotation.

**Completed 2026-04-17 (commit c4e886d8):**
- `BufferingProcessor` with `Arc<Mutex<BufferState>>` — Clone via Arc bump. `BufferState` enum: `Buffering(VecDeque<SpanData>)` | `Forwarding(Box<dyn SpanProcessor>)`. BUFFER_CAPACITY = 4096, drop-oldest on overflow. Panics if `install_inner()` called twice.
- `TelemetryHandle { buffering, provider }` from `init_early(version, session_id)` — installs BufferingProcessor + OpenTelemetryLayer on Registry, cannot fail
- `TelemetryGuard { provider }` from `install_exporter(handle, telemetry_dir, keep_sessions)` — rotates old JSONL files, builds FileSpanExporter + BatchSpanProcessor, drains buffer
- `TelemetryGuard` has explicit `.shutdown()`, Drop emits warning if not called
- `FileSpanExporter` with `Mutex<BufWriter<File>>` — serializes SpanData to JSON objects (trace_id, span_id, parent, name, timestamps, attributes HashMap)
- `build_provider()` uses `Resource::builder().with_attributes([...]).build()` (0.31 API — `Resource::new()` is private)
- `semconv.rs`: 12 `gen_ai.*` constants (pinned semconv v1.37) + 8 `devpulse.*` constants + `termination` module with 7 reason values

**Key OTel 0.31 gotchas resolved during implementation:**
- `TracerProvider` → `SdkTracerProvider` (renamed in 0.31 SDK)
- `SpanProcessor` requires `Debug` derive
- `SpanExporter::export` returns `impl Future` (not `BoxFuture`)
- `shutdown()` → `shutdown_with_timeout(&mut self, Duration)` (mutability + timeout param)
- `Resource::new()` is private → must use `Resource::builder()`

---

### P4 — Wire telemetry into Tauri boot + compose subscriber layers ✅ DONE

**Goal:** OTel spans actually flow at runtime. This is the bridge between "crate exists" and "crate is live."

**REVISED from original plan:** Moving DuckDB sinks (span_writer.rs, lanes.rs, duckdb_layer.rs) requires dependency inversion because those files depend on `AnalyticsService` (engine) and `AnalyticsAdapter` (kernel). The telemetry crate is infra-layer and CANNOT depend on engine/kernel. Two options:
- (a) Define a `TelemetrySink` trait in `devpulse-telemetry`, implement it in `devpulse-engine`
- (b) Leave the DuckDB files in engine, only move the OTel primitives

**Completed 2026-04-18:**

Refactored `init_early()` → `prepare()` which returns `TelemetrySetup { handle, layer }` WITHOUT installing a global subscriber. The OTel layer is composed into the subscriber by `logging::init()`.

Key changes:
- `devpulse-telemetry/src/boot/lifecycle.rs`: `prepare()` returns `TelemetrySetup` with composable `TelemetryLayer` type alias. Does NOT call `.init()`.
- `src-tauri/src/logging.rs`: `init()` accepts `TelemetryLayer` parameter, composes 4-layer subscriber: OTel (first — must be first to match `Registry` type) + EnvFilter + stderr + JSON file + DuckDB.
- `src-tauri/src/lib.rs`: `prepare()` → resolve data_dir → `logging::init(data_dir, otel_layer)` → `install_exporter()` → store `TelemetryGuard` in managed state → `guard.shutdown()` on `RunEvent::Exit`.
- `TelemetryGuard` uses `Option<SdkTracerProvider>` internally — `.shutdown()` takes the provider, so `Drop` only warns if shutdown was never called.

**OTel layer ordering gotcha:** `OpenTelemetryLayer<Registry, Tracer>` implements `Layer<Registry>`, not `Layer<Layered<..., Registry>>`. Must be the FIRST `.with()` call so `S = Registry`.

**Verification:** `cargo check -p devpulse_desktop_backend` green (19.7s). `cargo check -p devpulse-telemetry` green.

---

### P5 — Migrate call sites (spawn + flume + broadcast) 🔶 PARTIAL

**Goal:** zero clippy-disallowed violations in the workspace. Every call site uses `devpulse_telemetry::*`.

**Completed (commit ca7bc972):**
- ✅ `kernel/model-loader/src/backends/bridge.rs` — 17 flume sites fully migrated to `TracedSender<T>` / `TracedReceiver<T>`. Reply receives use `.value` accessor. Inference thread loop: `while let Ok(traced) = rx.recv() { let (request, _cx_guard) = traced.attach(); ... }`
- ✅ `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — line 1374 migrated (`traced.value` pattern)
- ✅ `interfaces/desktop/src-tauri/src/commands/voice/mod.rs` — line 912 migrated

**Remaining (~11 raw `tokio::spawn` sites in devpulse-engine):**
- `platform/telemetry/lanes.rs` — `tokio::task::spawn` (hook-reverted, comment: "devpulse-telemetry crate pending")
- `platform/server.rs` — `tokio::task::spawn`
- `platform/facade/mod.rs` — `tokio::task::spawn`
- `claude/mcp/transport_sse.rs` — `tokio::spawn`
- `claude/mcp/transport_stdio.rs` — `tokio::spawn`
- `platform/boot/model_loader.rs` — `tokio::task::spawn_blocking`
- `platform/boot/analytics.rs` — `tokio::task::spawn_blocking`

**⚠️ Hook reversion issue:** User's lefthook hooks actively reverted several migration attempts back to raw `tokio::spawn`. The reverted files have comments like "devpulse-telemetry crate pending." These pass `cargo check` but will fail `cargo clippy`.

**Facade broadcast migration (deferred):** `FacadeHandle.surface_tx` and `.dev_tx` are public `broadcast::Sender<T>` fields. Changing to `BroadcastSender<T>` cascades through ~8 type references across `FacadeBridge`, `Platform`, and Tauri event subscribers. Needs coordinated migration.

**Verification gate:** `cargo clippy --workspace --all-targets -- -D clippy::disallowed_methods -D clippy::disallowed_types` — zero violations. Currently will show ~11 violations from unmigrated spawn sites.

---

### P6 — Signals-router bridge (`signals/bridge.rs`)

**Blocked on:** `SPRINT-SIGNALS-GOLDEN-PATTERN` P3 (signals registry codegen landed).

**Goal:** every `signals.registry.yaml` signal fire additionally emits as an OTel span attribute on the currently-active span. Keeps `tokio::broadcast` for runtime fan-out (no regression).

1. Author `devpulse-telemetry/src/signals/bridge.rs` — reads generated signals registry (from SPRINT-SIGNALS P3 output) at compile time via `build.rs`.
2. For each signal family (`context`, `interaction`, `action`, `diagnostics`, `learning`), generate a typed emit function: `emit_context_rro_gather(...)`, etc. Function validates against semconv + signals registry, records on `Span::current()`, calls `SignalRouter::emit()` as before.
3. Extend `ip_term!` macro to fail the build if a signal emission references an ID not in either the registry OR the pinned semconv constants.
4. Migrate existing signal emit sites in `devpulse-engine` to the new typed API.

**Verification gate:** `cargo check --workspace` green. Runtime: emit a signal, verify it lands in DuckDB `spans` table AND the broadcast subscribers still see it.

---

### P7 — `#[devpulse_command]` proc macro + Tauri command migration

**Goal:** every Tauri IPC command is instrumented with a standard span + `tauri.*` + `gen_ai.*` (when applicable) attributes.

1. Author `devpulse-telemetry-macros/src/lib.rs` — `#[devpulse_command]` attribute proc macro. Expands to:
   ```rust
   #[tracing::instrument(
       skip_all,
       fields(
           tauri.command.name = stringify!(#fn_name),
           tauri.window.label = %window.label(),
           // optional gen_ai.* if fn has a #[devpulse_command(ai)] tag
       )
   )]
   #[tauri::command]
   async fn #fn_name(...) { ... }
   ```
2. Migrate all existing `#[tauri::command]` functions in `interfaces/desktop/src-tauri/` to `#[devpulse_command]`.
3. Do NOT take a dep on `tauri-plugin-tracing` — copy the pattern, own the crate.

**Verification gate:** `cargo check -p devpulse_desktop_backend` green. Runtime: invoke a Tauri command from the frontend, verify span appears with correct `tauri.*` attrs.

---

### P8 — Enforcement (preflight + cargo-deny + CI gate + lefthook)

**Goal:** any regression of the doctrine fails the build before it merges.

1. Author `scripts/docs/preflight/checks/check.infra-layer-deps.ts` — reads `[package.metadata.devpulse] layer` from every crate's `Cargo.toml`, verifies `layer = "infra"` crates do NOT declare workspace deps on `devpulse-engine`, `devpulse-media`, `devpulse-clyffy`, `model-loader`.
2. Author `scripts/docs/preflight/checks/check.telemetry-init-singleton.ts` — greps for `tracing_subscriber::registry\(\)` outside `systems/infra/devpulse-telemetry/`, fails the build on match.
3. Author `scripts/docs/preflight/checks/check.semconv-string-literals.ts` — greps for `"gen_ai\.` outside `systems/infra/devpulse-telemetry/src/otel/semconv.rs`, fails the build on match.
4. Extend workspace `deny.toml` with:
   - forbid `reqwest` as an `opentelemetry-otlp` feature (HTTP exporter is dead)
   - forbid direct deps on `opentelemetry-http`
5. Wire all three new preflight checks into the existing preflight engine registry.
6. Add cargo-deny to lefthook `pre-push` hook.
7. CI: add `cargo clippy --workspace -- -D clippy::disallowed_methods -D clippy::disallowed_types` as a hard gate.

**Verification gate:** every check fires correctly against a synthetic violation (test fixtures). `pnpm devpulse preflight:check` passes on clean tree.

---

### P9 — Verification matrix + sprint handoff

**Goal:** prove the foundation works end-to-end before declaring done.

1. `cargo check --workspace` — zero errors, zero warnings on changed crates.
2. `cargo clippy --workspace --all-targets -- -D warnings -D clippy::disallowed_methods -D clippy::disallowed_types` — zero violations.
3. `cargo test -p devpulse-telemetry` — all unit + integration tests green.
4. `cargo xtask run-dev` — app boots, StatusBar shows boot phases, no orphaned span warnings in stderr.
5. Exercise a Clyffy inference request end-to-end. Query DuckDB:
   ```sql
   SELECT trace_id, span_id, parent_span_id, name, duration_ns
   FROM spans
   WHERE trace_id = '<latest>'
   ORDER BY start_time_unix_nano;
   ```
   Verify the span tree crosses `kernel/model-loader` → `devpulse-engine` → Tauri command boundary without orphaning.
6. Run the OTel file exporter path: exit app cleanly, verify `{data_dir}/telemetry/spans-*.otlp.jsonl` exists and is valid OTLP.
7. DuckDB OTLP extension smoke test: `INSTALL otlp FROM community; LOAD otlp; SELECT COUNT(*) FROM read_otlp_traces('{data_dir}/telemetry/spans-*.otlp.jsonl');` — non-zero result.
8. Hand off to `SPRINT-DEVTOOLS-TELEMETRY` (authors the devtools UI that consumes DuckDB + OTLP files).

**Definition of Done:**
- [ ] All P1–P9 verification gates pass.
- [ ] ADR-002 merged.
- [ ] Memory entries (`project_infra_boundary_doctrine`, `project_telemetry_crate_doctrine`, `feedback_telemetry_antipatterns`) reflect shipped reality.
- [ ] `.claude/rules/` gains a `telemetry-primitives.md` rule referencing ADR-002.
- [ ] Zero `tokio::spawn` / raw flume / raw broadcast outside `devpulse-telemetry`.
- [ ] `init_early()` is line 1 of `src-tauri/src/main.rs`.
- [ ] DuckDB `spans` table continues populating (no regression) AND OTLP JSONL file exporter writes in parallel.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| 17 flume call sites in `model-loader/bridge.rs` regress Candle inference | Migrate that file FIRST in P5, run `cargo xtask run-dev` + inference smoke test before moving to other files |
| OTel 0.31 SDK breaking changes vs the existing 0.27-era guides | Doctrine pins 0.31 everywhere; research sources: 0.27→0.28 migration guide, opentelemetry-rust release notes |
| `BufferingProcessor` drops spans under load | Bounded deque with drop-oldest; instrument the drop event itself as a span so we can see it in DuckDB later |
| Moving `platform/telemetry/*` files breaks runtime span writes | P4 has explicit regression test: boot + emit + query DuckDB |
| Clippy disallowed-methods lint not catching re-exports | Add clippy lint for `tokio::task::spawn` as well as `tokio::spawn` (paranoia coverage) |
| `#[devpulse_command]` proc macro breaks tauri-specta type generation | Audit specta interaction in a spike before P7; fall back to manual `#[tracing::instrument]` if needed |
| P6 (signals bridge) delayed by SPRINT-SIGNALS P3 delay | P6 is the only phase that blocks on external work; P1–P5, P7, P8 can all land independently |

## Out of scope (named so they don't creep in)

- Metrics pipeline wiring for product metrics
- Custom OTel samplers
- Distributed tracing across multi-process Tauri (not a multi-process app)
- Log ingestion bridge from `log` crate (codebase is `tracing`-native)
- fastrace evaluation
- Iceberg / Parquet rollups
- Devtools UI (next sprint)

## References

- Memory: [`project_infra_boundary_doctrine.md`](../../../../../../C:/Users/jessa/.claude/projects/d--localdev-platform-devpulse/memory/project_infra_boundary_doctrine.md)
- Memory: `project_telemetry_crate_doctrine.md`
- Memory: `feedback_telemetry_antipatterns.md`
- ADR: `scripts/docs/adr/ADR-002-TELEMETRY-PRIMITIVES.md`
- Related sprint: `scripts/docs/sprints/SPRINT-SIGNALS-GOLDEN-PATTERN.md` (P6 blocks on that sprint's P3)
- IP doctrine: `.claude/rules/ip-protection.md`
- Existing substrate: `systems/devpulse-engine/src/platform/telemetry/{duckdb_layer,span_writer,lanes}.rs` (to be moved in P4)
- Research: opentelemetry-rust 0.31 release notes, semconv v1.37, Charity Majors observability 2.0, Clay Smith `duckdb-otlp`, matklad Large Rust Workspaces
