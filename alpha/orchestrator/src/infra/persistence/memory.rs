// orchestrator/src/infra/persistence/memory.rs

//! Tiered in-memory cache using moka
//!
//! Two tiers with different TTLs:
//! - **Reflex** (30s): Ultra-hot data for immediate access (current turn, active tools)
//! - **Context** (5min): Working memory for recent context (CAG results, conversation)
//!
//! Both tiers are ephemeral - data evicts on TTL or memory pressure.
//! For persistence, data must flow to libSQL or fjall.

use moka::future::Cache;
use serde::{de::DeserializeOwned, Serialize};
use std::time::Duration;

// Tier TTLs
const REFLEX_TTL_SECS: u64 = 30;      // 30 seconds - immediate hot data
const CONTEXT_TTL_SECS: u64 = 300;    // 5 minutes - working memory

// Capacity limits
const REFLEX_MAX_CAPACITY: u64 = 1_000;   // Small, fast
const CONTEXT_MAX_CAPACITY: u64 = 10_000; // Larger working set

/// Tiered cache system with Reflex (30s) and Context (5min) layers
#[derive(Clone)]
pub struct HotCache {
    /// Reflex tier: 30s TTL, ultra-hot data
    reflex: Cache<String, Vec<u8>>,
    /// Context tier: 5min TTL, working memory
    context: Cache<String, Vec<u8>>,
}

impl HotCache {
    pub fn new() -> Self {
        let reflex = Cache::builder()
            .max_capacity(REFLEX_MAX_CAPACITY)
            .time_to_live(Duration::from_secs(REFLEX_TTL_SECS))
            .build();

        let context = Cache::builder()
            .max_capacity(CONTEXT_MAX_CAPACITY)
            .time_to_live(Duration::from_secs(CONTEXT_TTL_SECS))
            .build();

        Self { reflex, context }
    }

    // ============== Reflex Tier (30s) ==============

    /// Get from reflex tier (30s TTL)
    pub async fn get_reflex(&self, key: &str) -> Option<Vec<u8>> {
        self.reflex.get(key).await
    }

    /// Get typed value from reflex tier
    pub async fn get_reflex_typed<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        let bytes = self.reflex.get(key).await?;
        serde_json::from_slice(&bytes).ok()
    }

    /// Put in reflex tier (30s TTL)
    pub async fn put_reflex(&self, key: String, value: Vec<u8>) {
        self.reflex.insert(key, value).await;
    }

    /// Put typed value in reflex tier
    pub async fn put_reflex_typed<T: Serialize>(&self, key: String, value: &T) {
        if let Ok(bytes) = serde_json::to_vec(value) {
            self.reflex.insert(key, bytes).await;
        }
    }

    /// Remove from reflex tier
    pub async fn remove_reflex(&self, key: &str) {
        self.reflex.remove(key).await;
    }

    // ============== Context Tier (5min) ==============

    /// Get from context tier (5min TTL)
    pub async fn get_context(&self, key: &str) -> Option<Vec<u8>> {
        self.context.get(key).await
    }

    /// Get typed value from context tier
    pub async fn get_context_typed<T: DeserializeOwned>(&self, key: &str) -> Option<T> {
        let bytes = self.context.get(key).await?;
        serde_json::from_slice(&bytes).ok()
    }

    /// Put in context tier (5min TTL)
    pub async fn put_context(&self, key: String, value: Vec<u8>) {
        self.context.insert(key, value).await;
    }

    /// Put typed value in context tier
    pub async fn put_context_typed<T: Serialize>(&self, key: String, value: &T) {
        if let Ok(bytes) = serde_json::to_vec(value) {
            self.context.insert(key, bytes).await;
        }
    }

    /// Remove from context tier
    pub async fn remove_context(&self, key: &str) {
        self.context.remove(key).await;
    }

    // ============== Cross-Tier Operations ==============

    /// Get from any tier (checks reflex first, then context)
    pub async fn get(&self, key: &str) -> Option<Vec<u8>> {
        if let Some(v) = self.reflex.get(key).await {
            return Some(v);
        }
        self.context.get(key).await
    }

    /// Promote from context to reflex (for items becoming hot)
    pub async fn promote_to_reflex(&self, key: &str) {
        if let Some(value) = self.context.get(key).await {
            self.reflex.insert(key.to_string(), value).await;
        }
    }

    /// Demote from reflex to context (for items cooling down)
    pub async fn demote_to_context(&self, key: &str) {
        if let Some(value) = self.reflex.get(key).await {
            self.context.insert(key.to_string(), value).await;
            self.reflex.remove(key).await;
        }
    }

    // ============== Stats & Maintenance ==============

    /// Get reflex tier entry count
    pub fn reflex_count(&self) -> u64 {
        self.reflex.entry_count()
    }

    /// Get context tier entry count
    pub fn context_count(&self) -> u64 {
        self.context.entry_count()
    }

    /// Total entries across both tiers
    pub fn entry_count(&self) -> u64 {
        self.reflex.entry_count() + self.context.entry_count()
    }

    /// Check if key exists in either tier
    pub fn contains(&self, key: &str) -> bool {
        self.reflex.contains_key(key) || self.context.contains_key(key)
    }

    /// Invalidate all entries in both tiers
    pub fn invalidate_all(&self) {
        self.reflex.invalidate_all();
        self.context.invalidate_all();
    }

    /// Invalidate only reflex tier (e.g., on turn completion)
    pub fn invalidate_reflex(&self) {
        self.reflex.invalidate_all();
    }

    /// Invalidate only context tier (e.g., on session end)
    pub fn invalidate_context(&self) {
        self.context.invalidate_all();
    }
}

impl Default for HotCache {
    fn default() -> Self {
        Self::new()
    }
}

/// Cache key builders for consistent key formatting
pub mod keys {
    /// Key for current turn state
    pub fn turn_state(session_id: &str) -> String {
        format!("turn:{}", session_id)
    }

    /// Key for active tool call
    pub fn tool_call(session_id: &str, call_id: &str) -> String {
        format!("tool:{}:{}", session_id, call_id)
    }

    /// Key for CAG context blob
    pub fn cag_context(session_id: &str, hop_id: &str) -> String {
        format!("cag:{}:{}", session_id, hop_id)
    }

    /// Key for embedding vector (cached to avoid re-computation)
    pub fn embedding(content_hash: &str) -> String {
        format!("emb:{}", content_hash)
    }

    /// Key for reranker score
    pub fn rerank_score(query_hash: &str, doc_hash: &str) -> String {
        format!("rerank:{}:{}", query_hash, doc_hash)
    }

    /// Key for project context
    pub fn project_context(project_id: &str) -> String {
        format!("proj:{}", project_id)
    }

    /// Key for persona state
    pub fn persona(project_id: &str, persona_id: &str) -> String {
        format!("persona:{}:{}", project_id, persona_id)
    }
}
