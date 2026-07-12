//! Persisted Clyffy connection choice — atomic TOML under `{data_dir}/user/`.
//!
//! The operator's connect-or-skip decision and chosen endpoint survive
//! restarts here. Dedicated file (not a key on the model-loader config):
//! the wire connection is DevPulse-the-frontend's concern, not model
//! management's, and the boundary stays clean when each concern owns
//! its own record. Mirrors the platform's atomic-TOML discipline
//! (temp-write + rename, never a partial file on crash).
//!
//! Signals: every persisted transition emits structured tracing under the
//! `clyffy.connection` target so `query_scoped_log("clyffy.connection", …)`
//! replays the connection lifecycle (per feedback_dual_observability the
//! live axis is the `ClyffyConnectionChanged` typed event; this module is
//! the durable-record axis).

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// File name under `{data_dir}/user/`.
const FILE_NAME: &str = "clyffy_connection.toml";

/// The persisted record. Every field is the operator's own choice —
/// nothing here is shipped or assumed.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ClyffyConnectionRecord {
    /// Endpoint the operator last connected to. `None` = standalone
    /// (either never connected or explicitly disconnected).
    #[serde(default)]
    pub endpoint: Option<String>,
    /// Whether the operator has made the connect-or-skip decision at
    /// least once. Gates the wizard's auto-open: undecided → offer the
    /// connect step; decided → never force-open again.
    #[serde(default)]
    pub setup_decided: bool,
}

/// Atomic store for [`ClyffyConnectionRecord`].
pub struct ConnectionStore {
    path: PathBuf,
}

impl ConnectionStore {
    /// Store rooted at the resolved data dir (`{data_dir}/user/`).
    pub fn new(data_dir: &Path) -> Self {
        Self {
            path: data_dir.join("user").join(FILE_NAME),
        }
    }

    /// Load the record. Absent or unparsable files resolve to the
    /// default (standalone, undecided) — never an error at boot; a
    /// corrupt file is logged and treated as undecided so the wizard
    /// re-offers the choice instead of crashing.
    pub fn load(&self) -> ClyffyConnectionRecord {
        match std::fs::read_to_string(&self.path) {
            Ok(contents) => match toml::from_str::<ClyffyConnectionRecord>(&contents) {
                Ok(record) => record,
                Err(err) => {
                    tracing::warn!(
                        target: "clyffy.connection",
                        path = %self.path.display(),
                        error = %err,
                        "connection record unparsable — treating as undecided"
                    );
                    ClyffyConnectionRecord::default()
                }
            },
            Err(_) => ClyffyConnectionRecord::default(),
        }
    }

    /// Persist the record atomically (temp-write + rename on the same
    /// filesystem, so a crash mid-write never corrupts the record).
    ///
    /// # Errors
    ///
    /// Returns the underlying error when serialization or any
    /// filesystem step fails; callers surface it to the operator.
    pub fn save(&self, record: &ClyffyConnectionRecord) -> Result<(), String> {
        let parent = self
            .path
            .parent()
            .ok_or_else(|| "connection store path has no parent directory".to_string())?;
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("couldn't create {}: {e}", parent.display()))?;
        let body = toml::to_string_pretty(record)
            .map_err(|e| format!("couldn't serialize connection record: {e}"))?;
        let tmp = self.path.with_extension("toml.tmp");
        std::fs::write(&tmp, body).map_err(|e| format!("couldn't write {}: {e}", tmp.display()))?;
        std::fs::rename(&tmp, &self.path)
            .map_err(|e| format!("couldn't finalize {}: {e}", self.path.display()))?;
        tracing::info!(
            target: "clyffy.connection",
            endpoint = ?record.endpoint,
            setup_decided = record.setup_decided,
            "connection record persisted"
        );
        Ok(())
    }
}

#[cfg(test)]
#[allow(clippy::expect_used)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_persists_endpoint_and_decision() {
        let dir = std::env::temp_dir().join(format!("devpulse-connstore-{}", std::process::id()));
        let store = ConnectionStore::new(&dir);
        let record = ClyffyConnectionRecord {
            endpoint: Some("http://example.invalid:1".to_string()),
            setup_decided: true,
        };
        store.save(&record).expect("save must succeed");
        let loaded = store.load();
        assert_eq!(loaded.endpoint.as_deref(), Some("http://example.invalid:1"));
        assert!(loaded.setup_decided);
        std::fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn absent_file_is_undecided_standalone() {
        let store = ConnectionStore::new(Path::new("Z:/devpulse-nonexistent-dir"));
        let loaded = store.load();
        assert!(loaded.endpoint.is_none());
        assert!(!loaded.setup_decided);
    }
}
