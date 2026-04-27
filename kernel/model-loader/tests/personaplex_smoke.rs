//! Personaplex-7B STS smoke test — exercises the full Phase J chain
//! end-to-end on the real `nvidia/personaplex-7b-v1` weights.
//!
//! ## What it covers
//!
//! 1. `Voices.tgz` extractor lands files under `<model_dir>/voices/`.
//! 2. `MoshiStsBackend::new` accepts the model dir.
//! 3. `MoshiStsBackend::load(device)` materialises the LM + Mimi codec
//!    plus `SentencePiece` tokenizer through Candle 0.10 + the vendored
//!    `moshi-core` (`deps/moshi/`).
//! 4. `MoshiStsBackend::is_loaded()` flips to `true`.
//! 5. `MoshiStsBackend::unload()` runs without error.
//!
//! ## How to run
//!
//! ```bash
//! cargo test -p model-loader --features moshi-sts \
//!   --test personaplex_smoke -- --nocapture
//! ```
//!
//! This is a Layer 2 test (per `scripts/docs/policy/TESTING-POLICY.md`)
//! — it runs against real on-disk model files. If the
//! `.userdata/models/personaplex-7b-v1/` tree isn't populated, the
//! test emits a clear `SKIP: <reason>` line and exits successfully
//! rather than failing — same shape as `real_loader_smoke.rs`.

#![cfg(feature = "moshi-sts")]
#![allow(
    clippy::expect_used,
    clippy::needless_pass_by_value,
    clippy::too_many_lines
)]

use std::path::{Path, PathBuf};

use model_loader::backends::candle::voices_archive::extract_voices_in;
use model_loader::backends::candle::MoshiStsBackend;

/// Locate the workspace's `.userdata/models/` tree relative to this
/// test binary. Mirrors the resolver in `real_loader_smoke.rs` so
/// both smoke tests pick up the same on-disk layout.
fn resolve_models_dir() -> PathBuf {
    if let Ok(env_dir) = std::env::var("DEVPULSE_MODELS_DIR") {
        return PathBuf::from(env_dir);
    }

    let manifest_dir = std::env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR set by cargo test");
    let workspace_root = Path::new(&manifest_dir)
        .parent()
        .expect("kernel/")
        .parent()
        .expect("workspace root");

    workspace_root.join(".userdata").join("models")
}

/// Look for the Personaplex weights under any of the directory shapes
/// the download manager might land them in.
fn locate_personaplex(models_dir: &Path) -> Option<PathBuf> {
    let candidates = [
        models_dir.join("personaplex-7b-v1"),
        models_dir.join("nvidia").join("personaplex-7b-v1"),
        models_dir.join("voice").join("personaplex-7b-v1"),
        models_dir
            .join("voice")
            .join("nvidia")
            .join("personaplex-7b-v1"),
    ];

    candidates.into_iter().find(|p| p.exists() && p.is_dir())
}

fn skip(reason: &str) {
    println!("[personaplex_smoke] SKIP — {reason}");
}

#[test]
fn step1_voices_archive_extraction() {
    let models_dir = resolve_models_dir();
    if !models_dir.exists() {
        skip(&format!(
            "{} does not exist — portable userdata not populated",
            models_dir.display()
        ));
        return;
    }

    let Some(personaplex_dir) = locate_personaplex(&models_dir) else {
        skip("no personaplex-7b-v1 directory under .userdata/models — \
              run the wizard's download flow first");
        return;
    };

    println!(
        "[personaplex_smoke] models_dir resolved to {}",
        personaplex_dir.display()
    );

    let count = match extract_voices_in(&personaplex_dir) {
        Ok(c) => c,
        Err(e) => panic!("Voices.tgz extraction failed: {e:#}"),
    };

    if count == 0 {
        // No archive present is a valid state — Kyutai's base Moshi
        // doesn't ship one. We still consider this step a pass; the
        // file count is logged for visibility.
        println!("[personaplex_smoke] PASS step1 — no Voices.tgz present (skipped extract)");
    } else {
        let voices_dir = personaplex_dir.join("voices");
        assert!(
            voices_dir.exists(),
            "extract_voices_in claimed {count} files but {} doesn't exist",
            voices_dir.display()
        );
        println!(
            "[personaplex_smoke] PASS step1 — extracted {count} files to {}",
            voices_dir.display()
        );
    }
}

#[test]
fn step2_moshi_load_and_unload() {
    let models_dir = resolve_models_dir();
    if !models_dir.exists() {
        skip("models_dir not present");
        return;
    }
    let Some(personaplex_dir) = locate_personaplex(&models_dir) else {
        skip("personaplex-7b-v1 not found on disk");
        return;
    };

    let mut backend = MoshiStsBackend::new(&personaplex_dir);
    assert!(!backend.is_loaded(), "fresh backend must report unloaded");

    // Pick CPU as the lowest-VRAM device — STS load on CUDA goes
    // through the same Candle Device::Cuda path; CPU keeps the smoke
    // test runnable on dev boxes without a GPU. The `cuda` feature
    // flips this knob in the runtime path.
    let device = candle_core::Device::Cpu;

    match backend.load(&device) {
        Ok(()) => {
            assert!(
                backend.is_loaded(),
                "is_loaded must be true after a successful load"
            );
            println!(
                "[personaplex_smoke] PASS step2 — Moshi STS load + is_loaded contract"
            );
            backend.unload();
            assert!(
                !backend.is_loaded(),
                "is_loaded must be false after unload"
            );
            println!("[personaplex_smoke] PASS step2b — unload contract");
        }
        Err(e) => {
            // A real load failure on a real model is informative —
            // surface as panic so the smoke test fails loudly. The
            // SKIP path above already covers the missing-files case.
            panic!("MoshiStsBackend::load returned Err on existing files: {e:#}");
        }
    }
}
