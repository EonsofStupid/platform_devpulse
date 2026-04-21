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
    /// Slot identifier (e.g. `"chat.brain"`, `"voice.tts"`).
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
    /// Whether this slot is a platform built-in (System tab in the devtool).
    ///
    /// Built-in slots are platform-essential services (primary encoder, result
    /// filter, wake-word detector). They live in the same slot table as user
    /// slots and use the same mutation path — this flag just drives the
    /// devtool grouping: Slots tab filters `!builtin`, System tab filters `builtin`.
    /// Kernel SSOT: `kernel/model-loader/config/slots.default.toml` with
    /// `builtin = true` per entry.
    pub builtin: bool,
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

// ── Conversion helpers (reused by IPC commands AND boot push) ────

/// Convert kernel `ModelRegistryEntry` → frontend `ModelInfo`.
pub fn entry_to_model_info(e: &devpulse_engine::platform::ModelRegistryEntry) -> ModelInfo {
    ModelInfo {
        id: e.id.clone(),
        filename: e.filename.clone(),
        architecture: e.architecture.clone(),
        parameter_count: e.parameter_count,
        quant_level: e.quant_level.clone(),
        context_length: e.context_length,
        size_mb: e.size_bytes / (1024 * 1024),
        vram_estimate_mb: e.vram_estimate_mb,
        supported_backends: e.supported_backends.iter().map(|b| b.to_string()).collect(),
        compatible_capabilities: e
            .compatible_capabilities
            .iter()
            .map(|c| c.to_string())
            .collect(),
    }
}

/// Convert kernel `Slot` → frontend `SlotInfo`, with registry for cross-ref.
pub fn slot_to_slot_info(
    s: &devpulse_engine::platform::Slot,
    models: &[devpulse_engine::platform::ModelRegistryEntry],
) -> SlotInfo {
    let (embedded, bundled_path) = match &s.source_tier {
        devpulse_engine::platform::ModelSourceTier::Bundled { bundled_path } => {
            (true, Some(bundled_path.clone()))
        }
        devpulse_engine::platform::ModelSourceTier::UserManaged => (false, None),
    };
    let assigned_model = s
        .assigned_model
        .as_ref()
        .and_then(|mid| models.iter().find(|m| &m.id == mid));

    SlotInfo {
        id: s.id.clone(),
        label: s.label.clone(),
        capability: s.capability.to_string(),
        preferred_device: s.preferred_device.to_string(),
        loading_strategy: s.loading.to_string(),
        assigned_model_id: s.assigned_model.clone(),
        fallback: s.fallback.clone(),
        runtime: s.runtime.map(|r| r.to_string()),
        default_model: s.default_model.clone(),
        requires: s.requires.clone(),
        overrides: s.overrides.clone(),
        embedded,
        bundled_path,
        builtin: s.builtin,
        architecture: assigned_model.map(|m| m.architecture.clone()),
        context_length: assigned_model.map(|m| m.context_length as u32),
        backend: None,
    }
}

/// Domain payload for `platform:models-status` events.
///
/// Emitted by [`emit_status`] after every mutation and at boot.
/// The frontend `startStatusListener()` receives this and sets
/// `$state` directly — zero IPC polling.
#[derive(Debug, Clone, Serialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ModelsStatusData {
    /// All registered slots with their assignments.
    pub slots: Vec<SlotInfo>,
    /// All discovered models in the registry.
    pub models: Vec<ModelInfo>,
    /// Whether this is a fresh install with no prior configuration.
    pub first_run: bool,
}

