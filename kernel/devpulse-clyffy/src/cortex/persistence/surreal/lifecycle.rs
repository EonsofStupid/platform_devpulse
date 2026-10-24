//! Surreal lifecycle — upstream's server build in a supervised subprocess
//! (plan 0007 Part S, S5; owner decision 6, 2026-10-24: "a prebuilt binary
//! subprocess that can easily be detached").
//!
//! The April design (`15f60f08`, a managed `surreal start` child) re-authored
//! onto the kernel runtime ([`super::super::runtime`]) and `DevPulse`'s own
//! client ([`super::rpc`]); no Surreal crate is linked.
//!
//! - **Binary and store** come from configuration (the engine passes them):
//!   the installed build inside the `DevPulse` folder, and the store folder.
//! - **Store path.** The server runs in the store's parent folder and opens
//!   it by name (`surrealkv:<name>`), so a Windows absolute path never meets
//!   Surreal's path-scheme parsing.
//! - **Port** from the allocator: the configured one, bumped past a foreign
//!   listener; the server is never attached to — it owns the store.
//! - **Root user** is created by the server on the first start from
//!   `SURREAL_USER` / `SURREAL_PASS`; the engine keeps the password in a
//!   credentials file inside the folder.
//! - **No phoning home:** `SURREAL_ONLINE_VERSION_CHECK=false`.
//! - **Stop** is graceful first, forced after the owner's checks (R-G19).

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::SystemTime;

use anyhow::{Context, Result};

use super::rpc::{Query, SurrealRpc};
use crate::cortex::persistence::port_alloc::PortAllocation;
use crate::cortex::persistence::runtime::{
    RestartPolicy, Runtime, RuntimeEvent, RuntimeEvents, RuntimeSpec, RuntimeState, PORT,
};

/// The storage engine the store is opened with.
const ENGINE: &str = "surrealkv";

/// How to start the server.
#[derive(Debug, Clone)]
pub struct SurrealConfig {
    /// The installed server build.
    pub binary: PathBuf,
    /// The store folder (created when absent).
    pub data_path: PathBuf,
    /// The address it listens on.
    pub host: String,
    /// The configured port.
    pub port: u16,
    /// How far past the configured port to look.
    pub max_bumps: u16,
    /// The server's log level (`error`, `warn`, `info`, …).
    pub log_level: String,
    /// The root user.
    pub user: String,
    /// The root user's password.
    pub password: String,
}

/// The running server and the client that reaches it.
pub struct SurrealLifecycle {
    runtime: Arc<Runtime>,
    rpc: SurrealRpc,
    data_path: PathBuf,
    binary: PathBuf,
    version: Option<String>,
}

impl std::fmt::Debug for SurrealLifecycle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SurrealLifecycle")
            .field("binary", &self.binary)
            .field("data_path", &self.data_path)
            .field("endpoint", &self.runtime.endpoint())
            .finish_non_exhaustive()
    }
}

