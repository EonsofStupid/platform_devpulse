# HOT_UPDATE_PATTERN — In-Process Hot-Update Foundation

- **Status:** OFFICIAL — v1.0.0
- **Last Updated:** 2026-05-05
- **Owner:** @jesse
- **Location:** scripts/docs/specs/cortex/rro/HOT_UPDATE_PATTERN.md
- **Part of:** RRO (siblings: [RRO.md](./RRO.md), [RRD.md](./RRD.md))
- **Governs:** the implementation pattern below RRD §4.1 (Encoder hot-swap) and the same shape applied to every other in-process swappable component (backends, decision engine, qdrant fork upgrades)
- **Governed by:** RRO.md, PHILOSOPHY.md

---

## 1. What This Doc Is

This is the **implementation pattern** that sits below RRD's `pause_for_update / swap_encoder / resume` API surface ([RRO.md §7](./RRO.md), [RRD.md §3](./RRD.md)). The RRD spec says *what* the daemon does. This doc says *how* the Rust primitives compose to do it correctly, and what the **minimum trait contract** is for any future component that wants the same lifecycle.

Scope:

- **In-process only.** This is *not* the sidecar pattern (`memory:project_sidecar_hot_update`). Sidecars use Job Object suspend / SIGSTOP at the OS level. This doc covers components that live next to the query path with zero IPC: encoder, decision engine, backend trait objects, future qdrant-fork version swaps.
- **Component-agnostic.** The encoder is the proving ground (Phase A landed; Harrier 0.6B safetensors loader = Phase B). The same shape applies to anything held behind `ArcSwap<Arc<dyn Trait>>` in the RRD.
- **Pattern + trait contract + gotchas.** Code lands in Phase A″ once this doc is approved. No code in this doc.

## 2. Why Not "Just Sidecar Everything"

The sidecar hot-update pattern (`memory:project_sidecar_hot_update`) is the right tool for **long-running independent processes** (Ollama, Surreal, candle-vllm, DevForge). It pays for itself because the binaries are independently versioned and the IPC boundary is already there.

The **encoder cannot be a sidecar.** Per [RRO.md L12](./RRO.md), RRO is in-process, embedded only, no HTTP boundary inside the cluster. The justification is not stylistic — it is the rkyv zero-copy MCP path: `ReasoningObject::dense_vector` is rkyv-archived and consumed by the LLM via direct memory mapping ([RRO.md §5.4](./RRO.md)). An IPC hop would force a deserialize/reserialize round trip and burn the entire latency budget for `General` mode (<50ms per [RRO.md §6](./RRO.md)).

So the encoder lives in-process. So do the backends, the HMM, the decision engine. So we need an **in-process** equivalent of "freeze the child, swap the binary, resume" — atomic pointer swap, drain, lifecycle state, all inside one process.

## 3. Foundation Citations (verbatim)

These two passages are the contract this doc implements. Quoting verbatim so any drift between this doc and the spec is auditable.

### 3.1 RRD Lifecycle States — [RRD.md §2](./RRD.md)

```rust
pub enum RRDState {
    /// Cold start: reading config, loading encoder weights
    Loading,
    /// Fully operational: queries accepted
    Running,
    /// Maintenance window: new queries queue or get RRDUnavailable
    Paused,
    /// Atomic encoder swap in progress (ArcSwap)
    Updating,
    /// Unrecoverable error: required for diagnostics
    Failed(FailureReason),
}
```

### 3.2 Pause/Resume Sequence — [RRD.md §3](./RRD.md)

> 1. **Trigger** — `rro.pause_for_update()` called
> 2. **Set state to Paused** — new queries get `RRDUnavailable` error or queue based on config
> 3. **Drain in-flight requests** — typically completes in <500ms
> 4. **Set state to Updating** — signals encoder swap is happening
> 5. **Load new encoder weights** — from disk, ~2–5 seconds for 0.6B safetensors
> 6. **Validate new encoder** — test embedding produced and dimension matches
> 7. **ArcSwap atomic pointer swap** — old `Arc<Encoder>` drops when last reference goes
> 8. **Set state to Running** — queued queries resume immediately

### 3.3 RRD Public API — [RRO.md §7](./RRO.md)

```rust
// RRD lifecycle (hot reload, encoder swap)
pub async fn pause_for_update(&self) -> Result<PauseHandle>;
pub async fn swap_encoder(&self, new_path: &Path) -> Result<()>;
pub async fn resume(&self, handle: PauseHandle) -> Result<()>;
```

The `PauseHandle` is **structural**: it encodes the protocol in the type system so the compiler rejects `resume()` without `pause_for_update()`, and rejects double-resume. Implementation in §7 below.

### 3.4 External Precedent — This Is Not Novel Territory

