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
    /// Knowledge viewer — telemetry / devtools
    KnowledgeViewer,
    /// Model loader — slot management
    ModelLoader,
    /// Unified dev toolbox panel (Ctrl+Shift+Z)
    DevTools,
}

impl WindowRole {
    /// Every role.
    pub const ALL: [Self; 5] = [
        Self::Main,
        Self::Chat,
        Self::KnowledgeViewer,
        Self::ModelLoader,
        Self::DevTools,
    ];

    /// Whether this window is a detached surface the devtools dashboard
    /// offers (it pops a page into its own window).
    #[must_use]
    pub fn detached(&self) -> bool {
        matches!(self, Self::KnowledgeViewer | Self::ModelLoader)
    }

    /// Tauri window label for this role.
    #[must_use]
    pub fn label(&self) -> &'static str {
        match self {
            Self::Main => "main",
            Self::Chat => "chat",
            Self::KnowledgeViewer => "knowledge-viewer",
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
            Self::KnowledgeViewer => "Knowledge Viewer",
            Self::ModelLoader => "Model Control",
            Self::DevTools => "DevPulse Tools",
        }
    }

    /// Default inner size (width, height).
    #[must_use]
    pub fn default_size(&self) -> (f64, f64) {
        match self {
            Self::Main => (1280.0, 800.0),
            Self::Chat => (480.0, 700.0),
            Self::KnowledgeViewer => (600.0, 450.0),
            Self::ModelLoader => (700.0, 500.0),
            Self::DevTools => (720.0, 560.0),
        }
    }

    /// The page this window opens — a constant generated from the route
    /// folders, so a missing page does not compile (plan 0008).
    #[must_use]
    pub fn route(&self) -> &'static str {
        use crate::routes;
        match self {
            Self::Main => routes::DEVPULSE,
            Self::Chat => routes::CHAT,
            // Its own description is "Telemetry graph".
            Self::KnowledgeViewer => routes::DEVTOOLS_SYSTEM_OBSERVABILITY_TELEMETRY,
            Self::ModelLoader => routes::DEVPULSE_MODELS,
            Self::DevTools => routes::DEVTOOLS,
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

/// A window role and the page it opens.
#[derive(Serialize, Deserialize, Type, Clone, Debug)]
pub struct WindowRoleInfo {
    /// The role.
    pub role: WindowRole,
    /// The page it opens (a generated route constant).
    pub route: String,
    /// Whether the devtools dashboard offers it as a detached surface.
    pub detached: bool,
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
