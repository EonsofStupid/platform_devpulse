//! Event bridge — routes model-loader events to consumers.
//!
//! Uses model-loader's `TracingEventSink` for initial integration.
//! Phase 7+ adds Tauri event emission when the desktop wiring is built.

pub use devpulse_clyffy::model_loader::TracingEventSink;

// TODO(Phase 7): Implement TauriEventBridge that emits to frontend.
// The LoaderEventSink trait is Send + Sync, so we can use flume
// to bridge to the Tauri AppHandle which requires async context.
