//! Candle inference backend — canonical, Rust-native.

#[cfg(feature = "candle-backend")]
pub mod backend;

#[cfg(feature = "moshi-sts")]
pub mod moshi;

pub mod siglip;

#[cfg(feature = "candle-backend")]
pub use backend::CandleBackend;

#[cfg(feature = "moshi-sts")]
pub use self::moshi::MoshiStsBackend;

pub use siglip::SigLipVision;
