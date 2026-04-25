//! Pipeline glue — turns one captured frame into a sink write + metric.
//!
//! Deliberately *not* a long-running task. The Tauri command layer
//! owns the actual `tokio::spawn` loop in V-4b; this module ships the
//! per-frame composition (`process_frame`) so the orchestration loop
//! is one async-fn-per-tick that's trivial to read and unit-test.
//!
//! # Why pure-fn instead of an owned task
//!
//! Capture lives in the Tauri layer (xcap + nokhwa, which depend on
//! types that don't belong in the engine). Sinks + governor + metrics
//! live here. A long-running task that combined them would need to
//! cross the boundary in both directions and would not be testable
//! without booting the whole platform. `process_frame` takes already-
//! captured bytes + already-computed embedding and does only the
//! engine-side work: governor consult, sink dispatch, metric record.
//!
//! V-4b composes this from inside `commands::pixvix::session`.

use std::sync::Arc;
use std::time::Instant;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;

use super::dto::FrameMetric;
use super::governor::GovernorHandle;
use super::metrics::MetricsBuffer;
use super::sinks::{FrameSink, FrameSinkRecord};

// ═══════════════════════════════════════════════════════════════════════
// Config
// ═══════════════════════════════════════════════════════════════════════

/// Static configuration the orchestration loop reads once per tick.
///
/// Mutable knobs (cadence, hd_path) come from the operator's
/// preferences; the loop reloads them between ticks rather than
/// passing them via this struct so devtool changes take effect on
/// the next frame, not session restart.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize, Type)]
#[serde(rename_all = "camelCase")]
pub struct PipelineConfig {
    /// Opaque session identifier (UUID). One vision session →
    /// one value here.
    pub session_id: String,
    /// `"monitor"` | `"window"` | `"webcam"`.
    pub source_kind: String,
    /// Source identifier within the kind.
    pub source_id: u32,
    /// Active HD backend label: `"siglip1-candle"` | `"siglip2-ort"`
    /// | `"siglip1-tiled"`. Surfaced into FrameMetric.hd_path.
    pub hd_path: String,
    /// `true` when the pipeline pushes frames + embeddings to Clyffy
    /// for analysis (V-9). When `false`, sinks still write but the
    /// Clyffy feedback panel stays quiet.
    pub clyffy_feedback_enabled: bool,
}

// ═══════════════════════════════════════════════════════════════════════
// Per-frame composition
// ═══════════════════════════════════════════════════════════════════════

/// One frame as it arrives from the capture layer.
///
/// `embedding` is `None` when the operator has the SigLip pass turned
/// off — capture-only sessions produce metrics with `embedding_dim = 0`.
#[derive(Debug, Clone)]
pub struct CapturedTickFrame {
    /// Monotonic frame counter for this session (0, 1, 2, ...).
    pub frame_id: u64,
    /// Capture wall-clock timestamp (Unix epoch ms).
    pub captured_at_ms: i64,
    /// Pixel width.
    pub width: u32,
    /// Pixel height.
    pub height: u32,
    /// Encoded frame bytes (PNG or JPEG).
    pub png_bytes: Vec<u8>,
    /// Embedding from the SigLip pass, if any.
    pub embedding: Option<Vec<f32>>,
    /// Capture latency (ms) — OS call only, excludes encode.
    pub capture_ms: f32,
    /// Encode latency (ms).
    pub encode_ms: f32,
    /// CPU load percentage observed at capture start.
    pub cpu_pct: f32,
    /// Process RSS (MB) observed at capture start.
    pub rss_mb: u32,
    /// `true` when the governor reported throttled state for this
    /// tick but the operator forced it through.
    pub governor_throttled: bool,
}

/// Compose one captured frame into sink writes + a metric record.
///
/// Steps, in order:
///   1. Build `FrameSinkRecord` from the inputs (single allocation).
///   2. Time the sink write end-to-end.
///   3. Record similarity-to-prev via the metrics buffer (which keeps
///      the previous embedding around).
///   4. Build the `FrameMetric` and stash it in the buffer.
///
/// Returns the persisted `FrameMetric` so callers can echo it onto
/// the event bridge for live UI updates.
pub async fn process_frame(
    config: &PipelineConfig,
    sink: Arc<dyn FrameSink>,
    metrics: &MetricsBuffer,
    frame: CapturedTickFrame,
) -> Result<FrameMetric> {
    let frame_bytes = frame.png_bytes.len() as u32;
    let embedding_dim = frame.embedding.as_ref().map(Vec::len).unwrap_or(0) as u32;

    // 1. Build sink record (clones happen here, not later).
    let record = FrameSinkRecord {
        session_id: config.session_id.clone(),
        frame_id: frame.frame_id,
        captured_at_ms: frame.captured_at_ms,
        source_kind: config.source_kind.clone(),
        source_id: config.source_id,
        width: frame.width,
        height: frame.height,
        png_bytes: frame.png_bytes,
        embedding: frame.embedding.clone(),
    };

    // 2. Sink dispatch (composite handles fan-out + per-member errors).
    let sink_start = Instant::now();
    let sink_name = sink.name();
    sink.write(&record).await?;
    let sink_ms = sink_start.elapsed().as_secs_f32() * 1000.0;

    // 3. Metric assembly. similarity_to_prev + embedding_norm filled
    //    by the buffer when an embedding is present.
    let mut metric = FrameMetric {
        session_id: config.session_id.clone(),
        frame_id: frame.frame_id,
        ts_ms: frame.captured_at_ms,
        source_kind: config.source_kind.clone(),
        source_idx: config.source_id,
        capture_ms: frame.capture_ms,
        encode_ms: frame.encode_ms,
        sink_ms,
        total_ms: frame.capture_ms + frame.encode_ms + sink_ms,
        frame_bytes,
        embedding_dim,
        embedding_norm: 0.0,
        similarity_to_prev: None,
        cpu_pct: frame.cpu_pct,
        rss_mb: frame.rss_mb,
        governor_throttled: frame.governor_throttled,
        hd_path: config.hd_path.clone(),
        sink_list: sink_name.to_string(),
    };

    // 4. Record into the in-memory ring (with similarity if embedding).
    if let Some(embedding) = frame.embedding {
        let _sim = metrics
            .record_with_embedding(metric.clone(), embedding)
            .await;
        // record_with_embedding stamps similarity_to_prev + norm onto
        // the buffered copy; mirror those onto the returned metric so
        // the caller sees the same numbers it would query later.
        let recent = metrics.recent(1).await;
        if let Some(latest) = recent.first() {
            metric.similarity_to_prev = latest.similarity_to_prev;
            metric.embedding_norm = latest.embedding_norm;
        }
    } else {
        metrics.record(metric.clone()).await;
    }

    Ok(metric)
}

