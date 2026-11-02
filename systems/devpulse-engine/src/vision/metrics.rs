//! Per-frame metric collector — in-memory buffer + similarity helper.
//!
//! Two responsibilities:
//!   1. Buffer `FrameMetric` rows in memory so the Metrics tab can
//!      show recent-N without a `DuckDB` round-trip.
//!   2. Own the `cosine_similarity` helper the pipeline calls when
//!      computing `similarity_to_prev` so the math lives in one place.
//!
//! Batch → `DuckDB` flushing is the *caller's* job (the pipeline has the
//! analytics service handle; this module deliberately stays Platform-
//! service-free so it can be unit-tested without booting the engine).

use std::collections::VecDeque;
use std::sync::Arc;

use tokio::sync::RwLock;

use super::dto::FrameMetric;

/// Default ring capacity. Enough for ~10 minutes at 1 fps, ~90s at
/// 10 fps — matches the Metrics tab's "recent" view without growing
/// unbounded.
pub const DEFAULT_RECENT_CAPACITY: usize = 600;

/// Ring buffer of recent metrics. Clone-friendly (`Arc<RwLock<...>>`
/// internally) so the pipeline, the devtool command surface, and the
/// `DuckDB` batch flusher can all share one state.
#[derive(Clone)]
pub struct MetricsBuffer {
    inner: Arc<RwLock<Inner>>,
}

struct Inner {
    rows: VecDeque<FrameMetric>,
    capacity: usize,
    /// Latest embedding vector, kept around so `similarity_to_prev`
    /// has something to compare against. `None` on session start.
    last_embedding: Option<Vec<f32>>,
}

impl MetricsBuffer {
    /// Construct with the default capacity.
    #[must_use]
    pub fn new() -> Self {
        Self::with_capacity(DEFAULT_RECENT_CAPACITY)
    }

    /// Construct with a custom ring capacity.
    #[must_use]
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            inner: Arc::new(RwLock::new(Inner {
                rows: VecDeque::with_capacity(capacity),
                capacity,
                last_embedding: None,
            })),
        }
    }

    /// Record a completed frame. Trims the oldest row when capacity
    /// is exceeded.
    pub async fn record(&self, metric: FrameMetric) {
        let mut g = self.inner.write().await;
        if g.rows.len() == g.capacity {
            g.rows.pop_front();
        }
        g.rows.push_back(metric);
    }

    /// Record a frame along with its embedding; returns the computed
    /// `similarity_to_prev` (None for the first frame).
    ///
    /// Takes ownership of the embedding — the buffer keeps the most
    /// recent one around for the next call's comparison. Callers who
    /// need the embedding after recording should clone before passing.
    pub async fn record_with_embedding(
        &self,
        mut metric: FrameMetric,
        embedding: Vec<f32>,
    ) -> Option<f32> {
        let sim = {
            let guard = self.inner.read().await;
            guard
                .last_embedding
                .as_ref()
                .map(|prev| cosine_similarity(prev, &embedding))
        };
        metric.similarity_to_prev = sim;
        metric.embedding_norm = l2_norm(&embedding);

        let mut g = self.inner.write().await;
        if g.rows.len() == g.capacity {
            g.rows.pop_front();
        }
        g.rows.push_back(metric);
        g.last_embedding = Some(embedding);
        sim
    }

    /// Snapshot the last `n` rows, newest-last. Cheap — clones the
    /// inner Vec of `FrameMetric` (each row is ~200 bytes).
    pub async fn recent(&self, n: usize) -> Vec<FrameMetric> {
        let g = self.inner.read().await;
        let start = g.rows.len().saturating_sub(n);
        g.rows.iter().skip(start).cloned().collect()
    }

    /// Drain the buffer. Returns everything currently in the ring and
    /// resets it to empty. Intended for the `DuckDB` batch flusher.
    pub async fn drain(&self) -> Vec<FrameMetric> {
        let mut g = self.inner.write().await;
        let out: Vec<FrameMetric> = g.rows.drain(..).collect();
        // Preserve last_embedding — similarity-to-prev should survive
        // a flush so consecutive frames across a flush boundary still
        // produce a meaningful similarity value.
        out
    }

    /// Current ring size. Useful for backpressure decisions.
    pub async fn len(&self) -> usize {
        self.inner.read().await.rows.len()
    }

    /// `true` when the ring holds zero rows.
    pub async fn is_empty(&self) -> bool {
        self.inner.read().await.rows.is_empty()
    }
}

impl Default for MetricsBuffer {
    fn default() -> Self {
        Self::new()
    }
}

/// L2 norm of a vector. Returns 0.0 on an empty input rather than NaN
/// so metric rows always carry a finite number.
#[must_use]
pub fn l2_norm(v: &[f32]) -> f32 {
    if v.is_empty() {
        return 0.0;
    }
    v.iter().map(|x| x * x).sum::<f32>().sqrt()
}

