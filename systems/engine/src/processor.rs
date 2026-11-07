use tokio::sync::broadcast;
use devpulse_core::types::signal::{Signal, SignalKind};
use anyhow::Result;

pub struct SignalProcessor {
    // The Bus carries the full Signal Envelope
    tx: broadcast::Sender<Signal>, 
}

impl SignalProcessor {
    pub fn new(capacity: usize) -> Self {
        let (tx, _rx) = broadcast::channel(capacity);
        Self { tx }
    }

    /// The Neural Pathway.
    /// Ingests a signal, decides where it goes.
    /// 
    /// # The Facade Rule
    /// - Standard: We process or broadcast it.
    /// - Proprietary: We blindly forward it (logic stubbed for now).
    pub async fn process(&self, signal: Signal) -> Result<()> {
        match &signal.kind {
            SignalKind::Standard(std) => {
                // Elite Protocol: We use the variable by logging it
                tracing::debug!("Processing standard signal: {:?}", std);
                // For now, we broadcast everything to listeners (UI, Maestro)
                let _ = self.tx.send(signal);
            }
            SignalKind::Proprietary(_) => {
                // Blind Forwarding
                // We do NOT inspect the inner payload. We just ship the envelope.
                let _ = self.tx.send(signal);
            }
            SignalKind::Control(_) => {
                let _ = self.tx.send(signal);
            }
        }
        Ok(())
    }

    pub fn subscribe(&self) -> broadcast::Receiver<Signal> {
        self.tx.subscribe()
    }
}
