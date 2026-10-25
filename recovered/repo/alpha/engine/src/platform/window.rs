// engine/src/platform/window.rs

//! Window sensor - monitors window focus changes

use shared::types::signal::SignalKind;
use tokio::sync::mpsc;

/// Sensor that monitors window focus changes
pub struct WindowSensor {
    tx: mpsc::Sender<SignalKind>,
}

impl WindowSensor {
    pub fn new(tx: mpsc::Sender<SignalKind>) -> Self {
        Self { tx }
    }

    /// Start monitoring (runs until dropped)
    pub async fn run(&self) -> anyhow::Result<()> {
        // TODO: Implement platform-specific window monitoring
        // Windows: Use Windows API
        // macOS: Use Accessibility API
        // Linux: Use X11/Wayland APIs

        // For now, this is a stub
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
        }
    }

    /// Emit a window focus signal (called by platform-specific code)
    pub async fn emit_focus(&self, window_title: String, app_name: String) -> anyhow::Result<()> {
        self.tx.send(SignalKind::WindowFocus {
            window_title,
            app_name,
        }).await?;
        Ok(())
    }
}