/// Read fresh state from the model loader and push via [`emit_status`].
///
/// Called after every write operation that mutates slots or registry.
/// Uses read locks only — the write lock was just released by the
/// completed operation, so these proceed instantly.
pub async fn emit_models_status(app: &tauri::AppHandle, loader: &ModelLoaderService) {
    let slots = loader.list_slots().await;
    let registry = loader.get_registry().await;
    let first_run = loader.is_first_run().await;
    let slot_infos: Vec<SlotInfo> = slots
        .iter()
        .map(|s| slot_to_slot_info(s, &registry))
        .collect();
    let model_infos: Vec<ModelInfo> = registry
        .iter()
        .map(|e| entry_to_model_info(e))
        .collect();
    crate::commands::emit_status(
        app,
        "models",
        crate::commands::StatusKind::Data,
        &ModelsStatusData {
            slots: slot_infos,
            models: model_infos,
            first_run,
        },
    );
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
///
/// String-error variant — retained for the many legacy commands that
/// return `Result<T, String>`. New load-path commands should prefer
/// [`get_loader_typed`] which returns a typed `LoadError`.
pub(crate) async fn get_loader(state: &State<'_, PlatformState>) -> Result<Arc<ModelLoaderService>, String> {
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    platform
        .model_loader()
        .cloned()
        .ok_or_else(|| "Model Loader not available (disabled or failed to boot)".to_string())
}

/// Helper: get the model loader service with a typed error.
///
/// Returns a `LoadError::Other` variant when the platform isn't ready
/// or the model loader service is disabled — this keeps the load-path
/// commands on a single typed error surface end-to-end so the
/// frontend can pattern-match without special-casing boot state.
async fn get_loader_typed(
    state: &State<'_, PlatformState>,
) -> Result<Arc<ModelLoaderService>, devpulse_engine::platform::LoadError> {
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
        .ok_or_else(|| devpulse_engine::platform::LoadError::Other {
            message: "Platform not ready".to_string(),
        })?;
    platform
        .model_loader()
        .cloned()
        .ok_or_else(|| devpulse_engine::platform::LoadError::Other {
            message: "Model Loader not available (disabled or failed to boot)".to_string(),
        })
}

/// Get hardware metrics from the model loader's hardware monitor.
#[tauri::command]
#[specta::specta]
pub async fn get_hardware_metrics(
    state: State<'_, PlatformState>,
) -> Result<HardwareInfo, String> {
    let loader = get_loader(&state).await?;
    let m = loader.hardware_metrics().await;

    // Derive model_dir from platform data_dir — P0: lock-free atomic load.
    let model_dir = state
        .platform
        .load_full()
        .map(|p| p.data_dir().join("models").display().to_string())
        .unwrap_or_default();

    // Compute before struct literal — fields move into the struct
    let has_gpu = m.gpu_name.is_some();
    let nvml_available = m.gpu_error.is_none() && has_gpu;

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
        nvml_available,
        model_dir,
    })
}

/// Scan the models directory for GGUF files.
#[tauri::command]
#[specta::specta]
pub async fn scan_models(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
) -> Result<Vec<ModelInfo>, String> {
    tracing::info!("cmd scan_models: entry — acquiring platform read lock...");
    let loader = get_loader(&state).await?;
    tracing::info!("cmd scan_models: loader acquired — starting scan (blocking_write)...");
    let entries = match loader.scan_models().await {
        Ok(e) => {
            tracing::info!(count = e.len(), "cmd scan_models: exit ok");
            e
        }
        Err(e) => {
            tracing::error!(error = %e, "cmd scan_models: exit failure");
            return Err(e.to_string());
        }
    };

    // Push fresh state after scan
    emit_models_status(&app, &loader).await;

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
    tracing::info!("cmd get_slots: entry");
    let loader = get_loader(&state).await?;
    let slots = loader.list_slots().await;
    let models = loader.get_registry().await;
    tracing::info!(slots = slots.len(), models = models.len(), "cmd get_slots: exit ok");

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
                builtin: s.builtin,
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
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
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

/// Mark the setup wizard as complete. Persists to LibSQL.
/// Called by the frontend when the user finishes the wizard.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn mark_setup_complete(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader.mark_setup_complete().await.map_err(|e| e.to_string())?;
    emit_models_status(&app, &loader).await;
    Ok(())
}

/// Check if the setup wizard was previously completed.
/// Used at boot to decide whether to show the wizard overlay.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn is_setup_complete(
    state: State<'_, PlatformState>,
) -> Result<bool, String> {
    let loader = get_loader(&state).await?;
    Ok(loader.is_setup_complete().await)
}

/// Assign a model to a slot.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(slot_id, model_id))]
pub async fn assign_model_to_slot(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
    model_id: String,
) -> Result<(), devpulse_engine::platform::LoadError> {
    tracing::info!("cmd assign_model_to_slot");
    let loader = get_loader_typed(&state).await?;
    loader.assign_model(&slot_id, &model_id).await?;
    emit_models_status(&app, &loader).await;
    Ok(())
}

