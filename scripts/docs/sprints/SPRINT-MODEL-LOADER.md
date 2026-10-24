# SPRINT: Model Loader — Full Implementation

**Date**: 2026-03-30
**Status**: PLAN — Owner approval required before execution
**Depends on**: Candle deps already in workspace Cargo.toml, LibSQL platform_config table exists
**Spec**: `plans/snuggly-dreaming-sphinx.md` (MODEL LOADER SPECIFICATION v1.0.0-rc1)
**Supersedes**: SPRINT-INFERENCE-BASELINE.md Phase 1-3

---

## REALITY CHECK — What Exists vs What's Needed

### EXISTS (verified on disk 2026-03-30)

| Component | Location | Status |
|-----------|----------|--------|
| `candle-core/nn/transformers 0.8` | workspace Cargo.toml | Declared, feature-gated, **NOT USED** |
| `tokenizers 0.21` | clyffy Cargo.toml | Declared, optional, **NOT USED** |
| `hf-hub 0.4` | clyffy Cargo.toml | Declared, optional, **NOT USED** |
| `sysinfo 0.33` (engine) / `0.38.4` (desktop) | Both Cargo.toml | Used for `ProcessMetrics` (RSS, CPU only) |
| `outlines-core` | clyffy Cargo.toml | Declared, optional, feature-gated |
| `Service` trait | `engine/src/platform/services/mod.rs` | Real — `name()`, `role()`, `ping()`, `state()`, `shutdown()` |
| `ServiceRole` enum | Same file | Real — 10 variants (no Inference variant yet) |
| `ServiceState` enum | Same file | Real — Created/Booting/Ready/Degraded/Failed |
| `ProcessMetrics` | `engine/src/platform/metrics.rs` | Real — RSS, virtual, CPU%, uptime, pid. **No GPU.** |
| `platform_config` table | LibSQL CORE_SCHEMA | Real — `key TEXT PK, value TEXT, category TEXT, updated_at INTEGER` |
| Boot pipeline | `engine/src/platform/boot/` | Real — 14 stage files, config-driven, event callbacks |
| `EmbedderService` | `engine/src/platform/services/embedder.rs` | Real — wraps Candle embedder (CPU burst) |
| `platform.default.toml` | `systems/devpulse-engine/` | Real — all services configured |
| Frontend `RadialGauge` | `design/components/radial-gauge/` | Real — SVG arc gauge with glow |
| Frontend `Progress` | `design/components/progress/` | Real — linear progress bars |
| Frontend `Widget` | `design/components/widget/` | Real — container with surface/glow |
| Frontend `Dialog` | `design/components/dialog/` | Real — modal with trigger/content |
| Tauri specta bindings | `sys/generated/bindings.ts` | Real — auto-generated from Rust |
| Domain service pattern | `devpulse.service.ts` | Real — reference implementation |
| Runes state pattern | `devpulseState` | Real — reference implementation |

### DOES NOT EXIST (verified 2026-03-30)

| Component | What's Missing |
|-----------|---------------|
| `kernel/.../cortex/inference/` | Entire directory. No inference module. |
| `flume` | Not in any Cargo.toml. Needed for sync↔async bridge. |
| `nvml-wrapper` | Not in any Cargo.toml. Needed for GPU/VRAM metrics. |
| `llama-cpp-sys-2` | Not in any Cargo.toml. Phase 2 of spec. |
| GPU metrics | `ProcessMetrics` has zero GPU fields. |
| `HardwareMetrics` struct | Does not exist. Spec defines it. |
| `InferenceBackend` trait | Does not exist. Spec defines it. |
| Model registry | No `~/.devpulse/models/` management. No `registry.json`. |
| Model role assignments | No `model.brain`, `model.minion` etc in platform_config. |
| GGUF parsing | No code reads GGUF headers. |
| Download pipeline | hf-hub declared but zero download code. |
| Model loading UI | No frontend components for model management. |
| `InferenceService` | No service variant for inference lifecycle. |
| Config entries for inference | `platform.default.toml` has no `[services.system.inference]` |
| Frontend model domain | No `domains/app/models/` or equivalent. |
| OverMind model loader route | Route exists but shows skeleton widgets. |

---

## ARCHITECTURE CONSTRAINTS (from ADR + CLAUDE.md + spec)

1. **Desktop NEVER imports clyffy directly** — all access through engine facade
2. **Feature-gated** — inference code behind `candle` feature flag
3. **IP-protected** — kernel terms remapped via `ip_term!()` macro
4. **Sync backends, async bridge** — Candle is sync. Tauri is async. `flume` bridges them.
5. **Config-driven** — `platform.default.toml` is SSOT for service config
6. **Service trait** — every bootable component implements `Service`
7. **Boot pipeline** — new services get a boot stage file + config entry
8. **Specta bindings** — every Tauri command generates TypeScript types
9. **Frontend 3-layer** — Component → Runes (state) → Service (IPC) → Tauri invoke
10. **No stubs** — every file compiles, every function does real work or doesn't exist

---

## PHASE 1: INFRASTRUCTURE — Types, Traits, Dependencies

**Goal**: All foundational types exist, compile, and are importable. No inference yet — just the skeleton that everything else builds on.

### Task 1.1: Add Missing Workspace Dependencies

**File**: `Cargo.toml` (workspace root)

Add to `[workspace.dependencies]`:
```toml
flume = "0.11"
nvml-wrapper = "0.10"
```

**Why flume**: Sync↔async bridge for inference thread. Spec §3.4.
**Why nvml-wrapper**: NVIDIA GPU metrics (VRAM, utilization, temp). Spec §7.

### Task 1.2: Add Dependencies to Kernel Crate

**File**: `kernel/devpulse-clyffy/Cargo.toml`

Add under `[dependencies]`:
```toml
flume = { workspace = true }
```

