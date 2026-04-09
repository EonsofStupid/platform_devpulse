//! # Filter Pipeline
//!
//! Three stages between translation and emission:
//! 1. **Whitelist** — category allowed? (applied in bridge, not here)
//! 2. **Redaction** — strip IP-sensitive fields based on redaction level
//! 3. **Throttle** — rate-limit events to avoid UI flooding

use std::collections::HashMap;
use std::time::Instant;

use devpulse_clyffy::cortex::grammar::config::DEFAULT_GRAMMAR_KIND;

use super::config::{RedactionLevel, WhitelistConfig};
use super::surface::{SurfaceCategory, SurfaceEvent};

/// Tracks rate limiting state per surface category.
struct ThrottleState {
    last_emitted: HashMap<SurfaceCategory, Instant>,
    min_interval_ms: u64,
}

impl ThrottleState {
    fn new(max_events_per_sec: u32) -> Self {
        let min_interval_ms = if max_events_per_sec == 0 || max_events_per_sec == u32::MAX {
            0
        } else {
            1000 / u64::from(max_events_per_sec)
        };
        Self {
            last_emitted: HashMap::new(),
            min_interval_ms,
        }
    }

    fn should_emit(&mut self, category: SurfaceCategory) -> bool {
        if self.min_interval_ms == 0 {
            return true;
        }
        let now = Instant::now();
        if let Some(last) = self.last_emitted.get(&category) {
            if now.duration_since(*last).as_millis() < u128::from(self.min_interval_ms) {
                return false;
            }
        }
        self.last_emitted.insert(category, now);
        true
    }

    fn update_rate(&mut self, max_events_per_sec: u32) {
        self.min_interval_ms = if max_events_per_sec == 0 || max_events_per_sec == u32::MAX {
            0
        } else {
            1000 / u64::from(max_events_per_sec)
        };
    }
}

/// The three-stage filter pipeline.
pub struct FilterPipeline {
    throttle: ThrottleState,
}

impl FilterPipeline {
    pub fn new(max_events_per_sec: u32) -> Self {
        Self {
            throttle: ThrottleState::new(max_events_per_sec),
        }
    }

    /// Run the full pipeline on a surface event.
    /// Returns `Some(event)` if it passes, `None` if filtered.
    pub fn apply(
        &mut self,
        mut event: SurfaceEvent,
        config: &WhitelistConfig,
    ) -> Option<SurfaceEvent> {
        // Stage 2: Redaction
        Self::redact(&mut event, config);

        // Stage 3: Throttle
        self.throttle.update_rate(config.max_events_per_sec);
        if !self.throttle.should_emit(event.category) {
            return None;
        }

        Some(event)
    }

    /// Apply redaction based on the config's redaction level.
    fn redact(event: &mut SurfaceEvent, config: &WhitelistConfig) {
        match config.redaction {
            RedactionLevel::None => {}
            RedactionLevel::Pii => {
                if let Some(ref mut detail) = event.detail {
                    *detail = redact_pii(detail);
                }
            }
            RedactionLevel::Ip => {
                if let Some(ref mut detail) = event.detail {
                    *detail = redact_ip(detail);
                }
                event.headline = redact_ip(&event.headline);
            }
            RedactionLevel::Full => {
                if let Some(ref mut detail) = event.detail {
                    *detail = "[redacted]".to_string();
                }
                event.headline = format!("[{}] event", event.category.display_name());
            }
        }
    }
}

/// Strip user-identifiable info (paths with usernames, etc).
fn redact_pii(text: &str) -> String {
    let mut result = text.to_string();

    // Replace C:\Users\{username}\... with C:\Users\***\...
    if let Some(idx) = result.find(r"C:\Users\") {
        let after_users = idx + r"C:\Users\".len();
        if let Some(slash) = result[after_users..].find('\\') {
            let username_end = after_users + slash;
            result.replace_range(after_users..username_end, "***");
        }
    }

    // Replace /home/{username}/... with /home/***/...
    if let Some(idx) = result.find("/home/") {
        let after_home = idx + "/home/".len();
        if let Some(slash) = result[after_home..].find('/') {
            let username_end = after_home + slash;
            result.replace_range(after_home..username_end, "***");
        }
    }

    result
}

/// Strip IP-sensitive method names and internal architecture terms.
///
/// This is the key function that protects kernel internals
/// from leaking to the user-facing UI.
fn redact_ip(text: &str) -> String {
    // Terms that must NEVER appear in Surface-level output.
    const IP_TERMS: &[(&str, &str)] = &[
        ("RuminationLayer", "thinking step"),
        ("rumination", "thinking"),
        ("COSTAR", "request preparation"),
        ("CostarAssembly", "request preparation"),
        ("CostarGate", "quality check"),
        ("MinionSignal", "observation"),
        ("GUARDIAN", "project watcher"),
        ("ENFORCER", "quality checker"),
        ("PSYCH", "mood system"),
        ("DIARY", "memory system"),
        ("SCRIBE", "translation system"),
        ("TEACHER", "learning system"),
        ("RESEARCHER", "research system"),
        ("VISION", "visual system"),
        ("tokio::broadcast", "notification"),
        ("flume", "message"),
        ("rkyv", "data"),
        ("Qdrant", "knowledge base"),
        ("libSQL", "database"),
        ("DuckDB", "analytics"),
        ("SurrealDB", "graph"),
        ("Candle", "AI engine"),
        ("llama.cpp", "AI engine"),
        (DEFAULT_GRAMMAR_KIND, "format system"),
        ("Qwen3", "AI model"),
        ("SigLIP2", "vision model"),
        ("Whisper", "voice model"),
        ("Kokoro", "voice model"),
        ("LoRA", "specialization"),
        ("KV cache", "memory"),
        ("VRAM", "GPU memory"),
        ("n_gpu_layers", "GPU allocation"),
        ("ResourceArbiter", "resource manager"),
        ("AllocationMode", "performance mode"),
        ("embedder", "search system"),
        ("reranker", "ranking system"),
        ("cross-encoder", "ranking"),
        ("forward pass", "processing"),
        ("autoregressive", "step-by-step"),
        ("inference", "thinking"),
    ];

    let mut result = text.to_string();
    for (internal, friendly) in IP_TERMS {
        let lower = result.to_lowercase();
        let pattern_lower = internal.to_lowercase();
        if let Some(idx) = lower.find(&pattern_lower) {
            result.replace_range(idx..idx + internal.len(), friendly);
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redact_ip_replaces_internal_terms() {
        let input = "RuminationLayer::Send fired, COSTAR assembled with Qdrant retrieval";
        let output = redact_ip(input);
        assert!(!output.contains("RuminationLayer"));
        assert!(!output.contains("COSTAR"));
        assert!(!output.contains("Qdrant"));
        assert!(output.contains("thinking step"));
        assert!(output.contains("request preparation"));
        assert!(output.contains("knowledge base"));
    }

    #[test]
    fn redact_pii_strips_windows_paths() {
        let input = r"Error in C:\Users\jesse\projects\devpulse\auth.rs";
        let output = redact_pii(input);
        assert!(!output.contains("jesse"));
        assert!(output.contains("***"));
    }

    #[test]
    fn throttle_respects_rate() {
        let mut throttle = ThrottleState::new(1);
        assert!(throttle.should_emit(SurfaceCategory::Thinking));
        assert!(!throttle.should_emit(SurfaceCategory::Thinking));
    }
}
