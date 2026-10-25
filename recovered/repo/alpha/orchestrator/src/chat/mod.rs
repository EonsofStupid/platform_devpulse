// orchestrator/src/chat/mod.rs

//! Chat - Entry point for user interaction
//!
//! Wires the full pipeline:
//! - CAG: embed -> search -> rerank
//! - Llm: 4B VL model for response generation
//! - Telemetry: All messages logged to libSQL + DuckDB
//!
//! This is the main chat interface for Lab and Desktop.

use anyhow::Result;
use shared::types::ids::SessionId;
use shared::types::signal::SignalKind;
use crate::types::Toon;
use std::sync::Arc;

use crate::cortex::{AssemblyConfig, CAG};
use crate::infra::llm::{LlmBackend, Role as LlmRole};
use crate::infra::persistence::analytics::Analytics;
use crate::infra::embedding::embedder::EmbedderBackend;
#[cfg(feature = "db")]
use crate::infra::persistence::sql::Database;
use crate::infra::catalog::models::ModelPaths;
use crate::infra::persistence::vector::VectorStore;
use crate::infra::embedding::reranker::RerankerBackend;
use crate::infra::core::config::GrammarConfig;

/// Chat engine - the main interface for user interaction
pub struct ChatEngine {
    session_id: SessionId,
    cag: Option<CAG>,
    llm: Option<Arc<LlmBackend>>,
    /// Database handle for message persistence
    #[cfg(feature = "db")]
    db: Arc<Database>,
    /// Analytics for telemetry
    analytics: Arc<Analytics>,
}

/// A chat message
#[derive(Debug, Clone)]
pub struct Message {
    pub role: Role,
    pub content: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Role {
    User,
    Assistant,
    System,
}

/// Chat response from the engine
#[derive(Debug, Clone)]
pub struct ChatResponse {
    pub message: String,
    pub tokens_used: u32,
    pub hops_executed: u8,
}

impl ChatEngine {
    /// Create a new chat engine with infrastructure
    ///
    /// Loads embedder + reranker + rro for CAG, and llm for inference.
    /// If models are missing, will fall back to stub mode.
    pub async fn new() -> Result<Self> {
        let session_id = SessionId::new();

        tracing::info!("ChatEngine initializing with session: {}", session_id);

        // Get database and analytics handles
        #[cfg(feature = "db")]
        let db = Arc::new(Database::open(&shared::config::paths::get_paths().global_db).await?);
        let analytics = Arc::new(Analytics::open()?);

        // Log session start
        analytics.record_event("chat.session.start", &serde_json::json!({
            "session_id": session_id.as_str(),
        }))?;

        // Try to load models and create CAG
        let cag = Self::try_init_cag().await;

        if cag.is_some() {
            tracing::info!("CAG initialized - retrieval pipeline ready");
        } else {
            tracing::warn!("CAG not initialized - running in stub mode");
        }

        // Try to load llm model
        let llm = Self::try_init_llm();

        if llm.is_some() {
            tracing::info!("Llm initialized - LLM inference ready");
        } else {
            tracing::warn!("Llm not initialized - will return context only");
        }

        Ok(Self {
            session_id,
            cag,
            llm,
            #[cfg(feature = "db")]
            db,
            analytics,
        })
    }

    /// Try to initialize the llm model
    fn try_init_llm() -> Option<Arc<LlmBackend>> {
        let paths = ModelPaths::default_dp_alpha();

        // Check if llm model exists
        if !paths.llm_gguf.exists() {
            tracing::warn!("Llm model not found at {:?}", paths.llm_gguf);
            return None;
        }

        tracing::info!("Loading llm model from {:?}...", paths.llm_gguf);
        match LlmBackend::load(&paths.llm_gguf, GrammarConfig::default(), None) {
            Ok(llm) => {
                tracing::info!("Llm model loaded successfully");
                Some(Arc::new(llm))
            }
            Err(e) => {
                tracing::error!("Failed to load llm model: {}", e);
                None
            }
        }
    }

