//! llama.cpp FFI foundation devtool commands.
//!
//! Operates on the **prebuilt static-lib pipeline**, not the runtime
//! inference state. See [`docs/platform/LLAMA_CPP_FFI_SPEC.md`] §3 for
//! the full devtool surface this module backs.
//!
//! # What lives here
//!
//! - [`llama_cpp_build_info`] — link mode + active target + manifest pin
//! - [`llama_cpp_open_prebuilt_dir`] — OS-native open of the extract dir
//! - [`llama_cpp_bump_manifest`] — write new manifest after validation
//!
//! # What lives elsewhere
//!
//! - **Config persistence** — [`super::llama_cpp_embedded`] (user-scope
//!   `context_size` / `gpu_layers` / `kv_dtype` / `n_batch` TOML).
//! - **Sidecar process control** — [`super::llama`] (the OLD path —
//!   spawning `llama-server.exe` via HTTP. Being phased out.)
//! - **Runtime FFI state** (KV cache stats, smoke-test inference) —
//!   not yet wired; requires a live `LlamaContext` from a loaded slot.
//!   Adds to this module under the names listed in spec §3.6 when the
//!   end-to-end runtime gate (§1, gate 5) lands.

use serde::{Deserialize, Serialize};
use specta::Type;
use std::path::{Path, PathBuf};

/// Read the live FFI link state.
///
/// Combines three sources:
/// 1. The committed pin at `deps/llama-cpp-prebuilt/manifest.json` —
///    which release this workspace contracts to link against.
/// 2. The presence of `deps/llama-cpp-prebuilt/<target>/lib/llama.lib`
///    for each target — what's actually extracted on this box.
/// 3. The `LLAMA_CPP_PREBUILT_LIB_DIR` env var — what the running
///    process inherited (`apply_env` exports this at xtask boot).
///
/// The devtool's Status tab uses this to answer "is the foundation
/// healthy" without spelunking the file system or stderr.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_cpp_build_info() -> Result<LlamaCppBuildInfo, String> {
    let workspace_root = locate_workspace_root().map_err(|e| format!("locate workspace: {e}"))?;
    let manifest_path = workspace_root
        .join("deps")
        .join("llama-cpp-prebuilt")
        .join("manifest.json");

    let manifest = read_manifest(&manifest_path)
        .map_err(|e| format!("read {}: {e}", manifest_path.display()))?;

    let mut targets = Vec::with_capacity(manifest.artifacts.len());
    for art in &manifest.artifacts {
        let target_dir = workspace_root
            .join("deps")
            .join("llama-cpp-prebuilt")
            .join(&art.target);
        let extracted = target_dir.join("lib").join("llama.lib").is_file();
        let marker = target_dir.join(".llama-cpp-prebuilt-version");
        let cached_version = std::fs::read_to_string(&marker)
            .ok()
            .map(|s| s.trim().to_string());
        let drift = cached_version
            .as_ref()
            .is_some_and(|v| v != &manifest.version);
        targets.push(TargetState {
            target: art.target.clone(),
            backend: art.backend.clone(),
            sha256_short: art.sha256.chars().take(12).collect(),
            extracted,
            cached_version,
            drift,
            extract_dir: target_dir.to_string_lossy().into_owned(),
        });
    }

    let env_dir = std::env::var("LLAMA_CPP_PREBUILT_LIB_DIR").ok();
    let active_target = env_dir.as_ref().and_then(|d| {
        Path::new(d)
            .file_name()
            .and_then(|s| s.to_str())
            .map(String::from)
    });
    let link_mode = if active_target.is_some() {
        LinkMode::Prebuilt
    } else if targets.iter().any(|t| t.extracted) {
        LinkMode::PrebuiltStagedButNotExported
    } else {
        LinkMode::FallbackCmakeOrUnbuilt
    };

    Ok(LlamaCppBuildInfo {
        manifest_path: manifest_path.to_string_lossy().into_owned(),
        manifest_version: manifest.version,
        manifest_tag: manifest.tag,
        upstream_sha: manifest.upstream.sha,
        upstream_tag: manifest.upstream.tag,
        repository: manifest.repository,
        release_url: manifest.release_url,
        active_target,
        active_lib_dir: env_dir,
        link_mode,
        targets,
    })
}

