# Research: Voice Slot Configuration Update

**Date**: 2026-04-01
**Sprint**: SPRINT-VOICE-SLOTS
**Status**: REVIEW_REQUIRED

---

## SSOT Map

| Type/Concept | Authoritative Location | Notes |
|---|---|---|
| `Slot` struct | `kernel/model-loader/src/slots/types.rs:9-33` | 7 fields: id, label, capability, preferred_device, loading, assigned_model, fallback |
| `LoadingStrategy` enum | `kernel/model-loader/src/slots/types.rs:70-81` | 4 variants: Hot, Warm, OnDemand, Signal(String) |
| `DevicePreference` enum | `kernel/model-loader/src/slots/types.rs:56-67` | 4 variants: Gpu, Cpu, GpuWithCpuFallback, Any |
| `ModelCapability` enum | `kernel/model-loader/src/slots/types.rs:36-53` | 7 variants: TextGeneration, Embedding, Reranking, VisionLanguage, VisionEmbedding, SpeechToText, TextToSpeech |
| `BackendType` enum | `kernel/model-loader/src/models/registry.rs:18-25` | 2 variants: Candle, LlamaCpp |
| `Slot::is_valid_id()` | `kernel/model-loader/src/slots/types.rs:91-95` | Requires EXACTLY 2 parts (one `.` separator) |
| `Slot::subsystem()` | `kernel/model-loader/src/slots/types.rs:86-88` | Takes everything before first `.` |
| `SlotRegistry` | `kernel/model-loader/src/slots/registry.rs` | HashMap<String, Slot>, uses `is_valid_id` on register |
| Default slot config | `systems/devpulse-engine/src/platform/integrations/slots.rs` | 8 slots: chat.brain, minion.shared, minion.escalation, rag.embedder, rag.reranker, vision.embedder, voice.stt, voice.tts |
| TOML config | `systems/devpulse-engine/platform.default.toml` | No `[slots]` section. Has `[services.system.voice]` (kokoros, disabled) |
| Config deserialization | `systems/devpulse-engine/src/platform/config.rs` | `VoiceServiceEntry` — kokoros-specific (enabled, critical, kind, model_path, voices_path). `ModelLoaderServiceEntry` — just enabled+critical |
| Boot pipeline | `systems/devpulse-engine/src/platform/boot/model_loader.rs` | Calls `devpulse_default_slots()` → `ModelLoaderService::boot()` |
| Engine service wrapper | `systems/devpulse-engine/src/platform/services/model_loader.rs` | Wraps `Inner` in `Mutex`, calls `register_slots(default_slots)` |
| Tauri commands | `interfaces/desktop/src-tauri/src/commands/models/mod.rs` | `SlotInfo` struct (id, label, capability, preferred_device, loading_strategy, assigned_model_id, fallback) — maps Slot to strings |
| Frontend bindings | `interfaces/desktop/src/lib/sys/generated/bindings.ts:904-932` | Auto-generated `SlotInfo` type |
| Frontend narration (Rust) | `systems/devpulse-engine/src/platform/integrations/narration.rs:152-178` | Hardcoded `friendly_slot_name` and `friendly_slot_purpose` for `voice.stt` and `voice.tts` |
| Frontend narration (TS) | `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts:197-224` | Hardcoded `friendlySlotLabel` and `friendlySlotPurpose` for `voice.stt` and `voice.tts` |
| Frontend grouping | `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts:152` | Groups by `s.id.split(".")[0]` — works for 3-part IDs |
| Subsystem labels | `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts:160-168` | `voice: "Voice"` — works |
| Fallback resolution | `kernel/model-loader/src/slots/fallback.rs` | Walks `slot.fallback` chain. Cycle detection. Max depth 5 |
| Config persistence | `kernel/model-loader/src/service.rs:264-295` | Key format: `slot.{slot_id}.model`. Parses with `strip_prefix("slot.")` + `strip_suffix(".model")` |
| Backend routing | `kernel/model-loader/src/backends/router.rs` | Only knows Candle vs LlamaCpp. No ort, no sherpa |
| Inference bridge | `kernel/model-loader/src/backends/bridge.rs` | Candle-only. `InferenceBridge::spawn_candle()` |
| Backend pool | `kernel/model-loader/src/backends/pool.rs` | Only `#[cfg(feature = "candle-backend")]` acquire path |
| LoadParams | `kernel/model-loader/src/loading/states.rs:30-39` | Has `gpu_layers: Option<u32>` already |

---

## Flags & Conflicts

### FLAG 1 (CRITICAL): `Slot::is_valid_id()` rejects 3-part IDs

