//! DuckDB tracing Layer — captures completed spans for analytics.
//!
//! This `tracing::Layer` implementation records every closed span
//! and sends it to the `SpanTraceWriter` for batched DuckDB persistence.
//!
//! ## Design
//!
//! - On `on_new_span`: stamps the span with its start time via extensions.
//! - On `on_record`: captures field values (trace_id, slot_id, etc.).
//! - On `on_close`: computes duration, extracts fields, sends `SpanRecord`.
//! - Non-blocking: uses `try_send` — drops spans on backpressure.
//!
//! ## Integration
//!
//! The layer is created with a channel sender. The corresponding
//! `SpanTraceWriter` receiver is spawned separately after DuckDB boots.
//! Between subscriber init and writer spawn, the channel buffers spans
//! (up to `SPAN_CHANNEL_CAPACITY`).

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

use tokio::sync::mpsc;
use tracing::span;
use tracing::Subscriber;
use tracing_subscriber::layer::Context;
use tracing_subscriber::registry::LookupSpan;
use tracing_subscriber::Layer;

use super::span_writer::SpanRecord;

/// Stored in span extensions to track timing.
struct SpanTiming {
    start: Instant,
}

/// Stored in span extensions to collect field values.
struct SpanFields {
    fields: Mutex<HashMap<String, String>>,
}

/// A `tracing::Layer` that sends completed spans to DuckDB via the
/// `SpanTraceWriter` background task.
pub struct DuckDbLayer {
    tx: mpsc::Sender<SpanRecord>,
}

impl DuckDbLayer {
    /// Create a new DuckDB layer with the given channel sender.
    ///
    /// The sender connects to a `SpanTraceWriter` that batches
    /// and flushes to DuckDB. The writer must be spawned separately.
    #[must_use]
    pub fn new(tx: mpsc::Sender<SpanRecord>) -> Self {
        Self { tx }
    }
}

impl<S> Layer<S> for DuckDbLayer
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_new_span(&self, attrs: &span::Attributes<'_>, id: &span::Id, ctx: Context<'_, S>) {
        if let Some(span) = ctx.span(id) {
            // Store start time for duration computation on close.
            span.extensions_mut().insert(SpanTiming {
                start: Instant::now(),
            });

            // Capture initial field values.
            let mut fields = HashMap::new();
            let mut visitor = FieldVisitor(&mut fields);
            attrs.record(&mut visitor);
            span.extensions_mut().insert(SpanFields {
                fields: Mutex::new(fields),
            });
        }
    }

    fn on_record(&self, id: &span::Id, values: &span::Record<'_>, ctx: Context<'_, S>) {
        if let Some(span) = ctx.span(id) {
            if let Some(span_fields) = span.extensions().get::<SpanFields>() {
                if let Ok(mut fields) = span_fields.fields.lock() {
                    let mut visitor = FieldVisitor(&mut fields);
                    values.record(&mut visitor);
                }
            }
        }
    }

    fn on_close(&self, id: span::Id, ctx: Context<'_, S>) {
        let Some(span) = ctx.span(&id) else { return };

        let duration_us = span
            .extensions()
            .get::<SpanTiming>()
            .map(|t| t.start.elapsed().as_micros() as u64)
            .unwrap_or(0);

        // Extract fields — look for trace_id specifically.
        let (trace_id, fields_json) = if let Some(sf) = span.extensions().get::<SpanFields>() {
            if let Ok(fields) = sf.fields.lock() {
                let tid = fields.get("trace_id").cloned().unwrap_or_default();
                let json = if fields.is_empty() {
                    None
                } else {
                    serde_json::to_string(&*fields).ok()
                };
                (tid, json)
            } else {
                (String::new(), None)
            }
        } else {
            (String::new(), None)
        };

        // If no trace_id, check parent spans for it (propagation).
        let trace_id = if trace_id.is_empty() {
            find_parent_trace_id(&span)
        } else {
            trace_id
        };

        let parent_span_id = span.parent().map(|p| p.id().into_u64());

        let metadata = span.metadata();

        let record = SpanRecord {
            trace_id,
            span_id: id.into_u64(),
            parent_span_id,
            name: metadata.name().to_string(),
            target: metadata.target().to_string(),
            level: metadata.level().to_string(),
            duration_us,
            fields_json,
        };

        // Non-blocking — drop span on backpressure (same as lane traces).
        let _ = self.tx.try_send(record);
    }
}

/// Walk up the span tree looking for a trace_id field.
fn find_parent_trace_id<S>(span: &tracing_subscriber::registry::SpanRef<'_, S>) -> String
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    let mut current = span.parent();
    while let Some(parent) = current {
        if let Some(sf) = parent.extensions().get::<SpanFields>() {
            if let Ok(fields) = sf.fields.lock() {
                if let Some(tid) = fields.get("trace_id") {
                    if !tid.is_empty() {
                        return tid.clone();
                    }
                }
            }
        }
        current = parent.parent();
    }
    String::new()
}

/// Simple field visitor that collects values into a HashMap.
struct FieldVisitor<'a>(&'a mut HashMap<String, String>);

impl tracing::field::Visit for FieldVisitor<'_> {
    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        self.0.insert(field.name().to_string(), value.to_string());
    }

    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn std::fmt::Debug) {
        self.0
            .insert(field.name().to_string(), format!("{value:?}"));
    }

    fn record_i64(&mut self, field: &tracing::field::Field, value: i64) {
        self.0.insert(field.name().to_string(), value.to_string());
    }

    fn record_u64(&mut self, field: &tracing::field::Field, value: u64) {
        self.0.insert(field.name().to_string(), value.to_string());
    }

    fn record_f64(&mut self, field: &tracing::field::Field, value: f64) {
        self.0.insert(field.name().to_string(), value.to_string());
    }

    fn record_bool(&mut self, field: &tracing::field::Field, value: bool) {
        self.0.insert(field.name().to_string(), value.to_string());
    }
}
