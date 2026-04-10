//! Model management Tauri commands.
//!
//! Delegates to `ModelLoaderService` via `PlatformState`.
//! Types flow from `model-loader` crate → specta → TypeScript bindings.

use crate::state::PlatformState;
use devpulse_engine::platform::services::model_loader::ModelLoaderService;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::{Emitter, State};

/// Serializable slot info for the frontend (maps from model-loader Slot).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SlotInfo {
    /// Slot identifier (e.g. `"chat.brain"`, `"voice.tts.primary"`).
    pub id: String,
    /// Human-readable label (e.g. `"AI Brain"`).
    pub label: String,
    /// Model capability this slot requires.
    pub capability: String,
    /// Preferred device placement (GPU/CPU/Auto).
    pub preferred_device: String,
    /// When to load the model (Hot/Warm/OnDemand/Signal/Coupled).
    pub loading_strategy: String,
    /// Currently assigned model registry ID, if any.
    pub assigned_model_id: Option<String>,
    /// Fallback slot ID for escalation chains.
    pub fallback: Option<String>,
    /// Preferred inference backend (Candle/LlamaCpp/Ort/Sherpa).
    pub runtime: Option<String>,
    /// Default model filename for auto-assignment.
    pub default_model: Option<String>,
    /// Slot IDs that must be co-loaded.
    pub requires: Vec<String>,
    /// Slot ID this can replace when conditions are met.
    pub overrides: Option<String>,
    /// Whether this slot's model is bundled with the app (not user-managed).
    /// Bundled slots are invisible in the Model Loader UI.
    pub embedded: bool,
    /// Path relative to models dir for bundled models (e.g. `"voice/kokoro/model_quantized.onnx"`).
    pub bundled_path: Option<String>,
    /// Architecture of the assigned model (e.g. "qwen3", "llama"). None if unassigned.
    pub architecture: Option<String>,
    /// Maximum context window in tokens of the assigned model. None if unassigned.
    pub context_length: Option<u32>,
    /// Active inference backend (e.g. "candle", "llamacpp", "sherpa"). None if not loaded.
    pub backend: Option<String>,
}

/// Serializable model entry for the frontend (maps from model-loader `ModelRegistryEntry`).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ModelInfo {
    /// Unique model identifier (UUID v7).
    pub id: String,
    /// Filename on disk.
    pub filename: String,
    /// Model architecture (e.g. `"llama"`, `"qwen3"`).
    pub architecture: String,
    /// Total parameter count, if known.
    pub parameter_count: Option<u64>,
    /// Quantization level (e.g. `"Q4_K_M"`).
    pub quant_level: Option<String>,
    /// Maximum context window in tokens.
    pub context_length: usize,
    /// File size on disk in MB.
    pub size_mb: u64,
    /// Estimated VRAM when loaded (MB).
    pub vram_estimate_mb: u64,
    /// Which inference backends can run this model.
    pub supported_backends: Vec<String>,
    /// Which slot capabilities this model can serve.
    pub compatible_capabilities: Vec<String>,
}

/// Hardware metrics for the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HardwareInfo {
    /// CPU usage percentage (0.0–100.0).
    pub cpu_usage_percent: f32,
    /// Number of logical CPU cores.
    pub cpu_cores: usize,
    /// CPU model name.
    pub cpu_name: String,
    /// Total system RAM (MB).
    pub ram_total_mb: u64,
    /// Used system RAM (MB).
    pub ram_used_mb: u64,
    /// Available system RAM (MB).
    pub ram_available_mb: u64,
    /// Why GPU detection failed (None = success or not attempted).
    pub gpu_error: Option<String>,
    /// GPU model name (None if no GPU).
    pub gpu_name: Option<String>,
    /// Total GPU VRAM (MB).
    pub gpu_vram_total_mb: Option<u64>,
    /// Used GPU VRAM (MB).
    pub gpu_vram_used_mb: Option<u64>,
    /// Free GPU VRAM (MB).
    pub gpu_vram_free_mb: Option<u64>,
    /// GPU utilization percentage.
    pub gpu_utilization_percent: Option<f32>,
    /// GPU temperature (Celsius).
    pub gpu_temperature_c: Option<f32>,
    /// DevPulse process RAM usage (MB).
    pub process_ram_mb: u64,
    /// DevPulse process VRAM usage (MB).
    pub process_vram_mb: u64,
    /// Number of logical CPU threads (hyperthreaded count).
    pub cpu_threads: Option<u32>,
    /// Free disk space on model storage drive (MB).
    pub disk_free_mb: Option<u64>,
    /// CUDA toolkit version (e.g. "12.4"). None if no CUDA.
    pub cuda_version: Option<String>,
    /// Whether NVML (nvidia-smi library) is accessible.
    pub nvml_available: bool,
    /// Path to the model storage directory.
    pub model_dir: String,
}

