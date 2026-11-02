//! Per-conversation control. The registry is never held across provider work.

use std::future::Future;
use std::sync::Arc;

use anyhow::{bail, Context, Result};
use devpulse_clyffy::providers::{AgentEvent, AgentSession};
use tokio::sync::{mpsc, oneshot, watch, Mutex, OwnedMutexGuard};

#[derive(Clone, Copy, PartialEq, Eq)]
enum Stop {
    Running,
    Cancelled,
    Closing,
}

pub(super) struct Conversation {
    gate: Arc<Mutex<()>>,
    session: Mutex<Option<Arc<AgentSession>>>,
    stop: watch::Sender<Stop>,
}

impl Default for Conversation {
    fn default() -> Self {
        Self {
            gate: Arc::new(Mutex::new(())),
            session: Mutex::new(None),
            stop: watch::channel(Stop::Running).0,
        }
    }
}

impl Conversation {
    pub(super) fn begin(self: &Arc<Self>) -> Result<Turn> {
        let gate = Arc::clone(&self.gate)
            .try_lock_owned()
            .map_err(|_| anyhow::anyhow!("the agent is still answering"))?;
        // Updating the signal atomically prevents begin from erasing Close.
        if !self.stop.send_if_modified(|stop| {
            if *stop == Stop::Closing {
                return false;
            }
            *stop = Stop::Running;
            true
        }) {
            bail!("the conversation is closing");
        }
        Ok(Turn {
            conversation: Arc::clone(self),
            _gate: gate,
        })
    }

    pub(super) fn cancel(&self) {
        self.stop.send_if_modified(|stop| {
            if *stop != Stop::Running {
                return false;
            }
            *stop = Stop::Cancelled;
            true
        });
    }

    pub(super) async fn session(&self) -> Option<Arc<AgentSession>> {
        self.session.lock().await.clone()
    }

    pub(super) async fn close(self: &Arc<Self>) {
        let mut stopped = self.stop.subscribe();
        if self.stop.send_if_modified(|stop| {
            if *stop == Stop::Closing {
                return false;
            }
            *stop = Stop::Closing;
            true
        }) {
            let conversation = Arc::clone(self);
            devpulse_telemetry::spawn(async move {
                let session = conversation.session.lock().await.take();
                if let Some(session) = session {
                    session.close().await;
                }
                // The turn owns this gate through durable completion. Keep the
                // same registry entry so reopening cannot bypass that ordering.
                let gate = conversation.gate.lock().await;
                drop(gate);
                conversation.stop.send_replace(Stop::Running);
            });
        }
        let _ = stopped.wait_for(|stop| *stop != Stop::Closing).await;
    }
}

pub(super) struct Turn {
    conversation: Arc<Conversation>,
    _gate: OwnedMutexGuard<()>,
}

impl Turn {
    pub(super) async fn wait_for_answer<T>(
        &self,
        session: &AgentSession,
        answer: impl Future<Output = T>,
    ) -> T {
        tokio::pin!(answer);
        tokio::select! {
            result = &mut answer => result,
            () = self.cancelled() => {
                session.cancel().await;
                answer.await
            }
        }
    }

    pub(super) fn is_cancelled(&self) -> bool {
        *self.conversation.stop.borrow() != Stop::Running
    }

    pub(super) async fn cancelled(&self) {
        let mut stop = self.conversation.stop.subscribe();
        let _ = stop.wait_for(|stop| *stop != Stop::Running).await;
    }

    pub(super) async fn session(
        &self,
        start: impl Future<Output = Result<AgentSession>>,
    ) -> Result<Arc<AgentSession>> {
        tokio::select! {
            biased;
            () = self.cancelled() => bail!("agent startup cancelled"),
            result = async {
                let mut slot = self.conversation.session.lock().await;
                if let Some(session) = &*slot {
                    return Ok(Arc::clone(session));
                }
                let session = Arc::new(start.await?);
                *slot = Some(Arc::clone(&session));
                Ok(session)
            } => result,
        }
    }

    pub(super) async fn dispatch(
        &self,
        session: &AgentSession,
        text: &str,
    ) -> Result<mpsc::UnboundedReceiver<AgentEvent>> {
        if self.is_cancelled() {
            return Ok(cancelled_events());
        }
        // Dispatch may already have spawned work before its future resolves.
        // Retain ownership; cancel the accepted turn once its receiver exists.
        let events = session.prompt_cancellable(text, self.cancelled()).await?;
        if self.is_cancelled() {
            session.cancel().await;
        }
        Ok(events)
    }
}

/// The engine owns an admitted operation even when its IPC waiter goes away.
pub(super) async fn owned<T: Send + 'static>(
    operation: impl Future<Output = Result<T>> + Send + 'static,
) -> Result<T> {
    let (reply, response) = oneshot::channel();
    devpulse_telemetry::spawn(async move {
        let _ = reply.send(operation.await);
    });
    response
        .await
        .context("the agent operation stopped before dispatch")?
}

pub(super) fn cancelled_events() -> mpsc::UnboundedReceiver<AgentEvent> {
    let (sender, receiver) = mpsc::unbounded_channel();
    let _ = sender.send(AgentEvent::TurnEnded {
        stop: "cancelled".into(),
    });
    receiver
}
