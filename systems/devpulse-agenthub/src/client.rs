//! One supervised peer, with exclusive ownership of every request exchange.
//!
//! A cancelled exchange drops its peer and leaves the client failed. A later
//! caller cannot consume an old reply or silently replay an interrupted call.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use anyhow::{bail, Context, Result};
use devpulse_clyffy::providers::ProviderId;
use devpulse_process::{ChildSpec, StopPolicy, SupervisedChild};
use tokio::process::{ChildStdin, ChildStdout};
use tokio::sync::{watch, Mutex};

use crate::history::{FoundPage, FoundSessions};
use crate::protocol::{self, Hello, Reply, Request};

/// The executable name in an installed bundle, beside the desktop executable.
pub const EXECUTABLE: &str = if cfg!(windows) {
    "devpulse-agenthub.exe"
} else {
    "devpulse-agenthub"
};

/// Typed client shared by all desktop windows through the engine.
pub struct Client {
    program: PathBuf,
    data_dir: PathBuf,
    state: Mutex<State>,
    stopping: watch::Sender<bool>,
}

enum State {
    Cold,
    Running(Box<Peer>),
    Failed(String),
    Stopped,
}

struct Peer {
    child: SupervisedChild,
    input: ChildStdin,
    output: ChildStdout,
}

impl Client {
    /// Resolve only beside the current executable; never search PATH or the
    /// checkout. Tauri installs external binaries here on supported desktops.
    ///
    /// # Errors
    /// When the application executable's directory cannot be determined.
    pub fn bundled(data_dir: PathBuf) -> Result<Self> {
        let current = std::env::current_exe().context("locate the DevPulse executable")?;
        let directory = current
            .parent()
            .context("DevPulse executable has no parent directory")?;
        Ok(Self::new(directory.join(EXECUTABLE), data_dir))
    }

    /// Use an explicitly resolved executable and data directory.
    #[must_use]
    pub fn new(program: PathBuf, data_dir: PathBuf) -> Self {
        Self {
            program,
            data_dir,
            state: Mutex::new(State::Cold),
            stopping: watch::channel(false).0,
        }
    }

    /// List through the child-owned retained catalog.
    ///
    /// # Errors
    /// Startup, protocol, disconnect, timeout or catalog failure.
    pub async fn sessions(&self) -> Result<FoundSessions> {
        match self.request(Request::Sessions).await? {
            Reply::Sessions(sessions) => Ok(sessions),
            Reply::Error(error) => bail!("{error}"),
            Reply::Page(_) => bail!("AgentHub returned a page for a listing"),
        }
    }

    /// Read a transcript without giving the desktop direct filesystem access.
    ///
    /// # Errors
    /// Startup, protocol, disconnect, timeout or transcript failure.
    pub async fn page(
        &self,
        provider_id: ProviderId,
        locator: String,
        cursor: Option<String>,
    ) -> Result<FoundPage> {
        match self
            .request(Request::Page {
                provider_id,
                locator,
                cursor,
            })
            .await?
        {
            Reply::Page(page) => Ok(page),
            Reply::Error(error) => bail!("{error}"),
            Reply::Sessions(_) => bail!("AgentHub returned a listing for a page"),
        }
    }

