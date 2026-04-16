# SPRINT-TELEMETRY-FOUNDATION

> **Status:** PLANNED — awaiting execution green-light
> **Authored:** 2026-04-15
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

### P1 — Crate scaffold + workspace wiring

**Goal:** two empty-but-valid crates exist under `systems/infra/`, workspace glob picks them up, `cargo check --workspace` passes.

1. Create `systems/infra/` directory (grouping only, not a crate).
2. Create `systems/infra/devpulse-telemetry/`:
   - `Cargo.toml` with package metadata tag `[package.metadata.devpulse] layer = "infra"`
   - `src/lib.rs` stub with module tree
   - `src/prelude.rs` empty
3. Create `systems/infra/devpulse-telemetry-macros/`:
   - `Cargo.toml` with `proc-macro = true`
   - `src/lib.rs` stub
4. Update workspace `Cargo.toml` `[workspace] members` to include `"systems/infra/*"`.
5. Update `[workspace.dependencies]` with OTel 0.31 pin set (see doctrine).
6. Add telemetry crates as deps of `systems/devpulse-engine` and `interfaces/desktop/src-tauri` at workspace level (no usage yet).
7. Verify: `cargo check --workspace` green. `cargo tree -p devpulse-telemetry` shows correct deps.

**Verification gate:** `cargo check --workspace` zero errors. Branch does not regress existing `cargo check -p devpulse_desktop_backend`.

---

### P2 — Clippy lockdown + `Envelope<T>` + spawn wrappers + channel wrappers

**Goal:** foundational primitives authored, raw footguns banned workspace-wide. This is THE highest-leverage phase.

1. Author `devpulse-telemetry/src/channel/envelope.rs` — `struct Envelope<T> { cx: opentelemetry::Context, payload: T }`. Constructor captures `Context::current()`. Accessor returns `Traced<T>` RAII guard.
2. Author `devpulse-telemetry/src/channel/flume.rs` — `TracedSender<T>`, `TracedReceiver<T>`, `unbounded::<T>()`, `bounded::<T>(n)`. Wraps `flume::{Sender, Receiver}`. `send()` wraps payload in `Envelope`; `recv_async()` returns `Traced<T>`.
3. Author `devpulse-telemetry/src/channel/broadcast.rs` — `BroadcastSender<T>`, `BroadcastReceiver<T>`, `channel::<T>(n)`. Wraps `tokio::sync::broadcast`. Receiver uses `SpanBuilder::with_links([envelope.cx])` — NEVER parent/child for fan-out.
4. Author `devpulse-telemetry/src/spawn/tokio.rs` — `pub fn spawn<F>(fut)` wrapping `tokio::spawn(fut.instrument(Span::current()))`. Same for `spawn_blocking`.
5. Author `devpulse-telemetry/src/prelude.rs` — re-export `spawn`, `spawn_blocking`, `TracedSender`, `TracedReceiver`, `BroadcastSender`, `BroadcastReceiver`, `Envelope`, `Traced`, and `tracing::Instrument`.
6. Author workspace-root `clippy.toml` with:
   - `disallowed-methods`: `tokio::spawn`, `tokio::task::spawn`, `tokio::task::spawn_blocking`, `opentelemetry::global::shutdown_tracer_provider`
   - `disallowed-types`: `flume::Sender`, `flume::Receiver`, `tokio::sync::broadcast::Sender`, `tokio::sync::broadcast::Receiver`
7. Add `#![allow(clippy::disallowed_methods, clippy::disallowed_types)]` at the file level of `channel/flume.rs`, `channel/broadcast.rs`, `spawn/tokio.rs` — the ONLY places in the workspace allowed to touch the raw primitives.
8. Author unit tests: `tests/channel_context.rs` (verifies parent context survives flume hand-off), `tests/spawn_instrumentation.rs` (verifies `tokio::spawn` child inherits parent span).

**Verification gate:** `cargo check -p devpulse-telemetry` green. `cargo test -p devpulse-telemetry` green. `cargo clippy --workspace -- -D clippy::disallowed_methods -D clippy::disallowed_types` — **will report ~35 violations across existing code** (10 spawn + 22 flume + 3 broadcast). Those get fixed in P5.

---

### P3 — OTel SDK wiring + TelemetryGuard + file exporter + BufferingProcessor

**Goal:** `init_early()` + `install_exporter()` lifecycle, OTel provider wired, OTLP JSONL file exporter writing to `{data_dir}/telemetry/spans-*.otlp.jsonl` with rotation.

1. Author `devpulse-telemetry/src/boot/buffering_processor.rs` — `BufferingProcessor` holds `VecDeque<SpanData>` in RAM (bounded, e.g. 4096). When inner processor not set, buffer with drop-oldest-on-overflow. When `install_real(processor)` called, drain buffer in order into real processor, then forward live spans.
2. Author `devpulse-telemetry/src/boot/lifecycle.rs`:
   - `init_early() -> TelemetryHandle` — installs `BufferingProcessor`, sets global tracer provider, registers `OpenTelemetryLayer` onto `tracing_subscriber::Registry`, returns handle. **Cannot fail.** Line 1 of `main()`.
   - `install_exporter(handle, data_dir: &Path) -> TelemetryGuard` — builds real OTLP file exporter pointed at rotated JSONL path, wraps in `BatchSpanProcessor`, calls `buffering.install_real(batch)`, returns guard.
   - `TelemetryGuard` holds `TracerProvider`, `MeterProvider`, `LogProvider`. Method `shutdown(self) -> impl Future<Output=()>`. Drop is a no-op + warning log (sync drop loses spans).
