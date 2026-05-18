# Prebuilt llama.cpp — operator + architecture reference

DevPulse's llama.cpp inference path links **prebuilt static libs** instead
of building llama.cpp from source on every dev box. This doc covers the
why, the moving parts, the fetch command, and the bump procedure.

## Why

`utilityai/llama-cpp-rs`'s `llama-cpp-sys-2` build script invokes
upstream `ggml-org/llama.cpp`'s CMake build via cmake-rs. On Windows with
the Vulkan backend, that build's nested `vulkan-shaders-gen`
`ExternalProject_Add` spawns a deeper-than-MAX_PATH TryCompile pass —
`cl.exe` aborts with `C1083: Cannot open compiler generated file`. Four
workarounds were rejected:

1. `CMAKE_OBJECT_PATH_MAX=32767` — only honored by the outer CMake.
   TryCompile sub-builds don't inherit project-level variables.
2. Windows `LongPathsEnabled` registry + `git core.longpaths` — `cl.exe`
   internal file-open routines for TryCompile temporaries empirically
   don't honor the long-path Win32 API.
3. Re-rooting `CARGO_TARGET_DIR` to a short path outside the workspace —
   functionally works but breaks the project's portability discipline
   (build artifacts must live next to the project, not in some opaque
   drive-root cache).
4. Windows `subst` virtual drive over `target/` — the path shortening
   worked, but the virtual root broke `tauri-build`'s sidecar resource
   copy with `PermissionDenied`. Reverted 2026-05-15.

The fix that works AND keeps build state in the workspace: **build
llama.cpp once on GitHub Actions runners (short clone path) and link the
resulting static libs**. Same shape DevForge uses for its REH tree,
except llama-cpp-prebuilt links statically into the `.exe` at compile
time while DevForge bundles a runtime tree.

## Architecture

```text
github.com/EonsofStupid/llama-cpp-prebuilt   (private wrapper repo)
   │
   │  matrix workflow on tag push:
   │    • clone ggml-org/llama.cpp at pinned SHA into D:\l (short path)
   │    • build static .lib files per target (vulkan / cuda / cpu)
   │    • stage zip = lib/<*.lib> + llama.cpp/{include,ggml/include,common,vendor}
   │    • publish release with per-target zips + sha256-pinned manifest.json
   │
   ▼ (release published)

deps/llama-cpp-prebuilt/manifest.json   (committed in this repo)
   │  SSOT pin: which release.tag + per-target sha256 this workspace consumes
   │
   ▼ (operator runs `cargo xtask fetch-llama-cpp --target <id>`)

deps/llama-cpp-prebuilt/<target>/
   ├── lib/*.lib                     ← prebuilt static libs
   ├── llama.cpp/include/llama.h     ← upstream source-tree mirror
   ├── llama.cpp/ggml/include/*.h
   ├── llama.cpp/common/*.h,*.hpp
   ├── llama.cpp/vendor/nlohmann/json.hpp
   └── .llama-cpp-prebuilt-version
   │
   ▼ (xtask `apply_env` exports `LLAMA_CPP_PREBUILT_LIB_DIR`)

deps/llama-cpp-rs/llama-cpp-sys-2/build.rs   (vendored fork, ~150-line patch)
   │  fast-path: skip cmake build, bindgen against prebuilt headers,
   │  compile C++ wrappers against prebuilt `llama.cpp/` mirror, emit
   │  link instructions for prebuilt `.lib` files
   │
   ▼

devpulse.exe   (static-linked, single self-contained distributable)
```

## Target ids

| target id            | platform | arch | backend | who needs it                                                |
|----------------------|----------|------|---------|-------------------------------------------------------------|
| `win32-x64-vulkan`   | Windows  | x64  | Vulkan  | Default GPU path — covers NVIDIA, AMD, Intel                |
| `win32-x64-cuda`     | Windows  | x64  | CUDA    | Faster on NVIDIA only — opportunistic (may be missing)      |
| `win32-x64-cpu`      | Windows  | x64  | CPU     | Boxes without a GPU; also the fallback when GPU isn't pinned|

CUDA is opportunistic on the source side too: the Jimver
`cuda-toolkit` action flakes intermittently on hosted runners. When a
release lands without a CUDA artifact, that target is dropped from the
manifest entirely. Downstream that asks for CUDA falls back to Vulkan.

