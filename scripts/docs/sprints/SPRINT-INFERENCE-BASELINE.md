# SPRINT: Inference Baseline — Make the App Real

**Date**: 2026-03-30
**Status**: DRAFT — Owner approval required before execution
**Depends on**: SPRINT-PLATFORM-WIRING P0 (specta bindings)

---

## What This Sprint Does

Gets inference running. Gets Kokoro talking. Gets every hub route showing REAL data
from REAL backends. No more glass facades with `--` and `0`.

---

## GAP MAP — What Exists vs What's Needed

### RUST BACKEND (What's Built)

| Layer | What Exists | Lines | Status |
|-------|------------|-------|--------|
| **KokorosAdapter** | Full: boot, ping, synthesize, available_voices | 81 | REAL — needs model files + espeak fix |
| **Whisper adapter** | Boot, transcribe, health | 176 | REAL — needs sherpa-rs model files |
| **Embedder adapter** | Boot, embed, dim check | 144 | REAL — needs model download |
| **CAG Pipeline** | Full: embed→search→RRF fuse→dedup→rerank→hydrate→assemble | 273 | REAL — needs adapters wired |
| **Moka cache** | Working, stats exposed via IPC | — | REAL — already live |
| **LibSQL service** | Boot, migrate, query | — | REAL — already live |
| **SurrealDB service** | HTTP server on :8822, KV mode | — | REAL — boots with engine |
| **DuckDB service** | Analytics adapter | — | REAL — boots with engine |
| **RRO (Qdrant)** | Vector store adapter | — | Feature-gated, builds |
| **Minion types** | MinionRole, VoiceTone, Persona | 40 | TYPES ONLY — no execution |
| **Minion factory** | 1 line (stub) | 1 | STUB |
| **HMM reasoning** | 1 line (stub) | 1 | STUB |
| **Voice service** | Engine wrapper for Kokoros | 50 | REAL — wraps adapter |
| **Embedder service** | Engine wrapper | 65 | REAL — wraps adapter |

### RUST BACKEND (What's Missing)

| Component | Description | Blocks |
|-----------|------------|--------|
| **ResourceArbiter** | GPU/VRAM detection, allocation planning | Maestro route showing real hardware |
| **InferenceManager** | Model loading/unloading, CandleProvider | Any local inference |
| **CandleProvider** | Forward pass, KV cache, token generation | Chat with local LLM |
| **ModelManager** | hf-hub download, cache dir, progress | Model management UI |
| **Candle feature wiring** | Feature is enabled but no code uses candle-core/nn/transformers | Everything inference |
| **Kokoro espeak fix** | espeak-rs-sys needs system install support — kokoros feature disabled in Tauri | TTS |
| **llguidance integration** | Constrained decoding — fork exists but not wired | Structured output |
| **Minion execution** | factory.rs is 1 line. No spawn, no signal routing, no task execution | Maestro route |
| **HMM / reasoning** | 1 line stub. No state machine, no context switching | Rumination pipeline |

### TAURI COMMANDS (What's Registered)

| Command | Module | Status |
|---------|--------|--------|
| `get_boot_state` | sys/boot | REAL — returns boot snapshot |
| `get_status` | devmaestro | REAL — returns SystemHealth |
| `fetch_dashboard` | devpulse | REAL — LibSQL + DuckDB + Moka stats |
| `get_process_metrics` | devpulse | REAL — OS CPU/memory/PID |
| `load_recent` | chat | REAL — chat history from LibSQL |
| `send_message` | chat | REAL — persists to LibSQL |
| `log` | sys/logger | REAL — frontend→Rust log bridge |
| `create_canvas` | thinkmaestro | STUB — empty function |
| `connect_peer` | wiredfront | STUB — empty function |

### FRONTEND STATE (What's Wired)

| Store | Runes | IPC | Status |
|-------|-------|-----|--------|
| `globalState` | 9 $state | None (UI only) | REAL |
| `platformState` | 6 $state | get_boot_state, get_status + 2 listeners | REAL |
| `devpulseState` | 4 $state | fetch_dashboard, get_process_metrics | REAL |
| Chat page | 4 $state | load_recent, send_message | REAL |
| DevForge | — | — | NOTHING |
| Maestro | — | — | NOTHING |
| OverMind | — | — | NOTHING |
| WiredFront | — | — | NOTHING |

