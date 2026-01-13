// orchestrator/src/infra/persistence/audit.rs

//! fjall LSM-tree KV stores for persistent audit/replay data
//!
//! Two partitions:
//! - **parking_lot**: Unconfirmed ideas/decisions awaiting user approval
//! - **signal_replay**: Full signal history for time-travel debugging
//!
//! Data format: rkyv zero-copy serialization for fast reads
//! Keys: Composite keys for efficient range scans (project:session:timestamp)
//!
//! Note: This is the "raw" layer. For queryable data, use libSQL.
//! fjall is for audit trails and replay, not primary queries.

use anyhow::Result;
use chrono::Utc;
use rkyv::{Archive, Deserialize, Serialize};
use shared::config::paths::get_paths;
use std::path::PathBuf;
use uuid::Uuid;

/// Parking lot entry - candidate for promotion to libSQL decisions
#[derive(Archive, Serialize, Deserialize, Debug, Clone)]
#[rkyv(compare(PartialEq), derive(Debug))]
pub struct ParkingLotEntry {
    /// Unique key for this entry
    pub key: String,
    /// Project this belongs to
    pub project_id: String,
    /// Session where this was detected
    pub session_id: String,
    /// Category of decision (architecture, library, pattern, etc.)
    pub category: String,
    /// The candidate decision content
    pub content: String,
    /// AI confidence score (0.0 - 1.0)
    pub confidence: f32,
    /// Source context (what triggered this detection)
    pub source_context: String,
    /// When this was parked
    pub created_at: i64,
    /// Status: pending, promoted, rejected, expired
    pub status: String,
}

/// Signal replay entry - full signal for time-travel debugging
#[derive(Archive, Serialize, Deserialize, Debug, Clone)]
#[rkyv(compare(PartialEq), derive(Debug))]
pub struct SignalReplayEntry {
    /// Unique signal ID
    pub signal_id: String,
    /// Project context
    pub project_id: String,
    /// Session context
    pub session_id: String,
    /// Signal type (UserInput, ToolCall, ToolResult, etc.)
    pub signal_type: String,
    /// Full signal payload as JSON
    pub payload_json: String,
    /// Timestamp (Unix millis)
    pub timestamp_ms: i64,
    /// Hop number in reasoning chain
    pub hop_number: u32,
    /// Parent signal ID (for tracing chains)
    pub parent_id: Option<String>,
}

/// fjall-based persistent stores
pub struct FjallStores {
    /// LSM-tree keyspace
    keyspace: fjall::Keyspace,
    /// Parking lot partition
    parking_lot: fjall::PartitionHandle,
    /// Signal replay partition
    signal_replay: fjall::PartitionHandle,
}

impl FjallStores {
    /// Open stores at default paths
    pub fn open() -> Result<Self> {
        let paths = get_paths();
        Self::open_at(&paths.fjall_dir)
    }

    /// Open stores at specific path
    pub fn open_at(base_path: &PathBuf) -> Result<Self> {
        // Ensure directory exists
        std::fs::create_dir_all(base_path)?;

        // Open keyspace with default config
        let keyspace = fjall::Config::new(base_path).open()?;

        // Open partitions
        let parking_lot = keyspace.open_partition("parking_lot", Default::default())?;
        let signal_replay = keyspace.open_partition("signal_replay", Default::default())?;

        Ok(Self {
            keyspace,
            parking_lot,
            signal_replay,
        })
    }

    // ============== Parking Lot Operations ==============

    /// Park a new candidate decision
    pub fn park(&self, entry: &ParkingLotEntry) -> Result<()> {
        let key = Self::parking_lot_key(&entry.project_id, &entry.key);
        let bytes = rkyv::to_bytes::<rkyv::rancor::Error>(entry)?;
        self.parking_lot.insert(&key, bytes.as_slice())?;
        Ok(())
    }

    /// Get a parked entry by key
    pub fn get_parked(&self, project_id: &str, entry_key: &str) -> Result<Option<ParkingLotEntry>> {
        let key = Self::parking_lot_key(project_id, entry_key);
        if let Some(bytes) = self.parking_lot.get(&key)? {
            let archived = rkyv::access::<ArchivedParkingLotEntry, rkyv::rancor::Error>(&bytes)?;
            let entry: ParkingLotEntry = rkyv::deserialize::<ParkingLotEntry, rkyv::rancor::Error>(archived)?;
            Ok(Some(entry))
        } else {
            Ok(None)
        }
    }

    /// List pending entries for a project
    pub fn list_pending(&self, project_id: &str) -> Result<Vec<ParkingLotEntry>> {
        let prefix = format!("{}:", project_id);
        let mut entries = Vec::new();

        for item in self.parking_lot.prefix(prefix.as_bytes()) {
            let (_, value) = item?;
            let archived = rkyv::access::<ArchivedParkingLotEntry, rkyv::rancor::Error>(&value)?;
            let entry: ParkingLotEntry = rkyv::deserialize::<ParkingLotEntry, rkyv::rancor::Error>(archived)?;
            if entry.status == "pending" {
                entries.push(entry);
            }
        }

        Ok(entries)
    }

