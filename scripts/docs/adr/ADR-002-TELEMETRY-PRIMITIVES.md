# ADR-002 — Telemetry Primitives & Infra Boundary

- **Status:** ACCEPTED 2026-04-15 — SPRINT-TELEMETRY-FOUNDATION P1 verified green, P2 in progress
- **Date:** 2026-04-15
- **Supersedes:** none
- **Related:** ADR-001 (ColdLight 2-layer architecture), `.claude/rules/ip-protection.md`
- **Sprint:** `scripts/docs/sprints/SPRINT-TELEMETRY-FOUNDATION.md`

---

## Context

DevPulse is a hybrid local-first desktop AI app built on Rust (kernel + engine + systems) + Tauri 2 + SvelteKit 5. The existing observability substrate is a working three-layer `tracing` subscriber (stderr + JSON file + custom DuckDB span layer) living in `systems/devpulse-engine/src/platform/telemetry/`. It serves current needs but has four structural gaps:

1. **No OpenTelemetry SDK wiring.** `signals.registry.yaml` is shaped like OTel semconv but emits directly to DuckDB without the SDK. The signals sprint (`SPRINT-SIGNALS-GOLDEN-PATTERN`) explicitly defers "Full OTel SDK integration" to a later sprint.
2. **Raw `tokio::spawn` everywhere.** 10 call sites workspace-wide. Each is a potential orphaned-span landmine because `tokio::spawn` does not inherit `Span::current()` unless manually `.instrument()`-ed.
3. **Raw `flume` / `tokio::sync::broadcast` channels.** 22 flume sites (17 concentrated in `kernel/model-loader/src/backends/bridge.rs`) and 3 tokio broadcast sites. Channels are opaque to `tracing` — a span on the producer side has no causal relationship to the consumer side unless `opentelemetry::Context` is carried explicitly in the message payload.
4. **No compiler-enforced boundary for foundational platform crates.** Every future infra concern (config, ipc, secrets, health) would have to re-establish discipline manually.

The owner's directive, 2026-04-15: *"foundational first, we are going to do it all regardless, it's just smart to not rush this and do it correct."* Explicitly wants the observability crate to be part of a **hypermodular nested infra boundary** with separate devtools consuming what the infra produces.

April 2026 research confirmed: (a) `opentelemetry-rust` 0.31 is the current stable pin set; (b) `opentelemetry::global::shutdown_tracer_provider()` was **removed** in 0.28 — relying on it silently drops spans; (c) `opentelemetry-otlp` 0.31 ships gRPC-tonic only, reqwest/hyper HTTP exporters dropped; (d) DuckDB community `otlp` extension is the converged local-first read path; (e) Honeycomb/Charity Majors' 2026 guidance is wide-events-over-metrics for AI workloads with a mandatory termination-reason enum on every agent span.

---

## Decision

### D1 — Establish `systems/infra/*` as a hypermodular grouping directory

`infra` is the category, not a crate, not a prefix. Each concern inside is a **separate peer cargo crate** picked up by a workspace glob. Grouping exists on disk; cargo sees a flat member list. First inhabitant: `devpulse-telemetry`. Future siblings: `devpulse-config`, `devpulse-ipc`, `devpulse-secrets`, `devpulse-health`, `devpulse-errors`.

Workspace manifest:
```toml
[workspace]
members = [
    "kernel/devpulse-clyffy",
    "kernel/model-loader",
    "systems/devpulse-engine",
    "systems/devpulse-media",
    "systems/infra/*",
    "interfaces/desktop/src-tauri",
    "xtask",
]
```

**Dependency direction (compiler-enforced):**
- `systems/infra/*` crates may depend on each other.
- `systems/infra/*` crates may **NEVER** depend on `systems/devpulse-engine`, `systems/devpulse-media`, `kernel/*`.
- Every other crate in the workspace may depend on `systems/infra/*`.
- Each infra crate declares `[package.metadata.devpulse] layer = "infra"` for preflight introspection.

### D2 — Author `systems/infra/devpulse-telemetry` as the kitchen-sink observability crate

