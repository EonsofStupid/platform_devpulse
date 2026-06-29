//! Dedicated `DevForge` `WebviewWindow` — a full second Tauri window that
//! loads the REH web server's connection URL directly.
//!
//! # Why a dedicated window, not an embedded iframe
//!
//! Embedding VS Code as an iframe inside the main window works, but it's
//! fighting Svelte routing, window chrome, and focus propagation for no
//! real benefit. A standalone `WebviewWindow` gives the user a real OS
//! window they can move, resize, snap, and Alt-Tab to like any other app,
//! while keeping `DevForge`'s lifetime bound to the `DevPulse` parent process.
//!
//! # Lifecycle (lazy, user-initiated)
//!
//! 1. Platform boot does **not** start `DevForge`. The Node REH server only
//!    spawns on the first user open, keeping cold boot fast.
//! 2. The frontend invokes [`open_devforge_window`] (from any surface —
//!    the `/devforge` route button, a toolbar action, a keyboard shortcut).
//! 3. This command calls `Platform::ensure_devforge_started()` which
//!    either returns the cached service or spawns it now, then resolves
//!    the connection URL (`http://127.0.0.1:<port>/?tkn=<token>`) and
//!    opens or focuses a `WebviewWindow` labeled `"devforge"` pointed at
//!    that external URL.
//! 4. The window is parented to the main `DevPulse` window so closing the
//!    app tears `DevForge` down with it.
//!
//! # Why external URL is fine
//!
//! The REH server is always bound to `127.0.0.1` with a random port and a
//! per-session auth token, so the webview is talking to a loopback
//! process owned by the same user. Tauri has no problem loading external
//! URLs in a `WebviewWindow`; the user data persists under
//! `{data_dir}/devforge/user-data/` via REH's `--user-data-dir` flag.

use std::fmt::Write as _;

use crate::commands::devforge::types::DevforgeBootstrapStatus;
use crate::state::PlatformState;
use tauri::{AppHandle, Manager, State, Url, WebviewUrl, WebviewWindowBuilder};

/// Tauri window label for the `DevForge` window. Must be stable — callers
/// use this to focus or close an already-open window.
pub const DEVFORGE_WINDOW_LABEL: &str = "devforge";

/// Default window size. `DevForge` runs a full IDE, so we want a generous
/// default instead of the cramped cockpit sizes used for Chat / `ModelLoader`.
const DEFAULT_WIDTH: f64 = 1400.0;
const DEFAULT_HEIGHT: f64 = 900.0;
const MIN_WIDTH: f64 = 960.0;
const MIN_HEIGHT: f64 = 600.0;

