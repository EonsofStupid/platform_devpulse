# SPRINT: Platform Service Manager — All Services Loading, No Exceptions

**Status**: PLANNED
**Priority**: P0 — BLOCKING. Nothing else matters if the platform can't boot all its services.
**Prerequisites**: None — this IS the prerequisite for everything else.
**Category**: Foundation

---

## Problem Statement

The platform has 10 services. 7 load. 1 is disabled (Kokoros). 2 don't exist yet (Candle ML runtime, STT). The project doesn't self-index. The xtask pipeline doesn't verify post-boot health. This sprint fixes all of it.

---

## Honest State Audit (Verified 2026-03-20)

### Services That Load
| Service | Feature | Compiled | Boots | Health Check | Critical |
|---------|---------|----------|-------|-------------|----------|
| System LibSQL | always | yes | yes | yes | yes |
| System DuckDB | always | yes | yes | yes | yes |
| System SurrealDB | always | yes | yes | yes | yes |
| System Moka | always | yes | yes | yes | yes |
| User LibSQL | always | yes | yes | yes | yes |
| User SurrealDB | always | yes | yes | yes | — |
| Global SurrealDB | always | yes | yes | yes | — |
| RRO (Qdrant) | `rro` | yes | yes | yes | yes |
| Outlines | `outlines` | yes | yes | yes | yes |

### Services That DON'T Load
| Service | Feature | Compiled | Why |
|---------|---------|----------|-----|
| Kokoros (TTS) | `kokoros` | **NO** | Feature not in Tauri Cargo.toml. `enabled = false` in config. espeak-rs-sys crashes VS 2026 dict generation. |
| Candle (Inference) | — | **NO** | Declared in workspace (`candle-core = "0.8"`). VALIDATED architecture decision (Candle + Qwen3 GGUF). No adapter or service wired yet. Needs: InferenceService with model manager, device allocation, four-layer rumination support. |
| STT | — | **NO** | Doesn't exist at all. Likely Whisper via Candle or ORT when ready. |

### Infrastructure Gaps
| Gap | Detail |
|-----|--------|
| Post-boot health verification in xtask | `cargo xtask run-dev` fires and forgets. No feedback from boot pipeline to xtask. |
| Project self-indexing | Seed data is hardcoded fake rows. Platform doesn't index the actual project it's running in. |
| Logging service | Tracing + file appender exist but logging isn't a `Service` — no health check, no lifecycle. |
| Service registry | Services are hardcoded fields on `Platform` struct. Adding a service means editing 5+ files. Not scalable. |

---

## Architecture Decisions

### AD-1: Fix Kokoros, don't defer it
The espeak-rs-sys blocker has a documented fix path: patch `piper-rs/crates/espeak-rs-sys/build.rs` to detect the system install at `C:\Program Files (x86)\eSpeak\` and link against it instead of building from source. The MSI is already at `deps/espeak-ng-setup.msi`. Do it.

### AD-2: Candle is the inference runtime (DECIDED)
Candle + Qwen3 GGUF is the validated inference stack. Research compiled 2026-01-06, validated across multiple conversations. This is NOT dead code — it's the entire AI backbone.

**Decision: Option A — Full Inference Service**

Candle provides:
- **Embedder** (Qwen3-0.6B safetensors, CPU forced, 1024-dim) → feeds RRO vector store
- **Reranker** (Qwen3-Reranker-0.6B GGUF q8_0, GPU P2) → scores CAG candidates
- **LLM Brain** (Qwen3-VL-4B GGUF Q4_K_M, GPU P1) → autoregressive generation with rumination
- **Background** (Qwen3-14B GGUF) → re-indexing, LoRA, memory consolidation

Four-layer rumination architecture:
- Keystroke (<50ms): 0.6B intent classification + query embedding
- Pause (<500ms): 0.6B cross-encoder reranking
- Send (2-5s): 4B autoregressive generation
- Background (minutes): 14B heavy analysis

Model management via `hf-hub` crate — download on first run, cache locally.
outlines-core provides grammar-constrained token masking during generation (already compiled).

### AD-3: Service registry pattern replaces hardcoded fields
The current `Platform` struct has 10 hardcoded `Option<Arc<Service>>` fields. Every new service means editing `Platform`, `BootedServices`, `boot::execute`, `Platform::health`, `Platform::shutdown`, and config types. That's 6+ files per service.

Replace with a `ServiceRegistry` — a type-safe `HashMap<ServiceRole, Arc<dyn Service>>` that services register into during boot. Health, shutdown, and accessors iterate the registry. Adding a service means: write the adapter, add config, register at boot. Done.

### AD-4: xtask gets post-boot health gate
After launching `pnpm tauri dev`, xtask should poll the SurrealDB HTTP health endpoint (`GET http://127.0.0.1:8822/health`) to confirm the platform actually booted. Timeout + explicit failure message if it doesn't.

