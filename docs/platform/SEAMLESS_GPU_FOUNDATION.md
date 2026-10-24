# Seamless GPU + Nemotron Seed — Foundation Spec

**Status:** Research-grounded draft. Awaiting owner approval on §0 questions before code.
**Authored:** 2026-05-12
**Locks honored:** [project_seamless_gpu_nemotron_seed], [project_inference_runtime_direction], [project_vision_backend_hot_swap], [project_model_selection_tiered], [feedback_tracing_is_foundation], [feedback_dual_observability], [feedback_devtools_are_dev_diagnostics].

The four-layer locked chain is the contract this spec implements. Layer 1 is partially wired and broken (`vulkan-shaders-gen` race); layers 2 / 3 / 4 are open gaps. This document is the single foundation, not a series of patches.

---

## 0. Resolved decisions (2026-05-12 — locked, implementation gated only by S1 readiness)

> **Correction:** the "5.6 GB" number anchored earlier belongs to **Harrier 0.5B** (download+scan slot per `project_model_loader_requirements`), NOT Nemotron. Layer 4 is a head-to-head evaluation, not a commitment.

| # | Question | **Decision** |
|---|---|---|
| **Q1** | Nemotron evaluation quant grid scope | **Full ladder** — every Bartowski quant from `Q2_K` through `Q6_K` (plus `IQ4_XS` and `IQ4_NL`). Don't pre-filter; the bench tells us the cliff. |
| **Q2** | 0.6B model identity | **`Qwen/Qwen3-0.6B`** (default accepted) |
| **Q3** | Council orchestration | **All four strategies bundled as Cortex Councils modes.** Default for benchmarking and seed-eval: **Router-MoE** as the lead candidate, with `ParallelVote` / `SequentialRefine` / `DiverseTemperature` as sibling modes the user can switch into at chat-turn level. Bench evaluates all four. AI-collaboration framing per `project_cortex_surfaces`. |
| **Q4** | Bench harness | **`cargo xtask bench-seed`** — single command, JSONL output, summary table. |
| **Q5** | Training-capture opt-in | **First-run wizard consent** — this is the foundation moment; bake it in. Default OFF. |
| **Q6** | NVIDIA OML acceptance | **First-run global accept**, stored in user atomic config. |
| **Q7** | Floor-tier VRAM headroom | **`min(2048, 0.25 × total)`** as the starting formula. **User-configurable** — the wizard surfaces a "Performance" step where the headroom slider is adjustable (with the formula default pre-filled and an explanation of what trading more/less headroom means in plain English). Per-preset `vram_headroom_mb` overrides exist for advanced cases. |
| **Q8** | `gpu-rocm` AMD lane in v1 | **Follow-up.** Vulkan covers AMD in v1; ROCm lands as a feature-gated follow-up after the foundation slices ship. |

---

## 1. Scope (locked)

The four layers:

1. **Build-time SDK detection** — xtask probes the host for CUDA / Vulkan / MKL / ROCm SDKs, sets cargo features and env at the orchestration boundary. Partial today; build is broken under MSBuild.
2. **Runtime GPU vendor probe** — at boot, enumerate every GPU with vendor / VRAM / capability / driver. Reports feed model-loader, lane budgeter, devtool.
3. **Main-LLM GPU exclusive reservation** — `chat.brain` slot pins to the largest-VRAM device with `split_mode=None`. Reservation is automatic, never user-toggled. Secondary slots compete for *headroom*.
4. **Seed evaluation: Nemotron vs 0.6B council** — A/B benchmark **before** committing a default. Candidates: single Nemotron-Nano-9B-v2 across the GGUF quant grid, vs 4 parallel `Qwen3-0.6B` instances with a synthesizer call. Interaction capture, opt-in, provenance tags are the seams that open the fine-tune path on whichever wins.

Out of scope (explicit): WSL / Docker / Python anywhere in the runtime; UI toggles for backend or device; Mac targeting (Windows-first per `project_cross_platform_trajectory`); training pipeline itself (separate program, this spec only plants the seams).

---

## 2. Layer 1 — Build foundation

### 2.1 Root cause (confirmed two-layer)

The `vulkan-shaders-gen` race that broke the Windows build has two compounding causes:

1. **`cmake-rs` forwards `--parallel $NUM_JOBS`** to `cmake --build`. `NUM_JOBS` is set by cargo (CPU count by default). The CLI flag overrides `CMAKE_BUILD_PARALLEL_LEVEL` env. Source: cmake-rs `lib.rs`.
2. **`llama-cpp-sys-2 0.1.146`'s `build.rs`** unconditionally re-sets `CMAKE_BUILD_PARALLEL_LEVEL = available_parallelism()` regardless. Source: `llama-cpp-sys-2/build.rs` on docs.rs.
3. **MSBuild generator** ignores `ExternalProject_Add` ordering edges in parallel mode → shader-compile jobs launch before `vulkan-shaders-gen.exe` finishes linking → `unsuccessfulbuild` marker.

`CMAKE_BUILD_PARALLEL_LEVEL=1` from xtask therefore cannot reach the target. The patch was structurally ineffective.

