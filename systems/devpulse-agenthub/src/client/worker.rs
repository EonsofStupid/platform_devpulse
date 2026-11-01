//! Process lifetime belongs to the engine client, never a response future.

use std::future::Future;
use std::time::Duration;

use anyhow::{anyhow, bail, Context, Result};
use tokio::sync::{mpsc, oneshot, watch};

use super::{Peer, Reply, Request, RuntimeState, RuntimeStatus};

const QUEUE_CAPACITY: usize = 32;
const STOPPING: &str = "AgentHub is shutting down";

struct Command {
    request: Request,
    reply: oneshot::Sender<Result<Reply, String>>,
}

#[derive(Clone, Default)]
enum Progress {
    #[default]
    Starting,
    Connected,
    Closing(String),
    Finished {
        error: String,
        cleanup: Result<(), String>,
    },
}

/// Clones share one task and one bounded command queue, including after failure.
#[derive(Clone)]
pub(super) struct Worker {
    commands: mpsc::Sender<Command>,
    progress: watch::Receiver<Progress>,
}

impl Worker {
    pub(super) fn start(
        start: impl Future<Output = Result<Peer>> + Send + 'static,
        stopping: watch::Receiver<bool>,
        request_timeout: Duration,
    ) -> Self {
        let (commands, incoming) = mpsc::channel(QUEUE_CAPACITY);
        let (progress, observed) = watch::channel(Progress::Starting);
        devpulse_telemetry::spawn(run(start, incoming, stopping, progress, request_timeout));
        Self {
            commands,
            progress: observed,
        }
    }

    pub(super) async fn request(&self, request: Request) -> Result<Reply> {
        if let Some(error) = self.terminal_error() {
            bail!("{error}");
        }
        let (reply, response) = oneshot::channel();
        self.commands
            .send(Command { request, reply })
            .await
            .map_err(|_| self.disconnected())?;
        response
            .await
            .map_err(|_| self.disconnected())?
            .map_err(anyhow::Error::msg)
    }

    pub(super) async fn finished(&mut self) -> Result<()> {
        loop {
            if let Progress::Finished { cleanup, .. } = self.progress.borrow_and_update().clone() {
                return cleanup.map_err(anyhow::Error::msg);
            }
            self.progress
                .changed()
                .await
                .context("AgentHub worker ended before confirming process cleanup")?;
        }
    }

    pub(super) fn status(&self) -> RuntimeStatus {
        let (state, message) = match &*self.progress.borrow() {
            Progress::Starting => (RuntimeState::Starting, None),
            Progress::Connected => (RuntimeState::Connected, None),
            Progress::Closing(error) if error == STOPPING => (RuntimeState::Stopping, None),
            Progress::Finished {
                error,
                cleanup: Ok(()),
            } if error == STOPPING => (RuntimeState::Stopped, None),
            Progress::Finished {
                cleanup: Err(error),
                ..
            }
            | Progress::Closing(error)
            | Progress::Finished { error, .. } => (RuntimeState::Failed, Some(error.clone())),
        };
        RuntimeStatus { state, message }
    }

    #[cfg(test)]
    pub(super) fn queue_is_full(&self) -> bool {
        self.commands.capacity() == 0
    }

    fn terminal_error(&self) -> Option<String> {
        match &*self.progress.borrow() {
            Progress::Starting | Progress::Connected => None,
            Progress::Closing(error) | Progress::Finished { error, .. } => Some(error.clone()),
        }
    }

    fn disconnected(&self) -> anyhow::Error {
        anyhow!(self.terminal_error().unwrap_or_else(|| {
            "AgentHub worker disconnected; restart DevPulse to reconnect".into()
        }))
    }
}

async fn run(
    start: impl Future<Output = Result<Peer>>,
    mut incoming: mpsc::Receiver<Command>,
    mut stopping: watch::Receiver<bool>,
    progress: watch::Sender<Progress>,
    request_timeout: Duration,
) {
    // The initial value matters: shutdown can happen before this task is polled.
    let started = if *stopping.borrow() {
        Err(anyhow!(STOPPING))
    } else {
        tokio::select! {
            biased;
            _ = stopping.changed() => Err(anyhow!(STOPPING)),
            started = tokio::time::timeout(Duration::from_secs(15), start) => {
                started.context("AgentHub startup timed out").and_then(|result| result)
            }
        }
    };
    let (peer, error) = match started {
        Ok(mut peer) => {
            progress.send_replace(Progress::Connected);
            let error = serve(&mut peer, &mut incoming, &mut stopping, request_timeout).await;
            (Some(peer), error)
        }
        Err(error) => (None, format!("{error:#}")),
    };

    // Publish failure before rejecting commands, so callers waiting to enqueue
    // also see the same cause. Resolve them before potentially slow OS cleanup.
    progress.send_replace(Progress::Closing(error.clone()));
    incoming.close();
    while let Some(command) = incoming.recv().await {
        let _ = command.reply.send(Err(error.clone()));
    }
    let cleanup = match peer {
        Some(peer) => peer.close().await.map_err(|error| format!("{error:#}")),
        None => Ok(()),
    };
    progress.send_replace(Progress::Finished { error, cleanup });
}

async fn serve(
    peer: &mut Peer,
    incoming: &mut mpsc::Receiver<Command>,
    stopping: &mut watch::Receiver<bool>,
    request_timeout: Duration,
) -> String {
    loop {
        let command = tokio::select! {
            biased;
            _ = stopping.changed() => return STOPPING.into(),
            status = peer.child.wait() => return failure(&format!("AgentHub exited: {status:?}")),
            command = incoming.recv() => match command {
                Some(command) => command,
                None => return STOPPING.into(),
            },
        };
        let result = tokio::select! {
            biased;
            _ = stopping.changed() => Err(STOPPING.into()),
            result = tokio::time::timeout(request_timeout, peer.exchange(&command.request)) => {
                result.context("AgentHub request timed out")
                    .and_then(|result| result)
                    .map_err(|error| failure(&format!("{error:#}")))
            }
        };
        let failure = result.as_ref().err().cloned();
        // A closed receiver means its window/caller left. The exchange still
        // completed and consumed its own reply, so the next one stays aligned.
        let _ = command.reply.send(result);
        if let Some(error) = failure {
            return error;
        }
    }
}

fn failure(error: &str) -> String {
    format!("AgentHub connection failed: {error}; restart DevPulse to reconnect")
}
