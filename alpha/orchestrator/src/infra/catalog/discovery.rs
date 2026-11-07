// orchestrator/src/infra/catalog/discovery.rs

//! Model Discovery - Scan folders for GGUF models
//!
//! Adapter-style architecture:
//! - Point at ANY folder
//! - System discovers GGUF files
//! - Parses metadata from filename
//! - Returns available models to load
//!
//! Works like Ollama/LM Studio - location doesn't matter.

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tracing::{debug, info};

/// Discovered model from disk scan
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredModel {
    /// Unique ID based on filename
    pub id: String,
    /// Display name (cleaned up filename)
    pub name: String,
    /// Full path to GGUF file
    pub path: PathBuf,
    /// Optional mmproj path for VL models
    pub mmproj_path: Option<PathBuf>,
    /// File size in bytes
    pub size_bytes: u64,
    /// Estimated parameters (billions) - parsed from filename
    pub params_b: Option<f32>,
    /// Quantization level (Q4_K_M, Q6_K, Q8_0, etc)
    pub quantization: Option<String>,
    /// Model family guess (qwen, llama, mistral, etc)
    pub family: Option<String>,
    /// Is this a vision-language model?
    pub is_vl: bool,
    /// Estimated VRAM requirement in GB
    pub vram_estimate_gb: f32,
}

impl DiscoveredModel {
    /// Human-readable size
    pub fn size_human(&self) -> String {
        let gb = self.size_bytes as f64 / 1_073_741_824.0;
        if gb >= 1.0 {
            format!("{:.1} GB", gb)
        } else {
            let mb = self.size_bytes as f64 / 1_048_576.0;
            format!("{:.0} MB", mb)
        }
    }
}

/// Scan results from discovery
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveryResult {
    /// Root directory scanned
    pub root_path: PathBuf,
    /// All discovered models
    pub models: Vec<DiscoveredModel>,
    /// VL models (have mmproj)
    pub vl_models: Vec<DiscoveredModel>,
    /// Text-only models
    pub text_models: Vec<DiscoveredModel>,
    /// Errors encountered during scan
    pub errors: Vec<String>,
}

/// Discover GGUF models in a directory
///
/// Scans recursively for .gguf files and parses their metadata.
/// Automatically finds mmproj files for VL models.
pub fn discover_models(root: &Path) -> Result<DiscoveryResult> {
    if !root.exists() {
        return Err(anyhow!("Directory does not exist: {:?}", root));
    }

    if !root.is_dir() {
        return Err(anyhow!("Path is not a directory: {:?}", root));
    }

    info!(?root, "Scanning for GGUF models");

    let mut models = Vec::new();
    let mut errors = Vec::new();

    // Scan recursively
    scan_directory(root, &mut models, &mut errors);

    // Find mmproj files and associate with models
    associate_mmproj(&mut models);

    // Separate VL and text models
    let vl_models: Vec<_> = models.iter().filter(|m| m.is_vl).cloned().collect();
    let text_models: Vec<_> = models.iter().filter(|m| !m.is_vl).cloned().collect();

    info!(
        total = models.len(),
        vl = vl_models.len(),
        text = text_models.len(),
        "Discovery complete"
    );

    Ok(DiscoveryResult {
        root_path: root.to_path_buf(),
        models,
        vl_models,
        text_models,
        errors,
    })
}

/// Recursively scan a directory for GGUF files
fn scan_directory(dir: &Path, models: &mut Vec<DiscoveredModel>, errors: &mut Vec<String>) {
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(e) => {
            errors.push(format!("Failed to read {:?}: {}", dir, e));
            return;
        }
    };

    for entry in entries.flatten() {
        let path = entry.path();

        if path.is_dir() {
            // Recurse into subdirectories
            scan_directory(&path, models, errors);
        } else if let Some(ext) = path.extension() {
            if ext == "gguf" {
                match parse_gguf_file(&path) {
                    Ok(model) => {
                        debug!(?path, id = %model.id, "Found model");
                        models.push(model);
                    }
                    Err(e) => {
                        errors.push(format!("Failed to parse {:?}: {}", path, e));
                    }
                }
            }
        }
    }
}

