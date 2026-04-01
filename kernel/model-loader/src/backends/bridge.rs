//! Flume sync-to-async bridge for inference.
//!
//! Spawns a dedicated OS thread that owns the `InferenceBackend`. All
//! requests are sent via `flume` channels, making the sync inference
//! engine available to async callers (Tauri, tokio tasks).

use crate::loading::states::{LoadParams, MemoryFootprint};
use crate::traits::backend::InferenceBackend;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Request sent to the inference thread via flume channel.
pub enum InferenceRequest {
    /// Load a model from disk into the backend.
    Load {
        /// Path to the model file (GGUF or SafeTensors).
        path: PathBuf,
        /// Loading parameters (device, context length, GPU layers).
        params: LoadParams,
        /// Reply channel for the memory footprint result.
        reply: flume::Sender<anyhow::Result<MemoryFootprint>>,
    },
    /// Unload the current model and free memory.
    Unload {
        /// Reply channel for the unload result.
        reply: flume::Sender<anyhow::Result<()>>,
    },
    /// Run a forward pass on the loaded model.
    Forward {
        /// Input token IDs.
        tokens: Vec<u32>,
        /// Position offset in the context window.
        position: usize,
        /// Reply channel for the logits vector.
        reply: flume::Sender<anyhow::Result<Vec<f32>>>,
    },
    /// Tokenize a text string into token IDs.
    Tokenize {
        /// Input text to tokenize.
        text: String,
        /// Reply channel for the token ID vector.
        reply: flume::Sender<anyhow::Result<Vec<u32>>>,
    },
    /// Detokenize token IDs back into text.
    Detokenize {
        /// Token IDs to decode.
        tokens: Vec<u32>,
        /// Reply channel for the decoded text.
        reply: flume::Sender<anyhow::Result<String>>,
    },
    /// Generate text with streaming token output.
    Generate {
        /// Input prompt text.
        prompt: String,
        /// Maximum tokens to generate.
        max_tokens: u32,
        /// Sampling temperature (0.0 = greedy, 1.0 = creative).
        temperature: f32,
        /// Channel for streaming token responses.
        token_sink: flume::Sender<InferenceResponse>,
    },
    /// Query current memory usage of the loaded model.
    MemoryUsage {
        /// Reply channel for the memory footprint.
        reply: flume::Sender<MemoryFootprint>,
    },
    /// Shutdown the inference thread gracefully.
    Shutdown,
}

/// Streaming response from the inference thread.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InferenceResponse {
    /// A generated token (streamed one at a time).
    Token {
        /// Token ID in the vocabulary.
        id: u32,
        /// Decoded text for this token.
        text: String,
    },
    /// Generation complete — full concatenated text.
    Done(String),
    /// Error during generation.
    Error(String),
}

/// Handle to an inference bridge. Clone + Send — hand out to multiple callers.
#[derive(Clone)]
pub struct InferenceHandle {
    sender: flume::Sender<InferenceRequest>,
}

impl InferenceHandle {
    /// Load a model. Blocks the calling async task until the inference thread responds.
    pub async fn load(&self, path: PathBuf, params: LoadParams) -> anyhow::Result<MemoryFootprint> {
        let (reply_tx, reply_rx) = flume::bounded(1);
        self.sender
            .send_async(InferenceRequest::Load {
                path,
                params,
                reply: reply_tx,
            })
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread disconnected"))?;
        reply_rx
            .recv_async()
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread did not respond"))?
    }

    /// Unload the current model.
    pub async fn unload(&self) -> anyhow::Result<()> {
        let (reply_tx, reply_rx) = flume::bounded(1);
        self.sender
            .send_async(InferenceRequest::Unload { reply: reply_tx })
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread disconnected"))?;
        reply_rx
            .recv_async()
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread did not respond"))?
    }

    /// Run a forward pass.
    pub async fn forward(&self, tokens: Vec<u32>, position: usize) -> anyhow::Result<Vec<f32>> {
        let (reply_tx, reply_rx) = flume::bounded(1);
        self.sender
            .send_async(InferenceRequest::Forward {
                tokens,
                position,
                reply: reply_tx,
            })
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread disconnected"))?;
        reply_rx
            .recv_async()
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread did not respond"))?
    }

    /// Tokenize text.
    pub async fn tokenize(&self, text: String) -> anyhow::Result<Vec<u32>> {
        let (reply_tx, reply_rx) = flume::bounded(1);
        self.sender
            .send_async(InferenceRequest::Tokenize {
                text,
                reply: reply_tx,
            })
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread disconnected"))?;
        reply_rx
            .recv_async()
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread did not respond"))?
    }