---

## PHASES

### STOP — Owner Decision Required

**Question**: What's the priority order for making hubs real?

**My recommendation based on your doc:**

```
Phase 1: INFERENCE FOUNDATION (Candle loads a model, generates tokens)
Phase 2: MAESTRO HUB (hardware detection, model status, inference metrics)
Phase 3: SETTINGS (model management UI, hardware tier display)
Phase 4: KOKORO TTS (voice output wired to chat)
Phase 5: DEVFORGE (build pipeline — reads Cargo.toml, pnpm, git status)
Phase 6: WIREDFRONT (screenshots, file system — Tauri APIs)
Phase 7: OVERMIND (playground — needs inference first)
```

**Rationale**: Phases 1-4 are the core IP. Phases 5-7 are features that need
the core to exist. DevForge can show real data without inference (git/build info).

**Options**:
- A) Above order (inference-first)
- B) DevForge first (quickest to show real data — git status, package.json, no ML needed)
- C) Parallel — DevForge (no ML) + Inference foundation simultaneously

**Impact**: This decides what we build first and what you SEE first.

---

## PHASE 1: Inference Foundation

**Goal**: Candle loads Qwen3-0.6B (smallest model), generates tokens on CPU.
Proof of life. No GPU, no optimization, just "the engine can think."

### Task 1.1: ModelManager — Download + Cache

Create `kernel/devpulse-maestro/src/cortex/inference/model_manager.rs`:

```
- ModelPaths struct (cache dir: ~/.devpulse/models/)
- ensure_model(model_id) → downloads via hf-hub if missing
- Progress callback for UI download bar
- Verify GGUF file integrity after download
```

**Files**: New `cortex/inference/` module directory
**Depends on**: hf-hub already in Cargo.toml (optional, candle feature)

### Task 1.2: CandleProvider — Load + Forward Pass

Create `kernel/devpulse-maestro/src/cortex/inference/candle_provider.rs`:

```
- Load GGUF model via candle-transformers
- Tokenizer loading from hf-hub
- Single forward pass (tokens → logits)
- Basic greedy/sampling decode loop
- KV cache (simple, not optimized)
- CPU device only (Phase 1)
```

**Target model**: `Qwen/Qwen3-0.6B-GGUF` (Q4_K_M) — smallest, fastest proof
**Files**: New file in `cortex/inference/`
**Depends on**: candle-core, candle-nn, candle-transformers, tokenizers (all in Cargo.toml)

### STOP — Owner Decision Required

**Question**: Which Qwen3 GGUF to use for proof of life?
**Options**:
- A) `Qwen/Qwen3-0.6B` — Embedding model, not instruction-tuned (fast but not chat)
- B) `unsloth/Qwen3-4B-Instruct-GGUF` — The actual minion brain (larger, 3GB)
- C) Any small instruction-tuned GGUF that Candle's Qwen2 impl supports
or misthril or ollama if they are actually competing with Qw3e

**Impact**: 0.6B downloads in seconds, 4B takes minutes. 0.6B proves the pipeline,
4B proves the product.

### Task 1.3: InferenceManager — Orchestrate Models

Create `kernel/devpulse-maestro/src/cortex/inference/mod.rs`:

```
- InferenceManager struct (owns ModelManager + CandleProvider)
- load_model(model_id, device) → downloads if needed, loads into Candle
- generate(prompt, max_tokens) → streaming token output
- unload_model()
- status() → { loaded: bool, model_id, device, vram_used }
```

### Task 1.4: Tauri Command — `inference_generate`

Add to `interfaces/desktop/src-tauri/src/commands/`:

```rust
#[tauri::command]
pub async fn inference_generate(
    prompt: String,
    max_tokens: u32,
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    // Delegate to engine → maestro → inference manager
}
```

### Task 1.5: Wire Chat to Local Inference

Update chat route to call `inference_generate` instead of (or alongside)
storing messages. Messages go to LibSQL AND to the inference engine.
Response streams back token-by-token.

---

## PHASE 2: Maestro Hub — Real Hardware + Model Status

