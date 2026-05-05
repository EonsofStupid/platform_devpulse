

---

## OWNER LOCK 2026-05-01 - 5.6B + 0.6B Combo

Owner statement verbatim: 'if the 5.6B can do tts/sts/stt then 5.6b if 0.6B and 5.6B should be combod fucking tell me we have talked and talked and talked'

### LOCK-11 The combo is the brain layer

Phi-4-multimodal-5.6B (chat.brain) + Qwen3-0.6B (minion.shared) = the brain layer combo. They work together as ONE conceptual layer covering:

- chat.brain (Phi-5.6B native)
- STT (Phi-5.6B native, voice.stt slot ELIMINATED)
- vision (Phi-5.6B native, vision.embedder slot ELIMINATED)
- minion / subconscious / background reasoning (Qwen3-0.6B)
- TTS (Qwen3-TTS-0.6B, separate because Phi-multimodal does NOT generate audio)

### LOCK-12 Slot collapse is canonical, not test

Preset 6 in MODEL-PRESETS-SSOT.md is currently labeled 'test preset, not auto-selected'. Owner intent supersedes: this IS the canonical brain layer for 12GB+ tier.

Action needed (NOT done tonight): update MODEL-PRESETS-SSOT.md to make Preset 6 the default for 12GB+ instead of Preset 2. Park as OL-8 resolution.

### LOCK-13 Dropped from the slot diagram

- voice.stt slot - dropped (Phi-5.6B handles natively)
- vision.embedder slot - dropped (Phi-5.6B handles natively)
- separate vision understanding model (Qwen3-VL-4B) - DROPPED for combo path; SMALL_LLM slot is unused under this combo

### LOCK-14 What stays separate from the combo

- voice.tts (Qwen3-TTS-0.6B) - Phi-multimodal cannot generate speech
- rag.embedder (Harrier-OSS-v1-0.6B Qwen3-arch) - retrieval, CPU, on-demand
- rag.reranker (BGE-Reranker-Base) - CPU
- LARGE_LLM slot (Phi-4-reasoning-vision-15B) - only used when explicitly invoked for heavy reasoning

### Final clean stack (combo locked)

| Slot | Model | Size | Loading |
|---|---|---|---|
| chat.brain | Phi-4-multimodal-5.6B | 5.6B | OnDemand |
| minion.shared | Qwen3-0.6B | 0.6B | OnDemand |
| voice.tts | Qwen3-TTS-0.6B | 0.6B | OnDemand |
| rag.embedder | Harrier-OSS-v1-0.6B | 0.6B | OnDemand CPU |
| rag.reranker | BGE-Reranker-Base | small | OnDemand CPU |
| LARGE_LLM | Phi-4-reasoning-vision-15B | 15B | OnDemand, optional |

Total: 5 always-available models + 1 optional heavy. All on-demand.

### What this means for STS

Full-duplex STS does NOT happen with this combo. The path is: audio in -> Phi-5.6B (STT+think) -> text -> Qwen3-TTS-0.6B -> audio out. Two-model chain. Latency higher than single-model STS like Moshi or PersonaPlex.

If you want true full-duplex STS, that's a SEPARATE decision and would add Moshi/PersonaPlex back to the stack. Owner has not made this call. Parked as OL-9.

---

