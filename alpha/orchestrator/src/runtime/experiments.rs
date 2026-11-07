// orchestrator/src/runtime/experiments.rs

//! Runtime experiment flags
//!
//! All flags are AtomicBool for lock-free read/write.
//! Toggle via Lab UI or environment variables.
//!
//! ## Flag Categories
//! - **Ops toggles**: ON by default, disable to kill broken features
//! - **Debug toggles**: OFF by default, enable for troubleshooting
//! - **Diagnostic mode**: User-facing support mode, captures traces for bug reports

use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};

/// Runtime experiment flags - toggle features without recompile
///
/// Ship with debug flags OFF. Users can enable diagnostic_mode for support.
#[derive(Debug)]
pub struct Experiments {
    // === Ops Toggles (ON by default, kill switch if broken) ===
    cag_rro: AtomicBool,
    cag_reranker: AtomicBool,
    cag_adaptive_threshold: AtomicBool,
    rumination_enabled: AtomicBool,

    // === A/B Testing ===
    rumination_ab_test: AtomicBool,

    // === Debug Toggles (OFF by default) ===
    debug_capture: AtomicBool,
    debug_routing: AtomicBool,

    // === User Diagnostic Mode (OFF by default) ===
    /// Master switch for diagnostic mode - enables verbose tracing
    diagnostic_mode: AtomicBool,
    /// Capture last N errors/traces for support reports
    capture_for_report: AtomicBool,

    // === Model Selection ===
    prefer_8b: AtomicBool,

    // === Feature Toggles (control UI visibility) ===
    /// Voice feature enabled - show voice UI in Desktop
    voice_enabled: AtomicBool,
    /// Lab mode UI - show developer tools (internal only)
    lab_mode_ui: AtomicBool,
}

impl Experiments {
    pub fn new() -> Self {
        Self {
            // Ops toggles: ON by default
            cag_rro: AtomicBool::new(true),
            cag_reranker: AtomicBool::new(true),
            cag_adaptive_threshold: AtomicBool::new(true),
            rumination_enabled: AtomicBool::new(true),
            // A/B testing: OFF by default
            rumination_ab_test: AtomicBool::new(false),
            // Debug: OFF by default
            debug_capture: AtomicBool::new(false),
            debug_routing: AtomicBool::new(false),
            // Diagnostic mode: OFF by default (user enables for support)
            diagnostic_mode: AtomicBool::new(false),
            capture_for_report: AtomicBool::new(false),
            // Model selection
            prefer_8b: AtomicBool::new(false),
            // Feature toggles: voice ON by default, lab_mode_ui OFF by default
            voice_enabled: AtomicBool::new(true),
            lab_mode_ui: AtomicBool::new(false),
        }
    }

    pub fn from_env() -> Self {
        let exp = Self::new();
        if std::env::var("DEVPULSE_CAG_RRO")
            .map(|v| v == "0")
            .unwrap_or(false)
        {
            exp.cag_rro.store(false, Ordering::Relaxed);
        }
        if std::env::var("DEVPULSE_CAG_RERANKER")
            .map(|v| v == "0")
            .unwrap_or(false)
        {
            exp.cag_reranker.store(false, Ordering::Relaxed);
        }
        if std::env::var("DEVPULSE_DEBUG_CAPTURE")
            .map(|v| v == "1")
            .unwrap_or(false)
        {
            exp.debug_capture.store(true, Ordering::Relaxed);
        }
        if std::env::var("DEVPULSE_PREFER_8B")
            .map(|v| v == "1")
            .unwrap_or(false)
        {
            exp.prefer_8b.store(true, Ordering::Relaxed);
        }
        // DEVPULSE_VOICE_ENABLED=0 to disable voice feature
        if std::env::var("DEVPULSE_VOICE_ENABLED")
            .map(|v| v == "0")
            .unwrap_or(false)
        {
            exp.voice_enabled.store(false, Ordering::Relaxed);
        }
        // DEVPULSE_LAB_MODE=1 to enable lab mode UI
        if std::env::var("DEVPULSE_LAB_MODE")
            .map(|v| v == "1")
            .unwrap_or(false)
        {
            exp.lab_mode_ui.store(true, Ordering::Relaxed);
        }
        exp
    }