    /// Try to initialize CAG with all backends
    async fn try_init_cag() -> Option<CAG> {
        let paths = ModelPaths::default_dp_alpha();

        // Verify model paths exist
        if paths.verify_embedder().is_err() {
            tracing::warn!("Embedder files missing");
            return None;
        }
        if paths.verify_reranker().is_err() {
            tracing::warn!("Reranker files missing");
            return None;
        }

        // Load embedder (CPU)
        tracing::info!("Loading embedder...");
        let embedder = match EmbedderBackend::load(&paths.embedder_dir) {
            Ok(e) => {
                tracing::info!("Embedder loaded (dim: {})", e.dimension());
                Arc::new(e)
            }
            Err(e) => {
                tracing::error!("Failed to load embedder: {}", e);
                return None;
            }
        };

        // Load reranker (CPU for now, GPU when CUDA 13.1 supported)
        tracing::info!("Loading reranker...");
        let reranker = match RerankerBackend::load(&paths.reranker_dir) {
            Ok(r) => {
                tracing::info!("Reranker loaded");
                Arc::new(r)
            }
            Err(e) => {
                tracing::error!("Failed to load reranker: {}", e);
                return None;
            }
        };

        // Initialize RRO
        tracing::info!("Initializing RRO...");
        let rro = match VectorStore::init() {
            Ok(q) => {
                tracing::info!("RRO ready");
                Arc::new(q)
            }
            Err(e) => {
                tracing::error!("Failed to init RRO: {}", e);
                return None;
            }
        };

        // Create CAG
        Some(CAG::new(embedder, rro, reranker))
    }

    /// Get the current session ID
    pub fn session_id(&self) -> &SessionId {
        &self.session_id
    }

    /// Send a message and get a response with default system prompt
    pub async fn send(&self, message: &str) -> Result<ChatResponse> {
        self.send_with_prompt(message, None).await
    }

    /// Send a message with a custom system prompt
    pub async fn send_with_prompt(&self, message: &str, system_prompt: Option<&str>) -> Result<ChatResponse> {
        let start_time = std::time::Instant::now();
        tracing::info!("Processing message: {} chars", message.len());

        // Record user message to libSQL
        #[cfg(feature = "db")]
        {
            self.db.record_message(
                &self.session_id,
                "user",
                message,
                None,
            ).await?;
        }

        // Log to DuckDB analytics
        self.analytics.record_event("chat.send", &serde_json::json!({
            "session_id": self.session_id.as_str(),
            "message_length": message.len(),
        }))?;

        // 1. Create signal from user input
        let signal = SignalKind::chat(message.to_string());

        // 2. Wrap in Toon (wire envelope)
        let toon = Toon::new(signal).with_session(self.session_id.clone());

        // 3. Route through cortex with system prompt
        let response = self.process_toon(toon, system_prompt).await?;

        // Record assistant response to libSQL
        #[cfg(feature = "db")]
        {
            self.db.record_message(
                &self.session_id,
                "assistant",
                &response.message,
                Some(&serde_json::json!({
                    "tokens_used": response.tokens_used,
                    "hops_executed": response.hops_executed,
                }).to_string()),
            ).await?;
        }

        // Log response metrics to DuckDB
        let latency_ms = start_time.elapsed().as_millis() as u32;
        self.analytics.record_event("chat.receive", &serde_json::json!({
            "session_id": self.session_id.as_str(),
            "response_length": response.message.len(),
            "tokens_used": response.tokens_used,
            "latency_ms": latency_ms,
        }))?;

        // Record inference metrics if we used tokens
        if response.tokens_used > 0 {
            self.analytics.record_inference(
                "local-llm",
                0, // tokens_in (prompt) - TODO: track separately
                response.tokens_used,
                latency_ms,
            )?;
        }

        Ok(response)
    }

