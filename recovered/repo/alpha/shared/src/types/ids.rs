// shared/src/types/ids.rs

//! Newtype wrappers for type-safe IDs
//!
//! Using newtypes prevents accidentally passing a SessionId where a ProjectId is expected.

use serde::{Deserialize, Serialize};
use std::fmt;
use uuid::Uuid;

/// Unique project identifier (UUIDv7 for time-ordering)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct ProjectId(pub Uuid);

impl ProjectId {
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }

    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    pub fn as_str(&self) -> String {
        self.0.to_string()
    }
}

impl Default for ProjectId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for ProjectId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Unique session identifier (UUIDv7 for time-ordering)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct SessionId(pub Uuid);

impl SessionId {
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }

    pub fn from_uuid(uuid: Uuid) -> Self {
        Self(uuid)
    }

    pub fn as_str(&self) -> String {
        self.0.to_string()
    }
}

impl Default for SessionId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for SessionId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Content-addressed hash for blob storage (TierB/TierC data)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct BlobHash(pub String);

impl BlobHash {
    /// Create from a pre-computed hash string (e.g., SHA-256 hex)
    pub fn from_hash(hash: String) -> Self {
        Self(hash)
    }

    /// Compute hash from bytes (SHA-256)
    pub fn from_bytes(data: &[u8]) -> Self {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        // For now, use a simple hash. In production, use SHA-256.
        let mut hasher = DefaultHasher::new();
        data.hash(&mut hasher);
        Self(format!("{:016x}", hasher.finish()))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for BlobHash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Unique hop identifier within a rumination chain
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct HopId(pub Uuid);

impl HopId {
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }
}

impl Default for HopId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for HopId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Unique frame identifier (ephemeral persona instance)
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct FrameId(pub Uuid);

impl FrameId {
    pub fn new() -> Self {
        Self(Uuid::now_v7())
    }
}

impl Default for FrameId {
    fn default() -> Self {
        Self::new()
    }
}

impl fmt::Display for FrameId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}