    // === Getters ===

    // Ops toggles
    pub fn cag_rro_enabled(&self) -> bool {
        self.cag_rro.load(Ordering::Relaxed)
    }
    pub fn cag_reranker_enabled(&self) -> bool {
        self.cag_reranker.load(Ordering::Relaxed)
    }
    pub fn cag_adaptive_threshold_enabled(&self) -> bool {
        self.cag_adaptive_threshold.load(Ordering::Relaxed)
    }
    pub fn rumination_enabled(&self) -> bool {
        self.rumination_enabled.load(Ordering::Relaxed)
    }

    // A/B testing
    pub fn rumination_ab_test_enabled(&self) -> bool {
        self.rumination_ab_test.load(Ordering::Relaxed)
    }

    // Debug
    pub fn debug_capture_enabled(&self) -> bool {
        self.debug_capture.load(Ordering::Relaxed)
    }
    pub fn debug_routing_enabled(&self) -> bool {
        self.debug_routing.load(Ordering::Relaxed)
    }

    // Diagnostic mode
    pub fn diagnostic_mode_enabled(&self) -> bool {
        self.diagnostic_mode.load(Ordering::Relaxed)
    }
    pub fn capture_for_report_enabled(&self) -> bool {
        self.capture_for_report.load(Ordering::Relaxed)
    }

    // Model selection
    pub fn prefer_8b(&self) -> bool {
        self.prefer_8b.load(Ordering::Relaxed)
    }

    // Feature toggles
    pub fn voice_enabled(&self) -> bool {
        self.voice_enabled.load(Ordering::Relaxed)
    }
    pub fn lab_mode_ui_enabled(&self) -> bool {
        self.lab_mode_ui.load(Ordering::Relaxed)
    }

    // === Setters (for Lab UI) ===

    pub fn set_cag_rro(&self, enabled: bool) {
        self.cag_rro.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "cag_rro", enabled, "Experiment flag changed");
    }
    pub fn set_cag_reranker(&self, enabled: bool) {
        self.cag_reranker.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "cag_reranker", enabled, "Experiment flag changed");
    }
    pub fn set_debug_capture(&self, enabled: bool) {
        self.debug_capture.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "debug_capture", enabled, "Experiment flag changed");
    }
    pub fn set_prefer_8b(&self, enabled: bool) {
        self.prefer_8b.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "prefer_8b", enabled, "Experiment flag changed");
    }
    pub fn set_voice_enabled(&self, enabled: bool) {
        self.voice_enabled.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "voice_enabled", enabled, "Experiment flag changed");
    }
    pub fn set_lab_mode_ui(&self, enabled: bool) {
        self.lab_mode_ui.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "lab_mode_ui", enabled, "Experiment flag changed");
    }

    // === Diagnostic Mode (user-facing for support) ===

    /// Enable diagnostic mode - turns on verbose tracing and capture
    ///
    /// Call this when user needs to generate a support report.
    pub fn enable_diagnostic_mode(&self) {
        self.diagnostic_mode.store(true, Ordering::Relaxed);
        self.capture_for_report.store(true, Ordering::Relaxed);
        tracing::info!("Diagnostic mode enabled - traces will be captured for support");
    }

    /// Disable diagnostic mode
    pub fn disable_diagnostic_mode(&self) {
        self.diagnostic_mode.store(false, Ordering::Relaxed);
        self.capture_for_report.store(false, Ordering::Relaxed);
        tracing::info!("Diagnostic mode disabled");
    }

    // === Snapshot ===

    pub fn snapshot(&self) -> ExperimentsSnapshot {
        ExperimentsSnapshot {
            cag_rro: self.cag_rro_enabled(),
            cag_reranker: self.cag_reranker_enabled(),
            cag_adaptive_threshold: self.cag_adaptive_threshold_enabled(),
            rumination_enabled: self.rumination_enabled(),
            rumination_ab_test: self.rumination_ab_test_enabled(),
            debug_capture: self.debug_capture_enabled(),
            debug_routing: self.debug_routing_enabled(),
            diagnostic_mode: self.diagnostic_mode_enabled(),
            capture_for_report: self.capture_for_report_enabled(),
            prefer_8b: self.prefer_8b(),
            voice_enabled: self.voice_enabled(),
            lab_mode_ui: self.lab_mode_ui_enabled(),
        }
    }
}