Update `candle` feature to include flume (inference requires the bridge):
```toml
candle = ["dep:candle-core", "dep:candle-nn", "dep:candle-transformers", "dep:tokenizers", "dep:hf-hub"]
```

flume is NOT optional — it's used for signal routing beyond just inference.

### Task 1.3: Add Dependencies to Engine Crate

**File**: `systems/devpulse-engine/Cargo.toml`

Add:
```toml
flume = { workspace = true }
nvml-wrapper = { workspace = true, optional = true }
```

Add new feature:
```toml
inference = ["devpulse-clyffy/candle", "dep:nvml-wrapper"]
```

### Task 1.4: Add Feature to Desktop Crate

**File**: `interfaces/desktop/src-tauri/Cargo.toml`

Add `inference` to engine features:
```toml
devpulse-engine = { ..., features = ["rro", "outlines", "candle", "inference"] }
```

### Task 1.5: Create Inference Module in Kernel

**Directory**: `kernel/devpulse-clyffy/src/cortex/inference/`

Create module structure:
```
inference/
├── mod.rs          # Module exports, InferenceManager struct
├── types.rs        # ModelFormat, BackendType, ModelSource, ModelRole, LoadParams, MemoryFootprint, ModelMetadata, ModelRegistryEntry, ModelStatus, LoadingStage
├── traits.rs       # InferenceBackend trait (spec §3.1)
├── registry.rs     # ModelRegistry — scan, discover, persist, query
├── download.rs     # HuggingFace download via hf-hub with progress callbacks
├── candle.rs       # CandleBackend implementing InferenceBackend (spec §3.2)
└── bridge.rs       # flume sync↔async bridge (spec §3.4)
```

Wire into `cortex/mod.rs`.

### Task 1.6: Create Types (types.rs)

Every type from spec §4.3, §2, §6.1 — real Rust structs, not stubs:

```rust
// Model format on disk
pub enum ModelFormat { Gguf, SafeTensors }

// Which backend can run this model
pub enum BackendType { Candle, LlamaCpp }

// Where the model came from
pub enum ModelSource {
    Local,
    HuggingFace { repo_id: String, revision: String },
}

// Fixed roles from spec §2
pub enum ModelRole { Brain, Minion, Embedder, Reranker, Vision, Stt, Tts }

// Loading parameters
pub struct LoadParams {
    pub device: Device,          // candle_core::Device
    pub context_length: usize,
    pub gpu_layers: Option<u32>, // for partial offload
}

// Memory footprint report
pub struct MemoryFootprint {
    pub ram_bytes: u64,
    pub vram_bytes: u64,
}

// Model metadata extracted from GGUF header
pub struct ModelMetadata {
    pub architecture: String,
    pub parameter_count: Option<u64>,
    pub quant_level: Option<String>,
    pub context_length: usize,
    pub vocab_size: usize,
}

// Registry entry (spec §4.3)
pub struct ModelRegistryEntry {
    pub id: String,
    pub filename: String,
    pub path: PathBuf,
    pub format: ModelFormat,
    pub architecture: String,
    pub parameter_count: Option<u64>,
    pub quant_level: Option<String>,
    pub context_length: usize,
    pub size_bytes: u64,
    pub vram_estimate_mb: u64,
    pub supported_backends: Vec<BackendType>,
    pub source: ModelSource,
    pub discovered_at: i64,
}

// Loading state machine (spec §6.1)
pub enum ModelStatus {
    NotLoaded,
    Loading { stage: LoadingStage, progress_pct: u8 },
    Loaded { footprint: MemoryFootprint },
    Failed { error: String },
    Unloading,
}

// Loading stages (spec §6.2)
pub enum LoadingStage {
    Verifying,
    Allocating,
    LoadingWeights,
    LoadingTokenizer,
    WarmingUp,
    Ready,
}
```

All with `Serialize`, `Deserialize`, `Clone`, `Debug`. Specta `Type` derive on structs exposed to frontend.

### Task 1.7: Create InferenceBackend Trait (traits.rs)

Exact trait from spec §3.1. Feature-gated behind `candle`.

```rust
#[cfg(feature = "candle")]
pub trait InferenceBackend: Send + Sync {
    fn load(&mut self, path: &Path, params: LoadParams) -> Result<MemoryFootprint>;
    fn unload(&mut self) -> Result<()>;
    fn forward(&self, tokens: &[u32], position: usize) -> Result<candle_core::Tensor>;
    fn tokenize(&self, text: &str) -> Result<Vec<u32>>;
    fn detokenize(&self, tokens: &[u32]) -> Result<String>;
    fn memory_usage(&self) -> MemoryFootprint;
    fn metadata(&self) -> &ModelMetadata;
}
```

### Task 1.8: Compile Check

```bash
cargo check -p devpulse-clyffy --features candle
cargo check -p devpulse-engine --features inference
```

Both must pass with ZERO warnings (clippy pedantic is on).

### GATE: Phase 1 compiles. All types importable. No runtime code yet.

---

## PHASE 2: HARDWARE METRICS — GPU Detection + System-Wide Metrics

**Goal**: Real GPU metrics in Rust. Real hardware dashboard in frontend. `HardwareMetrics` struct populated from OS.

### Task 2.1: HardwareMetrics Struct in Engine

**File**: `systems/devpulse-engine/src/platform/metrics.rs`

Extend existing file. Add `HardwareMetrics` alongside `ProcessMetrics`:

```rust
#[derive(Debug, Clone, Serialize, Type)]
pub struct HardwareMetrics {
    // CPU
    pub cpu_usage_percent: f32,
    pub cpu_cores: usize,
    pub cpu_name: String,
    // RAM
    pub ram_total_mb: u64,
    pub ram_used_mb: u64,
    pub ram_available_mb: u64,
    // GPU (None if no NVIDIA GPU)
    pub gpu_name: Option<String>,
    pub gpu_vram_total_mb: Option<u64>,
    pub gpu_vram_used_mb: Option<u64>,
    pub gpu_vram_free_mb: Option<u64>,
    pub gpu_utilization_percent: Option<f32>,
    pub gpu_temperature_c: Option<f32>,
    // DevPulse process
    pub devpulse_ram_mb: u64,
    pub devpulse_vram_mb: u64,
}
```

