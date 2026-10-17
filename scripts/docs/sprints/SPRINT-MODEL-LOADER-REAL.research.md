# Research: Make Model Loader REAL

**Date**: 2026-03-31
**Sprint**: SPRINT-MODEL-LOADER-REAL
**Status**: COMPLETE
**Supersedes**: SPRINT-MODEL-LOADER.md (2026-03-30, pre-crate)

## SSOT Map

### Rust Types (SSOT: `kernel/model-loader/src/`)

| Type | File | Notes |
|------|------|-------|
| `ModelLoaderService` | `service.rs` | Top-level API, owns everything |
| `Slot`, `ModelCapability`, `DevicePreference`, `LoadingStrategy` | `slots/types.rs` | Slot definitions |
| `SlotRegistry` | `slots/registry.rs` | HashMap-based slot store |
| `ModelRegistryEntry`, `ModelSource`, `ModelFormat`, `BackendType`, `ModelMetadata` | `models/registry.rs` | Model metadata |
| `ModelRegistry` | `models/registry.rs` | Vec-based model store with scan/save/load |
| `DownloadManager`, `DownloadHandle`, `DownloadProgress` | `models/download.rs` | HF download with cancel |
| `ModelStatus`, `LoadingStage`, `LoadParams`, `MemoryFootprint`, `SlotStatus` | `loading/states.rs` | State machine |
| `HardwareMetrics`, `HardwareMonitor` | `hardware/metrics.rs` | OS-level metrics (sysinfo + nvml) |
| `HardwareTier`, `AutoConfig`, `SlotRecommendation` | `hardware/auto_config.rs` | Tier detection + recommendations |
| `VramBudget`, `SlotBudgetEntry`, `BudgetStatus` | `hardware/vram.rs` | VRAM planning |
| `LoaderEvent` (22 variants) | `traits/events.rs` | Full event enum |
| `LoaderError` (14 variants), `RecoverySuggestion` | `traits/errors.rs` | Error types with recovery |
| `ConfigBackend` trait, `MemoryConfig` | `traits/config.rs` | Persistence abstraction |
| `InferenceBackend` trait | `traits/backend.rs` | Backend abstraction |
| `InferenceHandle`, `InferenceRequest`, `InferenceResponse` | `backends/bridge.rs` | Flume-based async bridge |
| `BackendPool` | `backends/pool.rs` | Shared model instances |

### Frontend Types (SSOT: `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts`)

| Type | Mirrors Rust | Status |
|------|-------------|--------|
| `HardwareMetrics` | `hardware::metrics::HardwareMetrics` | Match |
| `HardwareTier` | `hardware::auto_config::HardwareTier` | Match |
| `ModelRegistryEntry` | `models::registry::ModelRegistryEntry` | Match |
| `ModelSource` | `models::registry::ModelSource` | Match |
| `ModelCapability` | `slots::types::ModelCapability` | Match |
| `SlotInfo` | `slots::types::Slot` | Match |
| `ModelStatus` | `loading::states::ModelStatus` | Match |
| `LoadingStage` | `loading::states::LoadingStage` | Match |
| `DownloadProgress` | `models::download::DownloadProgress` | Match |
| `AutoConfig`, `SlotRecommendation` | `hardware::auto_config` | Match |
| `VramBudget`, `SlotBudgetEntry` | `hardware::vram` | Match |
| `FitIndicator` | N/A (frontend-only UI helper) | OK |

### Tauri Command Types (SSOT: `interfaces/desktop/src-tauri/src/commands/models/mod.rs`)

| Type | Mirrors Rust | Status |
|------|-------------|--------|
| `HardwareInfo` | `HardwareMetrics` | **DUPLICATE** — different field set, partially populated |
| `ModelInfo` | `ModelRegistryEntry` | **DUPLICATE** — different field names |
| `SlotInfo` | `Slot` | **DUPLICATE** — flattened strings vs enums |

**PROBLEM**: Three parallel type hierarchies. Tauri commands define their OWN structs instead of using model-loader types directly. This means:
- Rust model-loader has real `HardwareMetrics` with all GPU fields
- Tauri `HardwareInfo` has same fields but only populates 3 of 15
- Frontend `HardwareMetrics` expects full data but gets mostly zeros

### Engine Integration Layer (SSOT: `systems/devpulse-engine/src/platform/integrations/`)

| File | Purpose | Status |
|------|---------|--------|
| `mod.rs` | Module gate (`#[cfg(feature = "inference")]`) | EXISTS |
| `slots.rs` | `devpulse_default_slots()` — 8 default slots | EXISTS |
| `config.rs` | Re-exports `MemoryConfig` | EXISTS |
| `events.rs` | Re-exports `TracingEventSink` | EXISTS |
| `narration.rs` | `LoaderEvent` → human-friendly messages | EXISTS |

### Missing Pieces

| What | Where It Should Go | Why Missing |
|------|-------------------|-------------|
| `ModelLoaderService` wrapper | `engine/src/platform/services/model_loader.rs` | Service trait impl never written |
| Boot stage | `engine/src/platform/boot/model_loader.rs` | Never added to boot sequence |
| Platform field | `engine/src/platform/mod.rs` | Never added |
| `ServiceRole::ModelLoader` | `engine/src/platform/services/mod.rs` | Enum variant missing |
| Tauri event bridge | `src-tauri/src/commands/models/` | Events don't reach frontend |
| HF search command | `src-tauri/src/commands/models/` | Doesn't exist |
| HF search UI | `domains/app/models/components/` | Doesn't exist |
| Model result cards with icons | `domains/app/models/components/` | Doesn't exist |
| Real download wiring | SetupWizard + new download UI | Faked with setTimeout |
| Route page content | `routes/(model-loader)/model-loader/+page.svelte` | Skeleton Card |

