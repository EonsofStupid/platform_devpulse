//! xcap-backed window enumeration + one-shot capture.
//!
//! Wayland degraded mode: per-window capture is broken or limited on
//! most Wayland compositors (xcap issues #112, #136). The lister
//! returns a `WindowCapability::MonitorOnly` flag in that case so the
//! UI can hide the window-pick option instead of pretending it works.
//! Detection is strictly compile-time (Linux + WAYLAND_DISPLAY env)
//! since runtime capability probing would mean *trying* a capture and
//! catching the failure, which is exactly the bad UX we're avoiding.

use std::time::Instant;

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use image::ImageFormat;

use super::dto::{
    CaptureErrorKind, CapturedFrame, WindowCapability, WindowInfo, WindowListing,
};

/// Enumerate capturable windows.
///
/// Filtered to "real" windows: title non-empty AND not minimized.
/// Tooltips, hidden helper windows, OS overlays, and most window-
/// manager artifacts get dropped — they are technically windows but
/// useless capture targets.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_list_windows() -> Result<WindowListing, String> {
    tokio::task::spawn_blocking(list_windows_blocking)
        .await
        .map_err(|e| format!("{} window enumeration task failed: {e}", CaptureErrorKind::Internal.tag()))?
}

fn list_windows_blocking() -> Result<WindowListing, String> {
    let windows = xcap::Window::all()
        .map_err(|e| format!("{} xcap::Window::all failed: {e}", CaptureErrorKind::Internal.tag()))?;

    let mut out = Vec::with_capacity(windows.len());
    for w in &windows {
        let title = w.title().unwrap_or_default();
        if title.is_empty() {
            continue;
        }
        if w.is_minimized().unwrap_or(false) {
            continue;
        }
        out.push(window_to_info(w, &title));
    }

    Ok(WindowListing {
        windows: out,
        capability: detect_capability(),
    })
}

/// Capture window `id` once and return the encoded frame.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_capture_window_once(id: u32) -> Result<CapturedFrame, String> {
    tokio::task::spawn_blocking(move || capture_window_blocking(id))
        .await
        .map_err(|e| format!("{} capture task panicked: {e}", CaptureErrorKind::Internal.tag()))?
}

fn capture_window_blocking(id: u32) -> Result<CapturedFrame, String> {
    let windows = xcap::Window::all()
        .map_err(|e| format!("{} xcap::Window::all failed: {e}", CaptureErrorKind::Internal.tag()))?;

    let target = windows
        .into_iter()
        .find(|w| w.id().is_ok_and(|window_id| window_id == id))
        .ok_or_else(|| format!("{} window id {id} not present", CaptureErrorKind::NotFound.tag()))?;

    let captured_at_ms = now_ms();
    let capture_start = Instant::now();
    let img = target.capture_image().map_err(|e| {
        let s = e.to_string();
        let kind = if s.to_lowercase().contains("permission") || s.to_lowercase().contains("denied") {
            CaptureErrorKind::PermissionDenied
        } else if s.to_lowercase().contains("not supported") || s.to_lowercase().contains("wayland") {
            CaptureErrorKind::NotSupported
        } else {
            CaptureErrorKind::Internal
        };
        format!("{} {s}", kind.tag())
    })?;
    let capture_ms = capture_start.elapsed().as_secs_f32() * 1000.0;

    let (width, height) = (img.width(), img.height());
    let encode_start = Instant::now();
    let png_bytes = encode_png(&img)?;
    let encode_ms = encode_start.elapsed().as_secs_f32() * 1000.0;
    let byte_len = png_bytes.len() as u32;
    let data_url = format!("data:image/png;base64,{}", B64.encode(&png_bytes));

    Ok(CapturedFrame {
        captured_at_ms,
        source_kind: "window".into(),
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

fn window_to_info(w: &xcap::Window, title: &str) -> WindowInfo {
    WindowInfo {
        id: w.id().unwrap_or(0),
        pid: w.pid().unwrap_or(0),
        app_name: w.app_name().unwrap_or_default(),
        title: title.to_string(),
        x: w.x().unwrap_or(0),
        y: w.y().unwrap_or(0),
        width: w.width().unwrap_or(0),
        height: w.height().unwrap_or(0),
        z: w.z().unwrap_or(0),
        is_focused: w.is_focused().unwrap_or(false),
    }
}

/// Compile-time + env probe for "is this a Wayland session that's
/// likely to break per-window capture?"
///
/// On non-Linux platforms always returns `Full`. On Linux returns
/// `MonitorOnly` when `WAYLAND_DISPLAY` is set — XWayland clients
/// might still capture fine, but we'd rather mislead-toward-safer
/// (UI hides per-window pick) than pretend everything works.
fn detect_capability() -> WindowCapability {
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WAYLAND_DISPLAY").is_some() {
            return WindowCapability::MonitorOnly;
        }
    }
    WindowCapability::Full
}

fn encode_png(img: &image::RgbaImage) -> Result<Vec<u8>, String> {
    let mut bytes = Vec::with_capacity((img.width() * img.height() * 4) as usize);
    img.write_to(&mut std::io::Cursor::new(&mut bytes), ImageFormat::Png)
        .map_err(|e| format!("{} PNG encode failed: {e}", CaptureErrorKind::Internal.tag()))?;
    Ok(bytes)
}

fn now_ms() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| i64::try_from(d.as_millis()).unwrap_or(i64::MAX))
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detect_capability_is_full_on_non_linux() {
        // Anywhere this test runs that isn't Linux, we should report Full.
        // The Wayland branch is Linux-only so it can never trip elsewhere.
        #[cfg(not(target_os = "linux"))]
        assert_eq!(detect_capability(), WindowCapability::Full);
    }
}
