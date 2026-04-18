//! OpenTelemetry context-propagating wrapper around `tokio::sync::broadcast`.
//!
//! Fan-out semantics: when a producer sends to N subscribers, each subscriber's
//! work should be **linked** to the producer's span, not a **child** of it.
//! Children-of-broadcast would falsely imply serial dependency among N parallel
//! subscribers.
//!
//! This module is one of exactly two places in the DevPulse workspace allowed
//! to reference raw `tokio::sync::broadcast`. The `clippy.toml`
//! `disallowed-types` list blocks the raw types everywhere else.

// SAFETY LOCK: this file is ONE of two in the workspace permitted to name
// the raw tokio broadcast channel types. See ADR-002.
#![allow(clippy::disallowed_types, clippy::disallowed_methods)]

use opentelemetry::Context;

use super::envelope::Envelope;

/// Unwrapped broadcast payload with the producer's context as a **link target**.
///
/// Unlike [`super::Traced<T>`] (which attaches the producer's context as the
/// current OTel context for parent-child semantics), `LinkedTraced<T>` exposes
/// the context without attaching it. This is the correct shape for 1:N fan-out
/// where each subscriber is a peer, not a child.
///
/// ## Usage
///
/// ```ignore
/// let traced = rx.recv().await?;
///
/// // Option A: add the producer context as a link on your span
/// let (payload, producer_cx) = traced.into_parts();
/// // then use producer_cx as a SpanBuilder link
///
/// // Option B: just access the value (no context propagation)
/// let payload = traced.value;
/// ```
pub struct LinkedTraced<T> {
    /// The unwrapped payload.
    pub value: T,
    link_cx: Context,
}

impl<T> LinkedTraced<T> {
    /// Construct from an [`Envelope`]. Does NOT attach the context.
    pub(crate) fn from_envelope(envelope: Envelope<T>) -> Self {
        Self {
            value: envelope.payload,
            link_cx: envelope.cx,
        }
    }

    /// Borrow the producer's [`Context`] to use as a span link target.
    #[must_use]
    pub fn link_context(&self) -> &Context {
        &self.link_cx
    }

    /// Consume the `LinkedTraced` and return the payload + context.
    #[must_use]
    pub fn into_parts(self) -> (T, Context) {
        (self.value, self.link_cx)
    }
}

/// Sender half of a context-propagating broadcast channel.
///
/// Every `send()` captures the current [`opentelemetry::Context`] alongside
/// the payload. Receivers get a [`LinkedTraced<T>`] carrying the producer's
/// context as a link target (not as a parent).
#[derive(Debug)]
pub struct BroadcastSender<T: Clone> {
    inner: tokio::sync::broadcast::Sender<Envelope<T>>,
}

impl<T: Clone> Clone for BroadcastSender<T> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl<T: Clone> BroadcastSender<T> {
    /// Send a payload to all subscribers, capturing the current OTel context.
    ///
    /// # Errors
    /// Returns the original payload inside a [`tokio::sync::broadcast::error::SendError`]
    /// if there are no active receivers.
    pub fn send(
        &self,
        payload: T,
    ) -> Result<usize, tokio::sync::broadcast::error::SendError<T>> {
        self.inner
            .send(Envelope::capture(payload))
            .map_err(|tokio::sync::broadcast::error::SendError(envelope)| {
                tokio::sync::broadcast::error::SendError(envelope.payload)
            })
    }

    /// Create a new receiver subscribed to this sender.
    #[must_use]
    pub fn subscribe(&self) -> BroadcastReceiver<T> {
        BroadcastReceiver {
            inner: self.inner.subscribe(),
        }
    }

    /// Returns the number of active receivers.
    #[must_use]
    pub fn receiver_count(&self) -> usize {
        self.inner.receiver_count()
    }
}

/// Receiver half of a context-propagating broadcast channel.
///
/// All receive methods return a [`LinkedTraced<T>`] carrying the producer's
/// context as a link target. The context is NOT attached — subscribers build
/// their own independent span trees and link back to the producer.
#[derive(Debug)]
pub struct BroadcastReceiver<T: Clone> {
    inner: tokio::sync::broadcast::Receiver<Envelope<T>>,
}

impl<T: Clone> BroadcastReceiver<T> {
    /// Async receive. Returns [`LinkedTraced<T>`] on success.
    ///
    /// # Errors
    /// Returns [`tokio::sync::broadcast::error::RecvError`] on `Lagged` or
    /// `Closed`.
    pub async fn recv(
        &mut self,
    ) -> Result<LinkedTraced<T>, tokio::sync::broadcast::error::RecvError> {
        let envelope = self.inner.recv().await?;
        Ok(LinkedTraced::from_envelope(envelope))
    }

    /// Non-blocking receive.
    ///
    /// # Errors
    /// Returns [`tokio::sync::broadcast::error::TryRecvError`] on `Empty`,
    /// `Lagged`, or `Closed`.
    pub fn try_recv(
        &mut self,
    ) -> Result<LinkedTraced<T>, tokio::sync::broadcast::error::TryRecvError> {
        let envelope = self.inner.try_recv()?;
        Ok(LinkedTraced::from_envelope(envelope))
    }
}

/// Create a broadcast channel with OTel context propagation.
///
/// Returns a sender/receiver pair. Additional receivers are created via
/// [`BroadcastSender::subscribe`].
#[must_use]
pub fn channel<T: Clone>(capacity: usize) -> (BroadcastSender<T>, BroadcastReceiver<T>) {
    let (tx, rx) = tokio::sync::broadcast::channel::<Envelope<T>>(capacity);
    (
        BroadcastSender { inner: tx },
        BroadcastReceiver { inner: rx },
    )
}
