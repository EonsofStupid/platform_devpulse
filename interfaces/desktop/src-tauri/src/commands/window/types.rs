//! Cockpit window management types.
//!
//! WindowRole: every spawnable window has a typed role.
//! WindowState: tracks an open window's state.
//! ConnectomeMode: toolbar (compact strip) or full (resizable window).
//! AnchorState: whether the Connectome tracks the chat window position.

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
    /// Cortex viewer — telemetry / devtools
    CortexViewer,
    /// Model loader — slot management
    ModelLoader,
    /// Voice Lab — TTS/STT config devtool
    VoiceLab,
}

impl WindowRole {
    /// Tauri window label for this role.
    #[must_use]
    pub fn label(&self) -> &'static str {
        match self {
            Self::Main => "main",
            Self::Chat => "chat",
            Self::CortexViewer => "cortex-viewer",
            Self::ModelLoader => "model-loader",
            Self::VoiceLab => "voice-lab",
        }
    }

    /// Window title.
    #[must_use]
    pub fn title(&self) -> &'static str {
        match self {
            Self::Main => "DevPulse",
            Self::Chat => "Clyffy Chat",
            Self::CortexViewer => "Cortex Viewer",
            Self::ModelLoader => "Model Control",
            Self::VoiceLab => "Voice Lab",
        }
    }

    /// Default inner size (width, height).
    #[must_use]
    pub fn default_size(&self) -> (f64, f64) {
        match self {
            Self::Main => (1280.0, 800.0),
            Self::Chat => (480.0, 700.0),
            Self::CortexViewer => (600.0, 450.0),
            Self::ModelLoader => (700.0, 500.0),
            Self::VoiceLab => (800.0, 600.0),
        }
    }

    /// SvelteKit route path for this window.
    #[must_use]
    pub fn route(&self) -> &'static str {
        match self {
            Self::Main => "/devpulse",
            Self::Chat => "/chat",
            Self::CortexViewer => "/cortex",
            Self::ModelLoader => "/model-loader",
            Self::VoiceLab => "/voice-lab",
        }
    }

    /// Whether this window should have OS decorations.
    #[must_use]
    pub fn decorations(&self) -> bool {
        match self {
            Self::Main => true,
            Self::Chat => false,
            Self::CortexViewer => false,
            Self::ModelLoader => true,
            Self::VoiceLab => true,
        }
    }

    /// Whether this window should be always on top.
    #[must_use]
    pub fn always_on_top(&self) -> bool {
        match self {
            Self::Chat | Self::CortexViewer => true,
            Self::Main | Self::ModelLoader | Self::VoiceLab => false,
        }
    }

    /// Whether this window should be transparent.
    #[must_use]
    pub fn transparent(&self) -> bool {
        match self {
            Self::Chat | Self::CortexViewer => true,
            Self::Main | Self::ModelLoader | Self::VoiceLab => false,
        }
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