### Task 2.2: GPU Detection via NVML

**File**: `systems/devpulse-engine/src/platform/metrics.rs`

Add `collect_hardware()` function:
- CPU: `sysinfo::System` for cores, name, usage
- RAM: `sysinfo::System` for total/used/available
- GPU: `nvml_wrapper::Nvml` for VRAM total/used/free, utilization, temperature
- Graceful fallback: if NVML init fails (no NVIDIA driver), GPU fields are `None`
- Process VRAM: query NVML for compute processes matching our PID

Feature-gate GPU code behind `#[cfg(feature = "inference")]`.

### Task 2.3: Tauri Command — `get_hardware_metrics`

**File**: `interfaces/desktop/src-tauri/src/commands/sys/metrics.rs`

Add new command alongside existing `get_process_metrics`:

```rust
#[tauri::command]
#[specta::specta]
pub async fn get_hardware_metrics(
    state: State<'_, PlatformState>,
) -> Result<HardwareMetrics, String> {
    // Delegate to engine metrics::collect_hardware()
    // spawn_blocking because sysinfo + nvml are sync
}
```

Register in specta builder in `lib.rs`.

### Task 2.4: Frontend Hardware Service

**File**: `interfaces/desktop/src/lib/domains/app/models/services/hardware.service.ts`

```typescript
export async function fetchHardwareMetrics(): Promise<HardwareMetrics> {
    return invoke<HardwareMetrics>("get_hardware_metrics");
}
```

### Task 2.5: Frontend Hardware State Rune

**File**: `interfaces/desktop/src/lib/domains/app/models/runes/hardware.runes.svelte.ts`

```typescript
class HardwareState {
    metrics = $state<HardwareMetrics | null>(null);
    polling = $state(false);
    pollInterval = $state(2000); // 2s default, 500ms during loading

    async refresh(): Promise<void> { ... }
    startPolling(intervalMs?: number): void { ... }
    stopPolling(): void { ... }
}
export const hardwareState = new HardwareState();
```

### Task 2.6: VramGauge Component

**File**: `interfaces/desktop/src/lib/domains/app/models/components/VramGauge.svelte`

Arc-style gauge using ColdLight's `RadialGauge` pattern:
- Shows VRAM used / VRAM total
- Color zones: green (<60%), yellow (60-85%), red (>85%)
- Center text: "X.X / Y.Y GB"
- Updates reactively from `hardwareState`

### Task 2.7: HardwareMetricsPanel Component

**File**: `interfaces/desktop/src/lib/domains/app/models/components/HardwareMetricsPanel.svelte`

Uses ColdLight `Widget` container:
- CPU gauge (RadialGauge)
- RAM bar (Progress component)
- GPU name + VRAM gauge
- GPU temp + utilization
- Refreshes via `hardwareState.metrics`

### Task 2.8: Compile + Verify

```bash
cargo check -p devpulse-engine --features inference
pnpm svelte-check  # from interfaces/desktop/
```

### GATE: `get_hardware_metrics` returns real GPU data. Frontend displays it.

---

## PHASE 3: MODEL REGISTRY — Discovery, Scanning, GGUF Parsing

**Goal**: System can discover local GGUF files, parse their headers, build a registry, and persist it.

### Task 3.1: GGUF Header Parser

**File**: `kernel/devpulse-clyffy/src/cortex/inference/registry.rs`

Parse GGUF file headers to extract:
- Architecture string (from `general.architecture` metadata key)
- Parameter count (from `general.parameter_count` or estimated from tensor shapes)
- Quantization level (from filename convention or tensor types)
- Context length (from `{arch}.context_length` metadata key)
- Vocab size (from tokenizer metadata)

Use `candle_core::quantized::gguf_file::Content` which already exists in our deps:
```rust
use candle_core::quantized::gguf_file::Content;
use std::io::BufReader;

pub fn parse_gguf_metadata(path: &Path) -> Result<ModelMetadata> {
    let file = std::fs::File::open(path)?;
    let content = Content::read(&mut BufReader::new(file))?;
    // Extract metadata from content.metadata HashMap
}
```

### Task 3.2: VRAM Estimation

**File**: Same as 3.1

Estimate VRAM from GGUF file:
- File size on disk is a reasonable lower bound for GGUF (weights are the file)
- Apply multiplier based on quant level (Q4_K_M ≈ 1.1x, Q8_0 ≈ 1.05x, F16 ≈ 1.2x for KV cache overhead)
- Context length affects KV cache size: `2 * n_layers * n_heads * head_dim * context_length * bytes_per_param`

```rust
pub fn estimate_vram_mb(metadata: &ModelMetadata, file_size_bytes: u64) -> u64 {
    // Weights + KV cache + activation memory
}
```

### Task 3.3: Model Registry (registry.rs full implementation)

```rust
pub struct ModelRegistry {
    models_dir: PathBuf,           // ~/.devpulse/models/
    entries: Vec<ModelRegistryEntry>,
}

impl ModelRegistry {
    pub fn new(models_dir: PathBuf) -> Self { ... }

    /// Walk models_dir/gguf/ for .gguf files, parse headers, build entries
    pub fn scan(&mut self) -> Result<usize> { ... }

    /// Add a single entry (after download)
    pub fn add(&mut self, entry: ModelRegistryEntry) { ... }

    /// Remove entry by ID
    pub fn remove(&mut self, id: &str) -> Option<ModelRegistryEntry> { ... }

    /// Find entry by ID
    pub fn get(&self, id: &str) -> Option<&ModelRegistryEntry> { ... }

    /// All entries
    pub fn all(&self) -> &[ModelRegistryEntry] { ... }

    /// Filter by backend support
    pub fn compatible_with(&self, backend: BackendType) -> Vec<&ModelRegistryEntry> { ... }

    /// Persist to registry.json in models_dir
    pub fn save(&self) -> Result<()> { ... }

    /// Load from registry.json
    pub fn load(models_dir: PathBuf) -> Result<Self> { ... }

    /// Check which architectures Candle supports
    fn candle_supports(architecture: &str) -> bool {
        matches!(architecture, "llama" | "mistral" | "mixtral" | "qwen2" | "phi3" | "gemma" | "stablelm" | "starcoder")
    }
}
```

