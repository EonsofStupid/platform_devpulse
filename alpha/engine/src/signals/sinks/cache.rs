// engine/src/signals/sinks/cache.rs

//! Cache sink - routes signals to moka HotCache
//!
//! Handles: Chat, ThoughtNode, Context signals

use super::SignalSink;
use crate::{Signal, SignalVariant};
use orchestrator::infra::persistence::memory::HotCache;
use tracing::instrument;

/// Cache sink - writes to moka HotCache
pub struct CacheSink {
    cache: HotCache,
}

impl CacheSink {
    pub fn new(cache: HotCache) -> Self {
        Self { cache }
    }
}

#[async_trait::async_trait]
impl SignalSink for CacheSink {
    #[instrument(skip(self, signal), fields(signal_id = %signal.header.id))]
    async fn process(&self, signal: &Signal) {
        match &*signal.payload {
            SignalVariant::Chat(payload) => {
                // Store chat in context tier (5min TTL)
                let key = format!("chat:{}", signal.header.id);
                self.cache.put_context_typed(key, payload).await;
                tracing::debug!("Cached chat signal");
            }
            SignalVariant::ThoughtNode(payload) => {
                // Store thought nodes in reflex tier (30s TTL) - hot during reasoning
                let key = format!("thought:{}", signal.header.id);
                self.cache.put_reflex_typed(key, payload).await;
                tracing::debug!("Cached thought node signal");
            }
            SignalVariant::Context(payload) => {
                // Store context in context tier (5min TTL)
                let key = format!("context:{}", signal.header.id);
                self.cache.put_context_typed(key, payload).await;
                tracing::debug!("Cached context signal");
            }
            _ => {
                // Other signal types don't go to cache
            }
        }
    }

    fn name(&self) -> &'static str {
        "cache"
    }
}
