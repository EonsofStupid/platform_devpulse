//! Candle inference backend — canonical, Rust-native.

#[cfg(feature = "candle-backend")]
pub mod backend;

pub mod siglip;

#[cfg(feature = "candle-backend")]
pub use backend::CandleBackend;

pub use siglip::SigLipVision;
