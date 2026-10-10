# Sprint: SPRINT-VOICE-SLOTS

**Date**: 2026-04-01
**Status**: APPROVED — all decision gates resolved
**Research**: `SPRINT-VOICE-SLOTS.research.md`
**Scope**: Voice slot config, model directory restructure, dead code deletion

---

## Locked Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Slot ID format | 2+ parts allowed | Hierarchy carries meaning. `voice.tts.*` prefix enables group queries. All downstream code handles it. |
| 2 | Slot struct fields | Generic on struct + `extensions: HashMap<String, String>` | `runtime`, `requires`, `default_model`, `overrides` are generic. `voice_profile`, `vad`, `n_gpu_layers`, `sample_rate` etc. go in extensions. |
| 3 | Coupled lifecycle | Enum variant + parent validation + warning | `Coupled { parent: String }`. Validate parent exists at startup. Full cascade deferred. |
| 4 | SNAC capability | New `AudioDecoding` variant | SNAC is a codec, not TTS. Clean separation prevents false capability matches. |
| 5 | Runtime enum | Merge `Ort`/`Sherpa` into `BackendType` | One enum, one place to look. No dual-enum confusion. |
| 6 | VoiceServiceEntry | DELETE — dead code | Never worked. Voice is fully slot-managed through Model Loader. |
| 7 | LlamaCpp = llama_ffi | Same thing | `devpulse-llama` wraps llama.cpp via FFI. `BackendType::LlamaCpp` IS the FFI binding. |

---

## Model Directory Layout (LOCKED)

```
.userdata/models/
├── chat/           ← chat.brain, minion.shared, minion.escalation
├── voice/          ← ALL voice slots (TTS, STT, SNAC)
├── rag/            ← rag.embedder, rag.reranker
├── vision/         ← vision.embedder
└── registry.json
```

Organized by PURPOSE, not format. Discovery walks all subdirs recursively.

---

## Phase 1: Dead Code Deletion (voice service)

Delete the entire old monolithic kokoros voice service.

### Files to DELETE:
- [ ] `systems/devpulse-engine/src/platform/boot/voice.rs` — kokoros boot stage
- [ ] `systems/devpulse-engine/src/platform/services/voice.rs` — VoiceService wrapper

### Code to REMOVE (not whole files):
- [ ] `config.rs:567-607` — `VoiceServiceEntry` struct, `Default` impl, `resolve_*` methods
- [ ] `config.rs:1074-1081` — `default_kokoros_kind()`, `default_kokoros_model_path()`, `default_kokoros_voices_path()`
- [ ] `config.rs:180` — `pub voice: VoiceServiceEntry` field on `SystemServicesConfig`
- [ ] `config.rs:206` — `voice: VoiceServiceEntry::default()` in `SystemServicesConfig::default()`
- [ ] `config.rs:950-952` — `ServiceRole::Voice` match arm in `is_enabled_and_critical()`
- [ ] `config.rs:993` — `voice_enabled: self.services.system.voice.enabled` in `to_database_config()`
- [ ] `config.rs:57` — `pub voice_enabled: bool` field on `DatabaseConfig`
- [ ] `mod.rs:63` — `use services::voice::VoiceService;` import
- [ ] `mod.rs:164` — `voice: Option<Arc<VoiceService>>` field on Platform struct
- [ ] `mod.rs:312` — `pub fn voice()` accessor
- [ ] `boot/mod.rs:72` — `use crate::platform::services::voice::VoiceService;`
- [ ] `boot/mod.rs:98` — `pub voice: Option<Arc<VoiceService>>` in BootResult
- [ ] `boot/mod.rs:229-246` — Stage 8 voice boot block
- [ ] `boot/mod.rs:336` — voice health check in boot validation
- [ ] `services/manifest.rs:93` — `ServiceRole::Voice` manifest entry
- [ ] `services/manifest.rs:154` — `ServiceRole::Voice => 8` sort order
- [ ] `platform.default.toml:80-86` — `[services.system.voice]` section
- [ ] `bindings.ts:552` — `voice_enabled: boolean` (auto-regenerates)
- [ ] `maestro/general.ts:31,42` — `voice_enabled` references

### Also check/remove:
- [ ] `ServiceRole::Voice` variant in the ServiceRole enum
- [ ] Any `#[cfg(feature = "kokoros")]` blocks that reference voice

---

## Phase 2: Type Changes (kernel/model-loader)

### 2.1 `slots/types.rs` — Slot struct + enums

