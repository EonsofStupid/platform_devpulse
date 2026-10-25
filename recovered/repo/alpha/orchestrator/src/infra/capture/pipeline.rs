// orchestrator/src/infra/capture/pipeline.rs

//! Signal capture pipeline for Lab experimentation
//!
//! Captures signals with full payloads for analysis, A/B testing,
//! and adapter comparison.

use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;

use super::experiment::ExperimentRun;
use crate::infra::persistence::analytics::Analytics;

/// Captured signal with full metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedSignal {
    /// Unique capture ID
    pub id: u64,
    /// Signal type (Chat, Inference, Diagnostic, etc.)
    pub signal_type: String,
    /// Full payload as JSON
    pub payload: serde_json::Value,
    /// Adapter that handled this (local, anthropic, openai, etc.)
    pub adapter: Option<String>,
    /// Model used
    pub model: Option<String>,
    /// Experiment tag if part of an A/B test
    pub experiment_tag: Option<String>,
    /// Latency in milliseconds
    pub latency_ms: Option<u64>,
    /// Tokens consumed (input)
    pub tokens_in: Option<u32>,
    /// Tokens generated (output)
    pub tokens_out: Option<u32>,
    /// Quality score (0-1, if evaluated)
    pub quality_score: Option<f32>,
    /// Capture timestamp (epoch ms)
    pub timestamp: u64,
}

/// Filter for querying captured signals
#[derive(Debug, Clone, Default)]
pub struct CaptureFilter {
    /// Filter by signal type
    pub signal_type: Option<String>,
    /// Filter by adapter
    pub adapter: Option<String>,
    /// Filter by experiment tag
    pub experiment_tag: Option<String>,
    /// Filter by time range (start epoch ms)
    pub time_start: Option<u64>,
    /// Filter by time range (end epoch ms)
    pub time_end: Option<u64>,
    /// Maximum results
    pub limit: u32,
}

impl CaptureFilter {
    pub fn new() -> Self {
        Self {
            limit: 100,
            ..Default::default()
        }
    }

    pub fn with_signal_type(mut self, signal_type: &str) -> Self {
        self.signal_type = Some(signal_type.to_string());
        self
    }

    pub fn with_adapter(mut self, adapter: &str) -> Self {
        self.adapter = Some(adapter.to_string());
        self
    }

    pub fn with_experiment(mut self, tag: &str) -> Self {
        self.experiment_tag = Some(tag.to_string());
        self
    }

    pub fn with_limit(mut self, limit: u32) -> Self {
        self.limit = limit;
        self
    }
}

/// Capture pipeline for Lab signal capture and analysis
pub struct CapturePipeline {
    /// Analytics database (DuckDB)
    analytics: Arc<Analytics>,
    /// Broadcast channel for real-time subscribers
    broadcast_tx: broadcast::Sender<CapturedSignal>,
    /// Counter for signal IDs
    counter: std::sync::atomic::AtomicU64,
    /// Current active experiment (if any)
    active_experiment: tokio::sync::RwLock<Option<ExperimentRun>>,
    /// Capture enabled flag
    enabled: std::sync::atomic::AtomicBool,
}

impl CapturePipeline {
    /// Create new capture pipeline
    pub fn new(analytics: Arc<Analytics>) -> Self {
        let (broadcast_tx, _) = broadcast::channel(1000);

        Self {
            analytics,
            broadcast_tx,
            counter: std::sync::atomic::AtomicU64::new(1),
            active_experiment: tokio::sync::RwLock::new(None),
            enabled: std::sync::atomic::AtomicBool::new(true),
        }
    }

    /// Subscribe to real-time capture events
    pub fn subscribe(&self) -> broadcast::Receiver<CapturedSignal> {
        self.broadcast_tx.subscribe()
    }

