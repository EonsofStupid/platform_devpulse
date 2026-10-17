---
id: 0007
boundary: engine
paths:
  - systems/devpulse-engine/src/platform/runtimes/
touches: [kernel-model-loader, kernel-clyffy, desktop-tauri, deps, xtask]
status: draft
owner: jesse
created: 2026-10-11
updated: 2026-10-11
supersedes: []
specs:
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md
  - .plan/0001-engine--rebuild-onboarding-workflow.md
---

# Run AI as prebuilt runtimes, not compiled-in engines

## Goal

DevPulse compiles no AI inference engine. Every local capability runs as an
upstream **prebuilt server binary** that DevPulse installs only when the user
chooses it in the UI, matched to their hardware, verified, and supervised
(start, health, restart, update, remove). A running runtime is just another
endpoint (plan 0001) — nothing else in the app knows it is local.

## Context — verified 2026-10-11

| Fact | Evidence |
| --- | --- |
| candle 0.10.2 and ONNX Runtime (`ort`, git fork `eonsofstupid/ort@f5c1548`) are compiled into the desktop app | `cargo tree -p devpulse_desktop_backend -i candle-core` / `-i ort-sys` → via `devpulse-clyffy` → `model-loader` |
| moshi and llama.cpp are **not** in the app build, but their full source trees are still vendored and wired | `deps/moshi/`, `deps/llama-cpp-rs/`; root [Cargo.toml](../Cargo.toml) `exclude` (lines 21–22) and `[patch.crates-io]` (lines 196–231) |
| `model-loader` compiles moshi by default whenever it is built on its own | [kernel/model-loader/Cargo.toml:8](../kernel/model-loader/Cargo.toml#L8) `default = ["candle-backend", "moshi-sts", "mode-dev"]` |
| 1.1 GB of hand-placed llama-server + CUDA 12 DLLs bundled as a Tauri sidecar | `interfaces/desktop/src-tauri/binaries/` (gitignored, 11 files); launched at [commands/llama/mod.rs:87](../interfaces/desktop/src-tauri/src/commands/llama/mod.rs#L87). Every install would ship CUDA; one fixed build; no updates; nothing for AMD, Intel or CPU-only machines |
| Four overlapping llama command modules | `commands/llama` (sidecar), `commands/llama_cpp` (FFI static-lib devtool — dead since FFI left the build), `commands/llama_cpp_embedded` (config), `commands/ollama` |

Upstream prebuilt binaries (GitHub API, 2026-10-11):

| Project | What ships | Note |
| --- | --- | --- |
| llama.cpp | Rolling `bNNNNN` pre-releases, several a day, 36 files each. Windows: CPU x64/arm64, CUDA 12.4 / 13.4 (+ `cudart` zips), ROCm 10.0 (AMD), SYCL and OpenVINO (Intel), Vulkan x64/arm64, OpenCL Adreno | `/releases/latest` returns `v0.6.0` (1 file) — the resolver must pick the newest `b` build. CPU x64 zip = 19.5 MB |
| whisper.cpp | Binaries on `bNNNN` pre-releases: CPU, CUDA 11.8 / 12.4 / 13.4, Win32, BLAS | Its `vX.Y.Z` tags carry no files |
| sherpa-onnx v1.13.8 | Prebuilt Windows speech-recognition and text-to-speech executables + native libs (287 files) | Candidate for speaking |
| moshi | **Nothing prebuilt** — last release 2024, 0 files | Source-build only |
| Every file | `digest: sha256:…` on each GitHub release asset | Download verification needs no extra infrastructure |

This is the pattern LM Studio (downloadable runtimes) and Jan (llama.cpp
backend variants per hardware) use, and it matches the standing rule: llama
runs as a UI-opted, fetched, supervised subprocess — never compiled or
bundled.

## Capability → runtime

| Capability | Runtime | Endpoint it exposes |
| --- | --- | --- |
| Brain | llama.cpp `llama-server` | OpenAI-compatible chat |
| Vision | the same `llama-server`, with the model's vision projector | image input in chat |
| Memory | `llama-server --embedding` / `--reranking` with an embedding / reranker model | `/v1/embeddings`, rerank |
| Voice — listening | whisper.cpp `whisper-server` | transcription over HTTP |
| Voice — speaking | to decide (sherpa-onnx is the prebuilt candidate) | speech synthesis |
| Speech-to-speech (moshi) | none prebuilt — removed; usable only as a remote endpoint someone else runs | — |

## Lifecycle (engine `platform/runtimes/`)

1. **Resolve** — hardware probe picks the variant (CUDA 13.4 / 12.4, ROCm,
   SYCL/OpenVINO, Vulkan, CPU; x64 or arm64) and the newest build.
2. **Install** — only on the user's click: resumable download with real
   progress, SHA-256 checked against the release digest, extracted to the
   per-user app data folder (`runtimes/<name>/<build>/`) — never the repo,
   never the installer.
3. **Run** — free port, arguments from the catalog, stdout/stderr into
   tracing, `/health` before it is marked ready.
4. **Supervise** — restart with backoff on crash; a Windows Job Object so
   children die with the app; clean stop on exit.
5. **Update / roll back** — newer build on request; the previous build kept
   for "Go back to previous" (owner UX spec §5).
6. **Remove** — delete its folder; the endpoint disappears.

Every state change is an engine event; the Model Loader card renders it and
sends intents (install, start, stop, update, remove) — dumb UI.

## Non-goals

- Bundling any runtime in the installer.
- Building any runtime from source, in CI or locally.
- Changing how remote endpoints work (plan 0001).

## Phases

Each phase ≤5 files, verified, approval between phases.

1. **Inventory (no code).** Map every `model-loader` slot and backend to a
   runtime above, or mark it dropped. Known gaps to settle: the image
   embedder slot (SigLIP), the ort-based embedder, moshi, text-to-speech.
2. **Catalog + resolver.** Runtime catalog data (llama.cpp, whisper.cpp),
   variant selection by OS / arch / accelerator, newest-`b`-build lookup.
   Verify: unit tests on recorded release JSON + a live GitHub API test.
3. **Installer.** Resumable download, digest check, extract, progress events.
   Verify: live install of the llama.cpp CPU build, digest matches.
4. **Supervisor.** Launch, health, restart, stop, Job Object, logs. Verify:
   live — llama-server runs, `/health` ok, plan 0001's probe identifies it as
   an OpenAI-compatible endpoint with the user's model.
5. **Intents + Model Loader card.** Tauri commands/events; the card's install
   / start / stop / update / remove. Verify: CDP screenshots of each state.
6. **Remove the bundle.** `src-tauri/binaries/` (1.1 GB), sidecar config,
   `commands/llama`, `commands/llama_cpp`, `commands/llama_cpp_embedded`.
7. **Remove compiled-in engines.** `model-loader` features `candle-backend`,
   `ort-backend`, `moshi-sts`, `llama-cpp-*` and their code; `devpulse-clyffy`
   `candle`; `deps/moshi/`, `deps/llama-cpp-rs/`; root Cargo `exclude` /
   `[patch]` entries; the ort fork. Verify: `cargo tree` shows no candle, ort,
   moshi or llama-cpp; build time before/after recorded.
8. **Voice runtimes.** whisper-server for listening; the chosen speaking
   runtime.
9. **Checkpoint.** Owner installs, runs, updates and removes each runtime
   from the UI on this machine.

## Decisions needed

1. Placement: the runtime catalog (which runtime serves which capability) as
   kernel AI configuration, the supervisor in the engine. Confirm.
2. Speaking runtime: sherpa-onnx, or another prebuilt option.
3. moshi: drop it (no prebuilt binary exists). Confirm.
4. In-process-only models (image embedder, ort embedder): replace with models
   `llama-server` can serve, or drop those slots.
5. Runtime storage: per-user app data folder (global scope). Confirm.

## Verification

- `cargo clippy -p devpulse-engine -- -D warnings`, `cargo test -p devpulse-engine`.
- `cargo tree -p devpulse_desktop_backend -i candle-core` (and `ort-sys`,
  `moshi`, `llama-cpp-sys-2`) — all must report no match after Phase 7.
- Live on this machine: install → run → probe → stop → update → remove, with
  screenshots, log lines and the runtime folder on disk matching.

## Log

- 2026-10-11 — Drafted from owner direction ("pull their binary … the UI
  configures it and DevPulse manages the lifecycle"). Facts above verified by
  `cargo tree` and the GitHub releases API the same day.
