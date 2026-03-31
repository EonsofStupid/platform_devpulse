//! Candle inference backend — canonical, Rust-native.

#[cfg(feature = "candle-backend")]
pub mod backend;

#[cfg(feature = "candle-backend")]
pub use backend::CandleBackend;