The hot-update pattern in Rust ML inference is **already production-shipped** by [mistral.rs](https://github.com/EricLBuehler/mistral.rs) under its multi-model feature. mistral.rs exposes:

- `POST /v1/models/unload` — drop a loaded model
- `POST /v1/models/reload` — load (or reload) by model_id
- `POST /v1/models/status` — `loaded | unloaded | reloading` state machine

Per [mistral.rs multi-model docs](https://ericlbuehler.github.io/mistral.rs/multi_model/overview.html): *"When a request is sent to an unloaded model, it will automatically reload before processing the request."* Each model runs in its own engine thread.

**Counter-example** — [HuggingFace text-embeddings-inference](https://github.com/huggingface/text-embeddings-inference) does **not** hot-swap. Model is fixed at startup via `--model-id`; changing models requires server restart.

**What we crib from mistral.rs**: confirmation that runtime hot-swap is a real, shipped pattern in Rust ML — not bleeding-edge speculation. The state-machine shape (`loaded / unloaded / reloading`) is independently arrived-at by another production crate; that's design-validation.

**What we don't crib**: mistral.rs does not document its concurrency primitive (RwLock vs ArcSwap vs Mutex). The `ArcSwap + TaskTracker + watch::channel` choice in §4 below is **ours**, justified by §4 design rationale and §7 gotchas — not borrowed from a peer. We accept the responsibility of validating it ourselves (§12 verification targets).

## 4. The Three Primitives

The pattern composes three well-understood Rust primitives. All three are battle-tested in production at significant scale (arc-swap: 143M+ downloads; tokio-util ships in every async Rust application).

| Primitive                              | Crate        | Role                                                                                          |
| -------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `ArcSwap<T>`                           | `arc-swap`   | Atomic pointer swap of the live state. Lock-free reads, lock-free writes, wait-free reads.    |
| `TaskTracker` + `CancellationToken`    | `tokio-util` | Track in-flight work; broadcast pause signal; await drain completion.                         |
| `tokio::sync::watch::Sender<RRDState>` | `tokio`      | Single-source-of-truth state machine; UI and tests subscribe via `borrow_and_update`.         |

### 4.1 ArcSwap — Atomic Pointer Swap

The live encoder is held as `ArcSwap<Encoder>`. Readers (query path) call `.load()` which returns a `Guard<Arc<Encoder>>`; writers (RRD update task) call `.swap(new_arc)` which returns the old `Arc` for explicit Drop.

**Reader pattern** ([arc-swap patterns docs](https://docs.rs/arc-swap/latest/arc_swap/docs/patterns/index.html)):

```rust
let snapshot = encoder.load();          // cheap, borrows a slot
snapshot.embed(&tokens)                 // synchronous Burn forward pass
// snapshot drops at end of scope; slot returned
```

**Writer pattern** (RRD update task only):

```rust
let old = encoder.swap(Arc::new(new_encoder));
// old is now owned by us; drop it here, off the hot path
drop(old);
```

**Why not `RwLock<Arc<Encoder>>`?** Per [arc-swap performance docs](https://docs.rs/arc-swap/latest/arc_swap/docs/performance/index.html): under contended reads, ArcSwap stays wait-free; RwLock readers contend on the same atomic. The encoder is read on every query (often concurrently). RwLock is the wrong shape.

### 4.2 TaskTracker + CancellationToken — Drain

Drain is the single hardest part of this pattern. From the [Tokio shutdown topic](https://tokio.rs/tokio/topics/shutdown):

```rust
let tracker = TaskTracker::new();
let cancel = CancellationToken::new();

// Each query path:
let guard = tracker.spawn(async move {
    let _permit = ...;            // optional concurrency cap
    tokio::select! {
        _ = cancel.cancelled() => return Err(RRDError::Paused),
        result = embed_query() => result,
    }
});

// RRD pause:
cancel.cancel();                  // signal
tracker.close();                  // no new spawns
tracker.wait().await;             // wait for in-flight to complete
```

**Why not just `JoinSet::join_next`?** `JoinSet` works but does not let new spawns join an existing set after iteration starts. `TaskTracker` is the modern equivalent and lets us add work while the tracker is open. (Background: `hyper-util::server::graceful::GracefulShutdown` uses the same shape — see [hyper graceful-shutdown guide](https://hyper.rs/guides/1/server/graceful-shutdown/).)

**Drain timeout** (per [RRD.md §3 failure modes](./RRD.md), 30s force-cancel):

```rust
tokio::select! {
    _ = tracker.wait() => Ok(()),
    _ = tokio::time::sleep(Duration::from_secs(30)) => {
        // force-cancel; log; proceed with swap anyway
        Err(RRDError::DrainTimeout)
    }
}
```

### 4.3 watch::channel — Lifecycle State

`tokio::sync::watch<RRDState>` is the canonical fit ([Tokio watch docs](https://docs.rs/tokio/1.49.0/tokio/sync/watch/fn.channel.html)): single producer (RRD), many consumers (query path checks state before accepting work; UI shows "Clyffy maintenance"; tests assert transitions).

```rust
let (state_tx, state_rx) = watch::channel(RRDState::Loading);

// RRD transitions state:
state_tx.send(RRDState::Paused).expect("rx alive");

// Query path gate:
if !matches!(*state_rx.borrow(), RRDState::Running) {
    return Err(RRDError::NotReady);
}
```

watch is preferred over `AtomicU8` because consumers can `await rx.changed()` for transition events without polling.

## 5. The Minimum Trait Contract

Two traits. Any in-process component that wants the lifecycle implements both. The RRD orchestrator drives them through identical sequences regardless of whether the swappee is the encoder, a backend, or a future component.

### 5.1 `HotUpdateable` — what the swappee must declare

```rust
/// A component whose live state can be replaced atomically while the
/// process is running. Implementor owns the type bounds; the orchestrator
/// owns the swap protocol.
pub trait HotUpdateable: Send + Sync + 'static {
    /// The serialized form on disk (e.g. safetensors path + tokenizer dir).
    type Source: Send + Sync;

    /// Loaded-but-not-yet-live form. Live state is `Arc<Self>`.
    type Snapshot: Send + Sync + 'static;

    /// Errors returned by `load`/`validate`. Must be loggable + Send across
    /// the maintenance task boundary.
    type LoadError: std::error::Error + Send + Sync + 'static;

    /// Load from disk. Must NOT mutate any live state. May be slow
    /// (5+ seconds is fine — happens during `Updating`, not `Paused`).
    async fn load(source: &Self::Source) -> Result<Self::Snapshot, Self::LoadError>;

    /// Validate the snapshot can produce sensible output BEFORE swap.
    /// For encoder: dimension match + one synthetic forward pass yields
    /// finite vector. For backends: health probe + schema match.
    async fn validate(snap: &Self::Snapshot) -> Result<(), Self::LoadError>;

    /// Promote a validated snapshot to live form. Cheap — no I/O.
    /// Typically `Arc::new(snap.into_live())`.
    fn into_live(snap: Self::Snapshot) -> Arc<Self>;
}
```

**Why these bounds:**

- `Send + Sync + 'static` — required for `ArcSwap<Self>` to cross task boundaries.
- `load` is `async` — disk I/O for safetensors is multi-second; the maintenance task can `.await` while the live encoder still serves traffic (state is `Updating`, not `Paused`, during this phase).
- `validate` is separate from `load` — a corrupted safetensors file failing `load` keeps the old encoder; a structurally-loadable-but-semantically-wrong snapshot failing `validate` does the same.
- `into_live` is sync and cheap — happens *during* the maintenance window where every millisecond is user-visible.

### 5.2 `HotSwap<C>` — what the orchestrator implements

```rust
/// The orchestrator-side trait. Implemented by the RRD itself, parameterized
/// over each `HotUpdateable` it manages. Concrete impl in kernel/rrd.
#[async_trait]
pub trait HotSwap<C: HotUpdateable>: Send + Sync {
    /// Begin the maintenance window. Returns a handle that proves
    /// pause-then-resume ordering at the type level.
    async fn pause(&self) -> Result<PauseHandle, RRDError>;

    /// Replace the live `Arc<C>` with the validated snapshot. Caller
    /// supplies the handle from `pause`. Old `Arc<C>` is dropped on
    /// the maintenance task, NOT on a query thread.
    async fn swap(&self, handle: &PauseHandle, new: C::Snapshot) -> Result<(), RRDError>;

    /// End the maintenance window. Consumes the handle so resume cannot
    /// happen twice. Drops the old Arc if `swap` wasn't called.
    async fn resume(&self, handle: PauseHandle) -> Result<(), RRDError>;
}

/// Opaque proof-of-pause. Cannot be constructed outside `pause()`. Move-only
/// (no Clone) so resume can only happen once. Drop in panic/abort path
/// auto-resumes via the orchestrator's drop guard.
pub struct PauseHandle { /* private */ }
```

**Type-state encoding**: `pause` returns `PauseHandle`; `swap` borrows it; `resume` consumes it. The compiler rejects:

- `resume()` without `pause()` — no way to construct the handle.
- Double `resume()` — handle is moved into the first call.
- `swap()` without `pause()` — no handle to borrow.

This is the spec §4.1 state machine encoded in types instead of asserted at runtime.

## 6. The Drain → Swap → Resume Sequence (annotated)

The RRD's concrete sequence, mapping spec §3 (verbatim above) to the primitives in §4:

```rust
// 1. Trigger: pause_for_update() called
async fn pause_for_update(&self) -> Result<PauseHandle, RRDError> {
    // 2. Set state to Paused — query path now rejects new work
    self.state_tx.send(RRDState::Paused)?;

    // 3. Drain in-flight requests
    self.cancel_query_token.cancel();
    self.query_tracker.close();
    let drain = tokio::time::timeout(
        Duration::from_secs(30),
        self.query_tracker.wait(),
    );
    if drain.await.is_err() {
        // failure mode: drain timeout — log, proceed with swap anyway
        tracing::warn!(target: "rrd.lifecycle", "drain timeout, force-proceeding");
    }

    Ok(PauseHandle::new())
}

// 4–7. swap_encoder()
async fn swap_encoder(&self, handle: &PauseHandle, new_path: &Path) -> Result<(), RRDError> {
    // 4. Set state to Updating
    self.state_tx.send(RRDState::Updating)?;

    // 5. Load (slow — that's why state is Updating, not Paused)
    let snap = Encoder::load(&new_path.into()).await?;

    // 6. Validate
    Encoder::validate(&snap).await?;

    // 7. ArcSwap atomic pointer swap; old returned for explicit Drop
    let new_live = Encoder::into_live(snap);
    let old = self.encoder.swap(new_live);

    // CRITICAL: drop the old Arc HERE on the maintenance task,
    // not on whoever was holding the last reader Guard.
    drop(old);

    Ok(())
}

// 8. resume() — consumes handle, transitions back to Running
async fn resume(&self, _handle: PauseHandle) -> Result<(), RRDError> {
    // Reset cancellation token + tracker for next pause cycle
    self.cancel_query_token = CancellationToken::new();
    self.query_tracker = TaskTracker::new();

    self.state_tx.send(RRDState::Running)?;
    Ok(())
}
```

This sequence is the **canonical implementation**. Other components (backend version swaps, decision-engine reload) follow the same skeleton — only the type parameter `C: HotUpdateable` changes.

## 7. Gotchas (the part the user demanded researched)

These are the failure modes that don't appear in the spec sequence but **will** bite production. Each is grounded in vendor docs or the arc-swap author's own writeup.

### 7.1 Burn `nn::*` is structurally `!Sync` — author from raw `Tensor` fields

[Source: docs.rs/burn/0.20.1/burn/module/trait.Module.html](https://docs.rs/burn/0.20.1/burn/module/trait.Module.html) (verified against pinned version, not main-branch)

The `Module` trait signature in **Burn 0.20.1 specifically** is verbatim:

```rust
pub trait Module<B>:
    Clone
    + Send
    + Debug
where
    B: Backend,
```

`Sync` is not in the supertrait set. ArcSwap requires `T: Send + Sync + 'static` for `Arc<T>` to cross thread boundaries safely.

**The actual finding (Phase A″ research, 2026-05-05)** — verified at the assertion site by [kernel/devpulse-clyffy/src/cortex/persistence/burn/mod.rs](../../../../../kernel/devpulse-clyffy/src/cortex/persistence/burn/mod.rs):

- **`Tensor<NdArray, ?>: Sync` PASSES.** Bare Burn tensors are `Sync` because their primitive is `Arc<Bytes>` (per [burn-flex/ARCHITECTURE.md](https://github.com/tracel-ai/burn/blob/main/crates/burn-flex/ARCHITECTURE.md)).
- **`nn::Linear<NdArray>` / `nn::Embedding<NdArray>` / `nn::RmsNorm<NdArray>` all FAIL.** Every `burn::nn::*` module wraps weights in `Param<T>`, which contains `Option<RwLock<Option<Uninitialized<T>>>>` for lazy init. `Uninitialized<T>` holds **two** non-Sync fields: a `Box<dyn FnOnce(&Device, bool) -> T + Send>` (the lazy-init closure) AND a `std::cell::OnceCell<T>` (the materialized cache, `!Sync` by design — std `OnceCell` is single-threaded).

This is **upstream of any backend choice** — the issue is in `Param<T>` itself, not the backend's tensor primitive. Every Burn backend fails the assertion when nn::* is in the field set.

**Mitigation (locked, applied in Phase A″)**: author the encoder from **raw `Tensor<B, ?>` fields**, not `burn::nn::*`. Concretely, the encoder defines three Sync-clean primitives that replace `nn::Linear`, `nn::Embedding`, `nn::RmsNorm`:

```rust
#[derive(Module, Debug)]
pub struct Qwen3Linear<B: Backend>    { pub weight: Tensor<B, 2> }

#[derive(Module, Debug)]
pub struct Qwen3Embedding<B: Backend> { pub weight: Tensor<B, 2> }

#[derive(Module, Debug)]
pub struct Qwen3RmsNorm<B: Backend>   { pub weight: Tensor<B, 1>, pub eps: f64 }
```

Each implements its forward pass with raw `burn::tensor` ops (matmul, select, mean_dim, mul, recip, sqrt). `Tensor` impls `Module` so `#[derive(Module)]` still works on these structs — no manual Module impl required.

Loss vs `nn::*`: no auto-Record serialization helper. Phase B authors the safetensors loader by filling these fields directly under the Hugging Face names (`embed_tokens.weight`, `*.norm.weight`, etc.) — straightforward because the field shapes match the HF conventions.

**The compile-time assertion is the gate that catches future regressions.** Per H6:

```rust
use static_assertions::assert_impl_all;
assert_impl_all!(burn::tensor::Tensor<NdArray, 2>: Send, Sync);  // probe
assert_impl_all!(BurnEmbedder<NdArray>: Send, Sync);             // contract
#[cfg(feature = "burn-cuda")]
assert_impl_all!(BurnEmbedder<burn::backend::Cuda>: Send, Sync);
```

If a future contributor reaches for `burn::nn::Linear` because it's "easier," the build fails at the assertion site — not silently at the first concurrent reader.

**Phase A″ deliverable (LANDED)**: assertions live at [burn/mod.rs](../../../../../kernel/devpulse-clyffy/src/cortex/persistence/burn/mod.rs); the three Sync-clean primitives + raw-Tensor authoring live at [burn/qwen3.rs](../../../../../kernel/devpulse-clyffy/src/cortex/persistence/burn/qwen3.rs); the round-trip test (verification 3) passes against `BurnEmbedder<NdArray>`.

### 7.2 Slow Drop on the Replaced Arc Hits the Last Reader

[Source: arc-swap performance docs](https://docs.rs/arc-swap/latest/arc_swap/docs/performance/index.html); confirmed by [vorner.github.io/2019/04/06/tricks-in-arc-swap.html](https://vorner.github.io/2019/04/06/tricks-in-arc-swap.html)

A 0.6B-parameter Burn module's `Drop` impl deallocates GPU buffers, vocabulary embeddings, RoPE caches — non-trivial. With naive `store()`, the last `Arc` reference is dropped by *whichever reader thread held the last `Guard`*. That reader's query latency spikes by the full Drop cost.

**Mitigation** (encoded in §6 above): use `swap()` not `store()`. `swap()` returns the old `Arc`. The maintenance task owns the Drop and runs it off the hot path. Reader latency is unaffected.

### 7.3 Reader Holding a Guard Across `.await` Stalls Writers

[Source: vorner.github.io/2019/04/06/tricks-in-arc-swap.html](https://vorner.github.io/2019/04/06/tricks-in-arc-swap.html), section on writer wait conditions.

> "If a reader gets stuck in the critical section, all writers wait forever."

For us: a query that calls `.load()` and then `.await`s on disk I/O while still holding the `Guard` can stall the maintenance window indefinitely.

**Guard contract** (must be enforced by code review and a clippy lint where possible):

> A `Guard<Arc<Encoder>>` is held only across the **synchronous** Burn forward pass. Never across an `.await`. If query work needs to outlive the forward pass, call `load_full()` to get an owned `Arc` (slower per-call, but does not hold a borrow slot).

The reference encoder query path satisfies this naturally: tokenize → `.load()` → `forward_pooled()` (sync) → drop guard → return vector. No `.await` between load and drop.

### 7.4 Borrow Slot Exhaustion

[Source: arc-swap performance docs](https://docs.rs/arc-swap/latest/arc_swap/docs/performance/index.html)

Each thread has a finite count of `Guard` instances. Exceeding spills to a `load_full()`-equivalent path (slower). For a query path that fans out (e.g., RAG hybrid search hitting dense + sparse + rerank in parallel via `tokio::join!`), the same thread may try to hold multiple guards.

**Mitigation**: use [`arc_swap::cache::Cache`](https://docs.rs/arc-swap/1.9.1/arc_swap/cache/struct.Cache.html). Verified type signature in 1.9.1:

```rust
pub struct Cache<A, T> { /* private */ }
// where A: Deref<Target = ArcSwapAny<T, S>>, T: RefCnt
//
// pub fn new(arc_swap: A) -> Self
// pub fn load(&mut self) -> &T   // ← &mut self; per-task ownership required
```

Canonical instantiation for our case: each `tokio::spawn`'d query task owns its own `Cache<Arc<ArcSwap<Encoder>>, Arc<Encoder>>`, constructed at task start, dropped at task end. **`load()` takes `&mut self`** — Cache cannot be shared across tasks. Sharing requires one Cache per task wrapping the same `Arc<ArcSwap<Encoder>>`.

Per [arc-swap perf docs](https://docs.rs/arc-swap/latest/arc_swap/docs/performance/index.html): Cache yields 10–25× speedup under read-heavy workloads vs raw `load()`. For our hot path (every query embeds), this is the right tier.

### 7.5 Validation Must Happen BEFORE the Swap

Spec §3 step 6 mandates this. The pattern enforces it via the `HotUpdateable::validate` boundary in §5.1: `swap()` takes `Self::Snapshot`, which can only be promoted to `Arc<Self>` via `into_live`, which is the post-validation step. A snapshot that fails `validate` is dropped without ever becoming live state.

The minimum encoder validation:

1. `snap.dimensions() == EXPECTED_HIDDEN_SIZE` (1024 for Harrier).
2. One synthetic embed (`vec![0i64; 8]` token ids, all-ones mask) produces a finite L2-normalized vector.
3. *Optional, recommended*: cosine similarity vs a frozen reference embedding for a known-text fixture > 0.95. Catches "loaded the wrong checkpoint" bugs.

If validation fails, RRDState transitions to `Failed(EncoderValidation)`. The daemon stays on the old encoder. UI surfaces the error via the standard log-tail tauri command.

### 7.6 Concurrent Pauses Must Be Rejected, Not Queued

`PauseHandle` is move-only (no Clone). The orchestrator holds an `AtomicBool::pause_in_progress`. A second `pause_for_update()` call returns `RRDError::AlreadyPaused`. Queuing pauses would lead to the second caller resuming a different swap than they intended.

## 8. Backend Generalization

The same trait contract (§5) applies to every entry of the backend map declared in [RRO.md §3](./RRO.md):

```rust
backends: HashMap<BackendType, Arc<ArcSwap<dyn RROBackend>>>
```

(One `ArcSwap` per backend slot — not one over the whole map. Lets one backend swap independently of the others.)

Each backend implementation declares `impl HotUpdateable for QdrantBackend { ... }`, `impl HotUpdateable for SurrealBackend { ... }`, etc. The orchestrator's `swap_backend(backend_type, source)` method dispatches to the right `HotSwap<C>` impl.

This is the doc's actual deliverable: **future swappable components implement two traits, the daemon handles drain+swap+resume identically.** When the qdrant fork ships v2 with new format, the swap is one config change + one binary upgrade — not a daemon rewrite.

## 9. SurrealDB Optional Toggle

Per [RRO.md §3 + L7](./RRO.md), SurrealDB is one of five backends. The toggle is a **config-level concern**, not a code-fork concern.

`rro.toml`:

```toml
[rro.backends.surreal]
enabled = true
storage_engine = "SurrealKV"  # NEVER rocksdb on Windows (L7)
```

When `enabled = false`:

- Backend map omits the SurrealDB entry on init.
- Decision engine routes graph queries to libSQL relations (libSQL is SSOT per L5 — graph reconstruction from relations is a degraded but functional path).
- UI surfaces "Graph backend offline — relational fallback active."

The hot-update pattern applies to the toggle itself. Re-enabling SurrealDB at runtime is a "swap from absent to present" operation — same `HotUpdateable + HotSwap` shape, with `Self::Source = SurrealConfig` and `Self::Snapshot = ConnectedClient`.

The decision engine subscribes to the backend-set via the same `watch::channel` shape used for state. When a backend appears/disappears, the engine's planner re-derives query strategy. No restart.

## 10. Layman Translation Surface

Every kernel-internal term introduced by this pattern (`ArcSwap`, `CancellationToken`, `TaskTracker`, `RRDState`, `PauseHandle`, drain, validate, swap, etc.) **must register in the SSOT vocabulary** before it can surface anywhere outside `kernel/`. The SSOT is [`systems/devpulse-engine/ip/kernel_terms.toml`](../../../../../systems/devpulse-engine/ip/kernel_terms.toml). The contract is enforced at compile time via the `ip_term!` macro and at CI time via the kernel-vocabulary scanner.

### 10.1 The Four-Form Schema

Per the existing `kernel_terms.toml` header, every term has four labels:

| Field    | Audience                            | Example              |
| -------- | ----------------------------------- | -------------------- |
| `kernel` | internal — banned outside `kernel/` | `RRD_STATE_PAUSED`   |
| `engine` | crosses the IPC boundary, dev/Tauri | `MaintenanceWindow`  |
| `prod`   | end-customer label                  | `Clyffy maintenance` |
| `dev`    | dev-mode UI label (raw tech)        | `RRD: Paused`        |

`severity = "hard"` makes the kernel form a CI build error if it appears in non-kernel files.

### 10.2 Required Entries Added by This Pattern

Authoring Phase A″ adds the following entries to `kernel_terms.toml` (category `rrd-lifecycle`). Every term used in the daemon, devtool, log message, error string, or progress UI **must** resolve through `ip_term!`:

| `kernel`                    | `engine`                                 | `prod`                                    | `dev`                           |
| --------------------------- | ---------------------------------------- | ----------------------------------------- | ------------------------------- |
| `RRD_STATE_LOADING`         | `Starting`                               | `Starting Clyffy`                         | `RRD: Loading`                  |
| `RRD_STATE_RUNNING`         | `Active`                                 | `Clyffy active`                           | `RRD: Running`                  |
| `RRD_STATE_PAUSED`          | `Maintenance`                            | `Clyffy maintenance`                      | `RRD: Paused`                   |
| `RRD_STATE_UPDATING`        | `Updating`                               | `Updating Clyffy memory`                  | `RRD: Updating`                 |
| `RRD_STATE_FAILED`          | `Error`                                  | `Clyffy unavailable — see diagnostics`    | `RRD: Failed`                   |
| `RRD_PHASE_PAUSE_REQUESTED` | `Pause requested`                        | `Beginning maintenance`                   | `phase: pause_requested`        |
| `RRD_PHASE_DRAIN_BEGIN`     | `Draining requests`                      | `Finishing in-flight work`                | `phase: drain_begin`            |
| `RRD_PHASE_DRAIN_COMPLETE`  | `Drain complete`                         | `In-flight work finished`                 | `phase: drain_complete`         |
| `RRD_PHASE_DRAIN_TIMEOUT`   | `Drain timeout`                          | `Force-finishing maintenance`             | `phase: drain_timeout`          |
| `RRD_PHASE_LOAD_BEGIN`      | `Loading new memory`                     | `Loading new model`                       | `phase: load_begin`             |
| `RRD_PHASE_LOAD_COMPLETE`   | `Memory loaded`                          | `Model loaded`                            | `phase: load_complete`          |
| `RRD_PHASE_VALIDATE_PASS`   | `Validation passed`                      | `New model verified`                      | `phase: validate_pass`          |
| `RRD_PHASE_VALIDATE_FAIL`   | `Validation failed — keeping previous`   | `New model rejected — keeping previous`   | `phase: validate_fail`          |
| `RRD_PHASE_SWAP_COMMIT`     | `Switched to new memory`                 | `New model now active`                    | `phase: swap_commit`            |
| `RRD_PHASE_RESUME_COMPLETE` | `Maintenance complete`                   | `Clyffy active again`                     | `phase: resume_complete`        |
| `RRD_PHASE_FAIL`            | `Failed`                                 | `Clyffy hit an error`                     | `phase: fail`                   |
| `ARCSWAP_ATOMIC_REPLACE`    | `Atomic replace`                         | — *(internal-only)*                       | `arc_swap::swap()`              |
| `TASKTRACKER_DRAIN`         | `Drain in-flight`                        | — *(internal-only)*                       | `TaskTracker::wait()`           |
| `CANCELLATION_TOKEN_PAUSE`  | `Pause signal`                           | — *(internal-only)*                       | `CancellationToken::cancel()`   |
| `WATCH_STATE_CHANNEL`       | `State broadcast`                        | — *(internal-only)*                       | `watch::Sender` (RRDState type) |
| `HOT_UPDATEABLE_TRAIT`      | `Hot-update component`                   | — *(internal-only)*                       | `HotUpdateable` trait           |
| `PAUSE_HANDLE`              | `Maintenance window token`               | — *(internal-only)*                       | `PauseHandle`                   |

Entries with `prod = —` have `context = ["logs", "traces"]` and never reach customer UI; they exist so dev-mode log surfaces still translate via the same registry.

### 10.3 Codegen Flow (Already Wired)

Per the existing `kernel_terms.toml` header, the flow is:

1. `cargo build` reads the TOML; emits `engine_vocabulary.rs` in the engine crate.
2. `pnpm generate:terminology` reads the same TOML; emits `interfaces/desktop/src/lib/sys/generated/terminology.ts`.
3. `ip_term!("RRD_STATE_PAUSED")` resolves at compile time:
   - kernel build → returns `"RRD_STATE_PAUSED"` (raw, internal).
   - engine build → returns `"Maintenance"` (engine label).
   - frontend → reads from generated TS by the same key.
4. CI scanner rejects raw string usage (`"Maintenance"` literal anywhere outside `kernel_terms.toml` itself).

**Adding a term during Phase A″** is a single TOML edit + one regen command. No code in the engine, daemon, devtool, or frontend hardcodes any layman label. This is the existing locked rule (`memory:feedback_ip_boundary_is_vocabulary_not_wrappers`).

## 11. Observability Contract (Dual Emission)

This pattern is **not observable** until both observability layers fire on every state transition and every public-API method. This is the locked rule from `memory:feedback_dual_observability` applied to RRD lifecycle.

### 11.1 The Two Layers

Per the existing service pattern (mirror these for RRD):

| Layer                       | Where                                                       | Crate                              | Consumers                                                                                       |
| --------------------------- | ----------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Tracing**                 | `target: "rrd.lifecycle"`                                   | `tracing` + `devpulse-telemetry`   | log-tail devtool surface, OTLP/JSONL export, scoped-log subscribers                             |
| **InternalEvent broadcast** | `InternalEvent::RrdPhaseTransition { phase, detail }`       | engine `tokio::broadcast` bus      | minion subscribers, governance reactors, surface-events whitelist, devtool Debug tab            |

A method that emits only on tracing is invisible to minions / surface-events. A method that emits only `InternalEvent` has no log-tail / OTEL trail. **Both required at every callsite.** Single-layer emission is incomplete work, not partial credit.

### 11.2 Architecture — kernel emits, engine translates

**Layer rule (LOCKED in Phase A″):** the `rrd` kernel crate emits **tracing-only** on `RRD_LIFECYCLE_TARGET`. The engine layer adds a tracing `Layer` translator that mirrors every event into `InternalEvent::RrdPhaseTransition`. This preserves H12 (dual emission) by **structural guarantee** instead of by callsite-coupling — see §11.4 for why this is stricter than the macro pattern.

The kernel's `rrd` crate cannot depend on `devpulse-engine` (kernel sits below engine in the workspace dependency direction). A dual-emission macro at the daemon callsite would force such a dependency. The translator approach inverts it: the daemon emits via plain `tracing::info!`, the engine layer subscribes and produces the typed event.

**`kernel/rrd/src/lifecycle.rs`** — kernel-owned tracing taxonomy:

```rust
pub const RRD_LIFECYCLE_TARGET: &str = "rrd.lifecycle";

pub mod lifecycle_phase {
    pub const PAUSE_REQUESTED:   &str = "pause_requested";
    pub const DRAIN_BEGIN:       &str = "drain_begin";
    pub const DRAIN_COMPLETE:    &str = "drain_complete";
    pub const DRAIN_TIMEOUT:     &str = "drain_timeout";
    pub const LOAD_BEGIN:        &str = "load_begin";
    pub const LOAD_COMPLETE:     &str = "load_complete";
    pub const VALIDATE_PASS:     &str = "validate_pass";
    pub const VALIDATE_FAIL:     &str = "validate_fail";
    pub const SWAP_COMMIT:       &str = "swap_commit";
    pub const RESUME_COMPLETE:   &str = "resume_complete";
    pub const FAIL:              &str = "fail";
}

#[macro_export]
macro_rules! emit_rrd_lifecycle {
    ($phase:expr $(, $($rest:tt)*)?) => {
        tracing::info!(
            target: $crate::RRD_LIFECYCLE_TARGET,
            phase = $phase
            $(, $($rest)*)?
        );
    };
}
```

**`systems/devpulse-engine/src/platform/services/rrd_translator.rs`** — the engine-side bridge that owns the dual emission contract:

```rust
pub struct RrdLifecycleTranslator {
    tx: Arc<broadcast::Sender<InternalEvent>>,
}

impl<S: Subscriber> Layer<S> for RrdLifecycleTranslator {
    fn on_event(&self, event: &tracing::Event<'_>, _ctx: Context<'_, S>) {
        if event.metadata().target() != rrd::RRD_LIFECYCLE_TARGET { return; }
        // Extract `phase` + `detail` from event fields, then:
        let _ = self.tx.send(InternalEvent::RrdPhaseTransition { phase, detail });
    }
}
```

The translator is added to the engine's tracing pipeline at boot via
`Registry::default().with(RrdLifecycleTranslator::new(broadcast_tx))...`.
From that point on, every `rrd.lifecycle` event — emitted via the `emit_rrd_lifecycle!` macro OR via a hand-rolled `tracing::info!` — produces exactly one `InternalEvent::RrdPhaseTransition`.

**`systems/devpulse-engine/src/platform/facade/events.rs`** — extend the enums to mirror the existing `SidecarPhaseTransition` shape (string phase + string detail) for consistency with the established dual-emission pattern:

```rust
pub enum EventCategory {
    // ...existing...
    /// RRD lifecycle phase transitions — pause, drain, load, validate,
    /// swap, resume, fail. Mirror of the `rrd.lifecycle` tracing
    /// taxonomy. Both layers emit in lockstep
    /// (`memory:feedback_dual_observability`).
    RrdLifecycle,
}

pub enum InternalEvent {
    // ...existing...
    /// Emitted in lockstep with the `emit_rrd_lifecycle!` macro.
    /// Shape mirrors `SidecarPhaseTransition` so subscribers can
    /// reuse the same `(phase, detail)` parsing across in-process
    /// and sidecar lifecycles.
    RrdPhaseTransition {
        /// One of the constants in
        /// [`crate::platform::services::rrd_lifecycle_phase`]
        /// (e.g. `"pause_requested"`, `"swap_commit"`, `"fail"`).
        phase: String,
        /// Human-readable summary — encoder path, validation error,
        /// elapsed drain time.
        detail: String,
    },
}
```

The `RRDState` enum lives separately (`kernel/rrd::RRDState` once that crate exists; for Phase A″ it lives behind the daemon implementation). The phase string is the cross-cut everyone agrees on; the state enum is internal to the daemon's state-machine code.

**New macros** — siblings to `emit_lifecycle!` and `emit_lifecycle_dual!`:

```rust
// Tracing-only emission:
emit_rrd_lifecycle!(
    rrd_lifecycle_phase::DRAIN_COMPLETE,
    in_flight = drained_count,
    elapsed_ms = elapsed.as_millis()
);

// Dual emission (tracing + InternalEvent broadcast) — H12 mandates this for every callsite:
emit_rrd_lifecycle_dual!(
    internal_tx,
    rrd_lifecycle_phase::SWAP_COMMIT,
    format!("swapped encoder from {old} to {new} in {ms} ms"),
    old_path = %old,
    new_path = %new,
    elapsed_ms = ms
);
```

The dual macro expands to a pair of statements — one `tracing::info!(target: RRD_LIFECYCLE_TARGET, ...)` and one `broadcast.send(InternalEvent::RrdPhaseTransition { phase, detail })`. They cannot drift because there is no callsite where one is emitted without the other.

### 11.3 Where Every Function Logs

Every method in the trait surface (§5) and every step in the sequence (§6) emits at entry and at exit. Minimum callsites:

| Function / step                        | Entry phase       | Exit phase         | Failure phase                                                  |
| -------------------------------------- | ----------------- | ------------------ | -------------------------------------------------------------- |
| `pause_for_update()`                   | `PAUSE_REQUESTED` | `DRAIN_COMPLETE`   | `DRAIN_TIMEOUT`                                                |
| `swap_encoder()` step 5 (load)         | `LOAD_BEGIN`      | `LOAD_COMPLETE`    | `FAIL` (with detail = load error)                              |
| `swap_encoder()` step 6 (validate)     | —                 | `VALIDATE_PASS`    | `VALIDATE_FAIL`                                                |
| `swap_encoder()` step 7 (atomic swap)  | —                 | `SWAP_COMMIT`      | — *(swap itself cannot fail per arc-swap guarantee)*           |
| `resume()`                             | —                 | `RESUME_COMPLETE`  | `FAIL`                                                         |
| Reader-side gate hit                   | —                 | —                  | `FAIL` (with detail = "rejected during pause")                 |

Reader-side `RRDError::NotReady` rejections also emit on the same target — they are signal, not noise. Devtool subscribers count these to surface "X requests rejected during last maintenance window."

### 11.4 1:1 Emit-Callsite Parity — Structural via Translator

Original H13 phrasing was "`grep emit_rrd_lifecycle!` callsites == `grep InternalEvent::RrdPhaseTransition` callsites." Phase A″ tightened this: the translator architecture makes drift **structurally impossible** instead of macro-enforced.

Restated invariant (Phase A″ form):

> All `InternalEvent::RrdPhaseTransition` emissions originate from `RrdLifecycleTranslator::on_event` in [`rrd_translator.rs`](../../../../../systems/devpulse-engine/src/platform/services/rrd_translator.rs). Every `tracing` event with `target = rrd.lifecycle` produces exactly one such emission. Adding a hand-rolled `broadcast.send(InternalEvent::RrdPhaseTransition { ... })` anywhere else in the engine breaks the invariant and is rejected by code review.

**Why this is stricter than the macro pattern:** with a `emit_rrd_lifecycle_dual!` macro, a contributor could write `tracing::info!(target: "rrd.lifecycle", ...)` directly and skip the InternalEvent half. With the translator, the InternalEvent emission is structural — the daemon doesn't need to remember to use a specific macro; ANY way of producing a tracing event on the target produces a translated InternalEvent.

CI check (in xtask): `rg "InternalEvent::RrdPhaseTransition\s*\{" --type rust | wc -l` should return exactly **1** (the translator's emission site). Any other count means someone added a hand-rolled emission and the H13 invariant is broken.

### 11.5 Reuse the Scoped-Log Devtool Surface

Per `memory:reference_scoped_logs`: the platform already ships `query_scoped_log(prefix, limit)` as a shared Tauri command. The RRD devtool's Logs tab calls it with `prefix = "rrd.lifecycle"`. No new tail mechanism required.

## 12. Verification Targets (Phase A″)

This doc is the contract; Phase A″ validates Phase A code (`kernel/devpulse-clyffy/src/cortex/persistence/burn/`) against it. The minimum check set:

1. **`assert_impl_all!(BurnEmbedder<NdArray>: Send, Sync)` compiles** — at [`burn/mod.rs`](../../../../../kernel/devpulse-clyffy/src/cortex/persistence/burn/mod.rs).
2. **`assert_impl_all!(BurnEmbedder<Cuda>: Send, Sync)` compiles** (gated `cfg(feature = "burn-cuda")`) — same file.
3. **ArcSwap round-trip test:** `store(a)`, `load()` returns same identity, `swap(b)` returns `a`, `load()` returns `b` — [`burn/mod.rs` tests](../../../../../kernel/devpulse-clyffy/src/cortex/persistence/burn/mod.rs).
4. **Drain test:** 10 mock query tasks each holding the cancellation token for 100ms; trigger pause; assert pause completes only after the last task resolves — [`kernel/rrd/tests/drain.rs`](../../../../../kernel/rrd/tests/drain.rs).
5. **State-machine transition test:** every legal `RRDState → RRDState` edge from [RRD.md §2](./RRD.md) succeeds; every illegal edge errors — [`kernel/rrd/src/state.rs`](../../../../../kernel/rrd/src/state.rs) inline.
6. **Validation rejection test:** a deliberately-corrupt snapshot fails `validate`; live encoder unchanged after the failed swap attempt — [`kernel/rrd/tests/validation.rs`](../../../../../kernel/rrd/tests/validation.rs).
7. **Every kernel term in §10.2 is present in `kernel_terms.toml`** with all four fields filled — CI scanner pass against [`kernel_terms.toml`](../../../../../systems/devpulse-engine/ip/kernel_terms.toml).
8. **No raw layman string literals in RRD code** — `ip_term!()` resolves every label (grep audit + scanner).
9. **Exactly 1 `InternalEvent::RrdPhaseTransition` callsite** exists in the engine (the translator). Any other = invariant violation — `rg` audit + xtask CI check.
10. **Translator emits exactly one `InternalEvent::RrdPhaseTransition`** for every `rrd.lifecycle` tracing event; ignores other targets — [`rrd_translator.rs`](../../../../../systems/devpulse-engine/src/platform/services/rrd_translator.rs) tests.
11. **Pause→swap→resume cycle emits the canonical phase sequence** (`ready, pause_requested, drain_begin, drain_complete, load_complete, validate_pass, swap_commit, resume_complete`) — [`kernel/rrd/tests/e2e.rs`](../../../../../kernel/rrd/tests/e2e.rs).

Compile-green ≠ product-works (`memory:feedback_compile_green_not_enough`). Verifications 4–6 + 11 run under `cargo test -p rrd`; verification 10 runs under `cargo test -p devpulse-engine --lib platform::services::rrd_translator`. All must produce green before Phase B can begin.

### 12.1 Phase A″ landing status (2026-05-05)

- **1.** Done — compile-pass on `cargo check -p devpulse-clyffy --features burn-cpu`.
- **2.** Done in source — asserted under `cfg(feature = "burn-cuda")`; runtime verification waits on a CUDA host.
- **3.** Done — `arcswap_round_trip_preserves_identity_through_swap` test passes.
- **4.** Done — two tests pass: drain-completes-after-tasks AND drain-timeout-force-proceed.
- **5.** Done — all legal edges + every illegal edge tested in [`kernel/rrd/src/state.rs`](../../../../../kernel/rrd/src/state.rs).
- **6.** Done — three tests pass: validation rejection, validation success, concurrent-pause rejection.
- **7.** Done — 22 entries added to `kernel_terms.toml` under `category = "rrd-lifecycle"`.
- **8.** Pending — daemon code uses raw string literals for phase constants (mirroring the kernel taxonomy). Layman-string CI scanner is a Phase-B+ deliverable.
- **9.** Done — single `InternalEvent::RrdPhaseTransition` callsite in `rrd_translator.rs::on_event`. xtask grep check is one-liner away.
- **10.** Done — two tests pass: translator mirrors event AND translator filters non-RRD targets.
- **11.** Done — `pause_swap_resume_emits_canonical_phase_sequence` test passes.

## 13. What This Doc Does NOT Replace

- **[RRO.md](./RRO.md)** — the cluster spec. This doc implements §4.1, §7's RRD methods, and the §3 backend-trait pluggability.
- **[RRD.md](./RRD.md)** — the daemon spec. This doc is the implementation pattern *below* RRD; the daemon's public API surface is RRD's.
- **[REASON_READY_OBJECT.md](./REASON_READY_OBJECT.md)** — the data-unit spec. Untouched by hot-update — RROs are immutable, encoder swaps don't invalidate stored vectors (cosine geometry preserved across compatible encoders by design).
- **`memory:project_sidecar_hot_update`** — the **process-level** hot-update pattern for sidecars (Job Object / SIGSTOP). Read both: sidecars use that one; in-process components use this one.

## 14. Locked Decisions

- **H1.** Atomic pointer swap = `arc_swap::ArcSwap<T>`. Not `RwLock<Arc<T>>`. Not `parking_lot::Mutex`.
- **H2.** Drain = `tokio_util::task::TaskTracker` + `tokio_util::sync::CancellationToken`.
- **H3.** Lifecycle state = `tokio::sync::watch::Sender<RRDState>`. Not `AtomicU8` + `Notify`.
- **H4.** `swap()` not `store()` — drop-old-Arc happens on the maintenance task, never the reader.
- **H5.** Guard contract: never hold `Guard<Arc<T>>` across `.await`. Use `load_full()` if work outlives the sync section.
- **H6.** Compile-time `assert_impl_all!` per backend for `Send + Sync + 'static`.
- **H7.** `PauseHandle` is move-only proof-of-pause; encodes the protocol in the type system.
- **H8.** `validate` is a separate trait method from `load`. Validation failure rolls back to old state, transitions to `Failed`.
- **H9.** Drain timeout = 30s force-proceed. Per [RRD.md §3 failure modes](./RRD.md).
- **H10.** Backend toggles (e.g. SurrealDB enable/disable) follow the same `HotUpdateable + HotSwap` shape as encoder swaps.
- **H11.** Every kernel-internal term in this pattern resolves through `ip_term!` against `kernel_terms.toml`. No raw layman strings in code.
- **H12.** Every state transition + public method emits BOTH a `tracing::event!(target: "rrd.lifecycle", ...)` AND an `InternalEvent::RrdPhaseTransition` variant — never one alone.
- **H13.** `emit_rrd_lifecycle!` macro count == `InternalEvent::RrdPhaseTransition` callsite count, audited by xtask CI.

## 15. Source Citations

External research that grounds this pattern. All `[official]` (vendor docs, crate maintainer writeups, or production source repos):

- [docs.rs/arc-swap/latest/arc_swap/docs/patterns/](https://docs.rs/arc-swap/latest/arc_swap/docs/patterns/index.html) — configuration reload pattern, Cache, Access trait projection.
- [docs.rs/arc-swap/latest/arc_swap/docs/performance/](https://docs.rs/arc-swap/latest/arc_swap/docs/performance/index.html) — reads wait-free; writers expensive; borrow slot limit; `load` vs `load_full` vs `Cache`.
- [docs.rs/arc-swap/1.9.1/arc_swap/cache/struct.Cache.html](https://docs.rs/arc-swap/1.9.1/arc_swap/cache/struct.Cache.html) — `Cache<A, T>` exact type signature in 1.9.1; `load(&mut self) -> &T` requires per-task ownership.
- [vorner.github.io/2019/04/06/tricks-in-arc-swap.html](https://vorner.github.io/2019/04/06/tricks-in-arc-swap.html) — reader-stuck-blocks-writer; design rationale (crate author).
- [tokio.rs/tokio/topics/shutdown](https://tokio.rs/tokio/topics/shutdown) — canonical `CancellationToken` + `TaskTracker` drain pattern.
- [docs.rs/tokio/1.49.0/tokio/sync/watch/](https://docs.rs/tokio/1.49.0/tokio/sync/watch/fn.channel.html) — `watch::channel` for state broadcast; `borrow_and_update`; consistency.
- [hyper.rs/guides/1/server/graceful-shutdown/](https://hyper.rs/guides/1/server/graceful-shutdown/) — `GracefulShutdown` watcher; in-flight tracking; timeout shape.
- [github.com/plabayo/tokio-graceful](https://github.com/plabayo/tokio-graceful) — strong/weak guards; `spawn_task_fn`; production graceful-shutdown crate.
- [docs.rs/burn/0.20.1/burn/module/trait.Module.html](https://docs.rs/burn/0.20.1/burn/module/trait.Module.html) — Burn 0.20.1 `Module` supertraits = `Clone + Send + Debug` (NOT `Sync`, NOT `'static`) — verified against the pinned version.
- [github.com/tracel-ai/burn/blob/main/crates/burn-flex/ARCHITECTURE.md](https://github.com/tracel-ai/burn/blob/main/crates/burn-flex/ARCHITECTURE.md) — `Arc<Bytes>` COW pattern; concrete backends are `Send + Sync` in practice.
- [github.com/EricLBuehler/mistral.rs](https://github.com/EricLBuehler/mistral.rs) — production Rust ML hot-swap precedent: `/v1/models/{unload,reload,status}`.
- [ericlbuehler.github.io/mistral.rs/multi_model/overview.html](https://ericlbuehler.github.io/mistral.rs/multi_model/overview.html) — mistral.rs lazy-reload semantics; per-model engine thread; design-validation for our state machine.
- [github.com/huggingface/text-embeddings-inference](https://github.com/huggingface/text-embeddings-inference) — counter-example: HF embedding server requires restart to swap models — no hot-swap.

Internal anchors:

- [RRO.md §3, §4.3, §7, L5, L7, L12](./RRO.md)
- [RRD.md §2, §3, failure modes](./RRD.md)
- [`systems/devpulse-engine/ip/kernel_terms.toml`](../../../../../systems/devpulse-engine/ip/kernel_terms.toml) — SSOT vocabulary, four-form schema
- [`systems/devpulse-engine/src/platform/services/mod.rs`](../../../../../systems/devpulse-engine/src/platform/services/mod.rs) — `SIDECAR_LIFECYCLE_TARGET`, `lifecycle_phase`, `emit_lifecycle!` (templates for RRD equivalents)
- [`systems/devpulse-engine/src/platform/facade/events.rs`](../../../../../systems/devpulse-engine/src/platform/facade/events.rs) — `InternalEvent`, `EventCategory`, `SidecarPhaseTransition` (template for `RrdPhaseTransition`)
- `memory:project_sidecar_hot_update` (sidecar process-level pattern — not this one)
- `memory:project_rro_burn_authorship` (encoder = Burn, locked)
- `memory:feedback_compile_green_not_enough` (Phase A″ verification rule)
- `memory:feedback_dual_observability` (tracing + InternalEvent both required — H12 / H13)
- `memory:feedback_ip_boundary_is_vocabulary_not_wrappers` (H11 enforcement)
- `memory:reference_scoped_logs` (`query_scoped_log` Tauri command, devtool surface)

---

*This document is the implementation pattern below [RRD.md](./RRD.md). It is the contract Phase A″ code is validated against. Phase B (Harrier safetensors loader) cannot begin until all §12 verification targets are green.*
