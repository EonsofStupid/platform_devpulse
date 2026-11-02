//! User-directed frame sinks — disk, Turso, `DuckDB`, discard, composite.
//!
//! The pipeline holds an `Arc<dyn FrameSink>` and calls `write` once
//! per captured frame. The operator picks which sinks compose into
//! that single arc via the Config tab; the default ships disk + Turso
//! + `DuckDB` as a `CompositeSink`.
//!
//! # Per-sink error isolation
//!
//! `CompositeSink` walks every member regardless of individual failures
//! and reports them through `SinkHealth`. One bad sink (corrupt disk,
//! Turso lock contention, `DuckDB` write timeout) never kills the whole
//! pipeline — the others keep writing while the failing one shows a
//! degraded badge in the Status tab.

use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Result;
use async_trait::async_trait;
// Concrete adapter types + their traits — the persistence traits use
// native `async fn` so they aren't dyn-compatible, but bringing them
// into scope lets us call `.execute` / `.append` via the trait method.
use devpulse_clyffy::cortex::persistence::{
    AnalyticsAdapter, DuckDbAdapter, SqlAdapter, TursoAdapter,
};
use serde::{Deserialize, Serialize};
use specta::Type;

// ═══════════════════════════════════════════════════════════════════════
// Wire types
// ═══════════════════════════════════════════════════════════════════════

/// One frame's worth of data the sinks consume.
///
/// Owned to keep `CompositeSink` fan-out cheap (each member borrows
/// without coordinating lifetimes). `png_bytes` is `Vec<u8>` (not
/// `Arc<[u8]>`) because the sinks each take a different action — disk
/// writes the bytes verbatim, Turso stores a path, `DuckDB` stores
/// only the embedding. The clone cost is dominated by encode time
/// upstream anyway.
#[derive(Debug, Clone)]
pub struct FrameSinkRecord {
    /// Session that produced this frame.
    pub session_id: String,
    /// Monotonic frame counter within the session.
    pub frame_id: u64,
    /// Capture wall-clock timestamp (Unix epoch ms).
    pub captured_at_ms: i64,
    /// `"monitor"` | `"window"` | `"webcam"`.
    pub source_kind: String,
    /// Source identifier within the kind.
    pub source_id: u32,
    /// Pixel width.
    pub width: u32,
    /// Pixel height.
    pub height: u32,
    /// Encoded frame bytes (PNG or JPEG depending on the encoder used
    /// upstream). Sinks that don't need bytes (`DuckDB` embedding-only)
    /// ignore this field.
    pub png_bytes: Vec<u8>,
    /// Optional embedding vector. `None` when the pipeline is in
    /// capture-only mode (no `SigLip` pass).
    pub embedding: Option<Vec<f32>>,
}

/// Per-sink health surfaced to the Status tab.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Type)]
#[serde(rename_all = "kebab-case", tag = "kind", content = "reason")]
pub enum SinkHealth {
    /// Last write succeeded; sink is happy.
    Healthy,
    /// Last write failed; pipeline kept moving but something is wrong.
    Degraded(String),
    /// Sink is configured-out or otherwise unable to attempt writes.
    Down(String),
}

// ═══════════════════════════════════════════════════════════════════════
// Trait
// ═══════════════════════════════════════════════════════════════════════

/// User-directed sink for captured frames + embeddings.
///
/// `name()` is the wire-stable label that shows up in `FrameMetric.sink_list`.
/// Implementations MUST be cheap to construct; the pipeline calls
/// `write` once per frame and never re-instantiates.
#[async_trait]
pub trait FrameSink: Send + Sync {
    /// Stable label for this sink. Lowercased, kebab-case, used in
    /// `FrameMetric.sink_list` and the devtool's per-sink badges.
    fn name(&self) -> &'static str;

    /// Persist a frame. Implementations should be idempotent on
    /// `(session_id, frame_id)` so a retry never duplicates.
    async fn write(&self, record: &FrameSinkRecord) -> Result<()>;

    /// Snapshot the most-recently observed health. Cheap, no I/O.
    fn health(&self) -> SinkHealth;
}

// ═══════════════════════════════════════════════════════════════════════
// Discard
// ═══════════════════════════════════════════════════════════════════════

