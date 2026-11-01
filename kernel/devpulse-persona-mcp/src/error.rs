//! Error envelope per `CLYFFY-COGNITIVE-FOUNDATION.md` §2.
//!
//! Every verb returns either a successful result or an error with the
//! shape:
//!
//! ```json
//! {
//!   "jsonrpc": "2.0",
//!   "id": "<request id>",
//!   "error": {
//!     "code": -32000,
//!     "message": "human-readable summary",
//!     "data": {
//!       "kind": "auth|not_found|invalid_arg|rate_limit|backend|conflict",
//!       "trace_id": "<W3C traceparent>",
//!       "retry_after_ms": 0
//!     }
//!   }
//! }
//! ```

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Discriminator on every error response. Matches the SSOT contract.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorKind {
    /// Authentication failed or missing — Slice 6 surfaces this when
    /// Authentik JWT validation rejects the bearer; v1 returns this
    /// when stdio reads a request and `clyffy.offline=true` is not set.
    Auth,
    /// Requested resource (block id, fact id) does not exist.
    NotFound,
    /// Caller-supplied argument failed validation (wrong type, missing
    /// required field, out-of-range value).
    InvalidArg,
    /// Server-side throttle hit. `retry_after_ms` is populated.
    RateLimit,
    /// Downstream storage (`LibSQL` / `SurrealDB` / Qdrant) failed.
    Backend,
    /// Write conflict — concurrent save lost last-write-wins, or
    /// idempotency key reused with a different payload.
    Conflict,
}

impl ErrorKind {
    /// JSON-RPC 2.0 error code (server-error range -32000 to -32099).
    #[must_use]
    pub fn json_rpc_code(self) -> i32 {
        match self {
            Self::Auth => -32_001,
            Self::NotFound => -32_002,
            Self::InvalidArg => -32_602, // JSON-RPC standard: invalid params
            Self::RateLimit => -32_004,
            Self::Backend => -32_005,
            Self::Conflict => -32_006,
        }
    }
}

/// Payload of the `error.data` field.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorEnvelopeData {
    /// Discriminator. See [`ErrorKind`].
    pub kind: ErrorKind,
    /// W3C traceparent for cross-service correlation. Empty if tracing
    /// not initialised.
    pub trace_id: String,
    /// Throttle hint. Zero unless `kind == RateLimit`.
    pub retry_after_ms: u64,
}

/// Full error response payload (the `error` field of the JSON-RPC frame).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorEnvelope {
    /// JSON-RPC standard error code.
    pub code: i32,
    /// Human-readable summary. Never machine-parsed; use `data.kind`.
    pub message: String,
    /// Discriminated payload.
    pub data: ErrorEnvelopeData,
}

impl ErrorEnvelope {
    /// Build an envelope for the given kind and message.
    #[must_use]
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            code: kind.json_rpc_code(),
            message: message.into(),
            data: ErrorEnvelopeData {
                kind,
                trace_id: current_trace_id(),
                retry_after_ms: 0,
            },
        }
    }

    /// Attach a retry-after hint (rate-limit responses).
    #[must_use]
    pub fn with_retry_after(mut self, retry_after_ms: u64) -> Self {
        self.data.retry_after_ms = retry_after_ms;
        self
    }
}

/// Crate-level error. Converts to [`ErrorEnvelope`] for protocol egress.
#[derive(Debug, Error)]
pub enum PersonaError {
    /// Caller-side mistake — surfaces as [`ErrorKind::InvalidArg`].
    #[error("invalid argument: {0}")]
    InvalidArg(String),
    /// Looked up something that doesn't exist.
    #[error("not found: {0}")]
    NotFound(String),
    /// Auth not provided or rejected.
    #[error("auth required: {0}")]
    Auth(String),
    /// Storage or downstream failure.
    #[error("backend error: {0}")]
    Backend(#[from] anyhow::Error),
    /// Write conflict — idempotency key reused with mismatched body, or
    /// last-write-wins reported on persona save.
    #[error("conflict: {0}")]
    Conflict(String),
}

impl PersonaError {
    /// Map to the wire envelope.
    #[must_use]
    pub fn into_envelope(self) -> ErrorEnvelope {
        match self {
            Self::InvalidArg(m) => ErrorEnvelope::new(ErrorKind::InvalidArg, m),
            Self::NotFound(m) => ErrorEnvelope::new(ErrorKind::NotFound, m),
            Self::Auth(m) => ErrorEnvelope::new(ErrorKind::Auth, m),
            Self::Backend(e) => ErrorEnvelope::new(ErrorKind::Backend, e.to_string()),
            Self::Conflict(m) => ErrorEnvelope::new(ErrorKind::Conflict, m),
        }
    }
}

/// Result alias for verb handlers.
pub type PersonaResult<T> = std::result::Result<T, PersonaError>;

/// Best-effort W3C traceparent extraction from the current tracing span.
fn current_trace_id() -> String {
    // tracing-opentelemetry context propagation is wired at the
    // platform level (devpulse-telemetry); when this crate runs
    // standalone (stdio child of Claude Desktop) the global subscriber
    // may not have OTel attached. Return empty string in that case —
    // callers can correlate via the JSON-RPC `id` field.
    String::new()
}
