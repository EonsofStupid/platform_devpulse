//! Telemetry subsystem — lane tracing for inference pipeline instrumentation.
//!
//! Every hardware execution path (lane) in the inference pipeline can be
//! individually toggled for tracing. Traces are written to DuckDB for
//! baseline analysis and regression detection.
//!
//! The `TelemetryHandle` is a clone-friendly runtime handle (not a Service).
//! It lives on `Platform` alongside `FacadeHandle` — same architectural tier.

pub mod lanes;

pub use lanes::TelemetryHandle;
