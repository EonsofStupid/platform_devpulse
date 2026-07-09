//! `ModelManifestBackfill` — write `devpulse.json` for every model on disk.
//!
//! One-shot migration from filename-string matching to canonical-id
//! binding. Walks `<repo>/models/` (or `--dir <path>` override), and for
//! every directory that contains a model file (`.gguf`, `.safetensors`,
//! `.onnx`, `.bin`), either:
//!
//!   * Skips if `devpulse.json` already exists (unless `--force` passed).
//!   * Infers identity / architecture / quant / capabilities from the
//!     directory name, the filename, and folder hints. Computes SHA-256
//!     for every model file. Writes `devpulse.json`.
//!
//! Inference is deliberately conservative: the tool produces a valid
//! manifest that captures integrity + filename-derived identity, but
//! never overwrites user-authored files. Fields the inference can't
//! confidently resolve (e.g. precise `canonical_id` for a
//! custom-trained model) default to `None`; the user edits those in
//! place after the first run.
//!
//! This tool is the foundation for presets binding to stable
//! `canonical_id`s instead of literal filenames. Once every model dir
//! has a `devpulse.json`, the registry scanner's filename-matching
//! fallback stops being load-bearing.

use crate::commands::Task;
use crate::stage;
use crate::workspace::Workspace;

use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::io::{BufReader, Read};
use std::path::{Path, PathBuf};

/// CLI options for [`ModelManifestBackfill`].
pub struct ModelManifestBackfill {
    /// Root models directory. Defaults to `<repo>/models`.
    pub dir: Option<PathBuf>,
    /// Overwrite existing `devpulse.json` files. Default: skip.
    pub force: bool,
    /// Plan only — walk, classify, report. Never writes.
    pub dry_run: bool,
}

impl Task for ModelManifestBackfill {
    fn name(&self) -> &'static str {
        if self.dry_run {
            "model-manifest-backfill (dry-run)"
        } else {
            "model-manifest-backfill"
        }
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        stage::section(if self.dry_run {
            "Model Manifest Backfill (dry run)"
        } else {
            "Model Manifest Backfill"
        });

        let root = self.dir.clone().unwrap_or_else(|| ws.root().join("models"));
        if !root.is_dir() {
            anyhow::bail!(
                "models root not found at {}.\n  \
                 Pass `--dir <path>` if your models live elsewhere.",
                root.display()
            );
        }

        crate::xinfo!("  > scanning {}", root.display());
        let mut model_dirs = Vec::new();
        collect_model_dirs(&root, &mut model_dirs)?;
        crate::xinfo!("  > {} model directories detected", model_dirs.len());

        let mut written = 0u32;
        let mut skipped_existing = 0u32;
        let mut skipped_empty = 0u32;

        for dir in &model_dirs {
            let manifest_path = dir.join("devpulse.json");
            if manifest_path.exists() && !self.force {
                crate::xinfo!(
                    "  [skip] {}  devpulse.json exists",
                    dir.strip_prefix(&root).unwrap_or(dir).display()
                );
                skipped_existing += 1;
                continue;
            }

            let files = collect_model_files(dir)?;
            if files.is_empty() {
                skipped_empty += 1;
                continue;
            }

            let manifest = infer_manifest(&root, dir, &files);

            if self.dry_run {
                crate::xinfo!(
                    "  [would-write] {} -> canonical_id={} arch={} params={} quant={} files={}",
                    dir.strip_prefix(&root).unwrap_or(dir).display(),
                    manifest.canonical_id.as_deref().unwrap_or("<none>"),
                    manifest.architecture.as_deref().unwrap_or("<none>"),
                    manifest
                        .parameter_count_b
                        .map_or_else(|| "<none>".to_string(), |p| format!("{p}B")),
                    manifest.quant.as_deref().unwrap_or("<none>"),
                    manifest.files.len(),
                );
            } else {
                let json = serde_json::to_string_pretty(&manifest)
                    .with_context(|| format!("serializing manifest for {}", dir.display()))?;
                fs::write(&manifest_path, json)
                    .with_context(|| format!("writing {}", manifest_path.display()))?;
                crate::xinfo!(
                    "  [write] {}  canonical_id={}  files={}",
                    dir.strip_prefix(&root).unwrap_or(dir).display(),
                    manifest.canonical_id.as_deref().unwrap_or("<none>"),
                    manifest.files.len(),
                );
                written += 1;
            }
        }

