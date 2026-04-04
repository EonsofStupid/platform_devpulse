# MODEL LOADER — Layman UX Requirements

| Field | Value |
|-------|-------|
| **Status** | `REQUIREMENTS CAPTURE` |
| **Date** | `2026-04-04` |
| **Source** | Jesse — direct dictation |
| **Audience** | Vibe coders, zero ML knowledge |
| **Standard** | Must exceed OpenWebUI / LM Studio / Jan.ai in approachability |
| **Persistence** | GlobalDb (libSQL) — user's profile survives updates |

---

## Non-Negotiable Expectations

### 1. More UI-friendly than anything that exists

No model management tool today is built for someone who doesn't know what "GGUF" or "Q4_K_M" means. They all assume the user already knows:
- What quantization is
- What VRAM is
- What parameter count means
- What a context window is

DevPulse does NOT assume this. The Model Loader speaks the user's language.

**What the user sees:**

| Developer term | What DevPulse shows instead |
|---|---|
| Qwen3-VL-4B-Instruct-Q4_K_M.gguf | "Clyffy's Brain — Balanced (recommended for your PC)" |
| VRAM: 3.2GB / 8GB | A visual bar: "Using 40% of your graphics card" |
| Q4_K_M quantization | "Optimized for speed" (vs "Optimized for quality" for higher quants) |
| SafeTensors vs GGUF | User never sees this. Format is auto-selected. |
| 128K context window | "Can remember about 100 pages of conversation" |
| Temperature 0.7 | "Creativity: Medium" (slider) |
| int8 ONNX | User never sees this. |

**What the user does NOT see (default view):**
- File paths
- Tensor formats
- Quantization method names
- Parameter counts
- Technical benchmark scores
- Registry entries or slot IDs

All of that exists in the advanced/dev view behind the feature flag.

---

### 2. Vision module is a FIRST-CLASS section

Vision is not a hidden toggle or an advanced feature. It's a top-level section in the Model Loader UI with its own card, its own status indicator, and its own configuration.

**What the user sees:**

```
+---------------------------------------------+
|  Vision -- How Clyffy sees your screen       |
|                                              |
|  Status: Active                              |
|                                              |
|  Currently using: Built-in (recommended)     |
|  [Change]                                    |
|                                              |
|  "Clyffy can see what's on your screen       |
|   to help with visual problems like error    |
|   dialogs and layout issues."                |
|                                              |
|  Screenshot quality: [Standard]              |
|  Auto-capture: [On]                          |
+---------------------------------------------+
```

**Key behaviors:**
- If the brain model has built-in vision (Phi-4-multimodal, Qwen3.5, Qwen3-VL), the vision section shows "Built-in (recommended)" and the separate vision encoder slot is hidden
- If the brain is text-only (Qwen3-14B), the vision section shows the SigLIP2 encoder as active and explains it naturally: "Clyffy uses a separate eye to see your screen"
- User can toggle auto-capture on/off
- User can set screenshot quality (affects resolution sent to SigLIP2/brain)
- The vision section never mentions "SigLIP2", "embedder", "SO400M", or "384-HD"

---

### 3. Voice module is a FIRST-CLASS section

Same principle as vision. Voice is not buried in settings.

**What the user sees:**

```
+---------------------------------------------+
|  Voice -- Talk to Clyffy                     |
|                                              |
|  Status: Ready                               |
|                                              |
|  Listening: Whisper Standard                 |
|  [Change]                                    |
|                                              |
|  Speaking: Clyffy's voice                    |
|  Voice style: [Default]                      |
|  [Preview voice]                             |
|                                              |
|  "Speak to Clyffy using your microphone.     |
|   Clyffy responds in her own voice."         |
|                                              |
|  Microphone: [System default]                |
|  Push-to-talk: [Off]                         |
+---------------------------------------------+
```

**Key behaviors:**
- STT model choices shown as: "Standard" (Whisper small), "High Quality" (large-v3-turbo), "Best" (large-v3)
- If brain has built-in ASR (Phi-4-multimodal), option appears as "Built-in (fastest)"
- TTS voice selection shows Clyffy voice profiles: Default, Casual, Focused
- Preview button plays a short sample clip
- Voice style changes write to GlobalDb immediately
- User never sees "Whisper", "Kokoro", "sherpa-rs", "ONNX", or "int8"
- Microphone selection uses OS-native device names

---

### 4. Configuration faithfully updates -- never creates new