    async fn request(&self, request: Request) -> Result<Reply> {
        let mut stopping = self.stopping.subscribe();
        let mut state = self.state.lock().await;
        if *stopping.borrow() {
            bail!("AgentHub is shutting down");
        }
        let previous = std::mem::replace(
            &mut *state,
            State::Failed("AgentHub request was interrupted; restart DevPulse to reconnect".into()),
        );
        let mut peer = match previous {
            State::Cold => {
                let started = tokio::time::timeout(
                    Duration::from_secs(15),
                    Peer::start(&self.program, &self.data_dir),
                )
                .await
                .context("AgentHub startup timed out")
                .and_then(|result| result);
                match started {
                    Ok(peer) => Box::new(peer),
                    Err(error) => {
                        let error = format!("{error:#}");
                        *state = State::Failed(error.clone());
                        bail!("{error}");
                    }
                }
            }
            State::Running(peer) => peer,
            State::Failed(error) => {
                *state = State::Failed(error.clone());
                bail!("{error}");
            }
            State::Stopped => {
                *state = State::Stopped;
                bail!("AgentHub has stopped");
            }
        };
        let result = tokio::select! {
            result = tokio::time::timeout(Duration::from_secs(60), peer.exchange(&request)) => result.context("AgentHub request timed out").and_then(|result| result),
            _ = stopping.changed() => {
                // Shutdown owns the unfinished exchange and drains its output.
                *state = State::Running(peer);
                bail!("AgentHub is shutting down");
            }
        };
        match result {
            Ok(reply) => {
                *state = State::Running(peer);
                Ok(reply)
            }
            Err(error) => {
                let message =
                    format!("AgentHub connection failed: {error:#}; restart DevPulse to reconnect");
                *state = State::Failed(message.clone());
                // Peer drops here, ending the child/job. No automatic replay.
                bail!("{message}")
            }
        }
    }

    /// Close stdin, drain pending output, and wait for a graceful exit before
    /// invoking the shared supervisor's two-attempt stop policy.
    ///
    /// # Errors
    /// When the OS cannot wait for or stop the child.
    pub async fn shutdown(&self) -> Result<()> {
        self.stopping.send_replace(true);
        let mut state = self.state.lock().await;
        if let State::Running(peer) = std::mem::replace(&mut *state, State::Stopped) {
            peer.close().await?;
        }
        Ok(())
    }
}

impl Peer {
    async fn start(program: &Path, data_dir: &Path) -> Result<Self> {
        if !program.is_absolute() || !data_dir.is_absolute() {
            bail!("AgentHub requires absolute executable and data paths");
        }
        let data_dir = data_dir
            .to_str()
            .context("AgentHub data path is not valid Unicode")?;
        let spec = ChildSpec {
            name: "agenthub".into(),
            program: program.to_path_buf(),
            args: vec!["--data-dir".into(), data_dir.into()],
            dir: Some(data_dir.into()),
            ..ChildSpec::default()
        };
        let (child, input, output) = SupervisedChild::spawn_piped(
            &spec,
            Arc::new(|_, line| {
                tracing::info!(target: "agenthub::process", "{line}");
            }),
        )?;
        let mut peer = Self {
            child,
            input,
            output,
        };
        protocol::write(&mut peer.input, &Hello::default()).await?;
        let hello: Hello = protocol::read(&mut peer.output)
            .await?
            .context("AgentHub exited before becoming ready")?;
        hello.verify()?;
        tracing::info!(target: "agenthub", pid = peer.child.pid(), "supervised runtime connected");
        Ok(peer)
    }

    async fn exchange(&mut self, request: &Request) -> Result<Reply> {
        protocol::write(&mut self.input, request).await?;
        let reply = protocol::read(&mut self.output)
            .await?
            .context("AgentHub disconnected before replying")?;
        match (request, &reply) {
            (_, Reply::Error(_))
            | (Request::Sessions, Reply::Sessions(_))
            | (Request::Page { .. }, Reply::Page(_)) => Ok(reply),
            _ => bail!("AgentHub replied to a different operation"),
        }
    }

    async fn close(self) -> Result<()> {
        let Self {
            mut child,
            input,
            mut output,
        } = self;
        drop(input);
        let graceful = async {
            let mut sink = tokio::io::sink();
            let (status, drained) =
                tokio::join!(child.wait(), tokio::io::copy(&mut output, &mut sink));
            drained.context("drain AgentHub output during shutdown")?;
            status.context("wait for AgentHub shutdown")
        };
        match tokio::time::timeout(Duration::from_secs(5), graceful).await {
            Ok(result) => {
                result?;
            }
            Err(_) => {
                child.stop(StopPolicy::default()).await?;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests;
