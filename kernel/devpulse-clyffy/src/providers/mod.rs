//! Providers — every AI you bring, as a definition (plan 0001 A4).
//!
//! The kernel owns them because they drive AI connections: which agents and
//! apps are on this machine, their versions, whether you are signed in, the
//! vendor's own update and sign-in commands, and how to talk to each. Each
//! provider is a definition file ([`definition`]); the catalog ([`catalog`])
//! is the bundled files plus yours; [`discovery`] asks the machine;
//! [`connect`] asks the provider itself; [`actions`] runs what you click.
//! The engine publishes the result as the `providers` state.

pub mod actions;
pub mod catalog;
pub mod connect;
pub mod definition;
pub mod discovery;

pub use actions::{ActionContext, ProviderAction, ProviderActionRun};
pub use catalog::Catalog;
pub use connect::connector::ConnectorReport;
pub use definition::{AdapterKind, ProviderDefinition, ProviderKind};
pub use discovery::{check, ProviderReport, ProvidersReport, SignedIn};
