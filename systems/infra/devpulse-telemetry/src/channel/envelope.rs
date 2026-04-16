//! Universal wire format for OpenTelemetry context-propagating channels.

use opentelemetry::{Context, ContextGuard};

/// Wire format for every cross-task channel payload in the workspace.
///
/// `Envelope<T>` captures [`Context::current()`] on the producer side at
/// construction time and carries it alongside the payload. The consumer side
/// unwraps via [`Traced<T>`] (flume/1:1, parent-child semantics) or
/// `LinkedTraced<T>` (broadcast/1:N, link semantics — P2b).
///
/// Consumers never construct `Envelope<T>` directly — it is created internally
/// by the channel wrappers ([`super::flume::TracedSender::send`] etc.).
pub struct Envelope<T> {
    pub(crate) cx: Context,
    pub(crate) payload: T,
}

impl<T> Envelope<T> {
    /// Capture the current OpenTelemetry context and wrap the payload.
    #[must_use]
    pub(crate) fn capture(payload: T) -> Self {
        Self {
            cx: Context::current(),
            payload,
        }
    }
}

/// Unwrapped channel payload carrying the producer's OpenTelemetry context.
///
/// The consumer obtains a `Traced<T>` from a [`super::flume::TracedReceiver`]
/// and then either:
///
/// 1. Accesses the payload directly via the public `value` field when no span
///    propagation is needed in the consumer's current scope, or
/// 2. Calls [`Traced::attach`] to consume the `Traced` and receive both the
///    payload and an [`opentelemetry::ContextGuard`]. While the guard is live,
///    the producer's context is the current OTel context, so any span created
///    in the consumer's scope becomes a descendant of the producer's span.
///
/// ## Send-ness note
///
/// [`ContextGuard`] is intentionally `!Send` (it is tied to the current thread
/// / task). Therefore `Traced::attach` returns the guard as a standalone value
/// rather than embedding it inside `Traced`, which would forbid `Traced<T>`
/// from crossing `.await` points. Consumers should call `attach()` *after*
/// any await, inside the synchronous scope where they actually use the
/// context.
pub struct Traced<T> {
    /// The unwrapped payload.
    pub value: T,
    cx: Context,
}

impl<T> Traced<T> {
    /// Construct a `Traced` from an [`Envelope`] without attaching the
    /// context. This is called internally by channel receivers.
    pub(crate) fn from_envelope(envelope: Envelope<T>) -> Self {
        Self {
            value: envelope.payload,
            cx: envelope.cx,
        }
    }

    /// Borrow the producer's [`Context`] without consuming the `Traced`.
    #[must_use]
    pub fn context(&self) -> &Context {
        &self.cx
    }

    /// Consume the `Traced` and attach the producer's context as the current
    /// OpenTelemetry context. The returned `ContextGuard` must be held in a
    /// synchronous scope — it is `!Send` and cannot cross `.await` points.
    ///
    /// ```ignore
    /// let traced = rx.recv_async().await?;
    /// let (payload, _cx_guard) = traced.attach();
    /// // any span created here is a child of the producer's span
    /// do_sync_work(&payload);
    /// ```
    #[must_use]
    pub fn attach(self) -> (T, ContextGuard) {
        (self.value, self.cx.attach())
    }

    /// Consume the `Traced` and return the payload + context as a tuple
    /// without attaching. Useful when the consumer wants to add the context
    /// as a link to its own span rather than attach it as current.
    #[must_use]
    pub fn into_parts(self) -> (T, Context) {
        (self.value, self.cx)
    }
}
