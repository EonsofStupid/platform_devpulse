# SPRINT: Model Tiers — Bundled + User-Managed Architecture

> **Status**: EXECUTING
> **Research**: [SPRINT-MODEL-TIERS.research.md](SPRINT-MODEL-TIERS.research.md), [SPRINT-VOICE-VISION.research.md](SPRINT-VOICE-VISION.research.md)
> **Decision**: Option A — Bundle all three (voice + vision) in NSIS installer (~564 MB int8)

---

## Architecture

### Two Model Tiers

| Tier | Models | User Sees? | Location |
|------|--------|-----------|----------|
| **Bundled** | Kokoro TTS (94 MB), Whisper STT (375 MB), SigLIP2 (95 MB) | No — auto-load on boot | `models/voice/`, `models/vision/` |
| **UserManaged** | Chat brain (7B/14B), Minion (0.6B), Embedder, Reranker | Yes — Model Loader UI | `models/general/` |

### Folder Structure (Workspace Root)

```
platform_devpulse/
  models/                              # .gitignore'd (already)
    voice/
      kokoro/
        model_quantized.onnx           # Kokoro TTS int8 (92 MB)
        voices-v1.0.bin                # 54 voice embeddings (~2 MB)
      whisper-small/
        small-encoder.int8.onnx        # Whisper encoder int8 (112 MB)
        small-decoder.int8.onnx        # Whisper decoder int8 (262 MB)
        small-tokens.txt               # Vocabulary (817 KB)
    vision/
      siglip2-base/
        vision_model_int8.onnx         # SigLIP2 int8 (95 MB)
    general/
      (user-managed — downloaded via Model Loader UI)
```

**Total bundled: ~564 MB** (int8 quantized, down from 948 MB fp32)

### Key Decisions

1. All models under `platform_devpulse/models/` — portable with workspace
2. Dev builds read from workspace `models/` directly (no bundling)
3. Release builds: NSIS bundles `models/voice/` + `models/vision/`
4. Orpheus TTS: NOT in baseline — configurable secondary
5. Model Loader UI only shows `general/` slots
6. Bundled slots trimmed: remove voice.tts.secondary, voice.snac, voice.stt.upgrade

---

## PHASE 1: Workspace Models Directory + Folder Structure

### Files
- Create `models/voice/kokoro/.gitkeep`
- Create `models/voice/whisper-small/.gitkeep`
- Create `models/vision/siglip2-base/.gitkeep`
- Create `models/general/.gitkeep`

### Task Checklist
- [ ] 1.1: Create directory structure with .gitkeep files
- [ ] 1.2: Verify `models/*` is in .gitignore (already confirmed)

---

## PHASE 2: `ModelSourceTier` Enum + Slot Updates

### Files
- `kernel/model-loader/src/slots/types.rs` — add enum + field
- `systems/devpulse-engine/src/platform/integrations/slots.rs` — update registrations
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — add `embedded` + `bundled_path` to SlotInfo

