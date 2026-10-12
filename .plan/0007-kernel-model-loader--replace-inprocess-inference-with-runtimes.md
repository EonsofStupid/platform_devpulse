---
id: 0007
boundary: kernel-model-loader
paths:
  - kernel/model-loader/config/runtimes.default.toml
  - kernel/model-loader/src/runtimes/
  - kernel/devpulse-clyffy/src/cortex/persistence/runtime.rs
touches: [kernel-clyffy, engine, desktop-tauri, desktop-devtools, desktop-models, xtask, deps, config]
status: draft
owner: jesse
created: 2026-10-11
updated: 2026-10-12
supersedes: []
specs:
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md
  - .plan/0001-engine--rebuild-onboarding-workflow.md
---

# Run AI as prebuilt runtimes, not compiled-in engines

## Goal

DevPulse compiles no AI inference engine. Every local capability runs as a
**prebuilt server binary** — upstream's where one exists, ours (built once in
a sub repo) where it does not — installed only when the user opts in from
the UI, supervised by the kernel as a subprocess, and used as an **endpoint**
with a compatible model. Local builds are **CPU and NVIDIA CUDA**; anything
else runs over the network.

A local runtime is one kind of endpoint among the user's own subscriptions
and keys (Claude, Codex, Grok). The chat that puts them together is its own
plan; this plan makes local runtimes indistinguishable from any other
endpoint to it.

Research notes with every citation:
`~/.claude/plans/prebuilt-runtime-supervisor.md` (planning skill, 2026-10-12).

## Grounded in shipping products

