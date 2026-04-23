//! `regen-bindings` — regenerate `interfaces/desktop/src/lib/sys/generated/bindings.ts`.
//!
//! Wraps the `DEVPULSE_BINDINGS_EXPORT_ONLY=1` early-return path in
//! `interfaces/desktop/src-tauri/src/lib.rs` so that the `specta`-driven
//! TypeScript bindings export is a first-class, reproducible command
//! instead of tribal knowledge.
//!
//! # Why a dedicated subcommand
//!
//! The export path writes to `../src/lib/sys/generated/bindings.ts`
//! relative to `src-tauri/`. Running `cargo run -p
//! devpulse_desktop_backend` from the workspace root resolves that
//! path to `<workspace>/../src/...` — outside the repo. Every hand
//! invocation is a chance to write bindings.ts to the wrong location
//! (we have shipped exactly that bug).
//!
//! This subcommand pins the `current_dir` to `interfaces/desktop/src-tauri/`
//! and verifies after the run that `bindings.ts` mtime actually advanced
//! — catching silent failures where the export returned early but wrote
//! nothing (e.g. when the backend panics before reaching the export call).
//!
//! # Contract
//!
//! - Cwd is forced to `<workspace>/interfaces/desktop/src-tauri`.
//! - Env has `DEVPULSE_BINDINGS_EXPORT_ONLY=1`.
//! - Stdio is inherited so cargo's live progress prints to the terminal.
//! - On success, `bindings.ts` mtime is guaranteed to have advanced since
//!   task start. If it did not, `bail!` with the expected path.

use crate::commands::Task;
use crate::workspace::Workspace;
use anyhow::{bail, Context, Result};
use std::path::Path;
use std::process::Command;
use std::time::SystemTime;

/// Regenerate tauri-specta TypeScript bindings.
pub struct RegenBindings;

impl Task for RegenBindings {
    fn name(&self) -> &'static str {
        "regen-bindings"
    }

    fn run(&self, ws: &Workspace) -> Result<()> {
        let src_tauri = ws
            .root()
            .join("interfaces")
            .join("desktop")
            .join("src-tauri");
        let bindings_ts = ws
            .root()
            .join("interfaces")
            .join("desktop")
            .join("src")
            .join("lib")
            .join("sys")
            .join("generated")
            .join("bindings.ts");

        if !src_tauri.is_dir() {
            bail!(
                "src-tauri dir not found at {} — is this the DevPulse repo?",
                src_tauri.display()
            );
        }

        let before_mtime = mtime_or_epoch(&bindings_ts);
        let cargo = ws.resolve("cargo").context("cargo not found on PATH")?;

        crate::xinfo!(
            "regen-bindings: cargo run -p devpulse_desktop_backend (cwd={})",
            src_tauri.display()
        );

        let status = Command::new(cargo)
            .current_dir(&src_tauri)
            .env("DEVPULSE_BINDINGS_EXPORT_ONLY", "1")
            .args(["run", "-p", "devpulse_desktop_backend", "--quiet"])
            .status()
            .with_context(|| "failed to spawn `cargo run -p devpulse_desktop_backend`")?;

        if !status.success() {
            bail!(
                "cargo run exited {} — bindings.ts was NOT regenerated",
                status
                    .code()
                    .map_or_else(|| "killed by signal".to_string(), |c| c.to_string())
            );
        }

        if !bindings_ts.exists() {
            bail!(
                "cargo run succeeded but bindings.ts does not exist at {}. \
                 Verify the specta export path in interfaces/desktop/src-tauri/src/lib.rs.",
                bindings_ts.display()
            );
        }

        let after_mtime = mtime_or_epoch(&bindings_ts);
        if after_mtime <= before_mtime {
            bail!(
                "bindings.ts mtime did not advance ({} -> {}). \
                 The export call ran but wrote no output. \
                 Check interfaces/desktop/src-tauri/src/lib.rs for a panic \
                 before the specta export call, or a guard still gating it.",
                fmt_time(before_mtime),
                fmt_time(after_mtime)
            );
        }

        crate::xinfo!(
            "regen-bindings: OK — {} (mtime {})",
            bindings_ts.display(),
            fmt_time(after_mtime)
        );
        Ok(())
    }
}

fn mtime_or_epoch(p: &Path) -> SystemTime {
    std::fs::metadata(p)
        .and_then(|m| m.modified())
        .unwrap_or(SystemTime::UNIX_EPOCH)
}

fn fmt_time(t: SystemTime) -> String {
    t.duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| format!("epoch+{}s", d.as_secs()))
        .unwrap_or_else(|_| "pre-epoch".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::Duration;

    #[test]
    fn mtime_or_epoch_returns_epoch_for_missing_file() {
        let p = std::env::temp_dir().join("devpulse-xtask-regen-bindings-missing.txt");
        let _ = fs::remove_file(&p);
        assert_eq!(mtime_or_epoch(&p), SystemTime::UNIX_EPOCH);
    }

    #[test]
    fn mtime_or_epoch_returns_actual_mtime_when_file_exists() {
        let p = std::env::temp_dir().join("devpulse-xtask-regen-bindings-probe.txt");
        fs::write(&p, b"probe").unwrap();
        let m = mtime_or_epoch(&p);
        assert!(m > SystemTime::UNIX_EPOCH + Duration::from_secs(1_600_000_000));
        let _ = fs::remove_file(&p);
    }

    #[test]
    fn fmt_time_has_epoch_prefix_for_post_epoch_values() {
        let t = SystemTime::UNIX_EPOCH + Duration::from_secs(42);
        assert_eq!(fmt_time(t), "epoch+42s");
    }
}
