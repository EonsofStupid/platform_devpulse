// engine/src/signals/mod.rs

//! Signal architecture - compile-time dispatch
//!
//! # Atomic Signal Contract
//!
//! Every signal MUST have:
//! 1. **Identity** - `id: Uuid`
//! 2. **Causality** - `correlation_id: Option<Uuid>`
//! 3. **Temporality** - `timestamp: u64`
//! 4. **Provenance** - `source: SignalSource`
//! 5. **Payload** - `Arc<SignalVariant>`
//!
//! # Factory Pattern (Mandatory)
//!
//! ```ignore
//! // Root signal (new chain)
//! let signal = Signal::new(SignalSource::User, variant);
//!
//! // Chained signal (reaction)
//! let response = Signal::caused_by(&parent, variant);
//! ```
//!
//! # Architecture
//!
//! ```text
//! Engine                          Subscribers
//! ──────                          ───────────
//! router.emit(signal)
//!     │
//!     │  Signal { header, Arc<payload> }
//!     │  broadcast_tx.send()
//!     │
//!     └────────┬──────────────────────────┐
//!              │                          │
//!              ▼                          ▼
//!          Desktop                   Conduit
//!          (UI updates)              (sink processing)
//! ```

mod kinds;
mod payloads;
mod processor;
mod router;
mod signal;
pub mod sinks;
mod variants;

// Re-export public API
pub use kinds::SinkKind;
pub use processor::SignalProcessor;
pub use payloads::{
    AnalyticsEvent, AnalyticsPayload, ChatPayload, ContextPayload, DebugLevel, DebugPayload,
    InferencePayload, Role,
    // Rumination payloads
    RuminationEvent, RuminationLayer, RuminationPayload, ThoughtNodePayload,
    // System payloads
    SystemPayload,
    // Diagnostic payloads (model loading observability)
    DiagnosticPayload, DiagnosticEvent, HealthStatus,
    // Voice payloads (STT/TTS observability)
    VoicePayload, VoiceEvent,
};
pub use router::SignalRouter;
pub use signal::{current_time_millis, Signal, SignalHeader, SignalSource};
pub use variants::SignalVariant;
