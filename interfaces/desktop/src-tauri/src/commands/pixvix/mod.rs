//! PixVix — capture engine under the WiredFront physical boundary.
//!
//! V-3 ships the *one-shot primitives* operators can invoke directly
//! from a button click or the Tauri devtools console:
//!
//!   - `list_monitors`        → enumerate displays
//!   - `capture_monitor_once` → one PNG frame from a monitor
//!   - `list_windows`         → enumerate capturable windows (+ Wayland flag)
//!   - `capture_window_once`  → one PNG frame from a window
//!   - `list_webcams`         → enumerate webcam-class devices
//!   - `capture_webcam_once`  → one PNG frame from a webcam
//!
//! All seven commands run inside `tokio::task::spawn_blocking` —
//! xcap is sync + 10–80ms blocking, nokhwa needs per-thread COM init
//! that conflicts with Tauri's STA main thread (see
//! `webcam.rs` doc-comment for the full rationale).
//!
//! Frames return as `data:image/png;base64,...` strings inside
//! `CapturedFrame`. Continuous streaming (V-4 session) bypasses this
//! shape entirely and uses `tauri::ipc::Channel<Raw>` with JPEG to
//! avoid both the JSON-stringify and PNG-encode bottlenecks at higher
//! cadences.

pub mod dto;
pub mod monitor;
pub mod paths;
pub mod webcam;
pub mod window;

pub use dto::{
    CapturedFrame, MonitorInfo, WebcamInfo, WindowCapability, CaptureWindowInfo, WindowListing,
};
// Wildcard re-exports for the three command submodules — Tauri's
// `#[tauri::command]` + `#[specta::specta]` macros generate companion
// symbols (`__cmd__{name}`, `__specta__fn__{name}`) alongside the
// function. `collect_commands!` in lib.rs resolves those companions
// in the path it's given. Wildcard re-export brings the function AND
// its companions into `commands::pixvix`, so lib.rs can register via
// either `commands::pixvix::pixvix_list_monitors` (preferred) or
// `commands::pixvix::monitor::pixvix_list_monitors`.
pub use monitor::*;
pub use paths::{frames_dir, recordings_dir, FRAMES_SUBDIR, RECORDINGS_SUBDIR};
pub use webcam::*;
pub use window::*;