/// Helper: get the model loader service from platform state.
async fn get_loader(state: &State<'_, PlatformState>) -> Result<Arc<ModelLoaderService>, String> {
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;
    platform
        .model_loader()
        .cloned()
        .ok_or_else(|| "Model Loader not available (disabled or failed to boot)".to_string())
}

/// Get hardware metrics from the model loader's hardware monitor.
#[tauri::command]
#[specta::specta]
pub async fn get_hardware_metrics(
    state: State<'_, PlatformState>,
) -> Result<HardwareInfo, String> {
    let loader = get_loader(&state).await?;
    let m = loader.hardware_metrics().await;

    // Derive model_dir from platform data_dir
    let model_dir = {
        let guard = state.platform.read().await;
        guard
            .as_ref()
            .map(|p| p.data_dir().join("models").display().to_string())
            .unwrap_or_default()
    };

    // Compute before struct literal — gpu_name moves into the struct
    let has_gpu = m.gpu_name.is_some();

    Ok(HardwareInfo {
        cpu_usage_percent: m.cpu_usage_percent,
        cpu_cores: m.cpu_cores,
        cpu_name: m.cpu_name,
        ram_total_mb: m.ram_total_mb,
        ram_used_mb: m.ram_used_mb,
        ram_available_mb: m.ram_available_mb,
        gpu_error: m.gpu_error,
        gpu_name: m.gpu_name,
        gpu_vram_total_mb: m.gpu_vram_total_mb,
        gpu_vram_used_mb: m.gpu_vram_used_mb,
        gpu_vram_free_mb: m.gpu_vram_free_mb,
        gpu_utilization_percent: m.gpu_utilization_percent,
        gpu_temperature_c: m.gpu_temperature_c,
        process_ram_mb: m.process_ram_mb,
        process_vram_mb: m.process_vram_mb,
        cpu_threads: None,
        disk_free_mb: None,
        cuda_version: None,
        nvml_available: has_gpu,
        model_dir,
    })
}

/// Scan the models directory for GGUF files.
#[tauri::command]
#[specta::specta]
pub async fn scan_models(
    state: State<'_, PlatformState>,
) -> Result<Vec<ModelInfo>, String> {
    let loader = get_loader(&state).await?;
    let entries = loader.scan_models().await.map_err(|e| e.to_string())?;

    Ok(entries
        .into_iter()
        .map(|e| ModelInfo {
            id: e.id,
            filename: e.filename,
            architecture: e.architecture,
            parameter_count: e.parameter_count,
            quant_level: e.quant_level,
            context_length: e.context_length,
            size_mb: e.size_bytes / (1024 * 1024),
            vram_estimate_mb: e.vram_estimate_mb,
            supported_backends: e.supported_backends.iter().map(|b| b.to_string()).collect(),
            compatible_capabilities: e
                .compatible_capabilities
                .iter()
                .map(|c| c.to_string())
                .collect(),
        })
        .collect())
}

