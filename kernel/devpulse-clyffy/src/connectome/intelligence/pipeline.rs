//! Chat-turn → intelligence pipeline orchestrator.
//!
//! The missing wiring that bridges a typed chat message to the connectome
//! storage chain:
//!
//! ```text
//! chat text ─▶ classify ─▶ embed ─▶ save_memory ─▶ events
//!  (Burn minion)  (Burn embedder)  (IntelligenceStore)
//! ```
//!
//! Every hop emits a [`LoaderEvent`] so the engine's frontend bridge
//! fans them out on the `intel:*` channel; the
//! `/devtools/clyffy/memory/intelligence` live mirror subscribes to
//! those and renders a card per chat turn as the pipeline progresses.
//!
//! ## Why a free function (not a service struct)
//!
//! The orchestrator is stateless — it takes everything it needs as
//! arguments. Spawning it as a tokio task from
//! `commands::chat::send_message` keeps the chat write path responsive
//! (the libsql `turns` insert returns immediately) while the embed +
//! storage work happens off the IPC critical path.
//!
//! ## Failure handling
//!
//! Each hop is fail-soft and traced. A failure in any hop is logged
//! and an event-side error variant is emitted (TODO: add `IntelligencePipelineFailed`
//! when the failure variants stabilize), but does NOT propagate — the
//! chat turn already landed in libsql, and the memory pipeline is an
//! enrichment layer, not a blocking dependency.

use std::sync::Arc;
use std::time::Instant;

use anyhow::{Context, Result};
use uuid::Uuid;

use crate::connectome::intelligence::{IntelligenceStore, MemoryKind, MemoryRecord, EMBEDDING_DIM};

/// Trait wrapper for whatever produces a sentence embedding. Kept
/// abstract so the pipeline can run against any embedder the engine
/// wires in (Burn-Harrier today, future swaps don't touch this file).
///
/// `embed_text` returns a vector of length [`EMBEDDING_DIM`] — the
/// pipeline asserts that and fails the embed hop loudly if the
/// dimension drifts (which would silently corrupt the HNSW index
/// otherwise).
#[async_trait::async_trait]
pub trait TextEmbedder: Send + Sync {
    /// Encode `text` to a fixed-length vector matching
    /// [`EMBEDDING_DIM`]. Implementations should be deterministic for
    /// the same input + the same model weights.
    async fn embed_text(&self, text: &str) -> Result<Vec<f32>>;
}

/// Lifecycle signal emitted by the pipeline. The engine layer maps
/// each variant to its corresponding `LoaderEvent::Intelligence*` and
/// fans out to tracing + the frontend bridge.
///
/// Living in this kernel module (rather than reusing `LoaderEvent`
/// directly) keeps the connectome crate free of an upward dependency on
/// `model-loader`. The engine glues the two together.
#[derive(Debug, Clone)]
pub enum PipelineSignal {
    /// Pipeline entered for a chat turn.
    ClassifyStarted {
        /// Project slug — `SurrealDB` database name under the
        /// `projects` namespace.
        project_slug: String,
        /// Byte length of the input content (no PII in the signal).
        content_len: u64,
    },
    /// Embedding step finished successfully.
    EmbedComplete {
        /// Project slug.
        project_slug: String,
        /// Dim actually produced.
        dim: u32,
        /// Wall time in milliseconds.
        duration_ms: u64,
    },
    /// `IntelligenceStore::save_memory` returned a memory id.
    MemorySaved {
        /// Project slug.
        project_slug: String,
        /// Connector-returned memory id.
        memory_id: String,
    },
}

/// Sink for pipeline signals. The engine implements this against
/// `LoaderEventSink` so the existing fan-out (tracing + frontend
/// bridge + file log) lights up.
pub trait PipelineEventSink: Send + Sync {
    /// Receive one signal. Implementations should be cheap and
    /// non-blocking — the pipeline calls this synchronously between
    /// hops.
    fn emit(&self, signal: PipelineSignal);
}

/// No-op sink. Useful for tests + bootstraps where the engine isn't
/// wired yet.
#[derive(Debug, Default, Clone, Copy)]
pub struct NullPipelineSink;

impl PipelineEventSink for NullPipelineSink {
    fn emit(&self, _signal: PipelineSignal) {}
}