| Mechanism | Who does it this way | What we take |
| --- | --- | --- |
| Supervise the upstream server as a subprocess | **Ollama** — "All GGUF models are served via the upstream llama-server subprocess"; `--model --port --host 127.0.0.1`, poll `/health` every 250 ms until `"status":"ok"`, logs captured, `Kill()` on close (`ollama/llm/llama_server.go`) | spawn, readiness, logs, stop |
| Pull the build for this machine, update it apart from the app | **LM Studio** — llama.cpp engines are separate "LM Runtimes" (CPU, CUDA, …), downloadable without updating the app (0.3.0), auto-update (0.3.9), CUDA 12 auto-selected when the driver allows (0.3.15) | distribution + update + driver-based choice |
| Catalog of runtime variants, best match picked | **LocalAI** — backends per acceleration listed in a gallery index; same-alias variants resolve CUDA > Vulkan > CPU on NVIDIA | catalog + variant selection |
| Every service is a URL + compatible model | **Kyutai Unmute** — STT/TTS are Rust services; the LLM is "any OpenAI compatible LLM server" via `KYUTAI_LLM_URL` / `_MODEL` / `_API_KEY`; Kyutai builds moshi from source (no prebuilt) | endpoint model; build-once for moshi |
| What goes wrong with downloads | **Jan** — duplicate concurrent downloads (#7656), failed downloads (#7358); v0.8.5 (2026-10-08) switched to bundling | single-flight, resume, digest check, rollback |

## Context — the existing framework this builds on (verified 2026-10-12)

| Existing piece | Role in this plan |
| --- | --- |
| Kernel resource adapters: `OllamaAdapter` owns lifecycle, port resolution and raw API; spawn-or-attach, `kill_on_drop`, no console window ([ollama.rs:1-13](../kernel/devpulse-clyffy/src/cortex/persistence/ollama.rs#L1-L13), [ollama.rs:93-140](../kernel/devpulse-clyffy/src/cortex/persistence/ollama.rs#L93-L140)); `port_alloc` probe / attach / bump "lives in the kernel" for persistence + model runtimes ([port_alloc.rs:1-21](../kernel/devpulse-clyffy/src/cortex/persistence/port_alloc.rs#L1-L21)) | **Home of the supervisor** (decision 1): a generic `runtime.rs` adapter next to `ollama.rs`, generalized from it, reusing `port_alloc` |
| Engine facades: `sidecars/ollama/` wraps the kernel adapter with the `Service` trait ([sidecars/ollama/mod.rs:1-6](../systems/devpulse-engine/src/platform/services/sidecars/ollama/mod.rs#L1-L6)); `Service`, `ServiceState`, `Preflightable`, `emit_lifecycle_dual!` ([services/mod.rs:78-361](../systems/devpulse-engine/src/platform/services/mod.rs#L78-L361)) | `sidecars/runtime/` is the same thin facade: boot, states, preflight, lifecycle events for the UI |
| `devpulse-clyffy` depends on `model-loader` (optional) ([clyffy Cargo.toml:145](../kernel/devpulse-clyffy/Cargo.toml#L145)) | The supervisor reads the catalog and installed records from model-loader |
| Slots with a `runtime` override and `extensions` map; slots / presets / assistant `.default.toml` + `{userdata}/config/*.toml` overrides ([slots/types.rs:54-73](../kernel/model-loader/src/slots/types.rs#L54-L73), [slots/defaults.rs:36](../kernel/model-loader/src/slots/defaults.rs#L36)) | The runtime catalog is one more kernel config file in the same pattern |
| Model downloads already live in the kernel ([models/download.rs:60-72](../kernel/model-loader/src/models/download.rs#L60-L72)) | Runtime installs sit beside them in `model-loader/src/runtimes/` |
| `LibSqlConfig`: model-loader config persisted in the system libSQL `kv_store` (`model_loader.` prefix, `slot.{id}.model`) ([integrations/config.rs:1-47](../systems/devpulse-engine/src/platform/integrations/config.rs#L1-L47)) | Where installed-runtime records and model locations live |
| `commands/models`: install-to-slot, HF download, `list_runtime_fingerprints`, stub `check_runtime_updates` ([commands/models/mod.rs:1419-1514](../interfaces/desktop/src-tauri/src/commands/models/mod.rs#L1419-L1514)); Runtimes devtool ([devtools/runtimes/+page.svelte:66](../interfaces/desktop/src/routes/(devtools)/devtools/runtimes/+page.svelte#L66)) | The intent surface and UI already exist — fill them in |
| Data dir resolver, portable first: `<exe_dir>/.userdata` ([src-tauri/src/paths.rs:127-172](../interfaces/desktop/src-tauri/src/paths.rs#L127-L172)) | Runtimes install inside the DevPulse folder: `.userdata/global/runtimes/<id>/<build>/` |
| `deps/moshi` is already a git submodule — your fork, branch `rro-alpha-candle-0.10` ([.gitmodules](../.gitmodules)) | The sub repo that builds and publishes moshi (decision 2) |

What is wrong today:

- **llama.cpp, candle and Burn still compile in dev builds** — xtask adds
  `gpu-nvidia` / `gpu-vulkan` whenever it finds CUDA or the Vulkan SDK
  ([xtask/src/workspace.rs:1189-1207](../xtask/src/workspace.rs#L1189-L1207),
  [engine Cargo.toml:39-60](../systems/devpulse-engine/Cargo.toml#L39-L60)).
- **A hand-placed 1.1 GB llama-server + CUDA bundle** in `src-tauri/binaries/`,
  fixed port 8899, never stopped on app exit
  ([commands/llama/mod.rs:63-104,205-216](../interfaces/desktop/src-tauri/src/commands/llama/mod.rs#L63-L104),
  [lib.rs:906-918](../interfaces/desktop/src-tauri/src/lib.rs#L906-L918)).
- **In-process voice engines in the kernel** — `WhisperAdapter` (candle) and
  `KokorosAdapter` (ONNX) ([whisper.rs:1-14](../kernel/devpulse-clyffy/src/cortex/persistence/whisper.rs#L1-L14),
  [kokoros.rs:1-5](../kernel/devpulse-clyffy/src/cortex/persistence/kokoros.rs#L1-L5)).
- **Model downloads compile only with candle**
  ([download.rs:60-72,126-132](../kernel/model-loader/src/models/download.rs#L60-L72)) —
  removing candle first would remove downloads.
- **No driver version or compute capability** in hardware detection
  ([hardware/metrics.rs:13-51](../kernel/model-loader/src/hardware/metrics.rs#L13-L51));
  Tauri hardcodes `cuda_version: None`.
- Per-runtime tuning is engine-owned TOML under `user/`
  (`llama_cpp_embedded.toml` is written but never read), not kernel config.
- Three model registries (`registry.json`, `kv_store`, slot symlinks) plus an
  unused `model_registry` table.

## Runtimes

| Runtime | Source | Local builds | Serves (endpoint) |
| --- | --- | --- | --- |
| `llama-server` | upstream llama.cpp `bNNNNN` pre-releases (newest, not `/releases/latest`), sha256 per file | CPU, CUDA 12.4 (older cards), CUDA 13.4 (Turing → Blackwell) + `cudart` zip | chat, vision (`--mmproj`), embeddings (`--embedding`), rerank (`--rerank`); OpenAI **and** Anthropic (`/v1/messages`) protocols; `/health` 503 → 200 |
| `whisper-server` | upstream whisper.cpp `bNNNN` pre-releases | CPU, CUDA 12.4, CUDA 13.4 | transcription (`/inference`, or OpenAI-style path via `--inference-path`) |
| `moshi-backend` | **our** releases, built in the `deps/moshi` sub repo | CUDA 12, CUDA 13; CPU only if measured real-time | speech-to-speech; ready on "standalone worker listening" |

"All NVIDIA cards" = the CUDA 12 build for Maxwell/Pascal/Volta (CUDA 13
dropped them) plus the CUDA 13 build for Turing and newer; a supported card
can still be too small in VRAM for a given model — preflight says so.

## Slot → runtime inventory

| Slots | Runtime | Status |
| --- | --- | --- |
| chat.brain, chat.fast, chat.suggest, minion.shared, minion.escalation | llama-server (chat) | ready to map |
| chat.vision | llama-server + `--mmproj`, or any vision-capable endpoint | needs preset `mmproj_filename` (dropped today, [presets.default.toml:119-120](../kernel/model-loader/config/presets.default.toml#L119-L120)) |
| rag.embedder, minion.embedder | llama-server `--embedding` (GGUF embedding model) | ready to map |
| rag.reranker | llama-server `--rerank` | ready to map |
| voice.stt | whisper-server | preset already expects whisper.cpp `ggml-small.bin` ([presets.default.toml:632-634](../kernel/model-loader/config/presets.default.toml#L632-L634)) |
| voice.brain | moshi-backend | our sub repo |
| vision.embedder | — | retired: Vision is an endpoint (decision 3); in-process SigLIP removed in phase 13 |
| voice.tts | — | gap: moshi-server TTS needs Python; candidate to verify (decision 4) |
| voice.wake, rag.encoder, minion.encoder | — | gap: inventory in phase 1 |

## Lifecycle

1. **Resolve** — newest build; variant from hardware (driver version + compute
   capability → CUDA 13 / CUDA 12 / CPU); `Preflightable` checks disk, VRAM,
   driver before offering it.
2. **Install** — on the user's click only. One download per runtime at a time;
   HTTP range resume; sha256 against the release digest; extract to a temp dir,
   atomic rename into `.userdata/global/runtimes/<id>/<build>/`; previous
   build kept.
3. **Run** — port from `port_alloc` (attach / bump); exec without a shell or
   console window; every runtime process in a **kill-on-close Job Object** so
   nothing outlives the app; readiness from the catalog; logs and state out
   through the engine facade's `emit_lifecycle_dual!`.
4. **Use** — the running instance is registered as an endpoint and confirmed
   by plan 0001's probe; the rest of DevPulse cannot tell it from a server on
   the network or a subscription.
5. **Update / roll back / remove** — update only after a smoke test passes
   (`/health` 200 + `/v1/models` lists the model); roll back to the kept build;
   remove deletes the folder and the endpoint.

The kernel owns all of it — catalog, slot mapping, install, supervision,
installed records and model locations — because it drives the AI connections
(decision 1). The engine wraps it with the `Service` trait so boot, lifecycle
events and the devtool see it like any other service. The UI only sends
intents and renders state.

## Non-goals

- Bundling any runtime in the installer.
- AMD, Intel or Vulkan builds — those machines use CPU or a network endpoint.
- Migrating the existing Ollama adapter onto the generic runtime adapter (later).
- Building upstream runtimes from source when upstream publishes prebuilts.
- The subscription chat (Claude, Codex, Grok in one chat) — its own plan.
- Vision preparation (decision 3) — its own plan.
- pixvix — the snipping tool for sharing screenshots with the team; untouched.

## Phases

Each phase ≤5 files (whole-directory deletions in phases 12–13 counted per
crate), verified live, approval between phases.

| # | Outcome | Main files | Verification |
| --- | --- | --- | --- |
| 1 | Inventory gaps closed (wake word, encoders, speaking runtime) — doc only | this plan | every slot has a runtime or "network only" |
| 2 | Runtime catalog in the kernel; slots' `runtime` filled; preset `extensions` (mmproj) kept | `model-loader/config/runtimes.default.toml`, `src/runtimes/{mod,catalog}.rs`, `slots.default.toml`, `hardware/presets.rs` | catalog parses; each slot resolves to a catalog entry |
| 3 | Driver version + compute capability detected | `hardware/metrics.rs`, `commands/models/mod.rs` | this machine reports RTX 5090, cc 12.0, driver 592.01 |
| 4 | Kernel runtime adapter + engine facade | `cortex/persistence/{runtime,mod}.rs`, engine `sidecars/runtime/{mod,service}.rs`, `sidecars/mod.rs` | llama-server Ready via lifecycle events; app killed → no `llama-server.exe` left |
| 5 | Installer + installed-runtime records | `model-loader/src/runtimes/{resolve,install}.rs`, `runtimes/mod.rs`, kernel config keys | CUDA 13 build installed under `.userdata/global/runtimes/`, digest matches; interrupted download resumes; duplicate request → one download |
| 6 | Downloads decoupled from candle | `model-loader/Cargo.toml`, `models/download.rs` | builds without `candle-backend`; a GGUF downloads live |
| 7 | Slots routed to runtime endpoints | `commands/models/mod.rs`, `services/model_loader.rs`, `sidecars/runtime/service.rs` | chat.brain answers in the UI through llama-server; probe reports OpenAI + Anthropic |
| 8 | Intents + UI (install, start, stop, update, roll back, remove) | `commands/models/mod.rs`, Runtimes devtool, Model Loader card | CDP screenshots of every state |
| 9 | moshi releases from the `deps/moshi` sub repo (decision 2) | sub repo release workflow, catalog entry, submodule pin | release assets with digests; "standalone worker listening" on this machine |
| 10 | Voice listening via whisper-server; speaking per decision 4 | catalog + slot mapping | live transcription in the UI |
| 11 | Hand-bundled sidecar + dead commands removed | `commands/{llama,llama_cpp,llama_cpp_embedded}`, `binaries/`, `lib.rs` PATH prepend, xtask `fetch-llama-cpp`, stale `tauri.windows.conf.json` merge | `cargo check -p devpulse_desktop_backend`; no references left |
| 12 | xtask stops adding GPU features; engine `gpu-*` removed | `xtask/src/workspace.rs`, engine `Cargo.toml` | `cargo xtask run-dev` builds no llama.cpp / candle |
| 13 | Compiled-in engines removed | model-loader backends + features, clyffy features + `whisper.rs` / `kokoros.rs`, `deps/llama-cpp-rs` submodule, `deps/moshi` out of the Cargo workspace (root `exclude`/`[patch]`; the sub repo stays), ort fork, deps.toml cmake/ninja | `cargo tree -i candle-core / ort-sys / moshi / llama-cpp-sys-2` → no match; build time before/after |
| 14 | Owner checkpoint | — | install → run → update → roll back → remove each runtime from the UI; one runtime used from another machine |

Plan 0001 is amended on approval: its `onboarding/runtimes/` folder is
dropped — onboarding's reconcile decides the desired state, the kernel
runtime adapter runs it through the engine facade.

## Decisions

Owner, 2026-10-12:

1. **Supervision lives in the kernel.** "It is AI related, it is driving the
   AI code connections." Follows the existing `OllamaAdapter` + `port_alloc`
   pattern; the engine stays the facade.
2. **moshi builds come from a sub repo of platform_devpulse.** Proposed: the
   existing `deps/moshi` submodule (your fork) is that sub repo — its CI
   builds CUDA 12 / CUDA 13 (CPU only if measured real-time) and publishes
   releases with digests; DevPulse pulls them like llama.cpp's.
3. **Vision is an endpoint** — locally llama-server with `--mmproj`, otherwise
   any vision-capable endpoint, including the user's subscriptions. A light,
   continuous preparation layer keeps machine-readable context ready (which
   app, what changed, the on-screen text) and hands it to the endpoint when a
   trigger fires. Shipping precedent: screenpipe captures on OS events
   (app switch, focus, click, typing pause), reads text through accessibility
   APIs first with OCR only as fallback, stores locally, and calls the LLM on
   demand. Own plan, kept simple.
4. **Speaking runtime — still open.** moshi-server's TTS needs Python;
   candidates get verified in phase 1 before one is chosen.

## Verification

- `cargo clippy -p model-loader -- -D warnings`, `cargo clippy -p devpulse-clyffy -- -D warnings`,
  `cargo clippy -p devpulse-engine -- -D warnings`, `cargo check -p devpulse_desktop_backend`,
  `cargo test -p model-loader`, `cargo test -p devpulse-clyffy`, `cargo test -p devpulse-engine`.
- `cd interfaces/desktop && pnpm check` — 0 errors, 0 warnings.
- Live per phase on this machine (`cargo xtask run-dev`, CDP screenshots): lifecycle log lines match UI
  states; digests match; no orphaned processes after killing the app; resume and single-flight proven;
  rollback serves the previous build; every runtime file lands inside the DevPulse folder's `.userdata/`.

## Log

- 2026-10-11 — First draft from owner direction ("pull their binary … DevPulse manages the lifecycle").
- 2026-10-12 — Rewritten through the planning workflow: mapped onto the existing sidecar family, kernel
  config store and `commands/models` surface; grounded in Ollama, LM Studio, LocalAI, Kyutai Unmute and
  Jan; owner corrections applied (runtimes are endpoints; CPU + NVIDIA CUDA only; moshi built once in our
  pipeline). Corrected the draft's claim that llama.cpp was out of the build.
- 2026-10-12 — Owner decisions 1–3. Supervision moved to the kernel (generic adapter beside `ollama.rs`,
  engine facade beside `sidecars/ollama/`); boundary renamed `engine` → `kernel-model-loader`. moshi from a
  sub repo (proposed: existing `deps/moshi`). Vision = endpoint; preparation split into its own plan;
  pixvix out of scope. Local runtimes framed as one endpoint kind beside the user's subscriptions.
