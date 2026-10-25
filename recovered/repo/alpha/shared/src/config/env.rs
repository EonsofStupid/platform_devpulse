// shared/src/config/env.rs

//! Runtime environment detection and context management.
//!
//! Detects whether we're running in Lab mode (development) or Production mode.
//! Lab mode uses local `target/lab` paths and debug ports.
//! Production mode uses XDG-standard paths and standard ports.
//!
//! Detection: Set `DEVPULSE_LAB_MODE=1` env var to force Lab mode.

use super::paths::{get_paths, DevPulsePaths};
use std::sync::OnceLock;

static CONTEXT: OnceLock<RuntimeConfig> = OnceLock::new();

/// Runtime mode - determines paths and ports.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RunMode {
    /// Production mode: XDG paths, standard ports
    Production,
    /// Lab mode: local target/lab paths, debug ports
    Lab,
}

impl RunMode {
    /// Detect current mode from environment.
    pub fn detect() -> Self {
        // Explicit lab mode flag
        if std::env::var("DEVPULSE_LAB_MODE").is_ok() {
            return Self::Lab;
        }

        // Check for cargo/dev environment indicators
        if std::env::var("CARGO_MANIFEST_DIR").is_ok() {
            return Self::Lab;
        }

        // Check if running from target directory
        if let Ok(exe) = std::env::current_exe() {
            let exe_str = exe.to_string_lossy();
            if exe_str.contains("target") && (exe_str.contains("debug") || exe_str.contains("release")) {
                return Self::Lab;
            }
        }

        Self::Production
    }

    /// Check if this is lab mode.
    pub fn is_lab(&self) -> bool {
        matches!(self, Self::Lab)
    }

    /// Check if this is production mode.
    pub fn is_production(&self) -> bool {
        matches!(self, Self::Production)
    }
}

/// Port configuration for services.
#[derive(Debug, Clone)]
pub struct PortConfig {
    /// Engine IPC port (process monitor, window tracker)
    pub engine: u16,
    /// Lab TUI port (debug interface)
    pub lab: u16,
    /// RRO embedded port (vector store)
    pub rro: u16,
    /// Desktop Tauri IPC port
    pub desktop: u16,
}

impl PortConfig {
    /// Standard production ports.
    pub fn production() -> Self {
        Self {
            engine: 9100,
            lab: 9101,
            rro: 6334,
            desktop: 9103,
        }
    }

    /// Debug ports for lab mode (offset by 10000).
    pub fn lab() -> Self {
        Self {
            engine: 19100,
            lab: 19101,
            rro: 16334,
            desktop: 19103,
        }
    }

    /// Get ports for the given mode.
    pub fn for_mode(mode: RunMode) -> Self {
        match mode {
            RunMode::Production => Self::production(),
            RunMode::Lab => Self::lab(),
        }
    }
}

/// Central context for all DevPulse runtime configuration.
/// Combines mode detection, paths, and ports into a single SSOT.
#[derive(Debug, Clone)]
pub struct RuntimeConfig {
    /// Current runtime mode.
    pub mode: RunMode,
    /// Port configuration.
    pub ports: PortConfig,
    /// Reference to paths (use get_paths() for actual paths).
    mode_name: &'static str,
}

impl RuntimeConfig {
    /// Initialize context with auto-detection.
    fn init() -> Self {
        let mode = RunMode::detect();
        let ports = PortConfig::for_mode(mode);

        let mode_name = match mode {
            RunMode::Production => "production",
            RunMode::Lab => "lab",
        };

        // Log mode detection (tracing available via workspace)
        tracing::info!("DevPulse context initialized: mode={}", mode_name);

        Self {
            mode,
            ports,
            mode_name,
        }
    }

    /// Get the singleton context instance.
    pub fn current() -> &'static Self {
        CONTEXT.get_or_init(Self::init)
    }

    /// Force a specific mode (for testing). Must be called before first access.
    pub fn force_mode(mode: RunMode) -> Result<(), &'static str> {
        let ctx = Self {
            mode,
            ports: PortConfig::for_mode(mode),
            mode_name: match mode {
                RunMode::Production => "production",
                RunMode::Lab => "lab",
            },
        };

        CONTEXT.set(ctx).map_err(|_| "Context already initialized")
    }

    /// Get paths reference.
    pub fn paths(&self) -> &'static DevPulsePaths {
        get_paths()
    }

    /// Get mode name for logging.
    pub fn mode_name(&self) -> &'static str {
        self.mode_name
    }

    /// Check if running in lab mode.
    pub fn is_lab(&self) -> bool {
        self.mode.is_lab()
    }

    /// Check if running in production mode.
    pub fn is_production(&self) -> bool {
        self.mode.is_production()
    }
}

/// Convenience function to get current context.
pub fn context() -> &'static RuntimeConfig {
    RuntimeConfig::current()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mode_detection_in_test_env() {
        // In test environment, we should detect Lab mode
        // due to CARGO_MANIFEST_DIR being set
        let mode = RunMode::detect();
        assert!(mode.is_lab(), "Expected Lab mode in test environment");
    }

    #[test]
    fn port_config_differs_by_mode() {
        let prod = PortConfig::production();
        let lab = PortConfig::lab();

        assert_ne!(prod.engine, lab.engine);
        assert_ne!(prod.rro, lab.rro);
    }

    #[test]
    fn lab_ports_are_offset() {
        let lab = PortConfig::lab();
        let prod = PortConfig::production();

        // Lab ports should be higher (offset)
        assert!(lab.engine > prod.engine);
        assert!(lab.rro > prod.rro);
    }
}
