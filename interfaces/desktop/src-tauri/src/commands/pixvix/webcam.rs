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
//! exists for ~50–200ms, then releases the handle). This makes
//! one-shots correct + simple at the cost of slow back-to-back
//! capture latency. V-4's session lifecycle owns a long-lived
//! `nokhwa::Camera` on its own dedicated worker thread (Camera is
//! `!Send`, so a `tokio::task::spawn_blocking` pool of cameras would
//! not compile — the dedicated-thread + channel pattern is the
//! correct shape).

use std::panic::AssertUnwindSafe;
#[cfg(target_os = "macos")]
use std::sync::OnceLock;
use std::time::Instant;

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use image::ImageFormat;

use super::dto::{CaptureErrorKind, CapturedFrame, WebcamInfo};

// ── State ───────────────────────────────────────────────────────────

/// One-shot macOS init guard. Triggers the TCC prompt the first time.
/// On non-macOS this is a no-op so callers don't need cfg-spaghetti.
#[cfg(target_os = "macos")]
fn ensure_macos_init() -> Result<(), String> {
    static INIT: OnceLock<()> = OnceLock::new();
    INIT.get_or_init(|| {
        nokhwa::nokhwa_initialize(|granted| {
            tracing::info!(granted, "pixvix.webcam: macOS TCC permission result");
        });
    });
    if !nokhwa::nokhwa_check() {
        return Err(format!(
            "{} macOS denied camera permission — open System Settings \u{2192} Privacy & Security \u{2192} Camera",
            CaptureErrorKind::PermissionDenied.tag()
        ));
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn ensure_macos_init() -> Result<(), String> {
    Ok(())
}

// ── Commands ────────────────────────────────────────────────────────

/// Enumerate webcam-class capture devices.
///
/// Wraps `nokhwa::query` in `catch_unwind` to neutralize the
/// no-camera-plugged-in panic on Windows MSMF (issue #192).
#[tauri::command]
#[specta::specta]
pub async fn pixvix_list_webcams() -> Result<Vec<WebcamInfo>, String> {
    tokio::task::spawn_blocking(list_webcams_blocking)
        .await
        .map_err(|e| {
            format!(
                "{} webcam enumeration task failed: {e}",
                CaptureErrorKind::Internal.tag()
            )
        })?
}

fn list_webcams_blocking() -> Result<Vec<WebcamInfo>, String> {
    ensure_macos_init()?;

    let result = std::panic::catch_unwind(AssertUnwindSafe(|| {
        nokhwa::query(nokhwa::utils::ApiBackend::Auto)
    }));

    let cameras = match result {
        Ok(Ok(c)) => c,
        Ok(Err(e)) => {
            return Err(format!(
                "{} nokhwa::query failed: {e}",
                classify_nokhwa_error(&e.to_string()).tag()
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
/// Opens the camera if not already in the pool; reuses the existing
/// handle if a previous one-shot left it open. The pool currently
/// never closes a camera mid-process — V-4's session lifecycle is
/// where explicit release lives.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_capture_webcam_once(index: u32) -> Result<CapturedFrame, String> {
    tokio::task::spawn_blocking(move || capture_webcam_blocking(index))
        .await
        .map_err(|e| {
            format!(
                "{} webcam capture task panicked: {e}",
                CaptureErrorKind::Internal.tag()
            )
        })?
}

fn capture_webcam_blocking(index: u32) -> Result<CapturedFrame, String> {
    ensure_macos_init()?;

    let captured_at_ms = now_ms();
    let capture_start = Instant::now();

    // Open + capture + drop per call. nokhwa::Camera is !Send, so
    // pooling it across tokio worker threads would not type-check.
    // V-4's session lifecycle owns a long-lived Camera on its own
    // dedicated thread; this one-shot path is intentionally
    // short-lived per call (camera lives ~50–200ms total).
    let mut camera = open_camera(index)?;

    let buffer = camera.frame().map_err(|e| {
        let s = e.to_string();
        format!("{} {s}", classify_nokhwa_error(&s).tag())
    })?;

    let img = buffer
        .decode_image::<nokhwa::pixel_format::RgbAFormat>()
        .map_err(|e| {
            format!(
                "{} frame decode failed: {e}",
                CaptureErrorKind::Internal.tag()
            )
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

fn open_camera(index: u32) -> Result<nokhwa::Camera, String> {
    use nokhwa::pixel_format::RgbAFormat;
    use nokhwa::utils::{CameraIndex, RequestedFormat, RequestedFormatType};

    let requested = RequestedFormat::new::<RgbAFormat>(RequestedFormatType::AbsoluteHighestFrameRate);
    nokhwa::Camera::new(CameraIndex::Index(index), requested).map_err(|e| {
        let s = e.to_string();
        format!("{} {s}", classify_nokhwa_error(&s).tag())
    })
}

/// Best-effort string-match the nokhwa error message to our typed kinds.
/// nokhwa's `OpenDeviceError(String, String)` swallows the OS error in
/// a free-form string, so this is the only way to distinguish
/// permission-denied from device-busy from internal-failure without
/// re-implementing the OS error decoders.
fn classify_nokhwa_error(msg: &str) -> CaptureErrorKind {
    let lower = msg.to_ascii_lowercase();
    if lower.contains("permission") || lower.contains("denied") || lower.contains("access") {
        CaptureErrorKind::PermissionDenied
    } else if lower.contains("not found") || lower.contains("not present") || lower.contains("no device") {
        CaptureErrorKind::NotFound
    } else if lower.contains("in use") || lower.contains("busy") || lower.contains("already") {
        CaptureErrorKind::DeviceBusy
    } else {
        CaptureErrorKind::Internal
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
    fn classify_permission_messages() {
        assert_eq!(
            classify_nokhwa_error("Access denied by camera privacy settings"),
            CaptureErrorKind::PermissionDenied
        );
        assert_eq!(
            classify_nokhwa_error("Permission has been revoked"),
            CaptureErrorKind::PermissionDenied
        );
    }

    #[test]
    fn classify_busy_messages() {
        assert_eq!(
            classify_nokhwa_error("Device is in use by another process"),
            CaptureErrorKind::DeviceBusy
        );
        assert_eq!(
            classify_nokhwa_error("Camera is busy"),
            CaptureErrorKind::DeviceBusy
        );
    }

    #[test]
    fn classify_not_found_messages() {
        assert_eq!(
            classify_nokhwa_error("No device matching index 5"),
            CaptureErrorKind::NotFound
        );
    }

    #[test]
    fn classify_unknown_message_falls_back_to_internal() {
        assert_eq!(
            classify_nokhwa_error("HRESULT 0x80004005"),
            CaptureErrorKind::Internal
        );
    }
}
