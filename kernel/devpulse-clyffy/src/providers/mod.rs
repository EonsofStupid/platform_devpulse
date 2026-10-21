//! Providers — every AI you bring, as a definition (plan 0001 A4).
//!
//! The kernel owns them because they drive AI connections: which agents and
//! apps are on this machine, their versions, whether you are signed in, and
//! the vendor's own update and sign-in commands. Each provider is a
//! definition file ([`definition`]); the catalog ([`catalog`]) is the bundled
//! files plus yours; [`discovery`] asks the machine; [`actions`] runs the
//! vendor's commands when you click. The engine publishes the result as the
//! `providers` state.

pub mod actions;
pub mod catalog;
pub mod definition;
pub mod discovery;

pub use actions::{ProviderAction, ProviderActionRun};
pub use catalog::Catalog;
pub use definition::{AdapterKind, ProviderDefinition, ProviderKind};
pub use discovery::{check, ProviderReport, ProvidersReport, SignedIn};
