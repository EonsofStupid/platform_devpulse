# Llama.cpp FFI Integration — Implementation Plan

| Field | Value |
|-------|-------|
| Status | `READY_TO_CODE` |
| Owner | @jesse |
| Created | 2026-04-18 |
| Approach | Non-fork. Use upstream `llama-cpp-2 = "0.1.143"` directly. |

---

## Key discovery (the reason no fork is needed)

`llama-cpp-2` (MIT, utilityai/llama-cpp-rs) already ships:

- `feature = "cuda"` — CUDA backend via `llama-cpp-sys-2`
- `feature = "llguidance"` — exposes `llama_sampler_init_llg()` (the exact hook
  our plan required a fork to expose)
- `feature = "sampler"` — rusty sampler-chain builder
- `feature = "mtmd"` — multimodal (future vision path)

The forks `devpulse-llama-sys` / `devpulse-llama` in older memory were planned
before llama-cpp-2 shipped the llguidance feature. That reason is gone.
**Only fork if we hit a blocker mainline can't solve.**
</content>

---

## Existing hook points (verified in tree)

| File | Current state | Change needed |
|------|---------------|---------------|
| `kernel/model-loader/Cargo.toml:25-26` | `llama-cpp-ffi = []` (empty feature flag, reserved) | Wire `llama-cpp-2` dep behind the feature, chain `cuda` + `llguidance` |
| `kernel/model-loader/src/models/registry.rs:24-33` | `enum BackendType { Candle, LlamaCpp, Ort, Sherpa }` | No change — variant already exists |
| `kernel/model-loader/src/backends/router.rs:22-27` | Routes GGUF → Candle if arch supported, else `BackendType::LlamaCpp` | No change — routing already correct |
| `kernel/model-loader/src/backends/router.rs:39-53` | `candle_supports_architecture()` lists llama/mistral/qwen2/qwen3/phi2/phi3/gemma/gemma2/stablelm/starcoder | No change — unsupported archs (phi4, etc.) fall through correctly |
| `kernel/model-loader/src/backends/mod.rs` | 10 submodules (bridge, candle, orpheus, phoneme, piper, ort, pool, router, voice, voice_pool) | Add `pub mod llama;` |
| `kernel/model-loader/src/backends/bridge.rs:228` | `pub fn spawn_candle(device: candle_core::Device)` | Add sibling `pub fn spawn_llama(params: LlamaSpawnParams)` |
| `kernel/model-loader/src/backends/bridge.rs:282-283` | `fn inference_thread_loop(backend: &mut CandleBackend, ...)` — hardcoded to CandleBackend | Add sibling `fn inference_thread_loop_llama(backend: &mut LlamaBackend, ...)` — mirror request dispatch |
| `kernel/model-loader/src/backends/pool.rs:43-89` | `BackendPool::acquire()` hardcodes `InferenceBridge::spawn_candle(device)` at line 72 | Dispatch on `BackendType` → pick spawn method |
| `kernel/model-loader/src/traits/backend.rs` | `InferenceBackend` trait: `load/unload/forward/tokenize/detokenize/memory_usage/metadata` | No change — `LlamaBackend` implements this trait |
</content>

---

## Files to create

All under `D:/localdev/platform_devpulse/kernel/model-loader/src/backends/llama/`:

### 1. `mod.rs` (~15 lines)

Module root. Feature-gates every submodule behind `llama-cpp-ffi`. Exports
`LlamaBackend`.

### 2. `backend.rs` (~280 lines)