/// No-op sink. Drops every record on the floor.
///
/// Used by the Metrics panel's "discard" sink config to measure pure
/// capture+encode latency without sink I/O contamination, and by tests
/// that exercise the pipeline without touching disk.
pub struct DiscardSink;

#[async_trait]
impl FrameSink for DiscardSink {
    fn name(&self) -> &'static str {
        "discard"
    }

    async fn write(&self, _record: &FrameSinkRecord) -> Result<()> {
        Ok(())
    }

    fn health(&self) -> SinkHealth {
        SinkHealth::Healthy
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Disk
// ═══════════════════════════════════════════════════════════════════════

/// Writes the frame bytes to disk under
/// `<directory>/<session_id>/<frame_id>.png`.
///
/// Holds the directory root + a parking_lot-style health cell so the
/// devtool can read the latest write status without an awaitable.
pub struct DiskFrameSink {
    directory: PathBuf,
    health: std::sync::RwLock<SinkHealth>,
}

impl DiskFrameSink {
    /// Construct a disk sink rooted at `<data_dir>/vision-frames/`.
    /// The directory is created lazily on the first `write`; tests
    /// that never write don't accidentally pollute the FS.
    #[must_use]
    pub fn new(directory: PathBuf) -> Self {
        Self {
            directory,
            health: std::sync::RwLock::new(SinkHealth::Healthy),
        }
    }

    /// Resolve the on-disk path for a given record without writing.
    /// Exposed for tests and for the Turso sink (it stores the path
    /// the disk sink would have used so the two sinks reference one
    /// canonical location).
    pub fn path_for(&self, session_id: &str, frame_id: u64) -> PathBuf {
        self.directory
            .join(session_id)
            .join(format!("{frame_id}.png"))
    }
}

#[async_trait]
impl FrameSink for DiskFrameSink {
    fn name(&self) -> &'static str {
        "disk"
    }

    async fn write(&self, record: &FrameSinkRecord) -> Result<()> {
        let path = self.path_for(&record.session_id, record.frame_id);
        let parent = path.parent().ok_or_else(|| {
            anyhow::anyhow!("disk-sink path has no parent dir: {}", path.display())
        })?;
        let bytes = record.png_bytes.clone();
        let parent_buf = parent.to_path_buf();
        let path_buf = path.clone();

        let result = devpulse_telemetry::spawn_blocking(move || -> Result<()> {
            std::fs::create_dir_all(&parent_buf)?;
            std::fs::write(&path_buf, &bytes)?;
            Ok(())
        })
        .await;

        match result {
            Ok(Ok(())) => {
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Healthy;
                }
                Ok(())
            }
            Ok(Err(e)) => {
                let msg = e.to_string();
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Degraded(msg.clone());
                }
                Err(e)
            }
            Err(join_err) => {
                let msg = format!("disk sink task panicked: {join_err}");
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Degraded(msg.clone());
                }
                Err(anyhow::anyhow!(msg))
            }
        }
    }

    fn health(&self) -> SinkHealth {
        self.health
            .read()
            .map_or(SinkHealth::Degraded("health rwlock poisoned".into()), |g| {
                g.clone()
            })
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Turso
// ═══════════════════════════════════════════════════════════════════════

/// Inserts one row per frame into `vision_frames` (USER scope).
///
/// `sink_path` mirrors what `DiskFrameSink` would write so a composite
/// `disk + turso` configuration produces a queryable index pointing
/// at on-disk PNGs. Set `sink_path` to an empty string when the disk
/// sink isn't paired (the row still records dims + embedding).
pub struct TursoFrameSink {
    adapter: Arc<TursoAdapter>,
    /// Optional disk-sink path generator. When `None`, `sink_path`
    /// column is written empty.
    paired_disk: Option<Arc<DiskFrameSink>>,
    health: std::sync::RwLock<SinkHealth>,
}

impl TursoFrameSink {
    /// Construct a Turso sink. Pair with a `DiskFrameSink` to record
    /// the on-disk PNG path alongside the row. Concrete adapter type
    /// (not `dyn SqlAdapter`) because the persistence trait is a
    /// native `async fn` trait — not yet dyn-compatible in stable Rust.
    #[must_use]
    pub fn new(adapter: Arc<TursoAdapter>, paired_disk: Option<Arc<DiskFrameSink>>) -> Self {
        Self {
            adapter,
            paired_disk,
            health: std::sync::RwLock::new(SinkHealth::Healthy),
        }
    }
}

#[async_trait]
impl FrameSink for TursoFrameSink {
    fn name(&self) -> &'static str {
        "turso"
    }

    async fn write(&self, record: &FrameSinkRecord) -> Result<()> {
        let sink_path = match &self.paired_disk {
            Some(d) => d
                .path_for(&record.session_id, record.frame_id)
                .display()
                .to_string(),
            None => String::new(),
        };

        // The `embedding_csv` column holds the f32s as CSV text; empty
        // when the frame was captured without an embedding.
        let embedding_csv = record
            .embedding
            .as_ref()
            .map(|v| {
                v.iter()
                    .map(|f| format!("{f}"))
                    .collect::<Vec<_>>()
                    .join(",")
            })
            .unwrap_or_default();

        let frame_id = i64::try_from(record.frame_id)
            .map_err(|_| anyhow::anyhow!("frame id {} exceeds SQLite INTEGER", record.frame_id))?;

        let result = self
            .adapter
            .execute(
                "INSERT OR REPLACE INTO vision_frames \
                 (session_id, frame_id, captured_at_ms, source_kind, source_id, \
                  width, height, sink_path, embedding_csv) \
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                &[
                    record.session_id.as_str().into(),
                    frame_id.into(),
                    record.captured_at_ms.into(),
                    record.source_kind.as_str().into(),
                    record.source_id.into(),
                    record.width.into(),
                    record.height.into(),
                    sink_path.into(),
                    embedding_csv.into(),
                ],
            )
            .await;

        match result {
            Ok(_) => {
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Healthy;
                }
                Ok(())
            }
            Err(e) => {
                let msg = e.to_string();
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Degraded(msg.clone());
                }
                Err(e)
            }
        }
    }

    fn health(&self) -> SinkHealth {
        self.health
            .read()
            .map_or(SinkHealth::Degraded("health rwlock poisoned".into()), |g| {
                g.clone()
            })
    }
}