### Task 3.4: Directory Structure Creation

On first run, create:
```
~/.devpulse/models/
├── gguf/
└── safetensors/    # Phase 2, create dir now
```

Add to engine's preflight boot stage (`boot/preflight.rs`).

### Task 3.5: Tauri Commands — Registry

**File**: `interfaces/desktop/src-tauri/src/commands/models/mod.rs` (NEW directory)

```rust
#[tauri::command]
#[specta::specta]
pub async fn scan_model_directory(
    state: State<'_, PlatformState>,
) -> Result<Vec<ModelRegistryEntry>, String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn get_model_registry(
    state: State<'_, PlatformState>,
) -> Result<Vec<ModelRegistryEntry>, String> { ... }
```

Register in specta builder.

### Task 3.6: Frontend Registry Service + State

**File**: `interfaces/desktop/src/lib/domains/app/models/services/registry.service.ts`

```typescript
export async function scanModelDirectory(): Promise<ModelRegistryEntry[]> { ... }
export async function getModelRegistry(): Promise<ModelRegistryEntry[]> { ... }
```

**File**: `interfaces/desktop/src/lib/domains/app/models/runes/registry.runes.svelte.ts`

```typescript
class RegistryState {
    models = $state<ModelRegistryEntry[]>([]);
    scanning = $state(false);
    error = $state<string | null>(null);
    async scan(): Promise<void> { ... }
    async refresh(): Promise<void> { ... }
}
export const registryState = new RegistryState();
```

### Task 3.7: ModelCard Component

**File**: `interfaces/desktop/src/lib/domains/app/models/components/ModelCard.svelte`

Displays a single model from registry:
- Filename, architecture, quant level
- File size, estimated VRAM
- Supported backends (badges)
- Source (local / HuggingFace)

Uses ColdLight `Card` + `Badge` + `Text` components.

### Task 3.8: Compile + Verify

```bash
cargo check -p devpulse-clyffy --features candle
cargo check -p devpulse-engine --features inference
pnpm svelte-check
```

### GATE: Can scan `~/.devpulse/models/gguf/`, parse GGUF headers, display models in UI.

---

## PHASE 4: HUGGINGFACE DOWNLOAD PIPELINE

**Goal**: Download any GGUF from HuggingFace with real progress, cancel support, and auto-registry.

### Task 4.1: Download Manager (download.rs)

**File**: `kernel/devpulse-clyffy/src/cortex/inference/download.rs`

```rust
pub struct DownloadManager {
    models_dir: PathBuf,
    active_downloads: HashMap<String, DownloadHandle>,
}

pub struct DownloadHandle {
    pub id: String,
    pub repo_id: String,
    pub filename: String,
    pub cancel_token: CancellationToken,
}

pub struct DownloadProgress {
    pub download_id: String,
    pub downloaded_bytes: u64,
    pub total_bytes: u64,
    pub speed_bytes_per_sec: u64,
    pub eta_secs: u64,
}

impl DownloadManager {
    pub fn new(models_dir: PathBuf) -> Self { ... }

    /// Start downloading a GGUF from HuggingFace.
    /// Returns immediately. Progress reported via callback.
    pub async fn start_download(
        &mut self,
        repo_id: &str,
        filename: &str,
        on_progress: impl Fn(DownloadProgress) + Send + 'static,
    ) -> Result<DownloadHandle> {
        // hf_hub::api::sync::ApiBuilder for download
        // Wrap in spawn_blocking with progress tracking
        // Save to models_dir/gguf/{filename}
        // Verify checksum after download
    }

    /// Cancel an active download
    pub fn cancel(&mut self, download_id: &str) -> Result<()> { ... }
}
```

### Task 4.2: Tauri Commands — Download

**File**: `interfaces/desktop/src-tauri/src/commands/models/download.rs`

```rust
#[tauri::command]
#[specta::specta]
pub async fn download_model(
    repo_id: String,
    filename: String,
    app_handle: AppHandle,
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    // Start download, return download_id
    // Emit "download-progress" Tauri events for frontend
}

#[tauri::command]
#[specta::specta]
pub async fn cancel_download(
    download_id: String,
    state: State<'_, PlatformState>,
) -> Result<(), String> { ... }
```

### Task 4.3: Frontend Download Components

**File**: `interfaces/desktop/src/lib/domains/app/models/components/ModelDownloader.svelte`

- Input fields: repo ID, filename (or search)
- Download button → starts download
- Progress bar (ColdLight `Progress` component)
- Speed, ETA, total size display
- Cancel button
- Listens to Tauri `download-progress` events

**File**: `interfaces/desktop/src/lib/domains/app/models/services/download.service.ts`

```typescript
export async function downloadModel(repoId: string, filename: string): Promise<string> { ... }
export async function cancelDownload(downloadId: string): Promise<void> { ... }
export function onDownloadProgress(callback: (progress: DownloadProgress) => void): UnlistenFn { ... }
```

### Task 4.4: Compile + Verify

### GATE: Can download a GGUF from HF, see progress, cancel, and model appears in registry.

---

## PHASE 5: CANDLE BACKEND — Real Inference

**Goal**: Load a GGUF model via Candle, run a forward pass, generate tokens. REAL inference, not a stub.

### Task 5.1: CandleBackend Implementation (candle.rs)

**File**: `kernel/devpulse-clyffy/src/cortex/inference/candle.rs`

