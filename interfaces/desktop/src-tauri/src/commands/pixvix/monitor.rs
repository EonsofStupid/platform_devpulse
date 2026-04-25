//! xcap-backed monitor enumeration + one-shot capture.
//!
//! Threading discipline: every xcap call goes through
//! `tokio::task::spawn_blocking`. xcap's `capture_image` is synchronous
//! and takes 10–80ms — putting it on a tokio executor thread would
//! starve other futures. The accessors (`name()`, `width()`, etc.) are
//! also fallible OS calls; we tolerate per-field failures and fall
//! back to safe defaults rather than dropping the whole monitor.

use std::time::Instant;

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use image::ImageFormat;

use super::dto::{CaptureErrorKind, CapturedFrame, MonitorInfo};

/// List every monitor currently attached.
///
/// Returns an empty vector on systems with no displays (headless CI)
/// rather than an error — the UI renders the empty state cleanly.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_list_monitors() -> Result<Vec<MonitorInfo>, String> {
    tokio::task::spawn_blocking(list_monitors_blocking)
        .await
        .map_err(|e| format!("{} monitor enumeration task failed: {e}", CaptureErrorKind::Internal.tag()))?
}

fn list_monitors_blocking() -> Result<Vec<MonitorInfo>, String> {
    let monitors = xcap::Monitor::all()
        .map_err(|e| format!("{} xcap::Monitor::all failed: {e}", CaptureErrorKind::Internal.tag()))?;

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
/// `CaptureErrorKind::NotFound`.
#[tauri::command]
#[specta::specta]
pub async fn pixvix_capture_monitor_once(id: u32) -> Result<CapturedFrame, String> {
    tokio::task::spawn_blocking(move || capture_monitor_blocking(id))
        .await
        .map_err(|e| format!("{} capture task panicked: {e}", CaptureErrorKind::Internal.tag()))?
}

fn capture_monitor_blocking(id: u32) -> Result<CapturedFrame, String> {
    let monitors = xcap::Monitor::all()
        .map_err(|e| format!("{} xcap::Monitor::all failed: {e}", CaptureErrorKind::Internal.tag()))?;

    let target = monitors
        .into_iter()
        .find(|m| m.id().is_ok_and(|monitor_id| monitor_id == id))
        .ok_or_else(|| format!("{} monitor id {id} not present", CaptureErrorKind::NotFound.tag()))?;

    let captured_at_ms = now_ms();
    let capture_start = Instant::now();
    let img = target.capture_image().map_err(|e| {
        let s = e.to_string();
        // xcap surfaces permission failures inside an opaque message
        // string per `XCapError::Error(String)`. Best-effort string
        // match keeps the typed surface clean for the UI.
        let kind = if s.to_lowercase().contains("permission") || s.to_lowercase().contains("denied") {
            CaptureErrorKind::PermissionDenied
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
    fn encode_png_emits_valid_png_signature() {
        let img = image::RgbaImage::from_pixel(2, 2, image::Rgba([255, 0, 0, 255]));
        let bytes = encode_png(&img).unwrap();
        // PNG magic: 89 50 4E 47 0D 0A 1A 0A
        assert_eq!(&bytes[..8], &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    }

    #[test]
    fn now_ms_returns_positive_recent_value() {
        let t = now_ms();
        // Roughly any time after 2020-01-01 (1577836800000).
        assert!(t > 1_577_836_800_000);
    }
}
