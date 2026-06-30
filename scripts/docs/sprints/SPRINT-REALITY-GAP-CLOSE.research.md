# Reality Audit — DevPulse Stack (2026-04-21)

**Date:** 2026-04-21
**Trigger:** Two weeks of "placeholder-pretending-to-be-done" sessions. Owner demanded proof of what is REAL vs FAKE vs PARTIAL on disk.
**Method:** Three parallel Explore-agent audits reading actual function bodies across model-inference, voice, and boot/onboarding/devtools surfaces. No trust given to doc-comments. Each subsystem graded by what the code actually does.
**Status:** COMPLETE — findings below are direct from disk.

---

## Audit #1 — Model Inference Stack

| Subsystem | Verdict | File | Evidence |
|-----------|---------|------|----------|
| HuggingFace download | **REAL** | `kernel/model-loader/src/models/download.rs` (656 LOC) | `hf-hub = 0.4`, `ApiBuilder`, real HTTP, progress tracking, resume on partial, bundle planning for SafeTensors shards / GGUF / ONNX. `link_or_copy` writes to disk. |
| Candle inference | **REAL** | `kernel/model-loader/src/backends/candle/backend.rs` (1000+ LOC) | `InferenceBackend` trait. `tokenizers` crate. Forward-pass loop with temperature sampling (lines 140-197). GGUF via Candle quantized loaders (qwen3, phi3, llama fallback). SafeTensors dispatch on `config.json.architectures`. Real logit→token sampling. |
| Model loader service | **REAL** | `kernel/model-loader/src/service.rs` (1300+ LOC), `systems/devpulse-engine/src/platform/services/model_loader.rs` (547 LOC) | Fine-grained locks, `load_slot` dispatches to `BackendPool::acquire` → spawns `InferenceBridge`. No hardcoded VRAM. |
| VRAM accounting | **REAL** | `kernel/model-loader/src/hardware/vram.rs` (170 LOC), `hardware/metrics.rs` | Real NVML on Windows, sysinfo fallback. `VramBudget` computed from slots + hardware state. Dedupes shared instances. |
| Tauri model commands | **REAL** | `interfaces/desktop/src-tauri/src/commands/models/mod.rs` | Wraps real service calls. No canned data. |
| Inference bridge / streaming | **REAL** | `kernel/model-loader/src/backends/bridge.rs` (300+ LOC) | Dedicated OS thread running backend, token-streaming via `devpulse_telemetry` channels. |
| **Ollama sidecar** | **FAKE** | nothing | Doc-only refs at `platform/module.rs:26` and `platform/config/runtimes/mod.rs:13-14`. Zero process spawn, zero HTTP client, zero service. |
| **"Ollama embedded"** (should be renamed `llama_cpp_embedded`) | **FAKE + MISNAMED** | nothing | Doc-only. No FFI, no linking. The term is inaccurate: Ollama is not a Rust library; what "embedded" would actually mean is linking `llama-cpp-2`. Candle does NOT subsume this — Candle only implements a handful of architectures (`qwen3`, `phi3`, `llama`), while llama.cpp covers hundreds via GGUF. |

---

## Audit #2 — Voice Stack

