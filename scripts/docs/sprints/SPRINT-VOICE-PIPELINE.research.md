# Research: Voice Pipeline — Orpheus + SNAC + Sherpa + Audio Playback

**Date**: 2026-04-02
**Sprint**: SPRINT-VOICE-PIPELINE (to be written)
**Status**: COMPLETE

---

## 1. Orpheus TTS — Audio Token Format

### What I Got Wrong in Scaffolding

| Assumption | Reality | Impact |
|------------|---------|--------|
| Token range 128256-131072 | `CODE_START_TOKEN_ID = 128257`, `CODE_TOKEN_OFFSET = 128266` | Token constants wrong |
| Prompt: `<\|audio\|>{voice}: {text}<\|eoa\|>` | Prompt: `<custom_token_3><\|begin_of_text\|>{voice}: {text}<\|eot_id\|><custom_token_4><custom_token_5><custom_token_1>` | Prompt template wrong |
| Simple token extraction (filter by range) | 7-token-per-frame grouping, then redistribute to 3 SNAC codebooks | Token processing wrong |
| `extract_audio_tokens()` returns flat Vec | Must redistribute into 3 separate Vecs for SNAC's 3 input tensors | Architecture wrong |

### Correct Token Constants

```rust
const START_TOKEN_ID: u32 = 128259;
const CODE_START_TOKEN_ID: u32 = 128257;
const CODE_TOKEN_OFFSET: u32 = 128266;
const END_TOKEN_IDS: [u32; 4] = [128009, 128260, 128261, 128257];
const CODEBOOK_SIZE: u32 = 4096;
```

### Correct Prompt Format

```rust
fn format_prompt(text: &str, voice: &str) -> String {
    // voice is one of: "tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe"
    format!(
        "<custom_token_3><|begin_of_text|>{voice}: {text}<|eot_id|>\
         <custom_token_4><custom_token_5><custom_token_1>"
    )
}
```

### Correct Token Processing (7-token-per-frame)

Orpheus outputs tokens in groups of 7. Each group maps to one time frame across SNAC's 3 codebook levels:

```
Group pattern per frame:
  [codes_0, codes_1, codes_2_a, codes_2_b, codes_1_b, codes_2_c, codes_2_d]

Redistribution to SNAC inputs:
  codes0: 1 token per frame  → [idx 0]
  codes1: 2 tokens per frame → [idx 1, idx 4]
  codes2: 4 tokens per frame → [idx 2, idx 3, idx 5, idx 6]
```

Each raw token → actual code: `(token_id - CODE_TOKEN_OFFSET - (position_in_group * CODEBOOK_SIZE))`

Processing waits until `count % 7 == 0 && count > 27` (minimum 4 complete frames = 28 tokens) before passing to SNAC.

### Available Voices

```rust
const VOICES: [&str; 8] = ["tara", "leah", "jess", "leo", "dan", "mia", "zac", "zoe"];
const DEFAULT_VOICE: &str = "tara";
```

### Emotion Tags (inline in text)

`<laugh>`, `<chuckle>`, `<sigh>`, `<cough>`, `<sniffle>`, `<groan>`, `<yawn>`, `<gasp>`

### Sources

