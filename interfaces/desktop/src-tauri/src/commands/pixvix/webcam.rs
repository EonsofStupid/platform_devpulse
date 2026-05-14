//! nokhwa-backed webcam enumeration + one-shot capture.
//!
//! # Threading discipline
//!
//! Every nokhwa call runs inside `tokio::task::spawn_blocking`. Tauri
//! initializes the main thread as STA via OleInitialize (Tauri issues
//! #4580, #6485); MediaFoundation needs `CoInitializeEx` per-thread
//! and accepts STA, but mixing with `app_handle.run_on_main_thread`
//! risks `RPC_E_CHANGED_MODE`. tokio worker threads each get their
//! own apartment state — nokhwa's MSMF init succeeds there.
//!
//! # Panic guard
//!
//! `nokhwa::query()` is known to panic on Windows when no webcam is
//! plugged in (issue #192). Wrap every call in `std::panic::catch_unwind`
//! and translate the panic into a typed error rather than tearing
//! down the whole tokio runtime.
//!
//! # macOS gate
//!
//! `nokhwa_initialize` triggers the AVFoundation TCC permission
//! prompt. Call once, lazily, behind a `OnceLock`. After that
//! `nokhwa_check()` reports whether the operator granted permission.
//!
//! # Device ownership
//!
//! Cannot open the same device twice on MSMF or AVF — second
//! `Camera::new` returns `OpenDeviceError`. V-3 sidesteps this by
//! opening + capturing + dropping per one-shot call (the camera
//! exists for ~50–200ms, then releases the handle). V-4's session
//! lifecycle (when it lands) owns a long-lived `nokhwa::Camera` on
//! its own dedicated worker thread.
//!
//! All shared helpers (`now_ms`, `encode_png`, `data_url`) come from
//! `commands::_util`.

use std::panic::AssertUnwindSafe;
#[cfg(target_os = "macos")]
use std::sync::OnceLock;
use std::time::Instant;

use super::dto::{CapturedFrame, WebcamInfo};
use crate::commands::_util::{data_url, encode_png, now_ms, CommandError, ErrorKind};

// ── State ───────────────────────────────────────────────────────────