### AD-5: Project self-indexing is a boot phase
After services are healthy, a new boot phase scans the project root and writes project metadata into the databases. This is dogfooding — DevPulse indexes itself.

### AD-6: Logging becomes a service
Tracing subscriber + file appender already work. Wrap them in a `LoggingService` that implements `Service`. Health check = verify log file is writable. Shutdown = flush all appenders. This makes logging observable alongside everything else.

---

## Phases

### Phase 1: Service Registry (Rust Engine)

**Goal**: Replace hardcoded service fields with a dynamic registry. This unblocks everything else — every subsequent phase just registers a new service.

#### Task 1.1: Define ServiceRegistry
**File**: `systems/devpulse-engine/src/platform/services/registry.rs` (NEW)

```rust
/// Type-safe service registry.
/// Services register at boot, queried by role.
/// Health/shutdown iterate all registered services.
pub struct ServiceRegistry {
    services: Vec<Arc<dyn Service>>,
    // Typed accessors via downcast for specific service types
}
```

- `register(service)` — add a service
- `by_role(role) -> Option<&dyn Service>` — lookup
- `health_all() -> Vec<SubsystemHealth>` — ping everything
- `shutdown_all()` — reverse-order shutdown with deadlines
- Typed accessors: `relational()`, `analytics()`, `graph()`, etc. via `Any` downcast

#### Task 1.2: Refactor Platform to use registry
**File**: `systems/devpulse-engine/src/platform/mod.rs` (MODIFY)

Replace all `Option<Arc<*Service>>` fields with single `ServiceRegistry`. Accessors delegate to registry. Health and shutdown delegate to registry.

#### Task 1.3: Refactor boot to register services
**File**: `systems/devpulse-engine/src/platform/boot/mod.rs` (MODIFY)

`BootedServices` becomes a `ServiceRegistry`. Each boot helper registers into the registry instead of returning an `Option`.

**VERIFY**: `cargo check -p devpulse-engine` after EACH file edit.

---

### Phase 2: Fix Kokoros (Voice TTS)

**Goal**: Kokoros compiles and boots. TTS works.

#### Task 2.1: Patch espeak-rs-sys build.rs
**File**: `deps/piper-rs/crates/espeak-rs-sys/build.rs` (MODIFY)

Add system install detection before source build:
```rust
// Check for system eSpeak install (Windows)
let system_paths = [
    "C:/Program Files (x86)/eSpeak/",
    "C:/Program Files/eSpeak NG/",
];
for path in &system_paths {
    if Path::new(path).exists() {
        // Link against system install
        println!("cargo:rustc-link-search=native={path}lib");
        println!("cargo:rustc-link-lib=static=espeak-ng");
        return; // Skip source build
    }
}
// Fall through to existing source build
```

#### Task 2.2: Ensure eSpeak NG is installed
**Prerequisite**: Run `deps/espeak-ng-setup.msi` or verify system install exists.

#### Task 2.3: Enable kokoros feature
**File**: `interfaces/desktop/src-tauri/Cargo.toml` (MODIFY)
```toml
devpulse-engine = { path = "../../../systems/devpulse-engine", features = ["rro", "outlines", "kokoros"] }
```

#### Task 2.4: Enable in config
**File**: `systems/devpulse-engine/platform.default.toml` (MODIFY)
```toml
[services.system.voice]
enabled = true
critical = true
kind = "kokoros"
```

#### Task 2.5: Verify model files exist
Check `.userdata/system/kokoros/model/kokoro-v1.0.onnx` and `voices-v1.0.bin`. If missing, document download/provision step.

**VERIFY**: `cargo check -p devpulse_desktop_backend` then `cargo xtask run-dev` → voice service boots.

