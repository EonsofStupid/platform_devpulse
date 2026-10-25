// shared/src/types/ld.rs

//! Linked Data (YAML-LD) Support
//!
//! Defines the logic for self-describing data types.
//! Every persistent entity must implement LinkedData.

#[allow(unused_imports)]
use serde::{Deserialize, Serialize}; // For future LinkedData implementations

/// The Base Trait for all YAML-LD objects in DevPulse
/// Ensures every persistent object self-identifies.
pub trait LinkedData {
    fn context(&self) -> &'static str;
    fn type_name(&self) -> &'static str;
}