## Codebase Analysis

### What's Real (verified on disk 2026-03-31)

**kernel/model-loader/** — Self-contained crate. 14 source files, all compile. Real GGUF parsing, real HF download via hf-hub, real hardware metrics via sysinfo+nvml, real slot registry, real VRAM budgeting, real inference bridge via flume.

**Engine integration layer** — 5 files exist. Re-export MemoryConfig, TracingEventSink, default slots, narration mapping. BUT nothing creates a `ModelLoaderService` instance.

**Frontend domain** — 7 components, 4 services, 2 runes, full type defs. All components use resolveMacro+cssVarString. BUT all services call Tauri stubs that return empty data.

### What's Fake

1. **Tauri `get_hardware_metrics`** — Returns `HardwareInfo` with 12 of 15 fields zeroed. Only `cpu_usage_percent`, `process_ram_mb` populated from `ProcessMetrics`.
2. **Tauri `scan_models`** — Returns `Vec::new()`.
3. **Tauri `get_slots`** — Returns `Vec::new()`.
4. **Tauri `is_first_run`** — Returns `true` (hardcoded).
5. **Tauri `inference_generate`** — Returns error string.
6. **SetupWizard download** — `setTimeout` loop faking 0→100% progress.
7. **Route +page.svelte** — Skeleton Card, doesn't use ModelLoaderPanel.

### Feature Flag Chain

```
src-tauri/Cargo.toml → devpulse-engine features = [...]
  └── engine/Cargo.toml → inference = ["devpulse-clyffy/model-loader"]
        └── clyffy/Cargo.toml → model-loader = ["dep:model-loader"]
              └── model-loader/Cargo.toml → default = ["candle-backend"]
                    └── candle-backend = ["candle-core", "candle-nn", "candle-transformers", "tokenizers", "hf-hub"]
```

**Current state**: `inference` feature is defined but NOT enabled in `src-tauri/Cargo.toml`.

### HuggingFace Search API

HuggingFace provides a public REST API for model search:
```
GET https://huggingface.co/api/models?search={query}&filter=gguf&sort=downloads&direction=-1&limit=20
```

Returns JSON array of model objects:
- `id` (repo ID), `modelId`, `author`, `downloads`, `likes`, `tags[]`
- `siblings[]` — files in the repo (filter for `.gguf`)
- `pipeline_tag` — "text-generation", "feature-extraction", etc.

**Decision needed**: Call from Rust (via reqwest in Tauri command) or direct fetch from frontend?
- Rust: No CORS issues, can cache, consistent with architecture
- Frontend: Simpler, but CORS may block, breaks local-first pattern

## Anti-Pattern Risks

1. **Triple type definitions** — Tauri commands define `HardwareInfo`/`ModelInfo`/`SlotInfo` separately from model-loader types AND frontend types. Must consolidate to single source.
2. **Stub creep** — More stubs get added "for later" but never wired. Fix: wire or delete.
3. **Fake progress** — SetupWizard fakes download. Fix: wire to real event stream.
4. **Dead route** — model-loader route page is a skeleton. Fix: use ModelLoaderPanel.

## Recommendations

### Consolidation (PRE-SPRINT)

Delete the Tauri-local `HardwareInfo`, `ModelInfo`, `SlotInfo` structs. Instead:
- Use `model_loader::HardwareMetrics` directly (with Serialize + specta::Type derives)
- Or create thin wrappers that delegate to model-loader types (no field duplication)

### Phase Order

1. **Wire engine** — Add ModelLoaderService to Platform boot. This unblocks everything.
2. **Replace Tauri stubs** — Wire commands to real service methods.
3. **Add missing commands** — `assign_model_to_slot`, `load_slot`, `unload_slot`, `download_model`, `cancel_download`, `search_huggingface`, `auto_configure`.
4. **Wire frontend** — Route page, real download progress, event streaming.
5. **Build search UI** — HF search component with layman-friendly results.
6. **Style results** — Icon/emoji cards for search results and model library.

## Files Referenced

- `kernel/model-loader/src/service.rs` — Main API (598 lines, real)
- `kernel/model-loader/src/models/download.rs` — HF download (231 lines, real)
- `kernel/model-loader/src/models/discovery.rs` — GGUF parsing (343 lines, real)
- `kernel/model-loader/src/hardware/metrics.rs` — HW metrics (real)
- `kernel/model-loader/src/hardware/auto_config.rs` — Tier detection (real)
- `systems/devpulse-engine/src/platform/mod.rs` — Platform struct (no model-loader field)
- `systems/devpulse-engine/src/platform/boot/mod.rs` — Boot sequence (no model-loader stage)
- `systems/devpulse-engine/src/platform/services/mod.rs` — Service trait (no ModelLoader role)
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — ALL STUBS
- `interfaces/desktop/src-tauri/src/lib.rs` — Command registration
- `interfaces/desktop/src/lib/domains/app/models/` — Full frontend domain
- `interfaces/desktop/src/routes/(model-loader)/model-loader/+page.svelte` — Skeleton
- `scripts/docs/sprints/SPRINT-MODEL-LOADER.md` — Old sprint (pre-crate, superseded)
