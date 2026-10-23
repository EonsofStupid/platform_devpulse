//! Action log tail + open folder — reads `.userdata/logs/action-YYYY-MM-DD.jsonl`.
//!
//! Errors are `CommandError` (the unified command error), so the Action log
//! devtool shows a classified failure instead of a bare string.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper over `paths::resolve_data_dir` and direct fs IO whose failure modes (IO error, missing data dir) are obvious from the signature."
)]
#![expect(
    clippy::needless_pass_by_value,
    reason = "Tauri command macro injects `AppHandle` by value via reflection; commands cannot take `&AppHandle` and remain `#[tauri::command]`-compatible."
)]

use crate::commands::_util::CommandError;
use crate::paths;
use serde::Serialize;
use specta::Type;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

/// Incremental tail of today's action JSONL file.
#[derive(Serialize, Type)]
pub struct ActionLogTail {
    /// New complete lines read from the log file since `from_offset`.
    pub lines: Vec<String>,
    /// Byte offset at end of file after this read (pass to the next poll).
    pub next_offset: u64,
}

fn action_log_path_today(data_dir: &Path) -> std::path::PathBuf {
    let day = chrono::Local::now().format("%Y-%m-%d");
    data_dir.join("logs").join(format!("action-{day}.jsonl"))
}

/// Read new lines from the action log starting at `from_offset` (byte offset).
#[tauri::command]
#[specta::specta]
pub fn tail_action_log(
    app: tauri::AppHandle,
    from_offset: u64,
) -> Result<ActionLogTail, CommandError> {
    let data_dir = paths::resolve_data_dir(&app).map_err(CommandError::internal)?;
    let path = action_log_path_today(&data_dir);
    if !path.exists() {
        return Ok(ActionLogTail {
            lines: Vec::new(),
            next_offset: 0,
        });
    }

    let meta = std::fs::metadata(&path)?;
    let len = meta.len();
    if from_offset >= len {
        return Ok(ActionLogTail {
            lines: Vec::new(),
            next_offset: len,
        });
    }

    let mut file = std::fs::File::open(&path)?;
    file.seek(SeekFrom::Start(from_offset))?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf)?;
    let text = String::from_utf8_lossy(&buf);
    let lines: Vec<String> = text.lines().map(std::string::ToString::to_string).collect();

    Ok(ActionLogTail {
        lines,
        next_offset: len,
    })
}

/// Open an existing folder in the OS file manager.
fn open_path_in_shell(path: &Path) -> Result<(), CommandError> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer").arg(path).spawn()?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(path).spawn()?;
    }
    #[cfg(all(unix, not(target_os = "macos"), not(target_os = "windows")))]
    {
        std::process::Command::new("xdg-open").arg(path).spawn()?;
    }
    #[cfg(not(any(unix, target_os = "windows", target_os = "macos")))]
    {
        let _ = path;
        return Err(CommandError::not_supported(
            "No file manager to open the logs folder on this platform",
        ));
    }
    Ok(())
}

/// Open the `logs` directory under the portable data dir in the OS file manager.
#[tauri::command]
#[specta::specta]
pub fn open_action_logs_folder(app: tauri::AppHandle) -> Result<(), CommandError> {
    let data_dir = paths::resolve_data_dir(&app).map_err(CommandError::internal)?;
    let logs = data_dir.join("logs");
    std::fs::create_dir_all(&logs)?;
    open_path_in_shell(&logs)
}
