# Model Presets — SSOT

> **Owner**: Jesse
> **Status**: LOCKED — 7 presets defined
> **Rust SSOT**: `kernel/model-loader/src/hardware/auto_config.rs`
> **Date**: 2026-04-09

---

## Preset 1 — Floor (8GB VRAM)

**Target**: RTX 3060 / 3070 baseline
**Policy**: Static

| Slot | Model | Format | Device |
|------|-------|--------|--------|
| chat.brain | Qwen3-VL-4B Q4_K_M | GGUF | GPU |
| minion.shared | Qwen3-0.6B | GGUF | GPU |
| minion.escalation | → fallback to chat.brain | — | — |
| rag.embedder | Qwen3-Embedding-0.6B | SafeTensors | CPU |
| rag.reranker | Qwen3-Reranker-0.6B | SafeTensors | CPU |
| vision.embedder | SigLIP2-SO400M-384-HD | SafeTensors | CPU |
| voice.stt | Whisper-small via sherpa-rs | bin | CPU |
| voice.tts | Qwen3-TTS-0.6B | SafeTensors | CPU |

---

## Preset 2 — Mid ActiveIdle (12GB VRAM)

**Target**: RTX 3060 12GB / RTX 3080
**Policy**: ActiveIdle

| Slot | Active (LARGE_LLM) | Idle (SMALL_LLM) |
|------|-------------------|-------------------|
| chat.brain | Qwen3.5-9B | Qwen3-VL-4B |
| minion.shared | Qwen3-0.6B | — |
| minion.escalation | → fallback to chat.brain | — |
| rag.embedder | Qwen3-Embedding-0.6B (CPU) | — |
| rag.reranker | Qwen3-Reranker-0.6B (CPU) | — |
| vision.embedder | SigLIP2-SO400M-384-HD (CPU) | — |
| voice.stt | Whisper-small | — |
| voice.tts | Qwen3-TTS-0.6B | — |

---

## Preset 3 — Jesse Primary (16GB VRAM)

**Target**: RTX 3080 16GB / dev workstation
**Policy**: ActiveIdle — Phi-4-reasoning-vision 15B as LARGE_LLM

| Slot | Active (LARGE_LLM) | Idle (SMALL_LLM) |
|------|-------------------|-------------------|
| chat.brain | Phi-4-reasoning-vision-15B Q4_K_M (~9.5GB) | Qwen3-VL-4B (~3GB) |
| minion.shared | Qwen3-0.6B | — |
| minion.escalation | → fallback to chat.brain | — |
| rag.embedder | Qwen3-Embedding-0.6B (CPU) | — |
| rag.reranker | Qwen3-Reranker-0.6B (CPU) | — |
| vision.embedder | SigLIP2-SO400M-384-HD (CPU) | — |
| voice.stt | Whisper-small | — |
| voice.tts | Qwen3-TTS-0.6B | — |

---

## Preset 4 — High (24GB VRAM)

**Target**: RTX 3090 / 4090
**Policy**: Static — no swap needed

| Slot | Model |
|------|-------|
| chat.brain | Qwen3-14B or Phi-4-reasoning-vision-15B |
| minion.shared | Qwen3-0.6B or 2B |
| minion.escalation | Independent 14B–15B slot |
| rag.embedder | Qwen3-Embedding-0.6B (CPU) |
| rag.reranker | Qwen3-Reranker-0.6B (CPU) |
| vision.embedder | SigLIP2-SO400M-384-HD |
| voice.stt | Whisper-small |
| voice.tts | Qwen3-TTS-1.7B (upgrade from 0.6B) |

---

## Preset 5 — Ceiling / Lab (Multi-GPU)

**Target**: GPU farm — 4x RTX 3080 dedicated STS rig
**Policy**: Static — everything loaded, nothing swaps

| Slot | Model |
|------|-------|
| chat.brain | Qwen3.5-27B or 30B-class |
| minion.shared | Qwen3-2B (richer minion output) |
| minion.escalation | Independent 27B slot |
| rag.embedder | Qwen3-Embedding-4B (quality ceiling) |
| rag.reranker | Qwen3-Reranker-0.6B |
| vision.embedder | SigLIP2-SO400M-384-HD |
| voice.stt | Whisper-small |
| voice.tts | Qwen3-TTS-1.7B |

