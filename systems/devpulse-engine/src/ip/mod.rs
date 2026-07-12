//! IP protection vocabulary layer.
//!
//! Provides the `ip_term!()` macro that remaps internal kernel terminology
//! to public-safe equivalents in engine builds.
//!
//! - `kernel` feature: terms pass through unchanged (full internal detail)
//! - `engine` feature: terms are remapped via the dictionary generated from
//!   `ip/kernel_terms.toml` at compile time
//!
//! # Usage
//! ```ignore
//! use devpulse_engine::ip_term;
//!
//! let label = ip_term!("GUARDIAN");
//! // kernel build: "GUARDIAN"
//! // engine build: "Quality Check"
//! ```

pub mod redaction;

use std::collections::HashMap;

// ═══════════════════════════════════════════════════════════════
// Engine builds: static vocabulary for hot-path ip_term!() lookup
// ═══════════════════════════════════════════════════════════════

/// Engine vocabulary — loaded from `kernel_terms.toml` via `build.rs`.
///
/// Only exists in engine builds where `ip_term!()` needs runtime lookup.
/// Kernel builds use the passthrough macro and don't need this static.
#[cfg(feature = "engine")]
pub static ENGINE_VOCABULARY: std::sync::LazyLock<HashMap<&'static str, &'static str>> =
    std::sync::LazyLock::new(|| include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs")));

// ═══════════════════════════════════════════════════════════════
// ip_term!() macro — the core IP protection primitive
// ═══════════════════════════════════════════════════════════════

/// Remap a kernel term to its public equivalent (engine builds)
/// or pass through unchanged (kernel builds).
///
/// # Full build
/// Returns the input string unchanged — full internal detail visible.
///
/// # Engine build
/// Looks up the term in `ENGINE_VOCABULARY` (generated from `kernel_terms.toml`).
/// Returns the public equivalent if found, otherwise the original term.
#[cfg(feature = "full")]
#[macro_export]
macro_rules! ip_term {
    ($term:expr) => {
        $term
    };
}

/// Remap a kernel term to its public equivalent (engine build variant).
#[cfg(feature = "engine")]
#[macro_export]
macro_rules! ip_term {
    ($term:expr) => {
        $crate::ip::ENGINE_VOCABULARY
            .get($term)
            .copied()
            .unwrap_or($term)
    };
}

// ═══════════════════════════════════════════════════════════════
// Dev tool helpers — full builds only
// ═══════════════════════════════════════════════════════════════

/// Load the vocabulary on-demand for dev tool display.
///
/// Returns a fresh `HashMap` each call. Not a static — full builds
/// only need this for the dev tool preview, not hot-path lookup.
#[cfg(feature = "full")]
pub fn dev_vocabulary() -> HashMap<&'static str, &'static str> {
    include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs"))
}

/// Get the full dictionary as a vec of (kernel, engine) pairs.
/// Only available in full builds (dev tool display).
#[cfg(feature = "full")]
pub fn dictionary_entries() -> Vec<(&'static str, &'static str)> {
    dev_vocabulary().into_iter().collect()
}

/// Remap an arbitrary text string by applying all dictionary substitutions.
/// Used by the dev tool for live kernel↔engine preview.
/// Only available in full builds.
#[cfg(feature = "full")]
pub fn remap_text(text: &str) -> String {
    let vocab = dev_vocabulary();
    let mut entries: Vec<_> = vocab.iter().collect();
    // Sort by length descending to prevent partial matches
    entries.sort_by(|a, b| b.0.len().cmp(&a.0.len()));

    let mut result = text.to_string();
    for (kernel, engine) in entries {
        result = result.replace(kernel, engine);
    }
    result
}