Full implementation of `InferenceBackend` for Candle:

```rust
pub struct CandleBackend {
    model: Option<LoadedModel>,
    device: Device,
}

struct LoadedModel {
    weights: candle_transformers::models::quantized_llama::ModelWeights,
    tokenizer: tokenizers::Tokenizer,
    metadata: ModelMetadata,
    footprint: MemoryFootprint,
}
```

**Key implementation details**:
- Load GGUF via `candle_core::quantized::gguf_file::Content`
- Build model weights via `candle_transformers::models::quantized_llama::ModelWeights::from_gguf`
  - This handles Llama, Mistral, Qwen2/3 architectures (they share the Llama GGUF format)
- Tokenizer from GGUF metadata (embedded) or separate file via hf-hub
- Forward pass: `model.forward(&input_tensor, position)` → logits tensor
- KV cache managed by `ModelWeights` internally (Candle handles this)
- Device selection: `Device::Cpu` for Phase 1, `Device::cuda_if_available()` for GPU

**Architecture routing within Candle**:
```rust
fn load_model_weights(content: &Content, device: &Device) -> Result<Box<dyn ModelForward>> {
    let arch = content.metadata["general.architecture"].to_string()?;
    match arch.as_str() {
        "llama" | "mistral" | "qwen2" => {
            // quantized_llama handles all three
            Ok(Box::new(quantized_llama::ModelWeights::from_gguf(content, device)?))
        }
        "phi3" => {
            tracing::warn!("Phi-3/4 GGUF has known KV cache bug in Candle — consider SafeTensors");
            Ok(Box::new(quantized_phi3::ModelWeights::from_gguf(content, device)?))
        }
        other => anyhow::bail!("Architecture '{other}' not supported by Candle backend. Use llama.cpp backend (Phase 2).")
    }
}
```

### Task 5.2: Sync↔Async Bridge (bridge.rs)

**File**: `kernel/devpulse-clyffy/src/cortex/inference/bridge.rs`

```rust
pub struct InferenceBridge {
    request_tx: flume::Sender<InferenceRequest>,
    response_rx: flume::Receiver<InferenceResponse>,
    thread_handle: Option<std::thread::JoinHandle<()>>,
}

pub enum InferenceRequest {
    Load { path: PathBuf, params: LoadParams, reply: flume::Sender<Result<MemoryFootprint>> },
    Unload { reply: flume::Sender<Result<()>> },
    Generate { tokens: Vec<u32>, position: usize, reply: flume::Sender<Result<Vec<f32>>> },
    Tokenize { text: String, reply: flume::Sender<Result<Vec<u32>>> },
    Detokenize { tokens: Vec<u32>, reply: flume::Sender<Result<String>> },
    Status { reply: flume::Sender<ModelStatus> },
    Shutdown,
}

pub enum InferenceResponse {
    Token(u32),       // streaming token output
    Done,             // generation complete
    Error(String),
}

impl InferenceBridge {
    /// Spawn a dedicated inference thread. All model ops happen on this thread.
    pub fn spawn(backend: Box<dyn InferenceBackend>) -> Self {
        let (req_tx, req_rx) = flume::unbounded();
        let (resp_tx, resp_rx) = flume::unbounded();

        let handle = std::thread::Builder::new()
            .name("inference-worker".into())
            .spawn(move || {
                inference_thread_loop(backend, req_rx, resp_tx);
            })
            .expect("Failed to spawn inference thread");

        Self {
            request_tx: req_tx,
            response_rx: resp_rx,
            thread_handle: Some(handle),
        }
    }

    /// Async load — sends to inference thread, awaits reply via flume
    pub async fn load(&self, path: PathBuf, params: LoadParams) -> Result<MemoryFootprint> { ... }

    /// Async generate — sends tokens, streams results back
    pub async fn generate(&self, prompt: &str, max_tokens: u32) -> Result<String> { ... }

    /// Async unload
    pub async fn unload(&self) -> Result<()> { ... }

    /// Async status
    pub async fn status(&self) -> ModelStatus { ... }
}
```

### Task 5.3: InferenceManager (mod.rs)

**File**: `kernel/devpulse-clyffy/src/cortex/inference/mod.rs`

Orchestrates registry + download + bridge:

```rust
pub struct InferenceManager {
    registry: ModelRegistry,
    download_manager: DownloadManager,
    bridges: HashMap<ModelRole, InferenceBridge>,
    assignments: HashMap<ModelRole, String>,  // role → model registry ID
}

impl InferenceManager {
    pub fn new(models_dir: PathBuf) -> Result<Self> { ... }

    /// Assign a model to a role
    pub fn assign(&mut self, role: ModelRole, model_id: &str) -> Result<()> { ... }

    /// Load the model assigned to a role
    pub fn load_role(&mut self, role: ModelRole) -> Result<()> { ... }

    /// Unload a role's model
    pub fn unload_role(&mut self, role: ModelRole) -> Result<()> { ... }

    /// Get status for a role
    pub fn role_status(&self, role: ModelRole) -> ModelStatus { ... }

    /// Generate text using the BRAIN role
    pub async fn generate(&self, prompt: &str, max_tokens: u32) -> Result<String> { ... }
}
```

### Task 5.4: Engine Facade — InferenceService

**File**: `systems/devpulse-engine/src/platform/services/inference.rs` (NEW)

Wraps kernel's `InferenceManager` in the `Service` trait:

```rust
pub struct InferenceService {
    manager: InferenceManager,
    state: ServiceState,
}

impl Service for InferenceService {
    fn name(&self) -> &'static str { "Inference" }
    fn role(&self) -> ServiceRole { ServiceRole::Inference }
    fn ping(&self) -> Result<()> { /* check if manager is responsive */ }
    fn state(&self) -> ServiceState { self.state }
    async fn shutdown(&self) -> Result<()> { /* unload all models */ }
}
```

Add `Inference` variant to `ServiceRole` enum.

