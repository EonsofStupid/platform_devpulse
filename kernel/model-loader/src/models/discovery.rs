//! Model discovery — directory walking and GGUF header parsing.
//!
//! Phase 3 implementation. Skeleton for Phase 1 compile.

use crate::models::registry::ModelRegistryEntry;
use std::path::Path;

/// Discover all models in the models directory.
///
/// Walks `{models_dir}/gguf/` recursively, parses GGUF headers, builds registry entries.
///
/// # Errors
/// Returns error if models directory doesn't exist or is unreadable.
pub fn discover_models(_models_dir: &Path) -> anyhow::Result<Vec<ModelRegistryEntry>> {
    // Phase 3: implement GGUF parsing + directory walking
    Ok(Vec::new())
}