        crate::xinfo!("");
        crate::xinfo!("  Summary:");
        crate::xinfo!("    model dirs scanned:  {}", model_dirs.len());
        crate::xinfo!("    manifests written:   {written}");
        crate::xinfo!("    existing (skipped):  {skipped_existing}  (pass --force to rewrite)");
        crate::xinfo!("    empty (no weights):  {skipped_empty}");

        Ok(())
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Manifest shape — inlined mirror of `model-loader::manifest::ModelManifest`
// ═══════════════════════════════════════════════════════════════════════
//
// xtask does NOT depend on the engine's model_loader (xtask is a dev
// tool). We inline a serde mirror of the manifest schema so the
// backfilled files parse correctly on the engine side.
// If the engine schema evolves, this mirror must move in lockstep —
// the CI test `manifest_schema_matches_xtask_mirror` (to be authored)
// will enforce that.

#[derive(serde::Serialize, Debug)]
struct ModelManifest {
    schema_version: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    canonical_id: Option<String>,
    label: String,
    role: String,
    capabilities: Vec<String>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    recommended_slots: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    architecture: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    parameter_count_b: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    quant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    context_length: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    vram_estimate_mb: Option<u64>,
    #[serde(skip_serializing_if = "Vec::is_empty")]
    files: Vec<ManifestFile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pipeline_tag: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    hf_repo: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    hf_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    notes: Option<String>,
}

#[derive(serde::Serialize, Debug)]
struct ManifestFile {
    path: String,
    size_bytes: u64,
    sha256: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    role: Option<String>,
}

// ═══════════════════════════════════════════════════════════════════════
// Walk + classify
// ═══════════════════════════════════════════════════════════════════════

const WEIGHT_EXTENSIONS: &[&str] = &["gguf", "safetensors", "onnx", "bin"];

/// True if the directory contains at least one file with a recognised
/// model-weight extension.
fn dir_has_model_files(dir: &Path) -> Result<bool> {
    for entry in fs::read_dir(dir).with_context(|| format!("reading {}", dir.display()))? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }
        if let Some(ext) = entry
            .path()
            .extension()
            .and_then(|e| e.to_str())
            .map(str::to_ascii_lowercase)
        {
            if WEIGHT_EXTENSIONS.contains(&ext.as_str()) {
                return Ok(true);
            }
        }
    }
    Ok(false)
}

/// Recursive pre-order walker. A "model dir" is the closest ancestor of
/// a weight file — we prefer the leaf directory that actually holds the
/// weights. A parent folder that contains only subdirectories (like
/// `models/chat/`) is NOT a model dir; `models/chat/qwen--qwen3-4b/` is.
fn collect_model_dirs(root: &Path, out: &mut Vec<PathBuf>) -> Result<()> {
    if !root.is_dir() {
        return Ok(());
    }
    // Skip obvious non-model system folders at the repo's `models/` root
    // so we don't accidentally mint a manifest for a download cache.
    let dir_name = root
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or_default();
    if matches!(
        dir_name,
        "_downloads" | "_training" | ".git" | "node_modules" | "target"
    ) {
        return Ok(());
    }

    if dir_has_model_files(root)? {
        out.push(root.to_path_buf());
    }

    for entry in fs::read_dir(root).with_context(|| format!("reading {}", root.display()))? {
        let entry = entry?;
        if entry.file_type()?.is_dir() {
            collect_model_dirs(&entry.path(), out)?;
        }
    }
    Ok(())
}