/// Load a slot's assigned model into memory.
///
/// Load a model into a slot.
///
/// Routing logic:
///   - GGUF files with LlamaCpp runtime → llama-server sidecar (HTTP)
///   - SafeTensors with Candle runtime → kernel BackendPool (in-process)
///   - ONNX/Sherpa → kernel VoicePool (in-process)
///
/// Returns a typed [`LoadError`] covering the full load-path failure
/// surface — compatibility, filesystem, resources, backend init,
/// slot state. The frontend renders each variant with targeted UI
/// (alternatives for compatibility errors, retry for network errors,
/// slot reassignment for `NoModelAssigned`, etc.).
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(app, state, llama_state), fields(slot_id))]
pub async fn load_slot(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    llama_state: State<'_, crate::commands::llama::LlamaServerState>,
    slot_id: String,
) -> Result<(), devpulse_engine::platform::LoadError> {
    tracing::info!(slot = %slot_id, "cmd load_slot: entry");
    let loader = get_loader_typed(&state).await?;

    // Check if this slot should route to the llama-server sidecar.
    // GGUF files with LlamaCpp runtime → sidecar HTTP, not kernel pool.
    let use_sidecar = should_use_sidecar(&loader, &slot_id).await;

    if use_sidecar {
        tracing::info!(slot = %slot_id, "cmd load_slot: routing to llama-server sidecar");
        let result = load_via_sidecar(app.clone(), &loader, llama_state, &slot_id).await;
        if result.is_ok() {
            emit_models_status(&app, &loader).await;
        }
        return result;
    }

    // Default: kernel pool (Candle for SafeTensors, ORT for ONNX, Sherpa for ASR)
    match loader.load_slot(&slot_id).await {
        Ok(()) => {
            tracing::info!(slot = %slot_id, "cmd load_slot: exit ok (kernel pool)");
            emit_models_status(&app, &loader).await;
            Ok(())
        }
        Err(e) => {
            tracing::error!(slot = %slot_id, error = %e, "cmd load_slot: exit failure");
            Err(e)
        }
    }
}

/// Determine if a slot's assigned model should use the llama-server sidecar.
///
/// Returns true when:
///   1. The slot has runtime = LlamaCpp (explicit) OR the assigned model is GGUF format
///   2. The model file exists on disk
async fn should_use_sidecar(loader: &ModelLoaderService, slot_id: &str) -> bool {
    let slots = loader.list_slots().await;
    let slot = match slots.iter().find(|s| s.id == slot_id) {
        Some(s) => s,
        None => return false,
    };

    let model_id = match &slot.assigned_model {
        Some(id) => id.clone(),
        None => return false,
    };

    // Check if slot explicitly requests LlamaCpp runtime
    let explicit_llamacpp = slot
        .runtime
        .as_ref()
        .map(|r| r.to_string() == "LlamaCpp")
        .unwrap_or(false);

    // Check if the model is GGUF format
    let registry = loader.get_registry().await;
    let is_gguf = registry
        .iter()
        .find(|e| e.id == model_id)
        .map(|e| e.format.to_string() == "GGUF")
        .unwrap_or(false);

    // Route to sidecar if either condition is true
    explicit_llamacpp || is_gguf
}

/// Load a GGUF model via the llama-server sidecar.
///
/// Starts the sidecar process, waits for health check, then marks
/// the slot as loaded. Uses the same port (8899) and GPU offload
/// settings from the slot's extensions.
async fn load_via_sidecar(
    app: tauri::AppHandle,
    loader: &ModelLoaderService,
    llama_state: State<'_, crate::commands::llama::LlamaServerState>,
    slot_id: &str,
) -> Result<(), devpulse_engine::platform::LoadError> {
    let slots = loader.list_slots().await;
    let slot = slots
        .iter()
        .find(|s| s.id == slot_id)
        .ok_or_else(|| devpulse_engine::platform::LoadError::Other {
            message: format!("Slot '{slot_id}' not found"),
        })?;

    let model_id = slot
        .assigned_model
        .as_ref()
        .ok_or_else(|| devpulse_engine::platform::LoadError::Other {
            message: format!("No model assigned to slot '{slot_id}'"),
        })?;

    // Find the model file path from registry
    let registry = loader.get_registry().await;
    let entry = registry
        .iter()
        .find(|e| e.id == *model_id)
        .ok_or_else(|| devpulse_engine::platform::LoadError::Other {
            message: format!("Model '{model_id}' not found in registry"),
        })?;

    let model_path = entry.path.to_string_lossy().to_string();

    // Read GPU layers from slot extensions or assistant config
    let gpu_layers = slot
        .extensions
        .get("llama_cpp_ngl")
        .and_then(|s| s.parse::<i32>().ok())
        .unwrap_or(999); // default: all layers on GPU

    let ctx_size = entry.context_length as u32;
    let ctx_size = if ctx_size == 0 { 8192 } else { ctx_size };

    tracing::info!(
        slot = %slot_id,
        model = %model_path,
        gpu_layers,
        ctx_size,
        "Starting llama-server sidecar for slot"
    );

    // Start the sidecar — this calls the same function as the manual command
    match crate::commands::llama::start_llama_server(
        app,
        llama_state,
        model_path,
        Some(8899),
        Some(gpu_layers),
        Some(ctx_size),
    )
    .await
    {
        Ok(info) => {
            tracing::info!(
                slot = %slot_id,
                port = info.port,
                pid = info.pid,
                "Sidecar started for slot"
            );
            Ok(())
        }
        Err(e) => {
            tracing::error!(
                slot = %slot_id,
                error = %e,
                "Failed to start sidecar for slot"
            );
            Err(devpulse_engine::platform::LoadError::Other {
                message: format!("Sidecar failed: {e}"),
            })
        }
    }
}