    /// Update parking lot entry status (promoted, rejected, expired)
    pub fn update_parking_status(
        &self,
        project_id: &str,
        entry_key: &str,
        new_status: &str,
    ) -> Result<bool> {
        if let Some(mut entry) = self.get_parked(project_id, entry_key)? {
            entry.status = new_status.to_string();
            self.park(&entry)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Delete a parking lot entry
    pub fn delete_parked(&self, project_id: &str, entry_key: &str) -> Result<()> {
        let key = Self::parking_lot_key(project_id, entry_key);
        self.parking_lot.remove(&key)?;
        Ok(())
    }

    // ============== Signal Replay Operations ==============

    /// Record a signal for replay
    pub fn record_signal(&self, entry: &SignalReplayEntry) -> Result<()> {
        // Key: project:session:timestamp:signal_id for time-ordered range scans
        let key = Self::signal_replay_key(
            &entry.project_id,
            &entry.session_id,
            entry.timestamp_ms,
            &entry.signal_id,
        );
        let bytes = rkyv::to_bytes::<rkyv::rancor::Error>(entry)?;
        self.signal_replay.insert(&key, bytes.as_slice())?;
        Ok(())
    }

    /// Get signals for a session in time order
    pub fn get_session_signals(&self, project_id: &str, session_id: &str) -> Result<Vec<SignalReplayEntry>> {
        let prefix = format!("{}:{}:", project_id, session_id);
        let mut signals = Vec::new();

        for item in self.signal_replay.prefix(prefix.as_bytes()) {
            let (_, value) = item?;
            let archived = rkyv::access::<ArchivedSignalReplayEntry, rkyv::rancor::Error>(&value)?;
            let entry: SignalReplayEntry = rkyv::deserialize::<SignalReplayEntry, rkyv::rancor::Error>(archived)?;
            signals.push(entry);
        }

        Ok(signals)
    }

    /// Get signals in a time range for a session
    pub fn get_signals_in_range(
        &self,
        project_id: &str,
        session_id: &str,
        start_ms: i64,
        end_ms: i64,
    ) -> Result<Vec<SignalReplayEntry>> {
        let start_key = format!("{}:{}:{:016}:", project_id, session_id, start_ms);
        let end_key = format!("{}:{}:{:016}:", project_id, session_id, end_ms + 1);

        let mut signals = Vec::new();

        for item in self.signal_replay.range(start_key.as_bytes()..end_key.as_bytes()) {
            let (_, value) = item?;
            let archived = rkyv::access::<ArchivedSignalReplayEntry, rkyv::rancor::Error>(&value)?;
            let entry: SignalReplayEntry = rkyv::deserialize::<SignalReplayEntry, rkyv::rancor::Error>(archived)?;
            signals.push(entry);
        }

        Ok(signals)
    }

    /// Get a specific signal by ID
    pub fn get_signal(&self, project_id: &str, session_id: &str, signal_id: &str) -> Result<Option<SignalReplayEntry>> {
        // Need to scan since we don't know the timestamp
        let prefix = format!("{}:{}:", project_id, session_id);

        for item in self.signal_replay.prefix(prefix.as_bytes()) {
            let (_, value) = item?;
            let archived = rkyv::access::<ArchivedSignalReplayEntry, rkyv::rancor::Error>(&value)?;
            let entry: SignalReplayEntry = rkyv::deserialize::<SignalReplayEntry, rkyv::rancor::Error>(archived)?;
            if entry.signal_id == signal_id {
                return Ok(Some(entry));
            }
        }

        Ok(None)
    }

    // ============== Key Builders ==============

    fn parking_lot_key(project_id: &str, entry_key: &str) -> String {
        format!("{}:{}", project_id, entry_key)
    }

    fn signal_replay_key(project_id: &str, session_id: &str, timestamp_ms: i64, signal_id: &str) -> String {
        // Zero-pad timestamp for lexicographic ordering
        format!("{}:{}:{:016}:{}", project_id, session_id, timestamp_ms, signal_id)
    }

    // ============== Maintenance ==============

    /// Flush all pending writes to disk
    pub fn flush(&self) -> Result<()> {
        self.keyspace.persist(fjall::PersistMode::SyncAll)?;
        Ok(())
    }

    /// Get approximate disk usage
    pub fn disk_space(&self) -> u64 {
        self.keyspace.disk_space()
    }

    /// Compact the stores (reclaim space from deleted entries)
    pub fn compact(&self) -> Result<()> {
        // fjall handles compaction automatically, but we can trigger it
        self.keyspace.persist(fjall::PersistMode::SyncAll)?;
        Ok(())
    }
}

/// Builder for creating parking lot entries
pub struct ParkingLotEntryBuilder {
    project_id: String,
    session_id: String,
    category: String,
    content: String,
    confidence: f32,
    source_context: String,
}

impl ParkingLotEntryBuilder {
    pub fn new(project_id: impl Into<String>, session_id: impl Into<String>) -> Self {
        Self {
            project_id: project_id.into(),
            session_id: session_id.into(),
            category: String::new(),
            content: String::new(),
            confidence: 0.5,
            source_context: String::new(),
        }
    }

    pub fn category(mut self, category: impl Into<String>) -> Self {
        self.category = category.into();
        self
    }

    pub fn content(mut self, content: impl Into<String>) -> Self {
        self.content = content.into();
        self
    }

    pub fn confidence(mut self, confidence: f32) -> Self {
        self.confidence = confidence;
        self
    }

    pub fn source_context(mut self, context: impl Into<String>) -> Self {
        self.source_context = context.into();
        self
    }

    pub fn build(self) -> ParkingLotEntry {
        let key = format!(
            "{}_{}_{}",
            &self.category,
            Utc::now().timestamp_millis(),
            Uuid::new_v4().to_string().split('-').next().unwrap_or("0000")
        );

        ParkingLotEntry {
            key,
            project_id: self.project_id,
            session_id: self.session_id,
            category: self.category,
            content: self.content,
            confidence: self.confidence,
            source_context: self.source_context,
            created_at: Utc::now().timestamp_millis(),
            status: "pending".to_string(),
        }
    }
}

/// Builder for creating signal replay entries
pub struct SignalReplayEntryBuilder {
    project_id: String,
    session_id: String,
    signal_type: String,
    payload_json: String,
    hop_number: u32,
    parent_id: Option<String>,
}

impl SignalReplayEntryBuilder {
    pub fn new(project_id: impl Into<String>, session_id: impl Into<String>) -> Self {
        Self {
            project_id: project_id.into(),
            session_id: session_id.into(),
            signal_type: String::new(),
            payload_json: "{}".to_string(),
            hop_number: 0,
            parent_id: None,
        }
    }

    pub fn signal_type(mut self, signal_type: impl Into<String>) -> Self {
        self.signal_type = signal_type.into();
        self
    }

    pub fn payload_json(mut self, payload: impl Into<String>) -> Self {
        self.payload_json = payload.into();
        self
    }

    pub fn hop_number(mut self, hop: u32) -> Self {
        self.hop_number = hop;
        self
    }

    pub fn parent_id(mut self, parent: impl Into<String>) -> Self {
        self.parent_id = Some(parent.into());
        self
    }

    pub fn build(self) -> SignalReplayEntry {
        SignalReplayEntry {
            signal_id: Uuid::new_v4().to_string(),
            project_id: self.project_id,
            session_id: self.session_id,
            signal_type: self.signal_type,
            payload_json: self.payload_json,
            timestamp_ms: Utc::now().timestamp_millis(),
            hop_number: self.hop_number,
            parent_id: self.parent_id,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_parking_lot_roundtrip() {
        let dir = tempdir().unwrap();
        let stores = FjallStores::open_at(&dir.path().to_path_buf()).unwrap();

        let entry = ParkingLotEntryBuilder::new("proj-123", "sess-456")
            .category("architecture")
            .content("Use event sourcing for audit log")
            .confidence(0.85)
            .source_context("User mentioned 'audit trail' requirements")
            .build();

        let key = entry.key.clone();

        stores.park(&entry).unwrap();

        let retrieved = stores.get_parked("proj-123", &key).unwrap();
        assert!(retrieved.is_some());

        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.content, "Use event sourcing for audit log");
        assert_eq!(retrieved.confidence, 0.85);
    }

    #[test]
    fn test_signal_replay_ordering() {
        let dir = tempdir().unwrap();
        let stores = FjallStores::open_at(&dir.path().to_path_buf()).unwrap();

        // Record signals in order
        for i in 0..5 {
            let entry = SignalReplayEntry {
                signal_id: format!("sig-{}", i),
                project_id: "proj-123".to_string(),
                session_id: "sess-456".to_string(),
                signal_type: "UserInput".to_string(),
                payload_json: format!("{{\"message\": {}}}", i),
                timestamp_ms: 1000 + i as i64,
                hop_number: i as u32,
                parent_id: None,
            };
            stores.record_signal(&entry).unwrap();
        }

        // Retrieve and verify order
        let signals = stores.get_session_signals("proj-123", "sess-456").unwrap();
        assert_eq!(signals.len(), 5);

        for (i, signal) in signals.iter().enumerate() {
            assert_eq!(signal.hop_number, i as u32);
        }
    }
}