- [orpheus-tts-local/gguf_orpheus.py](https://github.com/isaiahbjork/orpheus-tts-local/blob/main/gguf_orpheus.py)
- [Real-Time TTS Streaming with Orpheus and SNAC](https://bitbasti.com/blog/audio-streaming-with-orpheus)
- [Orpheus TTS Wiki](https://tts.wiki/index.php/Orpheus_TTS)

---

## 2. SNAC Decoder — ONNX Model Interface

### What I Got Wrong in Scaffolding

| Assumption | Reality | Impact |
|------------|---------|--------|
| Single input tensor (audio_tokens: i64) | **3 separate input tensors** (codes0, codes1, codes2) | decode() signature wrong |
| Single output (flat PCM) | Output shape `[1, 1, 24576]` | Minor — shape is correct |
| Audio tokens per decode = variable | Fixed window: 12 + 24 + 48 = 84 tokens per decode | Chunking logic needed |

### Correct ONNX Model Spec

**Model**: `snac24_int2wav_static.onnx` from [laion/SNAC-24khz-decoder-onnx](https://huggingface.co/laion/SNAC-24khz-decoder-onnx)

**Inputs** (all int64):

| Name | Shape | Description |
|------|-------|-------------|
| `codes0` | `[1, 12]` | Codebook level 0 (lowest temporal resolution) |
| `codes1` | `[1, 24]` | Codebook level 1 (mid resolution) |
| `codes2` | `[1, 48]` | Codebook level 2 (highest resolution) |

**Output**:

| Name | Shape | Dtype | Description |
|------|-------|-------|-------------|
| `audio` | `[1, 1, 24576]` | f32 | PCM waveform, 24kHz mono |

**Alignment**: `L0×4 = L1×2 = L2×1 = 48 shared frames`

**Per-window**: 48 frames × 512 samples/frame = 24,576 samples ≈ 1.024 seconds

**Performance**: ~2.1× real-time on CPU

### Correct decode() Signature

```rust
fn decode(
    &self,
    codes0: &[i64],  // [12] tokens
    codes1: &[i64],  // [24] tokens  
    codes2: &[i64],  // [48] tokens
) -> anyhow::Result<AudioSamples>;
```

NOT `fn decode(&self, audio_tokens: &[u32])` — that's wrong.

### Sources

- [laion/SNAC-24khz-decoder-onnx](https://huggingface.co/laion/SNAC-24khz-decoder-onnx)
- [SNAC: Multi-Scale Neural Audio Codec](https://arxiv.org/abs/2410.14411)
- [hubertsiuzdak/snac GitHub](https://github.com/hubertsiuzdak/snac)

---

## 3. sherpa-rs — Crate Status

### Critical Finding

**sherpa-rs is DEPRECATED.** The README states: *"This crate is deprecated. The upstream project sherpa-onnx now provides an official Rust API."*

### Options

| Option | Crate | Status | Notes |
|--------|-------|--------|-------|
| A | `sherpa-rs` (thewh1teagle) | DEPRECATED | Still works, last release 0.6.0, but unmaintained |
| B | Official k2-fsa Rust bindings | ACTIVE | Part of sherpa-onnx repo, Rust API being added |
| C | `kokoroxide` | ACTIVE | Pure Rust Kokoro TTS, no sherpa dependency |
| D | Direct ort for everything | POSSIBLE | Whisper + Kokoro are ONNX models — run through ort directly |

### STOP — Owner Decision Required

**Question**: sherpa-rs is deprecated. Which path?

- **Option A**: Use sherpa-rs anyway (it works, just unmaintained). Risk: breaks on future sherpa-onnx updates.
- **Option B**: Use official k2-fsa Rust API (newer, maintained). Risk: API less stable, fewer examples.
- **Option C**: Use `kokoroxide` for Kokoro TTS + direct ort for Whisper STT. Risk: two different integration paths.
- **Option D**: Use ort directly for all ONNX models (Whisper, Kokoro, SNAC). Most unified but requires writing more glue code.

**Recommendation**: Option D. We already need ort for SNAC. Running Whisper and Kokoro through ort directly means one dependency, one API. sherpa-rs was a wrapper around onnxruntime anyway.

### Whisper via sherpa-rs API (if used)

```rust
let config = WhisperConfig {
    decoder: "whisper-tiny/tiny-decoder.onnx".into(),
    encoder: "whisper-tiny/tiny-encoder.onnx".into(),
    tokens: "whisper-tiny/tiny-tokens.txt".into(),
    language: "en".into(),
    provider: Some(provider),
    num_threads: None,
    bpe_vocab: None,
    ..Default::default()
};
let mut recognizer = WhisperRecognizer::new(config)?;
let result = recognizer.transcribe(sample_rate, &samples);
println!("{}", result.text);
```

### Sources

- [sherpa-rs GitHub](https://github.com/thewh1teagle/sherpa-rs) (deprecated notice)
- [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx)
- [kokoroxide](https://lib.rs/crates/kokoroxide)

---

## 4. ort Crate — ONNX Runtime

### API (Current)

```rust
use ort::{Session, inputs};
use ndarray::Array2;

// Create session
let mut session = Session::builder()?
    .with_optimization_level(ort::GraphOptimizationLevel::Level3)?
    .commit_from_file("model.onnx")?;

// Create inputs
let codes0 = Array2::<i64>::from_shape_vec((1, 12), vec![...])?;
let codes1 = Array2::<i64>::from_shape_vec((1, 24), vec![...])?;
let codes2 = Array2::<i64>::from_shape_vec((1, 48), vec![...])?;

// Run inference
let outputs = session.run(inputs![
    "codes0" => codes0,
    "codes1" => codes1,
    "codes2" => codes2,
]?)?;

// Extract output
let audio = outputs["audio"]
    .try_extract_tensor::<f32>()?
    .into_owned();
// audio shape: [1, 1, 24576]
```

### Dependencies

```toml
[dependencies]
ort = { version = "2", features = ["load-dynamic"] }
ndarray = "0.16"
```

`load-dynamic` downloads the ONNX Runtime shared library at build time. For bundling with Tauri, may need `copy-dylibs` feature.

### What I Got Wrong

The scaffolding had `// session: Option<ort::Session>` commented out — that's roughly correct but the actual API uses `Session::builder()` not `Session::new()`, and inference uses the `inputs!` macro with named tensors.

### Sources

- [ort documentation](https://docs.rs/ort)
- [ort Session API](https://docs.rs/ort/latest/ort/session/struct.Session.html)

---

## 5. Audio Playback

### Recommendation: rodio

| Crate | Level | Downloads | Notes |
|-------|-------|-----------|-------|
| `cpal` | Low-level | 11M+ | Direct audio device access. You manage buffers. |
| `rodio` | High-level | 5.3M+ | Built on cpal. Simple `play()` API. Handles mixing. |

**rodio** is the right choice:
- Higher-level API (less boilerplate)
- Built on cpal (battle-tested audio backend)
- Supports f32 PCM directly (what SNAC outputs)
- Supports streaming (write samples as they arrive)
- Works on Windows (WASAPI backend via cpal)

```rust
use rodio::{OutputStream, buffer::SamplesBuffer, Sink};

let (_stream, stream_handle) = OutputStream::try_default()?;
let sink = Sink::try_new(&stream_handle)?;

// Play PCM samples from SNAC
let source = SamplesBuffer::new(1, 24000, pcm_samples);
sink.append(source);
sink.sleep_until_end();
```

```toml
[dependencies]
rodio = "0.19"
```

### Sources

- [rodio GitHub](https://github.com/RustAudio/rodio)
- [rodio docs](https://docs.rs/rodio)

---

## 6. Corrections Needed in Scaffolding

### Critical (Architecture Wrong)

| File | Issue | Fix |
|------|-------|-----|
| `orpheus.rs` | Token constants wrong (128256 range) | Use 128257/128266 constants, 7-per-frame grouping |
| `orpheus.rs` | Prompt format wrong | Use `<custom_token_3><\|begin_of_text\|>...` format |
| `orpheus.rs` | `extract_audio_tokens()` returns flat Vec | Must redistribute to 3 codebook Vecs |
| `ort/snac.rs` | `decode(audio_tokens: &[u32])` single input | Must take 3 inputs: codes0, codes1, codes2 (i64) |
| `sherpa/` | Built on deprecated crate | Decision needed: ort-for-everything vs sherpa-rs |

### Moderate (API Mismatch)

| File | Issue | Fix |
|------|-------|-----|
| `ort/snac.rs` | Missing ort Session import + inference code | Wire ort::Session with inputs! macro |
| `voice.rs` | `AudioDecoderBackend::decode()` takes `&[u32]` | Change to 3 separate codebook inputs |

### Minor (Naming/Values)

| File | Issue | Fix |
|------|-------|-----|
| `orpheus.rs` | Sample rate 24000 correct | No change needed |
| `sherpa/tts.rs` | Sample rate 22050 for Kokoro | Verify — may be 24000 depending on model |

---

## 7. Recommended Architecture After Research

```
┌─────────────────────────────────────────────────────┐
│                   Voice Pipeline                      │
│                                                       │
│  TTS Path (Orpheus):                                  │
│    Text → format_prompt() → InferenceHandle (llama.cpp)│
│    → 7-per-frame token groups → redistribute_codes()   │
│    → SNAC decode(codes0, codes1, codes2) via ort       │
│    → PCM f32 24kHz → rodio playback                    │
│                                                       │
│  TTS Path (Kokoro fallback):                           │
│    Text → ort Session (kokoro.onnx) → PCM f32          │
│    → rodio playback                                    │
│                                                       │
│  STT Path (Whisper):                                   │
│    Microphone → cpal capture → PCM f32 16kHz           │
│    → ort Session (whisper encoder + decoder)            │
│    → token IDs → detokenize → text                     │
│                                                       │
│  All ONNX models through ort. No sherpa-rs.            │
│  llama.cpp only for Orpheus LLM (GGUF).               │
└─────────────────────────────────────────────────────┘
```

### Dependencies to Add

```toml
# In kernel/model-loader/Cargo.toml
[dependencies]
ort = { version = "2", features = ["load-dynamic"] }
ndarray = "0.16"
rodio = "0.19"
```

### STOP — Owner Decisions Before Sprint

1. **sherpa-rs vs ort-for-everything?** (Recommendation: ort for all ONNX)
2. **rodio for playback?** (Recommendation: yes)
3. **Kokoro via ort directly or kokoroxide crate?** (Recommendation: ort directly — one less dependency)
4. **Audio capture for STT?** cpal directly for microphone input (rodio doesn't capture)
