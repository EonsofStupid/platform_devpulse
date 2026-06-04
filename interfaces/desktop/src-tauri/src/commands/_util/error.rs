//! Unified `CommandError` for every Tauri command.
//!
//! Replaces the three drift patterns in flight before this pass:
//!   - providers: `ProviderErrorKind` returned via tagged Result
//!   - pixvix:    `CaptureErrorKind` smuggled through a `[kind] msg` string
//!   - everywhere else: bare `Result<T, String>` (no classification at all)
//!
//! After this pass every command returns `Result<T, CommandError>`. The
//! enum is `#[derive(Serialize, Deserialize, Type)]` and ships through
//! specta as a discriminated union the frontend can `switch (err.kind)`
//! on without substring matching.
//!
//! # Adding a kind
//!
//! 1. Append a variant to `ErrorKind`. Variants are kebab-case on the
//!    wire (serde `rename_all`).
//! 2. Add a constructor on `CommandError::<kind>()` for ergonomic
//!    `?`-style returns at call sites.
//! 3. Document semantics in this file's enum doc-comment.
//!
//! # Why `From` impls
//!
//! `From<std::io::Error>`, `From<serde_json::Error>`, `From<reqwest::Error>`
//! are provided so call sites can `?` straight from common upstream
//! errors without manual `.map_err(...)` boilerplate. Each maps to the
//! conservative `Internal` kind by default — call sites that have
//! semantic context (e.g. "this `io::Error` means permission-denied")
//! still construct explicitly.

use serde::{Deserialize, Serialize};
use specta::Type;

/// Wire-stable failure classification.
///
/// Kebab-case on the wire (`auth-failed`, `not-found`, etc.). Stable
/// identifiers — renaming a variant is a breaking change for frontend
/// consumers that switch on `kind`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ErrorKind {
    /// 401 / 403 from a vendor or OS — credentials wrong or revoked.
    AuthFailed,
    /// 429 with retryable semantics — back off and try again.
    RateLimit,
    /// 429 with `insufficient_quota` / `billing_error` — don't retry.
    QuotaExhausted,
    /// Network call failed before the wire (DNS, TLS, connect refused,
    /// read timeout). Caller decides whether to retry.
    Network,
    /// 5xx from the vendor — upstream ack'd but failed. Retry with jitter.
    Server,
    /// Body parse / shape mismatch — successful HTTP but the response
    /// didn't match expectations.
    Parse,
    /// Pre-flight failure: missing API key, missing required config,
    /// etc. Never reached the network / OS.
    NotConfigured,
    /// Implementation gap — feature is documented but not yet wired
    /// (e.g. Fireworks account-scoped endpoint).
    NotImplemented,
    /// OS denied access (macOS TCC, Windows Privacy Settings, etc.).
    PermissionDenied,
    /// Requested resource (monitor, window, file, model, slot) is not
    /// present on the system.
    NotFound,
    /// Resource exists but is held exclusively by another process
    /// (common with webcams + certain audio devices).
    DeviceBusy,
    /// The OS / display server / runtime cannot perform this operation
    /// (e.g. per-window capture on Wayland).
    NotSupported,
    /// Catch-all for genuinely unexpected internal failures. Use only
    /// when no other kind applies.
    Internal,
}

/// Classified failure with a human-readable message + optional context.
///
/// `message` is the operator-facing summary. `context` is optional
/// additional detail (file path, request id, partial response body)
/// the devtool's error panel surfaces below the main message.
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    /// Wire-stable classification.
    pub kind: ErrorKind,
    /// One-line operator-facing summary.
    pub message: String,
    /// Optional additional detail (truncated upstream body, file path,
    /// request id, etc.). UI renders below `message` in a smaller font.
    pub context: Option<String>,
}