/// Get all registered slots.
#[tauri::command]
#[specta::specta]
pub async fn get_slots(
    state: State<'_, PlatformState>,
) -> Result<Vec<SlotInfo>, String> {
    let loader = get_loader(&state).await?;
    let slots = loader.list_slots().await;
    let models = loader.scan_models().await.unwrap_or_default();

    Ok(slots
        .into_iter()
        .map(|s| {
            let (embedded, bundled_path) = match &s.source_tier {
                devpulse_engine::platform::ModelSourceTier::Bundled { bundled_path } => {
                    (true, Some(bundled_path.clone()))
                }
                devpulse_engine::platform::ModelSourceTier::UserManaged => (false, None),
            };

            // Look up assigned model for view fields
            let assigned_model = s
                .assigned_model
                .as_ref()
                .and_then(|mid| models.iter().find(|m| &m.id == mid));

            SlotInfo {
                id: s.id,
                label: s.label,
                capability: s.capability.to_string(),
                preferred_device: s.preferred_device.to_string(),
                loading_strategy: s.loading.to_string(),
                assigned_model_id: s.assigned_model,
                fallback: s.fallback,
                runtime: s.runtime.map(|r| r.to_string()),
                default_model: s.default_model,
                requires: s.requires,
                overrides: s.overrides,
                embedded,
                bundled_path,
                architecture: assigned_model.map(|m| m.architecture.clone()),
                context_length: assigned_model.map(|m| m.context_length as u32),
                backend: None, // Populated from runtime pool when slot is loaded (future)
            }
        })
        .collect())
}

/// VRAM budget plan — per-slot VRAM allocation breakdown.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VramBudgetInfo {
    /// Total VRAM on the GPU in MB (0 if no GPU).
    pub total_vram_mb: u64,
    /// Currently used VRAM across all loaded models in MB.
    pub currently_used_mb: u64,
    /// VRAM needed by all planned-to-load slots.
    pub planned_load_mb: u64,
    /// Remaining VRAM after all planned loads. Negative means won't fit.
    pub remaining_after_plan_mb: i64,
    /// Whether all planned loads fit in available VRAM.
    pub fits: bool,
    /// Per-slot breakdown.
    pub per_slot: Vec<SlotBudgetEntryInfo>,
}

/// A single slot's VRAM contribution.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct SlotBudgetEntryInfo {
    /// Slot identifier.
    pub slot_id: String,
    /// Assigned model name (for display).
    pub model_name: String,
    /// Estimated VRAM for this model in MB.
    pub vram_estimate_mb: u64,
    /// Status: "loaded", "planned", "wont_fit", "unassigned", "shared".
    pub status: String,
    /// Other slot IDs sharing this model instance.
    pub shared_with: Vec<String>,
}

/// Get the VRAM budget plan — per-slot VRAM allocation breakdown.
#[tauri::command]
#[specta::specta]
pub async fn get_vram_budget(
    state: State<'_, PlatformState>,
) -> Result<VramBudgetInfo, String> {
    let loader = get_loader(&state).await?;
    let budget = loader.vram_budget_plan().await;
    Ok(VramBudgetInfo {
        total_vram_mb: budget.total_vram_mb,
        currently_used_mb: budget.currently_used_mb,
        planned_load_mb: budget.planned_load_mb,
        remaining_after_plan_mb: budget.remaining_after_plan_mb,
        fits: budget.fits(),
        per_slot: budget
            .per_slot
            .into_iter()
            .map(|s| SlotBudgetEntryInfo {
                slot_id: s.slot_id,
                model_name: s.model_name,
                vram_estimate_mb: s.vram_estimate_mb,
                status: s.status.to_string(),
                shared_with: s.shared_with,
            })
            .collect(),
    })
}

/// Get the model download catalog from the TOML config.
///
/// Returns the full catalog of downloadable models per slot.
/// The frontend uses this instead of hardcoded constants.
#[tauri::command]
#[specta::specta]
pub async fn get_model_catalog(
    state: State<'_, PlatformState>,
) -> Result<Vec<devpulse_engine::platform::config::CatalogEntry>, String> {
    let platform = state.platform.read().await;
    let platform = platform
        .as_ref()
        .ok_or_else(|| "Platform not booted".to_string())?;
    Ok(platform.model_loader_catalog().to_vec())
}

