//! # Filter Pipeline
//!
//! Three stages between translation and emission:
//! 1. **Whitelist** — category allowed? (applied in bridge, not here)
//! 2. **Redaction** — apply explicitly selected privacy filtering
//! 3. **Throttle** — rate-limit events to avoid UI flooding

use std::collections::HashMap;
use std::time::Instant;

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn technical_detail_survives_all_presentation_presets() {
        for mut config in [
            WhitelistConfig::surface(),
            WhitelistConfig::intermediate(),
            WhitelistConfig::internal(),
        ] {
            config.max_events_per_sec = 0;
            let event = SurfaceEvent {
                id: uuid::Uuid::new_v4(),
                timestamp_ms: 0,
                category: SurfaceCategory::Thinking,
                headline: "GUARDIAN running RRF with Qdrant".into(),
                detail: Some("COSTAR recipe; KV cache; n_gpu_layers=32".into()),
                progress: None,
                severity: super::super::surface::Severity::Info,
                minion: None,
                dismissible: true,
                action: None,
            };
            let output = FilterPipeline::new(0).apply(event.clone(), &config);
            assert!(output.is_some());
            if let Some(output) = output {
                assert_eq!(output.headline, event.headline);
                assert_eq!(output.detail, event.detail);
            }
        }
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
