use serde::{Deserialize, Serialize};

/// Capture result returned to frontend
#[derive(Debug, Clone, Serialize)]
pub struct CaptureResult {
    /// Unique ID for this capture
    pub id: String,
    /// Base64-encoded PNG data
    pub data_base64: String,
    /// Width in pixels
    pub width: u32,
    /// Height in pixels
    pub height: u32,
    /// Timestamp (Unix ms)
    pub timestamp: i64,
    /// Optional file path if saved
    pub file_path: Option<String>,
}

/// Region for manual capture
#[derive(Debug, Clone, Deserialize)]
pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Save options for captures
#[derive(Debug, Clone, Deserialize)]
pub struct SaveOptions {
    /// Save globally or to project
    pub scope: SaveScope,
    /// Project ID if scope is Project
    pub project_id: Option<String>,
    /// Optional custom filename
    pub filename: Option<String>,
}

#[derive(Debug, Clone, Deserialize, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SaveScope {
    Global,
    Project,
}

/// Screen/monitor information
#[derive(Debug, Clone, Serialize)]
pub struct ScreenInfo {
    pub id: u32,
    pub name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
    pub scale_factor: f32,
}

/// Saved capture metadata
#[derive(Debug, Clone, Serialize)]
pub struct SavedCapture {
    pub id: String,
    pub filename: String,
    pub path: String,
    pub created_at: i64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub file_size: u64,
}

/// Capture filter options
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)] // Fields reserved for future filtering
pub struct CaptureFilters {
    pub scope: Option<SaveScope>,
    pub project_id: Option<String>,
    pub start_date: Option<i64>,
    pub end_date: Option<i64>,
    pub limit: Option<usize>,
}
