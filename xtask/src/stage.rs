//! Stage — timed status reporting for pipeline stages.
//!
//! Every stage in the orchestrator starts a timer and reports
//! its outcome with duration. Consistent output across all tasks.
//!
//! ```text
//! --- Pre-flight ---
//!   [OK] node_modules (2ms)
//!   [OK] pnpm 10.29.3 — C:\nvm4w\nodejs\pnpm.CMD (45ms)
//!   [WARN] node v24.13.1 — expected v22.x from .nvmrc (12ms)
//!   [OK] cargo (1ms)
//! ```

use std::time::Instant;

/// Print a section header. Groups related stages.
pub fn section(name: &str) {
    println!();
    println!("--- {name} ---");
}

/// A timed stage within a task pipeline.
///
/// Created via [`Stage::start`], consumed by one of
/// [`ok`](Stage::ok), [`ok_with`](Stage::ok_with),
/// [`warn`](Stage::warn), or [`skip`](Stage::skip).
pub struct Stage {
    label: &'static str,
    start: Instant,
}

impl Stage {
    /// Begin a new timed stage.
    pub fn start(label: &'static str) -> Self {
        Self {
            label,
            start: Instant::now(),
        }
    }

    /// Stage completed successfully.
    pub fn ok(self) {
        let ms = self.start.elapsed().as_millis();
        println!("  [OK] {} ({ms}ms)", self.label);
    }

    /// Stage completed successfully with extra detail.
    pub fn ok_with(self, detail: impl std::fmt::Display) {
        let ms = self.start.elapsed().as_millis();
        println!("  [OK] {} — {detail} ({ms}ms)", self.label);
    }

    /// Stage completed with a non-fatal warning.
    pub fn warn(self, detail: impl std::fmt::Display) {
        let ms = self.start.elapsed().as_millis();
        eprintln!("  [WARN] {} — {detail} ({ms}ms)", self.label);
    }

    /// Stage was skipped (not applicable).
    pub fn skip(self, reason: impl std::fmt::Display) {
        println!("  [--] {} — {reason}", self.label);
    }
}