/// Check if this is the first run (no models configured).
#[tauri::command]
#[specta::specta]
pub async fn is_first_run(
    state: State<'_, PlatformState>,
) -> Result<bool, String> {
    let loader = get_loader(&state).await?;
    Ok(loader.is_first_run().await)
}

/// Assign a model to a slot.
#[tauri::command]
#[specta::specta]
pub async fn assign_model_to_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
    model_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .assign_model(&slot_id, &model_id)
        .await
        .map_err(|e| e.to_string())
}

/// Load a slot's assigned model into memory.
#[tauri::command]
#[specta::specta]
pub async fn load_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .load_slot(&slot_id)
        .await
        .map_err(|e| e.to_string())
}

/// Unload a slot's model from memory.
#[tauri::command]
#[specta::specta]
pub async fn unload_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .unload_slot(&slot_id)
        .await
        .map_err(|e| e.to_string())
}

/// Atomically swap the model on a slot (unload → reassign → load).
///
/// Blocks inference to the slot for the entire duration. The frontend
/// should show SwapOverlay while this runs — events are emitted via
/// `model:swap-started`, `model:swap-complete`, `model:swap-failed`.
#[tauri::command]
#[specta::specta]
pub async fn swap_slot_model(
    state: State<'_, PlatformState>,
    slot_id: String,
    new_model_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .swap_model(&slot_id, &new_model_id)
        .await
        .map_err(|e| e.to_string())
}

/// Start downloading a model from HuggingFace.
/// Returns the download ID for progress tracking.
#[tauri::command]
#[specta::specta]
pub async fn download_model(
    state: State<'_, PlatformState>,
    repo_id: String,
    filename: String,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;
    loader
        .download_model(&repo_id, &filename)
        .await
        .map_err(|e| e.to_string())
}

/// Cancel an active model download.
#[tauri::command]
#[specta::specta]
pub async fn cancel_download(
    state: State<'_, PlatformState>,
    download_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .cancel_download(&download_id)
        .await
        .map_err(|e| e.to_string())
}

/// Search result from HuggingFace.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HfSearchResultInfo {
    /// Repository ID (e.g. `"bartowski/Qwen3-14B-GGUF"`).
    pub repo_id: String,
    /// Author or organization name.
    pub author: String,
    /// Model display name.
    pub model_name: String,
    /// Total download count on HuggingFace.
    pub downloads: u64,
    /// Like count on HuggingFace.
    pub likes: u64,
    /// Pipeline tag (e.g. `"text-generation"`).
    pub pipeline_tag: Option<String>,
    /// Model card tags.
    pub tags: Vec<String>,
    /// GGUF files available in this repo.
    pub gguf_files: Vec<HfFileInfoItem>,
    /// Last modified timestamp.
    pub last_modified: String,
}

/// A GGUF file in a HuggingFace repo.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct HfFileInfoItem {
    /// Filename (e.g. `"Qwen3-14B-Q4_K_M.gguf"`).
    pub filename: String,
    /// File size in bytes.
    pub size_bytes: u64,
    /// Inferred quantization level from filename.
    pub quant_level: Option<String>,
}

/// Warm a slot — load weights to CPU RAM only, no GPU allocation.
///
/// Model enters "Warm" state: weights in RAM, fast activation to GPU later.
#[tauri::command]
#[specta::specta]
pub async fn warm_slot(
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .warm_slot(&slot_id)
        .await
        .map_err(|e| e.to_string())
}

/// Delete a model from disk and remove from registry.
///
/// Clears any slot assignments. Refuses if the model is currently loaded.
#[tauri::command]
#[specta::specta]
pub async fn delete_model(
    state: State<'_, PlatformState>,
    model_id: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .delete_model(&model_id)
        .await
        .map_err(|e| e.to_string())
}