**Goal**: Maestro route shows REAL hardware info, model load status, inference metrics.

### Task 2.1: ResourceArbiter

Create `kernel/devpulse-maestro/src/cortex/inference/arbiter.rs`:

```
- Detect GPU via nvml-wrapper (NVIDIA) or fallback
- Read free VRAM, total VRAM
- Decide AllocationPlan (Full/Standard/GameMode/Minimal)
- Expose as Tauri command: get_hardware_info
```

**Depends on**: nvml-wrapper needs to be added to Cargo.toml

### STOP — Owner Decision Required

**Question**: nvml-wrapper is NOT in Cargo.toml currently. Add it?
Also: Windows DirectML detection vs CUDA-only for Phase 1?

### Task 2.2: Maestro Tauri Commands

Add commands:

```
get_hardware_info → { gpu_name, vram_total, vram_free, allocation_mode }
get_model_status → { models: [{ id, loaded, device, vram }] }
get_inference_metrics → { requests, avg_latency, tokens_generated, cache_hits }
```

### Task 2.3: Maestro Frontend State + Route

Create `domains/app/maestro/runes/maestro.runes.svelte.ts`:

```
- maestroState with $state for hardware, models, metrics
- Service file with invoke calls
- Wire route to display REAL data
```

Replace every `--` and `0` in the Maestro route with live values.

---

## PHASE 3: Settings — Model Management UI

**Goal**: DevPulse Settings becomes the model management panel from your spec.

### Task 3.1: Settings Tauri Commands

```
list_available_models → models from registry with download status
download_model(model_id) → progress events
get_model_config → current allocation plan
set_model_config(plan) → apply new allocation
```

### Task 3.2: Settings Route Rewrite

Replace hardcoded "Developer" / "ColdLight Dark" with:
- Hardware tier display (from ResourceArbiter)
- Model list with download/load/unload controls
- VRAM/RAM usage bars (real values)
- Allocation mode selector

---

## PHASE 4: Kokoro TTS

**Goal**: Chat responses can be spoken. Kokoro synthesizes audio.

### Task 4.1: Fix espeak-rs-sys Build

The blocker: `kokoros` feature is disabled because espeak-rs-sys needs system install.

**Options**:
- A) Install espeak-ng on Windows, enable feature
- B) Fork kokoros to use piper-rs instead of espeak (your note says "piper-rs fork sprint")
- C) Use ONNX-only kokoro path that doesn't need espeak for phonemization

### STOP — Owner Decision Required

**Question**: Which path for Kokoro TTS? The adapter code EXISTS (81 lines, complete).
The blocker is purely the espeak system dependency.

### Task 4.2: TTS Tauri Command

```
synthesize_speech(text, voice, speed) → audio samples (f32 PCM)
list_voices → available voice styles
```

### Task 4.3: Audio Playback in Frontend

Wire PCM audio to Web Audio API for playback in chat.

---

## PHASE 5: DevForge — Real Build Data (No ML Needed)

**Goal**: Show REAL build/CI data. This doesn't need inference.

### Task 5.1: DevForge Tauri Commands

```
get_project_info → { cargo_toml, package_json, git_branch, git_status }
get_build_status → { last_build, errors, warnings }
list_dependencies → { rust: [...], node: [...] }
get_node_versions → { node, pnpm, npm }
```

All of this is file system reads + command execution. No ML.

### Task 5.2: DevForge Frontend State + Route

Create `domains/app/devforge/runes/devforge.runes.svelte.ts`.
Replace every placeholder in the DevForge route.

---

## PHASE 6: WiredFront — File System + Screenshots

**Goal**: Basic file management. Screenshot capture via Tauri APIs.

### Task 6.1: WiredFront Tauri Commands

```
list_captures → files in capture directory
take_screenshot → Tauri screenshot API
get_storage_stats → { total_files, total_size_mb }
```

### Task 6.2: WiredFront Frontend State + Route

Replace placeholders with real file system data.

---

## PHASE 7: OverMind — Playground (Needs Inference)

**Goal**: Interactive prompt playground that uses local inference.

Deferred until Phase 1-2 complete — needs a working inference engine.

---

## EXECUTION RULES

