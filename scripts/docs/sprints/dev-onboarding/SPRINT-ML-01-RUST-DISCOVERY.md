> # ⚠️ UNVERIFIED — OUTPUT NOT TRUSTED
>
> This sprint was marked COMPLETE in a prior session log. That status is
> **not binding.** The setup wizard does not currently pass a live audit
> against the 10 Commandments in `POAM-MODEL-LOADER-WIZARD.md`.
>
> - Prior commits shipped. Prior code lives on disk. Neither proves the UX works.
> - Every file this sprint touched must be re-checked against the 10
>   Commandments (POAM §top) before being cited as "done."
> - Acceptance criteria below are aspirational, not retired.
>
> **Authority** → `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# Sprint ML-01: Rust — Model Discovery Fixes

| Field | Value |
|-------|-------|
| **Status** | `PLANNED` |
| **Blocks** | ML-02 through ML-06 (voice.stt broken without .bin discovery) |
| **Crate** | `model-loader` |
| **Files** | 2 Rust modified |
| **Risk** | LOW — additive changes only, no existing behavior altered |

---

## PROBLEM STATEMENT

Three bugs in model discovery make the wizard unable to function:

1. **`.bin` files invisible** — `discovery.rs:99` has `_ => {}` which silently skips Whisper's `ggml-small.bin`. The voice.stt slot can NEVER be assigned because the file is never discovered. This blocks ALL voice pipeline testing.

2. **Safetensor shards pollute the model list** — 9 loose files (`model-00001-of-00007.safetensors` etc.) appear as separate "models" with `architecture: "unknown"` and 4-5GB VRAM estimates each. These are NOT standalone models — they are weight shards of a single model. The user sees 20 models when only 5 are real.

3. **Duplicate files confuse assignment** — `Qwen3.5-9B-Q4_K_M.gguf` exists in both `gguf/` and `chat/`. `nomic-embed-text-v1.5.Q8_0.gguf` exists in both `gguf/` and `rag/`. The registry lists both, doubling the model count and making it ambiguous which file backs an assignment.

---

## PRE-FLIGHT

Before editing, read and confirm understanding of:

1. `kernel/model-loader/src/models/discovery.rs` — FULL file (648 lines, read in chunks)
   - Line 70-99: `walk_all()` extension matching — where `.bin` is skipped
   - Line 528-575: `apply_folder_hints()` — where capabilities are added by folder
   - Line 462-499: `parse_onnx_entry()` — pattern for adding a new parser
2. `kernel/model-loader/src/models/registry.rs` — scan() and persist() flow
   - Where `discover_models()` is called
   - Where results are stored and persisted to `registry.json`
3. `kernel/model-loader/src/slots/types.rs` — `ModelCapability` enum values
4. Confirm `ModelFormat` enum has a variant usable for whisper (or needs one)

---

## FILE 1: `kernel/model-loader/src/models/discovery.rs`

### Change 1: Add `.bin` extension arm (line 99)

In `walk_all()`, after the `"onnx"` match arm, before `_ => {}`:

```rust
"bin" => {
    // Whisper GGML binary format: ggml-*.bin
    if let Some(fname) = path.file_name().and_then(|f| f.to_str()) {
        if fname.starts_with("ggml-") {
            match parse_whisper_bin_entry(&path) {
                Ok(entry) => {
                    tracing::debug!(file = %path.display(), "Discovered Whisper GGML model");
                    entries.push(entry);
                }
                Err(e) => {
                    tracing::warn!(file = %path.display(), error = %e, 
                        "Failed to parse Whisper .bin — skipping");
                }
            }
        }
    }
}
```

### Change 2: Add `parse_whisper_bin_entry()` function

Place after `parse_onnx_entry()` (line ~499):

```rust
/// Parse a Whisper GGML .bin file into a registry entry.
///
/// Whisper models use the original GGML binary format (not GGUF).
/// We cannot parse the header for metadata, so we infer from filename and file size.
///
/// # Errors
/// Returns error if file metadata cannot be read.
fn parse_whisper_bin_entry(path: &Path) -> anyhow::Result<ModelRegistryEntry> {
    let file_size = std::fs::metadata(path)?.len();
    let filename = path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_default();

    let quant_level = if filename.contains("q5_1") {
        Some("Q5_1".to_string())
    } else if filename.contains("q8_0") {
        Some("Q8_0".to_string())
    } else {
        Some("F16".to_string())
    };

    Ok(ModelRegistryEntry {
        id: uuid::Uuid::now_v7().to_string(),
        filename,
        path: path.to_path_buf(),
        format: ModelFormat::Gguf, // Closest enum — whisper ggml is predecessor to gguf
        architecture: "whisper".to_string(),
        parameter_count: None,
        quant_level,
        context_length: 0,
        size_bytes: file_size,
        vram_estimate_mb: file_size / (1024 * 1024),
        supported_backends: vec![BackendType::Sherpa],
        compatible_capabilities: vec![ModelCapability::SpeechToText],
        source: ModelSource::Local,
        discovered_at: now_epoch_ms(),
    })
}
```

### Change 3: Filter safetensor shards

In `discover_models()`, after `walk_all()` call and before `apply_folder_hints()` (line ~28):

```rust
// Filter safetensor shards — "model-NNNNN-of-NNNNN.safetensors" are weight
// fragments, not standalone models. Including them pollutes the model list
// with 7-9 entries that each claim 4-5GB VRAM but cannot be loaded individually.
let pre_filter = entries.len();
entries.retain(|e| {
    if e.format == ModelFormat::SafeTensors {
        let f = &e.filename;
        let is_shard = f.contains("-of-")
            && (f.starts_with("model-") || f.starts_with("model.safetensors-"));
        if is_shard {
            tracing::debug!(file = %f, "Filtered safetensor shard");
        }
        !is_shard
    } else {
        true
    }
});
let filtered = pre_filter - entries.len();
if filtered > 0 {
    tracing::info!(count = filtered, "Filtered {filtered} safetensor shards from discovery");
}
```

---

## FILE 2: `kernel/model-loader/src/models/registry.rs`

### Change: Deduplicate after scan

In the `scan()` method, after calling `discover_models()` and before persisting:

Add a `deduplicate()` call and the supporting function:

```rust
/// Remove duplicate model files (same filename in multiple directories).
/// Keeps the copy in a purpose subdir (chat/, voice/, rag/, vision/) over gguf/ or root.
fn deduplicate(entries: &mut Vec<ModelRegistryEntry>, models_dir: &Path) {
    let mut best: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    let mut remove_indices: Vec<usize> = Vec::new();

    for (i, entry) in entries.iter().enumerate() {
        match best.get(&entry.filename) {
            Some(&prev_i) => {
                let prev_purpose = Self::in_purpose_dir(&entries[prev_i].path, models_dir);
                let curr_purpose = Self::in_purpose_dir(&entry.path, models_dir);

                if curr_purpose && !prev_purpose {
                    // Current is in purpose dir, prev is not — replace
                    remove_indices.push(prev_i);
                    best.insert(entry.filename.clone(), i);
                    tracing::info!(
                        file = %entry.filename,
                        kept = %entry.path.display(),
                        removed = %entries[prev_i].path.display(),
                        "Deduplicated: kept purpose-dir copy"
                    );
                } else {
                    // Keep previous
                    remove_indices.push(i);
                    tracing::info!(
                        file = %entry.filename,
                        kept = %entries[prev_i].path.display(),
                        removed = %entry.path.display(),
                        "Deduplicated: kept earlier copy"
                    );
                }
            }
            None => {
                best.insert(entry.filename.clone(), i);
            }
        }
    }

    remove_indices.sort_unstable();
    remove_indices.dedup();
    for idx in remove_indices.into_iter().rev() {
        entries.remove(idx);
    }
}