/// Open (or focus) the dedicated `DevForge` window.
///
/// First call spawns the Node REH child process via
/// `Platform::ensure_devforge_started()` — this is the **only** path that
/// spawns the server. Subsequent calls reuse the cached service.
///
/// Returns a [`DevforgeBootstrapStatus`] snapshot so the caller can update
/// its own UI state without a second round-trip to `devforge_get_status`.
///
/// # Errors
/// - Platform hasn't finished booting yet (user should retry)
/// - `DevForge` server tree is missing — user needs to run
///   `cargo xtask fetch-devforge` or install the bundled release
/// - Node binary missing from the server tree
/// - Health poll fails within the service's startup timeout
/// - Connection URL fails to parse as a valid `Url`
/// - Tauri fails to create the `WebviewWindow`
/// - Focusing an already-open `DevForge` window fails
/// Optional `workspace_path`: absolute path of a project directory to
/// open inside the REH workspace. When set, appended to the connection
/// URL as a `folder=` query parameter — the code-oss REH standard for
/// "open this workspace folder on load". `None` means open the default
/// workspace (configured via `workspace_path` in devforge.toml).
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn open_devforge_window(
    app: AppHandle,
    state: State<'_, PlatformState>,
    workspace_path: Option<String>,
) -> Result<DevforgeBootstrapStatus, String> {
    // ── 1. Lazy-start DevForge on first open (idempotent on later calls).
    //
    // Capture `pid`/`uptime_secs` here while we still hold the service
    // reference so the bootstrap status snapshot matches the live child.
    // RSS is resolved below via the same sysinfo helper used by
    // `devforge_get_status` so both surfaces report identical numbers.
    let (connection_url, port, pid, uptime_secs) = {
        // P0: lock-free atomic load.
        let platform = state
            .platform
            .load_full()
            .ok_or_else(|| "Platform not booted yet — wait for boot to complete.".to_string())?;
        let service = platform
            .ensure_devforge_started()
            .await
            .map_err(|e| format!("DevForge failed to start: {e:#}"))?;
        (
            service.connection_url(),
            Some(service.port()),
            service.pid(),
            Some(service.uptime_secs()),
        )
    };
    let memory_rss_bytes = pid.and_then(super::reh_child_rss_bytes);

    // Append `?folder=<workspace_path>` so REH opens that project on load.
    // URL-encode so backslashes and spaces survive. Preserves any existing
    // query string the service's `connection_url()` already emitted (e.g.
    // `?tkn=<auth>`).
    let target_url = match workspace_path.as_deref() {
        Some(path) if !path.is_empty() => append_folder_query(&connection_url, path),
        _ => connection_url.clone(),
    };
    let workspace_pathbuf: Option<std::path::PathBuf> =
        workspace_path.as_deref().map(std::path::PathBuf::from);

    // ── 2. If a DevForge window is already open, just focus it. ────
    if let Some(window) = app.get_webview_window(DEVFORGE_WINDOW_LABEL) {
        window
            .show()
            .map_err(|e| format!("failed to show existing DevForge window: {e}"))?;
        window
            .set_focus()
            .map_err(|e| format!("failed to focus existing DevForge window: {e}"))?;
        return Ok(DevforgeBootstrapStatus {
            installed: true,
            running: true,
            url: Some(target_url),
            port,
            workspace: workspace_pathbuf,
            reh_version: None,
            pid,
            uptime_secs,
            memory_rss_bytes,
        });
    }

    // ── 3. Parse the REH URL and build a new dedicated window. ─────
    let parsed: Url = target_url
        .parse()
        .map_err(|e| format!("REH connection URL is not a valid Url: {e} (url={target_url})"))?;

    let mut builder =
        WebviewWindowBuilder::new(&app, DEVFORGE_WINDOW_LABEL, WebviewUrl::External(parsed))
            .title("DevForge")
            .inner_size(DEFAULT_WIDTH, DEFAULT_HEIGHT)
            .min_inner_size(MIN_WIDTH, MIN_HEIGHT)
            .resizable(true)
            .decorations(true)
            .visible(true);

    // Parent to the main DevPulse window so closing the parent tears
    // DevForge down with it. This matches the cockpit pattern used by
    // chat / connectome-viewer / model-loader in
    // [`crate::commands::window::open_window`].
    if let Some(main_window) = app.get_webview_window("main") {
        builder = builder
            .parent(&main_window)
            .map_err(|e| format!("failed to set DevForge window parent: {e}"))?;
    }

    let _window = builder
        .build()
        .map_err(|e| format!("failed to build DevForge window: {e}"))?;

    tracing::info!(
        label = DEVFORGE_WINDOW_LABEL,
        ?port,
        "DevForge window opened — REH webview live"
    );

    Ok(DevforgeBootstrapStatus {
        installed: true,
        running: true,
        url: Some(target_url),
        port,
        workspace: workspace_pathbuf,
        reh_version: None,
        pid,
        uptime_secs,
        memory_rss_bytes,
    })
}

/// Append `folder=<workspace_path>` to an existing REH connection URL
/// so the code-oss server opens that workspace on load. Preserves the
/// existing query string (typically `?tkn=<auth>`) — uses `&` when
/// present, `?` otherwise. Workspace path is URL-encoded so backslashes
/// and spaces survive the round-trip through the browser URL parser.
fn append_folder_query(connection_url: &str, workspace_path: &str) -> String {
    let separator = if connection_url.contains('?') {
        '&'
    } else {
        '?'
    };
    let encoded = url_encode_component(workspace_path);
    format!("{connection_url}{separator}folder={encoded}")
}

/// Minimal RFC-3986 component encoder — percent-encodes everything that
/// isn't an unreserved character. Inlined so we don't pull in a
/// dependency for one small call site.
fn url_encode_component(input: &str) -> String {
    let mut out = String::with_capacity(input.len() + 16);
    for &b in input.as_bytes() {
        if b.is_ascii_alphanumeric() || matches!(b, b'-' | b'_' | b'.' | b'~' | b'/') {
            out.push(b as char);
        } else {
            let _ = write!(out, "%{b:02X}");
        }
    }
    out
}

/// Close the `DevForge` window, if one is open. Idempotent.
///
/// Does **not** stop the REH server — that stays alive under
/// `PlatformState.reh` so a subsequent [`open_devforge_window`] call
/// reuses the same process.
///
/// # Errors
/// Returns a stringified error if `Window::close()` fails.
#[tauri::command]
#[specta::specta]
#[allow(clippy::missing_errors_doc)]
pub async fn close_devforge_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(DEVFORGE_WINDOW_LABEL) {
        window
            .close()
            .map_err(|e| format!("failed to close DevForge window: {e}"))?;
    }
    Ok(())
}
