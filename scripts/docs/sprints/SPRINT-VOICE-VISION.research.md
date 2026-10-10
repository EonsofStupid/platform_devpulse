# Research: Voice + Vision Models — Concrete Technical Findings

> **Date**: 2026-04-03
> **Purpose**: Exact models, files, sizes, tensor shapes for TTS, STT, and Vision

---

## 1. KOKORO TTS — Primary Voice

### Model Files (Bundle These)

| File | Size | Source |
|------|------|--------|
| `model_quantized.onnx` | 92 MB | [onnx-community/Kokoro-82M-v1.0-ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX) |
| `voices-v1.0.bin` | ~2 MB | [thewh1teagle/kokoro-onnx releases](https://github.com/thewh1teagle/kokoro-onnx) |
| **Total** | **~94 MB** | |

### ONNX Input Tensors

| Name | Shape | Dtype | Description |
|------|-------|-------|-------------|
| `input_ids` | `(1, <=512)` | int64 | Phoneme token IDs, padded with 0 at start/end |
| `style` | `(1, 256)` | float32 | Speaker embedding (voice identity) |
| `speed` | `(1,)` | float32 | Rate multiplier (1.0 = normal) |

### Output
- **Shape**: `(1, N)` float32 PCM samples
- **Sample rate**: 24,000 Hz mono
- **Max input**: 512 tokens per call (chunk longer text)

### Voice Selection
The `voices-v1.0.bin` is an npz archive. Each voice is keyed by ID (e.g. `"af_heart"`) → tensor `(511, 1, 256)`. Slice by token count to get `(1, 256)` style vector.

### 54 Built-in Voices (v1.0)

**American English — Female (11):**
af_heart, af_alloy, af_aoede, af_bella, af_jessica, af_kore, af_nicole, af_nova, af_river, af_sarah, af_sky

**American English — Male (9):**
am_adam, am_echo, am_eric, am_fenrir, am_liam, am_michael, am_onyx, am_puck, am_santa

**British English — Female (4):** bf_alice, bf_emma, bf_isabella, bf_lily
**British English — Male (4):** bm_daniel, bm_fable, bm_george, bm_lewis

**Other languages:** Japanese (5), Mandarin (8), Spanish (3), French (1), Hindi (4), Italian (2), Portuguese (3)

### Voice Blending
Weighted average of embeddings produces new voices: `0.4 * af_sky + 0.6 * af_nicole`. Free, no additional models.

### Voice Cloning from MP3
Kokoro does NOT natively clone. Two third-party approaches:
1. **KokoClone** (Kanade voice conversion, ~100 MB extra model): Generate with built-in voice → convert tone to match reference. 3-10s reference clip.
2. **KVoiceWalk** (embedding optimization): Evolves new `(511, 1, 256)` embedding to match 20-30s reference WAV. Produces a reusable voice file.

### Phonemization (G2P)
- Kokoro uses **misaki** (Python). No official Rust port.
- **Rust options**: `deepphonemizer-rs` (ONNX neural G2P, ~20 MB, pure Rust), `phonetisaurus-g2p-rs` (FST-based), or static-link espeak-ng (GPL risk).
- Existing Rust implementations: `rishiskhare/tts-rs`, `lucasjinreal/Kokoros`, `WismutHansen/kokorox` — all use `ort`.

### Suggested Default Voices for DevPulse

| Slot | Voice ID | Name | Gender | Use |
|------|----------|------|--------|-----|
| Clyffy (default) | `af_heart` | Heart | F | Primary persona |
| Clyffy (alt 1) | `am_adam` | Adam | M | Male option |
| Clyffy (alt 2) | `bf_emma` | Emma | F | British option |
| Clyffy (alt 3) | `bm_george` | George | M | British male |
| User custom 1 | — | — | — | Blended or cloned |
| User custom 2 | — | — | — | Blended or cloned |

---

## 2. WHISPER STT — Voice Input

### Model Files (Bundle These — int8 quantized)

| File | Size | Source |
|------|------|--------|
| `small-encoder.int8.onnx` | 112 MB | [csukuangfj/sherpa-onnx-whisper-small](https://huggingface.co/csukuangfj/sherpa-onnx-whisper-small) |
| `small-decoder.int8.onnx` | 262 MB | same repo |
| `small-tokens.txt` | 817 KB | same repo |
| **Total** | **~375 MB** | |

If size matters more: whisper-base int8 = ~160 MB total.

### ONNX Input Tensors

**Encoder:**
| Name | Shape | Dtype | Description |
|------|-------|-------|-------------|
| `mel` | `(1, 80, 3000)` | float32 | 80-bin mel spectrogram, 3000 frames = 30 seconds |

**Decoder:**
| Name | Shape | Dtype | Description |
|------|-------|-------|-------------|
| `tokens` | `(1, N)` | int64 | Previously generated token IDs |
| `encoder_output` | `(1, 1500, *)` | float32 | Encoder hidden states |

### Preprocessing Pipeline (Must Implement in Rust)
1. Resample audio to 16 kHz mono
2. Pad/trim to 30-second chunks (480,000 samples)
3. STFT: Hann window, n_fft=400, hop=160
4. Apply 80-bin mel filterbank to magnitude
5. Log (clamp min 1e-10)
6. Normalize: `(log_mel - max) / max(max, 8.0) + 4.0) / 4.0`

### Output
- Token IDs → decode via `small-tokens.txt` vocabulary
- Supports 99 languages (whisper-small is multilingual)

---

## 3. SIGLIP2 VISION — Screen Management

### Model Files (Bundle These — int8 quantized)

| File | Size | Source |
|------|------|--------|
| `vision_model_int8.onnx` | 95 MB | [onnx-community/siglip2-base-patch16-256-ONNX](https://huggingface.co/onnx-community/siglip2-base-patch16-256-ONNX) |
| **Total** | **~95 MB** | |

Alternative: MobileCLIP-S2 int8 = 37 MB (smaller, slightly less capable).

### ONNX Input Tensor

| Name | Shape | Dtype | Description |
|------|-------|-------|-------------|
| `pixel_values` | `(1, 3, 256, 256)` | float32 | RGB image, CHW format, normalized to [-1, 1] |

### Output
- `(1, 768)` float32 — 768-dimensional embedding vector
- Use for cosine similarity search against known UI states/screenshots

### Preprocessing
1. Resize image to 256×256 (bilinear)
2. Convert uint8 [0,255] → float32 [0,1] (divide by 255)
3. Normalize: mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]
4. Reshape to CHW: `(3, 256, 256)`

---

## 4. Total Bundle Size (All Three Bundled)

| Model | Format | Size |
|-------|--------|------|
| Kokoro TTS (int8) | `model_quantized.onnx` + `voices-v1.0.bin` | 94 MB |
| Whisper STT (int8) | `encoder.int8.onnx` + `decoder.int8.onnx` + `tokens.txt` | 375 MB |
| SigLIP2 Vision (int8) | `vision_model_int8.onnx` | 95 MB |
| **Total** | | **~564 MB** |

Down from 948 MB estimate — int8 quantization cuts it nearly in half. ~564 MB bundled in NSIS installer is comfortable.

---

## 5. Voice Configuration UI — What's Possible

### Out of the Box (Phase 1 — No Extra Models)
- 54 built-in voices (20 English, 8 British, 26 other languages)
- Male/female selection per language
- Voice blending via slider (weighted average of embeddings)
- Speed control (0.5x – 2.0x)
- Preview button per voice

### With Additional Models (Phase 2 — Optional Download)
- **Voice cloning from MP3**: KokoClone pipeline (~100 MB Kanade model download)
  - Upload 3-10s MP3 reference clip
  - Generates custom embedding compatible with Kokoro
- **Voice evolution**: KVoiceWalk (no extra model, optimization-based)
  - Upload 20-30s WAV reference
  - Iteratively optimizes a new voice embedding
  - Slower but more accurate, produces permanent voice file

### Mix and Match
- Built-in voices as presets
- Blending slider between any two voices
- Save custom blends as named presets
- Upload MP3 for cloning (Phase 2)
- All stored as `(511, 1, 256)` float32 tensors in user data

---

## 6. Rust Integration Path

### Existing Rust Crates That Use ort for These Models

| Model | Crate/Repo | Status |
|-------|-----------|--------|
| Kokoro TTS | `rishiskhare/tts-rs` | Working, clean API |
| Kokoro TTS | `lucasjinreal/Kokoros` | Working, includes G2P |
| Whisper STT | `k2-fsa/sherpa-onnx` (C++ with Rust FFI) | Production-grade |
| Whisper STT | Direct ort loading | Needs mel preprocessing in Rust |
| SigLIP2 Vision | Direct ort loading | Needs image preprocessing in Rust |

### Key Dependencies
- `ort` v2.0.0-rc.12 — ONNX Runtime Rust bindings
- `ndarray` — tensor manipulation for pre/post processing
- `rubato` or `dasp` — audio resampling for Whisper
- `image` — screenshot capture + resize for SigLIP2
- `npz` or custom reader — for `voices-v1.0.bin` (numpy npz format)
