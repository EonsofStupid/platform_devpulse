//! Feature flags and experiments commands
//!
//! Commands:
//! - get_feature_flags: Get all feature flags for UI visibility control
//! - is_lab_mode: Check if running in Lab mode
//! - set_feature_flag: Set a feature flag value (Lab mode only)

use serde::{Deserialize, Serialize};

/// Feature flags exposed to frontend
///
/// These control UI visibility and feature availability.
/// Read from Experiments struct and runtime context.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureFlagsJson {
    /// Voice feature enabled - show voice UI
    pub voice_enabled: bool,
    /// Lab mode UI - show developer tools
    pub lab_mode: bool,
    /// Debug capture enabled
    pub debug_capture: bool,
    /// Diagnostic mode enabled
    pub diagnostic_mode: bool,
    /// Prefer 8B models over larger ones
    pub prefer_8b: bool,
    /// CAG RRO enabled
    pub cag_rro: bool,
    /// Rumination enabled
    pub rumination_enabled: bool,
}

/// Get all feature flags for UI visibility control
///
/// Returns current state of all feature flags that affect the UI.
/// Frontend uses this to conditionally render features.
#[tauri::command]
pub fn get_feature_flags() -> Result<FeatureFlagsJson, String> {
    use orchestrator::runtime::Experiments;

    let exp = Experiments::from_env();
    let ctx = shared::config::env::context();

    Ok(FeatureFlagsJson {
        voice_enabled: exp.voice_enabled(),
        lab_mode: ctx.is_lab() || exp.lab_mode_ui_enabled(),
        debug_capture: exp.debug_capture_enabled(),
        diagnostic_mode: exp.diagnostic_mode_enabled(),
        prefer_8b: exp.prefer_8b(),
        cag_rro: exp.cag_rro_enabled(),
        rumination_enabled: exp.rumination_enabled(),
    })
}

/// Check if running in Lab mode
///
/// Lab mode enables developer tools and internal diagnostics.
/// Detected from environment (DEVPULSE_LAB_MODE or running from target/).
#[tauri::command]
pub fn is_lab_mode() -> Result<bool, String> {
    let ctx = shared::config::env::context();
    Ok(ctx.is_lab())
}

/// Set a feature flag value
///
/// Only available in Lab mode for experimentation.
/// Changes are not persisted - reset on restart.
#[tauri::command]
pub fn set_feature_flag(flag: String, enabled: bool) -> Result<(), String> {
    use orchestrator::runtime::Experiments;

    let ctx = shared::config::env::context();
    if !ctx.is_lab() {
        return Err("Feature flag changes only available in Lab mode".to_string());
    }

    let exp = Experiments::from_env();

    match flag.as_str() {
        "voice_enabled" => exp.set_voice_enabled(enabled),
        "debug_capture" => exp.set_debug_capture(enabled),
        "prefer_8b" => exp.set_prefer_8b(enabled),
        "lab_mode_ui" => exp.set_lab_mode_ui(enabled),
        "cag_rro" => exp.set_cag_rro(enabled),
        _ => return Err(format!("Unknown feature flag: {}", flag)),
    }

    Ok(())
}
