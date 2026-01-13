// engine/src/platform/process.rs

//! Process sensor - monitors running processes

use shared::types::signal::SignalKind;
use tokio::sync::mpsc;

/// Sensor that monitors process changes
pub struct ProcessSensor {
    tx: mpsc::Sender<SignalKind>,
}

impl ProcessSensor {
    pub fn new(tx: mpsc::Sender<SignalKind>) -> Self {
        Self { tx }
    }

    /// Start monitoring (runs until dropped)
    pub async fn run(&self) -> anyhow::Result<()> {
        // TODO: Implement platform-specific process monitoring
        // For now, this is a stub that emits heartbeats
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
            let _ = self.tx.send(SignalKind::Heartbeat {
                uptime_secs: 0, // TODO: Track actual uptime
            }).await;
        }
    }
}