/// Search HuggingFace for GGUF models.
#[tauri::command]
#[specta::specta]
pub async fn search_huggingface(
    state: State<'_, PlatformState>,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<HfSearchResultInfo>, String> {
    let loader = get_loader(&state).await.map_err(|e| {
        tracing::error!(query = %query, error = %e, "search_huggingface: loader unavailable");
        e
    })?;
    let results = loader
        .search_huggingface(&query, limit.unwrap_or(20))
        .await
        .map_err(|e| {
            tracing::error!(query = %query, error = %e, "search_huggingface: HF API failed");
            e.to_string()
        })?;

    Ok(results
        .into_iter()
        .map(|r| HfSearchResultInfo {
            repo_id: r.repo_id,
            author: r.author,
            model_name: r.model_name,
            downloads: r.downloads,
            likes: r.likes,
            pipeline_tag: r.pipeline_tag,
            tags: r.tags,
            gguf_files: r
                .gguf_files
                .into_iter()
                .map(|f| HfFileInfoItem {
                    filename: f.filename,
                    size_bytes: f.size_bytes,
                    quant_level: f.quant_level,
                })
                .collect(),
            last_modified: r.last_modified,
        })
        .collect())
}

/// Auto-configure model recommendations based on detected hardware.
#[tauri::command]
#[specta::specta]
pub async fn auto_configure(
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;
    let config = loader.auto_configure().await;
    serde_json::to_string(&config).map_err(|e| e.to_string())
}

/// Get all wizard copy strings (titles, subtitles, tooltips, button labels).
///
/// Loads from `.userdata/config/wizard_copy.toml` if present, falls back to
/// embedded `wizard_copy.default.toml`. Frontend caches the result.
#[tauri::command]
#[specta::specta]
pub async fn get_wizard_copy(
    state: State<'_, PlatformState>,
) -> Result<devpulse_engine::platform::services::model_loader::WizardCopy, String> {
    let lock = state.platform.read().await;
    let platform = lock
        .as_ref()
        .ok_or_else(|| "Platform is still booting".to_string())?;
    let userdata = platform.data_dir();
    devpulse_engine::platform::services::model_loader::WizardCopy::load(userdata)
        .map_err(|e| format!("Failed to load wizard copy: {e}"))
}

/// Get the display metadata for the detected hardware tier.
///
/// Returns the tier name, description, semantic role, and tooltip.
/// Frontend maps `role` to SD5 design tokens via `ROLE_TOKENS` constant.
#[tauri::command]
#[specta::specta]
pub async fn get_tier_display(
    state: State<'_, PlatformState>,
) -> Result<devpulse_engine::platform::services::model_loader::TierDisplay, String> {
    let loader = get_loader(&state).await?;
    let config = loader.auto_configure().await;
    Ok(config.tier.display())
}

