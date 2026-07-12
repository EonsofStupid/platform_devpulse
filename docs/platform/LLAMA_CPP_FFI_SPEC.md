# llama.cpp FFI — Master Specification

**Status:** Foundation landed 2026-05-15. Devtool surface planned, not
yet wired. End-to-end runtime gate pending.

**Scope:** Everything that makes llama.cpp inference work inside
DevPulse — the prebuilt static-lib pipeline, the Rust FFI binding
crates, the model-loader integration, and the `/devtools/runtimes/
inference/llama-cpp/` management surface.

**Out of scope:** Inference policy (which model to pick, when to
deepen, KV reuse strategy) — that lives in the Cortex roadmap.
This doc is the runtime substrate only.

> ## ⚠ CUT LANDED — 2026-07-08
>
> The kernel left this repo; llama.cpp inference is Clyffy's
> (`github.com/EonsofStupid/clyffyos`, clyffyos-model-loader owns the FFI).
> The `kernel/model-loader` citations below are git-history references. The
> local build artifacts (vendored `deps/` trees, `cargo xtask
> fetch-llama-cpp`, the prebuilt manifest) follow the cut — tracked as cut
> Phase 7. The engineering record (prebuilt pipeline, binding architecture,
> FFI latency targets) is preserved; its implementation home is ClyffyOS.

---

## 1. Architecture (foundation — wired today)

```text
┌────────────────────────────────────────────────────────────────────┐
│  github.com/EonsofStupid/llama-cpp-prebuilt   ← PRIVATE wrapper    │
│  (matrix workflow on tag push)                                     │
│    • Clones ggml-org/llama.cpp@<pinned SHA> into D:\l (short path) │
│    • Builds static libs per target (vulkan / cuda / cpu)           │
│    • Stages stage/{lib/*.lib, llama.cpp/{include,ggml/...,common,  │
│             vendor}, PROVENANCE.json}                              │
│    • Publishes release: per-target zip + sha256-pinned manifest    │
│                                                                    │
│  Free-tier quota: ~25–40 releases/month on personal GitHub Free    │
│  (2000 min/mo, Windows counts 2x; ~30 Windows-min per matrix run). │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  release published, sha256 pinned
┌────────────────────────────────────────────────────────────────────┐
│  deps/llama-cpp-prebuilt/manifest.json   ← SSOT pin in DevPulse    │
│    • schema: 1                                                     │
│    • upstream: { sha, tag, repository }                            │
│    • artifacts[]: { target, fileName, sha256, url, ... }           │
│  Bump = copy release's manifest.json verbatim + re-fetch           │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  `cargo xtask fetch-llama-cpp --target <id>`
┌────────────────────────────────────────────────────────────────────┐
│  deps/llama-cpp-prebuilt/<target>/                                 │
│    ├── lib/*.lib                       static libs                 │
│    ├── llama.cpp/include/llama.h       upstream tree mirror        │
│    ├── llama.cpp/ggml/include/*.h                                  │
│    ├── llama.cpp/common/*.h, *.hpp     (recursive)                 │
│    ├── llama.cpp/vendor/nlohmann/json.hpp                          │
│    └── .llama-cpp-prebuilt-version     cache marker                │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  xtask `apply_env` detects target dir
┌────────────────────────────────────────────────────────────────────┐
│  LLAMA_CPP_PREBUILT_LIB_DIR=<abs path>   (process-scoped env)      │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│  deps/llama-cpp-rs/llama-cpp-sys-2/build.rs  ← vendored submodule  │
│  `run_prebuilt_fast_path()`:                                       │
│    1. Validate llama.lib + llama.cpp/include/llama.h exist         │
│    2. Bindgen against prebuilt headers → OUT_DIR/bindings.rs       │
│    3. Compile wrapper_common.cpp + wrapper_oai.cpp against         │
│       <prebuilt>/llama.cpp/{include,common,vendor}                 │
│    4. Emit rustc-link-search=<prebuilt>/lib                        │
│    5. Emit rustc-link-lib=static=<every .lib> (auto-discovered)    │
│    6. Emit OS + backend system libs (user32, vulkan-1, cudart,...) │
│    7. RETURN — cmake build never runs                              │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ▼  static-linked at compile time
┌────────────────────────────────────────────────────────────────────┐
│  devpulse.exe                                                      │
│    • llama.cpp's C ABI exposed to Rust via llama-cpp-2 crate       │
│    • No external .dll / .so dependencies for llama.cpp itself      │
│    • Vulkan/CUDA system DLLs loaded at runtime (Windows OS-side)   │
└────────────────────────────────────────────────────────────────────┘
```

