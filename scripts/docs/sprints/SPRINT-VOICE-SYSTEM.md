# Sprint: SPRINT-VOICE-SYSTEM

**Date**: 2026-04-02
**Status**: DRAFT — awaiting owner approval
**Depends on**: SPRINT-VOICE-SLOTS (DONE), SPRINT-VOICE-PIPELINE (APPROVED)
**Scope**: Standby state machine, voice readiness toggles, voice profiles, SigLIP HD, Kokoro voice packs
**Research base**: SPRINT-VOICE-PIPELINE.research.md, SPRINT-VOICE-SLOTS.research.md

---

## Problem Statement

When the user loads DevPulse, they expect to immediately start training and using Clyffy's voice.
Today: zero voice training infra, TTS backends are stubs (return silence), no standby state,
SigLIP is the NQVP quant (low-res, bad for screenshots).

---

## Locked Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | 5-state readiness model: Off, Cold, Standby, Warm, Hot | Maps to user's exact mental model. Standby = weights resident, no warmup pass. |
| 2 | Standby stops after LoadingWeights — skips WarmingUp | Weights in memory = ~70% of load time saved on activation. |
| 3 | **Kokoro is PRIMARY TTS** — lighter, faster, supports voice packs | Orpheus is secondary (heavier, higher quality, future consideration). |
| 4 | Kokoro voice packs for custom voice creation | No ML training needed. Record samples → extract style tensor → load at runtime. |
| 5a | Slot layout: voice.tts.primary=Kokoro, voice.tts.secondary=Orpheus | Kokoro needs no SNAC co-load. Orpheus remains wired but OnDemand. |
| 5 | SigLIP2-SO400M-384-HD replaces SigLIP2 NQVP | 384px patches. ~400M params. Much better screenshot/screen awareness. |
| 6 | Voice profiles stored in `.userdata/voice-profiles/` | JSON + optional .npz voice style tensor. Portable with the app. |
| 7 | User toggle per slot via Tauri command | `set_slot_readiness(slot_id, level)` — UI drives the state. |
| 8 | All Rust. No Python. No exceptions. | Kokoros crate is pure Rust+ONNX. Voice pack extraction via ort. |

---

## Existing Code Inventory

### DONE (committed, compiles)

| Component | File | Status |
|-----------|------|--------|
| Slot system (11 slots, 5 voice) | `integrations/slots.rs` | Working |
| ModelStatus state machine | `loading/states.rs` | Working (needs Standby) |
| LoadingStrategy enum | `slots/types.rs` | Working (needs Standby) |
| Orpheus TTS struct + token pipeline | `backends/orpheus.rs` | Compiles, synthesize() returns dummy silence |
| SNAC decoder (ort) | `backends/ort/snac.rs` | Compiles, ort session wired |
| Kokoro TTS struct | `backends/ort/kokoro.rs` | Compiles, stub (no ort session) |
| Whisper STT struct | `backends/ort/whisper.rs` | Compiles, stub (no ort session) |
| Audio playback service | `engine/services/audio.rs` | Working (rodio + flume) |
| Inference bridge (flume) | `backends/bridge.rs` | Working |
| KokorosAdapter (cortex) | `cortex/persistence/kokoros.rs` | Working (wraps `kokoros` crate) |
| Voice traits (TTS/STT/AudioDecoder) | `backends/voice.rs` | Working |
| Slot registry + fallback chain | `slots/registry.rs`, `slots/fallback.rs` | Working |
| Coupled lifecycle (load_slot_with_deps) | `service.rs:540+` | Working |
| Vision slot (SigLIP) | `integrations/slots.rs:88-101` | Config only, needs model update |

### TODO Placeholders (return silence/empty)

| Component | File | Line | What's Missing |
|-----------|------|------|----------------|
| Orpheus synthesize() | `orpheus.rs:213-228` | Full pipeline: InferenceHandle generate → token extract → SNAC decode |
| Kokoro TTS | `kokoro.rs:50-51,88-91` | ort::Session creation, inference, tokenization |
| Whisper STT | `whisper.rs:64-68,118-125` | ort::Session creation, mel spectrogram, encoder/decoder loop |
| Signal emission (speech.requested) | — | Not wired. Signal fires but nothing subscribes. |
| Microphone capture (cpal) | — | Not started. |

---

## Phase 1: Standby State Machine (3 files)