/// Collect every weight-shaped file in the model dir with size + sha256.
/// Companion files (tokenizer.json, config.json) are included too, so
/// the manifest captures the whole on-disk set and an integrity verifier
/// can detect partial downloads.
fn collect_model_files(dir: &Path) -> Result<Vec<ManifestFile>> {
    let mut files = BTreeMap::new(); // BTreeMap for stable ordering by path.
    for entry in fs::read_dir(dir).with_context(|| format!("reading {}", dir.display()))? {
        let entry = entry?;
        if !entry.file_type()?.is_file() {
            continue;
        }
        let path = entry.path();
        let Some(name) = path.file_name().and_then(|n| n.to_str()) else {
            continue;
        };
        if name == "devpulse.json" {
            continue; // don't hash our own manifest
        }
        let size = entry.metadata()?.len();
        let sha = sha256_of(&path)?;
        let role = classify_file_role(name);
        files.insert(
            name.to_string(),
            ManifestFile {
                path: name.to_string(),
                size_bytes: size,
                sha256: sha,
                role,
            },
        );
    }
    Ok(files.into_values().collect())
}

/// Streaming SHA-256. Same pattern used by `package_portable::copy_and_hash`.
fn sha256_of(path: &Path) -> Result<String> {
    let f = File::open(path).with_context(|| format!("opening {}", path.display()))?;
    let mut reader = BufReader::new(f);
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 64 * 1024].into_boxed_slice();
    loop {
        let n = reader
            .read(&mut buf)
            .with_context(|| format!("reading {}", path.display()))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(hex::encode(hasher.finalize()))
}

fn classify_file_role(name: &str) -> Option<String> {
    let lower = name.to_ascii_lowercase();
    if lower == "tokenizer.json" || lower == "tokenizer.model" {
        return Some("tokenizer".into());
    }
    if lower == "config.json"
        || lower == "generation_config.json"
        || lower == "tokenizer_config.json"
    {
        return Some("config".into());
    }
    if lower.starts_with("mmproj") {
        return Some("mmproj".into());
    }
    let ext = Path::new(&lower).extension();
    let ext_is = |s: &str| ext.is_some_and(|e| e.eq_ignore_ascii_case(s));
    if ext_is("gguf") || ext_is("safetensors") || ext_is("onnx") {
        return Some("weights".into());
    }
    if ext_is("bin") && !lower.contains("training_args") {
        return Some("weights".into());
    }
    None
}

// ═══════════════════════════════════════════════════════════════════════
// Inference — turn a directory + its files into a ModelManifest
// ═══════════════════════════════════════════════════════════════════════

fn infer_manifest(root: &Path, dir: &Path, files: &[ManifestFile]) -> ModelManifest {
    let rel = dir.strip_prefix(root).unwrap_or(dir);
    let segments: Vec<&str> = rel
        .components()
        .filter_map(|c| c.as_os_str().to_str())
        .collect();

    let canonical_id = infer_canonical_id(&segments);
    let label = infer_label(&segments);
    let folder_role = segments.first().copied().unwrap_or("").to_ascii_lowercase();

    let filename_hint = files
        .iter()
        .find(|f| f.role.as_deref() == Some("weights"))
        .map(|f| f.path.clone())
        .unwrap_or_default();

    let architecture = infer_architecture(&segments, &filename_hint);
    let parameter_count_b = infer_parameter_count(&segments, &filename_hint);
    let quant = infer_quant(&filename_hint);
    let (role, capabilities, recommended_slots) =
        infer_capabilities(&folder_role, architecture.as_deref());

    ModelManifest {
        schema_version: 1,
        canonical_id,
        label,
        role,
        capabilities,
        recommended_slots,
        architecture,
        parameter_count_b,
        quant,
        context_length: None,
        vram_estimate_mb: None,
        files: files.to_vec_of_files(),
        pipeline_tag: None,
        hf_repo: infer_hf_repo(&segments),
        hf_revision: None,
        notes: Some(
            "Backfilled by `cargo xtask model-manifest-backfill`. Review + hand-edit \
             canonical_id / capabilities if inference was wrong."
                .to_string(),
        ),
    }
}