/// Called when the setup wizard finishes.
///
/// 1. Re-scans the model registry to pick up any newly downloaded/imported models.
/// 2. Auto-assigns unassigned models to matching slots by capability.
/// 3. Verifies at least the chat.brain slot has an assigned model.
/// 4. Only THEN emits the models-ready signal and opens the chat window.
///
/// Returns error if no text-generation model is available for chat.brain.
#[tauri::command]
#[specta::specta]
pub async fn complete_model_setup(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;

    // Re-scan to pick up anything downloaded/imported during wizard
    if let Err(e) = loader.scan_models().await {
        tracing::warn!(error = %e, "Post-wizard scan failed (non-fatal)");
    }

    // Auto-assign: for each unassigned user-managed slot, find a compatible model
    let slots = loader.list_slots().await;
    let registry = loader.get_registry().await;

    for slot in &slots {
        if slot.assigned_model.is_some() {
            continue; // Already assigned
        }
        // Find first compatible model by capability
        for model in &registry {
            let cap_str = slot.capability.to_string();
            if model.compatible_capabilities.iter().any(|c| c.to_string() == cap_str) {
                if let Err(e) = loader.assign_model(&slot.id, &model.id).await {
                    tracing::warn!(slot = %slot.id, model = %model.id, error = %e,
                        "Auto-assign failed (non-fatal)");
                } else {
                    tracing::info!(slot = %slot.id, model = %model.filename,
                        "Auto-assigned model to slot");
                }
                break; // One model per slot
            }
        }
    }

    // Verify: chat.brain MUST have a model assigned
    let slots_after = loader.list_slots().await;
    let brain = slots_after.iter().find(|s| s.id == "chat.brain");
    let brain_assigned = brain.map(|s| s.assigned_model.is_some()).unwrap_or(false);

    let assigned_count = slots_after.iter().filter(|s| s.assigned_model.is_some()).count();
    let registry_count = loader.get_registry().await.len();

    if !brain_assigned {
        tracing::warn!(
            models = registry_count,
            assigned = assigned_count,
            "Model setup incomplete — no chat brain model available"
        );
        // Still emit status but with ready=false so UI knows
        let _ = app.emit(
            "platform:models-status",
            serde_json::json!({
                "ready": false,
                "firstRun": false,
                "modelCount": registry_count,
                "slotCount": slots_after.len(),
                "assignedCount": assigned_count,
                "error": "No AI brain model found. Import or download a text-generation model (.gguf) to get started.",
            }),
        );
        return Err("No AI brain model available. Import or download a GGUF model first.".into());
    }

    tracing::info!(
        models = registry_count,
        assigned = assigned_count,
        "Model setup verified — chat brain assigned, signaling ready"
    );

    // Emit ready signal to frontend
    let _ = app.emit(
        "platform:models-status",
        serde_json::json!({
            "ready": true,
            "firstRun": false,
            "modelCount": registry_count,
            "slotCount": slots_after.len(),
            "assignedCount": assigned_count,
        }),
    );

    // Now safe to open chat window
    if let Err(e) = crate::commands::window::open_chat_window(app).await {
        tracing::warn!(error = %e, "Chat window failed to open after setup (non-fatal)");
    }

    Ok(())
}

/// Import a model from the local filesystem.
///
/// Opens a native file picker filtered to GGUF files. Copies the selected
/// file to the models directory and re-scans the registry.
/// Returns the filename of the imported model, or error.
#[tauri::command]
#[specta::specta]
pub async fn import_local_model(
    state: State<'_, PlatformState>,
    target_slot: Option<String>,
    import_mode: Option<String>,
) -> Result<String, String> {
    // Open native file dialog on a blocking thread (rfd is sync).
    // This runs BEFORE acquiring any async locks to avoid deadlock.
    // On Windows, rfd may open behind the Tauri window — we use
    // AsyncFileDialog if available, otherwise spawn_blocking.
    let picked = {
        let dialog = rfd::AsyncFileDialog::new()
            .set_title("Import AI Model")
            .add_filter("AI Models", &["gguf", "safetensors", "onnx", "bin"])
            .add_filter("GGUF Models", &["gguf"])
            .add_filter("SafeTensors", &["safetensors"])
            .add_filter("ONNX Models", &["onnx"])
            .add_filter("All Files", &["*"])
            .pick_file()
            .await;
        dialog.map(|f| f.path().to_path_buf())
    };

    let source_path = picked.ok_or_else(|| "No file selected".to_string())?;

    let filename = source_path
        .file_name()
        .ok_or_else(|| "Invalid filename".to_string())?
        .to_string_lossy()
        .to_string();

    // Get data directory from platform config
    let loader = get_loader(&state).await?;

    // Route to correct subdirectory based on target slot
    let subdir = match target_slot.as_deref() {
        Some(slot) => {
            let prefix = slot.split('.').next().unwrap_or("chat");
            match prefix {
                "chat" | "minion" => "chat",
                "voice" => "voice",
                "rag" => "rag",
                "vision" => "vision",
                _ => "chat",
            }
        }
        None => "chat",
    };

    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;
    let data_dir = platform.data_dir();
    let dest_dir = data_dir.join("models").join(subdir);
    drop(guard);

    std::fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create models/{subdir}/: {e}"))?;
    let dest_path = dest_dir.join(&filename);

    if dest_path.exists() {
        return Err(format!("Model '{filename}' already exists in models/{subdir}/"));
    }

    let mode = import_mode.as_deref().unwrap_or("copy");
    match mode {
        "symlink" => {
            #[cfg(target_os = "windows")]
            {
                std::os::windows::fs::symlink_file(&source_path, &dest_path)
                    .map_err(|e| format!(
                        "Failed to create symlink (Windows may require administrator privileges): {e}"
                    ))?;
            }
            #[cfg(not(target_os = "windows"))]
            {
                std::os::unix::fs::symlink(&source_path, &dest_path)
                    .map_err(|e| format!("Failed to create symlink: {e}"))?;
            }
            tracing::info!(
                source = %source_path.display(),
                dest = %dest_path.display(),
                mode = "symlink",
                subdir = subdir,
                "Created symlink for model"
            );
        }
        _ => {
            std::fs::copy(&source_path, &dest_path)
                .map_err(|e| format!("Failed to copy model: {e}"))?;
            tracing::info!(
                source = %source_path.display(),
                dest = %dest_path.display(),
                mode = "copy",
                subdir = subdir,
                "Copied model file"
            );
        }
    }

    // Re-scan registry to discover the new model
    loader.scan_models().await.map_err(|e| format!("Scan failed: {e}"))?;

    tracing::info!(filename = %filename, "Local model imported successfully");
    Ok(filename)
}

