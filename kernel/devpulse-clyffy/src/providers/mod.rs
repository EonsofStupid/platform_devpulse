//! Providers — every AI `DevPulse` knows about (plan 0001 A4, B3.1).
//!
//! The kernel owns them because they drive AI connections. The registry
//! ([`registry`], [`types`]; moved here from the engine on 2026-10-21 by
//! owner ruling) is the one provider model: a `ProviderId` and a row per
//! provider — API vendors, local servers, the coding agents on your own
//! subscriptions and the desktop apps. For the agents and apps found on your
//! machine, a definition file ([`definition`]) holds the configurable half:
//! where it is, its versions, whether you are signed in, the vendor's own
//! update and sign-in commands, and how to start it for a conversation. The
//! catalog ([`catalog`]) is the bundled files plus yours; [`discovery`] asks
//! the machine; [`connect`] asks the provider one question; [`session`]
//! holds a conversation with it; [`actions`] runs what you click. The
//! engine publishes the result as the `providers` state and re-exports the
//! registry as `ai_providers`.

pub mod actions;
pub mod catalog;
pub mod connect;
pub mod definition;
pub mod discovery;
pub mod install;
pub mod npm;
pub mod registry;
pub mod session;
pub mod types;

pub use actions::{ActionContext, ProviderAction, ProviderActionRun};
pub use catalog::Catalog;
pub use connect::connector::ConnectorReport;
pub use definition::{AdapterKind, ProviderDefinition, ProviderKind};
pub use discovery::{check, signed_in_now, ProviderReport, ProvidersReport, SignedIn};
pub use session::{AgentEvent, AgentSession, PermissionChoice, TurnEvents};
pub use types::ProviderId;