### Goal
Add `Standby` to the model lifecycle. Weights loaded in memory, session created, but no warmup
forward pass. Activation from standby = run warmup only (~100-500ms vs 5-30s cold boot).

### 1.1 `kernel/model-loader/src/loading/states.rs`

Add `Standby` variant to `ModelStatus`:

```rust
pub enum ModelStatus {
    NotLoaded,
    Loading { stage: LoadingStage, progress_pct: f32 },
    Standby { footprint: MemoryFootprint },  // NEW — weights resident, not warmed up
    Loaded { footprint: MemoryFootprint },
    Failed { error: String },
    Unloading,
}
```

No changes to `LoadingStage` — `WarmingUp` and `Ready` stages still exist. Standby = loaded through
`LoadingTokenizer` stage, then stopped.

### 1.2 `kernel/model-loader/src/slots/types.rs`

Add `Standby` variant to `LoadingStrategy`:

```rust
pub enum LoadingStrategy {
    Hot,                          // Loaded + warmed on boot, stays active
    Warm,                         // Loaded + warmed proactively when conditions suggest need
    Standby,                      // NEW — weights loaded on boot, warmup deferred to first request
    OnDemand,                     // Cold — nothing loaded until first request
    Signal(String),               // Load when signal fires
    Coupled { parent: String },   // Parent controls lifecycle
}
```

### 1.3 `kernel/model-loader/src/service.rs`

Add two new methods:

```rust
/// Load a slot to standby — weights in memory, session created, no warmup.
/// Faster activation than cold boot (~100-500ms vs 5-30s).
pub async fn load_slot_to_standby(&mut self, slot_id: &str) -> Result<(), LoaderError> {
    // Same as load_slot() but:
    // 1. Set status to Loading { stage: Allocating, progress_pct: 10.0 }
    // 2. Acquire from pool (loads weights)
    // 3. Set status to Standby { footprint } instead of Loaded
    // 4. Skip warmup forward pass
    // 5. Store handle in slot_handles
}

/// Activate a slot from standby — run warmup pass, transition to Loaded.
pub async fn activate_from_standby(&mut self, slot_id: &str) -> Result<(), LoaderError> {
    // 1. Verify slot is in Standby state
    // 2. Set status to Loading { stage: WarmingUp, progress_pct: 90.0 }
    // 3. Run warmup forward pass via InferenceHandle
    // 4. Set status to Loaded { footprint }
}
```

Update `load_slot_with_deps()` to respect `LoadingStrategy::Standby`:
- If strategy is `Standby`, call `load_slot_to_standby()` instead of `load_slot()`
- On first inference request, auto-activate from standby

### 1.4 Verify

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] `cargo check -p devpulse-engine` — 0 errors (uses ModelStatus via re-export)

---

## Phase 2: Readiness Toggles (2 files)

### Goal
User-facing control over per-slot readiness level. The 5 states:

| Level | Enum | Behavior | VRAM/RAM |
|-------|------|----------|----------|
| Off | `Off` | Slot disabled. Model unassigned. | 0 |
| Cold | `Cold` | Assigned but not loaded. Loads on first request. | 0 |
| Standby | `Standby` | Weights in memory, no warmup. Fast activation. | Full weight size |
| Warm | `Warm` | Fully loaded + warmed. Ready for inference. | Full weight size |
| Hot | `Hot` | Warm + stays loaded permanently. Never unloads. | Full weight size |

### 2.1 `kernel/model-loader/src/slots/types.rs`

Add readiness enum (separate from `LoadingStrategy` — strategy is default, readiness is current user choice):

```rust
/// User-facing readiness level for a slot.
/// This is the CURRENT requested state, not the boot-time default.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
pub enum SlotReadiness {
    Off,
    Cold,
    Standby,
    Warm,
    Hot,
}
```

Add `readiness: SlotReadiness` field to `Slot`.

### 2.2 `kernel/model-loader/src/service.rs`

Add readiness transition method:

```rust
/// Set the readiness level for a slot. Triggers state transitions.
///
/// Off → Cold:     Unload if loaded. Keep assignment.
/// Cold → Standby: Load weights, skip warmup.
/// Standby → Warm: Run warmup pass.
/// Warm → Hot:     Mark as permanent (skip idle unload).
/// Hot → Warm:     Allow idle unload.
/// Warm → Cold:    Unload fully.
/// Cold → Off:     Unassign model.
pub async fn set_slot_readiness(
    &mut self,
    slot_id: &str,
    level: SlotReadiness,
) -> Result<(), LoaderError> {
    // Validate transition
    // Execute state change (load/unload/activate as needed)
    // Persist readiness to config
    // Emit event for UI
}
```

