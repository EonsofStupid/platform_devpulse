# DevPulse Platform Specification
## For Software Developers Targeting Non-Technical Users

This document defines what **layman users** should expect from DevPulse — a local-first AI platform that "just works" without requiring users to understand model formats, VRAM, or inference backends.

---

## Core Philosophy

| Principle | What It Means |
|-----------|---------------|
| **Zero Config Default** | App works out of the box with bundled models |
| **Progressive Disclosure** | Power users can customize; beginners never need to |
| **Local First** | All processing on-device; no data leaves the machine |
| **Graceful Degradation** | Weaker hardware gets smaller models, still works |
| **Hot Swap** | Switch models without restarting the app |

---

## 1. Model Slots — The User Mental Model

Users don't think in "models." They think in **capabilities**. DevPulse exposes slots:

| Slot ID | User-Facing Name | What It Does |
|---------|------------------|--------------|
| `chat.brain` | "AI Assistant" | Main conversational AI |
| `rag.embedder` | "Search Brain" | Turns documents into searchable vectors |
| `rag.reranker` | "Relevance Scorer" | Picks most relevant results |
| `voice.stt` | "Voice Input" | Converts speech to text |
| `voice.tts` | "Voice Output" | Converts text to speech |
| `vision.encoder` | "Image Understanding" | Describes images, extracts text |
| `media.matting` | "Background Removal" | Removes video/image backgrounds |

### User Experience

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > AI Models                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🧠 AI Assistant                              [Qwen 9B ▼]   │
│     Status: ● Ready (6.7 GB VRAM)                           │
│     [Change Model]  [Unload]                                │
│                                                              │
│  🔍 Search Brain                              [Nomic ▼]     │
│     Status: ● Ready (152 MB VRAM)                           │
│     [Change Model]  [Unload]                                │
│                                                              │
│  🎤 Voice Input                               [Whisper ▼]   │
│     Status: ○ Not Loaded                                    │
│     [Load Now]  [Auto-load when needed]                     │
│                                                              │
│  🔊 Voice Output                              [Kokoro ▼]    │
│     Status: ● Ready (88 MB VRAM)                            │
│     [Change Model]  [Unload]                                │
│                                                              │
│  🖼️ Background Removal                        [U2Net ▼]     │
│     Status: ○ Not Loaded                                    │
│     [Load Now]  [Auto-load when needed]                     │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│  VRAM Usage: 7.1 GB / 12 GB  [████████░░░░]                 │
│  System RAM: 4.2 GB / 32 GB  [██░░░░░░░░░░]                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Loading Strategies — What Users See

| Strategy | User-Facing | Behavior |
|----------|-------------|----------|
| `Hot` | "Always Ready" | Loads on app start, stays loaded |
| `Warm` | "Quick Start" | Pre-loads when app predicts need |
| `OnDemand` | "Load When Needed" | First use has ~3s delay, then instant |
| `Signal` | "Smart Loading" | Loads when specific action triggers |

### Default Configuration (Layman Mode)

```
chat.brain      → Hot        (users expect instant chat)
rag.embedder    → Hot        (search must be instant)
voice.stt       → OnDemand   (only if user enables voice)
voice.tts       → Warm       (pre-loads if voice features enabled)
media.matting   → OnDemand   (only when user opens media tools)
```

---

## 3. Hardware Auto-Configuration

DevPulse detects hardware on first run and configures defaults:

| Hardware Tier | Detection Criteria | Default Setup |
|---------------|-------------------|---------------|
| **Potato** | <4GB VRAM, <8GB RAM | Qwen 0.6B (Q4), CPU embedder, no voice |
| **Entry** | 4-6GB VRAM | Qwen 3B (Q4), GPU embedder, voice on-demand |
| **Mainstream** | 8-12GB VRAM | Qwen 9B (Q4), all models GPU, voice warm |
| **Prosumer** | 16-24GB VRAM | Qwen 14B+ (Q4), multi-model hot loading |
| **Workstation** | 24GB+ VRAM | Full precision options, parallel inference |