/// Extension trait so `infer_manifest` can take `&[ManifestFile]` and
/// still own the files list — avoids cloning per call site otherwise.
trait VecOfFiles {
    fn to_vec_of_files(&self) -> Vec<ManifestFile>;
}
impl VecOfFiles for [ManifestFile] {
    fn to_vec_of_files(&self) -> Vec<ManifestFile> {
        self.iter()
            .map(|f| ManifestFile {
                path: f.path.clone(),
                size_bytes: f.size_bytes,
                sha256: f.sha256.clone(),
                role: f.role.clone(),
            })
            .collect()
    }
}

/// Convert `qwen--qwen3-4b-instruct` → `qwen/qwen3-4b-instruct`, which
/// mirrors `HuggingFace`'s on-disk naming where `--` is the separator
/// between org and repo (the `huggingface_hub` library writes cache
/// entries as `models--org--repo`).
fn infer_canonical_id(segments: &[&str]) -> Option<String> {
    let last = segments.last()?;
    // Turn "qwen--qwen3-4b-base" into "qwen/qwen3-4b-base".
    if let Some((org, rest)) = last.split_once("--") {
        if !org.is_empty() && !rest.is_empty() {
            return Some(format!(
                "{}/{}",
                org.to_ascii_lowercase(),
                rest.to_ascii_lowercase()
            ));
        }
    }
    // Single-segment fallback: use folder name itself.
    Some(last.to_ascii_lowercase())
}

/// Pretty label from the final path segment.
fn infer_label(segments: &[&str]) -> String {
    segments.last().copied().map_or_else(
        || "Unknown".to_string(),
        |s| s.replace("--", " / ").replace('-', " "),
    )
}

/// Derive HF repo id from an `org--repo` folder name.
fn infer_hf_repo(segments: &[&str]) -> Option<String> {
    let last = segments.last()?;
    last.split_once("--")
        .map(|(org, repo)| format!("{org}/{repo}"))
}

/// Match against known architecture families. Keeps the normalized tag
/// small and stable so presets can pattern-match without churn.
fn infer_architecture(segments: &[&str], filename: &str) -> Option<String> {
    let bag: String =
        segments.join(" ").to_ascii_lowercase() + " " + &filename.to_ascii_lowercase();

    if bag.contains("qwen3-vl") || bag.contains("qwen3_vl") {
        return Some("qwen3-vl".into());
    }
    if bag.contains("a3b") || bag.contains("moe") {
        return Some("qwen3-moe".into());
    }
    if bag.contains("qwen3") || bag.contains("qwen-3") {
        return Some("qwen3-dense".into());
    }
    if bag.contains("qwen2") {
        return Some("qwen2".into());
    }
    if bag.contains("phi-4") || bag.contains("phi4") {
        return Some("phi4".into());
    }
    if bag.contains("gemma-3") || bag.contains("gemma3") {
        return Some("gemma3".into());
    }
    if bag.contains("whisper") {
        return Some("whisper".into());
    }
    if bag.contains("kokoro") {
        return Some("kokoro".into());
    }
    if bag.contains("moshi") {
        return Some("moshi".into());
    }
    if bag.contains("siglip") {
        return Some("siglip".into());
    }
    if bag.contains("nomic") {
        return Some("nomic-embed".into());
    }
    if bag.contains("xlm-roberta") || bag.contains("xlmroberta") {
        return Some("xlm-roberta".into());
    }
    if bag.contains("harrier") {
        return Some("harrier".into());
    }
    if bag.contains("snac") {
        return Some("snac".into());
    }
    None
}