    /// Enable/disable capture
    pub fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, std::sync::atomic::Ordering::Relaxed);
        tracing::info!(enabled, "Capture pipeline enabled state changed");
    }

    /// Check if capture is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled.load(std::sync::atomic::Ordering::Relaxed)
    }

    /// Capture a signal
    pub async fn capture(&self, signal: CapturedSignal) -> Result<u64> {
        if !self.is_enabled() {
            return Ok(0);
        }

        let id = self.counter.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        let mut signal = signal;
        signal.id = id;
        signal.timestamp = shared::types::header::current_time_millis();

        // Add experiment tag if active
        if signal.experiment_tag.is_none() {
            let exp = self.active_experiment.read().await;
            if let Some(ref run) = *exp {
                signal.experiment_tag = Some(run.tag.clone());
            }
        }

        // Persist to DuckDB
        self.persist_signal(&signal)?;

        // Broadcast to subscribers
        let _ = self.broadcast_tx.send(signal.clone());

        tracing::debug!(id, signal_type = %signal.signal_type, "Captured signal");

        Ok(id)
    }

    /// Capture an inference event (convenience method)
    pub async fn capture_inference(
        &self,
        adapter: &str,
        model: &str,
        prompt: &str,
        response: &str,
        tokens_in: u32,
        tokens_out: u32,
        latency_ms: u64,
    ) -> Result<u64> {
        let signal = CapturedSignal {
            id: 0, // Will be set in capture()
            signal_type: "inference".to_string(),
            payload: serde_json::json!({
                "prompt": prompt,
                "response": response,
            }),
            adapter: Some(adapter.to_string()),
            model: Some(model.to_string()),
            experiment_tag: None,
            latency_ms: Some(latency_ms),
            tokens_in: Some(tokens_in),
            tokens_out: Some(tokens_out),
            quality_score: None,
            timestamp: 0,
        };

        self.capture(signal).await
    }

    /// Start an experiment run
    pub async fn start_experiment(&self, experiment: ExperimentRun) {
        tracing::info!(tag = %experiment.tag, "Starting experiment");
        *self.active_experiment.write().await = Some(experiment);
    }

    /// End current experiment
    pub async fn end_experiment(&self) -> Option<ExperimentRun> {
        let exp = self.active_experiment.write().await.take();
        if let Some(ref e) = exp {
            tracing::info!(tag = %e.tag, "Ended experiment");
        }
        exp
    }

    /// Get current experiment
    pub async fn current_experiment(&self) -> Option<ExperimentRun> {
        self.active_experiment.read().await.clone()
    }

    /// Query captured signals
    pub fn query(&self, filter: &CaptureFilter) -> Result<Vec<CapturedSignal>> {
        let events = self.analytics.get_events(
            filter.limit,
            filter.signal_type.as_deref(),
        )?;

        // Convert stored events to captured signals
        let signals: Vec<CapturedSignal> = events
            .into_iter()
            .filter_map(|e| {
                let payload: serde_json::Value = e.data
                    .and_then(|d| serde_json::from_str(&d).ok())
                    .unwrap_or(serde_json::Value::Null);

                Some(CapturedSignal {
                    id: e.id,
                    signal_type: e.event_type,
                    payload: payload.clone(),
                    adapter: payload.get("adapter").and_then(|v| v.as_str()).map(String::from),
                    model: payload.get("model").and_then(|v| v.as_str()).map(String::from),
                    experiment_tag: payload.get("experiment_tag").and_then(|v| v.as_str()).map(String::from),
                    latency_ms: payload.get("latency_ms").and_then(|v| v.as_u64()),
                    tokens_in: payload.get("tokens_in").and_then(|v| v.as_u64()).map(|v| v as u32),
                    tokens_out: payload.get("tokens_out").and_then(|v| v.as_u64()).map(|v| v as u32),
                    quality_score: payload.get("quality_score").and_then(|v| v.as_f64()).map(|v| v as f32),
                    timestamp: 0, // TODO: Parse timestamp
                })
            })
            .filter(|s| {
                // Apply additional filters
                if let Some(ref adapter) = filter.adapter {
                    if s.adapter.as_ref() != Some(adapter) {
                        return false;
                    }
                }
                if let Some(ref tag) = filter.experiment_tag {
                    if s.experiment_tag.as_ref() != Some(tag) {
                        return false;
                    }
                }
                true
            })
            .collect();

        Ok(signals)
    }

    /// Get capture statistics
    pub fn stats(&self) -> CaptureStats {
        let count = self.analytics.get_event_count().unwrap_or(0);
        let inference_stats = self.analytics.get_inference_stats().unwrap_or_default();

        CaptureStats {
            total_captures: count,
            total_inferences: inference_stats.total_inferences,
            total_tokens_in: inference_stats.total_tokens_in,
            total_tokens_out: inference_stats.total_tokens_out,
            avg_latency_ms: inference_stats.avg_latency_ms,
        }
    }

    fn persist_signal(&self, signal: &CapturedSignal) -> Result<()> {
        // Build full payload with all metadata
        let full_payload = serde_json::json!({
            "payload": signal.payload,
            "adapter": signal.adapter,
            "model": signal.model,
            "experiment_tag": signal.experiment_tag,
            "latency_ms": signal.latency_ms,
            "tokens_in": signal.tokens_in,
            "tokens_out": signal.tokens_out,
            "quality_score": signal.quality_score,
        });

        self.analytics.record_event(&signal.signal_type, &full_payload)?;

        // Also record inference metrics if applicable
        if signal.signal_type == "inference" {
            if let (Some(tokens_in), Some(tokens_out), Some(latency)) =
                (signal.tokens_in, signal.tokens_out, signal.latency_ms)
            {
                let model = signal.model.as_deref().unwrap_or("unknown");
                self.analytics.record_inference(
                    model,
                    tokens_in,
                    tokens_out,
                    latency as u32,
                )?;
            }
        }

        Ok(())
    }
}

/// Capture statistics
#[derive(Debug, Clone, Serialize)]
pub struct CaptureStats {
    pub total_captures: u64,
    pub total_inferences: u64,
    pub total_tokens_in: u64,
    pub total_tokens_out: u64,
    pub avg_latency_ms: f32,
}