---

### Phase 3: Candle Inference Service

**Goal**: Candle boots as a platform service. Model manager downloads/caches models. Device allocator assigns GPU/CPU. Health check verifies models are loaded.

#### Task 3.1: CandleAdapter in Maestro
**File**: `kernel/devpulse-maestro/src/cortex/persistence/candle.rs` (NEW)

The adapter manages the Candle runtime:
- `ModelManager` — downloads GGUF/safetensors via `hf-hub`, caches to `.userdata/models/`
- `DeviceAllocator` — CPU forced for embedder, GPU P1 for LLM, GPU P2 for reranker
- `EmbedderBackend` — Qwen3-0.6B safetensors, 1024-dim L2-normalized output
- `RerankerBackend` — Qwen3-Reranker-0.6B GGUF, yes/no logit scoring
- `ping()` — verify at least embedder model is loaded and can produce a test embedding
- `boot()` — load configured models based on available hardware

```rust
pub struct CandleAdapter {
    embedder: Option<EmbedderBackend>,
    reranker: Option<RerankerBackend>,
    // LLM deferred to Sprint 2 (generation loop)
    model_dir: PathBuf,
}
```

#### Task 3.2: InferenceService wrapper
**File**: `systems/devpulse-engine/src/platform/services/inference.rs` (NEW)

Implements `Service` trait. Config-driven model paths and device allocation.

#### Task 3.3: Config entry
**File**: `systems/devpulse-engine/platform.default.toml` (MODIFY)

```toml
[services.system.inference]
enabled = true
critical = true
kind = "candle"
model_dir = "system/models"
# Models download on first boot via hf-hub
embedder_repo = "unsloth/Qwen3-0.6B-GGUF"
reranker_repo = "unsloth/Qwen3-Reranker-0.6B-GGUF"
```

#### Task 3.4: Feature gate
**File**: `systems/devpulse-engine/Cargo.toml` (MODIFY)

Add `candle` feature that pulls in `candle-core`, `candle-nn`, `candle-transformers`, `hf-hub`, `tokenizers`.

#### Task 3.5: Wire embedder → RRO
The embedder produces 1024-dim vectors. RRO consumes them. This is the CAG pipeline foundation:
- Embed query → search RRO → rerank candidates → assemble context
- Dimension assertion at boot: embedder.dim must match RRO collection.vector_size

**VERIFY**: `cargo check -p devpulse-engine` after each file. Models download on first `cargo xtask run-dev`.

---

### Phase 4: STT Service (Speech-to-Text) — Whisper via Candle

**Goal**: STT boots as a platform service. Whisper model loaded through Candle. Audio in, text out.

#### Task 4.1: WhisperAdapter in Maestro
**File**: `kernel/devpulse-maestro/src/cortex/persistence/stt.rs` (NEW)

Candle already has `candle-transformers::models::whisper` — use it directly.
- Load Whisper GGUF via `hf-hub` (same model manager as inference service)
- `boot()` — load model + tokenizer
- `transcribe(audio: &[f32], sample_rate: u32) -> Result<String>`
- `ping()` — verify model loaded

Model: `ggerganov/whisper.cpp` GGUF or `openai/whisper-base` via candle-transformers.
Device: CPU (Whisper is fast enough on CPU for real-time STT).

#### Task 4.2: STTService wrapper
**File**: `systems/devpulse-engine/src/platform/services/stt.rs` (NEW)

Implements `Service` trait. `critical = true`.

#### Task 4.3: Config entry
**File**: `systems/devpulse-engine/platform.default.toml` (MODIFY)

```toml
[services.system.stt]
enabled = true
critical = true
kind = "whisper"
model_repo = "openai/whisper-base"
device = "cpu"
```

#### Task 4.4: Feature gate
Part of the `candle` feature — Whisper is in `candle-transformers`, no extra deps.

**VERIFY**: `cargo check -p devpulse-engine`

---

### Phase 5: Logging Service

**Goal**: Logging is a managed service with health checks.

#### Task 5.1: LoggingService
**File**: `systems/devpulse-engine/src/platform/services/logging.rs` (NEW)