/// Cosine similarity on two equal-length vectors.
///
/// Returns 0.0 when either vector is zero-norm or when the lengths
/// disagree — those are signals that similarity is undefined rather
/// than a value to surface as "different". Consumers should treat 0.0
/// as "unknown" when it shows up on a row that *should* have had a
/// prev-frame to compare against.
#[must_use]
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }
    let mut dot = 0.0_f32;
    let mut norm_a = 0.0_f32;
    let mut norm_b = 0.0_f32;
    for i in 0..a.len() {
        dot += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }
    let denom = norm_a.sqrt() * norm_b.sqrt();
    if denom == 0.0 { 0.0 } else { dot / denom }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn metric(frame_id: u64) -> FrameMetric {
        FrameMetric {
            session_id: "test".into(),
            frame_id,
            ts_ms: 0,
            source_kind: "monitor".into(),
            source_idx: 0,
            capture_ms: 0.0,
            encode_ms: 0.0,
            sink_ms: 0.0,
            total_ms: 0.0,
            frame_bytes: 0,
            embedding_dim: 0,
            embedding_norm: 0.0,
            similarity_to_prev: None,
            cpu_pct: 0.0,
            rss_mb: 0,
            governor_throttled: false,
            hd_path: "siglip1-candle".into(),
            sink_list: "discard".into(),
        }
    }

    #[test]
    fn l2_norm_of_unit_vector_is_one() {
        let v = vec![0.6, 0.8];
        assert!((l2_norm(&v) - 1.0).abs() < 1e-6);
    }

    #[test]
    fn l2_norm_of_empty_is_zero() {
        assert_eq!(l2_norm(&[]).to_bits(), 0.0_f32.to_bits());
    }

    #[test]
    fn cosine_similarity_of_identical_vectors_is_one() {
        let v = vec![1.0, 2.0, 3.0];
        let s = cosine_similarity(&v, &v);
        assert!((s - 1.0).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_of_orthogonal_vectors_is_zero() {
        let a = vec![1.0, 0.0];
        let b = vec![0.0, 1.0];
        assert!(cosine_similarity(&a, &b).abs() < 1e-6);
    }

    #[test]
    fn cosine_similarity_length_mismatch_returns_zero() {
        let a = vec![1.0, 2.0];
        let b = vec![1.0, 2.0, 3.0];
        assert_eq!(cosine_similarity(&a, &b).to_bits(), 0.0_f32.to_bits());
    }

    #[test]
    fn cosine_similarity_zero_vector_returns_zero() {
        let a = vec![0.0, 0.0];
        let b = vec![1.0, 1.0];
        assert_eq!(cosine_similarity(&a, &b).to_bits(), 0.0_f32.to_bits());
    }

    #[tokio::test]
    async fn buffer_records_and_keeps_recent() {
        let b = MetricsBuffer::with_capacity(3);
        b.record(metric(1)).await;
        b.record(metric(2)).await;
        b.record(metric(3)).await;
        b.record(metric(4)).await; // evicts 1
        let recent = b.recent(10).await;
        assert_eq!(recent.len(), 3);
        assert_eq!(recent[0].frame_id, 2);
        assert_eq!(recent[2].frame_id, 4);
    }

    #[tokio::test]
    async fn buffer_drain_empties_and_returns_all() {
        let b = MetricsBuffer::with_capacity(5);
        for i in 0..5 {
            b.record(metric(i)).await;
        }
        let drained = b.drain().await;
        assert_eq!(drained.len(), 5);
        assert!(b.is_empty().await);
    }

    #[tokio::test]
    async fn record_with_embedding_computes_similarity() {
        let b = MetricsBuffer::with_capacity(10);
        let e1 = vec![1.0_f32, 0.0, 0.0];
        let e2 = vec![0.0_f32, 1.0, 0.0];

        let s1 = b.record_with_embedding(metric(1), e1.clone()).await;
        assert!(s1.is_none(), "first frame has no prev");

        let s2 = b.record_with_embedding(metric(2), e2.clone()).await;
        assert!(s2.is_some_and(|value| value.abs() < 1e-6), "orthogonal → 0");

        let s3 = b.record_with_embedding(metric(3), e2).await;
        assert!(
            s3.is_some_and(|value| (value - 1.0).abs() < 1e-6),
            "identical → 1"
        );
    }

    #[tokio::test]
    async fn drain_preserves_last_embedding_for_cross_flush_similarity() {
        let b = MetricsBuffer::with_capacity(10);
        let e1 = vec![1.0_f32, 0.0];
        let e2 = vec![1.0_f32, 0.0];

        b.record_with_embedding(metric(1), e1).await;
        let _ = b.drain().await;

        // Post-drain frame should still see the previous embedding
        let s = b.record_with_embedding(metric(2), e2).await;
        assert!(
            s.is_some_and(|value| (value - 1.0).abs() < 1e-6),
            "identical embeddings across a drain should still compute similarity"
        );
    }
}
