//! OpenTelemetry context-propagating wrapper around `flume` MPMC channels.
//!
//! This module is one of exactly two places in the `DevPulse` workspace allowed
//! to reference raw `flume::Sender` / `flume::Receiver`. The `clippy.toml`
//! `disallowed-types` list blocks the raw types everywhere else; consumers
//! must use [`TracedSender`] / [`TracedReceiver`] via
//! [`crate::prelude`] or [`crate::channel`].
//!
//! ## Send-ness
//!
//! Both wrappers are `Clone`, `Send`, and `Sync` for any `T: Send`, matching
//! the wrapped flume primitives.

// SAFETY LOCK: this file is ONE of two in the workspace permitted to name
// the raw flume channel types. See ADR-002 and crate::channel::mod docs.
#![allow(clippy::disallowed_types)]

use super::envelope::{Envelope, Traced};

/// Sender half of a context-propagating flume channel.
///
/// Every call to [`TracedSender::send`] (and its async variant) captures the
/// current [`opentelemetry::Context`] via [`Envelope::capture`] and ships it
/// alongside the payload. The receiver recovers the context via [`Traced`].
#[derive(Debug)]
pub struct TracedSender<T> {
    inner: flume::Sender<Envelope<T>>,
}

impl<T> Clone for TracedSender<T> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl<T> TracedSender<T> {
    /// Send a payload, capturing the current OpenTelemetry context. Blocks
    /// only if the channel is bounded and full.
    ///
    /// # Errors
    /// Returns the original payload inside a [`flume::SendError`] if the
    /// channel is disconnected.
    pub fn send(&self, payload: T) -> Result<(), flume::SendError<T>> {
        self.inner
            .send(Envelope::capture(payload))
            .map_err(|flume::SendError(envelope)| flume::SendError(envelope.payload))
    }

    /// Async send variant. Yields if the channel is bounded and full.
    ///
    /// # Errors
    /// Returns the original payload inside a [`flume::SendError`] if the
    /// channel is disconnected.
    pub async fn send_async(&self, payload: T) -> Result<(), flume::SendError<T>> {
        self.inner
            .send_async(Envelope::capture(payload))
            .await
            .map_err(|flume::SendError(envelope)| flume::SendError(envelope.payload))
    }

    /// Attempt to send without blocking. Returns the payload if the channel is
    /// full or disconnected.
    ///
    /// # Errors
    /// Returns [`flume::TrySendError`] wrapping the original payload on
    /// `Full` or `Disconnected`.
    pub fn try_send(&self, payload: T) -> Result<(), flume::TrySendError<T>> {
        self.inner
            .try_send(Envelope::capture(payload))
            .map_err(|err| match err {
                flume::TrySendError::Full(envelope) => flume::TrySendError::Full(envelope.payload),
                flume::TrySendError::Disconnected(envelope) => {
                    flume::TrySendError::Disconnected(envelope.payload)
                }
            })
    }

    /// Returns the number of messages currently in the channel.
    #[must_use]
    pub fn len(&self) -> usize {
        self.inner.len()
    }

    /// Returns `true` if the channel is empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }
}

/// Receiver half of a context-propagating flume channel.
///
/// All receive methods return a [`Traced<T>`] carrying the producer's
/// [`opentelemetry::Context`]. Consumers call [`Traced::attach`] to scope the
/// context into their sync work, or [`Traced::context`] to borrow it without
/// attaching.
#[derive(Debug)]
pub struct TracedReceiver<T> {
    inner: flume::Receiver<Envelope<T>>,
}

impl<T> Clone for TracedReceiver<T> {
    fn clone(&self) -> Self {
        Self {
            inner: self.inner.clone(),
        }
    }
}

impl<T> TracedReceiver<T> {
    /// Blocking receive.
    ///
    /// # Errors
    /// Returns [`flume::RecvError`] if all senders have been dropped.
    pub fn recv(&self) -> Result<Traced<T>, flume::RecvError> {
        let envelope = self.inner.recv()?;
        Ok(Traced::from_envelope(envelope))
    }

    /// Async receive.
    ///
    /// # Errors
    /// Returns [`flume::RecvError`] if all senders have been dropped.
    pub async fn recv_async(&self) -> Result<Traced<T>, flume::RecvError> {
        let envelope = self.inner.recv_async().await?;
        Ok(Traced::from_envelope(envelope))
    }

    /// Non-blocking receive.
    ///
    /// # Errors
    /// Returns [`flume::TryRecvError`] if the channel is empty or
    /// disconnected.
    pub fn try_recv(&self) -> Result<Traced<T>, flume::TryRecvError> {
        let envelope = self.inner.try_recv()?;
        Ok(Traced::from_envelope(envelope))
    }

    /// Returns the number of messages currently queued.
    #[must_use]
    pub fn len(&self) -> usize {
        self.inner.len()
    }

    /// Returns `true` if the channel is empty.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.inner.is_empty()
    }
}

/// Create an unbounded context-propagating flume channel.
#[must_use]
pub fn unbounded<T>() -> (TracedSender<T>, TracedReceiver<T>) {
    let (tx, rx) = flume::unbounded::<Envelope<T>>();
    (TracedSender { inner: tx }, TracedReceiver { inner: rx })
}

/// Create a bounded context-propagating flume channel with capacity `cap`.
#[must_use]
pub fn bounded<T>(cap: usize) -> (TracedSender<T>, TracedReceiver<T>) {
    let (tx, rx) = flume::bounded::<Envelope<T>>(cap);
    (TracedSender { inner: tx }, TracedReceiver { inner: rx })
}