### 2.3 Tauri command

File: `interfaces/desktop/src-tauri/src/commands/models/mod.rs`

```rust
#[tauri::command]
#[specta::specta]
pub async fn set_slot_readiness(
    slot_id: String,
    level: SlotReadiness,
    state: State<'_, PlatformHandle>,
) -> Result<(), String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn get_slot_readiness(
    slot_id: String,
    state: State<'_, PlatformHandle>,
) -> Result<SlotReadiness, String> { ... }
```

### 2.4 Verify

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors

---

## Phase 3: Voice Profiles (3 files, 1 new)

### Goal
Named voice configurations that compose voice + emotion + speed + style. Clyffy's default
personality = a specific voice profile. Users create custom profiles.

### 3.1 New file: `kernel/model-loader/src/voice/profiles.rs`

```rust
/// A named voice configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceProfile {
    /// Profile ID (e.g., "clyffy-default", "user-custom-1").
    pub id: String,
    /// Display name.
    pub name: String,
    /// Which TTS backend this profile targets.
    pub backend: VoiceBackendTarget,
    /// Voice name (Orpheus: "tara"/"leah"/etc, Kokoro: style name).
    pub voice: String,
    /// Default emotion tags to inject (Orpheus only).
    pub emotion_tags: Vec<String>,
    /// Speech speed multiplier (1.0 = normal).
    pub speed: f32,
    /// Optional: path to Kokoro voice style tensor (.npz).
    /// When set, Kokoro loads this style instead of built-in voices.
    pub style_tensor_path: Option<String>,
    /// Profile description for UI.
    pub description: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum VoiceBackendTarget {
    Orpheus,
    Kokoro,
}

/// Clyffy's built-in voice profiles.
/// Kokoro profiles are primary — lighter, faster, support voice packs.
/// Orpheus profiles are secondary — higher quality, heavier, OnDemand.
pub fn default_profiles() -> Vec<VoiceProfile> {
    vec![
        // ── Kokoro (Primary) ──────────────────────────────────
        VoiceProfile {
            id: "clyffy-default".into(),
            name: "Clyffy".into(),
            backend: VoiceBackendTarget::Kokoro,
            voice: "af_heart".into(),
            emotion_tags: vec![],
            speed: 1.0,
            style_tensor_path: None,
            description: "Clyffy's default voice — clear, natural, responsive.".into(),
        },
        VoiceProfile {
            id: "clyffy-warm".into(),
            name: "Clyffy (Warm)".into(),
            backend: VoiceBackendTarget::Kokoro,
            voice: "af_bella".into(),
            emotion_tags: vec![],
            speed: 0.95,
            style_tensor_path: None,
            description: "Warmer, softer tone for longer conversations.".into(),
        },
        VoiceProfile {
            id: "clyffy-bright".into(),
            name: "Clyffy (Bright)".into(),
            backend: VoiceBackendTarget::Kokoro,
            voice: "af_sky".into(),
            emotion_tags: vec![],
            speed: 1.05,
            style_tensor_path: None,
            description: "Energetic, upbeat tone.".into(),
        },
        // ── Orpheus (Secondary — OnDemand) ────────────────────
        VoiceProfile {
            id: "clyffy-premium".into(),
            name: "Clyffy (Premium)".into(),
            backend: VoiceBackendTarget::Orpheus,
            voice: "tara".into(),
            emotion_tags: vec![],
            speed: 1.0,
            style_tensor_path: None,
            description: "Premium voice — deeper, more expressive. Heavier model.".into(),
        },
        VoiceProfile {
            id: "clyffy-premium-casual".into(),
            name: "Clyffy (Premium Casual)".into(),
            backend: VoiceBackendTarget::Orpheus,
            voice: "jess".into(),
            emotion_tags: vec!["<chuckle>".into()],
            speed: 1.05,
            style_tensor_path: None,
            description: "Relaxed premium voice with emotion support.".into(),
        },
    ]
}
```

### 3.2 `kernel/model-loader/src/voice/mod.rs`

New module:

```rust
pub mod profiles;
pub use profiles::{VoiceProfile, VoiceBackendTarget};
```

### 3.3 Profile persistence