impl Default for Experiments {
    fn default() -> Self {
        Self::new()
    }
}

/// Serializable snapshot of all experiment flags
///
/// Use for:
/// - Lab UI display
/// - Support reports (JSON export)
/// - Persisting user preferences
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentsSnapshot {
    // Ops toggles
    pub cag_rro: bool,
    pub cag_reranker: bool,
    pub cag_adaptive_threshold: bool,
    pub rumination_enabled: bool,
    // A/B testing
    pub rumination_ab_test: bool,
    // Debug
    pub debug_capture: bool,
    pub debug_routing: bool,
    // Diagnostic mode
    pub diagnostic_mode: bool,
    pub capture_for_report: bool,
    // Model selection
    pub prefer_8b: bool,
    // Feature toggles
    pub voice_enabled: bool,
    pub lab_mode_ui: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_experiments_defaults() {
        let exp = Experiments::new();
        // Ops toggles: ON by default
        assert!(exp.cag_rro_enabled());
        assert!(exp.cag_reranker_enabled());
        assert!(exp.cag_adaptive_threshold_enabled());
        assert!(exp.rumination_enabled());
        // A/B testing: OFF by default
        assert!(!exp.rumination_ab_test_enabled());
        // Debug: OFF by default
        assert!(!exp.debug_capture_enabled());
        assert!(!exp.debug_routing_enabled());
        // Diagnostic mode: OFF by default
        assert!(!exp.diagnostic_mode_enabled());
        assert!(!exp.capture_for_report_enabled());
        // Model selection
        assert!(!exp.prefer_8b());
        // Feature toggles
        assert!(exp.voice_enabled()); // ON by default
        assert!(!exp.lab_mode_ui_enabled()); // OFF by default
    }

    #[test]
    fn test_experiments_toggle() {
        let exp = Experiments::new();

        exp.set_cag_rro(false);
        assert!(!exp.cag_rro_enabled());

        exp.set_cag_rro(true);
        assert!(exp.cag_rro_enabled());
    }

    #[test]
    fn test_diagnostic_mode() {
        let exp = Experiments::new();
        assert!(!exp.diagnostic_mode_enabled());
        assert!(!exp.capture_for_report_enabled());

        exp.enable_diagnostic_mode();
        assert!(exp.diagnostic_mode_enabled());
        assert!(exp.capture_for_report_enabled());

        exp.disable_diagnostic_mode();
        assert!(!exp.diagnostic_mode_enabled());
        assert!(!exp.capture_for_report_enabled());
    }

    #[test]
    fn test_experiments_snapshot_serialization() {
        let exp = Experiments::new();
        exp.set_debug_capture(true);
        exp.enable_diagnostic_mode();

        let snapshot = exp.snapshot();
        let json = serde_json::to_string(&snapshot).unwrap();
        let restored: ExperimentsSnapshot = serde_json::from_str(&json).unwrap();

        assert_eq!(snapshot.debug_capture, restored.debug_capture);
        assert_eq!(snapshot.cag_rro, restored.cag_rro);
        assert_eq!(snapshot.diagnostic_mode, restored.diagnostic_mode);
        assert_eq!(snapshot.capture_for_report, restored.capture_for_report);
    }

    #[test]
    fn test_experiments_from_env() {
        // Default (no env vars set)
        let exp = Experiments::from_env();
        assert!(exp.cag_rro_enabled()); // default true
    }
}
