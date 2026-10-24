//! What each provider looks like on this machine right now.
//!
//! For every definition, concurrently: is it installed (and where), which
//! version, the latest published version, and whether you are signed in.
//! Every value comes from the vendor's own tool or publication; anything
//! that could not be told says so.

pub mod installed;
pub mod latest;
pub mod signed_in;

use std::path::Path;

use serde::{Deserialize, Serialize};

use super::actions::{self, ProviderAction};
use super::catalog::Catalog;
use super::connect::connector::{self, ConnectorReport};
use super::definition::{AdapterKind, ProviderDefinition, ProviderKind};
use super::types::ProviderId;
pub use signed_in::SignedIn;

/// One provider, as found.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ProviderReport {
    /// Registry id.
    pub id: ProviderId,
    /// Display name.
    pub name: String,
    /// What it is.
    pub kind: ProviderKind,
    /// How `DevPulse` talks to it.
    pub adapter: AdapterKind,
    /// The vendor's documentation.
    pub docs: String,
    /// The vendor's note, if any.
    pub note: Option<String>,
    /// It is on this machine.
    pub installed: bool,
    /// Where it was found.
    pub location: Option<String>,
    /// The installed version, as the program reports it.
    pub version: Option<String>,
    /// The latest published version.
    pub latest: Option<String>,
    /// A newer version is published than the one installed.
    pub update_available: bool,
    /// Signed in, as far as can be told.
    pub signed_in: SignedIn,
    /// The vendor's own sign-in command as you would type it in a terminal
    /// (`claude auth login`); `None` when it has none or is not installed.
    pub sign_in_command: Option<String>,
    /// The actions its definition offers (the vendor's own commands, and
    /// Try it when it says how to talk to it).
    pub actions: Vec<ProviderAction>,
    /// The connector that speaks for it, when it needs one.
    pub connector: Option<ConnectorReport>,
    /// What could not be read, in the tool's own words (one per line).
    pub problems: Vec<String>,
}

/// Every provider.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(rename_all = "camelCase")]
pub struct ProvidersReport {
    /// One per definition, in catalog order.
    pub providers: Vec<ProviderReport>,
    /// Your definition files that were not used, and why.
    pub catalog_problems: Vec<String>,
    /// Unix seconds when this was checked.
    pub checked_at: i64,
}

async fn report_one(
    definition: &ProviderDefinition,
    data_dir: &Path,
    home: Option<&Path>,
    client: Option<&reqwest::Client>,
) -> ProviderReport {
    let location = installed::locate(definition, home);
    let mut problems = Vec::new();

    let version_lookup = async {
        match &location {
            Some(program) => installed::version(definition, program).await,
            None => Ok(None),
        }
    };
    let latest_lookup = async {
        match (&definition.latest, client) {
            (Some(source), Some(client)) => Some(latest::latest(client, source).await),
            _ => None,
        }
    };
    let signed_in_lookup = async {
        match (&definition.signed_in, &location) {
            (Some(spec), Some(program)) => signed_in::check(spec, program, home).await,
            _ => SignedIn::Unknown,
        }
    };
    let (version, latest, signed_in) =
        tokio::join!(version_lookup, latest_lookup, signed_in_lookup);

    let version = version.unwrap_or_else(|e| {
        problems.push(e);
        None
    });
    let latest = match latest {
        Some(Ok(v)) => Some(v),
        Some(Err(e)) => {
            problems.push(e);
            None
        }
        None => None,
    };
    let update_available =
        matches!((&latest, &version), (Some(l), Some(v)) if installed::newer(l, v));
    let sign_in_command = location
        .as_deref()
        .and_then(|program| actions::sign_in_typed(definition, program));
    let connector_spec = definition
        .connect
        .as_ref()
        .and_then(|c| c.connector.as_ref());

    ProviderReport {
        id: definition.id,
        name: definition.name().to_owned(),
        kind: definition.kind(),
        adapter: definition.adapter(),
        docs: definition.docs().to_owned(),
        note: definition.note.clone(),
        installed: location.is_some(),
        location: location.map(|p| p.display().to_string()),
        version,
        latest,
        update_available,
        signed_in,
        sign_in_command,
        actions: [
            (definition.sign_in.is_some(), ProviderAction::SignIn),
            (definition.update.is_some(), ProviderAction::Update),
            (definition.connect.is_some(), ProviderAction::Test),
            (connector_spec.is_some(), ProviderAction::InstallConnector),
        ]
        .into_iter()
        .filter_map(|(offered, action)| offered.then_some(action))
        .collect(),
        connector: connector_spec
            .map(|spec| connector::report(data_dir, definition.id.key(), spec)),
        problems,
    }
}

/// Ask one installed provider again whether you are signed in — only its
/// status command (or its login file), so it can be asked every few seconds
/// while you sign in.
pub async fn signed_in_now(definition: &ProviderDefinition, program: &Path) -> SignedIn {
    match &definition.signed_in {
        Some(spec) => signed_in::check(spec, program, std::env::home_dir().as_deref()).await,
        None => SignedIn::Unknown,
    }
}

/// Look at every provider in the catalog (connectors in `data_dir`).
pub async fn check(catalog: &Catalog, data_dir: &Path) -> ProvidersReport {
    let home = std::env::home_dir();
    let client = match latest::client() {
        Ok(c) => Some(c),
        Err(e) => {
            tracing::warn!(target: "providers", error = %e, "latest versions will not be shown");
            None
        }
    };
    let providers = futures::future::join_all(
        catalog
            .definitions
            .iter()
            .map(|d| report_one(d, data_dir, home.as_deref(), client.as_ref())),
    )
    .await;
    ProvidersReport {
        providers,
        catalog_problems: catalog.problems.clone(),
        checked_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_or(0, |d| i64::try_from(d.as_secs()).unwrap_or(i64::MAX)),
    }
}
