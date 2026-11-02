//! Telemetry subsystem — lane tracing for inference pipeline instrumentation.
//!
//! Every hardware execution path (lane) in the inference pipeline can be
//! individually toggled for tracing. Traces are written to `DuckDB` for
//! baseline analysis and regression detection.
//!
//! The `TelemetryHandle` is a clone-friendly runtime handle (not a Service).
//! It lives on `Platform` alongside `FacadeHandle` — same architectural tier.

pub mod duckdb_layer;
pub mod lanes;
pub mod span_writer;
pub mod trace_context;

pub use duckdb_layer::DuckDbLayer;
pub use lanes::TelemetryHandle;
pub use span_writer::{SPAN_CHANNEL_CAPACITY, SpanRecord, SpanTraceWriter};
pub use trace_context::TraceContext;