Storage: `.userdata/voice-profiles/`
- `profiles.json` — array of VoiceProfile
- `styles/` — Kokoro .npz voice style tensors

### 3.4 Wire to OrpheusTts

Update `synthesize()` to accept `VoiceProfile` instead of bare `voice: &str`:

```rust
pub trait TtsBackend: Send {
    fn synthesize(&self, text: &str, profile: &VoiceProfile) -> anyhow::Result<AudioSamples>;
    // ... rest unchanged
}
```

OrpheusTts extracts `profile.voice` and `profile.emotion_tags` to build prompt.
KokoroTts uses `profile.voice` as style name, `profile.speed` for speed, `profile.style_tensor_path` for custom styles.

### 3.5 Verify

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] Profiles serialize/deserialize round-trip

---

## Phase 4: Kokoro Voice Pack Pipeline (2 files)

### Goal
Enable custom voice creation without ML training. Kokoro supports loadable voice style tensors.
User records samples → extract style embedding → save as voice pack → load at runtime.

### 4.1 Kokoro ort session (finish the stub)

File: `kernel/model-loader/src/backends/ort/kokoro.rs`

- [ ] Add `session: Option<ort::session::Session>` field (currently commented out)
- [ ] `load()`: create `ort::Session::builder()?.commit_from_file(path)?`
- [ ] `synthesize()`: tokenize input, run ort inference, extract PCM output
- [ ] `unload()`: drop session

### 4.2 Voice style extraction

File: `kernel/model-loader/src/voice/style_extractor.rs`

```rust
/// Extract a Kokoro voice style tensor from reference audio samples.
///
/// Takes 5-30 seconds of reference audio, runs it through Kokoro's
/// style encoder, and produces a .npz style tensor that can be loaded
/// at runtime for custom voice synthesis.
pub struct StyleExtractor {
    encoder_session: Option<ort::session::Session>,
}

impl StyleExtractor {
    /// Load the style encoder model.
    pub fn load(encoder_path: &Path) -> anyhow::Result<Self> { ... }

    /// Extract style tensor from reference audio.
    /// Input: 5-30 seconds of PCM f32 audio at 24kHz mono.
    /// Output: style tensor bytes (saveable as .npz).
    pub fn extract(&self, samples: &AudioSamples) -> anyhow::Result<Vec<u8>> { ... }

    /// Save extracted style to disk.
    pub fn save_style(
        &self,
        style_bytes: &[u8],
        profile_dir: &Path,
        profile_id: &str,
    ) -> anyhow::Result<PathBuf> { ... }
}
```

### 4.3 Tauri commands for voice training

```rust
/// Start recording voice samples for custom voice creation.
#[tauri::command]
pub async fn start_voice_recording(...) -> Result<(), String> { ... }

/// Stop recording and extract voice style tensor.
#[tauri::command]
pub async fn finish_voice_recording(...) -> Result<VoiceProfile, String> { ... }

/// List available voice profiles.
#[tauri::command]
pub async fn list_voice_profiles(...) -> Result<Vec<VoiceProfile>, String> { ... }

/// Set active voice profile for a TTS slot.
#[tauri::command]
pub async fn set_voice_profile(
    slot_id: String,
    profile_id: String,
    ...
) -> Result<(), String> { ... }
```

### 4.4 Verify

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] Kokoro synthesize() returns non-silence PCM
- [ ] Style extraction produces valid tensor from test audio

---

## Phase 5: Orpheus Full Pipeline (1 file)

### Goal
Wire InferenceHandle into OrpheusTts so `synthesize()` produces real speech, not silence.

### 5.1 `kernel/model-loader/src/backends/orpheus.rs`

Replace the TODO placeholder at lines 213-228 with the full pipeline:

- [ ] Add `inference: Option<InferenceHandle>` field
- [ ] `load()`: store InferenceHandle from BackendPool
- [ ] `synthesize()` full pipeline:
  1. Apply voice profile: `format_prompt(text, profile.voice)` with emotion tags
  2. `inference.generate(prompt, max_tokens=2048, temperature=0.6)` → token stream
  3. Collect tokens until END_TOKEN_IDS or max
  4. Find CODE_START_TOKEN_ID, filter audio tokens
  5. Group into 7-per-frame chunks
  6. `redistribute_codes()` → (codes0, codes1, codes2)
  7. Chunk into SNAC windows (12+24+48 per window)
  8. `snac.decode()` per window → Vec<AudioSamples>
  9. Concatenate PCM across windows
  10. Return AudioSamples

