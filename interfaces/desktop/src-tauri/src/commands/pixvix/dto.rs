//! PixVix capture wire-format types.
//!
//! Every type crosses the Tauri boundary, so:
//!   - `#[derive(Serialize, Deserialize, Type)]`
//!   - camelCase JSON
//!   - no `Vec<u8>` on snapshot DTOs (serde_json renders `Vec<u8>` as a
//!     number array — gross over IPC). One-shot frames carry a base64
//!     `data:image/png;...` string so the frontend can drop it straight
//!     into `<img src=>`. The V-4 streaming path uses the binary
//!     `tauri::ipc::Channel` and skips this DTO entirely.

use serde::{Deserialize, Serialize};
use specta::Type;

// ═══════════════════════════════════════════════════════════════════════
// Source identifiers (cross-platform)
// ═══════════════════════════════════════════════════════════════════════

/// One physical/virtual monitor reported by xcap.
///
/// Field accuracy varies by OS — `is_builtin` is reliable on macOS,
/// best-effort elsewhere. `scale_factor` reflects HiDPI; multiply
/// `width`/`height` by it to get device pixels (xcap returns logical
/// pixels by default).
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct MonitorInfo {
    /// Stable OS identifier — survives the same boot session, may
    /// change across reboot/replug.
    pub id: u32,
    /// Operator-friendly name (xcap `friendly_name`, falls back to `name`).
    pub name: String,
    /// Logical pixel position of the monitor's top-left corner in the
    /// virtual desktop coordinate space.
    pub x: i32,
    /// Logical pixel position of the monitor's top-left corner.
    pub y: i32,
    /// Logical pixel width.
    pub width: u32,
    /// Logical pixel height.
    pub height: u32,
    /// HiDPI scale (1.0 on standard displays, 2.0 on Retina, etc.).
    pub scale_factor: f32,
    /// Refresh rate in Hz.
    pub frequency: f32,
    /// `true` for the OS-designated primary monitor.
    pub is_primary: bool,
    /// `true` for the laptop's built-in panel (macOS reliable; other
    /// platforms best-effort).
    pub is_builtin: bool,
}

/// One capturable window reported by xcap.
///
/// Filtered to "real" windows by the lister: title non-empty AND not
/// minimized. Tooltips, hidden helper windows, and OS overlays are
/// dropped — they are technically windows but useless capture targets.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    /// Stable OS window handle.
    pub id: u32,
    /// Process id that owns the window.
    pub pid: u32,
    /// Best-effort app name (e.g. "Google Chrome", "code").
    pub app_name: String,
    /// Window title at enumeration time. Stale by the time the operator
    /// clicks Capture; ids are the durable handle.
    pub title: String,
    /// Logical pixel bounds — top-left x.
    pub x: i32,
    /// Logical pixel bounds — top-left y.
    pub y: i32,
    /// Logical pixel width.
    pub width: u32,
    /// Logical pixel height.
    pub height: u32,
    /// Z-order index (lower = closer to front; xcap returns the list
    /// sorted by z, so a smaller index here is on top).
    pub z: i32,
    /// `true` when the window is currently focused. UI uses this to
    /// pre-select the active window.
    pub is_focused: bool,
}

/// One webcam-style capture device reported by nokhwa.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WebcamInfo {
    /// Zero-based index used by `Camera::new`. May skip values when
    /// devices disappear mid-session.
    pub index: u32,
    /// Vendor-friendly name (e.g. "Logitech BRIO 4K").
    pub human_name: String,
    /// Verbose description from the OS (driver string).
    pub description: String,
    /// Backend-specific handle string (MSMF symbolic link, AVF unique
    /// id, V4L2 device path). Reserved for diagnostics — operators
    /// rarely need it.
    pub backend_handle: String,
}

// ═══════════════════════════════════════════════════════════════════════
// Frame
// ═══════════════════════════════════════════════════════════════════════

/// One captured frame ready for one-shot consumption.
///
/// `data_url` is the canonical browser-friendly form: drop into
/// `<img src=>`, fetch as Blob, decode in a worker, etc. Format is
/// PNG (lossless) for one-shots; the V-4 streaming pipeline uses
/// JPEG over a binary channel since PNG encode is the dominant cost
/// at higher cadences.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CapturedFrame {
    /// Wall-clock timestamp (Unix epoch milliseconds) when capture
    /// started.
    pub captured_at_ms: i64,
    /// `"monitor"` | `"window"` | `"webcam"`.
    pub source_kind: String,
    /// Identifier within the source kind (monitor id, window id,
    /// webcam index).
    pub source_id: u32,
    /// Pixel width (post-resize for webcams that negotiated a different format).
    pub width: u32,
    /// Pixel height.
    pub height: u32,
    /// `data:image/png;base64,...` — drop straight into `<img src=>`.
    pub data_url: String,
    /// Encoded byte length (post-base64 decode). Useful for the metrics
    /// panel without re-decoding.
    pub byte_len: u32,
    /// Capture latency (ms) — OS call only, excludes PNG encode.
    pub capture_ms: f32,
    /// PNG encode latency (ms).
    pub encode_ms: f32,
}

// ═══════════════════════════════════════════════════════════════════════
// Errors
// ═══════════════════════════════════════════════════════════════════════

/// Wire-stable classification of capture failures.
///
/// Tauri commands return `Result<T, String>` for serde simplicity —
/// the backend tags errors with `[<kind>]` prefix so the UI can
/// switch on `kind` without a custom Result type.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum CaptureErrorKind {
    /// The OS denied capture access (macOS TCC, Windows Privacy).
    PermissionDenied,
    /// The requested device id / monitor id / window id no longer
    /// exists on the system.
    NotFound,
    /// Another process has exclusive access (common with webcams).
    DeviceBusy,
    /// The requested operation is not supported on this OS / display
    /// server (e.g. per-window capture on Wayland).
    NotSupported,
    /// Internal failure inside xcap / nokhwa / the encoder.
    Internal,
}

impl CaptureErrorKind {
    /// Render as the `[kind]` prefix the Tauri error path uses.
    pub fn tag(self) -> &'static str {
        match self {
            Self::PermissionDenied => "[permission-denied]",
            Self::NotFound => "[not-found]",
            Self::DeviceBusy => "[device-busy]",
            Self::NotSupported => "[not-supported]",
            Self::Internal => "[internal]",
        }
    }
}

/// Wayland degraded-capability flag returned with `list_windows`.
///
/// xcap on Wayland (issues #112, #136) cannot reliably enumerate or
/// capture individual native-Wayland windows — only XWayland windows
/// and full monitors work. The lister sets this flag so the UI can
/// hide the window-pick option instead of showing a broken control.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum WindowCapability {
    /// Per-window capture works normally.
    Full,
    /// Window enumeration may be incomplete or capture may fail —
    /// recommend the operator pick a monitor instead.
    MonitorOnly,
}

/// Response shape for `list_windows` so we can carry the capability
/// flag alongside the window vector.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct WindowListing {
    /// Captured-window candidates after the title/minimized filter.
    pub windows: Vec<WindowInfo>,
    /// Per-host capability flag — driven by the Wayland-detection probe
    /// in `window.rs`. UI hides the per-window pick when set to `MonitorOnly`.
    pub capability: WindowCapability,
}