1. Each phase compiles before moving to next
2. Each new Tauri command gets a typed specta binding
3. Each route state store uses Svelte 5 runes ($state, $derived, $effect)
4. No hardcoded values remain in any route touched
5. No stubs — if we touch a route, it shows REAL data or we don't touch it
6. Frontend service files follow devpulse.service.ts pattern
7. All IPC types in `sys/generated/` kept in sync with Rust structs

---

## FILES REFERENCED

### Rust (Existing)
- `kernel/devpulse-maestro/src/cortex/persistence/kokoros.rs` — Kokoro adapter (81 lines, complete)
- `kernel/devpulse-maestro/src/cortex/persistence/whisper.rs` — Whisper adapter (176 lines)
- `kernel/devpulse-maestro/src/cortex/persistence/embedder.rs` — Embedder adapter (144 lines)
- `kernel/devpulse-maestro/src/cortex/cag/pipeline.rs` — Full CAG retrieval pipeline (273 lines)
- `kernel/devpulse-maestro/src/cortex/minions/types.rs` — MinionRole, Persona types (40 lines)
- `kernel/devpulse-maestro/src/cortex/minions/factory.rs` — STUB (1 line)
- `kernel/devpulse-maestro/src/cortex/reasoning/hmm.rs` — STUB (1 line)
- `systems/devpulse-engine/src/platform/services/voice.rs` — VoiceService wrapper (50 lines)
- `systems/devpulse-engine/src/platform/services/embedder.rs` — EmbedderService wrapper (65 lines)

### Rust (To Create)
- `kernel/devpulse-maestro/src/cortex/inference/mod.rs` — InferenceManager
- `kernel/devpulse-maestro/src/cortex/inference/candle_provider.rs` — Candle forward pass
- `kernel/devpulse-maestro/src/cortex/inference/model_manager.rs` — hf-hub download + cache
- `kernel/devpulse-maestro/src/cortex/inference/arbiter.rs` — ResourceArbiter (GPU detection)

### Frontend (Existing)
- `interfaces/desktop/src/lib/domains/app/devpulse/` — reference pattern for state + service
- `interfaces/desktop/src/routes/(app)/maestro/+page.svelte` — stub to replace
- `interfaces/desktop/src/routes/(app)/devforge/+page.svelte` — stub to replace
- `interfaces/desktop/src/routes/(app)/wiredfront/+page.svelte` — stub to replace
- `interfaces/desktop/src/routes/(app)/overmind/+page.svelte` — stub to replace
- `interfaces/desktop/src/routes/(app)/devpulse/settings/+page.svelte` — stub to replace

### Frontend (To Create)
- `interfaces/desktop/src/lib/domains/app/maestro/runes/maestro.runes.svelte.ts`
- `interfaces/desktop/src/lib/domains/app/maestro/services/maestro.service.ts`
- `interfaces/desktop/src/lib/domains/app/devforge/runes/devforge.runes.svelte.ts`
- `interfaces/desktop/src/lib/domains/app/devforge/services/devforge.service.ts`
- `interfaces/desktop/src/lib/domains/app/wiredfront/runes/wiredfront.runes.svelte.ts`
- `interfaces/desktop/src/lib/domains/app/wiredfront/services/wiredfront.service.ts`

### Cargo.toml Changes Needed
- `kernel/devpulse-maestro/Cargo.toml` — add nvml-wrapper (optional, cuda feature)
- `interfaces/desktop/src-tauri/Cargo.toml` — enable kokoros feature (after espeak fix)

---

## OWNER DECISION GATES (Summary)

| # | Question | Phase | Impact |
|---|----------|-------|--------|
| 1 | Priority order: inference-first (A), devforge-first (B), or parallel (C)? | All | Determines build sequence |
| 2 | Which GGUF for proof of life: 0.6B (A), 4B (B), other (C)? | 1 | Download time + what we prove |
| 3 | nvml-wrapper addition + CUDA vs DirectML for Phase 1? | 2 | GPU detection strategy |
| 4 | Kokoro fix path: install espeak (A), piper-rs fork (B), ONNX-only (C)? | 4 | TTS unblock strategy |
| 5 | DevPulse Settings — model management UI scope for v1? | 3 | How much of the spec mockup to build |