Single crate owns: boot-order safety (`BufferingProcessor`, `init_early`, `install_exporter`), OTel SDK wiring, OTLP file exporter, instrumented `spawn` wrappers, typed `TracedSender`/`TracedReceiver` channel wrappers, `BroadcastSender`/`BroadcastReceiver` with automatic `with_links()` fan-out, `Envelope<T>` context carrier, DuckDB span layer (moved from `devpulse-engine/platform/telemetry/`), lane tracer (moved), typed `gen_ai` + `devpulse.*` semconv constants, signals-registry-to-OTel bridge. Companion proc-macro crate `systems/infra/devpulse-telemetry-macros` owns `#[devpulse_command]`.

### D3 — Pin OTel 0.31 crate matrix workspace-wide

```toml
[workspace.dependencies]
opentelemetry = "0.31"
opentelemetry_sdk = "0.31"
opentelemetry-otlp = "0.31.1"
tracing-opentelemetry = "0.32"
opentelemetry-semantic-conventions = "0.31"
```

gRPC-tonic only. No HTTP OTLP exporter. `gen_ai.*` attributes pinned against semconv `v1.37` via typed constants module.

### D4 — `Envelope<T> { cx, payload }` is mandatory for every cross-task channel

THE single highest-leverage decision. Retrofitting it after 50 channels exist is impossible; Clyffy's agent-loop instrumentation story dies without it. Enforced by clippy `disallowed-types` banning raw `flume::Sender`/`flume::Receiver`/`tokio::sync::broadcast::Sender`/`tokio::sync::broadcast::Receiver` workspace-wide.

### D5 — `init()` returns a `TelemetryGuard`, never unit

`opentelemetry::global::shutdown_tracer_provider()` is gone in 0.28+. Guard holds `TracerProvider`/`MeterProvider`/`LogProvider`. `guard.shutdown().await` is called explicitly from Tauri `RunEvent::Exit`. Sync `Drop` is a no-op with a warning log because sync drop silently loses spans.

### D6 — Boot-order safety via `BufferingProcessor`

`init_early() -> TelemetryHandle` is line 1 of `main()`, cannot fail, installs a `BufferingProcessor` that holds `VecDeque<SpanData>` in RAM until the real exporter is wired. `install_exporter(handle, data_dir)` drains the buffer into the real `BatchSpanProcessor` + OTLP file exporter when the data directory resolves during `boot_task()`. No span is ever dropped on the boot race.

### D7 — Local sink is OTLP JSONL file exporter → DuckDB `otlp` extension

No gRPC port, no embedded collector, no reqwest. OTLP JSONL written to `{data_dir}/telemetry/spans-*.otlp.jsonl` with rotation mirroring the existing `session-*.jsonl` pattern. DuckDB `otlp` community extension reads on-demand. Fits the "portable .exe, no firewall prompt" constraint.

### D8 — Wide events with mandatory `devpulse.termination_reason` enum

Every Clyffy / minion / inference span carries 50+ high-cardinality attributes. Mandatory fields: `devpulse.termination_reason ∈ {completed, tool_error, timeout, budget_exhausted, user_cancel, parent_cancel, model_refusal}`, `devpulse.vram_start_mb`, `devpulse.vram_end_mb`, `devpulse.model_sha`, `devpulse.prompt_hash`, `devpulse.cache_hit`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.response.finish_reasons`. For a local desktop app where the user IS the deployment, cardinality is free.

### D9 — Make wrong code uncompilable via clippy + cargo-deny + preflight

Workspace `clippy.toml` bans `tokio::spawn`, `tokio::task::spawn`, `tokio::task::spawn_blocking`, `opentelemetry::global::shutdown_tracer_provider`, raw flume channels, raw broadcast channels. `systems/infra/devpulse-telemetry` and `systems/infra/devpulse-telemetry-macros` are the ONLY crates allowed to `#![allow(...)]` these at file level. `cargo-deny` forbids `reqwest` as a transitive feature of `opentelemetry-otlp`. Preflight adds: infra-layer dep direction check, telemetry-init singleton check, semconv string-literal check.

### D10 — Move existing `platform/telemetry/*` into the new crate, no shims

