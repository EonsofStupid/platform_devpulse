//! # devpulse-telemetry
//!
//! Kitchen-sink observability primitives for the DevPulse workspace.
//!
//! This crate is the sole home for:
//!
//! - Instrumented `spawn` / `spawn_blocking` wrappers that preserve `Span::current()`
//! - `Envelope<T>` context carrier + `TracedSender` / `TracedReceiver` for flume
//! - `BroadcastSender` / `BroadcastReceiver` with automatic `SpanBuilder::with_links()`
//!   fan-out (children-of-broadcast would lie about causality) — P2b
//! - `BufferingProcessor` + `init_early()` / `install_exporter()` boot-order lifecycle — P3
//! - `TelemetryGuard` explicit shutdown (sync `Drop` loses spans on 0.28+) — P3
//! - OTel 0.31 SDK wiring, OTLP JSONL file exporter, DuckDB span sinks — P3/P4
//! - Typed `gen_ai.*` + `devpulse.*` semconv constants — P3
//! - Signals-registry bridge — P6
//!
//! ## Usage
//!
//! ```ignore
//! use devpulse_telemetry::prelude::*;
//!
//! #[tracing::instrument]
//! async fn parent() {
//!     let (tx, rx) = unbounded::<Job>();
//!
//!     // Span-preserving spawn — child task inherits `parent`'s span.
//!     spawn(async move {
//!         let traced = rx.recv_async().await.unwrap();
//!         let (job, _cx_guard) = traced.attach();
//!         // spans emitted here are descendants of `parent`
//!         process(job);
//!     });
//!
//!     tx.send(Job::new()).unwrap();
//! }
//! ```
//!
//! ## Doctrine
//!
//! Every cross-task channel in the workspace carries an
//! `Envelope<T> { cx: opentelemetry::Context, payload: T }`. Raw
//! `tokio::spawn`, `flume::Sender/Receiver`, and
//! `tokio::sync::broadcast::{Sender, Receiver}` are banned workspace-wide via
//! `clippy.toml` `disallowed-methods` / `disallowed-types` (installed in
//! sprint P2b). This crate and its companion `devpulse-telemetry-macros` are
//! the only places in the workspace permitted to touch the raw primitives.
//!
//! See:
//! - ADR: `scripts/docs/adr/ADR-002-TELEMETRY-PRIMITIVES.md`
//! - Sprint: `scripts/docs/sprints/SPRINT-TELEMETRY-FOUNDATION.md`
//! - Memory doctrine: `project_telemetry_crate_doctrine.md`
//!
//! ## Status
//!
//! - **P1** — crate scaffold ✅
//! - **P2a** — `Envelope<T>`, `Traced<T>`, `TracedSender`/`TracedReceiver`, `spawn`/`spawn_blocking` ✅
//! - **P2b** — `BroadcastSender`/`BroadcastReceiver` + workspace clippy.toml ✅
//! - **P3** — OTel SDK wiring, `TelemetryGuard`, `BufferingProcessor`, OTLP file exporter ✅
//! - **P4** — wire `prepare()` into Tauri boot, compose 4-layer subscriber ✅
//! - **P5** — migrate the 35 existing call sites
//! - **P6** — signals-registry bridge
//! - **P7** — `#[devpulse_command]` proc macro
//! - **P8** — preflight + cargo-deny enforcement
//! - **P9** — verification matrix + handoff

#![forbid(unsafe_code)]

pub mod boot;
pub mod channel;
pub mod otel;
pub mod prelude;
pub mod spawn;
