//! Provider activation policy (plan 0001 R7).
//!
//! Discovery and execution use the same prerequisites. Eligibility is not a
//! successful handshake or inference; operation evidence belongs to the running
//! session. This is the subscription part of the planned provider supervisor.

use std::path::Path;

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};

use super::connect::connector::{self, ConnectorReport};
use super::definition::ProviderDefinition;
use super::discovery::{ProviderReport, SignedIn, signed_in_now};
use super::types::AgentProtocol;

/// Why an operation can or cannot be attempted.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub enum ConnectionReadiness {
    /// Prerequisites are present. Only a real operation can establish success.
    ReadyToConnect,
    /// The vendor's program is absent.
    NotInstalled,
    /// The vendor reports no login.
    SignInRequired,
    /// A required login could not be established.
    SignInUnverified,
    /// The configured protocol connector is absent.
    ConnectorRequired,
    /// The definition does not support this operation.
    Unsupported,
}

impl ConnectionReadiness {
    /// Refuse an operation whose prerequisites have not been established.
    ///
    /// # Errors
    /// Returns the missing prerequisite in terms the user can act on.
    pub fn require(self, name: &str) -> Result<()> {
        match self {
            Self::ReadyToConnect => Ok(()),
            Self::NotInstalled => bail!("{name} is not installed"),
            Self::SignInRequired => bail!("Sign in to {name} from Settings → Your AI"),
            Self::SignInUnverified => {
                bail!("Check your sign-in to {name} from Settings → Your AI")
            }
            Self::ConnectorRequired => {
                bail!("Install the connector for {name} from Settings → Your AI")
            }
            Self::Unsupported => bail!("{name} does not support this operation"),
        }
    }
}

/// Availability for each supported operation, independent of UI presentation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ProviderAvailability {
    /// A one-question connection test, only on explicit request.
    pub test: ConnectionReadiness,
    /// A continuing Chat or Council conversation.
    pub chat: ConnectionReadiness,
}

/// Evaluate facts collected by discovery or immediately before execution.
#[must_use]
pub fn assess(
    definition: &ProviderDefinition,
    installed: bool,
    signed_in: SignedIn,
    connector_installed: bool,
) -> ProviderAvailability {
    use ConnectionReadiness as Ready;
    let Some(connect) = definition.connect.as_ref() else {
        return ProviderAvailability {
            test: Ready::Unsupported,
            chat: Ready::Unsupported,
        };
    };
    let prerequisite = if definition.protocol().is_none() {
        Ready::Unsupported
    } else if !installed {
        Ready::NotInstalled
    } else if signed_in == SignedIn::No {
        Ready::SignInRequired
    } else if signed_in == SignedIn::Unknown
        && (definition.signed_in.is_some() || definition.sign_in.is_some())
    {
        Ready::SignInUnverified
    } else if connect.connector.is_some() && !connector_installed {
        Ready::ConnectorRequired
    } else {
        Ready::ReadyToConnect
    };
    let chat = if definition.protocol() == Some(AgentProtocol::Headless)
        && connect.conversation.is_none()
    {
        Ready::Unsupported
    } else {
        prerequisite
    };
    ProviderAvailability {
        test: prerequisite,
        chat,
    }
}

/// Facts observed together during an activation check.
pub struct ActivationObservation {
    /// The program still exists.
    pub installed: bool,
    /// The vendor's current login evidence.
    pub signed_in: SignedIn,
    /// Current connector installation, when one is configured.
    pub connector: Option<ConnectorReport>,
    /// Operations allowed by these facts.
    pub availability: ProviderAvailability,
}

impl ActivationObservation {
    /// Update the replayed report atomically so labels and gates cannot disagree.
    pub fn update_report(&self, report: &mut ProviderReport, program: &Path) -> bool {
        let before = report.clone();
        report.installed = self.installed;
        report.location = self.installed.then(|| program.display().to_string());
        report.signed_in = self.signed_in;
        report.connector.clone_from(&self.connector);
        report.availability = self.availability;
        *report != before
    }
}

/// Recheck the vendor's login and actual program/connector before dispatch.
/// Never installs, opens a sign-in, or sends a prompt.
pub async fn inspect(
    definition: &ProviderDefinition,
    program: &Path,
    data_dir: &Path,
) -> ActivationObservation {
    let installed = program.is_file();
    let signed_in = if installed {
        signed_in_now(definition, program).await
    } else {
        SignedIn::Unknown
    };
    let connector = definition
        .connect
        .as_ref()
        .and_then(|c| c.connector.as_ref())
        .map(|spec| connector::report(data_dir, definition.id.key(), spec));
    let availability = assess(
        definition,
        installed,
        signed_in,
        connector.as_ref().is_none_or(|c| c.installed),
    );
    ActivationObservation {
        installed,
        signed_in,
        connector,
        availability,
    }
}

#[cfg(test)]
mod tests {
    #![allow(clippy::unwrap_used, reason = "test fixtures")]
    use super::*;
    use crate::providers::{ProviderId, catalog};

    fn codex() -> ProviderDefinition {
        catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::Codex)
            .unwrap()
    }

    #[test]
    fn installation_login_and_connector_are_independent_prerequisites() {
        use ConnectionReadiness as R;
        let d = codex();
        for (installed, login, connector, expected) in [
            (false, SignedIn::Yes, true, R::NotInstalled),
            (true, SignedIn::No, true, R::SignInRequired),
            (true, SignedIn::Unknown, true, R::SignInUnverified),
            (true, SignedIn::Yes, false, R::ConnectorRequired),
            (true, SignedIn::Yes, true, R::ReadyToConnect),
        ] {
            let available = assess(&d, installed, login, connector);
            assert_eq!(available.chat, expected);
            assert_eq!(available.test, expected);
            assert_eq!(
                available.chat.require(d.name()).is_ok(),
                expected == R::ReadyToConnect
            );
        }
    }

    #[test]
    fn a_one_shot_command_does_not_establish_conversation_support() {
        let mut d = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::ClaudeCode)
            .unwrap();
        d.connect.as_mut().unwrap().conversation = None;
        let available = assess(&d, true, SignedIn::Yes, true);
        assert_eq!(available.test, ConnectionReadiness::ReadyToConnect);
        assert_eq!(available.chat, ConnectionReadiness::Unsupported);
    }

    #[test]
    fn installation_alone_never_makes_a_desktop_app_a_chat_agent() {
        let d = catalog::bundled()
            .unwrap()
            .into_iter()
            .find(|d| d.id == ProviderId::ClaudeDesktop)
            .unwrap();
        let available = assess(&d, true, SignedIn::Yes, true);
        assert_eq!(available.chat, ConnectionReadiness::Unsupported);
        assert_eq!(available.test, ConnectionReadiness::Unsupported);
    }

    #[tokio::test]
    async fn a_stale_program_path_is_refused_without_launching_anything() {
        let d = codex();
        let missing =
            std::env::temp_dir().join(format!("devpulse-absent-{}", uuid::Uuid::new_v4()));
        let available = inspect(&d, &missing, &missing).await;
        assert_eq!(
            available.availability.chat,
            ConnectionReadiness::NotInstalled
        );
    }
}
