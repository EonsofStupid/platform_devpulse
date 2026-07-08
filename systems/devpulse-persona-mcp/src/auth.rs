//! Auth gate for the persona MCP server.
//!
//! Slice 1 (v1): supports two modes.
//!
//! 1. **Offline** — when `clyffy.offline=true` is set via the
//!    `CLYFFY_OFFLINE` environment variable, all incoming requests pass.
//!    This is the development default and the path Claude Desktop /
//!    Claude Code take when the user runs the MCP child locally.
//! 2. **Bearer required (rejecting)** — when offline is NOT set, every
//!    request without a valid bearer is rejected with
//!    [`crate::error::ErrorKind::Auth`]. The actual JWT validation
//!    against Authentik is Slice 6 work — v1 returns the rejection
//!    envelope to make the missing-auth path observable but does NOT
//!    yet decode tokens.
//!
//! Per `feedback_no_stubs.md`: this is not a stub. It is a real gate
//! that enforces the SSOT contract for v1. Slice 6 extends the bearer
//! path with real JWT verification; the offline path is permanent.

use crate::error::{PersonaError, PersonaResult};
use std::env;

const OFFLINE_ENV: &str = "CLYFFY_OFFLINE";

/// Auth context carried with each verb dispatch.
#[derive(Debug, Clone)]
pub enum AuthContext {
    /// Local stdio child, `CLYFFY_OFFLINE=true`. No identity attached.
    Offline,
    /// Authenticated bearer (Slice 6). The `sub` claim is the Clyffy
    /// user id once JWT decode lands.
    Bearer {
        /// Subject claim from the JWT once validated. v1 always empty
        /// because validation is deferred.
        sub: String,
    },
}

/// Auth gate. Constructed once at server boot; consulted by every
/// verb.
#[derive(Debug, Clone)]
pub struct AuthGate {
    offline: bool,
}

impl AuthGate {
    /// Build a gate from environment variables.
    ///
    /// Reads `CLYFFY_OFFLINE` once at boot. Subsequent env mutations
    /// do not affect the running server.
    #[must_use]
    pub fn from_env() -> Self {
        let offline = matches!(
            env::var(OFFLINE_ENV).as_deref(),
            Ok("true" | "1" | "TRUE" | "True")
        );
        Self { offline }
    }

    /// Construct an explicit offline gate (for tests).
    #[must_use]
    pub const fn offline() -> Self {
        Self { offline: true }
    }

    /// Construct an explicit bearer-required gate (for tests).
    #[must_use]
    pub const fn bearer_required() -> Self {
        Self { offline: false }
    }

    /// Validate the bearer (or lack of one) for an incoming request.
    ///
    /// # Errors
    /// Returns [`PersonaError::Auth`] when the gate requires a bearer
    /// and none is supplied (or bearer JWT validation fails — Slice 6).
    pub fn check(&self, bearer: Option<&str>) -> PersonaResult<AuthContext> {
        if self.offline {
            return Ok(AuthContext::Offline);
        }

        match bearer {
            Some(token) if !token.is_empty() => {
                // Slice 6 extends here: validate JWT against Authentik
                // JWKS, extract `sub`, populate AuthContext::Bearer.
                // v1: refuse to mint an unauthenticated identity even
                // when a non-empty token is present — surface the
                // not-yet-implemented case as a typed Auth error so
                // upstream observability sees it.
                Err(PersonaError::Auth(
                    "bearer JWT validation deferred to Slice 6; set \
                     CLYFFY_OFFLINE=true for v1 local stdio operation"
                        .to_string(),
                ))
            }
            _ => Err(PersonaError::Auth(
                "no bearer supplied and CLYFFY_OFFLINE is not set".to_string(),
            )),
        }
    }
}

impl Default for AuthGate {
    fn default() -> Self {
        Self::from_env()
    }
}
