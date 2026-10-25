// orchestrator/src/types/toon.rs

//! Toon - Wire transport envelope (IP - orchestrator only)
//!
//! All data on the wire is wrapped in a Toon. This provides:
//! - Consistent framing via SignalHeader (SSOT from shared)
//! - Routing metadata
//! - Tracing/correlation IDs

use shared::types::ids::{HopId, ProjectId, SessionId};
use shared::types::profile::SignalProfile;
use shared::types::signal::SignalKind;
use shared::{SignalHeader, SignalSource};
use serde::{Deserialize, Serialize};

/// Wire transport envelope for all DevPulse messages
///
/// Embeds SignalHeader (from shared) for atomic contract compliance:
/// - id, correlation_id, timestamp, source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Toon {
    /// Signal header (SSOT from shared) - id, correlation_id, timestamp, source
    pub header: SignalHeader,

    /// Project context (None for system-level signals)
    pub project_id: Option<ProjectId>,

    /// Session context (None for background tasks)
    pub session_id: Option<SessionId>,

    /// Current hop in rumination chain (None for reflex)
    pub hop_id: Option<HopId>,

    /// The actual signal payload
    pub signal: SignalKind,

    /// Hop depth (0 = initial signal, increments with each hop)
    pub hop_depth: u8,
}

impl Toon {
    /// Create a new Toon wrapping a signal
    pub fn new(signal: SignalKind) -> Self {
        Self {
            header: SignalHeader::new(SignalSource::User),
            project_id: None,
            session_id: None,
            hop_id: None,
            signal,
            hop_depth: 0,
        }
    }

    /// Create a new Toon with explicit source
    pub fn with_source(signal: SignalKind, source: SignalSource) -> Self {
        Self {
            header: SignalHeader::new(source),
            project_id: None,
            session_id: None,
            hop_id: None,
            signal,
            hop_depth: 0,
        }
    }

    /// Set project context
    pub fn with_project(mut self, project_id: ProjectId) -> Self {
        self.project_id = Some(project_id);
        self
    }

    /// Set session context
    pub fn with_session(mut self, session_id: SessionId) -> Self {
        self.session_id = Some(session_id);
        self
    }

    /// Create a child toon (for hop chaining)
    pub fn spawn_child(&self, signal: SignalKind) -> Self {
        Self {
            header: SignalHeader::caused_by_header(&self.header, SignalSource::Expert),
            project_id: self.project_id.clone(),
            session_id: self.session_id.clone(),
            hop_id: Some(HopId::new()),
            signal,
            hop_depth: self.hop_depth.saturating_add(1),
        }
    }

    /// Serialize to JSON bytes for wire transport
    pub fn to_bytes(&self) -> Result<Vec<u8>, serde_json::Error> {
        serde_json::to_vec(self)
    }

    /// Deserialize from JSON bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, serde_json::Error> {
        serde_json::from_slice(bytes)
    }

    /// Get the routing profile from the inner signal
    pub fn profile(&self) -> SignalProfile {
        self.signal.profile()
    }

    // Convenience accessors for header fields

    /// Get the toon's unique ID
    #[inline]
    pub fn id(&self) -> uuid::Uuid {
        self.header.id
    }

    /// Get the correlation ID (for tracing causality chains)
    #[inline]
    pub fn correlation_id(&self) -> Option<uuid::Uuid> {
        self.header.correlation_id
    }

    /// Get the timestamp (unix millis)
    #[inline]
    pub fn timestamp(&self) -> u64 {
        self.header.timestamp
    }

    /// Get the signal source
    #[inline]
    pub fn source(&self) -> SignalSource {
        self.header.source
    }
}