/// Unload a slot's model from memory.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(slot_id))]
pub async fn unload_slot(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), devpulse_engine::platform::LoadError> {
    tracing::info!("cmd unload_slot");
    let loader = get_loader_typed(&state).await?;
    loader.unload_slot(&slot_id).await?;
    emit_models_status(&app, &loader).await;
    Ok(())
}

/// Atomically swap the model on a slot (unload → reassign → load).
///
/// Blocks inference to the slot for the entire duration. The frontend
/// should show SwapOverlay while this runs — events are emitted via
/// `model:swap-started`, `model:swap-complete`, `model:swap-failed`.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(slot_id, new_model_id))]
pub async fn swap_slot_model(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
    new_model_id: String,
) -> Result<(), devpulse_engine::platform::LoadError> {
    tracing::info!("cmd swap_slot_model");
    let loader = get_loader_typed(&state).await?;
    loader.swap_model(&slot_id, &new_model_id).await?;
    emit_models_status(&app, &loader).await;
    Ok(())
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

/// Store or replace the HuggingFace access token. Empty string clears it.
#[tauri::command]
#[specta::specta]
pub async fn set_hf_token(
    state: State<'_, PlatformState>,
    token: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    let value = if token.trim().is_empty() {
        None
    } else {
        Some(token)
    };
    loader.set_hf_token(value).await.map_err(|e| e.to_string())
}

/// Whether an HF token is currently stored.
#[tauri::command]
#[specta::specta]
pub async fn has_hf_token(state: State<'_, PlatformState>) -> Result<bool, String> {
    let loader = get_loader(&state).await?;
    Ok(loader.has_hf_token().await)
}

/// Clear the stored HF token.
#[tauri::command]
#[specta::specta]
pub async fn clear_hf_token(state: State<'_, PlatformState>) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader.clear_hf_token().await.map_err(|e| e.to_string())
}

/// Return the last `n` characters of the stored HF token, or `null`
/// if no token is stored. Used by the HfTokenModal masked-pill display
/// so the UI can render `"••••••••hf_xxxxx"` without the plaintext
/// ever landing in frontend state.
#[tauri::command]
#[specta::specta]
pub async fn hf_token_suffix(
    state: State<'_, PlatformState>,
    count: u32,
) -> Result<Option<String>, String> {
    let loader = get_loader(&state).await?;
    Ok(loader.hf_token_suffix(count as usize).await)
}

// ═══════════════════════════════════════════════════════════════
// ASSISTANT CONFIG COMMANDS
// ═══════════════════════════════════════════════════════════════

/// Read the current assistant configuration. Voice Lab panel calls
/// this once on mount and re-reads after every mutation.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(level = "debug", skip(state), err)]
pub async fn get_assistant_config(
    state: State<'_, PlatformState>,
) -> Result<devpulse_engine::platform::services::model_loader::AssistantConfig, String> {
    let loader = get_loader(&state).await?;
    Ok(loader.get_assistant_config().await)
}

/// Rename the assistant. Persists immediately to
/// `{userdata_dir}/config/assistant.toml`.
#[tauri::command]
#[specta::specta]
pub async fn set_assistant_name(
    state: State<'_, PlatformState>,
    name: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_assistant_name(name)
        .await
        .map_err(|e| e.to_string())
}

/// Replace the wake phrase. The sherpa-onnx KWS worker reloads its
/// keywords file on next run — no model retraining needed.
#[tauri::command]
#[specta::specta]
pub async fn set_wake_phrase(
    state: State<'_, PlatformState>,
    phrase: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_wake_phrase(phrase)
        .await
        .map_err(|e| e.to_string())
}

/// Toggle 24/7 wake detection on or off.
#[tauri::command]
#[specta::specta]
pub async fn set_wake_enabled(
    state: State<'_, PlatformState>,
    enabled: bool,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_wake_enabled(enabled)
        .await
        .map_err(|e| e.to_string())
}

/// Toggle the 24/7 Moshi voice brain. When `false`, voice falls back
/// to the cascaded STT -> LLM -> TTS path.
#[tauri::command]
#[specta::specta]
pub async fn set_voice_brain_24_7(
    state: State<'_, PlatformState>,
    enabled: bool,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_voice_brain_24_7(enabled)
        .await
        .map_err(|e| e.to_string())
}

/// Replace the TTS voice profile. Accepts `kokoro:<id>` or
/// `custom:<clone_name>`.
#[tauri::command]
#[specta::specta]
pub async fn set_voice_profile(
    state: State<'_, PlatformState>,
    profile: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_voice_profile(profile)
        .await
        .map_err(|e| e.to_string())
}

/// Register a new custom voice clone entry. The UI calls this after a
/// successful MP3 upload. `reference_path` is the absolute path on
/// disk (produced by `upload_voice_sample`).
#[tauri::command]
#[specta::specta]
pub async fn register_voice_clone(
    state: State<'_, PlatformState>,
    entry: devpulse_engine::platform::services::model_loader::VoiceCloneEntry,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .register_voice_clone(entry)
        .await
        .map_err(|e| e.to_string())
}

/// Remove a registered voice clone by name.
#[tauri::command]
#[specta::specta]
pub async fn remove_voice_clone(
    state: State<'_, PlatformState>,
    name: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .remove_voice_clone(name)
        .await
        .map_err(|e| e.to_string())
}

/// Add or replace a keyword action.
#[tauri::command]
#[specta::specta]
pub async fn add_keyword_action(
    state: State<'_, PlatformState>,
    entry: devpulse_engine::platform::services::model_loader::KeywordActionEntry,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .add_keyword_action(entry)
        .await
        .map_err(|e| e.to_string())
}

/// Remove a keyword action by phrase.
#[tauri::command]
#[specta::specta]
pub async fn remove_keyword_action(
    state: State<'_, PlatformState>,
    phrase: String,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .remove_keyword_action(phrase)
        .await
        .map_err(|e| e.to_string())
}

/// Replace an existing keyword action by phrase. No-op if the phrase
/// does not match any stored entry.
#[tauri::command]
#[specta::specta]
pub async fn update_keyword_action(
    state: State<'_, PlatformState>,
    phrase: String,
    new_entry: devpulse_engine::platform::services::model_loader::KeywordActionEntry,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .update_keyword_action(phrase, new_entry)
        .await
        .map_err(|e| e.to_string())
}

/// Replace the window idle timeout in seconds. `0` disables
/// auto-minimise entirely.
#[tauri::command]
#[specta::specta]
pub async fn set_idle_timeout(
    state: State<'_, PlatformState>,
    secs: u32,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_idle_timeout(secs)
        .await
        .map_err(|e| e.to_string())
}

/// Replace the partial GPU offload layer count for `chat.brain`.
#[tauri::command]
#[specta::specta]
pub async fn set_brain_ngl(
    state: State<'_, PlatformState>,
    ngl: i32,
) -> Result<(), String> {
    let loader = get_loader(&state).await?;
    loader
        .set_brain_ngl(ngl)
        .await
        .map_err(|e| e.to_string())
}

/// Copy an MP3 file from an arbitrary source path into the custom
/// voice clones directory and return the destination absolute path.
/// The UI then passes that path to `register_voice_clone` to finalise
/// the registration. Keeping the copy + register operations split
/// keeps each Tauri command single-purpose.
///
/// Only `.mp3`, `.wav`, and `.flac` files are accepted. The source
/// path must exist. The destination filename is derived from `name`
/// to keep the user's chosen label alongside the file on disk.
#[tauri::command]
#[specta::specta]
pub async fn upload_voice_sample(
    state: State<'_, PlatformState>,
    name: String,
    source_path: String,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;
    let src = std::path::PathBuf::from(&source_path);
    if !src.exists() {
        return Err(format!("Source file does not exist: {source_path}"));
    }
    let ext = src
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    if !["mp3", "wav", "flac"].contains(&ext.as_str()) {
        return Err(format!("Unsupported audio format: .{ext} (accepted: mp3, wav, flac)"));
    }

    let dest_dir = loader.voice_custom_dir().await;
    std::fs::create_dir_all(&dest_dir).map_err(|e| format!("Failed to create voice dir: {e}"))?;

    // Sanitize `name` for filesystem safety — keep alnum, dash, underscore.
    let safe_name: String = name
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    if safe_name.is_empty() {
        return Err("Voice sample name must contain at least one alphanumeric character".into());
    }
    let dest = dest_dir.join(format!("{safe_name}.{ext}"));

    std::fs::copy(&src, &dest)
        .map_err(|e| format!("Failed to copy voice sample: {e}"))?;

    Ok(dest.to_string_lossy().into_owned())
}

/// A single Kokoro voice available via the bundled ONNX runtime.
/// Returned by [`list_kokoro_voices`] so the Voice Lab picker can
/// group by gender and render preview buttons.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct KokoroVoiceInfo {
    /// Voice ID (e.g. `"am_eric"`, `"af_bella"`).
    pub id: String,
    /// Layman label (e.g. `"American Male — Eric"`).
    pub label: String,
    /// `"male"` or `"female"`.
    pub gender: String,
    /// Short region / accent tag (e.g. `"American"`, `"British"`).
    pub region: String,
}