/// One-shot macOS init guard. Triggers the TCC prompt the first time.
/// On non-macOS this is a no-op so callers don't need cfg-spaghetti.
#[cfg(target_os = "macos")]
fn ensure_macos_init() -> Result<(), CommandError> {
    static INIT: OnceLock<()> = OnceLock::new();
    INIT.get_or_init(|| {
        nokhwa::nokhwa_initialize(|granted| {
            tracing::info!(granted, "pixvix.webcam: macOS TCC permission result");
        });
    });
    if !nokhwa::nokhwa_check() {
        return Err(CommandError::permission_denied(
            "macOS denied camera permission — open System Settings \u{2192} Privacy & Security \u{2192} Camera",
        ));
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn ensure_macos_init() -> Result<(), CommandError> {
    Ok(())
}

// ── Commands ────────────────────────────────────────────────────────

/// Enumerate webcam-class capture devices.
///
/// Wraps `nokhwa::query` in `catch_unwind` to neutralize the
/// no-camera-plugged-in panic on Windows MSMF (issue #192).
#[tauri::command]
#[specta::specta]
pub async fn pixvix_list_webcams() -> Result<Vec<WebcamInfo>, CommandError> {
    tokio::task::spawn_blocking(list_webcams_blocking)
        .await
        .map_err(|e| CommandError::internal(format!("webcam enumeration task failed: {e}")))?
}

fn list_webcams_blocking() -> Result<Vec<WebcamInfo>, CommandError> {
    ensure_macos_init()?;

    let result = std::panic::catch_unwind(AssertUnwindSafe(|| {
        nokhwa::query(nokhwa::utils::ApiBackend::Auto)
    }));

    let cameras = match result {
        Ok(Ok(c)) => c,
        Ok(Err(e)) => {
            let s = e.to_string();
            return Err(CommandError::new(
                classify_nokhwa_error(&s),
                format!("nokhwa::query failed: {s}"),
            ));
        }
        Err(_) => {
            // Issue #192 panic path — most commonly "no camera plugged in".
            return Ok(Vec::new());
        }
    };

    Ok(cameras
        .into_iter()
        .map(|c| WebcamInfo {
            index: numeric_index(&c.index().clone()),
            human_name: c.human_name().to_string(),
            description: c.description().to_string(),
            backend_handle: c.misc().to_string(),
        })
        .collect())
}

/// Capture one frame from webcam `index`.
///
/// Opens + captures + drops per call. The pool-across-calls pattern
/// belongs in V-4's session lifecycle (`nokhwa::Camera` is `!Send`,
/// so a tokio-worker pool would not type-check).
#[tauri::command]
#[specta::specta]
pub async fn pixvix_capture_webcam_once(index: u32) -> Result<CapturedFrame, CommandError> {
    tokio::task::spawn_blocking(move || capture_webcam_blocking(index))
        .await
        .map_err(|e| CommandError::internal(format!("webcam capture task panicked: {e}")))?
}

fn capture_webcam_blocking(index: u32) -> Result<CapturedFrame, CommandError> {
    ensure_macos_init()?;

    let captured_at_ms = now_ms();
    let capture_start = Instant::now();

    // Open + capture + drop per call. nokhwa::Camera is !Send, so
    // pooling it across tokio worker threads would not type-check.
    let mut camera = open_camera(index)?;

    let buffer = camera.frame().map_err(|e| {
        let s = e.to_string();
        CommandError::new(classify_nokhwa_error(&s), s)
    })?;

    let img = buffer
        .decode_image::<nokhwa::pixel_format::RgbAFormat>()
        .map_err(|e| CommandError::internal(format!("frame decode failed: {e}")))?;
    let capture_ms = capture_start.elapsed().as_secs_f32() * 1000.0;

    let (width, height) = (img.width(), img.height());
    let encode_start = Instant::now();
    let png_bytes = encode_png(&img)?;
    let encode_ms = encode_start.elapsed().as_secs_f32() * 1000.0;
    let byte_len = png_bytes.len() as u32;
    let data_url = data_url("image/png", &png_bytes);

    Ok(CapturedFrame {
        captured_at_ms,
        source_kind: "webcam".into(),
        source_id: index,
        width,
        height,
        data_url,
        byte_len,
        capture_ms,
        encode_ms,
    })
}

// ── Helpers ─────────────────────────────────────────────────────────

fn open_camera(index: u32) -> Result<nokhwa::Camera, CommandError> {
    use nokhwa::pixel_format::RgbAFormat;
    use nokhwa::utils::{CameraIndex, RequestedFormat, RequestedFormatType};

    let requested =
        RequestedFormat::new::<RgbAFormat>(RequestedFormatType::AbsoluteHighestFrameRate);
    nokhwa::Camera::new(CameraIndex::Index(index), requested).map_err(|e| {
        let s = e.to_string();
        CommandError::new(classify_nokhwa_error(&s), s)
    })
}

/// Best-effort string-match the nokhwa error message to typed kinds.
/// nokhwa's `OpenDeviceError(String, String)` swallows the OS error in
/// a free-form string, so this is the only way to distinguish
/// permission-denied from device-busy from internal-failure without
/// re-implementing the OS error decoders.
fn classify_nokhwa_error(msg: &str) -> ErrorKind {
    let lower = msg.to_ascii_lowercase();
    if lower.contains("permission") || lower.contains("denied") || lower.contains("access") {
        ErrorKind::PermissionDenied
    } else if lower.contains("not found")
        || lower.contains("not present")
        || lower.contains("no device")
    {
        ErrorKind::NotFound
    } else if lower.contains("in use") || lower.contains("busy") || lower.contains("already") {
        ErrorKind::DeviceBusy
    } else {
        ErrorKind::Internal
    }
}

/// Project `CameraIndex` to the numeric form the frontend uses.
/// Falls back to 0 for the (rare) string-indexed devices.
fn numeric_index(idx: &nokhwa::utils::CameraIndex) -> u32 {
    match idx {
        nokhwa::utils::CameraIndex::Index(n) => *n,
        nokhwa::utils::CameraIndex::String(_) => 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classify_permission_messages() {
        assert_eq!(
            classify_nokhwa_error("Access denied by camera privacy settings"),
            ErrorKind::PermissionDenied
        );
        assert_eq!(
            classify_nokhwa_error("Permission has been revoked"),
            ErrorKind::PermissionDenied
        );
    }

    #[test]
    fn classify_busy_messages() {
        assert_eq!(
            classify_nokhwa_error("Device is in use by another process"),
            ErrorKind::DeviceBusy
        );
        assert_eq!(
            classify_nokhwa_error("Camera is busy"),
            ErrorKind::DeviceBusy
        );
    }

    #[test]
    fn classify_not_found_messages() {
        assert_eq!(
            classify_nokhwa_error("No device matching index 5"),
            ErrorKind::NotFound
        );
    }

    #[test]
    fn classify_unknown_message_falls_back_to_internal() {
        assert_eq!(
            classify_nokhwa_error("HRESULT 0x80004005"),
            ErrorKind::Internal
        );
    }
}