/// Open a native folder picker dialog.
///
/// Returns the selected directory path, or error if cancelled.
#[tauri::command]
#[specta::specta]
pub async fn pick_directory(
    title: String,
) -> Result<String, String> {
    let picked = rfd::AsyncFileDialog::new()
        .set_title(&title)
        .pick_folder()
        .await;

    let folder = picked.ok_or_else(|| "No folder selected".to_string())?;
    Ok(folder.path().to_string_lossy().to_string())
}

/// Create a developer profile and persist it as a preference.
///
/// Stores a JSON blob with name, experience level, and optional project path.
/// Uses the same preferences.json storage as `set_preference`.
#[tauri::command]
#[specta::specta]
pub async fn create_dev_profile(
    state: State<'_, PlatformState>,
    name: String,
    experience: String,
    project_path: Option<String>,
) -> Result<(), String> {
    let profile = serde_json::json!({
        "type": "dev",
        "name": name,
        "experience": experience,
        "project_path": project_path,
        "created": chrono::Utc::now().to_rfc3339(),
    });

    // Write to preferences.json — same storage as set_preference command
    let guard = state.platform.read().await;
    let platform = guard.as_ref().ok_or("Platform not ready")?;
    let prefs_path = platform.config().data_dir.clone();
    drop(guard);

    let prefs_file = std::path::PathBuf::from(&prefs_path).join("preferences.json");

    let mut prefs: std::collections::HashMap<String, String> = if prefs_file.exists() {
        let content = std::fs::read_to_string(&prefs_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        std::collections::HashMap::new()
    };

    prefs.insert("dev_profile".to_string(), profile.to_string());
    let json = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;

    if let Some(parent) = prefs_file.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&prefs_file, json).map_err(|e| e.to_string())?;

    tracing::info!(name = %name, experience = %experience, "Developer profile created");
    Ok(())
}