**Current**: `parts.len() == 2` — only allows `subsystem.purpose` format.
**New IDs**: `voice.tts.primary`, `voice.tts.fallback`, `voice.stt.upgrade` — 3 parts.
**Impact**: `SlotRegistry::register_slot()` will **reject all 3-part IDs** with error.
**Fix**: Change validation to `parts.len() >= 2`.
**Test breakage**: `reject_invalid_id` test uses `"nope"` (1-part) — still passes. But need to verify existing tests don't assert 2-parts-only.

### FLAG 2 (CRITICAL): Config persistence key parsing breaks with 3-part IDs

**Current**: `service.rs:273-274`:
```rust
slot_id = key.strip_prefix("slot.").and_then(|s| s.strip_suffix(".model"))
```
For key `slot.voice.tts.primary.model`, this yields `voice.tts.primary` — **this actually works correctly** because `strip_prefix` and `strip_suffix` are not split-based. They strip literal prefixes/suffixes.

**Verdict**: No issue. The parsing is string-based, not dot-split-based.

### FLAG 3 (MAJOR): New `runtime` field doesn't exist on `Slot`

**Requested runtimes**: `llama_ffi`, `ort`, `sherpa`
**Current `BackendType`**: Only `Candle` and `LlamaCpp`
**Current `BackendPool`**: Only has `#[cfg(feature = "candle-backend")]` acquire path
**Current inference bridge**: Only `spawn_candle()`

**Reality**: The model-loader crate is currently Candle-only for inference. It has no `ort` runtime, no `sherpa` runtime. The `runtime` field on slots declares INTENT — which backend SHOULD load this model — but the actual backend implementations don't exist yet.

**Decision needed**: Do we:
- (A) Add `runtime` as a field on `Slot` now (declare intent, error at load time if backend not compiled), or
- (B) Keep `runtime` out of `Slot` and only put it in TOML config as documentation/future intent, or
- (C) Add `RuntimeKind` enum to slot types AND stub the backend routing to error gracefully?

### FLAG 4 (MAJOR): `Coupled` loading strategy is a new lifecycle concept

**Current strategies**: Hot (always loaded), Warm (proactive), OnDemand (lazy), Signal(String) (event-triggered).
**New**: `Coupled` — lifecycle bound to a parent slot. SNAC loads when Orpheus loads, unloads when Orpheus unloads.

**This is not just a new enum variant.** It requires:
1. New `LoadingStrategy::Coupled { parent: String }` variant (needs parent slot ID)
2. The loading pipeline must propagate load/unload to coupled children
3. `ModelLoaderService::load_slot()` must check for `requires` and co-load dependents
4. `ModelLoaderService::unload_slot()` must cascade to coupled children

**Decision needed**: Do we:
- (A) Add full `Coupled` lifecycle now (both enum variant AND load/unload cascading), or
- (B) Add the enum variant only, with a TODO for the cascade logic, or
- (C) Model coupled slots as `Signal("voice.tts.primary.loaded")` (piggyback on existing Signal mechanism)?

### FLAG 5 (MAJOR): New fields on Slot that don't map to existing struct

The user's TOML config has fields that don't exist on `Slot`:

| Field | Proposed | Exists? | Notes |
|---|---|---|---|
| `runtime` | `llama_ffi`, `ort`, `sherpa` | NO | See FLAG 3 |
| `model` | `orpheus-3b-0.1-ft.Q8_0.gguf` | Partially — `assigned_model` exists but it's a registry ID, not a filename | Could pre-populate `assigned_model` |
| `n_gpu_layers` | `0`, `99` | NO on Slot, YES on `LoadParams.gpu_layers` | Move to slot config? Or keep as load-time param? |
| `voice_profile` | `default` | NO | Voice-specific. Doesn't belong on generic `Slot` |
| `requires` | `["voice.snac"]` | NO | Co-dependency declaration. Related to `Coupled` strategy |
| `overrides` | `"voice.stt"` | NO | Upgrade path: replaces default slot when available |
| `vad` | `"silero"` | NO | Voice-specific config |

**Decision needed**: Which fields belong on the generic `Slot` struct vs. a voice-specific extension?