    /// Generate text with streaming token callback.
    pub async fn generate(
        &self,
        prompt: String,
        max_tokens: u32,
        temperature: f32,
    ) -> anyhow::Result<flume::Receiver<InferenceResponse>> {
        let (token_tx, token_rx) = flume::unbounded();
        self.sender
            .send_async(InferenceRequest::Generate {
                prompt,
                max_tokens,
                temperature,
                token_sink: token_tx,
            })
            .await
            .map_err(|_| anyhow::anyhow!("Inference thread disconnected"))?;
        Ok(token_rx)
    }

    /// Get current memory usage.
    pub async fn memory_usage(&self) -> MemoryFootprint {
        let (reply_tx, reply_rx) = flume::bounded(1);
        let _ = self
            .sender
            .send_async(InferenceRequest::MemoryUsage { reply: reply_tx })
            .await;
        reply_rx.recv_async().await.unwrap_or_default()
    }

    /// Shutdown the inference thread.
    pub async fn shutdown(&self) {
        let _ = self.sender.send_async(InferenceRequest::Shutdown).await;
    }
}

/// The inference bridge — owns the thread and provides handles.
pub struct InferenceBridge {
    handle: InferenceHandle,
    thread: Option<std::thread::JoinHandle<()>>,
}

impl InferenceBridge {
    /// Spawn a new inference bridge with a backend.
    ///
    /// The backend runs on a dedicated OS thread. All interaction is via
    /// the returned `InferenceHandle`.
    /// Spawn a new candle inference bridge.
    ///
    /// # Errors
    /// Returns error if the OS thread cannot be spawned.
    #[cfg(feature = "candle-backend")]
    pub fn spawn_candle(device: candle_core::Device) -> anyhow::Result<Self> {
        use crate::backends::candle::CandleBackend;

        let (tx, rx) = flume::unbounded::<InferenceRequest>();
        let mut backend = CandleBackend::new(device);

        let thread = std::thread::Builder::new()
            .name("inference-worker".into())
            .spawn(move || {
                inference_thread_loop(&mut backend, rx);
            })
            .map_err(|e| anyhow::anyhow!("Failed to spawn inference thread: {e}"))?;

        Ok(Self {
            handle: InferenceHandle { sender: tx },
            thread: Some(thread),
        })
    }

    /// Get a cloneable handle to this bridge.
    #[must_use]
    pub fn handle(&self) -> InferenceHandle {
        self.handle.clone()
    }
}

impl Drop for InferenceBridge {
    fn drop(&mut self) {
        let _ = self.handle.sender.send(InferenceRequest::Shutdown);
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

/// The main loop running on the inference thread.
#[cfg(feature = "candle-backend")]
fn inference_thread_loop(
    backend: &mut crate::backends::candle::CandleBackend,
    rx: flume::Receiver<InferenceRequest>,
) {
    tracing::info!("Inference worker thread started");

    while let Ok(request) = rx.recv() {
        match request {
            InferenceRequest::Load {
                path,
                params,
                reply,
            } => {
                let result = backend.load(&path, params);
                if result.is_err() {
                    // Partial-load cleanup: if load failed mid-way, ensure
                    // any partially-allocated weights are freed.
                    let _ = backend.unload();
                }
                let _ = reply.send(result);
            }
            InferenceRequest::Unload { reply } => {
                let result = backend.unload();
                let _ = reply.send(result);
            }
            InferenceRequest::Forward {
                tokens,
                position,
                reply,
            } => {
                let result = backend.forward(&tokens, position);
                let _ = reply.send(result);
            }
            InferenceRequest::Tokenize { text, reply } => {
                let result = backend.tokenize(&text);
                let _ = reply.send(result);
            }
            InferenceRequest::Detokenize { tokens, reply } => {
                let result = backend.detokenize(&tokens);
                let _ = reply.send(result);
            }
            InferenceRequest::Generate {
                prompt,
                max_tokens,
                temperature,
                token_sink,
            } => {
                let result = backend.generate(&prompt, max_tokens, temperature, |id, text| {
                    let _ = token_sink.send(InferenceResponse::Token {
                        id,
                        text: text.to_string(),
                    });
                });
                match result {
                    Ok(full_text) => {
                        let _ = token_sink.send(InferenceResponse::Done(full_text));
                    }
                    Err(e) => {
                        let _ = token_sink.send(InferenceResponse::Error(e.to_string()));
                    }
                }
            }
            InferenceRequest::MemoryUsage { reply } => {
                let _ = reply.send(backend.memory_usage());
            }
            InferenceRequest::Shutdown => {
                tracing::info!("Inference worker thread shutting down");
                let _ = backend.unload();
                break;
            }
        }
    }

    tracing::info!("Inference worker thread exited");
}