- [ ] Relax `is_valid_id()`: `parts.len() >= 2` (was `== 2`)
- [ ] Add `RuntimeKind` field and new fields to `Slot`:
```rust
pub struct Slot {
    pub id: String,
    pub label: String,
    pub capability: ModelCapability,
    pub preferred_device: DevicePreference,
    pub loading: LoadingStrategy,
    pub assigned_model: Option<String>,
    pub fallback: Option<String>,
    // NEW:
    pub runtime: Option<BackendType>,
    pub default_model: Option<String>,
    pub requires: Vec<String>,
    pub overrides: Option<String>,
    pub extensions: HashMap<String, String>,
}
```
- [ ] Add `Coupled` variant to `LoadingStrategy`:
```rust
pub enum LoadingStrategy {
    Hot,
    Warm,
    OnDemand,
    Signal(String),
    Coupled { parent: String },
}
```
- [ ] Add `AudioDecoding` to `ModelCapability`:
```rust
pub enum ModelCapability {
    TextGeneration,
    Embedding,
    Reranking,
    VisionLanguage,
    VisionEmbedding,
    SpeechToText,
    TextToSpeech,
    AudioDecoding, // NEW — neural audio codecs (SNAC)
}
```

### 2.2 `models/registry.rs` — Format + Backend

- [ ] Add `Onnx` and `SherpaDir` to `ModelFormat`:
```rust
pub enum ModelFormat {
    Gguf,
    SafeTensors,
    Onnx,       // NEW — .onnx files (SNAC, small models)
    SherpaDir,  // NEW — sherpa model directories (Whisper, Kokoro)
}
```
- [ ] Add `Ort` and `Sherpa` to `BackendType`:
```rust
pub enum BackendType {
    Candle,
    LlamaCpp,
    Ort,    // NEW — onnxruntime via ort crate
    Sherpa, // NEW — sherpa-rs (Whisper STT, Kokoro TTS)
}
```

### 2.3 Re-exports
- [ ] `slots/mod.rs` — no new re-exports needed (BackendType already in `models/`)
- [ ] `lib.rs` — verify crate root re-exports include new types

### 2.4 Test updates
- [ ] `slots/registry.rs` tests — update `test_slot()` helper for new Slot fields (add defaults)
- [ ] `slots/fallback.rs` tests — update `slot()` helper for new Slot fields (add defaults)

---

## Phase 3: Discovery Restructure (kernel/model-loader)

### 3.1 Directory creation (`service.rs:50-53`)
- [ ] Replace `gguf/` + `safetensors/` with `chat/`, `voice/`, `rag/`, `vision/`
- [ ] Log each directory creation with self-identification:
  `[Model Loader] Created models/voice/ directory`

### 3.2 Discovery (`models/discovery.rs`)
- [ ] `discover_models()` — walk ALL subdirs recursively (not just `gguf/`)
- [ ] Add `discover_onnx()` — find `.onnx` files, build registry entries without GGUF header parsing
- [ ] Add `discover_sherpa_dirs()` — find sherpa model directories (contain `tokens.txt` or model config)
- [ ] `infer_capabilities()` — add `AudioDecoding` for SNAC-like architectures
- [ ] Every discovery step logs with:
  - Component: `component = "Model Loader"`
  - What it found: filename, format, size, subdirectory
  - Layman message: `"Found Orpheus voice model (3.2 GB)"`
  - Errors: full chain, never hidden

### 3.3 `ModelRegistryEntry` updates
- [ ] Support `format: Onnx` and `format: SherpaDir` in serialization
- [ ] ONNX entries: no GGUF header parsing, infer capabilities from filename/directory context
- [ ] Sherpa entries: represent the directory as the "path", model name from directory name

---

## Phase 4: DevPulse Slot Integration

### 4.1 `integrations/slots.rs` — replace 2 voice slots with 5
- [ ] Delete `voice.stt` and `voice.tts` slots
- [ ] Add 5 new voice slots matching owner spec:

```rust
// voice.tts.primary — Orpheus TTS (llama.cpp FFI)
Slot {
    id: "voice.tts.primary",
    label: "Clyffy Voice (Orpheus)",
    capability: ModelCapability::TextToSpeech,
    preferred_device: DevicePreference::Cpu,
    loading: LoadingStrategy::Signal("speech.requested"),
    assigned_model: None,
    fallback: Some("voice.tts.fallback"),
    runtime: Some(BackendType::LlamaCpp),
    default_model: Some("orpheus-3b-0.1-ft.Q8_0.gguf"),
    requires: vec!["voice.snac"],
    overrides: None,
    extensions: HashMap::from([
        ("voice_profile", "default"),
    ]),
}

// voice.snac — SNAC audio decoder (ort)
Slot {
    id: "voice.snac",
    label: "SNAC Audio Decoder",
    capability: ModelCapability::AudioDecoding,
    preferred_device: DevicePreference::Cpu,
    loading: LoadingStrategy::Coupled { parent: "voice.tts.primary" },
    assigned_model: None,
    fallback: None,
    runtime: Some(BackendType::Ort),
    default_model: Some("snac_24khz.onnx"),
    requires: vec![],
    overrides: None,
    extensions: HashMap::new(),
}

// voice.tts.fallback — Kokoro TTS (sherpa)
Slot {
    id: "voice.tts.fallback",
    label: "Clyffy Voice (Kokoro)",
    capability: ModelCapability::TextToSpeech,
    preferred_device: DevicePreference::Cpu,
    loading: LoadingStrategy::OnDemand,
    assigned_model: None,
    fallback: None,
    runtime: Some(BackendType::Sherpa),
    default_model: Some("Kokoro_espeak_Q8.gguf"),
    requires: vec![],
    overrides: None,
    extensions: HashMap::new(),
}

// voice.stt — Whisper STT (sherpa)
Slot {
    id: "voice.stt",
    label: "Speech Recognition",
    capability: ModelCapability::SpeechToText,
    preferred_device: DevicePreference::Cpu,
    loading: LoadingStrategy::Signal("voice.activated"),
    assigned_model: None,
    fallback: None,
    runtime: Some(BackendType::Sherpa),
    default_model: Some("sherpa-onnx-whisper-small"),
    requires: vec![],
    overrides: None,
    extensions: HashMap::from([
        ("vad", "silero"),
    ]),
}

// voice.stt.upgrade — Whisper Turbo (sherpa, GPU)
Slot {
    id: "voice.stt.upgrade",
    label: "Speech Recognition (Turbo)",
    capability: ModelCapability::SpeechToText,
    preferred_device: DevicePreference::Gpu,
    loading: LoadingStrategy::OnDemand,
    assigned_model: None,
    fallback: None,
    runtime: Some(BackendType::Sherpa),
    default_model: Some("whisper-large-v3-turbo"),
    requires: vec![],
    overrides: Some("voice.stt"),
    extensions: HashMap::new(),
}
```

### 4.2 Narration updates
- [ ] `narration.rs` — update `friendly_slot_name()` and `friendly_slot_purpose()`:

| Slot ID | Name | Purpose |
|---|---|---|
| `voice.tts.primary` | "Clyffy's Voice" | "speaking to you" |
| `voice.snac` | "Audio Decoder" | "converting voice signals to sound" |
| `voice.tts.fallback` | "Backup Voice" | "speaking when the main voice isn't available" |
| `voice.stt` | "Voice Input" | "listening to your voice" |
| `voice.stt.upgrade` | "Enhanced Voice Input" | "better voice recognition" |

### 4.3 TOML update
- [ ] `platform.default.toml` — delete `[services.system.voice]` section (Phase 1)

---

## Phase 5: Tauri Commands + Frontend

### 5.1 `commands/models/mod.rs`
- [ ] Update `SlotInfo` struct with new fields: `runtime`, `default_model`, `requires`, `overrides`
- [ ] Update `get_slots()` mapping to populate new fields

### 5.2 Frontend narration
- [ ] `models.types.ts` — update `friendlySlotLabel()` and `friendlySlotPurpose()` maps

### 5.3 Frontend config
- [ ] `maestro/general.ts` — remove `voice_enabled` field

---

## Verification

After each phase:
- [ ] `cargo check -p model-loader` — Phase 2, 3
- [ ] `cargo check -p devpulse-engine` — Phase 1, 4
- [ ] `cargo check -p devpulse-desktop` — Phase 5
- [ ] `cargo test -p model-loader` — Phase 2, 3
- [ ] `pnpm svelte-check` — Phase 5

---

## Deferred (separate sprints)

- Backend implementations (ort bridge, sherpa bridge, llama FFI bridge)
- Coupled cascade logic in `load_slot()` / `unload_slot()` (loads SNAC when Orpheus loads)
- Override resolver (`voice.stt.upgrade` → `voice.stt` swap based on availability + VRAM)
- TOML slot parsing into `PlatformBootConfig` (slots as TOML-configurable)
- Migration of `system/candle/embedder/` and `system/candle/whisper/` into `models/rag/` and `models/voice/`