/// Open the per-target prebuilt extract directory in the OS file
/// manager. Useful when diagnosing layout drift after a release bump.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_cpp_open_prebuilt_dir(target: String) -> Result<(), String> {
    let workspace_root = locate_workspace_root().map_err(|e| format!("locate workspace: {e}"))?;
    let dir = workspace_root
        .join("deps")
        .join("llama-cpp-prebuilt")
        .join(&target);
    if !dir.is_dir() {
        return Err(format!(
            "no extract for target `{target}` at {} — run `cargo xtask fetch-llama-cpp --target {target}` first",
            dir.display()
        ));
    }
    open_in_os_explorer(&dir)
}

fn open_in_os_explorer(path: &Path) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open explorer: {e}"))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to open Finder: {e}"))?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Failed to xdg-open: {e}"))?;
    }
    Ok(())
}

/// Replace `deps/llama-cpp-prebuilt/manifest.json` with a new manifest
/// after a release bump.
///
/// Validation gates BEFORE any write:
/// 1. JSON parses into the expected schema.
/// 2. `schema == 1`.
/// 3. Every artifact has a non-empty `sha256`.
/// 4. Every artifact's target matches the supported set
///    (`win32-x64-{vulkan,cuda,cpu}`).
///
/// The write itself is atomic — staged at `manifest.json.tmp` then
/// renamed.
///
/// **Does NOT fetch** — operator runs `cargo xtask fetch-llama-cpp
/// --target <id>` separately after the manifest lands. That's
/// deliberate: a manifest bump is a contract change; a fetch is a
/// per-machine action. Different concerns, different commands.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn llama_cpp_bump_manifest(new_manifest_json: String) -> Result<BumpResult, String> {
    let parsed: PrebuiltManifest = serde_json::from_str(&new_manifest_json)
        .map_err(|e| format!("manifest JSON parse failed: {e}"))?;

    if parsed.schema != 1 {
        return Err(format!(
            "manifest schema {} not supported (expected 1)",
            parsed.schema
        ));
    }
    if parsed.artifacts.is_empty() {
        return Err("manifest has zero artifacts — refusing to bump".into());
    }
    const SUPPORTED: &[&str] = &["win32-x64-vulkan", "win32-x64-cuda", "win32-x64-cpu"];
    for art in &parsed.artifacts {
        if art.sha256.is_empty() || art.sha256.starts_with("__") {
            return Err(format!(
                "artifact `{}` has missing or placeholder sha256",
                art.target
            ));
        }
        if !SUPPORTED.contains(&art.target.as_str()) {
            return Err(format!(
                "unknown target `{}` — supported: {}",
                art.target,
                SUPPORTED.join(", ")
            ));
        }
    }

    let workspace_root = locate_workspace_root().map_err(|e| format!("locate workspace: {e}"))?;
    let manifest_path = workspace_root
        .join("deps")
        .join("llama-cpp-prebuilt")
        .join("manifest.json");
    let tmp_path = manifest_path.with_extension("json.tmp");

    // Pretty-print so the committed file stays diff-readable.
    let pretty = serde_json::to_string_pretty(&parsed)
        .map_err(|e| format!("serialize bumped manifest: {e}"))?;
    std::fs::write(&tmp_path, pretty).map_err(|e| format!("write tmp: {e}"))?;
    std::fs::rename(&tmp_path, &manifest_path).map_err(|e| format!("rename tmp: {e}"))?;

    let targets: Vec<String> = parsed.artifacts.iter().map(|a| a.target.clone()).collect();
    Ok(BumpResult {
        manifest_path: manifest_path.to_string_lossy().into_owned(),
        new_version: parsed.version,
        new_tag: parsed.tag,
        upstream_sha: parsed.upstream.sha,
        targets,
    })
}

// ── Types ────────────────────────────────────────────────────

/// Composite snapshot of the FFI prebuilt-link state.
///
/// Returned by [`llama_cpp_build_info`]. Combines the committed
/// manifest pin, per-target extract state on disk, and the runtime
/// env var into one shape the devtool's Status tab can render.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct LlamaCppBuildInfo {
    /// Absolute path of the committed manifest file.
    pub manifest_path: String,
    /// Manifest's `version` (matches sub-repo's `release.version`).
    pub manifest_version: String,
    /// Release tag (e.g. `v0.1.1`).
    pub manifest_tag: String,
    /// Pinned upstream `ggml-org/llama.cpp` SHA.
    pub upstream_sha: String,
    /// Pinned upstream tag / branch label.
    pub upstream_tag: String,
    /// Sub-repo URL.
    pub repository: String,
    /// Browser-facing release URL (when present).
    pub release_url: Option<String>,
    /// Target id currently in the process env (e.g. `win32-x64-vulkan`).
    /// `None` when `LLAMA_CPP_PREBUILT_LIB_DIR` was unset at boot.
    pub active_target: Option<String>,
    /// Absolute path env var value (when set).
    pub active_lib_dir: Option<String>,
    /// Composite link state — what's actually true on disk + env.
    pub link_mode: LinkMode,
    /// Per-target stage state. One entry per manifest artifact.
    pub targets: Vec<TargetState>,
}

