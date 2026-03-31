//! HuggingFace download manager — progress, cancel, checksum, auto-registry.
//!
//! Phase 5 implementation. Skeleton for Phase 1 compile.

/// Handle to a running download, used for cancellation.
#[derive(Debug)]
pub struct DownloadHandle {
    /// Unique download identifier.
    pub id: String,
    /// HuggingFace repo ID.
    pub repo_id: String,
    /// Target filename.
    pub filename: String,
}

/// Download progress snapshot.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DownloadProgress {
    /// Download identifier.
    pub download_id: String,
    /// Bytes downloaded so far.
    pub bytes_downloaded: u64,
    /// Total expected bytes.
    pub total_bytes: u64,
    /// Current download speed in bytes/second.
    pub speed_bps: u64,
    /// Estimated time remaining in seconds.
    pub eta_secs: u64,
}