    /// Process a toon through the system
    async fn process_toon(&self, toon: Toon, custom_system_prompt: Option<&str>) -> Result<ChatResponse> {
        let signal = toon.signal;
        let user_text = match signal {
            SignalKind::UserMessage { text } => text,
            _ => "[non-chat signal]".to_string(),
        };

        // Build context from CAG if available
        let context_text = if let Some(ref cag) = self.cag {
            let config = AssemblyConfig::default();
            let context = cag.assemble(&user_text, &config).await?;

            if !context.chunks.is_empty() {
                // Format context for llm
                let chunks_str: String = context.chunks.iter()
                    .map(|c| format!("```\n{}\n```\nSource: {}", c.content, c.source))
                    .collect::<Vec<_>>()
                    .join("\n\n");

                Some(format!(
                    "Here is relevant context from the codebase:\n\n{}\n\n---\n\nBased on the context above, ",
                    chunks_str
                ))
            } else {
                None
            }
        } else {
            None
        };

        // Generate response with llm if available
        if let Some(ref llm) = self.llm {
            // Use custom persona instructions or default
            let default_prompt = "You are Maestro, an AI assistant specialized in software development. \
                You help users understand their codebase and answer programming questions. \
                Be concise and technical.";
            let system_prompt = custom_system_prompt.unwrap_or(default_prompt);

            // Build the user message with context
            let full_user_message = if let Some(ctx) = context_text {
                format!("{}answer the following question:\n\n{}", ctx, user_text)
            } else {
                user_text.clone()
            };

            // Generate response
            tracing::info!("Generating response with llm...");
            let result = llm.chat(
                &[
                    (LlmRole::System, system_prompt.to_string()),
                    (LlmRole::User, full_user_message),
                ],
                1024,
            )?;

            tracing::info!(
                "Generated {} tokens (prompt: {} tokens)",
                result.tokens_generated,
                result.prompt_tokens
            );

            Ok(ChatResponse {
                message: result.text,
                tokens_used: result.prompt_tokens + result.tokens_generated,
                hops_executed: 1,
            })
        } else if let Some(ref cag) = self.cag {
            // No llm, but have CAG - return context only
            let config = AssemblyConfig::default();
            let context = cag.assemble(&user_text, &config).await?;

            let response_text = if context.chunks.is_empty() {
                format!(
                    "Query: {}\n\nNo relevant context found.\n\n[Llm not loaded - context only mode]",
                    user_text
                )
            } else {
                let chunks_str: String = context.chunks.iter().enumerate()
                    .map(|(i, c)| format!(
                        "--- Chunk {} (rel: {:.2}, src: {}) ---\n{}",
                        i + 1,
                        c.relevance_score,
                        c.source,
                        truncate(&c.content, 300)
                    ))
                    .collect::<Vec<_>>()
                    .join("\n\n");

                format!(
                    "Query: {}\n\n[Llm not loaded - showing raw context]\n\n{}",
                    user_text,
                    chunks_str
                )
            };

            Ok(ChatResponse {
                message: response_text,
                tokens_used: 0,
                hops_executed: 1,
            })
        } else {
            // No llm, no CAG - stub mode
            Ok(ChatResponse {
                message: format!(
                    "Query: {}\n\n[STUB MODE] No models loaded.\n\
                     Load the 4B VL model and restart.",
                    user_text
                ),
                tokens_used: 0,
                hops_executed: 0,
            })
        }
    }

    /// Get conversation history (from libSQL)
    pub async fn history(&self) -> Result<Vec<Message>> {
        #[cfg(feature = "db")]
        {
            let db_messages = self.db.get_messages(&self.session_id, 100).await?;
            Ok(db_messages.into_iter().map(|m| {
                let role = match m.role.as_str() {
                    "user" => Role::User,
                    "assistant" => Role::Assistant,
                    "system" => Role::System,
                    _ => Role::User,
                };
                Message {
                    role,
                    content: m.content,
                }
            }).collect())
        }
        #[cfg(not(feature = "db"))]
        {
            tracing::warn!("history() called but db feature not enabled");
            Ok(vec![])
        }
    }

    /// Clear conversation history
    pub async fn clear(&self) -> Result<()> {
        #[cfg(feature = "db")]
        {
            self.db.delete_session(&self.session_id.as_str()).await?;
            self.analytics.record_event("chat.session.clear", &serde_json::json!({
                "session_id": self.session_id.as_str(),
            }))?;
        }
        Ok(())
    }

    /// Verify all model files are present
    pub fn verify_models(&self) -> ModelVerification {
        let paths = ModelPaths::default_dp_alpha();

        ModelVerification {
            embedder_files: paths.verify_embedder().is_ok(),
            reranker_files: paths.verify_reranker().is_ok(),
            llm_file: paths.llm_gguf.exists(),
            cag_ready: self.cag.is_some(),
            llm_ready: self.llm.is_some(),
        }
    }
}

/// Truncate string with ellipsis
fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len])
    }
}

/// Verification results for all model files
#[derive(Debug)]
pub struct ModelVerification {
    pub embedder_files: bool,
    pub reranker_files: bool,
    pub llm_file: bool,
    pub cag_ready: bool,
    pub llm_ready: bool,
}

impl std::fmt::Display for ModelVerification {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "Model Verification:")?;
        writeln!(f, "  Embedder: {}", if self.embedder_files { "OK" } else { "MISSING" })?;
        writeln!(f, "  Reranker: {}", if self.reranker_files { "OK" } else { "MISSING" })?;
        writeln!(f, "  Llm (4B VL): {}", if self.llm_file { "OK" } else { "MISSING" })?;
        writeln!(f, "  CAG Pipeline: {}", if self.cag_ready { "READY" } else { "NOT READY" })?;
        writeln!(f, "  Llm Pipeline: {}", if self.llm_ready { "READY" } else { "NOT READY" })?;
        Ok(())
    }
}