/// Enumerate the built-in Kokoro voices available through the bundled
/// ONNX model. The current English v0.19 release ships with ~20
/// voices split American / British + male / female. Custom voice
/// clones registered via `register_voice_clone` are NOT included
/// here — the UI joins the two lists for the final picker.
#[tauri::command]
#[specta::specta]
pub async fn list_kokoro_voices(
    _state: State<'_, PlatformState>,
) -> Result<Vec<KokoroVoiceInfo>, String> {
    // Kokoro English v0.19 voice catalog. Stable — the model file
    // carries these IDs. Updating the bundled ONNX to a later
    // release is the only reason this list changes.
    let voices = [
        ("af_alloy", "American Female — Alloy", "female", "American"),
        ("af_aoede", "American Female — Aoede", "female", "American"),
        ("af_bella", "American Female — Bella", "female", "American"),
        ("af_heart", "American Female — Heart", "female", "American"),
        ("af_jessica", "American Female — Jessica", "female", "American"),
        ("af_kore", "American Female — Kore", "female", "American"),
        ("af_nicole", "American Female — Nicole", "female", "American"),
        ("af_nova", "American Female — Nova", "female", "American"),
        ("af_river", "American Female — River", "female", "American"),
        ("af_sarah", "American Female — Sarah", "female", "American"),
        ("af_sky", "American Female — Sky", "female", "American"),
        ("am_adam", "American Male — Adam", "male", "American"),
        ("am_echo", "American Male — Echo", "male", "American"),
        ("am_eric", "American Male — Eric", "male", "American"),
        ("am_fenrir", "American Male — Fenrir", "male", "American"),
        ("am_liam", "American Male — Liam", "male", "American"),
        ("am_michael", "American Male — Michael", "male", "American"),
        ("am_onyx", "American Male — Onyx", "male", "American"),
        ("am_puck", "American Male — Puck", "male", "American"),
        ("am_santa", "American Male — Santa", "male", "American"),
        ("bf_alice", "British Female — Alice", "female", "British"),
        ("bf_emma", "British Female — Emma", "female", "British"),
        ("bf_isabella", "British Female — Isabella", "female", "British"),
        ("bf_lily", "British Female — Lily", "female", "British"),
        ("bm_daniel", "British Male — Daniel", "male", "British"),
        ("bm_fable", "British Male — Fable", "male", "British"),
        ("bm_george", "British Male — George", "male", "British"),
        ("bm_lewis", "British Male — Lewis", "male", "British"),
    ];
    Ok(voices
        .iter()
        .map(|(id, label, gender, region)| KokoroVoiceInfo {
            id: (*id).to_string(),
            label: (*label).to_string(),
            gender: (*gender).to_string(),
            region: (*region).to_string(),
        })
        .collect())
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
/// Returns a typed [`LoadError`] with the same surface as `load_slot`.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(slot_id))]
pub async fn warm_slot(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    slot_id: String,
) -> Result<(), devpulse_engine::platform::LoadError> {
    tracing::info!("cmd warm_slot");
    let loader = get_loader_typed(&state).await?;
    loader.warm_slot(&slot_id).await?;
    emit_models_status(&app, &loader).await;
    Ok(())
}

/// Delete a model from disk and remove from registry.
///
/// Clears any slot assignments. Refuses if the model is currently loaded.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(skip(state), fields(model_id))]
pub async fn delete_model(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    model_id: String,
) -> Result<(), devpulse_engine::platform::LoadError> {
    tracing::info!("cmd delete_model");
    let loader = get_loader_typed(&state).await?;
    loader.delete_model(&model_id).await?;
    emit_models_status(&app, &loader).await;
    Ok(())
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

/// List every known hardware preset — returned as a JSON-encoded
/// `Vec<AutoConfig>` so the wizard preset picker can show all options
/// (Floor / Mid / Jesse Primary / High / Minimal / CPU Only) with live
/// download sizes based on the current model registry.
///
/// JSON is used instead of a specta-typed return because `AutoConfig`
/// nests `BrainSwapPolicy` which is a struct-variant enum — parsing
/// client-side is simpler than generating a discriminated union.
#[tauri::command]
#[specta::specta]
pub async fn list_presets(
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;
    let presets = loader.list_all_presets().await;
    serde_json::to_string(&presets).map_err(|e| e.to_string())
}

/// Build the `AutoConfig` for a manually-selected hardware tier. Used
/// when the owner overrides the auto-detection in the preset picker.
///
/// Tier is passed as a lowercase string (`high`, `jesse_primary`, `mid`,
/// `floor`, `minimal`, `cpu_only`) to keep the IPC surface simple.
#[tauri::command]
#[specta::specta]
pub async fn config_for_tier(
    state: State<'_, PlatformState>,
    tier: String,
) -> Result<String, String> {
    use devpulse_engine::platform::services::model_loader::HardwareTier;

    let parsed = match tier.as_str() {
        "ultra" | "Ultra" => HardwareTier::Ultra,
        "high" | "High" => HardwareTier::High,
        "jesse_primary" | "jessePrimary" | "JessePrimary" => HardwareTier::JessePrimary,
        "mid" | "Mid" => HardwareTier::Mid,
        "floor" | "Floor" => HardwareTier::Floor,
        "minimal" | "Minimal" => HardwareTier::Minimal,
        "cpu_only" | "cpuOnly" | "CpuOnly" => HardwareTier::CpuOnly,
        other => return Err(format!("Unknown hardware tier: {other}")),
    };

    let loader = get_loader(&state).await?;
    let config = loader.config_for_tier(parsed).await;
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
    // P0: lock-free atomic load.
    let platform = state
        .platform
        .load_full()
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

    // Auto-assign loop REMOVED — wizard handles explicit per-slot assignment.
    // complete_model_setup() now only verifies and signals.

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
        crate::commands::emit_status(
            &app,
            "models",
            crate::commands::StatusKind::Error,
            &"No AI brain model found. Import or download a text-generation model (.gguf) to get started.",
        );
        return Err("No AI brain model available. Import or download a GGUF model first.".into());
    }

    tracing::info!(
        models = registry_count,
        assigned = assigned_count,
        "Model setup verified — chat brain assigned, signaling ready"
    );

    // Push full state snapshot — frontend sets $state directly
    emit_models_status(&app, &loader).await;

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
    app: tauri::AppHandle,
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

    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let data_dir = platform.data_dir();
    let dest_dir = data_dir.join("models").join(subdir);
    drop(platform);

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

    // Push fresh state — frontend sees the new model immediately
    emit_models_status(&app, &loader).await;

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

    // Write to preferences.json — same storage as set_preference command.
    // P0: lock-free atomic load.
    let platform = state.platform.load_full().ok_or("Platform not ready")?;
    let prefs_path = platform.config().data_dir.clone();
    drop(platform);

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
/// Routing:
///   - GGUF models loaded via sidecar → `llama_chat` HTTP (localhost)
///   - SafeTensors models loaded via Candle → kernel BackendPool
///   - Cloud provider → `cloud_chat` (if configured)
///
/// Streams tokens via Tauri events (`inference-token` for Candle,
/// `llama:token` for sidecar — frontend listens to both).
/// Hard fails if no model is loaded — no silent fallback.
#[tauri::command]
#[specta::specta]
pub async fn inference_generate(
    app: tauri::AppHandle,
    state: State<'_, PlatformState>,
    llama_state: State<'_, crate::commands::llama::LlamaServerState>,
    slot_id: String,
    prompt: String,
    max_tokens: u32,
    temperature: f32,
) -> Result<String, String> {
    let loader = get_loader(&state).await?;

    // ── Route 1: GGUF sidecar ────────────────────────────────
    // If this slot uses the llama-server sidecar, route through HTTP.
    // The sidecar was started by `load_slot` → `load_via_sidecar`.
    if should_use_sidecar(&loader, &slot_id).await {
        let port = *llama_state.port.lock().await;
        if port == 0 {
            return Err(format!(
                "Slot '{slot_id}' is GGUF but llama-server is not running. \
                 Load the slot first via Model Control."
            ));
        }

        tracing::info!(
            slot = %slot_id,
            port,
            prompt_len = prompt.len(),
            max_tokens,
            temperature,
            "inference_generate: routing to llama-server sidecar"
        );

        // Build chat messages — single user turn with the prompt
        let messages = vec![crate::commands::llama::ChatMessage {
            role: "user".to_string(),
            content: prompt,
        }];

        // Call the sidecar — this streams tokens via `llama:token` events
        // AND returns the full text. The frontend also gets `inference-token`
        // events re-emitted below for compatibility.
        let result = crate::commands::llama::llama_chat(
            app.clone(),
            llama_state,
            messages,
            Some(max_tokens),
            Some(temperature),
        )
        .await?;

        tracing::info!(
            slot = %slot_id,
            output_len = result.len(),
            "inference_generate: sidecar complete"
        );
        return Ok(result);
    }

    // ── Route 2: Candle in-process (SafeTensors) ─────────────
    let handle = loader
        .inference_handle(&slot_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            format!(
                "No model loaded in slot '{slot_id}'. Open Model Control to set up your AI."
            )
        })?;

    let trace_ctx = devpulse_engine::platform::telemetry::TraceContext::new();
    tracing::info!(
        trace_id = %trace_ctx.trace_id,
        slot = %slot_id,
        prompt_len = prompt.len(),
        max_tokens,
        temperature,
        "inference_generate: routing to Candle in-process"
    );

    let token_rx = handle
        .generate(prompt, max_tokens, temperature, trace_ctx.trace_id.clone())
        .await
        .map_err(|e| format!("Inference failed: {e:#}"))?;

    let mut full_text = String::new();
    let mut token_count: u32 = 0;
    while let Ok(traced) = token_rx.recv_async().await {
        match traced.value {
            devpulse_engine::platform::integrations::InferenceResponse::Token { text, .. } => {
                let _ = app.emit("inference-token", &text);
                full_text.push_str(&text);
                token_count += 1;
            }
            devpulse_engine::platform::integrations::InferenceResponse::Done(text) => {
                full_text = text;
                break;
            }
            devpulse_engine::platform::integrations::InferenceResponse::Error(e) => {
                tracing::error!(slot = %slot_id, error = %e, "inference_generate: exit failure");
                return Err(format!("Generation error: {e}"));
            }
        }
    }

    tracing::info!(
        slot = %slot_id,
        tokens = token_count,
        output_len = full_text.len(),
        "inference_generate: Candle complete"
    );
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
    llama_state: State<'_, crate::commands::llama::LlamaServerState>,
    slot_id: String,
    prompt: String,
) -> Result<String, String> {
    inference_generate(app, state, llama_state, slot_id, prompt, 256, 0.7).await
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

// ─────────────────────────────────────────────────────────────────
// Compatibility registry — architecture × backend matrix and the
// pre-download resolver. See `kernel/model-loader/src/registry/`
// for the authoring source.
// ─────────────────────────────────────────────────────────────────

/// Return the full backend compatibility matrix for this build.
///
/// The frontend calls this once at boot and caches it in a rune
/// (`modelBackendMatrix.svelte.ts`) so the `ModelCompatibilityCard`
/// can render immediately for every model tile without additional
/// IPC. The matrix reflects:
///
/// - Every architecture in the registry (Qwen3, Qwen3-MoE, Phi-3,
///   legacy Qwen2, etc.) with its tier + metadata.
/// - Every backend declaration, with an `installed` flag derived
///   from this build's Cargo features at compile time.
/// - Per-backend `(arch, format)` support declarations.
///
/// Cheap call — the matrix is a static const array with serialized
/// metadata; there's no IO or allocation on the hot path.
#[tauri::command]
#[specta::specta]
#[tracing::instrument]
#[allow(clippy::missing_errors_doc)]
pub async fn list_backend_matrix() -> Result<devpulse_engine::platform::BackendMatrix, String> {
    Ok(devpulse_engine::platform::installed_backends())
}

/// Resolve a `(arch, format)` compatibility query and return either
/// a concrete plan or an `Unsupported` variant with alternatives.
///
/// Called by the frontend pre-download gate: before starting any
/// download, the UI calls this with the arch classification of the
/// target repo and the file format. If the resolver returns
/// `Unsupported`, the UI surfaces the reason + alternatives to the
/// user and refuses to start the download.
///
/// The `arch_raw` argument is the `architectures[0]` string from
/// the HF config.json. The `model_type` is the optional fallback
/// used to disambiguate Qwen2.5 from Qwen2.
#[tauri::command]
#[specta::specta]
#[tracing::instrument(fields(arch_raw, model_type, format))]
#[allow(clippy::missing_errors_doc)]
pub async fn resolve_architecture_compatibility(
    arch_raw: String,
    model_type: Option<String>,
    format: devpulse_engine::platform::ModelFormat,
) -> Result<devpulse_engine::platform::Resolution, String> {
    let classified =
        devpulse_engine::platform::classify_arch_from_hf_config(&arch_raw, model_type.as_deref())
            .ok_or_else(|| {
                format!(
                    "Architecture `{arch_raw}` (model_type={model_type:?}) is not in the registry"
                )
            })?;
    Ok(devpulse_engine::platform::resolve_compatibility(
        classified, format,
    ))
}