3. Author `devpulse-telemetry/src/otel/provider.rs` — `SdkTracerProvider` builder with `service.name`, `service.namespace`, `service.instance.id`, `service.version` resource attributes.
4. Author `devpulse-telemetry/src/otel/exporter_file.rs` — OTLP JSONL file exporter with rotation matching existing `session-*.jsonl` pattern.
5. Author `devpulse-telemetry/src/otel/semconv.rs` — typed constants for `gen_ai.*` (against semconv v1.37) and `devpulse.*` (mirroring `signals.registry.yaml` family names).
6. Unit test: `tests/boot_order.rs` — emit span BEFORE `install_exporter`, verify it lands in the real exporter after install.
7. Unit test: `tests/telemetry_guard_shutdown.rs` — verify `guard.shutdown().await` flushes cleanly; verify drop emits warning.

**Verification gate:** `cargo test -p devpulse-telemetry` green. Manual: run a test harness that emits 10 spans before install + 10 after, verify 20 appear in JSONL file in correct order.

---

### P4 — Move existing DuckDB sinks into `devpulse-telemetry/src/sinks/`

**Goal:** consolidate the existing working substrate into the new crate.

1. **Move** (not copy) the following files:
   - `systems/devpulse-engine/src/platform/telemetry/duckdb_layer.rs` → `systems/infra/devpulse-telemetry/src/sinks/duckdb_layer.rs`
   - `systems/devpulse-engine/src/platform/telemetry/span_writer.rs` → `systems/infra/devpulse-telemetry/src/sinks/span_writer.rs`
   - `systems/devpulse-engine/src/platform/telemetry/lanes.rs` → `systems/infra/devpulse-telemetry/src/sinks/lanes.rs`
2. Delete the now-empty `systems/devpulse-engine/src/platform/telemetry/` directory.
3. Update all import paths in `systems/devpulse-engine` — wherever code referenced `crate::platform::telemetry::*`, change to `devpulse_telemetry::sinks::*` or (preferred) import via `devpulse_telemetry::prelude::*`.
4. No re-exports from old paths. No shims. Pre-release mode.
5. Re-verify: `cargo check -p devpulse-engine` green, `cargo check -p devpulse_desktop_backend` green.
6. Rewrite `interfaces/desktop/src-tauri/src/logging.rs` — it currently wires the three-layer subscriber (stderr + JSON + DuckDB). Make it four-layer: stderr + JSON file + DuckDB (from new crate) + OTel file exporter. All four layered onto one `tracing_subscriber::Registry` installed inside `devpulse_telemetry::init_early()`.

**Verification gate:** `cargo check -p devpulse_desktop_backend` green. `cargo xtask run-dev` boots clean. Existing DuckDB `spans` and `lane_traces` tables still populate (regression test: boot the app, emit a span, query DuckDB).

---

### P5 — Migrate 35 call sites (spawn + flume + broadcast)

**Goal:** zero clippy-disallowed violations in the workspace. Every call site uses `devpulse_telemetry::*`.

Order matters — migrate highest-risk first so any latent bug surfaces early.

1. **`kernel/model-loader/src/backends/bridge.rs`** (17 flume call sites, highest-risk hot spot). Replace `flume::unbounded` / `flume::bounded` with `devpulse_telemetry::channel::{unbounded, bounded}`. Replace `Sender<T>` / `Receiver<T>` type annotations with `TracedSender<T>` / `TracedReceiver<T>`. `.send(payload)` signature unchanged — `Envelope` is built internally. `.recv_async().await` returns `Traced<T>`, so consumers do `let t = rx.recv_async().await?; let payload = t.value;` (the context attaches for the scope of `t`).
2. **`systems/devpulse-media/src/pipeline.rs`** (2 flume call sites).
3. **`systems/devpulse-engine/src/platform/services/audio.rs`** (3 flume call sites).
4. **`systems/devpulse-engine/src/signals/router.rs`** (3 tokio broadcast call sites). Replace `tokio::sync::broadcast::channel(1024)` with `devpulse_telemetry::channel::broadcast::channel(1024)`. Subscribers automatically get `with_links()` fan-out.
5. **All 10 `tokio::spawn` call sites** across the 9 files the audit identified. Replace with `devpulse_telemetry::spawn`. Import via `use devpulse_telemetry::prelude::*;`.
6. After each file: `cargo check -p <owning-crate>` before moving on.

**Verification gate:** `cargo clippy --workspace --all-targets -- -D clippy::disallowed_methods -D clippy::disallowed_types` — zero violations. `cargo check -p devpulse_desktop_backend` green. Integration test: boot the app, exercise a Clyffy inference request, verify span tree crosses kernel→engine→interface boundaries without orphaning.

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