| Subsystem | Verdict | File | Evidence |
|-----------|---------|------|----------|
| Whisper STT | **REAL** | `kernel/model-loader/src/backends/ort/whisper.rs:218-326` | Loads encoder+decoder ONNX, resamples to 16 kHz, mel spectrogram via FFT, autoregressive greedy decode. |
| Mic capture | **REAL** | `interfaces/desktop/src-tauri/src/commands/voice/mod.rs:408-505` | cpal via rodio, real device enumeration, buffer-callback, linear-interp resample. |
| Kokoro TTS | **REAL** | `kernel/model-loader/src/backends/ort/kokoro.rs:170-247` | ONNX + vocab required (hard error if missing). eSpeak phonemizer. ort session with input_ids / style / speed tensors. Outputs 24 kHz f32 PCM. |
| TTS playback | **REAL** | `commands/voice/mod.rs:173-248` | rodio `OutputStream` + `Sink` + `SamplesBuffer`. Real blocking poll on stop flag. |
| Voice pipeline E2E | **REAL** | `commands/voice/mod.rs:929-1032` (`run_sts_pipeline`) | 4 real stages: decode → STT slot → brain slot → TTS slot → playback. Zero disconnects. |
| Voice Tauri commands | **REAL** | 11 commands wired | `speak`, `transcribe_audio`, `voice_smoke_test`, `run_sts_pipeline`, profile CRUD — all do real work. |
| Piper TTS | **REAL** | `backends/ort/piper.rs` | Pure-Rust, feature-gated but non-empty when enabled. |
| Orpheus TTS | **REAL** | `backends/orpheus.rs` | Dual-model LLM + SNAC codec, feature-gated. |

**Known incomplete (not broken pipeline):**
- Mic enumeration hardcodes `mic_detected: false` in `get_voice_status()` (line 158). Actual capture still works.
- Style vectors for Kokoro zero-init (line 212 of kokoro.rs). Per-voice style embeddings not loaded from registry yet.
- Whisper is burst-mode (decode all at once). No progressive chunk streaming.

---

## Audit #3 — Boot, Onboarding, Devtools

| Subsystem | Verdict | File | Evidence |
|-----------|---------|------|----------|
| Boot pipeline | **REAL** | `src-tauri/src/lib.rs:305-437`, `platform/boot/mod.rs` | Window shows immediately, boot runs on detached task. Sequential gated pipeline with real service health validation. `platform.health()` verifies all services post-boot. `boot.log` writes real-time to file + stderr. |
| Setup wizard | **REAL** | `src/lib/setup-wizard/SetupWizardOverlay.svelte` + 5 view components | 5-view flow (welcome → system-check → config → validate → done). `models.state.svelte.ts` listens to `platform:models-status` events. Real IPC (`assign_model_to_slot`, `load_slot`, `mark_setup_complete`). `is_setup_complete()` persists across launches. |
| LibSQL devtool | **REAL** | `routes/(devtools)/devtools/libsql/+page.svelte`, `commands/sys/relational.rs:77-150` | `libsql_health_all` runs real `SELECT 1` against system + user DBs, measures latency. Tables + Console extras work. |
| DuckDB devtool | **REAL** | `.../duckdb/+page.svelte`, `commands/sys/analytics.rs:55-89` | `duckdb_health` calls `adapter.ping()`, returns latency + error state. Tables + Console extras work. |
| SurrealDB devtool | **PARTIAL** | `.../surreal/+page.svelte`, `commands/sys/graph.rs:169+` | Status + Browser + Console real. Config/Logs/Actions tabs are documented placeholders awaiting service-commands phase. |
| DevForge devtool | **REAL** | `.../devforge/+page.svelte`, `commands/devforge/mod.rs` | All 4 charter verbs wired (`devforge_start/stop/restart/health`). Projects tab real. Status reflects actual REH state. |
| **Cache devtool** | **FAKE** | `.../cache/+page.svelte:17` | Hardcoded `{ state: "unknown", label: "Not wired yet" }`. Every tab explicit placeholder. Zero backend commands. |
| **Project DB devtool** | **FAKE (frontend)** | `.../project_db/+page.svelte:13`; backend at `commands/sys/project_db.rs:71-219` | Backend commands EXIST (`init_project_db`, `project_db_health`, etc.) but frontend has no state rune and never calls them. One-sided gap — easier to close than others. |
| **Candle devtool** | **FAKE** | `.../candle/+page.svelte:15` | Hardcoded badge. Zero `candle_health` / `candle_save_config` / etc. commands in `commands/` tree. |
| **Ollama sidecar devtool** | **FAKE** | `.../ollama_sidecar/+page.svelte:14` | Hardcoded badge. Zero service, zero commands. |
| **Ollama embedded devtool** | **FAKE** | `.../ollama_embedded/+page.svelte:14` | Hardcoded badge. Zero service, zero commands. |