impl SurrealLifecycle {
    /// Start the server on the store and wait until it answers; then keep
    /// it running (restart on a crash).
    ///
    /// # Errors
    /// - the binary is not installed (`cargo xtask fetch-surreal`);
    /// - the store folder cannot be created;
    /// - the server cannot start, exits while starting (its last lines are
    ///   quoted), or does not answer in time.
    pub async fn boot(cfg: SurrealConfig) -> Result<Self> {
        anyhow::ensure!(
            cfg.binary.is_file(),
            "the Surreal server build is not installed at {} — run `cargo xtask fetch-surreal`",
            cfg.binary.display()
        );
        std::fs::create_dir_all(&cfg.data_path)
            .with_context(|| format!("create the Surreal store {}", cfg.data_path.display()))?;
        let parent = cfg
            .data_path
            .parent()
            .context("the Surreal store has no parent folder")?
            .to_path_buf();
        let name = cfg
            .data_path
            .file_name()
            .context("the Surreal store has no folder name")?
            .to_string_lossy()
            .into_owned();

        let events: RuntimeEvents = Arc::new(|event| match event {
            RuntimeEvent::Line { text, .. } => {
                tracing::info!(target: "surreal", "{text}");
            }
            RuntimeEvent::State(state) => {
                tracing::info!(target: "surreal", ?state, "server state");
            }
        });
        let runtime = Runtime::start(
            RuntimeSpec {
                name: "surreal".into(),
                program: cfg.binary.clone(),
                args: vec![
                    "start".into(),
                    "--bind".into(),
                    format!("{}:{PORT}", cfg.host),
                    "--no-banner".into(),
                    "--log".into(),
                    cfg.log_level.clone(),
                    format!("{ENGINE}:{name}"),
                ],
                env: vec![
                    ("SURREAL_USER".into(), cfg.user.clone()),
                    ("SURREAL_PASS".into(), cfg.password.clone()),
                    ("SURREAL_ONLINE_VERSION_CHECK".into(), "false".into()),
                ],
                dir: Some(parent),
                host: cfg.host.clone(),
                port: cfg.port,
                max_bumps: cfg.max_bumps,
                ready_path: "/health".into(),
                startup_timeout: std::time::Duration::from_secs(60),
                restart: RestartPolicy::default(),
                stop: devpulse_process::StopPolicy::default(),
            },
            events,
        )
        .await
        .context("start the Surreal server")?;
        runtime.watch();

        let at = Arc::clone(&runtime);
        let rpc = SurrealRpc::new(Arc::new(move || at.endpoint()), cfg.user, cfg.password)?;
        // Asked once: a restart runs the same build.
        let version = match rpc.version().await {
            Ok(v) => Some(v),
            Err(e) => {
                tracing::warn!(target: "surreal", error = %format!("{e:#}"), "the server did not say its version");
                None
            }
        };
        tracing::info!(
            target: "surreal",
            binary = %cfg.binary.display(),
            store = %cfg.data_path.display(),
            endpoint = ?runtime.endpoint(),
            version = ?version,
            "Surreal server ready"
        );
        Ok(Self {
            runtime,
            rpc,
            data_path: cfg.data_path,
            binary: cfg.binary,
            version,
        })
    }

    /// The client for this server.
    #[must_use]
    pub fn rpc(&self) -> &SurrealRpc {
        &self.rpc
    }

    /// The store folder.
    #[must_use]
    pub fn data_path(&self) -> &Path {
        &self.data_path
    }

    /// The server build it runs.
    #[must_use]
    pub fn binary(&self) -> &Path {
        &self.binary
    }

    /// The version the server reported when it started (`surrealdb-3.0.5`).
    #[must_use]
    pub fn version(&self) -> Option<&str> {
        self.version.as_deref()
    }

    /// The storage engine it opens the store with.
    #[must_use]
    pub fn engine(&self) -> &'static str {
        ENGINE
    }

    /// Its address, while it has one.
    #[must_use]
    pub fn endpoint(&self) -> Option<String> {
        self.runtime.endpoint()
    }

    /// The port it was given: configured, actual, bumps.
    #[must_use]
    pub fn allocation(&self) -> Option<PortAllocation> {
        self.runtime.allocation()
    }

    /// The server's process id, while it runs.
    #[must_use]
    pub fn pid(&self) -> Option<u32> {
        self.runtime.pid()
    }

    /// Where the server stands.
    #[must_use]
    pub fn state(&self) -> RuntimeState {
        self.runtime.state()
    }

    /// Restarts after a crash, since `DevPulse` started it.
    #[must_use]
    pub fn restarts(&self) -> u32 {
        self.runtime.restarts()
    }

    /// When it last started answering; `None` while it is not answering.
    #[must_use]
    pub fn ready_since(&self) -> Option<SystemTime> {
        self.runtime.ready_since()
    }

    /// `DevPulse` started this server and owns it (it never attaches).
    #[must_use]
    pub fn is_managed(&self) -> bool {
        true
    }

    /// Health probe: `INFO FOR ROOT` answered without error.
    ///
    /// # Errors
    /// Returns the server's or the transport's error.
    pub async fn ping(&self) -> Result<()> {
        self.rpc
            .query_root(Query::new("INFO FOR ROOT;"))
            .await?
            .check()
            .context("Surreal health probe")
    }

    /// Stop the server: graceful first, forced after the checks.
    ///
    /// # Errors
    /// Returns the OS error if it cannot be stopped.
    pub async fn shutdown(&self) -> Result<()> {
        let stopped = self.runtime.stop().await?;
        tracing::info!(target: "surreal", ?stopped, "Surreal server stopped");
        Ok(())
    }
}