/// Parse a GGUF file into a DiscoveredModel
fn parse_gguf_file(path: &Path) -> Result<DiscoveredModel> {
    let filename = path
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or_else(|| anyhow!("Invalid filename"))?;

    let metadata = std::fs::metadata(path)?;
    let size_bytes = metadata.len();

    // Parse filename for metadata
    let parsed = parse_model_filename(filename);

    // Generate clean ID
    let id = filename
        .to_lowercase()
        .replace(' ', "-")
        .replace('_', "-");

    // Generate display name
    let name = generate_display_name(filename, &parsed);

    // Estimate VRAM based on file size and quantization
    let vram_estimate_gb = estimate_vram(size_bytes, parsed.quantization.as_deref());

    // Check if this is an mmproj file (we'll handle these separately)
    let is_mmproj = filename.to_lowercase().contains("mmproj");

    if is_mmproj {
        // Skip mmproj files - they're not loadable models
        return Err(anyhow!("mmproj file, not a model"));
    }

    Ok(DiscoveredModel {
        id,
        name,
        path: path.to_path_buf(),
        mmproj_path: None, // Will be filled in by associate_mmproj
        size_bytes,
        params_b: parsed.params_b,
        quantization: parsed.quantization,
        family: parsed.family,
        is_vl: parsed.is_vl,
        vram_estimate_gb,
    })
}

/// Parsed metadata from filename
struct ParsedFilename {
    params_b: Option<f32>,
    quantization: Option<String>,
    family: Option<String>,
    is_vl: bool,
}

/// Parse model metadata from filename
///
/// Examples:
/// - "Qwen3-VL-8B-Instruct-Q6_K.gguf" -> 8B, Q6_K, qwen3, VL=true
/// - "llama-3.1-8b-instruct-q4_k_m.gguf" -> 8B, Q4_K_M, llama, VL=false
/// - "mistral-7b-v0.3-q5_k_s.gguf" -> 7B, Q5_K_S, mistral, VL=false
fn parse_model_filename(filename: &str) -> ParsedFilename {
    let lower = filename.to_lowercase();

    // Detect model family
    let family = if lower.contains("qwen") {
        Some("qwen".to_string())
    } else if lower.contains("llama") {
        Some("llama".to_string())
    } else if lower.contains("mistral") {
        Some("mistral".to_string())
    } else if lower.contains("phi") {
        Some("phi".to_string())
    } else if lower.contains("gemma") {
        Some("gemma".to_string())
    } else if lower.contains("deepseek") {
        Some("deepseek".to_string())
    } else if lower.contains("yi") {
        Some("yi".to_string())
    } else if lower.contains("solar") {
        Some("solar".to_string())
    } else {
        None
    };

    // Detect VL (vision-language)
    let is_vl = lower.contains("-vl") || lower.contains("_vl") || lower.contains("vision");

    // Parse parameter count (look for patterns like "8b", "8B", "0.6b", "70b")
    let params_b = parse_param_count(&lower);

    // Parse quantization (Q4_K_M, Q6_K, Q8_0, F16, etc.)
    let quantization = parse_quantization(&lower);

    ParsedFilename {
        params_b,
        quantization,
        family,
        is_vl,
    }
}

/// Parse parameter count from filename
fn parse_param_count(filename: &str) -> Option<f32> {
    // Patterns: "8b", "0.6b", "70b", "8-b", etc.
    let patterns = [
        // Match decimal params like "0.6b"
        regex_lite::Regex::new(r"(\d+\.?\d*)[_-]?b(?:[_-]|$)").ok()?,
    ];

    for pattern in &patterns {
        if let Some(caps) = pattern.captures(filename) {
            if let Some(num_str) = caps.get(1) {
                if let Ok(num) = num_str.as_str().parse::<f32>() {
                    return Some(num);
                }
            }
        }
    }

    None
}

/// Parse quantization from filename
fn parse_quantization(filename: &str) -> Option<String> {
    // Common quantization patterns
    let quant_patterns = [
        "q4_k_m", "q4_k_s", "q4_0", "q4_1",
        "q5_k_m", "q5_k_s", "q5_0", "q5_1",
        "q6_k", "q8_0", "q8_1",
        "iq4_xs", "iq4_nl", "iq3_xxs", "iq2_xxs",
        "f16", "f32", "bf16",
    ];

    for pattern in quant_patterns {
        if filename.contains(pattern) {
            return Some(pattern.to_uppercase().replace('_', "_"));
        }
    }

    // Try uppercase versions
    let upper = filename.to_uppercase();
    for pattern in quant_patterns {
        let upper_pattern = pattern.to_uppercase();
        if upper.contains(&upper_pattern) {
            return Some(upper_pattern);
        }
    }

    None
}