Linux / macOS targets land later as DevPulse grows beyond the
Windows-first phase. On those platforms, `apply_env` is a no-op and
`build.rs` falls through to the upstream cmake build (no MAX_PATH issue
on those systems, so no prebuilt needed).

## Operator commands

### One-time setup (fresh checkout)

```powershell
# Initialize the vendored llama-cpp-rs submodule.
git submodule update --init --depth 1 deps/llama-cpp-rs

# Fetch the right prebuilt for your machine. Pick ONE:
cargo xtask fetch-llama-cpp --target win32-x64-vulkan   # any GPU
cargo xtask fetch-llama-cpp --target win32-x64-cuda     # NVIDIA only
cargo xtask fetch-llama-cpp --target win32-x64-cpu      # no GPU
```

`fetch-llama-cpp` reads
[`deps/llama-cpp-prebuilt/manifest.json`](../../deps/llama-cpp-prebuilt/manifest.json),
downloads the matching zip from the GitHub release, SHA-verifies, and
extracts to `deps/llama-cpp-prebuilt/<target>/`. The
`.llama-cpp-prebuilt-version` marker file enables cache-skip on
re-runs.

Set `GITHUB_TOKEN` in env first — the source repo is private. Any token
with `repo` scope works (operators usually use the same one their
`gh auth login` writes).

### Verifying the link

```powershell
cargo xtask verify
```

Look for this line in the output:

```text
  [env] LLAMA_CPP_PREBUILT_LIB_DIR = <abs path> (target = win32-x64-vulkan)
```

If you see this instead:

```text
  [warn] llama-cpp prebuilt not fetched for target `win32-x64-vulkan` — falling back to in-tree cmake build.
  [hint] cargo xtask fetch-llama-cpp --target win32-x64-vulkan
```

the prebuilt isn't staged yet — run the fetch command.

### Bumping to a new release

When upstream `ggml-org/llama.cpp` advances or a patch lands in the
sub-repo, the bump path is:

1. **Sub-repo side** — edit
   [`pinned.json`](https://github.com/EonsofStupid/llama-cpp-prebuilt/blob/main/pinned.json)
   to point at the new upstream SHA, bump `release.version`, push, tag.
   The matrix workflow builds + publishes.
2. **DevPulse side** — copy the new release's `manifest.json` content
   into [`deps/llama-cpp-prebuilt/manifest.json`](../../deps/llama-cpp-prebuilt/manifest.json)
   verbatim. Run `cargo xtask fetch-llama-cpp --target <target>` to
   refresh the local extract. Rebuild.

## File map

| Path                                                                 | Role                                                            |
|----------------------------------------------------------------------|-----------------------------------------------------------------|
| `github.com/EonsofStupid/llama-cpp-prebuilt`                         | Private wrapper repo (matrix workflow + manifest template)      |
| [`deps/llama-cpp-prebuilt/manifest.json`](../../deps/llama-cpp-prebuilt/manifest.json) | Committed pin — which release this workspace consumes |
| [`xtask/src/commands/fetch_llama_cpp.rs`](../../xtask/src/commands/fetch_llama_cpp.rs) | `cargo xtask fetch-llama-cpp` impl                  |
| [`xtask/src/workspace.rs`](../../xtask/src/workspace.rs) `export_prebuilt_llama_cpp` | Auto-exports `LLAMA_CPP_PREBUILT_LIB_DIR`              |
| [`deps/llama-cpp-rs/llama-cpp-sys-2/build.rs`](../../deps/llama-cpp-rs/llama-cpp-sys-2/build.rs) `run_prebuilt_fast_path` | Skips cmake, links prebuilt |

## When the prebuilt path is wrong

- **Active patch work on upstream llama.cpp's C API** — the prebuilt is
  immutable at the pinned SHA. Either bump the sub-repo to a new SHA
  and re-cut, or temporarily unset `LLAMA_CPP_PREBUILT_LIB_DIR` so
  build.rs falls through to the in-tree cmake build.
- **Cross-compiling to an architecture / OS not in the matrix** — same
  fix: unset the env var; the in-tree cmake build runs.
- **Reproducing a CI-only behavior** — the prebuilt was built on a
  Windows hosted runner; reproducing locally on Linux/macOS needs the
  in-tree path anyway.