### 5.2 Streaming decode

- [ ] First decode after MIN_FRAMES_BEFORE_DECODE (4 frames = 28 tokens)
- [ ] Subsequent decodes per SNAC window (84 tokens)
- [ ] Send partial AudioSamples to AudioHandle for immediate playback
- [ ] Fade crossover at chunk boundaries (5-10ms linear ramp)

### 5.3 Verify

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] Integration: load Orpheus GGUF + SNAC ONNX → synthesize "hello" → non-silence PCM

---

## Phase 6: Whisper STT (1 file)

### Goal
Wire ort sessions into WhisperStt so `transcribe()` produces real text.

### 6.1 `kernel/model-loader/src/backends/ort/whisper.rs`

- [ ] Add `encoder: Option<ort::session::Session>` and `decoder: Option<ort::session::Session>` fields
- [ ] `load()`: find encoder.onnx + decoder.onnx in model directory, create sessions
- [ ] Add mel spectrogram computation (80-bin log-mel, 30s window, 16kHz input)
- [ ] `transcribe()` full pipeline:
  1. Resample to 16kHz if needed
  2. Compute mel spectrogram
  3. Run encoder → hidden states
  4. Greedy decode loop: feed hidden states + token IDs to decoder
  5. Detokenize output IDs using tokens.txt
  6. Return transcribed text

### 6.2 Verify

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] Integration: load Whisper ONNX → transcribe test audio → non-empty text

---

## Phase 7: SigLIP HD Update (2 files, 1 memory)

### Goal
Replace SigLIP2 NQVP (low-res quant) with SigLIP2-SO400M-384-HD for better screenshot awareness.

### 7.1 `systems/devpulse-engine/src/platform/integrations/slots.rs`

Update vision slot:

```rust
Slot {
    id: "vision.embedder".into(),
    label: "Screen Awareness (HD)".into(),           // Updated label
    capability: ModelCapability::VisionEmbedding,
    preferred_device: DevicePreference::GpuWithCpuFallback,
    loading: LoadingStrategy::Standby,                // Standby — weights resident, fast activation
    assigned_model: None,
    fallback: None,
    runtime: Some(BackendType::Ort),                  // SigLIP runs via ONNX
    default_model: Some("siglip2-so400m-384-hd.onnx".into()),  // HD variant
    requires: Vec::new(),
    overrides: None,
    extensions: HashMap::from([
        ("patch_size".into(), "384".into()),
        ("resolution".into(), "hd".into()),
    ]),
}
```

Changes:
- Label: "Vision System" → "Screen Awareness (HD)"
- Loading: Signal → **Standby** (weights resident for fast screenshot response)
- Runtime: None → `BackendType::Ort`
- Default model: None → `siglip2-so400m-384-hd.onnx`
- Extensions: patch_size=384, resolution=hd

### 7.2 Discovery pattern

File: `kernel/model-loader/src/models/discovery.rs`

- Existing `"siglip"` architecture match at line 260 already returns `VisionEmbedding` — no change needed
- Existing filename match at line 371 for `"siglip"` → Embedding — no change needed
- Add ONNX format support for vision models if not already present

### 7.3 Update model inventory memory

Update `project_model_inventory.md`:
- `vision.embedder`: SigLIP2 NQVP → **SigLIP2-SO400M-384-HD** (~400M params, ONNX, 384px patches)

### 7.4 Verify

- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] Slot config reflects HD model

---

## Phase 8: Boot Integration (2 files)

### Goal
When DevPulse boots, voice slots enter their configured readiness state automatically.

### 8.1 Boot sequence changes

File: `systems/devpulse-engine/src/platform/boot/mod.rs`

After slot registration + model scan + assignment restore:

```rust
// Auto-load slots based on their LoadingStrategy
for slot in service.list_slots() {
    match &slot.loading {
        LoadingStrategy::Hot => {
            service.load_slot_with_deps(&slot.id).await?;
        }
        LoadingStrategy::Standby => {
            service.load_slot_to_standby(&slot.id).await?;
        }
        LoadingStrategy::Warm => {
            // Warm = proactive but not immediate — queue for background load
            service.load_slot_with_deps(&slot.id).await?;
        }
        // OnDemand, Signal, Coupled — skip, loaded on demand
        _ => {}
    }
}
```

