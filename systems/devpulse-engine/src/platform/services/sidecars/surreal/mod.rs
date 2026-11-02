//! Surreal sidecar — upstream's server build in a supervised subprocess
//! (plan 0007 Part S). The kernel owns the process and the client
//! (`SurrealLifecycle`); this module wraps it with the platform `Service`
//! trait and gives the window its status.
//!
//! Submodules:
//! - [`service`] — `SurrealService`, its status and health, and the root
//!   password kept inside the folder.
//! - [`config`] — the user-scope overlay the devtool's Config tab edits.

pub mod config;
pub mod service;

pub use config::SurrealUserConfig;
pub use service::{SurrealConfigView, SurrealHealth, SurrealService, SurrealStatus, root_password};