### User Flow: First Launch

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  🔍 Detecting your hardware...                              │
│                                                              │
│  GPU: NVIDIA RTX 3080 (10 GB)                               │
│  RAM: 32 GB                                                  │
│  Tier: Mainstream                                            │
│                                                              │
│  ────────────────────────────────────────────────────────   │
│                                                              │
│  Recommended Setup:                                          │
│                                                              │
│  ✓ AI Assistant: Qwen 9B (best balance of speed/quality)    │
│  ✓ Search: Nomic Embed (fast, accurate)                     │
│  ✓ Voice: Whisper Small + Kokoro TTS                        │
│                                                              │
│  Total VRAM: ~7.4 GB / 10 GB available                      │
│                                                              │
│        [ Use Recommended ]    [ Customize ]                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Hot Swap — Changing Models at Runtime

Users can change models **without restarting** the app:

### What Happens Behind the Scenes

```
User clicks [Change Model] on "AI Assistant"
    ↓
1. Current model receives "prepare to unload" signal
2. Pending requests drain (max 5 second timeout)
3. Model unloaded from VRAM
4. New model loaded
5. Slot status updates to "Ready"
6. User can continue chatting (no app restart)
```

### User-Facing UI

```
┌─────────────────────────────────────────────────────────────┐
│  Change AI Assistant Model                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Current: Qwen 9B (Q4_K_M) — 6.7 GB VRAM                    │
│                                                              │
│  Available Models:                                           │
│                                                              │
│  ○ Qwen 0.6B (Q4) .......... 472 MB   "Fast, basic tasks"   │
│  ● Qwen 9B (Q4) ........... 6.7 GB   "Balanced" ✓ Current   │
│  ○ Qwen 14B (Q4) ......... 10.2 GB   "High quality"         │
│                                      ⚠️ May exceed VRAM      │
│                                                              │
│  [ Download More Models ]                                    │
│                                                              │
│        [ Cancel ]              [ Switch Model ]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Pre-Loaded vs Configurable Models

### Bundled Models (Ship with App)

These are **always available**, no download required:

| Model | Purpose | Size | Why Bundled |
|-------|---------|------|-------------|
| Kokoro TTS (int8) | Voice output | 88 MB | Essential for accessibility |
| Nomic Embed (Q8) | Search/RAG | 152 MB | Core feature, small |
| U2Net (FP16) | Background removal | ~170 MB | Media tools essential |

### User-Managed Models (Download via UI)

| Model | Purpose | Size | Why User-Managed |
|-------|---------|------|------------------|
| Qwen 0.6B - 14B | Chat/reasoning | 400MB - 10GB | Size varies by hardware |
| Whisper (small/medium/large) | Speech-to-text | 500MB - 3GB | Quality/speed tradeoff |
| SigLIP2 | Vision encoding | ~400 MB | Optional feature |

---

## 6. Model Discovery & Download

### In-App Model Browser

```
┌─────────────────────────────────────────────────────────────┐
│  Model Library                                    [Search 🔍]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Installed ──────────────────────────────────────────┐   │
│  │                                                       │   │
│  │  Qwen3.5-9B-Q4_K_M          6.7 GB    ● Loaded       │   │
│  │  Qwen3-0.6B-Q4_K_M          400 MB    ○ Available    │   │
│  │  nomic-embed-text-v1.5      152 MB    ● Loaded       │   │
│  │  whisper-small              465 MB    ○ Available    │   │
│  │  kokoro-v1.0-int8           88 MB     ● Loaded       │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ Recommended Downloads ───────────────────────────────┐   │
│  │                                                       │   │
│  │  Qwen3.5-14B-Q4_K_M         10.2 GB   [Download]     │   │
│  │  "Better reasoning, needs 12GB+ VRAM"                │   │
│  │                                                       │   │
│  │  whisper-medium             1.5 GB    [Download]     │   │
│  │  "More accurate transcription"                       │   │
│  │                                                       │   │
│  │  bge-reranker-v2-m3         420 MB    [Download]     │   │
│  │  "Improves search relevance"                         │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Download Flow

