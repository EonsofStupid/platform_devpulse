//! One owner disposes the SDK connection and confirms cleanup independently
//! of the caller waiting for startup or close.

use std::future::Future;
use std::panic::AssertUnwindSafe;
use std::sync::Arc;
use std::time::Duration;

use futures::FutureExt;
use tokio::sync::watch;

use super::{tell_ready, Shared};

pub(super) struct Connection {
    closing: watch::Sender<bool>,
    stopped: watch::Receiver<bool>,
}

impl Connection {
    pub(super) fn start(
        connection: impl Future<Output = ()> + Send + 'static,
        shared: Arc<Shared>,
        grace: Duration,
    ) -> Self {
        let (closing, requested) = watch::channel(false);
        let (stopped, observed) = watch::channel(false);
        devpulse_telemetry::spawn(own(connection, shared, requested, stopped, grace));
        Self {
            closing,
            stopped: observed,
        }
    }

    pub(super) async fn close(&self) {
        self.closing.send_replace(true);
        let mut stopped = self.stopped.clone();
        if stopped.wait_for(|stopped| *stopped).await.is_err() {
            tracing::error!(target: "providers", "agent connection owner ended without confirming cleanup");
        }
    }
}

async fn own(
    connection: impl Future<Output = ()>,
    shared: Arc<Shared>,
    mut closing: watch::Receiver<bool>,
    stopped: watch::Sender<bool>,
    grace: Duration,
) {
    // Keep disposal inside this future: waiting for it or dropping its handle
    // cannot detach the SDK task. Dropping the SDK future drops its ChildGuard.
    let outcome = AssertUnwindSafe(async {
        if *closing.borrow() || closing.has_changed().is_err() {
            drop(connection);
            return;
        }
        tokio::pin!(connection);
        tokio::select! {
            biased;
            _ = closing.changed() => {
                // A session that has not opened cannot process Close yet.
                let opened = shared.session_id.lock().await.is_some();
                if opened
                    && tokio::time::timeout(grace, &mut connection).await.is_err()
                {
                    tracing::warn!(target: "providers", "agent close timed out; disposing its connection");
                }
            }
            () = &mut connection => {}
        }
    })
    .catch_unwind()
    .await;
    if outcome.is_err() {
        tracing::error!(target: "providers", "agent connection task panicked");
    }
    // No suspended SDK handler may retain a permission or an answer stream
    // after forced disposal. Receivers can now report an interrupted turn.
    shared.turn.lock().await.take();
    shared.pending.lock().await.clear();
    tell_ready(
        &shared,
        Err("the agent stopped before its session opened".into()),
    )
    .await;
    stopped.send_replace(true);
}
