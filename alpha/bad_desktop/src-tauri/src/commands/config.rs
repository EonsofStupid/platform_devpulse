//! Config commands - platform and user settings
//!
//! Commands:
//! - Model path: get_model_path, set_model_path, check_model_path
//! - Platform config: set/get/list/delete_platform_config
//! - User config: set/get/list/delete_user_config

use crate::state::AppState;
use crate::types::{ConfigEntryJson, ModelPathCheck};
use tauri::{AppHandle, Manager, State};

/// Get model base path
#[tauri::command]
pub async fn get_model_path(app: AppHandle) -> Result<String, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let config_file = config_dir.join("config.json");

    if config_file.exists() {
        let content = std::fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
        if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
            if let Some(path) = config.get("model_path").and_then(|v| v.as_str()) {
                return Ok(path.to_string());
            }
        }
    }

    // Default path
    Ok(r"D:\localdev\dp_alpha\models".to_string())
}

/// Set model base path
#[tauri::command]
pub async fn set_model_path(app: AppHandle, path: String) -> Result<(), String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;

    let config_file = config_dir.join("config.json");

    // Read existing config or create new
    let mut config: serde_json::Value = if config_file.exists() {
        let content = std::fs::read_to_string(&config_file).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    // Update model_path
    config["model_path"] = serde_json::json!(path);

    // Write back
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&config_file, content).map_err(|e| e.to_string())?;

    Ok(())
}

/// Check if a path exists and contains models
#[tauri::command]
pub async fn check_model_path(path: String) -> Result<ModelPathCheck, String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Ok(ModelPathCheck {
            exists: false,
            model_count: 0,
            models: vec![],
        });
    }

    // Look for model directories (folders containing .gguf files)
    let mut models = Vec::new();
    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                // Check if directory contains .gguf files
                if let Ok(files) = std::fs::read_dir(entry.path()) {
                    let has_gguf = files
                        .flatten()
                        .any(|f| f.path().extension().map(|e| e == "gguf").unwrap_or(false));
                    if has_gguf {
                        models.push(entry.file_name().to_string_lossy().to_string());
                    }
                }
            }
        }
    }

    Ok(ModelPathCheck {
        exists: true,
        model_count: models.len(),
        models,
    })
}

// ============== Platform Config Commands ==============

/// Set platform config (global settings like max_context_tokens, legal text)
#[tauri::command]
pub async fn set_platform_config(
    key: String,
    value: String,
    category: String,
    description: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.set_platform_config(&key, &value, &category, description.as_deref())
        .await
        .map_err(|e| e.to_string())
}

/// Get platform config value
#[tauri::command]
pub async fn get_platform_config(
    key: String,
    state: State<'_, AppState>,
) -> Result<Option<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.get_platform_config(&key)
        .await
        .map(|opt| opt.map(ConfigEntryJson::from))
        .map_err(|e| e.to_string())
}

/// List platform config (optionally filtered by category)
#[tauri::command]
pub async fn list_platform_config(
    category: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.list_platform_config(category.as_deref())
        .await
        .map(|entries| entries.into_iter().map(ConfigEntryJson::from).collect())
        .map_err(|e| e.to_string())
}

/// Delete platform config entry
#[tauri::command]
pub async fn delete_platform_config(key: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.delete_platform_config(&key)
        .await
        .map_err(|e| e.to_string())
}

// ============== User Config Commands ==============

/// Set user config (global user preferences like theme, API keys)
#[tauri::command]
pub async fn set_user_config(
    key: String,
    value: String,
    category: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.set_user_config(&key, &value, &category)
        .await
        .map_err(|e| e.to_string())
}

/// Get user config value
#[tauri::command]
pub async fn get_user_config(
    key: String,
    state: State<'_, AppState>,
) -> Result<Option<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.get_user_config(&key)
        .await
        .map(|opt| opt.map(ConfigEntryJson::from))
        .map_err(|e| e.to_string())
}

/// List user config (optionally filtered by category)
#[tauri::command]
pub async fn list_user_config(
    category: Option<String>,
    state: State<'_, AppState>,
) -> Result<Vec<ConfigEntryJson>, String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.list_user_config(category.as_deref())
        .await
        .map(|entries| entries.into_iter().map(ConfigEntryJson::from).collect())
        .map_err(|e| e.to_string())
}

/// Delete user config entry
#[tauri::command]
pub async fn delete_user_config(key: String, state: State<'_, AppState>) -> Result<(), String> {
    let engine = state.engine().await?;
    let db = engine.database();

    db.delete_user_config(&key)
        .await
        .map_err(|e| e.to_string())
}