```
User clicks [Download] on Qwen3.5-14B
    ↓
1. VRAM check: "This model needs 10.2 GB. You have 10 GB."
   → Warning shown, user can proceed anyway
    ↓
2. Download progress with pause/resume
   → Progress bar, speed, ETA
    ↓
3. Integrity verification (SHA256)
    ↓
4. Auto-register in model registry
    ↓
5. Model appears in slot assignment UI
```

---

## 7. RRO (Retrieval, Reasoning, Orchestration) — Pre-Loaded Pipeline

Your existing RRO system should be **transparent to users**:

| Component | Slot | Loading | User Sees |
|-----------|------|---------|-----------|
| Embedder | `rag.embedder` | Hot | Instant search results |
| Reranker | `rag.reranker` | Warm | "Finding best matches..." |
| Brain (LLM) | `chat.brain` | Hot | Instant responses |

### User Experience

```
User: "Find my notes about the quarterly budget"
    ↓
[Behind scenes: embedder → vector search → reranker → LLM synthesis]
    ↓
User sees: "I found 3 relevant notes about Q3 budget..."
```

**Users don't know** about embeddings, vectors, or reranking. They just see fast, relevant results.

---

## 8. Media Pipeline — Background Removal & More

### User-Facing Features

| Feature | User Action | What Happens |
|---------|-------------|--------------|
| **BG Removal (Image)** | Drag image → "Remove Background" | U2Net inference, returns PNG with alpha |
| **BG Removal (Video)** | Upload video → "Remove Background" | Frame-by-frame matting, real-time preview |
| **Virtual Camera** | Toggle "Enable Virtual Camera" | Processed feed available in Zoom/Discord |
| **Snip & Remove** | Screenshot tool → auto-remove BG | Snip → matting → clipboard |

### Loading Behavior

```
media.matting slot:
  - Loading: OnDemand
  - First use: "Loading background removal..." (2-3 seconds)
  - Subsequent use: Instant (model stays warm for 5 minutes)
  - Unload after: 5 minutes idle
```

---

## 9. Voice Pipeline

### User-Facing Features

| Feature | Trigger | Behavior |
|---------|---------|----------|
| **Voice Input** | Click mic / hotkey | STT transcribes, text appears in input |
| **Voice Output** | Toggle "Read responses" | TTS speaks AI responses |
| **Dictation Mode** | "Hey DevPulse" / hotkey | Continuous listening, hands-free |

### Model Recommendations by Use Case

| Use Case | STT Model | TTS Model | Latency |
|----------|-----------|-----------|---------|
| Quick commands | Whisper Small | Kokoro int8 | <500ms |
| Transcription | Whisper Medium | — | ~1s |
| Accessibility | Whisper Small | Kokoro fp16 | <500ms |

### User Settings

```
┌─────────────────────────────────────────────────────────────┐
│  Voice Settings                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Voice Input                                                 │
│  ├─ Model: [Whisper Small ▼]                                │
│  ├─ Language: [Auto-detect ▼]                               │
│  └─ Hotkey: [Ctrl+Shift+V]                                  │
│                                                              │
│  Voice Output                                                │
│  ├─ Model: [Kokoro int8 ▼]                                  │
│  ├─ Voice: [American Female ▼]                              │
│  ├─ Speed: [━━━━━━●━━━] 1.0x                                │
│  └─ [✓] Read AI responses aloud                             │
│                                                              │
│  Wake Word (Experimental)                                    │
│  └─ [ ] Enable "Hey DevPulse" wake word                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Error States & Recovery

### User-Friendly Error Messages

| Actual Error | User Sees |
|--------------|-----------|
| CUDA OOM | "Not enough graphics memory. Try a smaller model or close other apps." |
| Model corrupted | "This model file is damaged. [Re-download]" |
| Backend crash | "AI temporarily unavailable. [Retry] or [Switch to backup model]" |
| Network timeout | "Download paused. [Resume] when connected." |

### Automatic Recovery

```
Slot fails to load
    ↓
1. Check fallback slot
   → If exists and compatible, load fallback
   → Notify user: "Using backup model"
    ↓