---

## Honest Gap Summary

**Real and working (bulk of the stack):**
- Voice pipeline end-to-end — STT + brain + TTS + playback
- Model loader + Candle inference + HF downloads + VRAM accounting
- Boot pipeline + setup wizard + persistence
- 4 store/runtime devtools wired to real health probes

**Genuinely not built:**
- Ollama sidecar — the whole feature. No service, no commands, no frontend wiring.
- `llama_cpp_embedded` (mislabeled "ollama embedded") — same. Candle does NOT cover this gap: Candle is architecture-by-architecture in Rust, llama.cpp is broad GGUF coverage. Keeping this lane matters for users bringing non-Candle-supported models.
- Candle devtool surface — the backend is real; there is NO devtool surface for it (no `candle_*` commands exist).
- Cache devtool surface — backend may exist in `services/cache.rs` but no devtool commands or frontend wiring.

**One-sided gaps (easy close):**
- Project DB devtool — backend commands exist, frontend just never calls them.
- SurrealDB devtool Config/Logs/Actions — service commands need author, frontend scaffold already in place.

**Known rough edges (not broken, just unfinished):**
- Kokoro per-voice style vectors not loaded from registry (zero-init today).
- Whisper no streaming/progressive decode (burst mode).
- Mic-detected flag hardcoded to `false` in voice status.

---

## SSOT Map — what lives where

| Concern | Authoritative location |
|---------|------------------------|
| Inference backends (Candle, ort, voice pool) | `kernel/model-loader/src/backends/` |
| Model download + bundle planning | `kernel/model-loader/src/models/download.rs` |
| VRAM + GPU metrics | `kernel/model-loader/src/hardware/` |
| Platform service trait + holder pattern | `systems/devpulse-engine/src/platform/services/mod.rs` |
| ManagedModule charter (new) | `systems/devpulse-engine/src/platform/module.rs` |
| Runtime-axis config skeleton | `systems/devpulse-engine/src/platform/config/runtimes/mod.rs` |
| Tauri commands for models | `interfaces/desktop/src-tauri/src/commands/models/mod.rs` |
| Tauri commands for voice | `interfaces/desktop/src-tauri/src/commands/voice/mod.rs` |
| Tauri commands for DevForge | `interfaces/desktop/src-tauri/src/commands/devforge/mod.rs` |
| Devtool shell (shared) | `interfaces/desktop/src/lib/domains/platform/_shared/ServiceDevtoolShell.svelte` |
| Devtool routes | `interfaces/desktop/src/routes/(devtools)/devtools/{service}/+page.svelte` |
| Setup wizard | `interfaces/desktop/src/lib/setup-wizard/` |

No SSOT duplication found for these concerns. The `services/` trait pattern and the new `ManagedModule` trait coexist — that is the migration boundary, not a bug.

---

## Anti-Pattern Risks for Gap-Close

- **Adding a 7th trait.** Each service already picks ONE of {`Service`, `ManagedModule`}. New services must use `ManagedModule` (the charter). No new variants.
- **Rolling my own HTTP client for Ollama.** Use `reqwest` (already in the tree via telemetry — confirm in Cargo.toml) to hit `127.0.0.1:11434`.
- **Spawning Ollama without `kill_on_drop`.** DevForge pattern already shows the correct spawn idiom (`Command::kill_on_drop(true)` + `CREATE_NO_WINDOW`). Copy it.
- **Placeholder frontends that lie.** If a tab can't be real yet, it must say "not wired — command `{name}` pending" — the existing placeholder pattern is ACCEPTABLE because it is transparent. Do not regress by hiding missing wiring behind fake green badges.
- **Inventing command names.** Commands follow `{service}_{verb}` — `ollama_sidecar_start`, `cache_health`, `candle_health`. No creative renaming.
