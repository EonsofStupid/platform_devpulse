# MODEL LOADER — Wave Execution Plan

| Field | Value |
|-------|-------|
| **Status** | `APPROVED — READY FOR EXECUTION` |
| **Date** | `2026-04-04` |
| **Source** | Audit findings + MODEL-LOADER-UX-REQUIREMENTS.md |
| **SSOT** | `scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md` |
| **Approach** | Each wave = 1 commit. Max 5 files per wave. Verify before commit. |

---

## Wave 1: Critical Bug Fixes (code already exists, just broken)

**Goal:** Make the existing model loader actually work.

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1a | handleSwap passes slotId as both args | `ModelLoaderPanel.svelte:293` | Change `modelsState.swap(slotId, slotId)` to `modelsState.swap(slotId, newModelId)`. Need to resolve the new model ID from `selectedOption[slotId]` + `SLOTS[slotId]`. |
| 1b | Download progress stuck at 0% | `kernel/model-loader/src/traits/events.rs:52` | Add `total_bytes: u64` field to `DownloadProgress` variant. |
| 1b | Download progress stuck at 0% (engine bridge) | `systems/devpulse-engine/src/platform/integrations/events.rs:70` | Add `"totalBytes": total_bytes` to the JSON payload. |
| 1b | Download progress stuck at 0% (kernel emit) | `kernel/model-loader/src/models/download.rs:203` | Pass `total_bytes` (from `DownloadStarted`) into each `DownloadProgress` emit. |
| 1b | Download progress stuck at 0% (tracing sink) | `kernel/model-loader/src/traits/events.rs` (TracingEventSink) | Add `total_bytes` to the tracing span in the match arm. |

**Files modified (5):**
1. `kernel/model-loader/src/traits/events.rs`
2. `kernel/model-loader/src/models/download.rs`
3. `systems/devpulse-engine/src/platform/integrations/events.rs`
4. `systems/devpulse-engine/src/platform/services/model_loader_log.rs`
5. `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte`

**Verify:**
- `cargo check -p model-loader`
- `cargo check -p devpulse-engine`
- `pnpm svelte-check`

---

## Wave 2: renderForge Styling Fix

**Goal:** Model loader cards are visible (not transparent).

| # | Issue | File | Fix |
|---|-------|------|-----|
| 2a | renderForge preset "primary" resolves to transparent | `ModelLoaderPanel.svelte:178` | Replace `preset: "primary"` with a preset that exists in the design system (e.g., `"neuro-elevated"` or `"glass-deep"`). Alternatively, create a `model-config` kind preset if appropriate. |
| 2b | Card backgrounds invisible | `ModelLoaderPanel.svelte` template | Audit all `style={cssVarString(m)}` usage. If renderForge output is empty, fall back to direct Tailwind classes from ColdLight token vars. |

**Files modified (1-2):**
1. `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte`
2. Possibly a preset registration file if a new preset is needed

**Verify:**
- `pnpm svelte-check`
- Visual: cards should have visible backgrounds, borders, text contrast

---

## Wave 3: Config-Driven TOML — Rust Structs (Phase 1-2 of TOML plan)

**Goal:** TOML is the SSOT for slots, catalog, models_dir, subdirs.

| # | Task | File | Detail |
|---|------|------|--------|
| 3a | Extend `ModelLoaderServiceEntry` | `config.rs` | Add `models_dir`, `subdirs`, `slots: Vec<SlotConfigEntry>`, `catalog: Vec<CatalogEntry>` with serde defaults |
| 3b | Add TOML-side enum mirrors | `config.rs` | `ModelCapabilityConfig`, `DevicePreferenceConfig`, `LoadingStrategyConfig`, `BackendTypeConfig`, `SourceTierConfig` — each with `to_kernel()` |
| 3c | `SlotConfigEntry` struct | `config.rs` | All fields from kernel `Slot` except `assigned_model` (restored from persistence). Has `to_kernel_slot()`. |
| 3d | `CatalogEntry` + `CatalogOption` | `config.rs` | Derive `Serialize` + `specta::Type` for frontend exposure |
| 3e | Write TOML slot definitions | `platform.default.toml` | All 8 slots + full download catalog under `[services.system.model_loader]` |