impl CommandError {
    /// Construct with no extra context.
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            context: None,
        }
    }

    /// Construct with both message + context.
    pub fn with_context(
        kind: ErrorKind,
        message: impl Into<String>,
        context: impl Into<String>,
    ) -> Self {
        Self {
            kind,
            message: message.into(),
            context: Some(context.into()),
        }
    }

    // ── Per-kind constructors (one liner for each common kind) ──

    /// `AuthFailed` shorthand.
    pub fn auth_failed(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::AuthFailed, msg)
    }
    /// `RateLimit` shorthand.
    pub fn rate_limit(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::RateLimit, msg)
    }
    /// `QuotaExhausted` shorthand.
    pub fn quota_exhausted(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::QuotaExhausted, msg)
    }
    /// `Network` shorthand.
    pub fn network(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::Network, msg)
    }
    /// `Server` shorthand.
    pub fn server(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::Server, msg)
    }
    /// `Parse` shorthand.
    pub fn parse(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::Parse, msg)
    }
    /// `NotConfigured` shorthand.
    pub fn not_configured(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::NotConfigured, msg)
    }
    /// `NotImplemented` shorthand.
    pub fn not_implemented(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::NotImplemented, msg)
    }
    /// `PermissionDenied` shorthand.
    pub fn permission_denied(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::PermissionDenied, msg)
    }
    /// `NotFound` shorthand.
    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::NotFound, msg)
    }
    /// `DeviceBusy` shorthand.
    pub fn device_busy(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::DeviceBusy, msg)
    }
    /// `NotSupported` shorthand.
    pub fn not_supported(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::NotSupported, msg)
    }
    /// `Internal` shorthand.
    pub fn internal(msg: impl Into<String>) -> Self {
        Self::new(ErrorKind::Internal, msg)
    }
}

impl std::fmt::Display for CommandError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{:?}] {}", self.kind, self.message)?;
        if let Some(ctx) = &self.context {
            write!(f, " ({ctx})")?;
        }
        Ok(())
    }
}

impl std::error::Error for CommandError {}

// ── Conservative From impls ────────────────────────────────────────

impl From<std::io::Error> for CommandError {
    fn from(e: std::io::Error) -> Self {
        // Map permission-denied io kinds to our typed equivalent;
        // everything else is `Internal` until a call site has more
        // semantic context.
        use std::io::ErrorKind as IoKind;
        let kind = match e.kind() {
            IoKind::PermissionDenied => ErrorKind::PermissionDenied,
            IoKind::NotFound => ErrorKind::NotFound,
            IoKind::TimedOut | IoKind::ConnectionRefused | IoKind::ConnectionReset => {
                ErrorKind::Network
            }
            _ => ErrorKind::Internal,
        };
        Self::new(kind, e.to_string())
    }
}

impl From<serde_json::Error> for CommandError {
    fn from(e: serde_json::Error) -> Self {
        Self::parse(format!("JSON parse failed: {e}"))
    }
}

impl From<reqwest::Error> for CommandError {
    fn from(e: reqwest::Error) -> Self {
        Self::network(format!("HTTP call failed: {e}"))
    }
}

impl From<anyhow::Error> for CommandError {
    fn from(e: anyhow::Error) -> Self {
        Self::internal(format!("{e:#}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn json_roundtrip_preserves_kind_and_message() {
        let e = CommandError::with_context(ErrorKind::AuthFailed, "bad key", "401");
        let s = serde_json::to_string(&e).unwrap();
        let parsed: CommandError = serde_json::from_str(&s).unwrap();
        assert_eq!(parsed.kind, ErrorKind::AuthFailed);
        assert_eq!(parsed.message, "bad key");
        assert_eq!(parsed.context.as_deref(), Some("401"));
    }

    #[test]
    fn kebab_case_kind_on_wire() {
        let e = CommandError::permission_denied("nope");
        let s = serde_json::to_string(&e).unwrap();
        assert!(
            s.contains(r#""kind":"permission-denied""#),
            "expected kebab-case wire format, got {s}"
        );
    }

    #[test]
    fn from_io_permission_denied_becomes_typed() {
        let io = std::io::Error::new(std::io::ErrorKind::PermissionDenied, "denied");
        let e: CommandError = io.into();
        assert_eq!(e.kind, ErrorKind::PermissionDenied);
    }

    #[test]
    fn from_io_not_found_becomes_typed() {
        let io = std::io::Error::new(std::io::ErrorKind::NotFound, "missing");
        let e: CommandError = io.into();
        assert_eq!(e.kind, ErrorKind::NotFound);
    }

    #[test]
    fn from_io_timeout_becomes_network() {
        let io = std::io::Error::new(std::io::ErrorKind::TimedOut, "slow");
        let e: CommandError = io.into();
        assert_eq!(e.kind, ErrorKind::Network);
    }

    #[test]
    fn display_renders_kind_and_context() {
        let e = CommandError::with_context(ErrorKind::Server, "boom", "trace-abc");
        let s = format!("{e}");
        assert!(s.contains("Server"));
        assert!(s.contains("boom"));
        assert!(s.contains("trace-abc"));
    }
}