Pre-release mode. `duckdb_layer.rs`, `span_writer.rs`, `lanes.rs` physically move from `systems/devpulse-engine/src/platform/telemetry/` into `systems/infra/devpulse-telemetry/src/sinks/`. All importers update in one commit per crate. No re-exports from old paths. No back-compat.

### D11 — `#[devpulse_command]` proc macro wraps every Tauri IPC command

Adds `#[tracing::instrument]` + standard attrs (`tauri.command.name`, `tauri.window.label`, `gen_ai.*` when applicable). Pattern copied from `tauri-plugin-tracing` (single-maintainer 0.3.x) — **we do not take a dep on that crate.**

### D12 — Devtools are separate consumers, not part of this crate

Baseline viewers, span browsers, lane tracers, config inspectors live in `interfaces/desktop/src/routes/(devtools)/devtools/telemetry/` and `src/lib/domains/infra/telemetry/`. They query DuckDB tables that `devpulse-telemetry` writes. Zero coupling backward. Authored in a follow-up sprint `SPRINT-DEVTOOLS-TELEMETRY`.

---

## Consequences

### Positive

- **One name for telemetry** — `devpulse_telemetry::prelude::*`. Developers stop hunting for primitives.
- **Compiler enforces doctrine** — wrong code doesn't compile. New contributors cannot accidentally orphan a span.
- **OTel-ready without OTel-coupled** — when Grafana/Honeycomb/Jaeger become relevant (multi-machine, cloud), point the exporter elsewhere — zero code changes outside the crate.
- **Infra boundary scales to future concerns** — `devpulse-config`, `devpulse-ipc`, `devpulse-secrets` land in the same directory with the same rules, automatically.
- **Existing working substrate preserved** — DuckDB span layer / lane tracer keep working; OTel is additive, not replacement.
- **Clyffy agent-loop traces stitch end-to-end** — `Envelope<T>` makes parent/child span relationships survive every flume hop.
- **Boot-order race closed forever** — `BufferingProcessor` buffers until real exporter is ready. No more silently-dropped startup spans.
- **Shutdown is explicit** — `TelemetryGuard::shutdown().await` in Tauri exit path. No more silent span loss at teardown.

### Negative / costs

- **Migration surface: 35 call sites.** Finite, documented, gated by clippy — no mystery. Most concentrated in one file (`model-loader/bridge.rs`, 17 flume calls).
- **Git history rewrite for 3 files** moved from `devpulse-engine/platform/telemetry/` to `devpulse-telemetry/sinks/`. Pre-release mode tolerates this.
- **Two new crates** (`devpulse-telemetry` + `devpulse-telemetry-macros`) add ~30s to clean builds. Acceptable — workspace already has 15+ crates.
- **Contributors must learn `devpulse_telemetry::prelude::*`** instead of `tokio::spawn`. Clippy error message names the replacement — learning cost is near zero.
- **Proc macro crate discipline** — proc macros can't be regular lib crates, must be separate. Adds one more directory.
- **`gen_ai` semconv is still experimental** — will require a constant flip when it stabilizes. Mitigated by centralizing constants in one module (D3).

### Neutral

- Devtools UI is a separate sprint — this ADR's deliverable is the primitive layer only, not the user-facing inspector.
- Metrics pipeline (as opposed to traces) is deferred — crate scaffolds `MeterProvider` but product-metric wiring is a follow-up.

---

## Alternatives considered

### A1 — Keep `platform/telemetry/` in `devpulse-engine`, add OTel inline

**Rejected.** Forces every future crate that wants to emit telemetry to depend on `devpulse-engine`, which is a product-layer crate. Inverts the dependency graph. Violates the hypermodular principle the owner explicitly asked for.

### A2 — Flat `systems/devpulse-telemetry/` (no `infra/` grouping directory)

**Rejected.** Community default per matklad's "Large Rust Workspaces." Cargo-valid, simpler. But the owner's architectural intent is explicitly hypermodular nested grouping — and the grouping pays off the moment `devpulse-config` / `devpulse-ipc` / `devpulse-secrets` land. Research confirmed: nested *directories* under a single workspace root via globs are cargo-valid; only nested *workspaces* (multiple `Cargo.toml` roots) are broken.

