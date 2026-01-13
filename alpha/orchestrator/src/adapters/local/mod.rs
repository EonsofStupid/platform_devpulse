// orchestrator/src/adapters/local/mod.rs

//! Local adapters - Candle inference, file I/O
//!
//! These adapters run entirely on the local machine:
//! - Candle ML inference (GGUF models)
//! - Local file operations
//! - Local embedding models

mod candle;

pub use candle::CandleAdapter;

use shared::AdapterKind;

/// Marker trait for local adapters
pub trait LocalAdapter {
    fn adapter_kind(&self) -> AdapterKind {
        AdapterKind::Local
    }
}