Options:
- (A) Add ALL fields to `Slot` as `Option<T>` — simple, but bloats the generic struct with voice-specific concerns
- (B) Add `runtime` and `n_gpu_layers` and `requires` to `Slot` (they're generic). Keep `voice_profile`, `vad`, `overrides` in a separate `SlotExtensions` map (`HashMap<String, String>`)
- (C) Add an `extensions: HashMap<String, serde_json::Value>` to `Slot` for domain-specific config

### FLAG 6 (MODERATE): `ModelCapability` missing `AudioDecoding`

SNAC is an audio decoder (neural audio codec), not TTS or STT. Current `ModelCapability` has:
- `SpeechToText` — for Whisper (STT)
- `TextToSpeech` — for Orpheus/Kokoro (TTS)
- No `AudioDecoding` or `AudioCodec` variant

**Decision needed**: Add `AudioDecoding` variant for SNAC? Or reuse `TextToSpeech` since SNAC is part of the TTS pipeline?

### FLAG 7 (MODERATE): `BackendType` missing `Ort` and `Sherpa`

Current: `Candle`, `LlamaCpp`.
Needed: `Ort` (for SNAC ONNX), `Sherpa` (for Kokoro and Whisper via sherpa-rs), `LlamaFfi` (distinct from `LlamaCpp`? Or same thing?).

**Note**: `LlamaCpp` in the codebase may already mean "llama.cpp via FFI" — need to clarify if `llama_ffi` in the user's spec is the same as existing `LlamaCpp` or different.

### FLAG 8 (MODERATE): Narration maps are hardcoded

Both `narration.rs` (Rust) and `models.types.ts` (TS) have hardcoded maps for:
- `voice.stt` → "Voice Input"
- `voice.tts` → "Voice Output"

These need updating for the 5 new slot IDs. The old IDs (`voice.stt`, `voice.tts`) will no longer exist.

### FLAG 9 (LOW): `VoiceServiceEntry` in config.rs is kokoros-specific

The current `VoiceServiceEntry` has `kind: "kokoros"`, `model_path`, `voices_path`. This was for the old monolithic voice service. With the new slot-based voice architecture, voice models are managed by the Model Loader via slots, not by a separate voice service.

**Decision needed**: 
- (A) Delete `VoiceServiceEntry` and `[services.system.voice]` entirely — voice is now slot-managed
- (B) Keep it as a service toggle but strip the kokoros-specific fields
- (C) Repurpose it as the voice subsystem enable/disable flag

### FLAG 10 (LOW): TOML `[slots]` section doesn't exist in config deserialization

`PlatformBootConfig` has no `slots` field. The TOML the user provided has `[slots.voice_tts_primary]` etc. Two options:
- (A) Add `slots: HashMap<String, SlotToml>` to `PlatformBootConfig` and parse TOML → Slot conversion
- (B) Keep slots in Rust code only (`devpulse_default_slots()`) and use TOML only as documentation

### FLAG 11 (LOW): Fallback chain slot ID reference

User spec: `voice.tts.primary` has `fallback = "voice.tts.fallback"`. The fallback system in `fallback.rs` already supports this — it just walks `slot.fallback` pointers. Works with any valid slot ID. No issue.

### FLAG 12 (INFO): `overrides` is a new concept

`voice.stt.upgrade` has `overrides = "voice.stt"` — meaning when the upgrade model is available AND VRAM permits, it replaces the default. This is a new concept not in the current codebase. It's an upgrade/replacement mechanism.

**This is non-trivial**: requires a resolver that checks model availability + VRAM + swaps slot assignment. Not just config.

---

## STOP — Owner Decision Required (6 decisions)

### STOP 1: Slot ID format
**Question**: Relax `is_valid_id` from exactly 2 parts to 2+ parts?
**Options**: 
- (A) Allow 2+ parts (`voice.tts.primary` is valid)
- (B) Keep 2 parts, flatten IDs to `voice-tts-primary` (single dot: `voice.tts-primary`)
**Impact**: Validation, subsystem extraction, frontend grouping, config key parsing
**Recommendation**: (A) — all downstream code already handles this correctly

### STOP 2: New fields on Slot
**Question**: Which of `runtime`, `model`, `n_gpu_layers`, `voice_profile`, `requires`, `overrides`, `vad` go on the `Slot` struct?
**Options**:
- (A) Add `runtime: Option<RuntimeKind>`, `n_gpu_layers: Option<u32>`, `requires: Vec<String>` to Slot. Voice-specific fields in extensions map.
- (B) Add ALL as `Option<T>` on Slot
- (C) Add `extensions: HashMap<String, serde_json::Value>` catch-all
**Impact**: Slot struct size, specta TypeScript generation, every place Slot is constructed/consumed
**Recommendation**: (A) — `runtime`, `n_gpu_layers`, `requires` are genuinely generic. Voice-specific fields are not.

### STOP 3: `Coupled` loading strategy
**Question**: Full lifecycle cascade now, or enum variant only?
**Options**:
- (A) Full cascade (load_slot loads dependents, unload cascades)
- (B) Enum variant + TODO
- (C) Model as `Signal("parent.loaded")`
**Impact**: `service.rs` load/unload paths, test coverage, boot sequence
**Recommendation**: (B) for this sprint — the enum variant and the slot registration are the config concern. Cascade logic is a separate sprint.

### STOP 4: New `ModelCapability` variant for SNAC
**Question**: Add `AudioDecoding`/`AudioCodec`?
**Options**:
- (A) Add `AudioDecoding` variant
- (B) Reuse `TextToSpeech` (SNAC is part of TTS pipeline)
**Impact**: Capability filtering, model-to-slot compatibility, discovery `infer_capabilities()`
**Recommendation**: (A) — SNAC is architecturally distinct from TTS models

### STOP 5: New `BackendType` / `RuntimeKind` variants
**Question**: What runtimes to add?
**Options**:
- (A) Add `Ort` and `Sherpa` to `BackendType`. Rename existing `LlamaCpp` to clarify.
- (B) Create separate `RuntimeKind` enum on Slot (decoupled from `BackendType`)
- (C) Keep `BackendType` for inference routing, add `RuntimeKind` to Slot for config declaration
**Impact**: Backend routing, pool acquire, bridge spawning, specta types
**Recommendation**: (C) — `RuntimeKind` is a slot config concern (what runtime SHOULD load this). `BackendType` is a model registry concern (what CAN load this). They serve different purposes. RuntimeKind values: `Candle`, `LlamaFfi`, `Ort`, `Sherpa`.

### STOP 6: `VoiceServiceEntry` and TOML slots
**Question**: How to handle voice service config vs slot-based voice?
**Options**:
- (A) Delete `VoiceServiceEntry`, add `[slots]` to TOML, parse into `Slot` structs
- (B) Keep `VoiceServiceEntry` as enable/disable toggle, slots stay in Rust code
- (C) Replace `VoiceServiceEntry` with a `voice_enabled: bool` field on `ModelLoaderServiceEntry`
**Impact**: Config deserialization, boot pipeline, TOML structure
**Recommendation**: (B) for now — adding TOML slot deserialization is a larger change. The slots in Rust code (`devpulse_default_slots()`) are the SSOT for slot definitions. The TOML the user provided documents the intent and will be referenced in comments.

---

## Files Requiring Changes (By Decision Outcome)

### Always needed (regardless of decisions):
1. `kernel/model-loader/src/slots/types.rs` — relax `is_valid_id`, add `Coupled` variant
2. `systems/devpulse-engine/src/platform/integrations/slots.rs` — replace 2 voice slots with 5
3. `systems/devpulse-engine/src/platform/integrations/narration.rs` — update friendly name maps
4. `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts` — update friendly name maps
5. `kernel/model-loader/src/slots/fallback.rs` — update test helper `slot()` if Slot struct changes

### Conditional on decisions:
6. `kernel/model-loader/src/slots/types.rs` — new fields on Slot (STOP 2), RuntimeKind enum (STOP 5)
7. `kernel/model-loader/src/slots/mod.rs` — re-export new types
8. `kernel/model-loader/src/lib.rs` — re-export at crate root
9. `kernel/model-loader/src/models/registry.rs` — BackendType additions (STOP 5)
10. `kernel/model-loader/src/models/discovery.rs` — AudioDecoding capability (STOP 4)
11. `kernel/model-loader/src/slots/registry.rs` — test helper update
12. `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — SlotInfo struct (new fields)
13. `systems/devpulse-engine/platform.default.toml` — slot documentation comments (STOP 6)
14. `systems/devpulse-engine/src/platform/config.rs` — VoiceServiceEntry changes (STOP 6)

### NOT needed this sprint:
- Backend pool / bridge / router changes (runtime backends don't exist yet)
- `service.rs` load/unload cascade (STOP 3 deferred)
- `overrides` resolution logic (FLAG 12 — separate sprint)
- Frontend bindings.ts (auto-generated by specta — rebuilds automatically)

---

## Anti-Pattern Risks

1. **Bloating `Slot` with voice-specific fields** — violates model-loader's "zero DevPulse dependencies" principle
2. **Adding runtime backends that don't compile** — dead code paths, false sense of progress
3. **TOML config that's never parsed** — documentation drift
4. **Hardcoding slot IDs in narration without a pattern** — will break again when slots change
5. **Adding `Coupled` cascade without tests** — subtle lifecycle bugs

---

## Recommendations

1. Relax `is_valid_id` to 2+ parts
2. Add `RuntimeKind` enum, `Coupled` variant, generic fields (`runtime`, `n_gpu_layers`, `requires`) to `Slot`
3. Add `AudioDecoding` to `ModelCapability`
4. Replace the 2 voice slots with 5 in `devpulse_default_slots()`
5. Update narration maps (Rust + TS)
6. Keep TOML changes minimal — add comments documenting the slot config spec
7. Defer: runtime backend implementations, coupled cascade, overrides resolver
