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

// Kernel-owned facts cross intact; the window translates their presentation.
pub use devpulse_clyffy::providers::supervisor::{ConnectionReadiness, ProviderAvailability};
use devpulse_clyffy::providers::{actions, catalog, check, ActionContext};
use devpulse_clyffy::providers::{discovery::installed, supervisor};
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

    /// Whether you are signed in to a provider, from the last check;
    /// `Unknown` before the first check finishes or when it was not found.
    pub async fn signed_in(&self, id: ProviderId) -> SignedIn {
        self.state
            .lock()
            .await
            .report
            .as_ref()
            .and_then(|r| r.providers.iter().find(|p| p.id == id))
            .map_or(SignedIn::Unknown, |p| p.signed_in)
    }

    /// Ask one installed provider again whether you are signed in — only its
    /// status command, so the window can ask every few seconds while you sign
    /// in through the vendor's own tool. The state is published when the
    /// answer changes.
    ///
    /// # Errors
    /// Returns an error if the provider is unknown or not installed.
    pub async fn recheck_signed_in(&self, id: ProviderId) -> Result<ProvidersState> {
        let _serial = self.serial.lock().await;
        let catalog = catalog::load(&self.data_dir)?;
        let Some(definition) = catalog.definitions.iter().find(|d| d.id == id) else {
            bail!("{} is not a provider in the catalog", id.key());
        };
        let Some(location) = self.location(id).await else {
            bail!("{} is not installed", definition.name());
        };
        let program = std::path::Path::new(&location);
        let observed = supervisor::inspect(definition, program, &self.data_dir).await;
        let changed = {
            let mut state = self.state.lock().await;
            match state
                .report
                .as_mut()
                .and_then(|r| r.providers.iter_mut().find(|p| p.id == id))
            {
                Some(provider) => observed.update_report(provider, program),
                _ => false,
            }
        };
        if changed {
            tracing::info!(target: "providers", provider_id = id.key(), signed_in = ?observed.signed_in, "activation prerequisites changed");
            Ok(self.publish().await)
        } else {
            Ok(self.state().await)
        }
    }

    /// Validate a new Chat or Council thread against current prerequisites.
    /// The session also rechecks before starting and before every prompt.
    ///
    /// # Errors
    /// Returns the missing installation, login, connector or protocol.
    pub async fn require_chat(&self, id: ProviderId) -> Result<()> {
        let _serial = self.serial.lock().await;
        let catalog = catalog::load(&self.data_dir)?;
        let definition = catalog
            .definitions
            .iter()
            .find(|d| d.id == id)
            .ok_or_else(|| anyhow::anyhow!("{} is not a provider in the catalog", id.key()))?;
        let program =
            installed::locate(definition, std::env::home_dir().as_deref(), &self.data_dir)
                .ok_or_else(|| anyhow::anyhow!("{} is not installed", definition.name()))?;
        let observed = supervisor::inspect(definition, &program, &self.data_dir).await;
        {
            let mut state = self.state.lock().await;
            if let Some(provider) = state
                .report
                .as_mut()
                .and_then(|r| r.providers.iter_mut().find(|p| p.id == id))
            {
                observed.update_report(provider, &program);
            }
        }
        self.publish().await;
        observed.availability.chat.require(definition.name())
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

    /// Run one action on a provider: Install on one that is not on this
    /// machine, every other action on an installed one. After an install,
    /// an update or a connector install the providers are checked again;
    /// after opening a sign-in, the sign-in steps watch for it.
    ///
    /// # Errors
    /// Returns an error if the provider is unknown, not installed (or, for
    /// Install, already installed).
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
        // Install needs nothing installed (and refuses a second copy);
        // every other action needs the program.
        let location = match (action, location) {
            (ProviderAction::Install, None) => String::new(),
            (ProviderAction::Install, Some(at)) => {
                bail!("{} is already installed at {at}", definition.name());
            }
            (_, Some(at)) => at,
            (_, None) => bail!("{} is not installed", definition.name()),
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
            ProviderAction::Install | ProviderAction::Update | ProviderAction::InstallConnector
        ) {
            self.check_locked().await
        } else {
            Ok(self.publish().await)
        }
    }
}