/// Composite link state derived from on-disk artifacts + runtime env.
///
/// Frontend matches this to drive the Status tab's health badge:
/// `Prebuilt` is the only green state; the other two are degraded.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Type, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum LinkMode {
    /// `LLAMA_CPP_PREBUILT_LIB_DIR` exported AND target dir exists.
    /// The fast-path is engaged.
    Prebuilt,
    /// Prebuilt staged on disk but env var unset — `apply_env` didn't
    /// fire, or this dev box doesn't run through xtask. Build falls
    /// through to the in-tree cmake path.
    PrebuiltStagedButNotExported,
    /// No prebuilt staged. Either the operator hasn't run
    /// `fetch-llama-cpp` yet, or this is a Linux / macOS box where the
    /// fallback works fine.
    FallbackCmakeOrUnbuilt,
}

/// Per-target stage state — one entry per manifest artifact.
///
/// Populated even when the target is not extracted (`extracted: false`)
/// so the UI can offer "fetch this target" affordances for all three.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TargetState {
    /// Full target id (e.g. `win32-x64-vulkan`).
    pub target: String,
    /// Backend label (`vulkan` / `cuda` / `cpu`).
    pub backend: String,
    /// First 12 chars of the artifact's sha256.
    pub sha256_short: String,
    /// `true` if `lib/llama.lib` exists in the extract dir.
    pub extracted: bool,
    /// Content of `.llama-cpp-prebuilt-version` marker, if present.
    pub cached_version: Option<String>,
    /// `true` when `cached_version != manifest.version` — the operator
    /// bumped the manifest but didn't re-fetch.
    pub drift: bool,
    /// Absolute path of the per-target extract dir.
    pub extract_dir: String,
}

/// Returned by [`llama_cpp_bump_manifest`] after a successful write.
///
/// Surfaces a confirmation summary so the devtool can render
/// "manifest at $path pinned to $new_version (upstream $sha)" without
/// re-reading the file.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BumpResult {
    /// Absolute path of the manifest that was overwritten.
    pub manifest_path: String,
    /// New `version` field (matches sub-repo's `release.version`).
    pub new_version: String,
    /// New `tag` field (e.g. `v0.1.2`).
    pub new_tag: String,
    /// Upstream `ggml-org/llama.cpp` SHA the new release pins.
    pub upstream_sha: String,
    /// Target ids the new manifest carries — operator must re-fetch each.
    pub targets: Vec<String>,
}

// ── Internal manifest schema (matches deps/llama-cpp-prebuilt/manifest.json) ────────

#[derive(Debug, Clone, Serialize, Deserialize)]
struct PrebuiltManifest {
    schema: u32,
    #[allow(dead_code)]
    product: String,
    version: String,
    tag: String,
    upstream: Upstream,
    repository: String,
    #[serde(default, rename = "releaseUrl")]
    release_url: Option<String>,
    #[serde(default)]
    #[allow(dead_code)]
    comment: Option<String>,
    artifacts: Vec<ManifestArtifact>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Upstream {
    #[allow(dead_code)]
    repository: String,
    sha: String,
    tag: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ManifestArtifact {
    #[allow(dead_code)]
    url: String,
    #[allow(dead_code)]
    platform: String,
    #[allow(dead_code)]
    arch: String,
    backend: String,
    target: String,
    #[serde(rename = "fileName")]
    #[allow(dead_code)]
    file_name: String,
    sha256: String,
}

fn read_manifest(path: &Path) -> Result<PrebuiltManifest, String> {
    let text = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

/// Walk up from the running binary's parent (or cwd) to find the
/// workspace root.
///
/// Same shape as xtask's discovery — the root has both `Cargo.toml`
/// and an `interfaces/` directory. Robust to dev (cwd inside the
/// workspace) and installed (binary location used as the starting
/// point — though the prebuilt commands only make sense in dev).
fn locate_workspace_root() -> Result<PathBuf, String> {
    let start = std::env::current_dir().map_err(|e| e.to_string())?;
    let mut dir = start.clone();
    loop {
        if dir.join("Cargo.toml").is_file() && dir.join("interfaces").is_dir() {
            return Ok(dir);
        }
        if !dir.pop() {
            return Err(format!(
                "no workspace root above {} — Cargo.toml + interfaces/ not found",
                start.display()
            ));
        }
    }
}
