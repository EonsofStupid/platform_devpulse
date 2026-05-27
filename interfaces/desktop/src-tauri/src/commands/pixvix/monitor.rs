//! xcap-backed monitor enumeration + one-shot capture.
//!
//! Threading discipline: every xcap call goes through
//! `tokio::task::spawn_blocking`. xcap's `capture_image` is synchronous
//! and takes 10–80ms — putting it on a tokio executor thread would
//! starve other futures. The accessors (`name()`, `width()`, etc.) are
//! also fallible OS calls; we tolerate per-field failures and fall
//! back to safe defaults rather than dropping the whole monitor.
//!
//! All shared helpers (`now_ms`, `encode_png`, `data_url`) come from
//! `commands::_util`. Errors classified via `CommandError` so the UI
//! can `switch (err.kind)` instead of substring matching.
#![expect(
    clippy::missing_errors_doc,
    reason = "Tauri command module — every Result-returning fn is a thin wrapper that schedules an xcap call on the blocking pool. Failure modes (xcap I/O, task-join, NotFound on stale monitor id) are spelled out per-fn above."
)]

use std::time::Instant;

use devpulse_telemetry::spawn_blocking;

use super::dto::{CapturedFrame, MonitorInfo};
use crate::commands::_util::{data_url, encode_png, now_ms, CommandError, ErrorKind};

/// List every monitor currently attached.
///
/// Returns an empty vector on systems with no displays (headless CI)
/// rather than an error — the UI renders the empty state cleanly.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_list_monitors() -> Result<Vec<MonitorInfo>, CommandError> {
    spawn_blocking(list_monitors_blocking)
        .await
        .map_err(|e| CommandError::internal(format!("monitor enumeration task failed: {e}")))?
}

fn list_monitors_blocking() -> Result<Vec<MonitorInfo>, CommandError> {
    let monitors = xcap::Monitor::all()
        .map_err(|e| CommandError::internal(format!("xcap::Monitor::all failed: {e}")))?;

    let mut out = Vec::with_capacity(monitors.len());
    for m in &monitors {
        out.push(monitor_to_info(m));
    }
    Ok(out)
}

/// Capture monitor `id` once and return the encoded frame.
///
/// `id` is the OS-level handle from `MonitorInfo::id`. If the monitor
/// disappeared between enumeration and this call, returns
/// `ErrorKind::NotFound`.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_capture_monitor_once(id: u32) -> Result<CapturedFrame, CommandError> {
    spawn_blocking(move || capture_monitor_blocking(id))
        .await
        .map_err(|e| CommandError::internal(format!("capture task panicked: {e}")))?
}

fn capture_monitor_blocking(id: u32) -> Result<CapturedFrame, CommandError> {
    let monitors = xcap::Monitor::all()
        .map_err(|e| CommandError::internal(format!("xcap::Monitor::all failed: {e}")))?;

    let target = monitors
        .into_iter()
        .find(|m| m.id().is_ok_and(|monitor_id| monitor_id == id))
        .ok_or_else(|| CommandError::not_found(format!("monitor id {id} not present")))?;

    let captured_at_ms = now_ms();
    let capture_start = Instant::now();
    let img = target.capture_image().map_err(|e| {
        let s = e.to_string();
        let lower = s.to_ascii_lowercase();
        // xcap surfaces permission failures inside an opaque message
        // string per `XCapError::Error(String)`. Best-effort string
        // match keeps the typed surface clean for the UI.
        let kind = if lower.contains("permission") || lower.contains("denied") {
            ErrorKind::PermissionDenied
        } else {
            ErrorKind::Internal
        };
        CommandError::new(kind, s)
    })?;
    let capture_ms = capture_start.elapsed().as_secs_f32() * 1000.0;

    let (width, height) = (img.width(), img.height());
    let encode_start = Instant::now();
    let png_bytes = encode_png(&img)?;
    let encode_ms = encode_start.elapsed().as_secs_f32() * 1000.0;
    let byte_len = png_bytes.len() as u32;
    let data_url = data_url("image/png", &png_bytes);

    Ok(CapturedFrame {
        captured_at_ms,
        source_kind: "monitor".into(),
        source_id: id,
        width,
        height,
        data_url,
        byte_len,
        capture_ms,
        encode_ms,
    })
}

// ── Helpers ─────────────────────────────────────────────────────────

/// Project an `xcap::Monitor` into `MonitorInfo`, swallowing per-field
/// accessor failures with safe defaults so one flaky field doesn't drop
/// the whole monitor from the list.
fn monitor_to_info(m: &xcap::Monitor) -> MonitorInfo {
    MonitorInfo {
        id: m.id().unwrap_or(0),
        name: m
            .friendly_name()
            .or_else(|_| m.name())
            .unwrap_or_else(|_| "<unknown>".into()),
        x: m.x().unwrap_or(0),
        y: m.y().unwrap_or(0),
        width: m.width().unwrap_or(0),
        height: m.height().unwrap_or(0),
        scale_factor: m.scale_factor().unwrap_or(1.0),
        frequency: m.frequency().unwrap_or(0.0),
        is_primary: m.is_primary().unwrap_or(false),
        is_builtin: m.is_builtin().unwrap_or(false),
    }
}
