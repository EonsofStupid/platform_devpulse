---
id: 0007
boundary: kernel-model-loader
paths:
  - kernel/model-loader/config/runtimes.default.toml
  - kernel/model-loader/src/runtimes/
  - kernel/devpulse-clyffy/src/cortex/persistence/runtime.rs
touches: [kernel-clyffy, engine, process, desktop-tauri, desktop-devtools, desktop-models, xtask, deps, config]
status: in-progress
owner: jesse
created: 2026-10-11
updated: 2026-10-24
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
| `TursoConfig`: model-loader config persisted in the system Turso `kv_store` (`model_loader.` prefix, `slot.{id}.model`) ([integrations/config.rs:1-47](../systems/devpulse-engine/src/platform/integrations/config.rs#L1-L47)) | Where installed-runtime records and model locations live |
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

### Stage 1 — compiled-in llama.cpp and moshi leave the build (decision 5)

Owner, 2026-10-21: "yes" to starting decision 5 now, ahead of plan 0001
slice 4c. Facts it rests on (checked 2026-10-21):

- Local GGUF chat is routed to a llama-server **subprocess**:
  `inference_generate` sends every GGUF slot to the sidecar over HTTP
  ([commands/models/mod.rs:1801-1860](../interfaces/desktop/src-tauri/src/commands/models/mod.rs#L1801-L1860)).
  The compiled-in `llama-cpp-2` backend is a second path that only the
  `gpu-nvidia` / `gpu-vulkan` builds compile (last built here 2026-10-09).
  Removing it takes no working capability away. (Found during the live
  check: the sidecar itself has not been starting since 2026-10-09 — see
  the log.)
- The compiled-in moshi backend (`MoshiStsBackend`) is wired into nothing in
  the app; only `tests/personaplex_smoke.rs` and model-loader's default
  features (so workspace-wide checks) build it.
- `user/llama_cpp_embedded.toml` (context size, GPU layers, KV-cache type,
  batch) is written by the devtool and read by nothing. Each value is a
  llama-server flag (`-c`, `-ngl`, `--cache-type-k/-v`, `-b`), so it is
  **wired into the subprocess**, not deleted (include-before-delete).

Removed with the owner's OK (decision 5 and 2026-10-21) — git history keeps them:

| What | Why it goes |
| --- | --- |
| model-loader `backends/llamacpp/{mod,backend,mtmd}.rs`, features `llama-cpp-ffi` / `-mtmd` / `-cuda` / `-vulkan`, deps `llama-cpp-2`, `encoding_rs` | the compiled-in llama.cpp |
| model-loader `backends/candle/{moshi,voices_archive}.rs`, `tests/personaplex_smoke.rs`, feature `moshi-sts`, deps `moshi`, `tar`, `flate2` | the compiled-in moshi (voices archive only served it) |
| clyffy features `model-loader-llama-cuda` / `-vulkan`; engine + Tauri feature `gpu-vulkan` (it only selected llama.cpp's Vulkan build); llama from engine `gpu-nvidia` | feature plumbing for the above |
| Tauri `commands/llama_cpp` (build info, prebuilt folder, manifest bump) and the devtool's Engine foundation card | they describe the static-library pipeline that no longer exists |
| xtask `fetch-llama-cpp`, the prebuilt-library export, Vulkan SDK detection | same pipeline |
| root `[patch]` for `moshi` / `llama-cpp-2` / `llama-cpp-sys-2`, the `moshi` workspace dependency, `exclude`; the `deps/llama-cpp-rs` submodule | a clean checkout builds without submodules |

Kept: the `deps/moshi` submodule (decision 2 — the sub repo that will build
and publish moshi releases, phase 9); `BackendType::LlamaCpp` (GGUF is
served by llama.cpp — now always the server); the hand-placed llama-server
sidecar (it serves GGUF chat until phases 4–5 replace it); candle, ort, Burn
and mistral.rs (not part of decision 5). The registry row
`BackendId::LlamaCppFfi` becomes `LlamaServer` ("llama.cpp · server").

Wired in: `llama_cpp_embedded` → `llama_server` settings
(`user/llama_server.toml`, engine `LlamaServerConfig`, Tauri
`llama_server_{load,save}_config`); when you have saved settings the sidecar
starts with them (a slot's own `llama_cpp_ngl` still wins), otherwise it keeps
today's flags. The devtool's settings card says what it now controls.

CI: `ci.yml` checks out without submodules (proving the clean checkout) and
drops the `LLAMA_CPP_PREBUILT_LIB_DIR` override; `verify-commits.yml` keeps
initializing submodules because it verifies older commits that need them.

Check: `cargo tree -i llama-cpp-sys-2` and `-i moshi` find nothing; a fresh
clone without submodules passes `cargo check --workspace`; the full runner
command set; live — a GGUF chat answer through the sidecar with saved
settings visible in its command line.

Next, Stage 2 (phase 7): a chat slot can point at a remote
OpenAI-compatible URL (your GB10, Ollama) instead of the local sidecar.

Plan 0001 is amended on approval: its `onboarding/runtimes/` folder is
dropped — onboarding's reconcile decides the desired state, the kernel
runtime adapter runs it through the engine facade.

### Stage 1b — the model loader takes its paths from the config

Owner, 2026-10-23: "get it properly writing to the .userdata inside the
folder … you clearly misunderstood about local and ignored the logical
configurational endpoints which would even support running locally."

The endpoints already exist. They are:

- `config/platform/00-portable.toml` keeps all data in `.userdata/`.
- `config/platform/services/system/model-loader.toml` sets `models_dir = "models"`, relative to that data dir.
- In dev the data dir is `<repo>/.userdata`, so the config works locally as it stands.

The code ignores those endpoints in two places:

- **Models folder.** The engine's resolver tries `<exe_dir>/models`, then
  `<repo>/models` found by walking up to `Cargo.toml`, and only then the
  config. In dev it returns `<repo>/models`
  ([config/loader.rs:1210-1247](../systems/devpulse-engine/src/platform/config/loader.rs#L1210-L1247)).
  So downloads and `registry.json` land in the repo root.
- **User-data folder.** The kernel takes the user-data dir to be
  `models_dir.parent()`
  ([service.rs:279](../kernel/model-loader/src/service.rs#L279)) instead of
  the engine's `data_dir`. That puts slot links in `<repo>/slots/`, and
  would put `assistant.toml`, voice clones and the HF token file
  (`Secrets::path_for`, also `models_dir.parent()`) in the repo root too.

There are two smaller copies of the same habit:

- The speech service hardcodes `<data>/models/sherpa`
  ([sherpa_streaming.rs:128](../systems/devpulse-engine/src/platform/services/sherpa_streaming.rs#L128)).
- The xtask manifest backfill defaults to `<repo>/models`
  ([model_manifest_backfill.rs:62](../xtask/src/commands/model_manifest_backfill.rs#L62)).

| # | Outcome | Files | Verification |
| --- | --- | --- | --- |
| 1b.1 | Kernel gets the data dir from the engine: `ModelLoaderService::new(…, userdata_dir, models_dir, …)`; secrets file at `{userdata}/secrets.toml` | `model-loader/src/service.rs`, `models/secrets.rs`, `tests/real_loader_smoke.rs`, engine `services/model_loader.rs` | `cargo check` + tests model-loader; engine check |
| 1b.2 | Models folder = the configured path (relative → data dir, absolute as given); no exe/repo probing; the speech store is `<models>/sherpa` from the same resolution | engine `config/loader.rs` (+ tests), `boot/model_loader.rs`, `platform/mod.rs`, `services/sherpa_streaming.rs` | engine tests; boot log shows `models_dir = …\.userdata\models` |
| 1b.3 | xtask backfill reads the same config key | `xtask/src/commands/model_manifest_backfill.rs` | `cargo check -p xtask` |
| 1b.4 | Data moved in, app stopped: `models/{registry.json,unsloth}` → `.userdata/models/`. Registry ids come from paths, so the move invalidates the two saved picks (chat.brain and minion.shared → Qwen3-30B); they are re-picked through the app's own assign command. Then the dangling repo-root `slots/` is removed | no code | live: models list shows Qwen3-30B; `.userdata/slots/{chat.brain,minion.shared}/model.gguf` exist; nothing new in the repo root |

Not touched without your OK:

- `models/general/.keep` is tracked, and `.gitignore`'s `models/*` lines keep that skeleton. Neither has a use once 1b.2 lands.

Found during this stage, proposed next:

- A registry id is a UUID of the model file's **absolute** path ([discovery.rs:1015](../kernel/model-loader/src/models/discovery.rs#L1015)), and `registry.json` stores absolute paths. Moving the DevPulse folder therefore drops every slot pick. Proposed fix: identity from the path relative to the models folder.
- Discovery also scans the Hugging Face cache in the user profile ([registry.rs:171](../kernel/model-loader/src/models/registry.rs#L171)), which is outside the DevPulse folder. Proposed fix: make it a configured extra source rather than a built-in default.

### Part S — Surreal runs as a built binary under the kernel's supervisor; the `surrealdb` crate leaves the build

Owner, 2026-10-24, asked why Surreal's source is in the build: "surreal is
suppose to be a prebuilt binary subprocess that can easily be detached … when
rrflow is going to replace it", then "am i wrong that is the correct please fix
that … we properly use built binaries and have them as subprocesses, we
properly, move this as a true portable devspace that has the option to
eventually synchronize with the cloud" (decision 6).

The same request was made in April and built: `15f60f08` (2026-04-24) ran
`surreal start` as a managed child process, with decisions the owner locked in
`scripts/docs/sprints/SESSION-NOTES-SURREAL-SIDECAR.md:27-36`. `251b0a52`
(2026-05-06, an AI session) reversed it to the embedded `kv-surrealkv` crate.
Part S re-authors the April code in place (`git show 251b0a52^:…`) onto this
plan's supervisor. It does not write a second one.

Research 2026-10-24 (four passes, citations below):

| Fact | Evidence |
| --- | --- |
| Only the kernel uses the crate: `devpulse-clyffy → devpulse-engine → devpulse_desktop_backend` is the single path | `cargo tree -i surrealdb`; root `Cargo.toml:40`, `kernel/devpulse-clyffy/Cargo.toml:82` |
| Even the client-only crate requires `surrealdb-core`, so detaching means no `surrealdb` crate at all. DevPulse talks to the process with its own client | crates.io `surrealdb/3.0.5` dependencies (`surrealdb-core` not optional) |
| The crate brings RUSTSEC-2026-0387 (`crypto-bigint` 0.5 via `jsonwebtoken` → `p256`/`p384`); no fixed release exists anywhere in that chain, so it blocks `cargo deny` and the push until the crate leaves | `cargo deny check advisories`; crates.io `surrealdb-core/3.3.4`, `jsonwebtoken/11.1.0` |
| What is used is small: one `Surreal<Db>` handle, `.query`, `.bind`, `.take`, and the `SurrealValue` derive. No live queries, no transactions, no `RecordId` | `persistence/surreal/{lifecycle,client,intelligence_impl}.rs`; `intelligence/record.rs:20,41,48,84-85` |
| What must keep working: boot schemas for system, user and global (fatal if they fail, `surreal.toml:38,50,61`, `runtime.toml:2`); chat type-ahead suggestions (HNSW 1024 on `chat_prompt`); the projects mirror; governance thoughts; the SurrealDB, Intelligence, Persona graph and RRO devtools | `boot/graph.rs:44-198`; `suggest/service.rs:110-195`; `projects.rs:537-819`; `commands/sys/graph.rs:133-374`; `commands/intelligence/mod.rs` |
| The 12 `type::thing` calls fail on SurrealDB 3: it was renamed `type::record` in 3.0 | `client.rs:351,384,418,458,553,570`, `intelligence_impl.rs:143-145,160-161`, `suggest/service.rs:111`; SurrealDB docs, database functions / type |
| The store holds data: 36 MB of SurrealKV 0.21 at `.userdata/surreal/devpulse/`, at a path hardcoded in `boot/graph.rs:69` | on disk 2026-10-24 |
| The v3.0.5 server uses the same SurrealKV 0.21.0 as the embedded crate, so it opens that folder as is. 3.3.x migrates a store one way on first open | each tag's `Cargo.lock`; SurrealDB docs "32-to-33", "upgrades-and-patching" |
| Over HTTP `/rpc`, JSON bodies rewrite strings that look like record ids, datetimes or UUIDs, and cut UUID-prefixed strings short (issue #7324, still in 3.3.4). CBOR does not, and carries bytes and floats natively | `core/src/rpc/format/json.rs` @v3.3.4; docs `cbor-protocol` |
| `127.0.0.1:0` binds but the server never reports the port, so ports come from `port_alloc` | `ntw/mod.rs` @v3.0.5 and @v3.3.4 |
| Only `surreal-ns` / `surreal-db` headers are read in 3.x; the old `NS` / `DB` are ignored | `surrealdb/src/headers/mod.rs` @v3.0.5 |
| The server checks `download.surrealdb.com/latest.txt` on every start unless `SURREAL_ONLINE_VERSION_CHECK=false` | `cli/mod.rs` @v3.0.5 |
| Release: `surreal-v3.0.5.windows-amd64.exe`, 94,902,784 bytes, SHA-256 `fa96694e3ebc3c21da08493518c2199354b3a34f5022187b4cbdd4a6f4d325ec`, published 2026-03-27 on `download.surrealdb.com` (same file on GitHub releases). Latest is 3.3.4 | HEAD request and `…windows-amd64.txt`, 2026-10-24 |
| Licence BSL 1.1: redistribution allowed with the LICENSE shown on each copy; no use "as a Database Service" for third parties | `LICENSE` @v3.3.4 |
| Ctrl-Break / Ctrl-C stop the server cleanly (WAL flushed). A hard kill loses only in-flight transactions with the default `sync=every` | `ntw/signals.rs`, `cli/start.rs` @v3.3.4 |
| Supervision pieces today: `port_alloc` (generic, on disk); `OllamaAdapter` (a copy of the April Surreal lifecycle); `devpulse-process` (one-shot runs only). No Job Object, child-log capture, restart or early-exit detection exists in any runtime crate | `cortex/persistence/{port_alloc,ollama}.rs`; `systems/infra/devpulse-process/src/lib.rs:62-111`; `xtask/src/zombie.rs:35-140` |
| `xtask fetch-surreal` still exists: v3.0.5 hardcoded, no checksum, writes into `src-tauri/binaries/` for a Tauri `externalBin` that no longer exists | `xtask/src/commands/fetch_surreal.rs:35,95-133` |
| Nothing answers `:8822` today. The hooks, skills, `preflight.md` and the `build-release` smoke text that call it are calling a dead endpoint | `commands/sys/graph.rs:218,231-236`; `xtask/src/smoke.rs:14-23` |

How Part S is built (each line cites its rule):

- **The binary is upstream's build, installed inside the folder.**
  `surreal-v{V}.{platform}` from `download.surrealdb.com`, checked against the
  published SHA-256, extracted to a temp folder and renamed atomically into
  `.userdata/global/runtimes/surreal/{V}/`, with upstream's LICENSE beside it.
  Rules: runtime install, this plan's lifecycle step 2; "everything inside the
  folder, dependencies included" (devpulse-self-reliant); no Tauri `externalBin`.
- **Getting the binary there.** A dev checkout gets it from
  `cargo xtask fetch-surreal`, re-authored to the steps above. The portable
  build carries it inside the portable folder. The 0007 installer (phase 5)
  takes over updates. Surreal is required and boots with DevPulse, so it is
  not an opt-in click like an AI runtime.
- **The version is configuration** (`[services.system.surreal] version`), not
  "newest". A store migrates one way when a newer server opens it, so every
  version change is an update step: an export first, then the new build, with
  the previous build kept.
- **Paths come from the config**, relative to the data dir: the binary from
  `runtimes_dir`, the store from `data_path`. That replaces the hardcoded
  `graph.rs:69` (paths-from-config-endpoints).
- **Supervision is this plan's phase 4,** with Surreal as its first runtime.
  - Process mechanics extend the existing `devpulse-process` crate with a
    long-lived child: a kill-on-close Job Object, no console window,
    stdout/stderr into tracing, early-exit detection, then a graceful stop
    (Ctrl-Break) and a forced stop.
  - The policy lives in the kernel's `cortex/persistence/runtime.rs`
    (decision 1): the port from `port_alloc`, readiness, restart with backoff
    and a crash-loop cap.
  - Graceful-then-forced follows the owner's rule (R-G19: "GRACEFULLY THEN
    FORCED AFTER TWO ATTEMPTS … 30 SECONDS").
  - Putting the mechanics in an infra crate is master plan Q35's
    recommendation. Q35 itself stays the owner's gate.
- **Ports.** The configured port with auto-bump, and configured versus actual
  shown in the UI (April lock). Surreal owns its data, so Part S never attaches
  to a server it did not start. If a port is taken by someone else, it bumps.
- **The client.** HTTP `POST /rpc` with CBOR: `query [sql, vars]`, with
  `surreal-ns` / `surreal-db` headers and Basic root auth. Results come back as
  today's `serde_json::Value` shapes, so the callers keep their surface.
  Embeddings bind as float arrays and bytes as CBOR byte strings
  (`serde_bytes`).
- **Credentials.** The root user is created on first start
  (`SURREAL_USER`/`SURREAL_PASS`). Its password is generated once and kept in
  a credentials file inside the folder, so a copied folder still opens its
  store. Like RRFlow's `credentials/`, it is never synced (master plan K4).
- **No phoning home:** `SURREAL_ONLINE_VERSION_CHECK=false` and `--no-banner`.
- **Storage.** Part S first runs v3.0.5 on the existing `surrealkv://` folder,
  so behaviour matches with your data intact. It then moves to RocksDB, your
  April lock (SurrealDB's docs also call SurrealKV beta, with RocksDB
  recommended for on-disk servers). The move exports, imports, checks the
  counts per table, and keeps the old folder until you OK its removal.

Phases (≤ 5 source files each; generated bindings and the lockfile not
counted; each verified live; commits with hooks passing):

| # | Outcome | Files | Verification |
| --- | --- | --- | --- |
| S1 | **Done** (see the log). **The binary, installed the right way.** `fetch-surreal` installs the configured version into `.userdata/global/runtimes/surreal/{V}/`: SHA-256 against the published digest, temp extract, atomic rename, LICENSE beside it, previous build kept; nothing written into `src-tauri/binaries/`. `surreal.toml` gains `version`, `runtimes_dir` and `data_path`; its stale keys are reconciled | `xtask/src/commands/fetch_surreal.rs`, `config/platform/services/system/surreal.toml`, engine `config/loader.rs` (`SurrealServiceEntry`) | `cargo test -p xtask`; the installed `surreal version` prints 3.0.5; a tampered download is refused |
| S2 | **S2a and S2b done** (see the log); S2c, xtask on the shared guard, next. **Process mechanics.** `devpulse-process` gains a supervised child: Job Object kill-on-close (Windows), process group (POSIX), no console, line-by-line log capture, early-exit detection, Ctrl-Break then forced stop with deadlines | `systems/infra/devpulse-process/{Cargo.toml, src/lib.rs, src/child.rs}` | tests with a small child process; killing the test parent leaves no child |
| S3 | **Done** (see the log). **The kernel runtime adapter** (phase 4's kernel half), generalized from the April `SurrealLifecycle` and `OllamaAdapter`: program, args, env, readiness URL, port policy, restart with backoff and a crash-loop cap, lifecycle events | `cortex/persistence/{runtime.rs, mod.rs}` | kernel tests with a scripted child: ready, crash then restart, crash loop then stop |
| S4 | **The CBOR client,** beside the old one, not yet wired: `surreal/rpc.rs` sends `query` with vars, reads the per-statement array, surfaces `ERR` statements, and maps CBOR tags to today's JSON shapes | `persistence/surreal/{rpc.rs, mod.rs}`, kernel `Cargo.toml` (`ciborium`, `serde_bytes`) | unit tests: encode and decode, tagged record ids, datetimes, bytes, an `ERR` statement |
| S5 | **The cutover, on your existing data.** `lifecycle.rs` starts v3.0.5 through the runtime adapter on `surrealkv://{data_path}`; `client.rs` goes through `rpc.rs`; the 12 `type::thing` become `type::record`; `boot/graph.rs` reads the configured path | `surreal/{lifecycle,client,intelligence_impl}.rs`, `suggest/service.rs`, engine `boot/graph.rs` | live: boot reaches Ready; the SurrealDB devtool lists your tables with their counts; a chat prompt saves and suggests; DevPulse killed → no `surreal.exe` left |
| S6 | **The crate leaves the build.** The `SurrealValue` derives become serde (bytes through `serde_bytes`); `surrealdb` leaves both `Cargo.toml`s and the lockfile | `intelligence/record.rs`, `surreal/{client,intelligence_impl}.rs`, kernel `Cargo.toml`, root `Cargo.toml` | `cargo tree -i surrealdb-core` → none; the `RUSTSEC-2026-0387` entry leaves `deny.toml` (added 2026-10-24 so the push could go through) and `cargo deny check advisories` still passes; build time before and after |
| S7 | **The engine facade and the window.** `sidecars/surreal/` (the folder `sidecars/mod.rs:13-14` names): managed, pid, binary, version, configured vs actual port, restarts; the devtool's Status tab and the boot manifest step show them | engine `services/{surreal.rs → sidecars/surreal/}`, `services/manifest.rs`, Tauri `commands/surreal/sidecar/mod.rs`, devtool feature | CDP screenshot of the Status tab with the live process |
| S8 | **RocksDB, your April lock.** Export from the SurrealKV store, start on `rocksdb://{data_path}`, import, compare counts per table and namespace; the SurrealKV folder is kept until you OK its removal | `surreal/lifecycle.rs`, a one-time `surreal/move_store.rs`, `surreal.toml` | the counts match; restart opens RocksDB; the old folder untouched |
| S9 | **Stale words fixed.** `surreal.toml` header, `persistence/mod.rs:10`, `services/graph.rs` "WS client", `.claude/rules/preflight.md` (`:8822`, `NS`/`DB` → `surreal-ns`/`surreal-db`), `build_release.rs:631-721`, `xtask dev` banner, the `ensure_port_free` that would block a bump | docs and comments; ≤ 5 per commit | `rg` finds no embedded-era claim |
| S10 | **Your checkpoint.** Kill DevPulse → no Surreal left; restart → your data; copy the folder elsewhere → it opens its store; update 3.0.5 → 3.3.4 through the installer with an export first | — | your sign-off |

Not decided here, yours:

- **Q35** (master plan): the mechanics in an infra crate. S2 follows the
  recommendation; say if you want them in the kernel instead.
- **The BSL "Database Service" clause.** The SurrealDB devtool has a raw
  console that lets the person define tables. That is the person's own local
  store, not a service for third parties. If DevPulse ever offers Surreal to
  other people (shippin.cloud), that clause applies and needs a legal read.
- **The `devpulse_engine` namespace user** for the hooks: its password is in
  `surreal.toml:45-68` and the rules docs. The April code created it, and S5
  restores that. Whether it moves into the credentials file is your call. The
  hooks also point at port 8842, which is an external dev server, not DevPulse.

Found while reading, outside Part S:

- Dead code that stays (include-before-delete) and is ported where it compiles:
  - `config/wiring.rs` is not compiled;
  - `adapters/persistence/surreal.rs` is a stub;
  - `REASONING_SCHEMA` and the `Reasoning*` types;
  - `kv_*`, `query_nodes`, `traverse`;
  - `ProjectGraphManager` / `init_project_full`;
  - four unused `IntelligenceStore` methods;
  - the engine's unused `axum`.

  Each deletion waits for your OK, one item at a time.
- `MemoryRecord.created_at` / `updated_at` are `i64` while `MEMORY_SCHEMA`
  types them `datetime` (`schema.rs:30-31`), and `RecallRow.id: String` reads a
  record id. S4's mapping makes both visible, and they are fixed there.
- Stale "Python is banned" texts against "Python is allowed":
  - `.claude/rules/rust.md:14`;
  - `.claude/settings.json:21-23` (a permission setting, so yours to edit);
  - `docs/platform/PLATFORM_TURNKEY_V2.md:68`;
  - `scripts/docs/PHILOSOPHY.md:157`;
  - `docs/claude.kb/baselines/devpulse/CLAUDE.md:16,25`.
- Stale "Surreal is embedded" docs:
  - `scripts/docs/consolidation/LOCKED_DECISIONS.md` A-5 "composed in, not
    forked" (superseded by the 2026-10-01 fork approval);
  - `scripts/docs/ARCHITECTURE-SSOT.md:363`;
  - `docs/platform/PLATFORM_TURNKEY_V2.md:61-66`;
  - `docs/platform/INTELLIGENCE_LAYER.md` Phase A;
  - `docs/platform/TURNKEY_WIZARD_PLAN.md:82`.
- Master plan K4 points to a "0007 Part R" for RRFlow that was never written.
  Part S comes first, and Part R replaces Surreal with RRFlow behind the same
  supervisor and client seam.
- `0007-engine--…` is stale and should be marked superseded by this file
  (master plan Q20).

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

Owner, 2026-10-13:

5. **Compiled-in engines leave the build first, not last.** "llama.cpp should
   be available as a subprocess or remote location — it is a configuration."
   Every slot points at an endpoint: a llama-server subprocess or a remote
   URL. Compiled-in llama.cpp and moshi, the `deps/llama-cpp-rs` and
   `deps/moshi` workspace members and their `[patch]` entries leave the build
   in the same stage (phases 7 and 11–13, brought forward). A clean checkout
   then builds without submodules, and CI stops compiling llama.cpp. The
   installer UI (phases 5 and 8) follows. This starts right after the plan
   0001 work is committed.

Owner, 2026-10-24:

6. **Surreal is a built binary subprocess, never compiled in.** "surreal is
   suppose to be a prebuilt binary subprocess that can easily be detached …
   when rrflow is going to replace it"; "am i wrong that is the correct please
   fix that … we properly use built binaries and have them as subprocesses …
   a true portable devspace that has the option to eventually synchronize with
   the cloud". Also: "Python is allowed". Part S.

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
- 2026-10-13 — Owner decision 5: endpoint configuration and the removal of
  compiled-in llama.cpp and moshi come first, right after the plan 0001
  commits. Found while rebuilding history in a fresh worktree: no checkout
  builds without both submodules, because they are workspace members and
  model-loader dependencies.
- 2026-10-17 — Found (not fixed; this plan owns it): `ModelLoaderService::new`
  derives `userdata_dir = models_dir.parent()`
  ([service.rs:279](../kernel/model-loader/src/service.rs#L279)) instead of
  taking the engine's `data_dir`, which `load_default_slots` already gets
  ([services/model_loader.rs:100](../systems/devpulse-engine/src/platform/services/model_loader.rs#L100)).
  `models_dir` resolves to `<repo>/models` in dev and `<exe_dir>/models` in a
  portable build ([config/loader.rs:1096](../systems/devpulse-engine/src/platform/config/loader.rs#L1096)),
  so slot links land outside `.userdata` — on this machine
  `<repo>/slots/chat.brain/model.gguf` (untracked, since 2026-10-12) — and
  `assistant.toml` is read and written at `<repo>/config/`. Fix: pass
  `data_dir` into `new()`; the HF token (`Secrets::load(&models_dir)`) moves
  with it. Belongs with the phase that touches `service.rs`.
- 2026-10-21 — **Stage 1 done: compiled-in llama.cpp and moshi are out of
  the build** (owner: "yes"). Removed per the Stage 1 table; `deps/moshi`
  stays as the build sub repo; root `[patch]`, the `moshi` workspace
  dependency, `exclude` and the `deps/llama-cpp-rs` submodule are gone, and
  `Cargo.lock` drops `llama-cpp-2`, `llama-cpp-sys-2`, `moshi` and
  `find_cuda_helper`. `cargo tree -i` finds none of them. Wired in: the
  never-read `llama_cpp_embedded` settings became `LlamaServerConfig`
  (`user/llama_server.toml`) and start the sidecar when saved — checked live:
  loading chat.brain asked llama-server for `-c 8192 -ngl 999
  --cache-type-k q8_0 --cache-type-v q8_0 -b 512` (the test settings file was
  removed afterwards; you had none). The backend matrix row is now
  `llama-server`; the devtool's runtime id, nav copy and status text say what
  is true. **Found, not caused by this stage:** the GGUF sidecar does not
  start on this machine — "Failed to spawn llama-server: The system cannot
  find the file specified". The code asks Tauri for `binaries/llama-server`,
  which resolves to `target/debug/binaries/llama-server.exe`; the Windows
  Tauri config that listed it as an external program was dropped by the
  restore commit `38309aaa` (2026-10-09), and only DLLs sit in that folder. So
  local GGUF chat has not been starting since 2026-10-09; phases 4–5 (kernel
  supervision + install into `.userdata/global/runtimes/`) are its real fix.
  Still open for phase 13: xtask's cmake / ninja / MSVC environment and its
  stale-cmake-dir purge were built for `llama-cpp-sys-2`; whether anything
  else needs them is checked there. The `slots/` path bug (2026-10-17 entry)
  is not touched here. Verified: workspace clippy (pedantic), cargo fmt,
  tests model-loader 173 + smoke 2, kernel 85, engine 156 + contract 4,
  process 4; svelte-check 0 errors (app and ColdLight), Biome 560 / 1072,
  arch 18; bindings regenerated.
- 2026-10-23 — **Stage 1b done: the model loader takes its paths from the
  config.** Commits `6d26cf24` (1b.1), `12e09902` (1b.2), `209357d4` (1b.3);
  1b.4 moved the data and was checked live.
  - The boot log reads `models_dir = …\.userdata\models` and the scan found
    12 models there. Data dir and models folder are both inside `.userdata`.
  - The move changed the Qwen3-30B registry id. Boot logged
    "Stale assignment — clearing" for `chat.brain`, the only saved pick, and
    it was re-picked through `assign_model_to_slot`. Its link is now
    `.userdata/slots/chat.brain/model.gguf` → `.userdata/models/unsloth/…`.
  - `minion.shared` had a link in the repo root but no saved pick. It was
    likely written by the real-disk smoke test, which used to arm slots
    under the repo root. It was not re-created.
  - The two dangling repo-root links and the `slots/` folder are gone.
    Nothing new appears in the repo root after boot.
  - Tests: model-loader 170 + smoke 2 + 3; engine resolver 3. Hooks passed
    on each commit.
  - Found: the same Qwen3-30B file is also in the Hugging Face cache in your
    user profile (a second 17 GB copy, outside the folder). The registry
    lists both. Nothing was deleted; the proposed fix (the cache as a
    configured source) is in Stage 1b.
- 2026-10-24 — **Part S planned: Surreal as a built binary under the kernel's supervisor** (owner:
  "am i wrong that is the correct please fix that"). Four research passes: every use of the embedded
  store; the April subprocess code in git (`251b0a52^`) and today's supervision pieces; the owner's
  plans, memory and specs; SurrealDB's own release, CLI, HTTP/RPC and storage facts. Found: only the
  kernel uses the crate; even its client needs `surrealdb-core` (the source of RUSTSEC-2026-0387,
  which blocks the push); the 12 `type::thing` calls fail on SurrealDB 3; the store holds 36 MB that
  the v3.0.5 server opens as is; JSON over `/rpc` rewrites strings, so the client speaks CBOR.
- 2026-10-24 — **S1 done: Surreal's build installed inside the folder** (owner approved the download).
  `cargo xtask fetch-surreal` re-authored: reads `version` / `install_dir` from `[services.system.surreal]`,
  takes the asset from GitHub and its SHA-256 from `download.surrealdb.com`, refuses a mismatch, stages
  beside the destination and renames into place, puts upstream's LICENSE beside the binary, keeps other
  versions, writes nothing into `src-tauri/binaries/`. `SurrealServiceEntry` gains `version`,
  `install_dir`, `data_path` with `binary()` / `store()`; `boot/graph.rs` takes the store from `data_path`
  instead of a hardcoded join; `resolve_models_dir` shares the same data-dir helper. Verified: xtask 3 +
  engine 10 config tests, clippy (xtask all targets, engine) and rustfmt clean; installed
  `.userdata/global/runtimes/surreal/3.0.5/surreal.exe` (94,902,784 bytes, SHA-256 `fa96694e…d325ec`
  matching the published digest), `surreal version` → `3.0.5 for windows on x86_64`; the rebuilt app
  opened the store from the configured path (boot log `…\.userdata\surreal/devpulse`, 2.3 s). The
  mismatch refusal is covered by reading the code, not by a tampered download.
- 2026-10-24 — **S2a done: `devpulse-process` supervises long-lived children.** The dev tree's Job Object
  guard (`xtask/src/zombie.rs`) is re-authored as `devpulse-process/src/job.rs` with breakaway as a choice
  (xtask needs it for sccache; runtimes refuse it). `SupervisedChild` starts a program with no console
  window, joins one process-wide kill-on-close job on Windows (its own process group on Unix), hands
  every output line to a caller's sink (non-UTF-8 replaced, not fatal), and answers `exited()` at any
  time so a crash is seen at once. Verified: 7 tests (3 new: lines from both streams and the exit code;
  a running child stays running until ended; a missing program is named), clippy all targets and
  rustfmt clean, `cargo check -p devpulse_desktop_backend`. Found on the way: `windows-sys` 0.59 gates
  `JOBOBJECT_EXTENDED_LIMIT_INFORMATION` on `Win32_System_Threading`. R-G19 (owner): "first gracefully
  then forced after two attempts … 3 checks if no progress on the third check over 30 seconds" is S2b.
- 2026-10-24 — **S2b done: graceful first, forced after the checks (R-G19).** `StopPolicy::default()` is
  the owner's rule: two graceful requests, three checks over thirty seconds, then forced.
  `SupervisedChild::stop` sends Ctrl-Break to the child's own process group on Windows (SIGTERM to the
  group on Unix), checks every 100 ms within each interval, forces only after the last check, and
  forces at once (saying why) when no request can be sent. Each child now has its own kill-on-close
  job, so a forced stop ends the child and everything it started (`TerminateJobObject`; `killpg` on
  Unix) without touching other runtimes. Spawn flags follow whether `DevPulse` has a console: shared
  console (dev builds) or a hidden one it attaches to for the request (release builds). Verified: 11
  tests + both Windows paths — with a console (graceful in 0.4 s; `ping`, which ignores Ctrl-Break,
  forced after the 6 s test window) and, run alone, without one (`without_a_console_the_request_still_lands`).
  clippy all targets, rustfmt, `cargo check -p devpulse_desktop_backend` clean.
- 2026-10-24 — **Merged into main** (owner: "Full merge, resolve every file"; `008546f1`, pushed). Every path decided
  from the main commits that touched it: the restored code stands; the kernel cut, severance, GB10 client,
  Connectome rename and the active kernel-extraction charter are not taken; main's deletions wait for the
  owner; 31 docs and tooling files come in; main's July code (64 commits) is ported as separate commits.
- 2026-10-24 — **S3 done: the kernel runtime adapter** (`cortex/persistence/runtime.rs`, phase 4's kernel half),
  re-authored from the April `SurrealLifecycle` and the `OllamaAdapter`: the port from `port_alloc`, never
  attaching (an occupied port is someone else's — the runtime owns its data); `{port}` substituted in args
  and env; the child under `devpulse-process` (own job, no console, lines to the caller's events with the
  last 20 kept for errors); ready = HTTP 2xx on the ready path; an exit while starting fails at once with
  its last lines; no answer by the startup timeout → stopped and failed; the watchdog restarts a crash with
  doubling backoff and stays down past the crash-loop cap, saying why; stop = graceful then forced (R-G19).
  Verified: 5 kernel tests against a real child process (this test binary serving HTTP): answers then stops
  gracefully; an occupied port bumps; exit-while-starting fails in under 5 s quoting its output; a child that
  never answers fails at the 2 s test timeout; two restarts then `Failed` after the third crash. rustfmt and
  clippy (lib + tests, the new file) clean.
