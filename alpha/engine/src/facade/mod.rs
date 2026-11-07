// engine/src/facade/mod.rs

//! Facade layer - clean API for consumers
//!
//! The facade pattern provides a simplified interface to the complex
//! orchestrator subsystem. Benefits:
//!
//! 1. **Decoupling**: Desktop doesn't know about orchestrator internals
//! 2. **Graceful degradation**: If AI fails, facade returns stubs
//! 3. **Single entry point**: All features accessed through Engine
//!
//! ```text
//! Desktop → Engine (facade) → Orchestrator
//!              ↓
//!         Stub mode if AI not ready
//! ```

mod chat;
mod diagnostics;
mod discovery;
mod github;
mod models;
mod persona;
mod adapters;
mod reasoning;
mod voice;
mod voice_discovery;

pub use chat::{ChatFacade, ChatResponse, Message, Role};
pub use diagnostics::DiagnosticEvent;
pub use discovery::DiscoveryFacade;
pub use github::{GitHubFacade, GitHubPushPayload};
pub use models::ModelFacade;
pub use persona::PersonaFacade;
pub use adapters::{ActiveAdapter, AdapterFacade};
pub use reasoning::{ReasoningChunk, ReasoningConfig, ReasoningFacade, ReasoningResult};
pub use voice::{TtsResult, VoiceFacade};
pub use voice_discovery::VoiceDiscoveryFacade;
