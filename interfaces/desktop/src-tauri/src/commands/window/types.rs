//! Cockpit window management types.
//!
//! `WindowRole`: every spawnable window has a typed role.
//! `WindowState`: tracks an open window's state.
//! `ConnectomeMode`: toolbar (compact strip) or full (resizable window).
//! `AnchorState`: whether the Connectome tracks the chat window position.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Every spawnable window has a typed role.
/// Single Svelte build reads this from the URL query param.
#[derive(Serialize, Deserialize, Type, Clone, Debug, PartialEq, Eq, Hash)]
pub enum WindowRole {
    /// Main app window — always open
    Main,
    /// Clyffy Chat — child window
    Chat,
    /// Connectome viewer — telemetry / devtools
    ConnectomeViewer,
    /// Model loader — slot management
    ModelLoader,
    /// Unified dev toolbox panel (Ctrl+Shift+Z)
    DevTools,
}

impl WindowRole {
    /// Tauri window label for this role.
    #[must_use]
    pub fn label(&self) -> &'static str {
        match self {
            Self::Main => "main",
            Self::Chat => "chat",
            Self::ConnectomeViewer => "connectome-viewer",
            Self::ModelLoader => "model-loader",
            Self::DevTools => "devtools",
        }
    }

    /// Window title.
    #[must_use]
    pub fn title(&self) -> &'static str {
        match self {
            Self::Main => "DevPulse",
            Self::Chat => "Clyffy Chat",
            Self::ConnectomeViewer => "Connectome Viewer",
            Self::ModelLoader => "Model Control",
            Self::DevTools => "DevPulse Tools",
        }
    }

    /// Fallback inner size (width, height) — used only when the main
    /// window's monitor can't be resolved (see `size_fraction`).
    #[must_use]
    pub fn default_size(&self) -> (f64, f64) {
        match self {
            Self::Main => (1280.0, 800.0),
            Self::Chat => (960.0, 720.0),
            Self::ConnectomeViewer => (600.0, 450.0),
            Self::ModelLoader => (700.0, 500.0),
            Self::DevTools => (720.0, 560.0),
        }
    }

    /// Proportional inner size as a fraction of the monitor's logical
    /// size. `None` = the static `default_size` is authoritative. Chat is
    /// proportional so it is never a fixed sliver on large displays — the
    /// window scales with the screen and the min floor guards the bottom.
    #[must_use]
    pub fn size_fraction(&self) -> Option<(f64, f64)> {
        match self {
            Self::Chat => Some((0.45, 0.8)),
            Self::Main | Self::ConnectomeViewer | Self::ModelLoader | Self::DevTools => None,
        }
    }

    /// Minimum inner size (width, height). The OS resize floor — the
    /// window-state plugin restores whatever was saved, so this is the
    /// hard guard against bad persisted geometry.
    #[must_use]
    pub fn min_size(&self) -> (f64, f64) {
        match self {
            Self::Main => (900.0, 600.0),
            Self::Chat => (640.0, 520.0),
            Self::ConnectomeViewer => (480.0, 360.0),
            Self::ModelLoader => (560.0, 420.0),
            Self::DevTools => (600.0, 440.0),
        }
    }

    /// `SvelteKit` route path for this window.
    #[must_use]
    pub fn route(&self) -> &'static str {
        match self {
            Self::Main => "/devpulse",
            Self::Chat => "/chat",
            Self::ConnectomeViewer => "/connectome",
            Self::ModelLoader => "/model-loader",
            Self::DevTools => "/devtools",
        }
    }

    /// Whether this window should have OS decorations.
    ///
    /// Every spawnable window is decorated — a real OS titlebar with
    /// drag, minimize, maximize, and close. No frameless child windows.
    #[must_use]
    pub fn decorations(&self) -> bool {
        true
    }

    /// Whether this window should be always on top.
    #[must_use]
    pub fn always_on_top(&self) -> bool {
        match self {
            Self::Chat | Self::ConnectomeViewer | Self::DevTools => true,
            Self::Main | Self::ModelLoader => false,
        }
    }

    /// Whether this window should be transparent.
    ///
    /// Transparent windows on Windows require `decorations=false`. Since every
    /// window now has a real OS titlebar, none are transparent at the OS level —
    /// glass/blur effects are rendered by the content layer instead.
    #[must_use]
    pub fn transparent(&self) -> bool {
        false
    }
}

/// Tracks an open window's state.
#[derive(Serialize, Deserialize, Type, Clone, Debug)]
pub struct WindowInfo {
    /// The role of this window.
    pub role: WindowRole,
    /// Tauri window label (unique per instance).
    pub label: String,
    /// Whether the window is currently open.
    pub is_open: bool,
}
