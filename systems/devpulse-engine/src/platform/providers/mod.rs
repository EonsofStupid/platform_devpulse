//! Providers — the engine facade over the kernel's provider catalog
//! (`devpulse_clyffy::providers`, plan 0001 R11).
//!
//! The kernel finds each AI you bring, runs the vendor's own commands and
//! asks the provider itself; this service holds the latest report, runs one
//! action at a time when you click, and publishes everything as the
//! `providers` state every window renders. The question Try it asks is copy
//! (`onboarding.your_ai.test_prompt`), so you can change it.

use std::path::PathBuf;
use std::sync::Arc;

use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use specta::Type;
use tokio::sync::Mutex;

// IP-NOTE: provider catalog types — vendor-neutral, layman names (provider,
// signed in, update, sign in, try it, connector); no kernel vocabulary
// crosses.
use devpulse_clyffy::providers::{actions, catalog, check, ActionContext};
pub use devpulse_clyffy::providers::{
    AdapterKind, ConnectorReport, ProviderAction, ProviderActionRun, ProviderId, ProviderKind,
    ProviderReport, ProvidersReport, SignedIn,
};

use crate::signals::{Signal, SignalSource, SignalVariant};

/// An action on one provider.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProviderActionRef {
    /// The provider.
    pub provider_id: ProviderId,
    /// The action.
    pub action: ProviderAction,
}

/// The `providers` state.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct ProvidersState {
    /// A check of this machine is running.
    pub checking: bool,
    /// What the last check found; `None` before the first check finishes.
    pub report: Option<ProvidersReport>,
    /// The action running now.
    pub running: Option<ProviderActionRef>,
    /// The last action that finished.
    pub last_action: Option<ProviderActionRun>,
    /// Why a check could not run, if it couldn't.
    pub problem: Option<String>,
}

/// Your AI providers.
pub struct Providers {
    data_dir: PathBuf,
    signals: crate::Engine,
    state: Mutex<ProvidersState>,
    /// One action or check at a time.
    serial: Mutex<()>,
}

impl Providers {
    /// Publish the state and start the first check in the background.
    #[must_use]
    pub fn start(data_dir: PathBuf, signals: crate::Engine) -> Arc<Self> {
        let providers = Arc::new(Self {
            data_dir,
            signals,
            state: Mutex::new(ProvidersState {
                checking: false,
                report: None,
                running: None,
                last_action: None,
                problem: None,
            }),
            serial: Mutex::new(()),
        });
        let me = Arc::clone(&providers);
        devpulse_telemetry::spawn(async move {
            me.publish().await;
            if let Err(e) = me.check().await {
                tracing::warn!(target: "providers", error = %format!("{e:#}"), "first check failed");
            }
        });
        providers
    }

    /// The current state.
    pub async fn state(&self) -> ProvidersState {
        self.state.lock().await.clone()
    }

    /// Where an installed provider's program is, from the last check;
    /// `None` when it was not found on this machine.
    pub async fn location(&self, id: ProviderId) -> Option<String> {
        self.state
            .lock()
            .await
            .report
            .as_ref()?
            .providers
            .iter()
            .find(|p| p.id == id)?
            .location
            .clone()
    }

    async fn publish(&self) -> ProvidersState {
        let state = self.state().await;
        self.signals.emit(Signal::new(
            SignalSource::System,
            SignalVariant::Providers(Box::new(state.clone())),
        ));
        state
    }

    /// Look at every provider again.
    ///
    /// # Errors
    /// Returns an error if the bundled catalog is broken.
    pub async fn check(&self) -> Result<ProvidersState> {
        let _serial = self.serial.lock().await;
        self.check_locked().await
    }

    async fn check_locked(&self) -> Result<ProvidersState> {
        self.state.lock().await.checking = true;
        self.publish().await;
        let outcome = match catalog::load(&self.data_dir) {
            Ok(catalog) => Ok(check(&catalog, &self.data_dir).await),
            Err(e) => Err(e),
        };
        {
            let mut state = self.state.lock().await;
            state.checking = false;
            match &outcome {
                Ok(report) => {
                    tracing::info!(
                        target: "providers",
                        installed = report.providers.iter().filter(|p| p.installed).count(),
                        total = report.providers.len(),
                        "providers checked"
                    );
                    state.report = Some(report.clone());
                    state.problem = None;
                }
                Err(e) => state.problem = Some(format!("{e:#}")),
            }
        }
        let state = self.publish().await;
        outcome.map(|_| state)
    }

    /// Run one action on an installed provider. After an update or a
    /// connector install the providers are checked again; after opening a
    /// sign-in, you check again once you have finished signing in.
    ///
    /// # Errors
    /// Returns an error if the provider is unknown or not installed.
    pub async fn run(
        &self,
        provider_id: ProviderId,
        action: ProviderAction,
    ) -> Result<ProvidersState> {
        let _serial = self.serial.lock().await;
        let catalog = catalog::load(&self.data_dir)?;
        let prompt = crate::platform::copy::load(&self.data_dir)?
            .copy
            .onboarding
            .your_ai
            .test_prompt;
        let Some(definition) = catalog.definitions.iter().find(|d| d.id == provider_id) else {
            bail!("{} is not a provider in the catalog", provider_id.key());
        };
        let location = {
            let state = self.state.lock().await;
            state
                .report
                .as_ref()
                .and_then(|r| r.providers.iter().find(|p| p.id == provider_id))
                .and_then(|p| p.location.clone())
        };
        let Some(location) = location else {
            bail!("{} is not installed", definition.name());
        };

        self.state.lock().await.running = Some(ProviderActionRef {
            provider_id,
            action,
        });
        self.publish().await;
        tracing::info!(target: "providers", provider_id = provider_id.key(), ?action, "action started");
        let context = ActionContext {
            data_dir: &self.data_dir,
            prompt: &prompt,
        };
        let result =
            actions::run(definition, std::path::Path::new(&location), action, context).await;
        tracing::info!(
            target: "providers",
            provider_id = provider_id.key(),
            ?action,
            ok = result.ok,
            elapsed_ms = result.elapsed_ms,
            agent = result.agent.as_deref().unwrap_or("-"),
            "action finished"
        );
        {
            let mut state = self.state.lock().await;
            state.running = None;
            state.last_action = Some(result);
        }
        if matches!(
            action,
            ProviderAction::Update | ProviderAction::InstallConnector
        ) {
            self.check_locked().await
        } else {
            Ok(self.publish().await)
        }
    }
}