```rust
pub struct LoggingService {
    log_dir: PathBuf,
    // Holds reference to tracing guard
}

impl Service for LoggingService {
    fn name(&self) -> &'static str { "Logging" }
    fn role(&self) -> ServiceRole { ServiceRole::Logging }
    async fn ping(&self) -> Result<()> {
        // Verify log directory is writable
        // Verify log file exists and was written recently
    }
    fn is_ready(&self) -> bool { true }
    async fn shutdown(&self) -> Result<()> {
        // Flush all appenders
    }
}
```

#### Task 5.2: Add ServiceRole::Logging
**File**: `systems/devpulse-engine/src/platform/services/mod.rs` (MODIFY)

#### Task 5.3: Register in boot pipeline
Boot logging FIRST (before all other services). Currently logging is initialized in `lib.rs` setup — move the service wrapper registration to boot phase 0.

**VERIFY**: `cargo check -p devpulse-engine`

---

### Phase 6: xtask Post-Boot Health Gate

**Goal**: `cargo xtask run-dev` confirms the platform actually booted before declaring success.

#### Task 6.1: Health poll after launch
**File**: `xtask/src/commands/dev.rs` (MODIFY)

After spawning `pnpm tauri dev`, poll `http://127.0.0.1:8822/health` with:
- 30 second timeout (services need time to boot)
- 2 second poll interval
- On success: print service health summary
- On timeout: print FAILURE with boot.log location

This is NOT blocking the tauri process — it runs in parallel. Just a health confirmation gate before xtask declares "all good".

#### Task 6.2: Boot log tail on failure
If health check times out, read and print `.userdata/logs/boot.log` tail (last 30 lines) so the developer sees exactly what failed.

**VERIFY**: `cargo check -p xtask`

---

### Phase 7: Project Self-Indexing (Dogfooding)

**Goal**: On first boot, the platform indexes the project it's running in.

#### Task 7.1: Project indexer
**File**: `systems/devpulse-engine/src/platform/boot/indexer.rs` (NEW)

After all services are healthy:
1. Read `Cargo.toml` → extract workspace members, dependencies
2. Scan `interfaces/desktop/package.json` → frontend deps
3. Scan directory structure → file counts by type
4. Write to `projects/devpulse/` SurrealDB namespace:
   - `project_meta` — name, root, tech stack
   - `project_deps` — dependency graph
   - `project_files` — file inventory by directory

#### Task 7.2: Wire into boot pipeline
**File**: `systems/devpulse-engine/src/platform/boot/mod.rs` (MODIFY)

New boot phase 4 after service validation:
```
Phase 1: Preflight (directories)
Phase 2: Service boots
Phase 3: Validation (critical services)
Phase 4: Project indexing (NEW)
Phase 5: Health check
```

Only runs if project graph service is healthy. Non-critical — failure doesn't block boot.

**VERIFY**: `cargo check -p devpulse-engine`

---

### Phase 8: Clean Modular Structure

**Goal**: The `platform/` module structure scales for 15+ services without becoming a mess.

#### Current Structure (good foundation)
```
systems/devpulse-engine/src/platform/
├── boot/
│   ├── mod.rs          # Boot orchestration
│   ├── graph.rs        # SurrealDB consolidated boot
│   ├── preflight.rs    # Directory creation
│   └── retry.rs        # File-lock retry
├── services/
│   ├── mod.rs          # Service trait + ServiceRole
│   ├── analytics.rs    # DuckDB
│   ├── cache.rs        # Moka
│   ├── grammar.rs      # outlines-core
│   ├── graph.rs        # SurrealDB
│   ├── relational.rs   # LibSQL
│   ├── vector.rs       # RRO
│   └── voice.rs        # Kokoros
├── config.rs           # 874 lines — TOO BIG
├── health.rs
├── init.rs
├── mod.rs
└── server.rs
```

