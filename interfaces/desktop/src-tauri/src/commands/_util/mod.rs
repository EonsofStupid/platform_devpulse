//! Shared command helpers — time, image encoding, classified errors.
//!
//! Every Tauri command in `commands/` should reach for these instead of
//! hand-rolling an equivalent. The leading underscore in `_util` keeps
//! the dir at the top of the alphabetical listing in editors and signals
//! "infrastructure, not a feature module."

pub mod error;
pub mod image;
pub mod time;

pub use error::{CommandError, ErrorKind};
pub use image::{data_url, encode_jpeg, encode_png};
pub use time::{now_iso, now_ms};