### A3 — One `devpulse-infra` monolith crate with `telemetry`/`config`/`ipc` as modules

**Rejected.** Destroys compile-time enforcement of concern boundaries. If it's in one crate, any module can import any other module, and the "telemetry has no dep on config" rule becomes discipline instead of a compile error. Violates the "make wrong code uncompilable" principle.

### A4 — Keep `tokio::broadcast` / `flume` raw, rely on `tracing::Span::current()` alone

**Rejected.** `Span::current()` is task-local and does NOT survive channel hand-offs. Producer's span has no causal link to consumer's span unless `opentelemetry::Context` is explicitly carried. Research source (verbatim): *"Everything else can be retrofitted incrementally. Channel context propagation cannot — once 50 channels exist without it, you will never get spans to stitch across flume boundaries, and Clyffy's whole agent-loop instrumentation story collapses into disconnected span fragments. Lock this on day one."*

### A5 — Embed the OpenTelemetry Collector binary in Tauri

**Rejected.** `opentelemetry-collector` is a Go binary, huge, AV-triggering, not portable. Docker Desktop's pattern is irrelevant to a portable `.exe`. DuckDB IS the local observability store.

### A6 — Use `fastrace` (databend) instead of `tracing`

**Deferred.** 10-100× faster in microbenchmarks but tiny ecosystem. `tracing` is what every crate in the Rust universe instruments against. Re-evaluate only if Candle hot-loop profiling proves `tracing` overhead matters. If it does, `fastrace` can be adopted behind the same `devpulse-telemetry` facade without touching call sites — another reason for the kitchen-sink wrapper.

### A7 — Take a dep on `tauri-plugin-tracing`

**Rejected.** Single-maintainer, 0.3.x, not Tauri-team blessed. Copy the pattern into our own `#[devpulse_command]` proc macro; own the surface area.

### A8 — Sync `shutdown_tracer_provider()` in `Drop`

**Rejected.** Silently drops spans. Also: the function was removed in `opentelemetry` 0.28+ — it is a compile error to call it on 0.31. `TelemetryGuard::shutdown().await` is mandatory; sync drop is a no-op with a warning log.

---

## Enforcement

| Rule | Mechanism | Sprint phase |
|---|---|---|
| Infra layer dep direction | cargo + `cargo-deny` + preflight `check.infra-layer-deps.ts` | P1, P8 |
| No raw `tokio::spawn` | clippy `disallowed-methods` | P2, P5, P8 |
| No raw flume / broadcast | clippy `disallowed-types` | P2, P5, P8 |
| No `shutdown_tracer_provider()` | clippy `disallowed-methods` | P2, P8 |
| No `reqwest` OTLP exporter | `cargo-deny` feature-forbid | P8 |
| Single `tracing_subscriber::registry()` | preflight grep `check.telemetry-init-singleton.ts` | P8 |
| No inline `"gen_ai.*"` strings | preflight grep `check.semconv-string-literals.ts` | P8 |
| `Envelope<T>` on every cross-task channel | enforced by the type wrappers themselves — raw types are banned | P2, P5 |

All mechanisms wire into lefthook `pre-commit` + CI gate.

---

## Execution

Driven by `scripts/docs/sprints/SPRINT-TELEMETRY-FOUNDATION.md` — 9 phases, explicit interleave with `SPRINT-SIGNALS-GOLDEN-PATTERN` (only phase P6 blocks on signals P3; everything else runs in parallel). No code until this ADR is accepted.

---

## Open questions

None — all structural questions resolved prior to authoring this ADR. If new questions surface during execution, they become sprint-scoped decision points (per `.claude/rules/preflight.md`) and are logged back to this ADR as addenda.

---

## Acceptance checklist

- [ ] Owner accepts D1–D12
- [ ] Sprint SPRINT-TELEMETRY-FOUNDATION begins execution
- [ ] ADR status flipped from PROPOSED → ACCEPTED on sprint P1 merge
- [ ] ADR status flipped from ACCEPTED → IMPLEMENTED on sprint P9 completion
- [ ] `.claude/rules/telemetry-primitives.md` authored referencing this ADR