fn in_purpose_dir(path: &Path, models_dir: &Path) -> bool {
    path.strip_prefix(models_dir)
        .ok()
        .and_then(|rel| rel.components().next())
        .map(|c| {
            let name = c.as_os_str().to_string_lossy();
            matches!(name.as_ref(), "chat" | "voice" | "rag" | "vision")
        })
        .unwrap_or(false)
}
```

---

## VERIFICATION CHECKLIST

**Every item requires PROOF, not a claim. The proof is stated.**

### After editing discovery.rs:

- [ ] **Re-read discovery.rs lines 70-105** to confirm `.bin` arm is correctly placed inside the `match ext` block, not outside it
- [ ] **Re-read the `parse_whisper_bin_entry` function** to confirm: returns `ModelCapability::SpeechToText`, architecture is `"whisper"`, format is `ModelFormat::Gguf`
- [ ] **Re-read the shard filter** to confirm: it runs AFTER `walk_all()` and BEFORE `apply_folder_hints()`, uses `retain()` not `filter()`

### After editing registry.rs:

- [ ] **Re-read `scan()` method** to confirm `deduplicate()` is called after discovery, before persist
- [ ] **Re-read `deduplicate()` function** to confirm: removes from Vec by index in reverse order, prefers purpose-dir copies

### Compilation:

- [ ] `cargo check -p model-loader` — **PASTE the last 5 lines of output**. Must show `0 errors`. Warnings from our code = BLOCKER, fix before proceeding.
- [ ] `cargo test -p model-loader` — **PASTE the test summary line**. All existing tests must pass. New code must not break `discover_empty_dir`, `discover_nonexistent_dir`, `quant_from_filename`, `capabilities_*`, `vram_estimate_*`.

### Functional (verified on next app boot):

- [ ] **After rebuild**: `registry.json` contains an entry with `"filename": "ggml-small.bin"` and `"compatible_capabilities": ["SpeechToText"]` — **PASTE the entry from registry.json**
- [ ] **After rebuild**: `registry.json` does NOT contain any `model-NNNNN-of-NNNNN.safetensors` entries — **state count of safetensor entries (should be 0)**
- [ ] **After rebuild**: `registry.json` does NOT contain duplicate filenames — **state total model count (should be ~6-8, not 20)**

### If ANY check fails:

1. Read the FULL error message
2. Read the file at the error location (20 lines above and below)
3. Identify ROOT CAUSE
4. Fix the root cause, not the symptom
5. Re-run ALL checks from the top

---

## WHAT THIS SPRINT DOES NOT TOUCH

- Frontend files (that's ML-02+)
- auto_config.rs (already fixed this session — Kokoro points to ONNX, minion to unsloth repo)
- service.rs download/load logic
- Slot configuration (platform.default.toml)

---

## ROLLBACK

If this sprint introduces regressions:
```bash
git checkout -- kernel/model-loader/src/models/discovery.rs
git checkout -- kernel/model-loader/src/models/registry.rs
```
No other files touched. No cascading dependencies.