When the user changes a setting in the Model Loader:
- It updates the EXISTING configuration in GlobalDb
- It does NOT create a new profile, new config file, or new entry
- The UI reflects the current state at all times -- no stale data
- If a model is downloading, the UI shows real progress on the existing card (not a new download card)
- If the user switches brain models, the old model's card transitions to the new one -- it doesn't spawn a second card

**Persistence path:**
```
User changes brain model
    -> ModelLoader writes to GlobalDb (preferences table)
    -> engine/src/slots.rs reads updated config
    -> Model transition begins (unload old -> load new)
    -> UI card updates in real-time via Tauri event
    -> On next launch, GlobalDb is read and same config loads
```

**What persists across sessions (GlobalDb):**
- Selected brain model + quant level
- Selected minion model
- Vision on/off + quality setting
- Voice settings (STT model, TTS voice profile, mic device, push-to-talk)
- Hardware tier (detected once, overridable)
- Custom model paths (if user sideloaded a model)

**What does NOT persist:**
- Loading state (always re-detected on launch)
- VRAM usage (always re-measured)
- Download progress (resumes from disk, doesn't replay UI state)

---

### 5. DevPulse is a CONSUMER product

This is not a developer tool with a pretty face. This is a product that a Twitch streamer, a small business owner, or a design student downloads and uses on day one.

**Consumer-grade requirements:**

| Requirement | Implementation |
|---|---|
| First-run wizard | Detects hardware -> recommends config -> one-click download + install |
| No terminal needed | All model management through UI. No CLI commands ever. |
| Plain English everywhere | "Brain", "Eyes", "Voice", "Memory" -- not "LLM", "VLM", "STT", "RAG" |
| Error recovery | If a download fails, resume. If a model crashes, fall back. Always explain in plain English. |
| Progress feels real | Download bars show real MB/s. Loading shows real stages. No fake spinners. |
| Offline works | Local-only mode is fully functional. No "connect to internet" nags. |
| Update seamless | Model updates don't break config. New models appear as "upgrade available" on existing cards. |
| Undo exists | Changed brain model and it's worse? "Go back to previous" button. Config history in GlobalDb. |

---

### 6. The four sections (minimum)

The Model Loader UI has at minimum four top-level sections, each a visual card:

```
+----------------+  +----------------+
|  Brain         |  |  Vision        |
|                |  |                |
|  The thinker   |  |  The eyes      |
+----------------+  +----------------+

+----------------+  +----------------+
|  Voice         |  |  Memory        |
|                |  |                |
|  Hear & speak  |  |  Remember      |
+----------------+  +----------------+
```

**Brain** = chat.brain slot + minion.shared (minion is hidden from layman, shown as "helpers" if user clicks "What's this?")

**Vision** = vision.embedder slot OR brain's built-in vision. Auto-detected.

**Voice** = voice.stt + voice.tts. Shown as one section with two sub-parts: "Listening" and "Speaking"

**Memory** = rag.embedder + rag.reranker + Qdrant. Shown as: "How much Clyffy remembers about your project." User controls: "Memory depth" slider (maps to retrieval top-k internally). User never sees "embedder", "reranker", or "Qdrant."

---

### 7. Advanced view (feature-flagged)

Everything the layman view hides is accessible in the advanced view:
- Slot IDs, model paths, tensor formats
- VRAM breakdown per slot
- KV cache size and utilization
- Quantization selection
- Manual model sideloading (drag GGUF/SafeTensors onto window)
- Lane trace toggles (from the telemetry system)
- Inference speed (tok/s) per slot
- Raw config.toml editing

Toggled via: Settings -> "Show advanced options" or the dev build which defaults to advanced.

---

## Summary

| # | Expectation | One-liner |
|---|---|---|
| 1 | More UI-friendly than OpenWebUI | Zero jargon in default view |
| 2 | Vision is first-class | Top-level card, not a hidden toggle |
| 3 | Voice is first-class | Top-level card with preview + mic selection |
| 4 | Config updates faithfully | One source of truth in GlobalDb, real-time UI |
| 5 | Persistence to global profile | Survives restarts, updates, model switches |
| 6 | Consumer-level product | First-run wizard, plain English, error recovery, undo |
| 7 | Advanced view exists | Everything is accessible, nothing is deleted -- just layered |

---

*This document captures Jesse's requirements as stated. It is the SSOT for model loader UX decisions.*