### 8.2 Default slot readiness

Update `integrations/slots.rs` — default readiness for voice slots:

| Slot | Default Strategy | Default Readiness | Rationale |
|------|------------------|-------------------|-----------|
| `voice.tts.primary` (Kokoro) | Signal("speech.requested") | **Standby** | ~80MB ONNX. Weights resident. First speak activates in <500ms. |
| `voice.tts.secondary` (Orpheus) | OnDemand | Cold | 3.2GB GGUF. Only loads if user explicitly requests premium voice. |
| `voice.snac` | Coupled(tts.secondary) | Coupled | Follows Orpheus. Not needed for Kokoro. |
| `voice.stt` | Signal("voice.activated") | Cold | Loads when user clicks mic button. |
| `voice.stt.upgrade` | OnDemand | Off | User explicitly enables for better quality. |
| `vision.embedder` | Standby | Standby | Weights resident. Screenshot triggers activate. |
| `chat.brain` | Hot | Hot | Always loaded. Core function. |

### 8.3 Verify

- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] Boot log shows: `voice.tts.primary → Standby (weights resident)`
- [ ] First `speak()` call activates from standby in <500ms

---

## Execution Order

```
Phase 1 (Standby state machine)     — unblocks everything, 3 files
Phase 2 (Readiness toggles)         — user control, 2 files + Tauri command
Phase 3 (Voice profiles)            — Clyffy's personality, 3 files
Phase 4 (Kokoro pipeline + packs)   — PRIMARY VOICE, real speech, custom voices, 2 files
Phase 5 (Orpheus pipeline)          — secondary voice, 1 file (DEFERRED — owner may consider later)
Phase 6 (Whisper STT)               — speech input, 1 file
Phase 7 (SigLIP HD)                 — screenshot quality, 2 files
Phase 8 (Boot integration)          — ties it together, 2 files
```

**Kokoro first.** It's the primary TTS — lighter (~80MB ONNX vs 3.2GB GGUF), no SNAC
co-dependency, supports voice packs for custom voice creation. Orpheus remains wired
but is OnDemand secondary — owner will decide when to invest there.

---

## Voice Training User Flow (End State)

### Quick Start (Kokoro — immediate, no heavy model)
1. Boot DevPulse → voice.tts.primary (Kokoro, ~80MB) enters Standby
2. User says "Clyffy, speak" or types in chat with TTS enabled
3. Standby → Warm activation (~100ms — ONNX warmup is fast)
4. Clyffy speaks in default voice profile ("clyffy-default" = Kokoro/af_heart)
5. User switches profile: "clyffy-warm" (af_bella), "clyffy-bright" (af_sky)

### Premium Voice (Orpheus — on demand)
1. User opens Voice Settings → selects "Clyffy (Premium)"
2. voice.tts.secondary (Orpheus, 3.2GB) loads on demand + SNAC co-loads
3. Orpheus produces higher-quality speech with emotion tag support
4. User switches back to Kokoro whenever they want lighter/faster

### Custom Voice (Kokoro voice packs)
1. User opens Voice Settings in UI
2. Clicks "Create Custom Voice"
3. Records 10-30 seconds of reference audio (cpal microphone capture)
4. StyleExtractor runs: reference audio → Kokoro style tensor (.npz)
5. User names the profile → saved to `.userdata/voice-profiles/`
6. Profile appears in voice profile selector
7. User assigns custom profile to voice.tts.primary slot
8. Kokoro synthesizes using custom style tensor → unique voice

### Switching Readiness
1. User opens Model Manager
2. Per slot, sees readiness toggle: Off / Cold / Standby / Warm / Hot
3. Dragging to Standby: weights load into memory (~5-30s)
4. Dragging to Warm: warmup runs (~300ms)
5. Dragging to Off: unloads, frees VRAM/RAM

---

## Gate

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors
- [ ] Standby state: weights load, warmup deferred, activation <500ms
- [ ] Readiness toggle: Off↔Cold↔Standby↔Warm↔Hot transitions work
- [ ] Voice profiles: default profiles load, user profiles persist
- [ ] Orpheus: `synthesize()` returns non-silence PCM
- [ ] Kokoro: `synthesize()` returns non-silence PCM
- [ ] Whisper: `transcribe()` returns non-empty text
- [ ] SigLIP HD: vision.embedder uses 384-HD model
- [ ] Boot: voice slots enter configured readiness automatically