/// Convenience: should this tick proceed?
///
/// Wraps `governor.throttled().await` so callers don't need to import
/// the governor type just to gate on its decision. Returns `true`
/// when the pipeline should *skip* this tick.
pub async fn should_skip_tick(governor: &GovernorHandle) -> bool {
    governor.throttled().await
}

#[cfg(test)]
mod tests {
    use super::super::sinks::DiscardSink;
    use super::*;

    fn config() -> PipelineConfig {
        PipelineConfig {
            session_id: "test-session".into(),
            source_kind: "monitor".into(),
            source_id: 0,
            hd_path: "siglip1-candle".into(),
            clyffy_feedback_enabled: false,
        }
    }

    fn frame(id: u64, embedding: Option<Vec<f32>>) -> CapturedTickFrame {
        CapturedTickFrame {
            frame_id: id,
            captured_at_ms: id as i64 * 1000,
            width: 100,
            height: 100,
            png_bytes: vec![0u8; 64],
            embedding,
            capture_ms: 5.0,
            encode_ms: 3.0,
            cpu_pct: 12.5,
            rss_mb: 256,
            governor_throttled: false,
        }
    }

    #[tokio::test]
    async fn process_frame_returns_metric_with_summed_total_ms() {
        let cfg = config();
        let metrics = MetricsBuffer::new();
        let sink: Arc<dyn FrameSink> = Arc::new(DiscardSink);
        let m = process_frame(&cfg, sink, &metrics, frame(0, None))
            .await
            .unwrap();
        assert_eq!(m.frame_id, 0);
        // total_ms = capture (5) + encode (3) + sink (~0)
        assert!(m.total_ms >= 8.0 && m.total_ms < 50.0);
    }

    #[tokio::test]
    async fn process_frame_records_into_metrics_buffer() {
        let cfg = config();
        let metrics = MetricsBuffer::new();
        let sink: Arc<dyn FrameSink> = Arc::new(DiscardSink);
        let _ = process_frame(&cfg, sink.clone(), &metrics, frame(0, None)).await;
        let _ = process_frame(&cfg, sink, &metrics, frame(1, None)).await;
        assert_eq!(metrics.len().await, 2);
    }

    #[tokio::test]
    async fn process_frame_with_embedding_computes_similarity_to_prev() {
        let cfg = config();
        let metrics = MetricsBuffer::new();
        let sink: Arc<dyn FrameSink> = Arc::new(DiscardSink);

        // First frame — no prev → similarity = None.
        let m0 = process_frame(&cfg, sink.clone(), &metrics, frame(0, Some(vec![1.0, 0.0])))
            .await
            .unwrap();
        assert!(m0.similarity_to_prev.is_none());

        // Identical embedding → similarity ≈ 1.0.
        let m1 = process_frame(&cfg, sink, &metrics, frame(1, Some(vec![1.0, 0.0])))
            .await
            .unwrap();
        let sim = m1.similarity_to_prev.unwrap();
        assert!((sim - 1.0).abs() < 1e-6, "expected 1.0 got {sim}");
    }

    #[tokio::test]
    async fn process_frame_capture_only_records_zero_embedding_dim() {
        let cfg = config();
        let metrics = MetricsBuffer::new();
        let sink: Arc<dyn FrameSink> = Arc::new(DiscardSink);
        let m = process_frame(&cfg, sink, &metrics, frame(0, None))
            .await
            .unwrap();
        assert_eq!(m.embedding_dim, 0);
        assert_eq!(m.embedding_norm, 0.0);
        assert!(m.similarity_to_prev.is_none());
    }

    #[tokio::test]
    async fn process_frame_carries_hd_path_label() {
        let mut cfg = config();
        cfg.hd_path = "siglip2-ort".into();
        let metrics = MetricsBuffer::new();
        let sink: Arc<dyn FrameSink> = Arc::new(DiscardSink);
        let m = process_frame(&cfg, sink, &metrics, frame(0, None))
            .await
            .unwrap();
        assert_eq!(m.hd_path, "siglip2-ort");
    }
}
