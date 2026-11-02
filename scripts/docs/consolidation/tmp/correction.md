---

## OWNER CORRECTION 2026-05-01 — The 5.6B Mystery Solved

Owner statement: 5.6B is not my large 15B phi is
Owner clarification: the 5.6B is sts/tts/stt minions/subconscious my primary llm my spec talks about this 20 million ways

### LOCK-6 Stack identity verified from disk

Source file: scripts/docs/specs/MODEL-PRESETS-SSOT.md lines 95-130

Preset 6 NATO-Aligned Phi Slot Collapse (12GB+):

| Slot | Model | Notes |
|------|-------|-------|
| chat.brain | Phi-4-multimodal-5.6B | Collapses STT + vision |
| voice.stt | ELIMINATED | Phi-4 handles audio natively |
| vision.embedder | ELIMINATED | Phi-4 handles vision natively |
| minion.shared | Qwen3-0.6B | (kept) |
| rag.embedder | Qwen3-Embedding-0.6B | (kept) |
| voice.tts | Qwen3-TTS-0.6B | Still needed |

The 5.6B = Phi-4-multimodal-5.6B. It collapses:
- Chat brain (text reasoning)
- STT (speech-to-text natively)
- Vision (image understanding natively)

Phi-4-multimodal-5.6B does NOT handle TTS. voice.tts stays separate (Qwen3-TTS-0.6B).

### LOCK-7 Reconciling owner statement vs spec

Owner said 5 things: sts/tts/stt minions/subconscious. Spec says 3: STT + vision + chat.brain.

| Owner said | Spec reality | Reconciliation |
|---|---|---|
| STS | NOT single-pass | Achieved via chain: Phi-4 (STT+think) -> Qwen3-TTS (speech out) |
| TTS | Separate Qwen3-TTS-0.6B | NOT in 5.6B |
| STT | Eliminated, in 5.6B | Confirmed |
| Minions | Qwen3-0.6B minion.shared | NOT the 5.6B |
| Subconscious | Uses minion 0.6B layer | NOT the 5.6B |

Interpreted intent (not stamped): Phi-4-multimodal-5.6B collapses what would be 3+ models into ONE for 12GB+ tier. TTS stays separate (cant generate audio). Minions stay 0.6B for cost.

### LOCK-8 The 15B Phi is LARGE_LLM (NOT the 5.6B)

Per memory: Phi-4-reasoning-vision-15B as LARGE_LLM, Qwen3-VL-4B as SMALL_LLM.

Two distinct Phi-4 models:
- Phi-4-reasoning-vision-15B = LARGE_LLM slot (Jesses primary system)
- Phi-4-multimodal-5.6B = chat.brain in Preset 6

Same family, different sizes, different roles.

### LOCK-9 All 7 presets defined, Phi-5.6B is Preset 6 ONLY

| VRAM | Default Preset |
|------|---------------|
| 8GB | Preset 1 Floor |
| 12GB | Preset 2 Mid ActiveIdle |
| 16GB | Preset 3 Jesse Primary |
| 24GB | Preset 4 High |
| Multi-GPU | Preset 5 Lab Ceiling |
| No GPU / API key | Preset 7 API-Enhanced |

Spec quote: Preset 6 (Phi slot collapse) is a benchmark test preset, not auto-selected.

So Phi-4-multimodal-5.6B is currently a TEST preset, not auto-default for any tier.

### LOCK-10 Backend loading rules from same SSOT

| Format | Backend | Crate |
|--------|---------|-------|
| .gguf | llama.cpp FFI | devpulse-llama-sys + devpulse-llama |
| .safetensors | Candle | candle-core + candle-nn + candle-transformers |
| .onnx | ORT | ort (sherpa-rs for STT, kokoro for TTS) |
| .bin (GGML) | sherpa-rs | sherpa-rs fork |

Burn is NOT in this list. Confirms Burn-not-installed finding.

### PARKED items from this lock

OL-8: Preset 6 says test preset not auto-selected, but owner implies it IS the primary path. Should Preset 6 become default for 12GB tier?

OL-9: True full-duplex STS requires single-model architecture (Moshi, PersonaPlex). Phi-4-multimodal does STT-then-text-then-TTS chain - higher latency than dedicated STS. Confirm STS quality target.

OL-10: Burn for encoder lock conflicts with rag.embedder being Qwen3-Embedding-0.6B in every preset. Need to confirm rag.embedder runs on Burn vs Candle.

---

5.6B identity locked: Phi-4-multimodal-5.6B (Preset 6 chat.brain). 15B Phi-4-reasoning-vision is LARGE_LLM (separate role).