**Upstream status:** [`ggml-org/llama.cpp#13753`](https://github.com/ggml-org/llama.cpp/issues/13753) open + stale. No fix landed. [PR #9239](https://github.com/ggml-org/llama.cpp/pull/9239) added shader rebuild tracking only.

### 2.2 Decision — switch to Ninja generator + cc::windows_registry MSVC activation

Decision matrix (research-validated):

| Approach | Verdict |
|---|---|
| **Ninja generator + cc::windows_registry MSVC env** | **Adopt.** Ninja's dependency graph respects `add_custom_command DEPENDS`; the race disappears. cmake-rs honors `CMAKE_GENERATOR` env. |
| NUM_JOBS=1 | Reject — serializes Rust compile too. |
| Pre-build vulkan-shaders-gen externally | Reject — requires forking ggml-vulkan's CMakeLists (no opt-out hook). |
| Fork cmake-rs to suppress `--parallel` | Reject — perpetual drift. |
| Switch to alternate llama Rust binding | Reject — `llama-cpp-2` is the leading binding; alts lag. |

### 2.3 MSVC environment activation

Canonical pattern: **`cc::windows_registry::find_tool(target, "cl.exe")`**. The `cc` crate is already in the workspace (transitively); `find_tool` returns a `Tool` whose `.env()` accessor exposes `INCLUDE`, `LIB`, `LIBPATH`, `PATH` populated by the same registry walk Rust's bootstrap uses.

Activation flow in xtask:

1. `cc::windows_registry::find_tool(&target, "cl.exe")` → `Tool`.
2. For each `(key, value)` in `tool.env()`: `std::env::set_var(key, value)`.
3. Fallback (if `None`): `vswhere -find **\Auxiliary\Build\vcvars64.bat`, run, capture env.
4. Hard error if both fail, with the install instructions URL in the message.

`#[cfg(windows)]` only. No-op on Linux/macOS where cmake-rs auto-detects gcc/clang.

### 2.4 Spec deltas — Layer 1

**`xtask/src/workspace.rs`** (read at file size that exceeded summary buffer — Re-Read at implementation time):
- **Add** `activate_msvc_env(target: &str)`. Calls `cc::windows_registry::find_tool`, exports env. Emits `build.foundation.msvc.activate` tracing event.
- **Add** `select_generator()`. Reads `[build.deps.cmake].extras.CMAKE_GENERATOR`, defaults to `"Ninja"` on Windows when MSVC env is hot AND `ninja.exe` resolves, falls back to `"Visual Studio 17 2022"` otherwise. Exports `CMAKE_GENERATOR` env so cmake-rs picks it up. Exports `CMAKE_MAKE_PROGRAM` ONLY when generator is Ninja (the comment in `deps.toml:30-42` already documents why this is conditional).
- **Delete** the `std::env::set_var("CMAKE_BUILD_PARALLEL_LEVEL", "1")` line. Comment why (structurally ineffective; Ninja makes it moot).
- **Convert** `println!("  [env] ...")` calls to `tracing::info!(target = "build.foundation", ...)` with stable fields (see §2.5).
- **Add ROCm probe** — `HIP_PATH` env or `C:\Program Files\AMD\ROCm\<ver>\bin\hipcc.exe`. When found AND no CUDA, push `gpu-rocm` instead of `gpu-vulkan` — but only when `[build.toolchain].prefer_rocm_over_vulkan = true` (default false per Q5).
- **Idempotence guard** — wrap env mutations in a `OnceCell<BuildEnv>`. Second call = no-op + log.

**`config/platform/build/deps.toml`:**
- **Flip** `[build.deps.cmake].extras.CMAKE_GENERATOR` from `"Visual Studio 17 2022"` to `"Ninja"`. Update comment.
- **Set** `[build.deps.ninja].env = ["CMAKE_MAKE_PROGRAM"]` — the parked TODO at lines 30-42.
- **Replace** the hardcoded `Microsoft Visual Studio/2019/...` ninja path with a resolution order: SSOT `path` (if exists) → `D:/localdev/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/Ninja/ninja.exe` (VS 2022 BuildTools) → `which::which("ninja")`. xtask logs which one won.
- **Add** `[build.toolchain.parallel] cmake_jobs = 1` and `cargo_jobs = "auto"` for documentation; Ninja's dep graph means cmake_jobs effectively unused.

**Cargo feature graph:**
- `kernel/model-loader/Cargo.toml` — add `llama-cpp-rocm = ["llama-cpp-ffi", "llama-cpp-2/rocm"]` (now real in 0.1.146).
- `kernel/devpulse-clyffy/Cargo.toml` — add `model-loader-llama-rocm` proxy.
- `systems/devpulse-engine/Cargo.toml` — add `gpu-rocm` feature mirroring `gpu-nvidia`'s wiring.
- `interfaces/desktop/src-tauri/Cargo.toml` — add `gpu-rocm` consumer proxy.
- **Leave `gpu-vulkan`'s `burn-wgpu` exclusion** — `wgpu-hal 29.0.3` / `gpu-allocator 0.28` / `windows 0.54-vs-0.62` skew is still unfixed upstream as of 2026-05-12. No Burn 0.22 yet.

### 2.5 Tracing taxonomy — `build.foundation`

| Event | Fields |
|---|---|
| `bootstrap` (span) | `xtask_version`, `target`, `crt`, `host_os`, `host_cpus` |
| `sdk.probe` | `sdk` (cuda/vulkan/mkl/rocm), `found`, `path`, `version_dir`, `selector` (env/scan) |
| `msvc.activate` | `source` (cc-registry/vswhere/preset), `vs_install`, `msvc_version`, `cl_path`, `include_count`, `lib_count` |
| `env.export` | `key`, `value`, `dep`, `reason` |
| `generator.select` | `generator`, `reason`, `make_program` |
| `parallel.policy` | `cmake_parallel`, `cargo_parallel`, `rust_lld`, `sccache` |
| `features.resolved` | `features`, `cuda_active`, `vulkan_active`, `mkl_active`, `rocm_active` |
| `warn.missing` | `dep`, `expected_path`, `fallback_used` |

`tracing::info!` happy path; `warn!` fallbacks; `error!` hard fails. Targets prefixed `build.foundation.*` so a single glob subscription powers the devtool log surface.

---

## 3. Layer 2 — Runtime GPU vendor probe

### 3.1 Current state

`kernel/model-loader/src/hardware/metrics.rs:13-51` tracks GPU as flat scalars (`gpu_name`, `gpu_vram_total_mb`, etc.) — single-GPU, NVML or PowerShell `Win32_VideoController` fallback. **No vendor field, no compute capability, no multi-GPU enumeration, no Vulkan version.** Confirmed gap.

`auto_config.rs:103-113` `detect_tier()` is the only downstream consumer; pure VRAM ladder.

### 3.2 Crate stack decision

Primary: **`ash`** (Vulkan) for cross-vendor enumeration. Reasons:
- Every host that can run our Vulkan inference backend has the Vulkan ICD (`ggml-vulkan` needs Vulkan 1.2+).
- Vendor ID + device ID + apiVersion + driverVersion via `vkGetPhysicalDeviceProperties2`.
- `VK_KHR_driver_properties` (core in 1.2) gives human driver name.
- `VK_EXT_memory_budget` gives live free VRAM per heap.
- Works on NVIDIA / AMD / Intel / MoltenVK (Apple).

Per-vendor enrichment:
- **`nvml-wrapper`** bumped to **0.11.0** (NVML v12) for NVIDIA-specific compute capability, live util, temp, per-PID VRAM. Already a workspace dep at 0.10.
- Skip `cudarc` (redundant — NVML exposes compute capability).
- Skip AMD AGS (no Rust bindings, AMD-specific fields we don't need).
- Skip Intel Level-Zero (Vulkan covers what we need in v1).

Fallback (Windows-only): **`windows = "0.62"`** crate, features `Win32_Graphics_Dxgi`, `Win32_Graphics_Dxgi_Common`, `Win32_Foundation`. Used ONLY when `vkCreateInstance` fails (no Vulkan ICD installed — rare). DXGI also provides `AdapterLuid` for joining Vulkan ↔ DXGI rows on multi-API systems.

**Do NOT use `wgpu` in the kernel probe** — pulling wgpu into kernel re-introduces the `gpu-allocator`/`windows` skew the engine already documents. Compositor (`devpulse-media`) uses wgpu; kernel stays clean.

### 3.3 Struct shape

```rust
// kernel/model-loader/src/hardware/gpu/types.rs
pub enum GpuVendor {
    Nvidia, Amd, Intel, Apple, Microsoft, // Microsoft = WARP / Basic
    Unknown(u32 /* PCI vendor id */),
}

pub enum GpuCapability {
    Cuda { sm_major: u32, sm_minor: u32, cuda_driver_version: (u32, u32) },
    Vulkan { api_major: u32, api_minor: u32, api_patch: u32,
             driver_id: u32, supports_memory_budget: bool,
             supports_dedicated_allocation: bool, supports_buffer_device_address: bool },
    Metal { family: String },
    None,
}

pub enum GpuLiveTelemetrySource { Nvml, VkMemoryBudget, DxgiQueryVideoMemoryInfo, None }

pub struct GpuDeviceInfo {
    pub probe_index: usize,
    pub adapter_luid: Option<u64>,
    pub vendor: GpuVendor,
    pub pci_vendor_id: u32,
    pub pci_device_id: u32,
    pub name: String,
    pub device_type: GpuDeviceType, // Discrete | Integrated | Virtual | Software
    pub vram_total_mb: u64,
    pub vram_free_mb: Option<u64>,
    pub vram_dedicated_mb: u64,
    pub vram_shared_mb: u64,
    pub driver_version: Option<String>,
    pub capability: GpuCapability,
    pub live_source: GpuLiveTelemetrySource,
}

pub enum ProbeWarning {
    VulkanLoaderMissing,
    NvmlInitFailed { error: String },
    DxgiEnumerationFailed { error: String },
    VendorIdUnknown { pci: u32 },
    BackendBuiltButVendorAbsent { built: BuiltBackend, observed: Vec<GpuVendor> },
    LiveVramUnavailable { device_index: usize, reason: &'static str },
}

pub struct GpuProbeReport {
    pub probed_at: chrono::DateTime<chrono::Utc>,
    pub devices: Vec<GpuDeviceInfo>,
    pub primary_index: Option<usize>,
    pub vulkan_loader: VulkanLoaderState,
    pub dxgi_available: bool,
    pub nvml_available: bool,
    pub probe_warnings: Vec<ProbeWarning>,
}
```

All shapes derive `Serialize + Deserialize + specta::Type` so TS bindings auto-generate.

### 3.4 Probe layering

```
collect_gpu_probe() -> GpuProbeReport:
    1. Enumerate:
        a. #[cfg(windows)] IDXGIFactory7::EnumAdapters1 → DXGI_ADAPTER_DESC3 per adapter.
           Drop software adapters unless none exist. Record LUID, vendor/device ID, dedicated/shared VRAM.
        b. ash::Instance with VK_KHR_get_physical_device_properties2 → vkEnumeratePhysicalDevices
           → vkGetPhysicalDeviceProperties2(pNext = VkPhysicalDeviceDriverProperties).
           Match Vulkan rows to DXGI rows by LUID (Windows) / PCI bus id (Linux); merge.
        c. Fallback: existing PowerShell Win32_VideoController query. Mark live_source = None.
    2. Per-vendor enrichment (best-effort, parallel):
        NVIDIA → Nvml::init(); match by PCI bus id; fill cuda_compute_capability(), live memory_info, util, temp, driver version.
        Others → no-op in v1.
    3. Live VRAM resolution (per device, layered):
        NVML.memory_info() → VkPhysicalDeviceMemoryBudgetPropertiesEXT → DXGI QueryVideoMemoryInfo → None.
    4. primary_index selection:
        Discrete GPUs with vram_total_mb ≥ 8000, prefer NVIDIA when built feature == gpu-nvidia,
        else largest VRAM, else largest integrated, else None.
    5. Expose as sync collect_gpu_probe() (boot path). HardwareMonitor caches alongside HardwareMetrics.
       Re-probe before every model load. probe_revision: u64 bump signals consumers to refresh.
```

**Hot-replug:** poll-on-demand in v1. WM_DEVICECHANGE wiring is a v2 hook (Tauri owns the message pump; kernel doesn't have a window thread).

### 3.5 Build × runtime coordination

The selector lives in `systems/devpulse-engine/src/platform/services/model_loader.rs`. Pure function over `(BuiltBackend, GpuProbeReport)` → `(ActiveInferenceBackend, primary_device_index, secondary_lanes)`.

| Built | Probed primary | Active llama.cpp | Active mistralrs | Active Burn | Status |
|---|---|---|---|---|---|
| gpu-nvidia | NVIDIA | cuda | cuda | burn-cuda | Optimal |
| gpu-nvidia | AMD/Intel | CPU | CPU | CPU | **DEGRADED** → warn + suggest rebuild |
| gpu-vulkan | NVIDIA | vulkan | CPU | CPU (Flex) | Sub-optimal (CUDA would be faster) |
| gpu-vulkan | AMD/Intel | vulkan | CPU | CPU (Flex) | Optimal for non-NVIDIA |
| gpu-vulkan | none / ICD missing | CPU | CPU | CPU | **DEGRADED** → VulkanLoaderMissing warn |
| cpu-mkl only | any | CPU MKL | CPU MKL | CPU | Optimal for CPU build |
| gpu-rocm | AMD | rocm | CPU | CPU | Optimal AMD lane (Q5) |

Every degraded path emits one `tracing::warn!` AND one `InternalEvent::HardwareProbeMismatch`.

### 3.6 Spec deltas — Layer 2

**`kernel/model-loader/Cargo.toml`:**
- Add `ash = "0.38"` (no default features), cfg `target_os = "windows", "linux"` (Apple uses metal later).
- Add `windows = "0.62"` features `Win32_Graphics_Dxgi`, `Win32_Graphics_Dxgi_Common`, `Win32_Foundation` (Windows-only).
- Bump `nvml-wrapper` 0.10 → 0.11.
- New features `gpu-probe-vulkan = ["dep:ash"]`, `gpu-probe-dxgi = ["dep:windows"]`. Both default-on.

**`kernel/model-loader/src/hardware/gpu/`** (new module):
- `mod.rs`, `types.rs`, `probe.rs`, `enumerate_dxgi.rs` (cfg windows), `enumerate_vulkan.rs`, `enrich_nvml.rs`.

**`kernel/model-loader/src/hardware/metrics.rs`:**
- Replace flat `gpu_*` scalars with `gpus: Vec<GpuDeviceInfo>` + `primary_gpu_index: Option<usize>`.
- Retire PowerShell `Win32_VideoController` as primary; keep only as final fallback.
- `has_gpu()` / `free_vram_mb()` / `total_vram_mb()` delegate to primary GPU. Keeps `auto_config::detect_tier()` unchanged in slice 1.

**`kernel/model-loader/src/hardware/auto_config.rs`:**
- Slice 1: leave tier ladder unchanged.
- Slice 2: branch tier selection on `GpuVendor` + `vram_total_mb` so Nemotron preset only activates on NVIDIA discrete ≥ 8 GB primary (matches main-LLM rule).

**`systems/devpulse-engine/src/platform/facade/events.rs`:**
- Add `EventCategory::HardwareProbe`.
- Add variants: `HardwareProbeStarted`, `HardwareProbeComplete`, `HardwareProbeWarning`, `HardwareProbeMismatch`, `GpuDeviceDiscovered`.

**`systems/devpulse-engine/src/platform/services/hardware_probe.rs`** (new):
- Owns `HardwareMonitor`; exposes `tauri::command query_gpu_probe()`; drives boot-time probe emission.
- Defines `emit_probe!` paired-emission macro (mirrors `emit_lifecycle_dual!`).
- `HARDWARE_PROBE_TARGET = "hardware.probe"`.

**Devtool route:** `/devtools/system/hardware/gpu`. Registry entry in `interfaces/desktop/src/lib/domains/platform/_shared/devtool-registry.ts`. Page uses `ServiceDevtoolShell` with Status/Config/Logs/Actions/Debug tabs per [project_devtool_pattern].

### 3.7 Tracing taxonomy — `hardware.probe`

| Event | Fields |
|---|---|
| `probe_started` | `trigger` (boot/model_preload/manual_refresh), `previous_revision` |
| `enumeration_step` | `source` (dxgi/vulkan/nvml/powershell_fallback), `devices_found`, `elapsed_us` |
| `device_discovered` | `index`, `vendor`, `pci_vendor_id`, `pci_device_id`, `name`, `vram_total_mb`, `device_type` |
| `capability_resolved` | `index`, `capability` (debug-render) |
| `live_telemetry_source` | `index`, `source` |
| `primary_selected` | `index`, `reason` |
| `probe_warning` (warn) | `kind`, `detail` |
| `probe_complete` | `device_count`, `revision`, `total_elapsed_ms` |

---

## 4. Layer 3 — Main-LLM exclusive GPU reservation

### 4.1 The single rule

> Pick the single physical GPU with the largest free VRAM. Bind the `chat.brain` slot's backend with `split_mode=None`, `main_gpu=<picked_ordinal>`, all layers offloaded. Reserve `(total_vram − headroom)` against the lane budget. Every secondary slot that prefers GPU competes for the *headroom*, not the total.

No toggles. No prompts. Automatic. Per locked memory.

### 4.2 Device pinning per backend (verified May 2026)

**llama.cpp via `llama-cpp-2 0.1.146`:**
```rust
LlamaModelParams::default()
    .with_n_gpu_layers(u32::MAX)
    .with_split_mode(LlamaSplitMode::None)
    .with_main_gpu(picked_ordinal)
```
`with_split_mode` / `with_main_gpu` / `with_n_gpu_layers` / `with_devices` confirmed on `LlamaModelParams` in `utilityai/llama-cpp-rs:llama-cpp-2/src/model/params.rs`.

Vulkan device order via `GGML_VK_VISIBLE_DEVICES=<idx>` env. CUDA order via `CUDA_VISIBLE_DEVICES`.

**mistral.rs 0.8.x:** no public single-ordinal pin — automatic device mapping is the only API. Set `MISTRALRS_NO_NCCL=1` to disable tensor parallelism. When mistral.rs runs on a host where Nemotron is already resident on the GPU, the reduced free VRAM forces auto-mapping to push overflow to CPU. Document this as the contract; don't author a fake wrapper.

**candle / Burn:** `Device::new_cuda(ordinal)` explicit; pin to picked ordinal. When over-budget, lane budgeter routes to `Device::Cpu`.

### 4.3 VRAM budget allocator behavior

Single decisive rule:

1. `chat.brain` loads **first**. Reserves `total_vram - headroom`.
2. **Headroom resolution** (Q7): `resolve_headroom(total_vram, user_override) -> u64` returns `user_override` if the user set one via the first-run wizard's Performance step, else `min(2048, 0.25 × total_vram)` MB. Per-preset `vram_headroom_mb` override exists as an advanced escape hatch but is absent from defaults. Wizard slider range maps `0.15 × total → 0.40 × total`; defaults to `0.25`. Same `resolve_headroom` function powers both the wizard preview and the runtime loader so they can never drift.
3. After reservation, `LaneBudget(Vram).free_bytes` shows **headroom only** — never raw NVML free.
4. Secondary slot planning load:
   - Fits in headroom → load on GPU.
   - Doesn't fit + `DevicePreference::Gpu` → refuse, devtool log line "would exceed reserved budget."
   - Doesn't fit + `GpuWithCpuFallback` → silent CPU load.
   - Doesn't fit + `Cpu` / `Any` → CPU.
5. User-initiated over-budget load: **no UI prompt, no chat.brain eviction**. Devtool log + status badge. Fallback proceeds if allowed; refusal otherwise.

### 4.4 Multi-GPU rule

`split_mode=None` is the canonical single-GPU pin. On dual-GPU systems (e.g. 4090 + 3060): main pins to the larger, secondaries route to the smaller. **Do NOT span the main LLM across both GPUs by default** — `split_mode=Layer` is reserved for the case where a single GPU can't hold the model. Future "Workstation" tier extends this; today's rule covers single-GPU and asymmetric dual cleanly.

### 4.5 Tracing taxonomy — `model_loader.lifecycle`

Reservation events:

- `gpu.detected{vendor, name, ordinal, vram_total_mb, vram_free_mb, compute_cap, vulkan_version}`
- `gpu.reservation.claimed{slot_id, ordinal, vram_reserved_mb, headroom_mb, backend}`
- `gpu.reservation.released{slot_id, ordinal, reason}`
- `gpu.budget.headroom_changed{ordinal, headroom_free_mb, reservation_count}`
- `slot.fallback.cpu{slot_id, reason, attempted_device}`
- `model.seed.loaded{repo_id, file, quant, preset_tier, training_capture_enabled}`

Each emits both `tracing::*` and a typed `InternalEvent` variant per `feedback_dual_observability`.

---

## 5. Layer 4 — Seed evaluation: Nemotron vs 0.6B council

The seed is NOT pre-committed. The implementation produces both configurations + a benchmark harness. The winner of the eval becomes the default; the loser stays available as a preset alternative.

### 5.1 Candidate A — Nemotron-Nano-9B-v2 (single)

**Repo:** `bartowski/nvidia_NVIDIA-Nemotron-Nano-9B-v2-GGUF` — bartowski's full ladder, imatrix-calibrated.
**Architecture:** 8.89B params, 128K context, hybrid Mamba-2 + 4 Attention layers + MLP (`nemotron_h` arch), NVIDIA Open Model License (commercial OK), **text-only**.
**llama.cpp support:** PR #15507 / release b6315 (2025); compatible with `llama-cpp-2 0.1.146`.

Eval quant ladder (Q1 default, full quants):

| Quant | Size | Notes |
|---|---|---|
| Q2_K | 3.49 GB | Aggressive; quality cliff |
| Q3_K_L | 5.49 GB | Floor-friendly |
| **Q3_K_XL** | **5.78 GB** | Closest to the old "5.6 GB" anchor; included for sentimental A/B |
| Q4_0 | 5.34 GB | Legacy K-quant precursor |
| **IQ4_XS** | **5.27 GB** | Lowest PPL/size in its band |
| IQ4_NL | 5.31 GB | IQ4 non-linear variant |
| Q4_K_S | 6.21 GB | Floor borderline |
| Q4_K_M | 6.53 GB | Default if size-unconstrained |
| Q5_K_M | 7.69 GB | Mid-tier headroom |
| Q6_K | 8.93 GB | Reference for "Q4 close enough" verdict |

### 5.2 Candidate B — Qwen3-0.6B council (4 collaboration strategies bundled)

**Base model:** `Qwen/Qwen3-0.6B` (March 2026 release, dense 0.6B params, 32K context, Apache 2.0).

The council is a **Cortex Councils surface** per `project_cortex_surfaces`. It exposes **four AI-collaboration strategies** the user can switch between at chat-turn level OR set as a global default. All four share the same shared-weight, multi-context structure; only the orchestration differs. The bench harness evaluates all four; the eventual `chat.brain` default for the council candidate is whichever strategy wins overall (or per-task-class — the bench captures per-prompt-category metrics so the default can be a per-prompt-class router decision later).

#### 5.2.1 The four strategies

**(1) RouterMoE — "Specialist" mode (LEAD candidate)**
- One router instance (temp `0.0`) reads the prompt and emits a routing token (`0` / `1` / `2` / `3`) selecting one of four specialist instances.
- Specialists have distinct system prompts: `code` (Rust/TS/SQL bias), `reasoning` (math/logic/multi-step), `explanation` (didactic, layman), `creative` (open-ended, writing).
- Selected specialist generates the answer. No synthesis.
- 5 contexts total (1 router + 4 specialists) sharing one model weight.
- This is the lead candidate per Q3 — minimum latency (one path through), router learns from training-capture for future fine-tune.

**(2) ParallelVote — "Discuss" mode**
- Same prompt fanned to 4 instances at temps `{0.3, 0.6, 0.9, 1.1}`.
- Each generates independently.
- 5th synthesizer call (temp `0.2`) sees prompt + all 4 answers, picks best or merges.
- 5 contexts total. Higher latency, broader exploration.

**(3) SequentialRefine — "Refine" mode**
- Instance 1 (temp `0.7`) drafts.
- Instance 2 (temp `0.4`) critiques the draft.
- Instance 3 (temp `0.4`) rewrites incorporating the critique.
- Instance 4 (temp `0.2`) polishes.
- 4 contexts, chained. Highest latency, deepest single-thread quality pass.

**(4) DiverseTemperature — "Brainstorm" mode**
- Same as ParallelVote topology but NO synthesizer — returns all 4 raw answers to the user as parallel candidates to inspect.
- 4 contexts. Lowest synthesis overhead, raw diversity for ideation.

#### 5.2.2 Eval quant ladder per instance

| Quant | Per-instance size | 5-instance total (router/parallel) | 4-instance total (refine/diverse) |
|---|---|---|---|
| Q2_K | ~280 MB | ~1.4 GB | ~1.1 GB |
| Q3_K_M | ~340 MB | ~1.7 GB | ~1.4 GB |
| Q4_0 | ~380 MB | ~1.9 GB | ~1.5 GB |
| **Q4_K_M** | **~410 MB** | **~2.0 GB** | **~1.6 GB** |
| Q5_K_M | ~470 MB | ~2.3 GB | ~1.9 GB |
| Q6_K | ~540 MB | ~2.7 GB | ~2.2 GB |
| Q8_0 | ~680 MB | ~3.4 GB | ~2.7 GB |

Council total at any quant fits comfortably under any tier headroom — the council's structural advantage over the 9B single.

#### 5.2.3 Backend implementation — shared-weight multi-context

- One `Arc<LlamaModel>` loaded from `llama-cpp-2 0.1.146`, instantiated ONCE in VRAM.
- N `LlamaContext` handles spawned via `LlamaModel::new_context()` (cheap — KV-cache per context only).
- Each context carries a `LlamaContextConfig { system_prompt, temperature, max_tokens, role_label }` driven by the strategy variant.
- Parallelism: tokio `join_all` for parallel strategies (ParallelVote, DiverseTemperature, RouterMoE specialists post-route).
- Strategy orchestration lives in `kernel/model-loader/src/backends/llamacpp/council.rs` (new file). Implements the same `ChatBackend` trait as the single backend; the caller doesn't know it's a council.

### 5.3 Evaluation harness — `cargo xtask bench-seed`

Single command, repeatable, captured as structured tracing events. Re-runnable any time the candidate set or quant ladder changes; result JSONLs accumulate in `target/bench-seed/` so historical comparisons are possible.

#### 5.3.1 Prompt set (fixed, checked-in)

50 prompts at `xtask/data/bench-seed-prompts.toml`, categorized so the bench report breaks down per category (and the eventual default can be a per-category router decision):

- `code` (Rust + TS + SQL) — 15 prompts
- `reasoning` (multi-step, math, logic) — 10 prompts
- `explanation` (didactic, layman) — 10 prompts
- `tool_json` (structured output, function-call) — 10 prompts
- `adversarial` (refusal-edge, jailbreak attempts) — 5 prompts

#### 5.3.2 Metrics (per prompt × per config)

- `ttft_ms` — time to first token
- `throughput_tok_s` — sustained throughput after TTFT
- `total_latency_ms` — full response
- `vram_peak_mb` — sampled from NVML at peak during the run
- `output_token_count`
- `output_text` (captured for offline review; v1 quality scoring = human eyeballs, automated rubric is a follow-up)
- `strategy_overhead_ms` (council only — synthesizer or router time)

#### 5.3.3 Config matrix — auto-enumerated

**Candidate A — Nemotron (10 configs):**
`Q2_K / Q3_K_L / Q3_K_XL / IQ4_XS / IQ4_NL / Q4_0 / Q4_K_S / Q4_K_M / Q5_K_M / Q6_K`

**Candidate B — Qwen3-0.6B council (28 configs = 4 strategies × 7 quants):**
- Strategies: `RouterMoE / ParallelVote / SequentialRefine / DiverseTemperature`
- Per-strategy quant ladder: `Q2_K / Q3_K_M / Q4_0 / Q4_K_M / Q5_K_M / Q6_K / Q8_0`

**Total bench matrix:** 38 configs × 50 prompts = **1,900 prompt runs per full bench**. Estimated wall-clock on JessePrimary (16 GB): ~3.5 hours one-shot. Bench supports `--category <name>` and `--quant <list>` flags for partial runs during iteration.

#### 5.3.4 Output

- JSONL per (config, prompt) row → `target/bench-seed/<timestamp>.jsonl`
- Printed summary table at completion: rows = configs, columns = (mean TTFT, mean throughput, mean latency, VRAM peak, per-category mean rank).
- Per-category winner declared in the summary footer.

#### 5.3.5 Tracing taxonomy — `bench.seed`

| Event | Fields |
|---|---|
| `run_start` | `total_configs`, `total_prompts`, `timestamp`, `host` |
| `config_start` | `config_name`, `model`, `quant`, `strategy` |
| `prompt_complete` | `config`, `prompt_id`, `category`, `ttft_ms`, `throughput_tok_s`, `total_latency_ms`, `vram_peak_mb`, `output_token_count`, `strategy_overhead_ms` |
| `config_complete` | `config`, `mean_ttft_ms`, `mean_throughput`, `mean_latency_ms`, `vram_peak_mb`, `per_category_means` |
| `winner_declared` | `category`, `config_name`, `delta_vs_runner_up_ms` |
| `run_complete` | `total_elapsed_ms`, `jsonl_path` |

### 5.4 Hot-swap interactions (both candidates are text-only)

Neither Nemotron-Nano-9B-v2 nor Qwen3-0.6B is omni — `vision.embedder` / `voice.tts` / `voice.brain` slots stay on their respective specialists (SigLIP2 / Qwen3-TTS / Moshi-class etc.) regardless of which seed wins. The omni-detection module (`kernel/model-loader/src/slots/omni_detection.rs`, doesn't exist yet — verify Sprint 03 status) returns `OmniCapability::None` for both arches.

### 5.5 Preset entries — Nemotron single + four council modes

Floor (8 GB) ships **five alternates** at `chat.brain` (one Nemotron + four council strategies). Default is set post-bench. All five share the same shared-weight, multi-context structure for the council variants — they differ only by `council_strategy`:

```toml
# Candidate A — Nemotron single seed (lead at "deep reasoning" tasks)
[[presets.floor.alternates.chat.brain]]
name = "nemotron-9b-iq4xs"
model_repo_id = "bartowski/nvidia_NVIDIA-Nemotron-Nano-9B-v2-GGUF"
model_filename = "nvidia_NVIDIA-Nemotron-Nano-9B-v2-IQ4_XS.gguf"
model_size_mb = 5270
vram_estimate_mb = 5800
device = "Gpu"

[presets.floor.alternates.chat.brain.extensions]
gpu_reserved = "true"
llama_cpp_split_mode = "none"
llama_cpp_n_gpu_layers = "-1"
prompt_template = "nemotron-h"
council = "false"

# Candidate B.1 — Council RouterMoE "Specialist" (Q3 lead)
[[presets.floor.alternates.chat.brain]]
name = "qwen3-0.6b-council-router-q4km"
model_repo_id = "Qwen/Qwen3-0.6B-GGUF"
model_filename = "qwen3-0_6b-q4_k_m.gguf"
model_size_mb = 410
vram_estimate_mb = 2050           # 5 contexts × KV + 1 weight buffer
device = "Gpu"

[presets.floor.alternates.chat.brain.extensions]
gpu_reserved = "true"
llama_cpp_split_mode = "none"
llama_cpp_n_gpu_layers = "-1"
prompt_template = "qwen3"
council = "true"
council_strategy = "router-moe"
council_router_temperature = "0.0"
council_specialists = "code,reasoning,explanation,creative"

# Candidate B.2 — Council ParallelVote "Discuss"
[[presets.floor.alternates.chat.brain]]
name = "qwen3-0.6b-council-parallel-q4km"
model_repo_id = "Qwen/Qwen3-0.6B-GGUF"
model_filename = "qwen3-0_6b-q4_k_m.gguf"
model_size_mb = 410
vram_estimate_mb = 2050
device = "Gpu"

[presets.floor.alternates.chat.brain.extensions]
gpu_reserved = "true"
council = "true"
council_strategy = "parallel-vote"
council_temperatures = "0.3,0.6,0.9,1.1"
council_synthesizer_temperature = "0.2"

# Candidate B.3 — Council SequentialRefine "Refine"
[[presets.floor.alternates.chat.brain]]
name = "qwen3-0.6b-council-refine-q4km"
model_repo_id = "Qwen/Qwen3-0.6B-GGUF"
model_filename = "qwen3-0_6b-q4_k_m.gguf"
model_size_mb = 410
vram_estimate_mb = 1650           # 4 contexts (no synthesizer)
device = "Gpu"

[presets.floor.alternates.chat.brain.extensions]
gpu_reserved = "true"
council = "true"
council_strategy = "sequential-refine"
council_chain_temperatures = "0.7,0.4,0.4,0.2"
council_chain_roles = "draft,critique,rewrite,polish"

# Candidate B.4 — Council DiverseTemperature "Brainstorm"
[[presets.floor.alternates.chat.brain]]
name = "qwen3-0.6b-council-brainstorm-q4km"
model_repo_id = "Qwen/Qwen3-0.6B-GGUF"
model_filename = "qwen3-0_6b-q4_k_m.gguf"
model_size_mb = 410
vram_estimate_mb = 1650
device = "Gpu"

[presets.floor.alternates.chat.brain.extensions]
gpu_reserved = "true"
council = "true"
council_strategy = "diverse-temperature"
council_temperatures = "0.3,0.6,0.9,1.1"
council_return_all = "true"
```

`vram_headroom_mb` is NOT in the preset extensions — it's a **runtime-resolved** value driven by §4.3's formula (default `min(2048, 0.25 × total)`), overridable by the user via the first-run wizard's Performance step. Per-preset `vram_headroom_mb` is supported as an advanced override but absent from defaults.

The default `chat.brain` mode for Floor/Mid is decided post-bench. The wizard surfaces all five as switchable "AI collaboration modes" (Single, Specialist, Discuss, Refine, Brainstorm) once any one is loaded — Cortex Councils integration per `project_cortex_surfaces`.

JessePrimary keeps Phi-4-rv (vision capability matters); High/Ultra preserve existing Qwen3-30B-A3B / Phi-4-rv (omni capability matters).

### 5.6 DevPulse-LLM evolution seams (unchanged from the prior Nemotron framing)

Three seams must exist at v0 regardless of which seed wins the bench:

1. **Interaction-capture event** — every `chat.brain` turn emits `{turn_id, input_token_hash, output, user_signal, preset_tier, model_repo_id, council_strategy?, council_voter_index?}`. Council variant captures BOTH the synthesized output AND the 4 individual votes — that data is gold for future router/MoE training. Sink: `cortex.training_log` SurrealDB table, default OFF.
2. **Opt-in flag** — `[platform.training_capture] enabled = false` in `platform.toml`. Surface (Q5): first-run wizard consent.
3. **Model-provenance tag** — every assistant message metadata column carries `{model_repo_id, model_filename, quant, preset_tier, council_strategy?}`.

**Fine-tune path realism diverges by candidate:**
- Nemotron path: FP16 base → LoRA via Unsloth (Python cloud-side, NOT on user box) → merge → re-quantize → republish.
- Council path: richer research surface — captured vote/route data trains a tiny router (≤100M params, Burn-authored, fits CLAUDE.md hard rule #1). The RouterMoE strategy's captured route decisions are direct supervised labels for that router. ParallelVote's captured user-signal-per-voter (which voter's answer the user accepted) trains a learned weighter. SequentialRefine's captured critique pairs train a refinement classifier. **Every council strategy generates a different flavor of training data — the bundle is structurally a training-corpus multiplier.** CPU-friendly training, on-box-feasible, uniquely DevPulse.

### 5.7 Spec deltas — Layer 4

**`kernel/model-loader/src/hardware/presets.rs`:**
- Promote council preset fields to a typed `CouncilConfig` struct: `{ strategy: CouncilStrategy, instances: u8, temperatures: Vec<f32>, synthesizer_temperature: Option<f32>, router_temperature: Option<f32>, specialists: Option<Vec<SpecialistRole>>, chain_temperatures: Option<Vec<f32>>, chain_roles: Option<Vec<ChainRole>>, return_all: bool }`.
- `CouncilStrategy` enum: `RouterMoE` / `ParallelVote` / `SequentialRefine` / `DiverseTemperature`.

**`kernel/model-loader/src/backends/llamacpp/backend.rs`:**
- When `params.gpu_reserved`: add `with_split_mode(LlamaSplitMode::None)` + `with_main_gpu(picked_ordinal)` calls.
- Add `pick_main_gpu_ordinal(probe: &GpuProbeReport) -> Option<usize>`.

**`kernel/model-loader/src/backends/llamacpp/council.rs`** (NEW):
- `LlamaCouncilContext { model: Arc<LlamaModel>, contexts: Vec<LlamaContext>, config: CouncilConfig }` — wraps the shared-weight, multi-context council. Implements `ChatBackend`.
- Strategy dispatchers: `route_moe()`, `parallel_vote()`, `sequential_refine()`, `diverse_temperature()`.
- Each emits per-instance + synthesizer/router tracing events for training capture.

**`kernel/model-loader/src/slots/registry.rs`:**
- `gpu_reservation: Option<GpuReservation>` field.
- Methods `reserve_for(slot_id, ordinal, mb)`, `release(slot_id)`, `headroom_for(ordinal) -> u64`.
- `resolve_headroom(total_vram_mb: u64, user_override: Option<u64>) -> u64` — returns `user_override` if set, else `min(2048, (total_vram_mb * 25) / 100)`. Single function so the wizard and the loader use the same math.

**`kernel/model-loader/src/hardware/lanes.rs`:**
- `LaneBudget(Vram)` subtracts reservations from `free_bytes`. New `LaneAllocation::Reservation` variant.

**`kernel/model-loader/src/slots/omni_detection.rs`** (NEW per Sprint 03 plan; verify exists before authoring):
- Pattern-match `nemotron_h` / `qwen3` / `qwen3-vl` / `phi4mm` / `gemma-3-omni` → respective capability sets.

**`kernel/model-loader/config/presets.default.toml`:**
- Floor + Mid `chat.brain` get the **five alternates** (Nemotron single + 4 council strategies) per §5.5.
- JessePrimary / High / Ultra unchanged.

**`xtask/src/commands/bench_seed.rs`** (NEW):
- Loads prompt set from `xtask/data/bench-seed-prompts.toml`.
- Auto-enumerates the 38-config matrix (§5.3.3).
- Iterates configs × prompts. Reloads weight only when quant changes (council strategies at the same quant reuse the loaded weight).
- Captures metrics, writes JSONL to `target/bench-seed/<timestamp>.jsonl`.
- Prints per-category winner summary table at completion.
- Supports `--category <name>` and `--quant <list>` for partial runs.
- Emits structured `bench.seed.*` tracing events throughout.

**`xtask/data/bench-seed-prompts.toml`** (NEW): 50-prompt categorized set per §5.3.1.

**First-run wizard — "Performance" step (NEW):**
- Component lives in `interfaces/desktop/src/lib/domains/onboarding/feature/performance-step/`.
- Surfaces probe output as: detected GPU + VRAM + recommended headroom (driven by `resolve_headroom` default).
- Slider: "Reserve more memory for the brain (faster) vs more for tools (multitasking)." Range maps to headroom `0.15 × total` → `0.40 × total`. Default `0.25`. Value persists to `[platform.gpu_reservation] headroom_mb_override = <user_value>` in `platform.toml`.
- Companion explainer renders ranges in plain English with current numbers ("On your 16 GB GPU, this leaves 4 GB free for transcription, vision, and tools running alongside the brain.")

**First-run wizard — "AI Collaboration" step (NEW):**
- Surfaces the five `chat.brain` modes (Single + 4 council strategies) with one-line plain-English descriptions.
- User picks the starting default; can switch any time later from chat surface.
- Locked memory `project_cortex_surfaces` Councils integration point.

**First-run wizard — "Help DevPulse Learn" step (NEW, Q5):**
- Surfaces the training-capture opt-in.
- Default OFF, one toggle, explainer: "Allow DevPulse to learn from your interactions, locally, to build a better assistant over time. Off by default. You can change this any time in Settings → Privacy."

**First-run wizard — "Model License" step (NEW, Q6):**
- NVIDIA Open Model License acceptance (single global accept). Stored in user atomic config alongside keyring entries.

**`systems/devpulse-engine/ip/kernel_terms.toml`:**
- Add layman terms: `gpu_reserved` → "Reserved GPU", `vram_headroom_mb` → "Free GPU headroom", `council_strategy` → "Collaboration mode", `RouterMoE` → "Specialist", `ParallelVote` → "Discuss", `SequentialRefine` → "Refine", `DiverseTemperature` → "Brainstorm".

**SurrealDB schema:**
- `cortex.training_log` namespace table with per-strategy columns:
  - `council_strategy` (text, nullable for single-model turns)
  - `router_choice` (int, RouterMoE only — which specialist was picked)
  - `voter_outputs` (array, ParallelVote / DiverseTemperature — captures all N raw outputs)
  - `voter_temperatures` (array — temperatures used)
  - `chain_intermediates` (array, SequentialRefine — captures draft / critique / rewrite / polish intermediates)
  - `user_signal` (enum: thumb_up / thumb_down / regen / edit / accept)
  - `selected_voter_index` (int, nullable — when user picks from DiverseTemperature)
- `message_provenance` extension column on chat message tables.

---

## 6. Implementation order

Slices end-to-end-verifiable. No slice is "done" until the runtime chain runs in the app per `feedback_compile_green_not_enough`.

| # | Slice | Verification |
|---|---|---|
| **S1** | Layer 1 build foundation — Ninja generator + cc::windows_registry MSVC + tracing taxonomy + deps.toml flip + idempotence guard. | `cargo xtask run-dev --features gpu-vulkan` succeeds end-to-end on a fresh `target/` clone. Build log shows structured `build.foundation.*` events. |
| **S2** | Layer 2 runtime probe — `ash` enum + DXGI fallback + NVML enrichment + `GpuProbeReport` shape + tauri command + devtool route. | `/devtools/system/hardware/gpu` renders live device list with vendor + VRAM + capability. NVIDIA + AMD test boxes both show correct vendor. |
| **S3** | Layer 3 reservation — `gpu_reservation` field + `pick_main_gpu_ordinal` + llama.cpp `with_main_gpu` wiring + lane budgeter subtraction + reservation tracing. | Loading `chat.brain` reserves the GPU; loading TTS afterwards observes reduced headroom and routes correctly. Devtool shows reservation state live. |
| **S4a** | Council plumbing — `CouncilStrategy` enum + `CouncilConfig` + `LlamaCouncilContext` with all four strategy dispatchers (`route_moe` / `parallel_vote` / `sequential_refine` / `diverse_temperature`) + typed preset fields + `omni_detection.rs`. | A single `cargo xtask run-dev` boot loads any of the five `chat.brain` alternates by name; `/devtools/clyffy/memory/persona-graph` (or council surface) shows which mode is active. |
| **S4b** | Seam wiring — provenance tags + per-strategy training-capture columns + `cortex.training_log` table + opt-in gate. | Every chat turn writes a provenance row; council turns capture all per-instance outputs/temps/routes; `enabled=false` writes nothing. |
| **S4c** | First-run wizard steps — Performance (configurable headroom slider) + AI Collaboration (5-mode picker) + Help DevPulse Learn (training-capture opt-in) + Model License (NVIDIA OML accept). All four steps wired to the existing wizard pattern per Sprint 04-A. | Fresh-install user lands the wizard, walks the four steps, lands in chat with their chosen mode + headroom + opt-in state honored. |
| **S4d** | Bench harness — `cargo xtask bench-seed` + 50-prompt set + JSONL output + per-category winner table. | One command runs the 38-config matrix (10 Nemotron quants + 28 council quant × strategy combos); emits comparable report. |
| **S4e** | Default seed selection — analyze S4d output, set Floor/Mid `chat.brain` default in `presets.default.toml`. All five alternates remain available; the bench output determines which is `default = true`. | Fresh box auto-loads winning seed; user can switch any time via the AI Collaboration mode picker. |

S1 unblocks everything. S2 unblocks S3. S3 unblocks S4a. S4a is the gate to S4b/S4c/S4d which can then proceed in parallel. S4e closes the loop.

---

## 7. Sources (verified May 2026)

**Build:**
- [cmake-rs Issue #241 — `--parallel $NUM_JOBS`](https://github.com/rust-lang/cmake-rs/issues/241)
- [llama-cpp-2 Cargo.toml (rocm feature exists in 0.1.146)](https://github.com/utilityai/llama-cpp-rs/blob/main/llama-cpp-2/Cargo.toml)
- [llama-cpp-sys-2 build.rs (`available_parallelism()`)](https://docs.rs/crate/llama-cpp-sys-2/latest/source/build.rs)
- [ggml-org/llama.cpp #13753 — vulkan-shaders race](https://github.com/ggml-org/llama.cpp/issues/13753)
- [PR #9239 — Improve Vulkan shader build system](https://github.com/ggml-org/llama.cpp/pull/9239)
- [cc::windows_registry::find_tool docs](https://docs.rs/cc/latest/cc/windows_registry/fn.find_tool.html)
- [CMAKE_GENERATOR docs](https://cmake.org/cmake/help/latest/variable/CMAKE_GENERATOR.html)

**Probe:**
- [ash-rs/ash](https://github.com/ash-rs/ash)
- [VK_EXT_memory_budget](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_EXT_memory_budget.html)
- [VK_KHR_driver_properties](https://registry.khronos.org/vulkan/specs/latest/man/html/VK_KHR_driver_properties.html)
- [nvml-wrapper](https://docs.rs/nvml-wrapper/latest/nvml_wrapper/)
- [IDXGIFactory7 / DXGI_ADAPTER_DESC3](https://microsoft.github.io/windows-docs-rs/doc/windows/Win32/Graphics/Dxgi/struct.IDXGIFactory7.html)
- [DXGI memory query via Vulkan — asawicki](https://www.asawicki.info/news_1695_there_is_a_way_to_query_gpu_memory_usage_in_vulkan_-_use_dxgi.html)

**Inference / Nemotron:**
- [bartowski/nvidia_NVIDIA-Nemotron-Nano-9B-v2-GGUF](https://huggingface.co/bartowski/nvidia_NVIDIA-Nemotron-Nano-9B-v2-GGUF)
- [nvidia/NVIDIA-Nemotron-Nano-9B-v2](https://huggingface.co/nvidia/NVIDIA-Nemotron-Nano-9B-v2)
- [Nemotron Nano 2 paper — arxiv 2508.14444](https://arxiv.org/abs/2508.14444)
- [llama.cpp #15409 — Nemotron v2 support](https://github.com/ggml-org/llama.cpp/issues/15409)
- [llama.cpp docs/multi-gpu.md](https://github.com/ggml-org/llama.cpp/blob/master/docs/multi-gpu.md)
- [mistral.rs DEVICE_MAPPING.md](https://github.com/EricLBuehler/mistral.rs/blob/master/docs/DEVICE_MAPPING.md)
- [LlamaModelParams (`with_main_gpu`/`with_split_mode`)](https://github.com/utilityai/llama-cpp-rs/blob/main/llama-cpp-2/src/model/params.rs)

---

## 8. Open items needing post-Q-resolution verification

- Q8 — does `omni_detection.rs` exist under a different name? Sprint 03 plan says it's pending. Verify before authoring.
- **Burn 0.22 / wgpu-hal 30** — neither exists as of 2026-05-12. Revisit `gpu-vulkan + burn-wgpu` re-enable when one ships.
- **mistral.rs single-ordinal pin** — track upstream; open an issue if multi-GPU pain surfaces.
- **DXGI live-VRAM cost** — `IDXGIAdapter4::QueryVideoMemoryInfo` needs a D3D12 device. Vulkan `VK_EXT_memory_budget` likely covers every shipping card, so DXGI live may be unused — verify by prototype before authoring the DXGI live path.
- **NVIDIA Open Model License acceptance state location** — likely the same atomic config used for keyring-tracked secret state (`project_secrets_keyring_ssot`). Confirm during S4.
