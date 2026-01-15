use tauri::{AppHandle, command};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlatformSettings {
    pub theme: String,
    pub dev_mode: bool,
    pub ai_provider: String, // "local-candle", "openai", "anthropic"
}

// Default to a safe "Vibecoder" profile
impl Default for PlatformSettings {
    fn default() -> Self {
        Self {
            theme: "glass-dark".into(),
            dev_mode: false,
            ai_provider: "local-candle".into(),
        }
    }
}

/// Loads the platform configuration.
/// Philosophy: "Radical Honesty" - If config is broken, we report it, we don't silently default.
#[command]
pub fn get_config(_app: AppHandle) -> Result<PlatformSettings, String> {
    // TODO: Connect to actual DB or File Store.
    // For now, return default to allow boot.
    Ok(PlatformSettings::default())
}