/// Parse the first parameter-count token from a path/filename. Matches:
/// `0.6b`, `4b`, `7B`, `13b`, `30b`, `35b-a3b`, etc. Returns the
/// FIRST figure, which corresponds to the total parameter count
/// (`MoE` active-expert counts like `a3b` are ignored — the `moe` tag
/// on `architecture` carries that signal).
fn infer_parameter_count(segments: &[&str], filename: &str) -> Option<f32> {
    let bag = segments.join(" ") + " " + filename;
    let bytes = bag.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        // Scan for a digit possibly preceded by '-' or space.
        if !bytes[i].is_ascii_digit() {
            i += 1;
            continue;
        }
        // Accumulate digits + optional '.'.
        let start = i;
        while i < bytes.len() && (bytes[i].is_ascii_digit() || bytes[i] == b'.') {
            i += 1;
        }
        // Require following 'b' or 'B'.
        if i < bytes.len() && (bytes[i] == b'b' || bytes[i] == b'B') {
            let token = std::str::from_utf8(&bytes[start..i]).ok()?;
            if let Ok(n) = token.parse::<f32>() {
                // Guard: ignore "123b" if `b` is part of a longer word
                // like "tab" or "cube" — require a non-alphanumeric
                // boundary after the `b`.
                let after = bytes.get(i + 1).copied();
                let boundary = matches!(after, None | Some(b'-' | b'_' | b'.' | b' ' | b'/'));
                if boundary && n > 0.0 && n < 2000.0 {
                    return Some(n);
                }
            }
        }
        i += 1;
    }
    None
}

/// Common GGUF / `HuggingFace` quant tags. Returns the canonical form as
/// the quant appears in filenames (`Q4_K_M`, `Q8_0`, `F16`, etc.).
const QUANT_TAGS: &[&str] = &[
    "Q8_0", "Q6_K", "Q5_K_M", "Q5_K_S", "Q4_K_XL", "Q4_K_M", "Q4_K_S", "Q3_K_M", "Q3_K_S", "Q2_K",
    "BF16", "F16", "F32", "FP16", "FP32", "INT8", "INT4",
];

fn infer_quant(filename: &str) -> Option<String> {
    let upper = filename.to_ascii_uppercase();
    for tag in QUANT_TAGS {
        if upper.contains(tag) {
            return Some((*tag).to_string());
        }
    }
    None
}