**Files modified (2):**
1. `systems/devpulse-engine/src/platform/config.rs`
2. `systems/devpulse-engine/platform.default.toml`

**Verify:**
- `cargo check -p devpulse-engine`

---

## Wave 4: Config-Driven TOML — Kernel + Boot Wiring (Phase 3-4 of TOML plan)

**Goal:** Kernel accepts configurable subdirs. Engine boot reads from TOML.

| # | Task | File | Detail |
|---|------|------|--------|
| 4a | `ModelLoaderService::new()` accepts `subdirs: Vec<String>` | `kernel/model-loader/src/service.rs` | Replace hardcoded `["chat", "voice", "rag", "vision"]` |
| 4b | `boot()` accepts `models_dir` + `subdirs` from config | `platform/services/model_loader.rs` | Remove hardcoded `data_dir.join("models")` |
| 4c | Boot reads from config entry | `platform/boot/model_loader.rs` | `entry.build_slots()`, `entry.resolve_models_dir()`, `entry.subdir_paths()` |
| 4d | **DELETE** `integrations/slots.rs` | `integrations/slots.rs` | Hardcoded slots dead. Remove file + `mod` declaration. |
| 4e | Remove slots.rs mod declaration | `platform/integrations/mod.rs` or `platform/mod.rs` | Clean up mod tree |

**Files modified (5):**
1. `kernel/model-loader/src/service.rs`
2. `systems/devpulse-engine/src/platform/services/model_loader.rs`
3. `systems/devpulse-engine/src/platform/boot/model_loader.rs`
4. `systems/devpulse-engine/src/platform/integrations/slots.rs` (DELETE)
5. `systems/devpulse-engine/src/platform/integrations/mod.rs`

**Verify:**
- `cargo check -p model-loader`
- `cargo check -p devpulse-engine`

---

## Wave 5: Tauri Catalog Command + Frontend (Phase 5-6 of TOML plan)

**Goal:** Frontend gets catalog from Rust, not hardcoded SLOTS constant.

| # | Task | File | Detail |
|---|------|------|--------|
| 5a | `model_loader_catalog()` accessor | `platform/mod.rs` | Returns `&[CatalogEntry]` from boot config |
| 5b | `get_model_catalog` Tauri command | `commands/models/mod.rs` | Specta-typed, returns `Vec<CatalogEntry>` |
| 5c | Register in lib.rs | `lib.rs` | Add to `collect_commands!` |
| 5d | Delete hardcoded SLOTS from frontend | `ModelLoaderPanel.svelte` | Replace with reactive `commands.getModelCatalog()` fetch |
| 5e | Derive slotOrder from catalog | `ModelLoaderPanel.svelte` | No more hardcoded array |

**Files modified (4):**
1. `systems/devpulse-engine/src/platform/mod.rs`
2. `interfaces/desktop/src-tauri/src/commands/models/mod.rs`
3. `interfaces/desktop/src-tauri/src/lib.rs`
4. `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte`

**Verify:**
- `cargo check -p devpulse_desktop_backend`
- `pnpm svelte-check`

---

## Wave 6: GlobalDb Persistence (libSQL ConfigBackend)

**Goal:** Model preferences survive restarts.

| # | Task | File | Detail |
|---|------|------|--------|
| 6a | Implement `LibSqlConfig` | `platform/integrations/config.rs` | Wraps `RelationalService`, implements `ConfigBackend` trait. Uses `tokio::task::block_in_place` for sync bridge. |
| 6b | Add model_assignments schema | `platform/services/relational.rs` | `model_assignments` + `model_preferences` tables in SYSTEM_SCHEMA |
| 6c | Wire `LibSqlConfig` in boot | `platform/boot/model_loader.rs` | Pass `LibSqlConfig` instead of `MemoryConfig`. Requires relational service to boot first. |
| 6d | Verify restore_assignments on restart | Manual test | Boot → assign model → restart → verify assignment persists |

