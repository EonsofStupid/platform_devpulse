// orchestrator/src/cortex/router.rs

//! Router - Signal routing via profile()
//!
//! The signal IS the router. This module just dispatches based on
//! SignalKind::profile() results.

use shared::types::profile::Processing;
use shared::types::signal::SignalKind;
use crate::types::Toon;
use tokio::sync::mpsc;

/// Router dispatches signals based on their profile
pub struct Router {
    /// Channel for reflex signals (immediate processing)
    reflex_tx: mpsc::Sender<Toon>,
    /// Channel for rumination signals (multi-hop processing)
    rumination_tx: mpsc::Sender<Toon>,
    /// Channel for archive signals (cold storage)
    archive_tx: mpsc::Sender<Toon>,
}

impl Router {
    pub fn new(
        reflex_tx: mpsc::Sender<Toon>,
        rumination_tx: mpsc::Sender<Toon>,
        archive_tx: mpsc::Sender<Toon>,
    ) -> Self {
        Self {
            reflex_tx,
            rumination_tx,
            archive_tx,
        }
    }

    /// Route a toon based on its signal's profile
    pub async fn route(&self, toon: Toon) -> anyhow::Result<()> {
        let profile = toon.signal.profile();

        match profile.processing {
            Processing::Reflex => {
                self.reflex_tx.send(toon).await?;
            }
            Processing::Rumination => {
                self.rumination_tx.send(toon).await?;
            }
            Processing::Archive => {
                self.archive_tx.send(toon).await?;
            }
        }

        Ok(())
    }

    /// Route a raw signal (wraps in Toon first)
    pub async fn route_signal(&self, signal: SignalKind) -> anyhow::Result<()> {
        let toon = Toon::new(signal);
        self.route(toon).await
    }
}
