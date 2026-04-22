//! In-memory span buffer for boot-order safety.
//!
//! [`BufferingProcessor`] implements [`SpanProcessor`] and holds spans in a
//! bounded `VecDeque` until the real processor is installed via
//! [`BufferingProcessor::install_inner`]. Once installed, buffered spans drain
//! in order and all subsequent spans forward directly.
//!
//! The processor uses `Arc<Mutex<...>>` internally so it can be cheaply cloned:
//! one copy goes to the `TracerProvider`, another stays in `TelemetryHandle`
//! for the later `install_inner()` call. Both clones share the same buffer.

use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

use opentelemetry_sdk::trace::{SpanData, SpanProcessor};

/// Maximum spans to hold before the real processor is installed.
/// Drop-oldest on overflow — we prefer losing early boot noise over blocking.
const BUFFER_CAPACITY: usize = 4096;

/// A [`SpanProcessor`] that buffers spans in memory until a real processor
/// is installed. Designed to be the first processor wired during `init_early()`
/// so that no span emitted during progressive boot is lost.
///
/// Cloning is cheap (Arc bump). Both the `TracerProvider`'s copy and the
/// `TelemetryHandle`'s copy point to the same shared buffer.
#[derive(Debug, Clone)]
pub struct BufferingProcessor {
    state: Arc<Mutex<BufferState>>,
}

enum BufferState {
    /// Buffering mode: accumulate spans, drop oldest on overflow.
    Buffering(VecDeque<SpanData>),
    /// Forwarding mode: the real processor is installed.
    Forwarding(Box<dyn SpanProcessor>),
}

impl std::fmt::Debug for BufferState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Buffering(buf) => write!(f, "Buffering({} spans)", buf.len()),
            Self::Forwarding(_) => write!(f, "Forwarding"),
        }
    }
}

impl BufferingProcessor {
    /// Create a new buffering processor in accumulate mode.
    #[must_use]
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(BufferState::Buffering(VecDeque::with_capacity(
                BUFFER_CAPACITY,
            )))),
        }
    }

    /// Install the real processor. Drains all buffered spans into it in order,
    /// then switches to forwarding mode for all future spans.
    ///
    /// # Panics
    /// Panics if called more than once (the real processor is already installed).
    pub fn install_inner(&self, real: Box<dyn SpanProcessor>) {
        let mut state = self
            .state
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        let old = std::mem::replace(&mut *state, BufferState::Forwarding(real));
        match old {
            BufferState::Buffering(buffer) => {
                // Drain buffered spans into the real processor
                if let BufferState::Forwarding(ref real) = *state {
                    for span in buffer {
                        real.on_end(span);
                    }
                }
            }
            BufferState::Forwarding(_) => {
                panic!("BufferingProcessor::install_inner called twice");
            }
        }
    }
}

impl Default for BufferingProcessor {
    fn default() -> Self {
        Self::new()
    }
}

impl SpanProcessor for BufferingProcessor {
    fn on_start(&self, _span: &mut opentelemetry_sdk::trace::Span, _cx: &opentelemetry::Context) {
        // No-op for both modes. Start events are not buffered.
    }

    fn on_end(&self, span: SpanData) {
        let mut state = self
            .state
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        match &mut *state {
            BufferState::Buffering(buffer) => {
                if buffer.len() == BUFFER_CAPACITY {
                    buffer.pop_front(); // drop oldest
                }
                buffer.push_back(span);
            }
            BufferState::Forwarding(real) => {
                real.on_end(span);
            }
        }
    }

    fn force_flush(&self) -> opentelemetry_sdk::error::OTelSdkResult {
        let state = self
            .state
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        match &*state {
            BufferState::Buffering(_) => Ok(()), // nothing to flush yet
            BufferState::Forwarding(real) => real.force_flush(),
        }
    }

    fn shutdown_with_timeout(
        &self,
        timeout: std::time::Duration,
    ) -> opentelemetry_sdk::error::OTelSdkResult {
        let state = self
            .state
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        match &*state {
            BufferState::Buffering(_) => Ok(()), // nothing to shut down
            BufferState::Forwarding(real) => real.shutdown_with_timeout(timeout),
        }
    }
}