**Files modified (3):**
1. `systems/devpulse-engine/src/platform/integrations/config.rs`
2. `systems/devpulse-engine/src/platform/services/relational.rs`
3. `systems/devpulse-engine/src/platform/boot/model_loader.rs`

**Verify:**
- `cargo check -p devpulse-engine`
- Manual: restart app, verify slot assignments persist

---

## Wave 7: Voice Backend Commands (stub → real)

**Goal:** All 11 voice Tauri commands exist and are registered.

| # | Task | File | Detail |
|---|------|------|--------|
| 7a | Create `commands/voice/mod.rs` | NEW file | 11 Tauri commands: speak, stop_speaking, is_speaking, list_voices, preview_voice, test_microphone, transcribe_audio, list_voice_profiles, save_voice_profile, delete_voice_profile, activate_voice_profile |
| 7b | Add `pub mod voice;` | `commands/mod.rs` | Wire module |
| 7c | Register all 11 in lib.rs | `lib.rs` | Add to `collect_commands!` |
| 7d | Voice profile persistence | `platform/services/relational.rs` | Add `voice_profiles` table to USER_SCHEMA |

**NOTE:** The actual inference (Kokoro TTS, Whisper STT) depends on the model loader having those models loaded. Wave 7 wires the command layer. Actual audio I/O is a separate sprint (see POA&M).

**Files modified (4):**
1. `interfaces/desktop/src-tauri/src/commands/voice/mod.rs` (NEW)
2. `interfaces/desktop/src-tauri/src/commands/mod.rs`
3. `interfaces/desktop/src-tauri/src/lib.rs`
4. `systems/devpulse-engine/src/platform/services/relational.rs`

**Verify:**
- `cargo check -p devpulse_desktop_backend`

---

## Wave 8: 4-Card Consumer UI — Brain + Vision Cards

**Goal:** Replace slot-list UI with the consumer-grade 4-card layout (first 2 cards).

| # | Task | File | Detail |
|---|------|------|--------|
| 8a | Create `BrainCard.svelte` | NEW | Brain card: shows reasoning model, size selector ("Fast"/"Balanced"/"Smart"), download/load status, "Creativity" slider (maps to temperature), "Conversation memory" indicator (context window). Hides minion in layman view. |
| 8b | Create `VisionCard.svelte` | NEW | Vision card: "How Clyffy sees your screen". Auto-detects built-in VLM vs SigLIP2. Screenshot quality. Auto-capture toggle. |
| 8c | Refactor ModelLoaderPanel layout | `ModelLoaderPanel.svelte` | Replace flat slot list with 2x2 card grid. Import BrainCard + VisionCard. Keep existing download/load/swap logic. |

**Files modified (3):**
1. `interfaces/desktop/src/lib/domains/app/models/components/BrainCard.svelte` (NEW)
2. `interfaces/desktop/src/lib/domains/app/models/components/VisionCard.svelte` (NEW)
3. `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte`

**Verify:**
- `pnpm svelte-check`

---

## Wave 9: 4-Card Consumer UI — Voice + Memory Cards

**Goal:** Complete the 4-card layout.

| # | Task | File | Detail |
|---|------|------|--------|
| 9a | Create `VoiceCard.svelte` | NEW | Voice card: "Talk to Clyffy". STT shown as "Standard"/"High Quality"/"Best". TTS voice style selector. Preview button. Mic selection. Push-to-talk toggle. |
| 9b | Create `MemoryCard.svelte` | NEW | Memory card: "How much Clyffy remembers". Memory depth slider (maps to retrieval top-k). Shows embedder + reranker status as one unified "memory" system. |
| 9c | Wire Voice + Memory cards into grid | `ModelLoaderPanel.svelte` | Complete 2x2 grid with all 4 cards. |

**Files modified (3):**
1. `interfaces/desktop/src/lib/domains/app/models/components/VoiceCard.svelte` (NEW)
2. `interfaces/desktop/src/lib/domains/app/models/components/MemoryCard.svelte` (NEW)
3. `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte`