### ModelSourceTier

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum ModelSourceTier {
    Bundled { bundled_path: String },
    UserManaged,
}
```

### Updated Slot Registration (8 slots, down from 11)

| Slot | Tier | bundled_path | Removed? |
|------|------|-------------|----------|
| `voice.tts` | Bundled | `"voice/kokoro/model_quantized.onnx"` | Renamed from voice.tts.primary |
| `voice.stt` | Bundled | `"voice/whisper-small/"` | Kept |
| `vision.embedder` | Bundled | `"vision/siglip2-base/vision_model_int8.onnx"` | Kept |
| `chat.brain` | UserManaged | — | Kept |
| `minion.shared` | UserManaged | — | Kept |
| `minion.escalation` | UserManaged | — | Kept |
| `rag.embedder` | UserManaged | — | Kept |
| `rag.reranker` | UserManaged | — | Kept |
| ~~voice.tts.secondary~~ | — | — | REMOVED (Orpheus not in baseline) |
| ~~voice.snac~~ | — | — | REMOVED (coupled to Orpheus) |
| ~~voice.stt.upgrade~~ | — | — | REMOVED (not in baseline) |

### Task Checklist
- [ ] 2.1: Add `ModelSourceTier` enum to `slots/types.rs`
- [ ] 2.2: Add `source_tier` field to `Slot` struct (with `Default` = `UserManaged`)
- [ ] 2.3: Update `devpulse_default_slots()` — set tiers, remove 3 slots
- [ ] 2.4: Add `embedded: bool` and `bundled_path: Option<String>` to `SlotInfo` in Tauri commands
- [ ] 2.5: Map `source_tier` → `embedded`/`bundled_path` in `get_slots` command
- [ ] 2.6: `cargo check -p model-loader && cargo check -p devpulse-engine`

---

## PHASE 3: Model Loader Path Resolution

### What Changes

`ModelLoaderService::boot()` currently does `let models_dir = data_dir.join("models")` → `.userdata/models/`.

Change: In dev mode, resolve to workspace `models/`. In release, resolve to Tauri resource dir or fall back to data_dir.

### Files
- `systems/devpulse-engine/src/platform/services/model_loader.rs` — accept explicit models_dir
- `systems/devpulse-engine/src/platform/boot/model_loader.rs` — resolve models path from config or env
- `interfaces/desktop/src-tauri/src/lib.rs` — pass workspace models/ path in dev mode

### Path Resolution Logic

```rust
fn resolve_models_dir(data_dir: &Path) -> PathBuf {
    if cfg!(debug_assertions) {
        // Dev: workspace root models/ dir (same trick as resolve_data_dir)
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let project_root = manifest.parent().unwrap().parent().unwrap().parent().unwrap();
        project_root.join("models")
    } else {
        // Release: bundled models alongside .exe, user models in data_dir
        data_dir.join("models")
    }
}
```

### Task Checklist
- [ ] 3.1: Add `resolve_models_dir()` to lib.rs (similar to `resolve_data_dir()`)
- [ ] 3.2: Pass models_dir through Platform::boot → model_loader boot
- [ ] 3.3: Update ModelLoaderService::boot to accept models_dir parameter
- [ ] 3.4: Update subdirectory creation: `voice/kokoro/`, `voice/whisper-small/`, `vision/siglip2-base/`, `general/`
- [ ] 3.5: `cargo check -p devpulse-engine && cargo check -p devpulse-desktop`

---

## PHASE 4: Auto-Assign Bundled Models on Boot

### What Changes

After slot registration and model scan, iterate bundled slots. If the bundled path exists, auto-assign the model to the slot.

### Files
- `kernel/model-loader/src/service.rs` — add `auto_assign_bundled()` method
- `systems/devpulse-engine/src/platform/services/model_loader.rs` — call during boot

### Task Checklist
- [ ] 4.1: Add `auto_assign_bundled(models_dir: &Path)` to `ModelLoaderService`
- [ ] 4.2: For each Bundled slot: check file exists → find/create registry entry → assign
- [ ] 4.3: Call from engine's `ModelLoaderService::boot()` after scan
- [ ] 4.4: Log which bundled models were found/missing
- [ ] 4.5: `cargo check -p model-loader && cargo check -p devpulse-engine`

---

## PHASE 5: Frontend — Hide Bundled Slots

### Files
- `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts` — filter by embedded
- `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte` — use userSubsystems
- `interfaces/desktop/src/lib/domains/app/models/components/SetupWizard.svelte` — remove voice/vision recs
- `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts` — update friendlySlotLabel

### Task Checklist
- [ ] 5.1: Regenerate specta bindings (new `embedded` field on SlotInfo)
- [ ] 5.2: Add `userSlots`, `bundledSlots`, `userSubsystems` getters to models rune
- [ ] 5.3: ModelLoaderPanel: render `userSubsystems` instead of `subsystems`
- [ ] 5.4: SetupWizard: remove voice/vision recommendations (keep brain + worker + embedder only)
- [ ] 5.5: Remove orphaned slot labels (voice.tts.secondary, voice.snac, voice.stt.upgrade)
- [ ] 5.6: `pnpm svelte-check`

---

## PHASE 6: Tauri Resource Bundling (Release Builds)

### Files
- `interfaces/desktop/src-tauri/tauri.conf.json` — add bundle.resources

### Config Addition

```jsonc
"resources": {
    "../../models/voice/**": "models/voice/",
    "../../models/vision/**": "models/vision/"
}
```

### Task Checklist
- [ ] 6.1: Add resources config to tauri.conf.json
- [ ] 6.2: Verify paths are relative to src-tauri/ dir
- [ ] 6.3: Note: Only takes effect for `tauri build`, not `tauri dev`

---

## PHASE 7: Verify + Commit

- [ ] 7.1: `cargo check -p model-loader`
- [ ] 7.2: `cargo check -p devpulse-engine`
- [ ] 7.3: `cargo check -p devpulse-desktop` (Tauri crate)
- [ ] 7.4: `pnpm svelte-check`
- [ ] 7.5: Commit

---

## Summary

| Phase | Scope | Key Change |
|-------|-------|-----------|
| 1 | Directory structure | `models/{voice,vision,general}/` with .gitkeep |
| 2 | Rust types | `ModelSourceTier` enum, 8 slots (down from 11) |
| 3 | Path resolution | Dev reads workspace, release reads bundled |
| 4 | Auto-assign | Bundled models auto-assigned on boot |
| 5 | Frontend | Hide bundled slots, update wizard |
| 6 | Tauri config | Bundle resources for release |
| 7 | Verify | All checks pass |