### What's wired today (with compile-green evidence)

| Piece                                  | Path                                                     | Status                                                              |
|----------------------------------------|----------------------------------------------------------|---------------------------------------------------------------------|
| Sub-repo + first release                | `EonsofStupid/llama-cpp-prebuilt` @ tag `v0.1.1`        | DONE — 2 zips (vulkan + cpu) + sha256-pinned manifest               |
| Workspace `[patch.crates-io]`           | [Cargo.toml](../../Cargo.toml#L199)                      | DONE — routes llama-cpp-2 + llama-cpp-sys-2 to `deps/llama-cpp-rs/` |
| Vendored llama-cpp-rs                   | `deps/llama-cpp-rs/` (submodule, depth 1, branch main)   | DONE — at 0.1.147                                                   |
| build.rs fast-path patch                | [build.rs `run_prebuilt_fast_path`](../../deps/llama-cpp-rs/llama-cpp-sys-2/build.rs) | DONE — bindgen + cc + link emit, ~180 LoC local change           |
| Pinned manifest                         | `deps/llama-cpp-prebuilt/manifest.json`                  | DONE — v0.1.1 pin                                                   |
| Fetch command                           | `xtask/src/commands/fetch_llama_cpp.rs`                  | DONE — mirrors fetch_devforge pattern                               |
| apply_env auto-export                   | `workspace.rs::export_prebuilt_llama_cpp`                | DONE — detects target from features                                 |
| `cargo check -p model-loader --features llama-cpp-ffi` | (end-to-end through llama-cpp-2)        | DONE — 16m 43s green via fallback path                              |

### What's NOT yet verified (end-to-end gates, deferred)

| Gate | Command                                                       | What it proves                          |
|------|---------------------------------------------------------------|-----------------------------------------|
| 1    | `cargo xtask fetch-llama-cpp --target win32-x64-vulkan`       | Fetch + sha256 + extract + layout check |
| 2    | `cargo xtask verify`                                          | apply_env auto-export wires             |
| 3    | `cargo clean -p llama-cpp-sys-2 && cargo check -p model-loader --features llama-cpp-vulkan` | Fast-path activates (compile time <60s instead of 16m+) |
| 4    | `cargo xtask build-release --portable-only`                   | Linker resolves prebuilt libs into .exe |
| 5    | Load a GGUF model in the running .exe, observe token stream   | Runtime ABI matches (no FFI crash)      |

Each gate is sequential. Failure modes are bounded — see §6 below.

---

## 2. Boundaries — what each layer owns

| Layer                                  | OWNS                                                          | DOES NOT OWN                                                    |
|----------------------------------------|---------------------------------------------------------------|-----------------------------------------------------------------|
| `llama-cpp-prebuilt` sub-repo          | Building llama.cpp static libs in CI; publishing sha256 zips  | Pinning which release DevPulse consumes                         |
| `deps/llama-cpp-prebuilt/manifest.json`| Which release this workspace links against (sha-pinned)       | Where the extracted files live (that's xtask + workspace.rs)    |
| `xtask fetch-llama-cpp`                | Download + sha256 verify + extract + layout-validity check    | Choosing which target to fetch (operator picks)                 |
| `xtask apply_env`                      | Auto-export `LLAMA_CPP_PREBUILT_LIB_DIR` based on detected features | Building llama.cpp (delegated to build.rs)                  |
| `llama-cpp-sys-2/build.rs`             | FFI bindings, wrapper compilation, link emission              | Runtime model loading (that's llama-cpp-2's job)                |
| `llama-cpp-2`                          | Rust API surface over the C ABI                               | Quant choice, KV strategy (that's model-loader + kernel)        |
| `kernel/model-loader`                  | Model load lifecycle, GGUF parsing, slot binding              | Token generation policy (that's kernel reasoning)               |
| `/devtools/runtimes/inference/llama-cpp/` | Operator-facing diagnostics + manual controls              | Customer-facing inference UX (chat windows etc)                 |

Boundary breaks to refuse: a fetch command that reads a different
manifest, a build.rs that fetches its own libs, a devtool that bypasses
the model-loader slot lifecycle.

---

## 3. Devtool surface — `/devtools/runtimes/inference/llama-cpp/`

### Pattern parity

Follows the locked devtool standard (per memory `project_devtool_standard.md`):
**ServiceDevtoolShell** with 5 tabs (Status / Config / Logs / Actions /
Debug). Color accent from `serviceAccents.ts`. Layman copy. Audience is
the developer verifying auto-managed system state — NOT customer-facing
config (per `feedback_devtools_are_dev_diagnostics.md`).

Existing skeleton: [interfaces/desktop/src/lib/devtools/runtimes/inference/llama-cpp/feature/LlamaCppDevtool.svelte](../../interfaces/desktop/src/lib/devtools/runtimes/inference/llama-cpp/feature/LlamaCppDevtool.svelte)
(688 LoC, pre-prebuilt). Will be reauthored against the spec below.

### 3.1 Status tab — "is the foundation healthy?"

Read-only state read from existing Tauri commands + a new one
(`llama_cpp_build_info`). Layout: one or two cards per concern.

| Card                          | Field                                  | Source                                                   |
|-------------------------------|----------------------------------------|----------------------------------------------------------|
| **Link mode**                 | `prebuilt` / `fallback (cmake)` / `not built` | New: `llama_cpp_build_info` command reads OUT_DIR marker |
|                               | Active target id                       | New: same command                                        |
|                               | Backend (vulkan / cuda / cpu)          | Derived from target id                                   |
| **Prebuilt manifest**         | Manifest version, upstream SHA + tag   | Reads `deps/llama-cpp-prebuilt/manifest.json`            |
|                               | Per-target sha256 (short hash)         | Same                                                     |
|                               | Cache marker version (per-target)      | Reads `.llama-cpp-prebuilt-version` files                |
|                               | Manifest-vs-cache drift?               | Computed: marker != manifest.version → drift             |
| **Slot state**                | Loaded model id (or "no model")        | Existing model-loader slot tauri command                 |
|                               | Model file path + size                 | Same                                                     |
|                               | Quant + parameters                     | Same                                                     |
|                               | KV cache size + tokens cached          | New: `llama_cpp_runtime_stats` command                   |
| **System libs at runtime**    | Vulkan SDK present (Y/N + version)     | Existing — detect at boot                                |
|                               | CUDA runtime present (Y/N + version)   | Existing                                                 |
|                               | Active GPU device name                 | New: query llama.cpp via FFI                             |

Empty / unhealthy states are BUG states, not setup wizards. Click any
empty value → link to the relevant log target.

### 3.2 Config tab — "how is the inference runtime parameterized?"

Read-only display (NOT customer-editable — this is dev diagnostics).
Values resolved from the layered config sources.

| Section                       | Fields                                              | Source                                                |
|-------------------------------|-----------------------------------------------------|-------------------------------------------------------|
| **Slot parameters**           | n_ctx, n_batch, n_ubatch, n_threads, n_gpu_layers   | `LlamaParams` in `kernel/model-loader/.../llama_cpp/` |
| **KV cache**                  | type_k / type_v, cache_strategy, defrag_thold       | Same                                                  |
| **Sampling defaults**         | temperature, top_p, top_k, repeat_penalty           | Same                                                  |
| **FFI feature flags**         | `llama-cpp-vulkan` / `llama-cpp-cuda` / `mtmd`      | Compile-time `cfg!(feature = "...")` snapshot         |
| **Build-time pins**           | llama-cpp-2 vendored version (0.1.147)              | Cargo metadata                                        |
|                               | llama.cpp upstream SHA (from manifest)              | Same                                                  |

### 3.3 Logs tab — "what has happened recently?"

Shared `query_scoped_log("llama_cpp.", limit)` Tauri command (per
memory `reference_scoped_logs.md`). Log prefix is `llama_cpp.*`.

| Sub-channel                  | What's logged                                          |
|------------------------------|--------------------------------------------------------|
| `llama_cpp.lifecycle`        | slot bind / unbind, model load start / end, errors     |
| `llama_cpp.inference`        | per-completion start / end, token count, latency, TTFT |
| `llama_cpp.ffi`              | wrapper bridge events, callback invocations            |
| `llama_cpp.kv`               | cache hit / miss / evict / defrag                      |

Standard log-viewer UI (existing pattern from other devtools). Includes
copy + export buttons with the size-guard from devtool standard.

### 3.4 Actions tab — "what can I do from here?"

All actions are **diagnostic / recovery operations**, not customer-facing
configuration. Each has a guardrail per the devtool standard (confirm
dialog for destructive ops).

| Action                                | Effect                                                              | Guardrail              |
|---------------------------------------|---------------------------------------------------------------------|------------------------|
| **Re-fetch prebuilt for active target** | Invokes `cargo xtask fetch-llama-cpp --target <id>` via existing xtask-bridge | None (idempotent)       |
| **Bump prebuilt to a new release**    | Open a one-shot wizard: paste a release tag, confirm sha256s, write `deps/llama-cpp-prebuilt/manifest.json` | Confirm tag       |
| **Unload current model**              | Free the FFI slot, drop KV cache, return memory                      | Confirm if mid-stream  |
| **Reload current model**              | Unload + reload (refresh after a config edit)                       | Confirm                |
| **Purge KV cache**                    | Clear KV without unloading model                                    | Confirm                |
| **Run inference smoke test**          | Generate 32 tokens against a tiny prompt, report latency + status   | None                   |
| **Open prebuilt extract dir**         | OS-native open of `deps/llama-cpp-prebuilt/<target>/`               | None                   |

### 3.5 Debug tab — "diagnose the build"

Read-only deep state for dev diagnosis. Hidden behind "show advanced"
toggle since it's noisy.

| Section                       | Content                                                            |
|-------------------------------|--------------------------------------------------------------------|
| **build.rs activation log**   | Did fast-path run? Or fallback (cmake)? Compile timestamp.         |
| **bindings.rs summary**       | Count of exported fns / types, top 10 fn names                     |
| **Wrapper compile**           | Path to `llama_cpp_sys_2_common_wrapper.lib`, file size, mtime     |
| **Link map**                  | Every `.lib` that got linked (parsed from cargo build log)         |
| **Linker errors archive**     | Last N link-time errors (when prebuilt mismatch surfaces)          |
| **Provenance**                | `PROVENANCE.json` from the prebuilt extract (when, what, builder)  |

### 3.6 New Tauri commands required

| Command                                  | Purpose                                                   |
|------------------------------------------|-----------------------------------------------------------|
| `llama_cpp_build_info`                   | Returns link mode + active target + manifest pin          |
| `llama_cpp_runtime_stats`                | KV cache size, tokens cached, GPU device name, layer split|
| `llama_cpp_run_smoke_test`               | Generate fixed tokens; return latency + token list        |
| `llama_cpp_purge_kv_cache`               | Free KV without unloading                                 |
| `llama_cpp_open_prebuilt_dir`            | OS-native open of `deps/llama-cpp-prebuilt/<target>/`     |
| `llama_cpp_bump_manifest`                | Write new manifest.json (validates first) + runs fetch    |

All wire through `interfaces/desktop/src-tauri/src/commands/llama_cpp/`
(new subdir). Specta-typed. Logs to `llama_cpp.devtool` channel.

### 3.7 Devtool reauthor scope

The existing 688-LoC `LlamaCppDevtool.svelte` will be reauthored, NOT
patched. Pre-prebuilt content makes assumptions about cmake-driven
builds that no longer hold. Reauthor mirrors the
`ServiceDevtoolShell` pattern verbatim — Status / Config / Logs /
Actions / Debug as 5 sibling `<Snippet>` blocks (per devtool standard).

Color accent: existing — keep whatever's wired in `serviceAccents.ts`
unless there's reason to change.

---

## 4. Bump procedure — going from v0.1.1 to v0.1.x

Two halves run independently:

**Sub-repo half** (operator: someone with push to `llama-cpp-prebuilt`):

1. Edit [`pinned.json`](https://github.com/EonsofStupid/llama-cpp-prebuilt/blob/main/pinned.json):
   set new `upstream.sha`, `upstream.tag`, bump `release.version`.
2. `git tag v0.1.x && git push origin v0.1.x`.
3. Matrix workflow builds + publishes ~10–15 min later.

**DevPulse half** (operator: anyone with the workspace checked out):

1. Copy the new release's `manifest.json` into
   `deps/llama-cpp-prebuilt/manifest.json` verbatim. (Or trigger
   "Bump prebuilt" from the devtool once §3.4 lands.)
2. `cargo xtask fetch-llama-cpp --target win32-x64-vulkan` (or whatever
   target this dev box runs).
3. `cargo xtask verify` — confirm `LLAMA_CPP_PREBUILT_LIB_DIR` exports
   correctly and the workspace still compiles.

The two halves don't need to be the same person and don't need to
happen close in time. The manifest is the contract.

---

## 5. Failure modes + recovery

Mapped to the 5 verification gates. Each failure has a bounded fix path.

| Gate failed                       | Likely cause                                                  | Fix                                                                                 |
|-----------------------------------|---------------------------------------------------------------|-------------------------------------------------------------------------------------|
| 1. Fetch download                 | GITHUB_TOKEN scope / network / GitHub flake                   | Re-run; check `gh auth status`                                                       |
| 1. Fetch sha256 mismatch          | Manifest sha out of sync with release artifact                | Re-copy release manifest verbatim                                                    |
| 1. Layout validity check          | Prebuilt zip staged wrong (e.g. flat `include/`)              | Sub-repo workflow staging bug → v0.1.x with fix                                      |
| 2. apply_env doesn't fire         | Workspace `export_prebuilt_llama_cpp` logic bug               | Edit `workspace.rs`; no re-release                                                   |
| 3. Bindgen error                  | Wrong `-I` path in `run_prebuilt_fast_path`                   | Edit `build.rs`; no re-release                                                       |
| 3. Wrapper compile error          | Missing header in prebuilt zip                                | Sub-repo workflow staging bug → v0.1.x                                               |
| 3. Wrapper compile error          | Missing `-I` path                                             | Edit `build.rs`; no re-release                                                       |
| 3. Linker unresolved external     | A `.lib` wasn't packaged                                      | Sub-repo workflow `.lib` filter bug → v0.1.x                                         |
| 3. Linker unresolved external     | System lib (advapi32, ws2_32) missing from link emit          | Edit `build.rs`; no re-release                                                       |
| 4. Tauri build fails              | Unrelated to prebuilt (resource copy, NSIS, etc)              | Diagnose separately                                                                  |
| 5. Runtime crash on FFI call      | ABI mismatch — vendored `llama-cpp-rs` `0.1.147` ABI vs prebuilt `llama.cpp` `18d1717` ABI | Pin sub-repo upstream SHA to a llama.cpp closer to what `llama-cpp-rs 0.1.147` was written against → v0.1.x release; OR pin vendored `llama-cpp-rs` to an older version compatible with current upstream |

Bindgen regenerates fresh against the prebuilt headers on every build,
so generated Rust types always match what's actually exported. The only
real ABI risk is the C++ wrapper layer (`wrapper_common.cpp`,
`wrapper_oai.cpp`) calling C++ symbols that may have changed signature
in upstream — but those wrappers reference llama.cpp's stable C API,
not its internal C++ classes, so this is structurally low-risk.

---

## 6. Open questions / decisions deferred

| Q | Decision needed by                       | Notes                                                          |
|---|------------------------------------------|----------------------------------------------------------------|
| Stay on personal GitHub free tier or migrate sub-repo to an org? | Whenever quota becomes a concern | 2000 min/mo (Windows 2x) is comfortable for ~30 releases/month |
| Pin a more reliable CUDA install method or keep opportunistic? | When NVIDIA-only optimization is a real need | Vulkan covers NVIDIA functionally; CUDA is faster-not-functional |
| Add Linux / macOS targets to the matrix? | When DevPulse expands past Windows-first phase | The fallback (in-tree cmake) works on those OS; prebuilt is only essential on Windows due to MAX_PATH |
| Wire the smoke-test action's reference prompt + token-count? | When §3.4 devtool re-author starts | Tiny prompt + 32 tokens is a reasonable default |
| Cache LLAMA_CPP_PREBUILT_LIB_DIR per-target in `target/` rather than re-export each invocation? | When iterating becomes painful | Currently re-exported on every `apply_env` call; no performance cost |

---

## 7. References

- Operator runbook: [PREBUILT_LLAMA.md](PREBUILT_LLAMA.md)
- Sub-repo release process: `github.com/EonsofStupid/llama-cpp-prebuilt/docs/RELEASE_PROCESS.md`
- Workspace `[patch.crates-io]`: [Cargo.toml lines 199–229](../../Cargo.toml)
- Fast-path implementation: [deps/llama-cpp-rs/llama-cpp-sys-2/build.rs `run_prebuilt_fast_path`](../../deps/llama-cpp-rs/llama-cpp-sys-2/build.rs)
- Fetch command: [xtask/src/commands/fetch_llama_cpp.rs](../../xtask/src/commands/fetch_llama_cpp.rs)
- apply_env wiring: [xtask/src/workspace.rs `export_prebuilt_llama_cpp`](../../xtask/src/workspace.rs)
- Pinned manifest: [deps/llama-cpp-prebuilt/manifest.json](../../deps/llama-cpp-prebuilt/manifest.json)
- Devtool standard (memory): `project_devtool_standard.md`
- Devtool audience (memory): `feedback_devtools_are_dev_diagnostics.md`
- Devtool taxonomy (memory): `project_devtool_modular_layout.md`
- Scoped logs pattern (memory): `reference_scoped_logs.md`