### Task 5.5: Boot Stage — Inference

**File**: `systems/devpulse-engine/src/platform/boot/inference.rs` (NEW)

Following `embedder.rs` pattern exactly:
- Feature-gated behind `#[cfg(feature = "inference")]`
- Reads config from `platform.default.toml`
- Creates `InferenceService`, emits boot events
- Does NOT auto-load models (that's user-triggered)

### Task 5.6: Config Entry

**File**: `systems/devpulse-engine/platform.default.toml`

Add:
```toml
[services.system.inference]
enabled = true
critical = false
kind = "candle"
models_dir = "models"    # relative to ~/.devpulse/
auto_load_roles = []     # roles to auto-load on boot (empty = none)
```

### Task 5.7: Wire into Platform

**File**: `systems/devpulse-engine/src/platform/mod.rs`

Add `inference()` getter to Platform struct.
Wire into boot pipeline execution order (after embedder, before validation).

### Task 5.8: Compile + Test

```bash
cargo check -p devpulse-clyffy --features candle
cargo check -p devpulse-engine --features inference
```

**Manual test**: Place a small GGUF (Qwen3-0.6B-Q4_K_M) in `~/.devpulse/models/gguf/`, call `scan_model_directory`, verify it appears in registry with correct metadata.

### GATE: Can load a GGUF via Candle, run forward pass on CPU, get logits back. Bridge works async.

---

## PHASE 6: MODEL ASSIGNMENT + LOADING LIFECYCLE

**Goal**: Full model lifecycle — assign to role, load with progress, unload, hot-swap. Persisted in LibSQL.

### Task 6.1: LibSQL Persistence for Assignments

**File**: Kernel persistence layer (LibSQL adapter)

SQL operations:
```sql
-- Store assignment: INSERT OR REPLACE INTO platform_config (key, value, category, updated_at)
-- VALUES ('model.brain', '{model_registry_id}', 'models', unixepoch());

-- Read all assignments: SELECT key, value FROM platform_config WHERE category = 'models';
```

Add to InferenceManager:
```rust
pub async fn persist_assignment(&self, role: ModelRole, model_id: &str, db: &LibSqlService) -> Result<()> { ... }
pub async fn load_assignments(&mut self, db: &LibSqlService) -> Result<()> { ... }
```

### Task 6.2: Loading Progress Events

During model loading, emit Tauri events at each stage (spec §6.2):

```rust
#[derive(Serialize, Clone, Type)]
pub struct ModelLoadingProgress {
    pub role: String,
    pub stage: String,        // "verifying", "allocating", "loading_weights", etc.
    pub progress_pct: u8,
    pub message: String,
}
```

Emit via `app_handle.emit("model-loading-progress", progress)`.

### Task 6.3: Safe Loading Protocol (spec §6.3)

Before loading:
1. Calculate VRAM required from registry estimate
2. Query `get_hardware_metrics` for current VRAM
3. If won't fit: return error with suggestions (which models to unload, CPU fallback option)
4. If fits: proceed with loading, emit progress events

### Task 6.4: Hot-Swap Protocol (spec §6.4)

When assigning new model to already-loaded role:
1. Check if new model fits alongside old temporarily
2. If yes: load new → swap reference → unload old
3. If no: unload old → load new
4. Queue incoming requests during swap (flume naturally handles this)

### Task 6.5: Tauri Commands — Assignment + Loading

**File**: `interfaces/desktop/src-tauri/src/commands/models/assignment.rs` (NEW)

```rust
#[tauri::command]
#[specta::specta]
pub async fn assign_model_role(role: String, model_id: String, state: ...) -> Result<(), String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn get_model_assignments(state: ...) -> Result<HashMap<String, Option<String>>, String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn load_model(role: String, state: ...) -> Result<(), String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn unload_model(role: String, state: ...) -> Result<(), String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn get_model_status(role: String, state: ...) -> Result<ModelStatus, String> { ... }

#[tauri::command]
#[specta::specta]
pub async fn is_first_run(state: ...) -> Result<bool, String> { ... }
```

### Task 6.6: Startup Sequence (spec §5.3)

On boot:
1. Read `platform_config` for all `model.*` keys
2. For each assigned model: verify file exists, set to `NotLoaded`
3. If file missing: mark as MISSING in status, log warning
4. Auto-load models listed in `auto_load_roles` config

### Task 6.7: Compile + Verify

### GATE: Full assignment lifecycle works. Persist → restart → assignments restored. Load/unload with real progress.

---

## PHASE 7: FRONTEND — Model Loader Panel

**Goal**: Complete Model Loader UI in the OverMind route. Feature-flagged layman/advanced.

### Task 7.1: Model Domain Structure

Create full domain structure:
```
interfaces/desktop/src/lib/domains/app/models/
├── components/
│   ├── ModelLoaderPanel.svelte     # Main panel
│   ├── ModelRoleSlot.svelte        # Single role assignment
│   ├── ModelCard.svelte            # (from Phase 3)
│   ├── VramGauge.svelte            # (from Phase 2)
│   ├── HardwareMetricsPanel.svelte # (from Phase 2)
│   ├── ModelDownloader.svelte      # (from Phase 4)
│   ├── ModelAssignDialog.svelte    # Assignment with VRAM check
│   └── LoadingProgress.svelte      # Stage-by-stage visualization
├── runes/
│   ├── hardware.runes.svelte.ts    # (from Phase 2)
│   ├── registry.runes.svelte.ts    # (from Phase 3)
│   ├── loader.runes.svelte.ts      # Loading state, assignments, status
│   └── index.ts
├── services/
│   ├── hardware.service.ts         # (from Phase 2)
│   ├── registry.service.ts         # (from Phase 3)
│   ├── download.service.ts         # (from Phase 4)
│   ├── loader.service.ts           # Assignment + loading IPC
│   └── index.ts
├── types/
│   └── models.types.ts             # Frontend types (from specta generation)
└── index.ts
```

### Task 7.2: LoaderState Rune

**File**: `interfaces/desktop/src/lib/domains/app/models/runes/loader.runes.svelte.ts`

```typescript
class LoaderState {
    assignments = $state<Record<string, string | null>>({});
    statuses = $state<Record<string, ModelStatus>>({});
    loading = $state(false);
    error = $state<string | null>(null);

    async loadAssignments(): Promise<void> { ... }
    async assignModel(role: string, modelId: string): Promise<void> { ... }
    async loadModel(role: string): Promise<void> { ... }
    async unloadModel(role: string): Promise<void> { ... }

    // Listen to model-loading-progress events
    listenToProgress(): UnlistenFn { ... }
}
export const loaderState = new LoaderState();
```

### Task 7.3: ModelRoleSlot Component

Shows one role (BRAIN, MINION, etc.):
- Current assignment or [UNASSIGNED]
- Load/Unload button
- Status indicator (StatusDot)
- Loading progress (LoadingProgress) when in loading state
- Click to open ModelAssignDialog

### Task 7.4: ModelAssignDialog Component

Modal for assigning a model to a role:
- Dropdown of compatible models from registry (filtered by architecture)
- VRAM estimate vs available VRAM
- Warning if model won't fit
- Confirm/Cancel buttons
- Uses ColdLight `Dialog` component

### Task 7.5: LoadingProgress Component

Stage-by-stage loading visualization:
- Shows current stage name
- Progress bar per stage
- Overall progress bar
- Time elapsed
- Listens to `model-loading-progress` Tauri events

### Task 7.6: ModelLoaderPanel (Main View)

Assembles everything:
- 7 role slots (BRAIN, MINION, EMBEDDER, RERANKER, VISION, STT, TTS)
- Hardware metrics panel (side or top)
- VRAM gauge (prominent)
- "Scan Models" button
- "Download Model" button → opens ModelDownloader
- Feature-flagged: layman shows simplified names, advanced shows technical details

### Task 7.7: Wire into OverMind Route

**File**: `interfaces/desktop/src/routes/(app)/overmind/+page.svelte`

Replace skeleton widgets with `ModelLoaderPanel` component.
Initialize `hardwareState`, `registryState`, `loaderState` on mount.

### Task 7.8: Compile + Full Integration Test

```bash
cargo xtask verify  # full frontend + backend check
```

### GATE: Complete Model Loader UI. Can scan, download, assign, load, unload models. VRAM tracked in real-time.

---

## PHASE 8: GENERATION LOOP + CHAT WIRING

**Goal**: Text generation works. Chat sends messages to local model and streams responses.

### Task 8.1: Generation Loop in CandleBackend

Add to `candle.rs`:

```rust
pub fn generate(
    &self,
    prompt_tokens: &[u32],
    max_new_tokens: u32,
    temperature: f32,
    on_token: impl Fn(u32, &str),  // callback per token
) -> Result<String> {
    let mut all_tokens = prompt_tokens.to_vec();
    let mut position = prompt_tokens.len();

    for _ in 0..max_new_tokens {
        let logits = self.forward(&all_tokens, position - 1)?;
        let next_token = sample_token(&logits, temperature)?;

        if next_token == self.eos_token() {
            break;
        }

        let text = self.detokenize(&[next_token])?;
        on_token(next_token, &text);

        all_tokens.push(next_token);
        position += 1;
    }

    self.detokenize(&all_tokens[prompt_tokens.len()..])
}
```

### Task 8.2: Sampling

**File**: Add to `candle.rs` or separate `sampling.rs`

```rust
fn sample_token(logits: &Tensor, temperature: f32) -> Result<u32> {
    if temperature == 0.0 {
        // Greedy: argmax
        Ok(logits.argmax(0)?.to_scalar::<u32>()?)
    } else {
        // Temperature sampling with softmax
        let scaled = (logits / temperature as f64)?;
        let probs = candle_nn::ops::softmax(&scaled, 0)?;
        // Multinomial sample from probs
        sample_multinomial(&probs)
    }
}
```

### Task 8.3: Streaming Inference Tauri Command

**File**: `interfaces/desktop/src-tauri/src/commands/models/inference.rs` (NEW)

```rust
#[tauri::command]
#[specta::specta]
pub async fn inference_generate(
    role: String,
    prompt: String,
    max_tokens: u32,
    temperature: f32,
    app_handle: AppHandle,
    state: State<'_, PlatformState>,
) -> Result<String, String> {
    // Get inference bridge for role
    // Generate with streaming: emit "inference-token" events
    // Return full response
}
```

### Task 8.4: Wire Chat to Local Inference

**File**: Update `interfaces/desktop/src-tauri/src/commands/chat/mod.rs`

When `send_message` is called:
1. Persist user message to LibSQL (existing)
2. Check if BRAIN model is loaded
3. If loaded: generate response via inference bridge, persist AI response, return both
4. If not loaded: return user message only (frontend can show "No model loaded" state)

### Task 8.5: Frontend Streaming

**File**: Update chat runes/service to listen for `inference-token` events

```typescript
export function onInferenceToken(callback: (token: string) => void): UnlistenFn {
    return listen("inference-token", (event) => callback(event.payload as string));
}
```

Chat UI accumulates tokens into streaming response display.

### Task 8.6: Compile + End-to-End Test

```bash
cargo xtask verify
```

**Manual E2E**: Load Qwen3-0.6B → open chat → send message → see streaming response from local model.

### GATE: Chat works with local inference. Tokens stream. Messages persist. This is REAL.

---

## OWNER DECISION GATES (Summary)

| # | Question | Phase | Impact |
|---|----------|-------|--------|
| 1 | Approve this sprint plan? | All | Green light to execute |
| 2 | First model for testing: Qwen3-0.6B-Q4_K_M or Qwen3-4B-Instruct-Q4_K_M? | 5 | Download size, proof scope |
| 3 | OverMind route = Model Loader home? Or separate route? | 7 | Where the UI lives |
| 4 | Feature flag name for layman/advanced toggle? | 7 | UI variant control |
| 5 | llama.cpp FFI sprint (spec Phase 2) — separate sprint file? | After 8 | Scope of THIS sprint |

---

## FILES CREATED/MODIFIED (Complete List)

### New Rust Files
```
kernel/devpulse-clyffy/src/cortex/inference/mod.rs
kernel/devpulse-clyffy/src/cortex/inference/types.rs
kernel/devpulse-clyffy/src/cortex/inference/traits.rs
kernel/devpulse-clyffy/src/cortex/inference/registry.rs
kernel/devpulse-clyffy/src/cortex/inference/download.rs
kernel/devpulse-clyffy/src/cortex/inference/candle.rs
kernel/devpulse-clyffy/src/cortex/inference/bridge.rs
systems/devpulse-engine/src/platform/services/inference.rs
systems/devpulse-engine/src/platform/boot/inference.rs
interfaces/desktop/src-tauri/src/commands/models/mod.rs
interfaces/desktop/src-tauri/src/commands/models/download.rs
interfaces/desktop/src-tauri/src/commands/models/assignment.rs
interfaces/desktop/src-tauri/src/commands/models/inference.rs
```

### Modified Rust Files
```
Cargo.toml                                          # workspace deps: flume, nvml-wrapper
kernel/devpulse-clyffy/Cargo.toml                   # flume dep
kernel/devpulse-clyffy/src/cortex/mod.rs             # wire inference module
systems/devpulse-engine/Cargo.toml                   # flume, nvml-wrapper, inference feature
systems/devpulse-engine/src/platform/services/mod.rs # ServiceRole::Inference, inference module
systems/devpulse-engine/src/platform/boot/mod.rs     # inference boot stage
systems/devpulse-engine/src/platform/mod.rs          # inference() getter
systems/devpulse-engine/src/platform/metrics.rs      # HardwareMetrics struct + collect_hardware()
systems/devpulse-engine/platform.default.toml        # [services.system.inference] entry
interfaces/desktop/src-tauri/Cargo.toml              # inference feature
interfaces/desktop/src-tauri/src/lib.rs              # register model commands in specta
interfaces/desktop/src-tauri/src/commands/mod.rs     # models module
interfaces/desktop/src-tauri/src/commands/chat/mod.rs # wire to inference
```

### New Frontend Files
```
interfaces/desktop/src/lib/domains/app/models/index.ts
interfaces/desktop/src/lib/domains/app/models/types/models.types.ts
interfaces/desktop/src/lib/domains/app/models/services/hardware.service.ts
interfaces/desktop/src/lib/domains/app/models/services/registry.service.ts
interfaces/desktop/src/lib/domains/app/models/services/download.service.ts
interfaces/desktop/src/lib/domains/app/models/services/loader.service.ts
interfaces/desktop/src/lib/domains/app/models/services/index.ts
interfaces/desktop/src/lib/domains/app/models/runes/hardware.runes.svelte.ts
interfaces/desktop/src/lib/domains/app/models/runes/registry.runes.svelte.ts
interfaces/desktop/src/lib/domains/app/models/runes/loader.runes.svelte.ts
interfaces/desktop/src/lib/domains/app/models/runes/index.ts
interfaces/desktop/src/lib/domains/app/models/components/VramGauge.svelte
interfaces/desktop/src/lib/domains/app/models/components/HardwareMetricsPanel.svelte
interfaces/desktop/src/lib/domains/app/models/components/ModelCard.svelte
interfaces/desktop/src/lib/domains/app/models/components/ModelDownloader.svelte
interfaces/desktop/src/lib/domains/app/models/components/ModelRoleSlot.svelte
interfaces/desktop/src/lib/domains/app/models/components/ModelAssignDialog.svelte
interfaces/desktop/src/lib/domains/app/models/components/LoadingProgress.svelte
interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte
```

### Modified Frontend Files
```
interfaces/desktop/src/routes/(app)/overmind/+page.svelte  # wire ModelLoaderPanel
interfaces/desktop/src/lib/sys/generated/bindings.ts       # auto-regenerated by specta
```

---

## EXECUTION RULES

1. **Phase order is strict** — each phase compiles before the next starts
2. **No stubs** — every function does real work. If it can't be implemented yet, it doesn't exist yet.
3. **Compile after every file** — `cargo check` after each Rust file, `pnpm svelte-check` after each Svelte file
4. **Feature-gate everything** — inference code behind `candle`/`inference` features
5. **IP boundary** — desktop never imports clyffy. Engine facade only.
6. **Specta bindings** — every Tauri command gets `#[specta::specta]`, bindings auto-generated
7. **Frontend 3-layer** — Component → Runes → Service → invoke. No shortcuts.
8. **ColdLight components** — use existing design system components. No raw HTML for UI chrome.
9. **No `any` types** — TypeScript types generated from Rust. Use them.
10. **`.js` extensions** — in all TypeScript imports

---

## NOT IN SCOPE (Separate Sprints)

- **llama.cpp FFI backend** — spec Phase 2, separate sprint after this one proves Candle works
- **SafeTensors loading** — spec Phase 5, after GGUF is solid
- **Constrained decoding (llguidance)** — separate sprint, needs llguidance fork cloned
- **Kokoro TTS** — separate sprint (espeak-rs-sys blocker)
- **Whisper STT** — separate sprint
- **Vision (SigLIP2)** — separate sprint
- **Context gauge** — after context window tracking exists in inference loop
- **Graceful degradation** (GPU→CPU→API fallback) — Phase 2 sprint
- **HuggingFace search** (browsing HF from UI) — nice-to-have, after download works

---

*This sprint produces a WORKING model loader. Not a mockup. Not stubs. When Phase 8 is done, you type in chat and a local model responds. That's the bar.*