`pub struct LlamaBackend` implementing `crate::traits::backend::InferenceBackend`.
Holds:
- `LlamaBackend` (the upstream type from `llama_cpp_2::model`)
- `LlamaContext` (per-generation state)
- `device: DeviceSelection` (CPU | CUDA(index))
- `tokenizer_cache: Option<Tokenizer>` (use llama.cpp's own vocab)
- `metadata: ModelMetadata`
- `footprint: MemoryFootprint`

Methods implement the seven trait methods one-to-one with `llama_cpp_2` calls.
`forward()` uses `LlamaBatch::get_one` + `ctx.decode` + `ctx.get_logits`.

### 3. `params.rs` (~90 lines)

Maps our `LoadParams` → `llama_cpp_2::model::params::LlamaModelParams` and
`LlamaContextParams`. Handles:
- `n_gpu_layers` from LoadParams.gpu_layers (0 = CPU-only, -1 = full offload)
- `n_ctx` from LoadParams.context_length
- `n_batch` sane default (512)
- `use_mmap` always true (safe default)
- `use_mlock` from LoadParams.mlock_weights

### 4. `sampler.rs` (~120 lines)

Builds sampler chain using `LlamaSampler::chain_simple` + optional llguidance.
When `feature = "llguidance"` active AND slot config provides a grammar, insert
the llguidance sampler at the correct position in the chain (after top-k,
before dist).
</content>

---

## Files to modify

### `kernel/model-loader/Cargo.toml`

**Add to `[features]` section** (existing line 25 `llama-cpp-ffi = []` gets replaced):

```toml
# llama.cpp FFI runtime — GGUF path for architectures Candle doesn't support.
# Upstream llama-cpp-2 crate; no fork. CUDA is a separate feature so the
# CPU-only ignition test can prove plumbing before GPU involvement.
llama-cpp-ffi = ["dep:llama-cpp-2"]
llama-cuda = ["llama-cpp-ffi", "llama-cpp-2/cuda"]
llama-llguidance = ["llama-cpp-ffi", "llama-cpp-2/llguidance"]
```

**Update `cuda = [...]`** to chain llama-cuda when both features active:

```toml
cuda = ["candle-core/cuda"]
# Note: do NOT auto-enable llama-cuda from cuda — that forces CUDA toolkit at
# build time even for users only using Candle. Opt-in per-backend.
```

**Add to `[dependencies]`**:

```toml
# llama.cpp bindings — MIT, upstream utilityai/llama-cpp-rs
# NOT forked — mainline ships the llguidance sampler we need.
llama-cpp-2 = { version = "0.1", optional = true, default-features = false }
```

### `kernel/model-loader/src/backends/mod.rs`

Add after existing `pub mod candle;`:

```rust
#[cfg(feature = "llama-cpp-ffi")]
pub mod llama;
```

### `kernel/model-loader/src/backends/bridge.rs`

Two additions, NO changes to existing `spawn_candle` or `inference_thread_loop`:

1. New `pub fn spawn_llama(...)` method on `impl InferenceBridge`, mirroring
   `spawn_candle`'s thread-spawn + panic-catch pattern.
2. New `fn inference_thread_loop_llama(backend: &mut LlamaBackend, rx: ...)`
   duplicating the request dispatch match. Not generic-over-trait because the
   existing loop uses concrete `&mut CandleBackend` — refactoring to
   `&mut dyn InferenceBackend` is a separate, bigger change; duplicating is
   lower-risk for this chunk.

### `kernel/model-loader/src/backends/pool.rs`

Change `acquire()` to accept a `BackendType` hint (from the slot's `runtime`
field or from `select_backend()`), then dispatch:

```rust
let bridge = match backend_type {
    BackendType::Candle => InferenceBridge::spawn_candle(device)?,
    #[cfg(feature = "llama-cpp-ffi")]
    BackendType::LlamaCpp => InferenceBridge::spawn_llama(llama_params)?,
    other => anyhow::bail!("Pool doesn't handle backend {other:?} yet"),
};
```
</content>

---

## Build & test sequence

### Phase 1 — CPU ignition (PROVE PLUMBING)

1. `cargo check -p model-loader --features llama-cpp-ffi`
   → Proves `llama-cpp-2` builds, C code compiles, bindings link.
   No CUDA toolkit needed.
2. Write integration test `kernel/model-loader/tests/llama_ignition.rs`:
   ```rust
   #[test]
   fn load_small_gguf_and_emit_one_token() {
       // Uses any small GGUF from models/ dir
       // Creates LlamaBackend with CPU-only params
       // Loads, tokenizes "Hello", runs forward, asserts logits.len() == vocab_size
   }
   ```
3. `cargo test -p model-loader --features llama-cpp-ffi llama_ignition`
   → Proves FFI works end-to-end on CPU.

### Phase 2 — CUDA activation (light it up)

1. `cargo check -p model-loader --features "llama-cpp-ffi,llama-cuda"`
   → Proves CUDA toolkit found, CUDA kernels compile.
2. Re-run ignition test with `n_gpu_layers = 99` in load params.
   → Proves GPU offload path.

### Phase 3 — Wire into slots

1. Edit `config/slots.default.toml`: change one experimental slot's
   `runtime = "LlamaCpp"` (e.g. a Phi-4-family GGUF slot).
2. Boot devpulse-engine; verify slot loads via llama path, not Candle.

### Phase 4 — llguidance constrained decoding

1. `cargo check -p model-loader --features "llama-cpp-ffi,llama-llguidance"`
2. Test: ask LlamaBackend to generate JSON matching a schema.
3. Verify output conforms.

---

## Guardrails

- **Never touch the Candle path.** Every change is additive or feature-gated.
  `cargo build` with default features must keep working identically to today.
- **CUDA is opt-in.** Adding `llama-cpp-ffi` does NOT force CUDA toolkit
  presence at build time. `llama-cuda` is a separate feature.
- **No placeholders.** Each file lands as working code. If a method isn't
  implementable yet, it returns a typed `LoaderError::NotImplemented`, not
  `todo!()` or `unimplemented!()`.
- **Windows dev-first.** Jesse's rig builds are the reference. Any CMake /
  MSVC issue blocks the chunk.

---

## Resumption checklist (for new session)

When picking this back up:

1. Read this file end-to-end.
2. Verify llama-cpp-2 latest stable on crates.io (was 0.1.143 at plan time).
3. Check that `kernel/model-loader/Cargo.toml:25` still reads
   `llama-cpp-ffi = []` — if someone already wired deps, read what's there
   instead of overwriting.
4. Chunk 1 of writing = Cargo.toml edits only. Run `cargo check` before any
   Rust code gets written.
5. Chunks 2-5 = the four new files under `backends/llama/`, in order:
   params.rs → sampler.rs → backend.rs → mod.rs. Keep each file ≤30 lines
   per write call (Desktop Commander guidance).
6. Chunk 6 = bridge.rs additions (spawn_llama + thread loop).
7. Chunk 7 = pool.rs dispatch.
8. Run `cargo check --features llama-cpp-ffi` — MUST compile clean.
9. Write and run `llama_ignition` test. When it passes, Phase 1 done.

---

*End of plan. This document is authoritative. If session memory conflicts with
this file, this file wins (per Jesse's spec-doc discipline).*
</content>