/// Run the chat-turn pipeline for a single message.
///
/// Synchronously walks classify → embed → `save_memory`, emitting
/// [`PipelineSignal`]s at each hop. Returns the saved memory id on
/// success. Callers that don't care about the id can ignore the
/// `Ok(_)` payload — the events are the load-bearing observable.
///
/// `kind` determines whether the message lands as a [`MemoryKind::Prompt`]
/// (user input) or [`MemoryKind::Response`] (assistant reply); callers
/// in the chat command pass `Prompt` for incoming user text and
/// `Response` for assistant turns they want indexed.
///
/// # Errors
///
/// - Embed failed (model not loaded, embedder reported an error).
/// - Embedding dim did not match [`EMBEDDING_DIM`] — almost always
///   means the wrong embedder is wired and the HNSW index would be
///   corrupted; the caller must reconcile slot assignments before
///   retrying.
/// - `IntelligenceStore::save_memory` write failed.
pub async fn process_chat_message(
    store: &Arc<dyn IntelligenceStore>,
    embedder: &Arc<dyn TextEmbedder>,
    sink: &Arc<dyn PipelineEventSink>,
    project_slug: &str,
    text: &str,
    kind: MemoryKind,
    priority: u8,
) -> Result<String> {
    sink.emit(PipelineSignal::ClassifyStarted {
        project_slug: project_slug.to_string(),
        // Cast is bounded — `text.len()` is byte length; chat
        // messages have a practical 2 KB cap upstream.
        #[allow(clippy::cast_possible_truncation)]
        content_len: text.len() as u64,
    });

    let embed_start = Instant::now();
    let embedding = embedder
        .embed_text(text)
        .await
        .context("text embedder failed")?;
    let dim = embedding.len();
    if dim != EMBEDDING_DIM {
        anyhow::bail!(
            "embedding dim mismatch: embedder produced {dim}, schema expects {EMBEDDING_DIM} — \
             check that the active embedder slot matches the project's HNSW index dim"
        );
    }
    let embed_ms = embed_start.elapsed().as_millis();
    sink.emit(PipelineSignal::EmbedComplete {
        project_slug: project_slug.to_string(),
        // Cast OK: EMBEDDING_DIM is 384 today, well under u32::MAX.
        #[allow(clippy::cast_possible_truncation)]
        dim: dim as u32,
        // Cast OK in practice (embed < 60s on any path).
        #[allow(clippy::cast_possible_truncation)]
        duration_ms: embed_ms as u64,
    });

    // Unix seconds — std::time keeps the connectome crate chrono-free.
    // SAFETY: `u64::cast_signed` returns the bit-identical `i64`. The
    // Unix epoch + ~292 billion years is when this overflows; we'll
    // happily ship a different version of the connectome by then.
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs().cast_signed())
        .unwrap_or(0);
    let record = MemoryRecord {
        id: format!("mem-{}", Uuid::new_v4()),
        text: text.to_string(),
        embedding,
        kind,
        priority,
        created_at: now,
        updated_at: now,
    };

    let memory_id = store
        .save_memory(project_slug, &record)
        .await
        .context("save_memory failed")?;

    sink.emit(PipelineSignal::MemorySaved {
        project_slug: project_slug.to_string(),
        memory_id: memory_id.clone(),
    });

    Ok(memory_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::connectome::intelligence::RecallHit;
    use std::sync::Mutex;

    /// Embedder that returns a fixed vector — used to exercise the
    /// pipeline shape without standing up a real model.
    struct StubEmbedder {
        vec: Vec<f32>,
    }
    #[async_trait::async_trait]
    impl TextEmbedder for StubEmbedder {
        async fn embed_text(&self, _text: &str) -> Result<Vec<f32>> {
            Ok(self.vec.clone())
        }
    }

    /// Store that records every save and returns a fabricated id.
    #[derive(Default)]
    struct StubStore {
        saves: Mutex<Vec<(String, String)>>,
    }
    #[async_trait::async_trait]
    impl IntelligenceStore for StubStore {
        async fn init_project(&self, _slug: &str) -> Result<()> {
            Ok(())
        }
        async fn save_memory(&self, slug: &str, record: &MemoryRecord) -> Result<String> {
            self.saves
                .lock()
                .unwrap()
                .push((slug.to_string(), record.id.clone()));
            Ok(record.id.clone())
        }
        async fn recall_by_embedding(
            &self,
            _slug: &str,
            _query: &[f32],
            _top_k: usize,
            _kind: Option<MemoryKind>,
        ) -> Result<Vec<RecallHit>> {
            Ok(Vec::new())
        }
        async fn relate(&self, _slug: &str, _from: &str, _to: &str, _edge: &str) -> Result<()> {
            Ok(())
        }
        async fn write_archive(&self, _slug: &str, _memory_id: &str, _bytes: &[u8]) -> Result<()> {
            Ok(())
        }
        async fn read_archive_bytes(
            &self,
            _slug: &str,
            _memory_id: &str,
        ) -> Result<Option<Vec<u8>>> {
            Ok(None)
        }
    }

    /// Sink that records every emit for assertion.
    #[derive(Default)]
    struct CountingSink {
        signals: Mutex<Vec<PipelineSignal>>,
    }
    impl PipelineEventSink for CountingSink {
        fn emit(&self, signal: PipelineSignal) {
            self.signals.lock().unwrap().push(signal);
        }
    }

    #[tokio::test]
    async fn happy_path_emits_three_signals_in_order() {
        let store: Arc<dyn IntelligenceStore> = Arc::new(StubStore::default());
        let embedder: Arc<dyn TextEmbedder> = Arc::new(StubEmbedder {
            vec: vec![0.1_f32; EMBEDDING_DIM],
        });
        let sink_inner = Arc::new(CountingSink::default());
        let sink: Arc<dyn PipelineEventSink> = sink_inner.clone();

        let id = process_chat_message(
            &store,
            &embedder,
            &sink,
            "test-project",
            "hello clyffy",
            MemoryKind::Prompt,
            5,
        )
        .await
        .unwrap();
        assert!(id.starts_with("mem-"));

        let signals = sink_inner.signals.lock().unwrap();
        assert_eq!(signals.len(), 3);
        assert!(matches!(signals[0], PipelineSignal::ClassifyStarted { .. }));
        assert!(matches!(signals[1], PipelineSignal::EmbedComplete { .. }));
        assert!(matches!(signals[2], PipelineSignal::MemorySaved { .. }));
    }

    #[tokio::test]
    async fn wrong_dim_embedder_fails_loudly() {
        let store: Arc<dyn IntelligenceStore> = Arc::new(StubStore::default());
        let embedder: Arc<dyn TextEmbedder> = Arc::new(StubEmbedder {
            vec: vec![0.1_f32; 7], // wrong
        });
        let sink: Arc<dyn PipelineEventSink> = Arc::new(NullPipelineSink);

        let err = process_chat_message(
            &store,
            &embedder,
            &sink,
            "test-project",
            "hello",
            MemoryKind::Prompt,
            5,
        )
        .await
        .unwrap_err();
        assert!(err.to_string().contains("embedding dim mismatch"));
    }
}