2. If no fallback, offer options:
   → "Try smaller model"
   → "Free up VRAM" (list what's using it)
   → "Report issue"
```

---

## 11. Slot Registry — Default Configuration

```rust
// Pre-configured slots for layman users
SlotRegistry::default_slots() = [
    Slot {
        id: "chat.brain",
        label: "AI Assistant",
        capability: TextGeneration,
        preferred_device: Gpu,
        loading: Hot,
        default_model: Some("Qwen3.5-9B-Q4_K_M.gguf"),
        fallback: Some("chat.brain.lite"),
    },
    Slot {
        id: "chat.brain.lite",
        label: "AI Assistant (Lite)",
        capability: TextGeneration,
        preferred_device: GpuWithCpuFallback,
        loading: OnDemand,
        default_model: Some("Qwen3-0.6B-Q4_K_M.gguf"),
        fallback: None,
    },
    Slot {
        id: "rag.embedder",
        label: "Search Brain",
        capability: Embedding,
        preferred_device: Cpu,  // Embedders are fast on CPU
        loading: Hot,
        default_model: Some("nomic-embed-text-v1.5.Q8_0.gguf"),
        source_tier: Bundled { bundled_path: "rag/nomic-embed.gguf" },
    },
    Slot {
        id: "voice.stt",
        label: "Voice Input",
        capability: SpeechToText,
        preferred_device: GpuWithCpuFallback,
        loading: OnDemand,
        default_model: Some("ggml-small.bin"),
    },
    Slot {
        id: "voice.tts",
        label: "Voice Output",
        capability: TextToSpeech,
        preferred_device: Gpu,
        loading: Warm,
        default_model: Some("kokoro-v1.0.int8.onnx"),
        source_tier: Bundled { bundled_path: "voice/kokoro-int8.onnx" },
    },
    Slot {
        id: "media.matting",
        label: "Background Removal",
        capability: VisionLanguage,  // Uses segmentation model
        preferred_device: Gpu,
        loading: OnDemand,
        default_model: Some("u2net.onnx"),
    },
]
```

---

## 12. Implementation Checklist

### Phase 1: Core Infrastructure (You Have This ✅)

- [x] Model registry with auto-discovery
- [x] Slot system with fallback chains
- [x] Hardware detection + VRAM budgeting
- [x] Multi-backend support (Candle, ORT, LlamaCpp)
- [x] Voice backends (Whisper, Kokoro)
- [x] Event system for UI updates

### Phase 2: User-Facing Model Management

- [ ] Settings UI: "AI Models" panel
- [ ] Per-slot model selector dropdown
- [ ] VRAM usage visualization
- [ ] Download manager with progress/pause/resume
- [ ] HuggingFace browser integration

### Phase 3: Hot Swap

- [ ] Graceful unload with request draining
- [ ] In-place model swap without restart
- [ ] Progress indicator during swap
- [ ] Rollback if new model fails to load

### Phase 4: Media Pipeline

- [ ] `media.matting` slot with U2Net/ISNet
- [ ] Camera capture via nokhwa
- [ ] Virtual camera output (DirectShow filter)
- [ ] Real-time background removal preview
- [ ] OBS integration via obs-websocket

### Phase 5: Polish

- [ ] First-run hardware wizard
- [ ] Model recommendations by tier
- [ ] Error recovery with user-friendly messages
- [ ] Telemetry opt-in for crash reports

---

## 13. Technical Requirements

### Minimum System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 64-bit | Windows 11 |
| CPU | 4 cores, AVX2 | 8+ cores |
| RAM | 8 GB | 16+ GB |
| GPU | None (CPU fallback) | 6+ GB VRAM |
| Storage | 5 GB (app + base models) | 20+ GB (full model library) |

### Supported GPU Vendors

| Vendor | Support Level | Notes |
|--------|---------------|-------|
| NVIDIA | Full | CUDA 12+, best performance |
| AMD | Full | ROCm on Linux, DirectML on Windows |
| Intel Arc | Experimental | oneAPI/SYCL |
| Apple Silicon | Full | Metal via Candle |

---

## 14. Summary: What Layman Users Experience

1. **Install DevPulse** → Hardware auto-detected
2. **First launch** → "Use Recommended" one-click setup
3. **Chat immediately** → AI assistant ready, no config needed
4. **Voice works** → Click mic to talk, hear responses
5. **Search works** → Type query, get relevant results instantly
6. **Media tools** → Background removal loads when needed
7. **Want more power?** → Settings > AI Models > Download bigger models
8. **Low VRAM?** → App suggests smaller models, graceful degradation

**Users never see:**
- Model formats (GGUF, ONNX, SafeTensors)
- Quantization levels (Q4_K_M, int8, fp16)
- Backend selection (Candle, ORT, LlamaCpp)
- VRAM allocation details
- Inference configuration

**Users always see:**
- Clear capability names ("AI Assistant", "Voice Input")
- Simple status indicators (●Ready, ○Not Loaded, ⚠️Error)
- Actionable buttons ([Load], [Unload], [Change Model])
- Friendly error messages with solutions

---

*Document Version: 1.0*
*Last Updated: 2026-04-07*
*Author: DevPulse Platform Team*


---

## 15. Advanced: Model State Machine (Technical)

DevPulse implements a **multi-stage loading pipeline** for optimal latency:

### State Transitions

```
COLD (disk) ──load_to_ram──► WARM (RAM) ──transfer_to_gpu──► HOT (VRAM) ──inference──► ACTIVE
     │                           │                               │                        │
     │                           │                               │                        │
     ▼                           ▼                               ▼                        ▼
  3-10 sec                   50-500ms                        5-20ms                   Immediate
```

### State Definitions

| State | Memory | VRAM | KV Cache | Latency to First Token |
|-------|--------|------|----------|------------------------|
| **Cold** | 0 | 0 | ✗ | 3-10 seconds |
| **Warm** | Model size | 0 | ✗ | 50-500ms |
| **Standby** | Minimal | Model size | Pre-allocated (empty) | <100ms |
| **Hot/Loaded** | Minimal | Model size | Pre-allocated (empty) | 5-20ms |
| **Active** | Minimal | Model + KV | Filled | Immediate (streaming) |

### Loading Strategies Mapped to States

| Strategy | Target State | Transition |
|----------|--------------|------------|
| `Hot` | Loaded | Boot → Load → Transfer → Ready |
| `Warm` | Warm | Boot → Load to RAM → Wait for request |
| `OnDemand` | Cold | Wait for request → Full load |
| `Signal` | Cold/Warm | Signal fires → Load |

### Warm → Hot Promotion (Automatic)

When a request arrives for a `Warm` model:

1. **Check VRAM budget** — Is there room?
2. **If yes** → Transfer to GPU (50-500ms), update state to `Loaded`
3. **If no** → Run on CPU (slower) OR evict another model

### Inference Optimization

Once `Loaded`, the model is ready for inference. DevPulse optimizes:

1. **KV Cache Pooling** — Pre-allocated slots, reused across requests
2. **Continuous Batching** — Multiple requests batched for throughput
3. **Speculative Decoding** — (Optional) Draft model for faster generation

### User Impact

| User Action | What Happens | Perceived Latency |
|-------------|--------------|-------------------|
| App launch | `Hot` slots load to VRAM | User waits ~5-10s at splash screen |
| First chat | Model already `Loaded` | Instant response |
| Voice command | `voice.stt` promotes Warm→Hot | ~200ms then instant |
| BG removal | `media.matting` loads OnDemand | ~2-3s first time, then instant |

### Memory Pressure Handling

When VRAM is tight:

```
1. Identify lowest-priority Loaded model (by LoadingStrategy)
2. Demote to Warm (transfer weights back to RAM)
3. Free VRAM
4. Load requested model
5. If RAM also tight, demote Warm to Cold (unload)
```

Priority order for eviction:
1. `OnDemand` models idle >5 minutes
2. `Warm` models not accessed recently
3. `Hot` models with lower priority slots

---