---

## Preset 6 — NATO-Aligned Phi Slot Collapse (12GB+)

**Target**: Test preset — if Phi-4-multimodal wins Phase 2 benchmark
**Policy**: ActiveIdle

| Slot | Model | Notes |
|------|-------|-------|
| chat.brain | Phi-4-multimodal-5.6B | Collapses STT + vision |
| voice.stt | ELIMINATED | Phi-4 handles audio natively |
| vision.embedder | ELIMINATED | Phi-4 handles vision natively |
| minion.shared | Qwen3-0.6B | — |
| rag.embedder | Qwen3-Embedding-0.6B | — |
| voice.tts | Qwen3-TTS-0.6B | Still needed |

---

## Preset 7 — API-Enhanced (Any VRAM)

**Target**: No local GPU or wants cloud quality
**Policy**: Local preprocessing only, generation via API

| Slot | Model | Notes |
|------|-------|-------|
| chat.brain | API provider (Claude / GPT / Gemini) | No local LLM |
| minion.shared | Qwen3-0.6B | Still local |
| rag.embedder | Qwen3-Embedding-0.6B | Still local |
| rag.reranker | Qwen3-Reranker-0.6B | Still local |
| vision.embedder | SigLIP2-SO400M-384-HD | Still local |
| voice.stt | Whisper-small | Still local |
| voice.tts | Qwen3-TTS-0.6B | Still local |

---

## Default Per Hardware Tier

| VRAM | Default Preset |
|------|---------------|
| 8GB | Preset 1 — Floor |
| 12GB | Preset 2 — Mid ActiveIdle |
| 16GB | Preset 3 — Jesse Primary |
| 24GB | Preset 4 — High |
| Multi-GPU | Preset 5 — Lab Ceiling |
| No GPU / API key | Preset 7 — API-Enhanced |

Preset 6 (Phi slot collapse) is a benchmark test preset, not auto-selected.

---

## Backend Loading Rules

| Format | Backend | Crate |
|--------|---------|-------|
| `.gguf` | llama.cpp FFI | devpulse-llama-sys + devpulse-llama |
| `.safetensors` | Candle | candle-core + candle-nn + candle-transformers |
| `.onnx` | ORT | ort (sherpa-rs for STT, kokoro for TTS) |
| `.bin` (GGML) | sherpa-rs | sherpa-rs fork |

**Both Candle AND llama.cpp FFI must be stable before expanding.**
User NEVER chooses backend. File format determines it automatically.

---

## Models On Disk (2026-04-09)

### GGUF (llama.cpp FFI)
- `.userdata/models/chat/Qwen3-0.6B-Q4_K_M.gguf` — 379 MB
- `.userdata/models/chat/Qwen3.5-9B-Q4_K_M.gguf` — 5.3 GB
- `.userdata/models/gguf/nomic-embed-text-v1.5.Q8_0.gguf` — 140 MB
- `.userdata/models/rag/nomic-embed-text-v1.5.Q8_0.gguf` — 140 MB (duplicate)

### SafeTensors (Candle)
- `models/general/covo-audio-chat-/` — 4 shards, 15.8 GB total (COMPLETE)
- `models/omni/30b-/` — 9 of 15 shards, ~42 GB (INCOMPLETE — missing 2, 8, 12-15)
- `.userdata/models/` — 7 shards of unknown model

### ONNX (ORT)
- `.userdata/models/kokoro-v1.0.fp16.onnx` — TTS
- `.userdata/models/kokoro-v1.0.int8.onnx` — TTS quantized
- `.userdata/models/kokoro-v1.0.onnx` — TTS full

### Symlink Strategy
Models live in `models/` (repo root, gitignored). Wizard creates symlinks from `.userdata/models/{slot}/` → `models/{preset}/`. No copying — the whole directory is portable.