/// Map folder name + architecture to capability set. Returns
/// `(role, capabilities, recommended_slots)`. Capability strings
/// deliberately match the `ModelCapability` discriminants in the engine's
/// `src/platform/model_loader/slots/types.rs` so serde round-trips on
/// the engine side.
fn infer_capabilities(
    folder_role: &str,
    architecture: Option<&str>,
) -> (String, Vec<String>, Vec<String>) {
    let arch = architecture.unwrap_or("");
    match folder_role {
        "rag" => (
            "embedder".into(),
            vec!["Embedding".into()],
            vec!["rag.embedder".into(), "rag.encoder".into()],
        ),
        "voice" => {
            if arch == "whisper" {
                (
                    "stt".into(),
                    vec!["SpeechToText".into()],
                    vec!["voice.stt".into()],
                )
            } else if arch == "kokoro" || arch == "snac" {
                (
                    "tts".into(),
                    vec!["TextToSpeech".into()],
                    vec!["voice.tts".into()],
                )
            } else if arch == "moshi" {
                (
                    "reasoning".into(),
                    vec!["TextGeneration".into()],
                    vec!["voice.brain".into()],
                )
            } else {
                (
                    "general".into(),
                    vec!["SpeechToText".into(), "TextToSpeech".into()],
                    vec![],
                )
            }
        }
        "vision" => (
            "vision".into(),
            vec!["VisionEmbedding".into()],
            vec!["vision.embedder".into()],
        ),
        "omni" => (
            "vision-language".into(),
            vec!["VisionLanguage".into(), "TextGeneration".into()],
            vec!["chat.vision".into(), "chat.brain".into()],
        ),
        _ => {
            // chat / general / unknown — assume text reasoning.
            (
                "reasoning".into(),
                vec!["TextGeneration".into()],
                vec!["chat.brain".into(), "chat.fast".into()],
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonical_id_from_hf_cache_style_folder() {
        assert_eq!(
            infer_canonical_id(&["chat", "qwen--qwen3-4b-instruct"]),
            Some("qwen/qwen3-4b-instruct".to_string())
        );
    }

    #[test]
    fn canonical_id_single_segment_fallback() {
        assert_eq!(
            infer_canonical_id(&["phi-4-mini"]),
            Some("phi-4-mini".to_string())
        );
    }

    #[test]
    fn architecture_qwen3_moe_takes_priority_over_dense() {
        assert_eq!(
            infer_architecture(&["chat", "qwen--qwen3.6-35b-a3b"], ""),
            Some("qwen3-moe".to_string())
        );
    }

    #[test]
    fn architecture_qwen3_vl_beats_dense() {
        assert_eq!(
            infer_architecture(&["omni", "qwen3-vl-2b"], "Qwen3-VL-2B-Q4_K_M.gguf"),
            Some("qwen3-vl".to_string())
        );
    }

    #[test]
    fn architecture_kokoro() {
        assert_eq!(
            infer_architecture(&["voice"], "kokoro-v1.0.fp16.onnx"),
            Some("kokoro".to_string())
        );
    }

    #[test]
    fn parameter_count_standard_b_suffix() {
        assert_eq!(infer_parameter_count(&["qwen3-4b"], ""), Some(4.0));
        assert_eq!(infer_parameter_count(&["qwen3-0.6b"], ""), Some(0.6));
        assert_eq!(
            infer_parameter_count(&["chat", "qwen--qwen3.5-9b"], ""),
            Some(9.0)
        );
        // ^ "3.5" is NOT followed by 'b' (a '-' intervenes) so the
        // scanner correctly skips the version number and matches "9b"
        // — the actual parameter count. An earlier scanner returned
        // 3.5 here; this pins the fixed behavior.
    }

    #[test]
    fn parameter_count_from_filename() {
        assert_eq!(
            infer_parameter_count(&[], "Qwen3-4B-Instruct-Q4_K_M.gguf"),
            Some(4.0)
        );
    }

    #[test]
    fn quant_q4_k_xl() {
        assert_eq!(
            infer_quant("Qwen3-30B-A3B-Instruct-2507-UD-Q4_K_XL.gguf"),
            Some("Q4_K_XL".into())
        );
    }

    #[test]
    fn quant_q4_k_m_not_xl() {
        assert_eq!(
            infer_quant("Qwen3-4B-Instruct-Q4_K_M.gguf"),
            Some("Q4_K_M".into())
        );
    }

    #[test]
    fn quant_onnx_int8() {
        assert_eq!(infer_quant("kokoro-v1.0.int8.onnx"), Some("INT8".into()));
    }

    #[test]
    fn capabilities_rag_folder() {
        let (role, caps, slots) = infer_capabilities("rag", Some("nomic-embed"));
        assert_eq!(role, "embedder");
        assert_eq!(caps, vec!["Embedding"]);
        assert!(slots.iter().any(|s| s == "rag.embedder"));
    }

    #[test]
    fn capabilities_voice_kokoro_is_tts() {
        let (role, caps, _) = infer_capabilities("voice", Some("kokoro"));
        assert_eq!(role, "tts");
        assert_eq!(caps, vec!["TextToSpeech"]);
    }

    #[test]
    fn capabilities_voice_whisper_is_stt() {
        let (role, caps, _) = infer_capabilities("voice", Some("whisper"));
        assert_eq!(role, "stt");
        assert_eq!(caps, vec!["SpeechToText"]);
    }
}