/// Generate text using a loaded model slot.
///
/// Gets an InferenceHandle from the model loader (resolves fallback chain),
/// streams tokens via Tauri events, returns the full generated text.
/// Hard fails if no model is loaded — no silent fallback.
#[tauri::command]
#[specta::specta]
pub async fn inference_generate(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
    prompt: String,
    max_tokens: u32,
    temperature: f32,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;

    let handle = loader
        .inference_handle(&slot_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            format!(
                "No model loaded in slot '{slot_id}'. Open Model Control to set up your AI."
            )
        })?;

    // Stamp request with trace ID for cross-thread span correlation
    let trace_ctx = devpulse_engine::platform::telemetry::TraceContext::new();
    tracing::info!(
        trace_id = %trace_ctx.trace_id,
        slot = %slot_id,
        prompt_len = prompt.len(),
        max_tokens,
        temperature,
        "inference_generate: starting"
    );

    // Start generation — returns a receiver for streaming tokens
    let token_rx = handle
        .generate(prompt, max_tokens, temperature, trace_ctx.trace_id.clone())
        .await
        .map_err(|e| format!("Inference failed: {e:#}"))?;

    // Stream tokens to frontend via Tauri events, collect full text
    let mut full_text = String::new();
    while let Ok(response) = token_rx.recv_async().await {
        match response {
            devpulse_engine::platform::integrations::InferenceResponse::Token { text, .. } => {
                let _ = app.emit("inference-token", &text);
                full_text.push_str(&text);
            }
            devpulse_engine::platform::integrations::InferenceResponse::Done(text) => {
                full_text = text;
                break;
            }
            devpulse_engine::platform::integrations::InferenceResponse::Error(e) => {
                return Err(format!("Generation error: {e}"));
            }
        }
    }

    Ok(full_text)
}

/// Simplified inference for wizard test chat.
///
/// Wraps `inference_generate` with sensible defaults so the frontend
/// only needs to send `slot_id` and `prompt`.
#[tauri::command]
#[specta::specta]
pub async fn test_inference(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
    prompt: String,
) -> Result<String, String> {
    inference_generate(app, state, slot_id, prompt, 256, 0.7).await
}

// ── Capability commands: embedder / reranker / vision ───────────────

/// Embed a batch of texts via the embedder model loaded in a slot.
///
/// Returns one dense vector per input string, all the same dimensionality.
/// Hard-fails if the slot has no embedder loaded — no silent fallback.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(slot_id, count = texts.len()))]
pub async fn embed_batch(
    state: State<'_, PlatformState>,
    slot_id: String,
    texts: Vec<String>,
) -> Result<Vec<Vec<f32>>, String> {
    let loader = get_loader(&state).await?;
    let refs: Vec<&str> = texts.iter().map(String::as_str).collect();
    loader
        .embed(&slot_id, &refs)
        .await
        .map_err(|e| format!("Embedding failed: {e:#}"))
}

/// Embed a single text — convenience wrapper over [`embed_batch`].
#[tauri::command]
#[specta::specta]
pub async fn embed_text(
    state: State<'_, PlatformState>,
    slot_id: String,
    text: String,
) -> Result<Vec<f32>, String> {
    let mut vectors = embed_batch(state, slot_id, vec![text]).await?;
    vectors
        .pop()
        .ok_or_else(|| "Embedding returned empty result".to_string())
}

/// Rerank documents against a query via the reranker model loaded in a slot.
///
/// Returns one score in `[0.0, 1.0]` per document, higher = more relevant.
/// Used as the second-stage refinement after initial vector search.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state, documents), fields(slot_id, count = documents.len()))]
pub async fn rerank_documents(
    state: State<'_, PlatformState>,
    slot_id: String,
    query: String,
    documents: Vec<String>,
) -> Result<Vec<f32>, String> {
    let loader = get_loader(&state).await?;
    let refs: Vec<&str> = documents.iter().map(String::as_str).collect();
    loader
        .rerank(&slot_id, &query, &refs)
        .await
        .map_err(|e| format!("Rerank failed: {e:#}"))
}

/// Encode an image file on disk via the vision encoder loaded in a slot.
///
/// Returns a dense embedding vector (e.g. 1152-dim for SigLIP2-SO400M).
/// Used for screenshot understanding, visual search, cross-modal retrieval.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(slot_id, path))]
pub async fn encode_image(
    state: State<'_, PlatformState>,
    slot_id: String,
    path: String,
) -> Result<Vec<f32>, String> {
    let loader = get_loader(&state).await?;
    let img_path = std::path::PathBuf::from(path);
    loader
        .encode_image(&slot_id, &img_path)
        .await
        .map_err(|e| format!("Image encode failed: {e:#}"))
}