/// Generate clean display name
fn generate_display_name(filename: &str, parsed: &ParsedFilename) -> String {
    let mut name = String::new();

    // Start with family
    if let Some(family) = &parsed.family {
        name.push_str(&family.to_uppercase());
        name.push(' ');
    }

    // Add VL if applicable
    if parsed.is_vl {
        name.push_str("VL ");
    }

    // Add size
    if let Some(params) = parsed.params_b {
        name.push_str(&format!("{}B ", params));
    }

    // Add quantization
    if let Some(quant) = &parsed.quantization {
        name.push_str(&format!("({})", quant));
    }

    if name.is_empty() {
        // Fallback to cleaned filename
        filename
            .replace('-', " ")
            .replace('_', " ")
            .trim()
            .to_string()
    } else {
        name.trim().to_string()
    }
}

/// Estimate VRAM requirement
fn estimate_vram(size_bytes: u64, quantization: Option<&str>) -> f32 {
    // File size is a good proxy for VRAM
    // Add ~20% overhead for KV cache and activations
    let base_gb = size_bytes as f64 / 1_073_741_824.0;
    let overhead = match quantization {
        Some(q) if q.contains("Q4") => 1.3,   // Q4 needs more KV cache overhead
        Some(q) if q.contains("Q5") => 1.25,
        Some(q) if q.contains("Q6") => 1.2,
        Some(q) if q.contains("Q8") => 1.15,
        Some(q) if q.contains("F16") => 1.1,
        _ => 1.2,
    };

    (base_gb * overhead) as f32
}

/// Associate mmproj files with their parent VL models
fn associate_mmproj(models: &mut [DiscoveredModel]) {
    // First, find all mmproj files
    let mmproj_files: Vec<PathBuf> = models
        .iter()
        .filter_map(|m| {
            // Check same directory for mmproj files
            if let Some(parent) = m.path.parent() {
                if let Ok(entries) = std::fs::read_dir(parent) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if let Some(filename) = path.file_name().and_then(|f| f.to_str()) {
                            if filename.to_lowercase().contains("mmproj") &&
                               path.extension().map(|e| e == "gguf").unwrap_or(false) {
                                return Some(path);
                            }
                        }
                    }
                }
            }
            None
        })
        .collect();

    // Associate mmproj with VL models in same directory
    for model in models.iter_mut() {
        if model.is_vl && model.mmproj_path.is_none() {
            if let Some(parent) = model.path.parent() {
                // Find mmproj in same directory
                for mmproj in &mmproj_files {
                    if mmproj.parent() == Some(parent) {
                        model.mmproj_path = Some(mmproj.clone());
                        debug!(
                            model = %model.id,
                            mmproj = ?mmproj,
                            "Associated mmproj"
                        );
                        break;
                    }
                }
            }
        }
    }
}

/// Quick check if a directory has any models
pub fn has_models(dir: &Path) -> bool {
    if !dir.exists() || !dir.is_dir() {
        return false;
    }

    fn check_dir(dir: &Path) -> bool {
        if let Ok(entries) = std::fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if check_dir(&path) {
                        return true;
                    }
                } else if path.extension().map(|e| e == "gguf").unwrap_or(false) {
                    return true;
                }
            }
        }
        false
    }

    check_dir(dir)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_filename_qwen_vl() {
        let parsed = parse_model_filename("Qwen3-VL-8B-Instruct-Q6_K.gguf");
        assert_eq!(parsed.family, Some("qwen".to_string()));
        assert!(parsed.is_vl);
        assert_eq!(parsed.params_b, Some(8.0));
        assert_eq!(parsed.quantization, Some("Q6_K".to_string()));
    }

    #[test]
    fn test_parse_filename_llama() {
        let parsed = parse_model_filename("llama-3.1-8b-instruct-q4_k_m.gguf");
        assert_eq!(parsed.family, Some("llama".to_string()));
        assert!(!parsed.is_vl);
        assert_eq!(parsed.params_b, Some(8.0));
        assert_eq!(parsed.quantization, Some("Q4_K_M".to_string()));
    }

    #[test]
    fn test_parse_small_model() {
        let parsed = parse_model_filename("Qwen3-Reranker-0.6B-q8_0.gguf");
        assert_eq!(parsed.params_b, Some(0.6));
        assert_eq!(parsed.quantization, Some("Q8_0".to_string()));
    }

    #[test]
    fn test_vram_estimate() {
        // 8B Q6_K model is roughly 6GB on disk
        let vram = estimate_vram(6_000_000_000, Some("Q6_K"));
        assert!(vram > 5.0 && vram < 8.0);
    }
}