**Verify:**
- `pnpm svelte-check`

---

## Wave 10: Advanced View Toggle

**Goal:** Feature-flagged toggle shows full dev details.

| # | Task | File | Detail |
|---|------|------|--------|
| 10a | Add `advancedMode` rune state | `models.runes.svelte.ts` | Boolean toggle, persisted to GlobalDb |
| 10b | Conditional rendering in each card | All 4 card files | When advanced: show slot IDs, VRAM breakdown per slot, quant selection, tok/s, raw config |
| 10c | Settings toggle | `ModelLoaderPanel.svelte` | "Show advanced options" switch in panel header |

**Files modified (5):**
1. `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts`
2. `interfaces/desktop/src/lib/domains/app/models/components/BrainCard.svelte`
3. `interfaces/desktop/src/lib/domains/app/models/components/VisionCard.svelte`
4. `interfaces/desktop/src/lib/domains/app/models/components/VoiceCard.svelte`
5. `interfaces/desktop/src/lib/domains/app/models/components/MemoryCard.svelte`

**Verify:**
- `pnpm svelte-check`

---

## POA&M (Plan of Action & Milestones) — Items Beyond Wave Scope

These require infrastructure that doesn't exist yet. Tracked here, NOT blocked on.

| # | Item | Blocker | Target Wave/Sprint |
|---|------|---------|-------------------|
| P1 | Voice audio I/O (actual STT/TTS inference) | sherpa-rs FFI not built, Kokoro ONNX runtime not integrated | Separate sprint: SPRINT-VOICE-INFERENCE |
| P2 | Chat voice/mic buttons | Voice backend must work first (P1) | After voice inference sprint |
| P3 | First-run wizard | Needs hardware detection → config recommendation pipeline | Separate sprint: SPRINT-FIRST-RUN |
| P4 | "Go back to previous" undo | Needs config history table in GlobalDb | Wave 6 extension |
| P5 | Model update notifications | Needs HF API polling service + version comparison | Separate sprint: SPRINT-MODEL-UPDATES |
| P6 | Drag-and-drop sideloading (advanced view) | OS-level drag events → Tauri file drop handler | Wave 10 extension |
| P7 | tok/s metrics in advanced view | Inference must emit timing events | After voice inference sprint |
| P8 | SurrealDB fresh install failure | Path handling bug in SurrealKV (Windows backslashes) | Separate sprint: SPRINT-SURREALDB-FIX |
| P9 | Raw config.toml editing (advanced view) | Needs Tauri command to read/write TOML + Monaco/CodeMirror embed | Separate sprint |

---

## Dependency Graph

```
Wave 1 (bug fixes) ──────────────────────────┐
Wave 2 (styling) ─────────────────────────────┤
                                               ├─→ Wave 8 (Brain+Vision cards)
Wave 3 (TOML structs) → Wave 4 (boot wiring) ─┤      │
                              │                 │      ▼
                              ▼                 ├─→ Wave 9 (Voice+Memory cards)
                        Wave 5 (catalog cmd)    │      │
                                                │      ▼
Wave 6 (GlobalDb persistence) ─────────────────┤   Wave 10 (advanced toggle)
                                                │
Wave 7 (voice commands) ───────────────────────┘
```

**Parallel execution possible:**
- Waves 1 + 2 (independent)
- Waves 3 + 6 + 7 (independent Rust work)
- Waves 8 + 9 (after 5 completes, can run in sequence)

---

## Execution Rules

1. **Max 5 files per wave** — enforced
2. **Verify after every wave** — `cargo check` and/or `pnpm svelte-check`
3. **Each wave = 1 commit** — clean, atomic, descriptive message
4. **No stubs** — if it can't be fully built in this wave, it goes to POA&M
5. **Re-read before editing** — CC-002 countermeasure
6. **POA&M items get their own sprint docs** — not crammed into waves
7. **Use parallel agents** where wave dependencies allow

---

*This plan captures the full path from broken model loader to consumer-grade 4-card UX. Each wave is scoped, verified, and committed independently.*
