//! Span trace writer — batched `DuckDB` persistence for tracing spans.
//!
//! Mirrors `LaneTraceWriter` exactly: receives completed span records
//! via mpsc channel, batches them, and bulk-inserts into `DuckDB`.
//!
//! Spans come from the `DuckDbLayer` (a `tracing::Layer` impl) which
//! captures every completed span from the tracing subscriber.

use std::sync::Arc;

use serde::Serialize;
use serde_json::json;
use tokio::sync::mpsc;

use crate::platform::services::analytics::AnalyticsService;
use devpulse_store::AnalyticsAdapter;

/// Channel buffer size for completed spans.
/// Same as lane traces — backpressure drops silently.
pub const SPAN_CHANNEL_CAPACITY: usize = 256;

/// Maximum spans to batch before flushing to `DuckDB`.
const BATCH_SIZE: usize = 64;

/// Maximum time to hold a batch before flushing (milliseconds).
const BATCH_FLUSH_INTERVAL_MS: u64 = 500;

/// Disable the writer after this many consecutive flush failures. A
/// permanently-incompatible analytics table (schema drift) then yields a few
/// loud logs and one final ERROR instead of one WARN per batch forever.
const MAX_CONSECUTIVE_FAILURES: u32 = 3;

/// A completed span record ready for `DuckDB` persistence.
#[derive(Debug, Clone, Serialize)]
pub struct SpanRecord {
    /// Request-level correlation ID (UUID v7).
    pub trace_id: String,
    /// Unique span identifier (from tracing subscriber).
    pub span_id: u64,
    /// Parent span ID (None for root spans).
    pub parent_span_id: Option<u64>,
    /// Span name (function name or manual label).
    pub name: String,
    /// Tracing target (module path or lane identifier).
    pub target: String,
    /// Log level (TRACE, DEBUG, INFO, WARN, ERROR).
    pub level: String,
    /// Wall-clock duration in microseconds.
    pub duration_us: u64,
    /// Span fields serialized as JSON (`trace_id`, `slot_id`, etc.).
    pub fields_json: Option<String>,
}

/// Background task that drains the span channel and bulk-inserts
/// into `DuckDB` at regular intervals.
///
/// Follows the `LaneTraceWriter` pattern exactly:
/// - Batches up to `BATCH_SIZE` spans
/// - Flushes every `BATCH_FLUSH_INTERVAL_MS`
/// - On channel close, flushes remaining buffer
pub struct SpanTraceWriter {
    rx: mpsc::Receiver<SpanRecord>,
    analytics: Arc<AnalyticsService>,
    batch: Vec<SpanRecord>,
    /// Consecutive flush failures. Reset to 0 on any success.
    consecutive_failures: u32,
    /// Set once `MAX_CONSECUTIVE_FAILURES` is hit — subsequent batches are
    /// drained and dropped without touching the DB (no more log spam).
    disabled: bool,
}

impl SpanTraceWriter {
    /// Create a new writer. Call `.run()` in a `tokio::spawn`.
    pub fn new(rx: mpsc::Receiver<SpanRecord>, analytics: Arc<AnalyticsService>) -> Self {
        Self {
            rx,
            analytics,
            batch: Vec::with_capacity(BATCH_SIZE),
            consecutive_failures: 0,
            disabled: false,
        }
    }

    /// Run the writer loop. Blocks until the channel closes.
    pub async fn run(mut self) {
        let flush_interval = tokio::time::Duration::from_millis(BATCH_FLUSH_INTERVAL_MS);

        loop {
            let record = tokio::time::timeout(flush_interval, self.rx.recv()).await;

            match record {
                Ok(Some(span)) => {
                    self.batch.push(span);
                    if self.batch.len() >= BATCH_SIZE {
                        self.flush().await;
                    }
                }
                Ok(None) => {
                    // Channel closed — flush remaining and exit.
                    self.flush().await;
                    tracing::debug!("Span trace writer shutting down");
                    return;
                }
                Err(_) => {
                    // Timeout — flush whatever we have.
                    if !self.batch.is_empty() {
                        self.flush().await;
                    }
                }
            }
        }
    }

    async fn flush(&mut self) {
        if self.batch.is_empty() {
            return;
        }

        // Writer disabled after repeated failures — drain and drop silently so
        // the batch never grows unbounded and the channel keeps draining.
        if self.disabled {
            self.batch.clear();
            return;
        }

        let records: Vec<serde_json::Value> = self
            .batch
            .drain(..)
            .map(|s| {
                json!({
                    "trace_id": s.trace_id,
                    "span_id": s.span_id,
                    "parent_span_id": s.parent_span_id,
                    "name": s.name,
                    "target": s.target,
                    "level": s.level,
                    "duration_us": s.duration_us,
                    "fields_json": s.fields_json,
                })
            })
            .collect();

        let count = records.len();

        match self
            .analytics
            .adapter()
            .append("span_traces", &records)
            .await
        {
            Ok(inserted) => {
                self.consecutive_failures = 0;
                tracing::debug!(count, inserted, "Flushed span traces to DuckDB");
            }
            Err(e) => {
                self.consecutive_failures += 1;
                if self.consecutive_failures >= MAX_CONSECUTIVE_FAILURES {
                    self.disabled = true;
                    tracing::error!(
                        count,
                        failures = self.consecutive_failures,
                        error = %e,
                        "Span trace persistence failed repeatedly — disabling span writer for \
                         this session (likely analytics-schema drift; wipe .userdata to reset)",
                    );
                } else {
                    tracing::warn!(count, error = %e, "Failed to flush span traces to DuckDB");
                }
            }
        }
    }
}