#### Target Structure
```
systems/devpulse-engine/src/platform/
├── boot/
│   ├── mod.rs          # Boot orchestration
│   ├── graph.rs        # SurrealDB consolidated boot
│   ├── indexer.rs      # Project self-indexing (NEW)
│   ├── preflight.rs    # Directory creation
│   └── retry.rs        # File-lock retry
├── services/
│   ├── mod.rs          # Service trait + ServiceRole
│   ├── registry.rs     # ServiceRegistry (NEW)
│   ├── analytics.rs    # DuckDB
│   ├── cache.rs        # Moka
│   ├── grammar.rs      # outlines-core
│   ├── graph.rs        # SurrealDB
│   ├── inference.rs    # Candle (NEW, if kept)
│   ├── logging.rs      # Logging service (NEW)
│   ├── relational.rs   # LibSQL
│   ├── stt.rs          # STT (NEW, when ready)
│   ├── vector.rs       # RRO
│   └── voice.rs        # Kokoros
├── config/
│   ├── mod.rs          # Re-exports, PlatformBootConfig
│   ├── services.rs     # All service config entries
│   ├── network.rs      # Network config
│   ├── windows.rs      # Windows hardening
│   └── defaults.rs     # Serde default functions
├── health.rs
├── init.rs
├── mod.rs
└── server.rs
```

Key changes:
- `config.rs` (874 lines) → split into `config/` module with logical sub-files
- `services/registry.rs` — new service registry
- New service files as services are added

**VERIFY**: `cargo check -p devpulse-engine` after each move.

---

## Decision Gates (ALL CLOSED)

| # | Decision | Resolution |
|---|----------|------------|
| 1 | **Candle role** | Full inference service (Candle + Qwen3 GGUF). Validated 2026-01-06. |
| 2 | **STT engine** | Whisper via Candle. Same runtime, same device allocator, no external process. |
| 3 | **Kokoros criticality** | `critical = true`. It loads or boot fails. Fix the espeak-rs-sys blocker. No degraded mode. |
| 4 | **Service registry** | Phase 1. Built first. Everything else registers into it. |

**Nothing defers. Nothing is optional. Every service loads or the platform doesn't start.**

---

## Execution Order

1. **Phase 8** first (structure) — clean house before adding rooms
2. **Phase 5** (logging service) — everything logs, should be first service
3. **Phase 1** (service registry) — unblocks scalable service addition
4. **Phase 2** (Kokoros) — real fix, not a workaround
5. **Phase 6** (xtask health gate) — verify everything boots
6. **Phase 7** (project indexing) — dogfooding
7. **Phase 3 + 4** (Candle + STT) — after owner decisions

---

## Hard Rules During Execution

1. `cargo check` after EVERY file edit. No exceptions.
2. If a service fails to boot, STOP. Fix it. Do not proceed.
3. No `enabled = false` to skip broken services. Fix or remove.
4. No stub/placeholder adapters. Real implementation or nothing.
5. No dead dependencies. Wire it or delete it.
6. Every service gets a health check that actually verifies functionality, not just `true`.
7. Config drives everything. No hardcoded paths, ports, or feature toggles in code.

---

## Files Changed Summary

| File | Action | Phase |
|------|--------|-------|
| `platform/config.rs` → `platform/config/` | SPLIT | 8 |
| `platform/services/registry.rs` | NEW | 1 |
| `platform/services/mod.rs` | MODIFY (add registry, logging role) | 1, 5 |
| `platform/mod.rs` | MODIFY (use registry) | 1 |
| `platform/boot/mod.rs` | MODIFY (register pattern, indexer phase) | 1, 7 |
| `platform/services/logging.rs` | NEW | 5 |
| `platform/boot/indexer.rs` | NEW | 7 |
| `deps/piper-rs/crates/espeak-rs-sys/build.rs` | MODIFY | 2 |
| `interfaces/desktop/src-tauri/Cargo.toml` | MODIFY (add kokoros feature) | 2 |
| `systems/devpulse-engine/platform.default.toml` | MODIFY (enable voice) | 2 |
| `xtask/src/commands/dev.rs` | MODIFY (health gate) | 6 |
| `kernel/.../candle.rs` | NEW | 3 |
| `platform/services/inference.rs` | NEW | 3 |
| `systems/devpulse-engine/Cargo.toml` | MODIFY (candle feature) | 3 |
| `kernel/.../stt.rs` | NEW (when STT decided) | 4 |
| `platform/services/stt.rs` | NEW (when STT decided) | 4 |

---

## Sprint Boundary

**In scope**: All services loading, clean structure, xtask health gate, project self-indexing, Kokoros fix, Candle decision.
**Out of scope**: IDE/AI as managed services (P3), VPB, visual fidelity, frontend service panel. Those come after the foundation is solid.