// ═══════════════════════════════════════════════════════════════════════
// DuckDB embedding
// ═══════════════════════════════════════════════════════════════════════

/// Appends the embedding (only) into a `DuckDB` table for analytics queries.
///
/// Designed for the Metrics tab — operators can run `SELECT
/// session_id, COUNT(*) FROM vision_embeddings ...` for ad-hoc
/// rollups without touching the Turso row store.
///
/// Skips writes silently when `record.embedding` is `None` — pure
/// capture-only sessions don't pollute the analytics table with empty
/// rows.
pub struct DuckDbEmbeddingSink {
    adapter: Arc<DuckDbAdapter>,
    health: std::sync::RwLock<SinkHealth>,
}

impl DuckDbEmbeddingSink {
    /// Concrete adapter type (not `dyn AnalyticsAdapter`) — the
    /// persistence trait uses native `async fn` so dyn dispatch is
    /// not yet available in stable Rust.
    #[must_use]
    pub fn new(adapter: Arc<DuckDbAdapter>) -> Self {
        Self {
            adapter,
            health: std::sync::RwLock::new(SinkHealth::Healthy),
        }
    }
}

#[async_trait]
impl FrameSink for DuckDbEmbeddingSink {
    fn name(&self) -> &'static str {
        "duckdb"
    }

    async fn write(&self, record: &FrameSinkRecord) -> Result<()> {
        let Some(embedding) = &record.embedding else {
            // Capture-only mode — nothing to write.
            return Ok(());
        };

        let row = serde_json::json!({
            "session_id": record.session_id,
            "frame_id": record.frame_id,
            "captured_at_ms": record.captured_at_ms,
            "embedding_dim": embedding.len(),
            "embedding": embedding,
        });

        let result = self.adapter.append("vision_embeddings", &[row]).await;

        match result {
            Ok(_) => {
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Healthy;
                }
                Ok(())
            }
            Err(e) => {
                let msg = e.to_string();
                if let Ok(mut h) = self.health.write() {
                    *h = SinkHealth::Degraded(msg.clone());
                }
                Err(e)
            }
        }
    }

    fn health(&self) -> SinkHealth {
        self.health
            .read()
            .map_or(SinkHealth::Degraded("health rwlock poisoned".into()), |g| {
                g.clone()
            })
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Composite (fan-out)
// ═══════════════════════════════════════════════════════════════════════

/// Fan-out wrapper that writes to every member sink.
///
/// Per-sink error isolation: one failing member never short-circuits
/// the others. Returns `Ok(())` when at least one sink succeeded;
/// `Err` only when EVERY member failed (caller should treat that as
/// "session dead, stop the pipeline"). The detailed per-sink health
/// is queryable via `member_health()`.
pub struct CompositeSink {
    members: Vec<Arc<dyn FrameSink>>,
}

impl CompositeSink {
    /// Wrap a list of sinks for fan-out dispatch. Empty list is allowed
    /// and behaves as a silent discard with `Down` health.
    #[must_use]
    pub fn new(members: Vec<Arc<dyn FrameSink>>) -> Self {
        Self { members }
    }

    /// Snapshot per-member health for the Status tab.
    pub fn member_health(&self) -> Vec<(String, SinkHealth)> {
        self.members
            .iter()
            .map(|m| (m.name().to_string(), m.health()))
            .collect()
    }
}

#[async_trait]
impl FrameSink for CompositeSink {
    fn name(&self) -> &'static str {
        "composite"
    }

    async fn write(&self, record: &FrameSinkRecord) -> Result<()> {
        if self.members.is_empty() {
            // Empty composite = silent discard. Don't error.
            return Ok(());
        }
        let mut any_ok = false;
        let mut last_err: Option<anyhow::Error> = None;
        for member in &self.members {
            match member.write(record).await {
                Ok(()) => any_ok = true,
                Err(e) => {
                    tracing::warn!(
                        sink = member.name(),
                        error = %e,
                        "vision.sink: per-member write failed (others continue)"
                    );
                    last_err = Some(e);
                }
            }
        }
        if any_ok {
            Ok(())
        } else {
            Err(last_err.unwrap_or_else(|| anyhow::anyhow!("composite: all members failed")))
        }
    }

    /// Composite health is the worst of any member.
    fn health(&self) -> SinkHealth {
        let mut healthy = 0;
        let mut degraded: Vec<String> = Vec::new();
        let mut down: Vec<String> = Vec::new();
        for m in &self.members {
            match m.health() {
                SinkHealth::Healthy => healthy += 1,
                SinkHealth::Degraded(r) => degraded.push(format!("{}: {r}", m.name())),
                SinkHealth::Down(r) => down.push(format!("{}: {r}", m.name())),
            }
        }
        if !down.is_empty() {
            SinkHealth::Down(down.join("; "))
        } else if !degraded.is_empty() {
            SinkHealth::Degraded(degraded.join("; "))
        } else if healthy == 0 {
            // Empty composite
            SinkHealth::Down("no member sinks configured".into())
        } else {
            SinkHealth::Healthy
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    fn record(frame_id: u64) -> FrameSinkRecord {
        FrameSinkRecord {
            session_id: "test".into(),
            frame_id,
            captured_at_ms: 0,
            source_kind: "monitor".into(),
            source_id: 0,
            width: 100,
            height: 100,
            png_bytes: vec![0u8; 16],
            embedding: None,
        }
    }

    /// Counting sink — increments on each write. For composite tests.
    struct CountingSink {
        counter: Arc<AtomicUsize>,
        fail: bool,
        name_str: &'static str,
    }

    #[async_trait]
    impl FrameSink for CountingSink {
        fn name(&self) -> &'static str {
            self.name_str
        }
        async fn write(&self, _r: &FrameSinkRecord) -> Result<()> {
            self.counter.fetch_add(1, Ordering::SeqCst);
            if self.fail {
                Err(anyhow::anyhow!("intentional"))
            } else {
                Ok(())
            }
        }
        fn health(&self) -> SinkHealth {
            if self.fail {
                SinkHealth::Degraded("intentional".into())
            } else {
                SinkHealth::Healthy
            }
        }
    }

    #[tokio::test]
    async fn discard_writes_succeed_silently() -> anyhow::Result<()> {
        let sink = DiscardSink;
        for i in 0..5 {
            sink.write(&record(i)).await?;
        }
        assert_eq!(sink.health(), SinkHealth::Healthy);
        Ok(())
    }

    #[tokio::test]
    async fn composite_fan_out_succeeds_when_all_succeed() -> anyhow::Result<()> {
        let c1 = Arc::new(AtomicUsize::new(0));
        let c2 = Arc::new(AtomicUsize::new(0));
        let composite = CompositeSink::new(vec![
            Arc::new(CountingSink {
                counter: c1.clone(),
                fail: false,
                name_str: "a",
            }),
            Arc::new(CountingSink {
                counter: c2.clone(),
                fail: false,
                name_str: "b",
            }),
        ]);
        composite.write(&record(0)).await?;
        assert_eq!(c1.load(Ordering::SeqCst), 1);
        assert_eq!(c2.load(Ordering::SeqCst), 1);
        assert_eq!(composite.health(), SinkHealth::Healthy);
        Ok(())
    }

    #[tokio::test]
    async fn composite_isolates_per_member_failure() -> anyhow::Result<()> {
        let c1 = Arc::new(AtomicUsize::new(0));
        let c2 = Arc::new(AtomicUsize::new(0));
        let composite = CompositeSink::new(vec![
            Arc::new(CountingSink {
                counter: c1.clone(),
                fail: true, // member a fails
                name_str: "a",
            }),
            Arc::new(CountingSink {
                counter: c2.clone(),
                fail: false, // member b succeeds
                name_str: "b",
            }),
        ]);
        // Composite returns Ok because at least one member succeeded.
        composite.write(&record(0)).await?;
        assert_eq!(
            c1.load(Ordering::SeqCst),
            1,
            "failing member still attempted"
        );
        assert_eq!(c2.load(Ordering::SeqCst), 1, "healthy member still wrote");
        // Health is degraded because one member is unhealthy.
        assert!(matches!(composite.health(), SinkHealth::Degraded(_)));
        Ok(())
    }

    #[tokio::test]
    async fn composite_returns_err_only_when_all_fail() {
        let c = Arc::new(AtomicUsize::new(0));
        let composite = CompositeSink::new(vec![
            Arc::new(CountingSink {
                counter: c.clone(),
                fail: true,
                name_str: "a",
            }),
            Arc::new(CountingSink {
                counter: c.clone(),
                fail: true,
                name_str: "b",
            }),
        ]);
        let err = composite.write(&record(0)).await;
        assert!(err.is_err(), "all-fail should propagate");
        assert_eq!(c.load(Ordering::SeqCst), 2);
    }

    #[tokio::test]
    async fn composite_empty_is_silent_discard() -> anyhow::Result<()> {
        let composite = CompositeSink::new(vec![]);
        composite.write(&record(0)).await?;
        assert!(matches!(composite.health(), SinkHealth::Down(_)));
        Ok(())
    }

    #[tokio::test]
    async fn disk_sink_writes_then_reads_back() -> anyhow::Result<()> {
        let tmp = tempfile::tempdir()?;
        let sink = DiskFrameSink::new(tmp.path().to_path_buf());
        let r = FrameSinkRecord {
            session_id: "sess".into(),
            frame_id: 7,
            captured_at_ms: 1,
            source_kind: "monitor".into(),
            source_id: 0,
            width: 4,
            height: 4,
            png_bytes: b"PNG-FAKE-BYTES".to_vec(),
            embedding: None,
        };
        sink.write(&r).await?;
        let read = std::fs::read(sink.path_for("sess", 7))?;
        assert_eq!(read, b"PNG-FAKE-BYTES");
        assert_eq!(sink.health(), SinkHealth::Healthy);
        Ok(())
    }

    #[tokio::test]
    async fn member_health_returns_per_sink_snapshot() {
        let composite = CompositeSink::new(vec![
            Arc::new(DiscardSink),
            Arc::new(CountingSink {
                counter: Arc::new(AtomicUsize::new(0)),
                fail: true,
                name_str: "fail",
            }),
        ]);
        let snap = composite.member_health();
        assert_eq!(snap.len(), 2);
        assert_eq!(snap[0].0, "discard");
        assert_eq!(snap[0].1, SinkHealth::Healthy);
        assert_eq!(snap[1].0, "fail");
        assert!(matches!(snap[1].1, SinkHealth::Degraded(_)));
    }
}
