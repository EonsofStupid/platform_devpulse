# SPRINT: Model Loader — Wire It Real

**Date**: 2026-03-31
**Status**: PLAN — Owner approval required before execution
**Research**: `SPRINT-MODEL-LOADER-REAL.research.md`
**Supersedes**: `SPRINT-MODEL-LOADER.md` (2026-03-30, pre-crate era)

---

## What Changed Since Last Sprint

The old sprint (2026-03-30) planned everything from scratch. Since then, commit `a2cf845d` and `bee6f111` landed the entire `kernel/model-loader/` crate with:
- Real GGUF parsing, HF downloads, hardware metrics, slot registry, VRAM budgeting
- Real inference bridge (flume), candle backend, backend pool
- Frontend domain: 7 components, 4 services, 2 runes, full types

**What's still broken**: Nothing is wired. Engine doesn't boot it. Tauri commands are stubs. Frontend renders empty. No HF search. No icon/emoji results.

---

## SSOT Map

| Domain | SSOT Location | Status |
|--------|--------------|--------|
| Model types (Rust) | `kernel/model-loader/src/` | REAL |
| Model types (TS) | `domains/app/models/types/models.types.ts` | REAL, mirrors Rust |
| Tauri command types | `src-tauri/src/commands/models/mod.rs` | **DUPLICATE** — must consolidate |
| Engine integration | `engine/src/platform/integrations/` | EXISTS but unused |
| Default slots | `engine/src/platform/integrations/slots.rs` | REAL (8 slots) |
| Frontend components | `domains/app/models/components/` | REAL but render empty |
| Route page | `routes/(model-loader)/+page.svelte` | SKELETON |

### Pre-Sprint Consolidation Required

The Tauri commands define `HardwareInfo`, `ModelInfo`, `SlotInfo` as separate structs duplicating model-loader types. These must be deleted and replaced with model-loader types (with specta::Type derives) before any wiring work.

---

## PHASE 0: CONSOLIDATION — Kill Duplicate Types

**Goal**: Single source of truth for all model-loader types across Rust boundary.

### Task 0.1: Enable `inference` Feature in Desktop Crate

**File**: `interfaces/desktop/src-tauri/Cargo.toml`

Add `"inference"` to engine features list. This makes `model_loader` types available via `devpulse_clyffy::model_loader`.

### STOP — Owner Decision Required
**Question**: The `inference` feature pulls in candle-core, candle-nn, candle-transformers, tokenizers, hf-hub, nvml-wrapper. This adds ~2-3min to first compile and ~100MB to binary. Enable by default for dev builds?
**Options**:
- A) Enable always (simpler, model loader always works)
- B) Feature-gated, opt-in (lighter builds, must remember to enable)
**Impact**: All subsequent tasks assume this is enabled.

### Task 0.2: Add specta::Type Derives to model-loader Types

**File**: `kernel/model-loader/Cargo.toml`

Add optional `specta` dependency. Add `tauri-specta` feature flag.

**Files**: Key type files in `kernel/model-loader/src/`
- `slots/types.rs` — Add `#[cfg_attr(feature = "specta", derive(specta::Type))]` to `Slot`, `ModelCapability`, `DevicePreference`, `LoadingStrategy`
- `models/registry.rs` — Same for `ModelRegistryEntry`, `ModelSource`, `ModelFormat`, `BackendType`
- `loading/states.rs` — Same for `ModelStatus`, `LoadingStage`, `MemoryFootprint`, `SlotStatus`
- `hardware/metrics.rs` — Same for `HardwareMetrics`
- `hardware/auto_config.rs` — Same for `AutoConfig`, `SlotRecommendation`, `HardwareTier`
- `hardware/vram.rs` — Same for `VramBudget`, `SlotBudgetEntry`, `BudgetStatus`
- `models/download.rs` — Same for `DownloadProgress`

### Task 0.3: Delete Duplicate Tauri Types

**File**: `interfaces/desktop/src-tauri/src/commands/models/mod.rs`

Delete `HardwareInfo`, `ModelInfo`, `SlotInfo` structs. Import model-loader types instead via `devpulse_engine::platform::integrations`.

### Task 0.4: Compile Check

```bash
cargo check -p model-loader --features specta
cargo check -p devpulse-engine --features inference
cargo check -p desktop --features inference
```

### GATE: Zero duplicate types. Single source flows from model-loader → clyffy → engine → tauri → specta → TypeScript.

---

## PHASE 1: ENGINE WIRING — Boot ModelLoaderService

**Goal**: Platform boots ModelLoaderService. Health checks work. Shutdown works.

### Task 1.1: Add `ServiceRole::ModelLoader` Variant

**File**: `systems/devpulse-engine/src/platform/services/mod.rs`

Add variant to `ServiceRole` enum.

### Task 1.2: Create ModelLoaderService Wrapper

**File**: `systems/devpulse-engine/src/platform/services/model_loader.rs` (NEW)

```rust
pub struct ModelLoaderService {
    inner: tokio::sync::Mutex<model_loader::ModelLoaderService>,
}
```

Why Mutex: `ModelLoaderService` methods take `&mut self`. Tauri commands are concurrent. Mutex serializes access.

Implement `Service` trait:
- `name()` → `"Model Loader"`
- `role()` → `ServiceRole::ModelLoader`
- `ping()` → check models_dir exists, return Ok
- `state()` → `ServiceState::Ready`
- `shutdown()` → `pool.shutdown_all()`

Public methods (delegate to inner):
- `scan_models()`, `list_slots()`, `get_slot()`, `assign_model()`, `load_slot()`, `unload_slot()`
- `hardware_metrics()`, `auto_configure()`, `is_first_run()`
- `download_model()`, `cancel_download()`
- `inference_handle()`

### Task 1.3: Add Config Entry

**File**: `systems/devpulse-engine/src/platform/config.rs`

Add `ModelLoaderServiceEntry` to `SystemServicesConfig`:
```rust
#[cfg(feature = "inference")]
pub model_loader: ModelLoaderServiceEntry,
```

Fields: `enabled: bool` (default true), `critical: bool` (default false).

**File**: `systems/devpulse-engine/platform.default.toml`

Add:
```toml
[services.system.model_loader]
enabled = true
critical = false
```

### Task 1.4: Create Boot Stage

**File**: `systems/devpulse-engine/src/platform/boot/model_loader.rs` (NEW)

Pattern: copy from `embedder.rs`. Boot sequence:
1. Create `MemoryConfig`
2. Create `TracingEventSink` (→ later `TauriEventBridge`)
3. Resolve `models_dir` = `{data_dir}/models/`
4. `ModelLoaderService::new(config, events, models_dir)`
5. Register default slots: `devpulse_default_slots()`
6. `restore_assignments()`
7. `scan_models()`

### Task 1.5: Wire Into Boot Sequence

**File**: `systems/devpulse-engine/src/platform/boot/mod.rs`

Add stage after embedder/whisper, before devforge. Add to `BootedServices` struct.

### Task 1.6: Wire Platform Struct

**File**: `systems/devpulse-engine/src/platform/mod.rs`

- Add field: `#[cfg(feature = "inference")] model_loader: Option<Arc<ModelLoaderService>>`
- Add accessor: `pub fn model_loader() -> Option<&Arc<ModelLoaderService>>`
- Add to `health()` checks
- Add to `shutdown()` (reverse order)
- Add to `boot()` constructor

### Task 1.7: Compile + Boot Test

```bash
cargo check -p devpulse-engine --features inference
cargo xtask run-dev  # verify boot logs show "Model Loader" stage
```

### GATE: Boot log shows `[+] Model Loader (Xms)`. Health endpoint includes it.

---

## PHASE 2: TAURI COMMANDS — Replace Stubs With Real Calls

**Goal**: Every Tauri command delegates to the real ModelLoaderService.

### Task 2.1: Rewrite `get_hardware_metrics`

**File**: `src-tauri/src/commands/models/mod.rs`

Delegate to `model_loader.hardware_metrics()` instead of `ProcessMetrics`. Returns full GPU data.

### Task 2.2: Rewrite `scan_models`

Delegate to `model_loader.scan_models()`. Return real `Vec<ModelRegistryEntry>`.

### Task 2.3: Rewrite `get_slots`

Delegate to `model_loader.list_slots()`. Map `&Slot` → serializable form.

### Task 2.4: Rewrite `is_first_run`

Delegate to `model_loader.is_first_run()`.

### Task 2.5: Add Missing Commands

New commands (register in specta builder):

```rust
#[tauri::command] pub async fn assign_model_to_slot(slot_id: String, model_id: String) -> Result<(), String>
#[tauri::command] pub async fn load_slot(slot_id: String) -> Result<(), String>
#[tauri::command] pub async fn unload_slot(slot_id: String) -> Result<(), String>
#[tauri::command] pub async fn download_model(repo_id: String, filename: String) -> Result<String, String>
#[tauri::command] pub async fn cancel_download(download_id: String) -> Result<(), String>
#[tauri::command] pub async fn auto_configure() -> Result<AutoConfig, String>
#[tauri::command] pub async fn get_slot_status(slot_id: String) -> Result<SlotStatus, String>
```

### Task 2.6: Add HuggingFace Search Command

**File**: `src-tauri/src/commands/models/search.rs` (NEW)

```rust
#[tauri::command]
#[specta::specta]
pub async fn search_huggingface(
    query: String,
    filter_capability: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<HfSearchResult>, String>
```

### STOP — Owner Decision Required
**Question**: Where does HF search happen?
**Options**:
- A) **Rust-side** (reqwest in Tauri command) — No CORS, caches, consistent with local-first. Adds reqwest dep.
- B) **Frontend fetch** — Simpler, no new dep, but CORS issues with HF API, breaks local-first pattern.
- C) **Proxy through model-loader crate** — Cleanest encapsulation, search is a model-loader concern.
**Recommendation**: Option C — add `search_huggingface()` to `ModelLoaderService` using reqwest.
**Impact**: Adds `reqwest` to model-loader deps. Search results include file listing for GGUF filter.

### Task 2.7: Define `HfSearchResult` Type

```rust
pub struct HfSearchResult {
    pub repo_id: String,           // e.g. "bartowski/Qwen3-14B-GGUF"
    pub author: String,
    pub model_name: String,        // display name
    pub downloads: u64,
    pub likes: u64,
    pub pipeline_tag: Option<String>,  // "text-generation", "feature-extraction"
    pub tags: Vec<String>,
    pub gguf_files: Vec<HfFileInfo>,   // only .gguf files from siblings
    pub last_modified: String,
}

pub struct HfFileInfo {
    pub filename: String,          // "Qwen3-14B-Q4_K_M.gguf"
    pub size_bytes: u64,
    pub quant_level: Option<String>,  // inferred from filename
}
```

### Task 2.8: Wire Event Bridge (Download Progress → Frontend)

**File**: `src-tauri/src/commands/models/events.rs` (NEW)

Create `TauriEventBridge` implementing `LoaderEventSink`:
- `DownloadStarted` → emit `"model:download-started"` Tauri event
- `DownloadProgress` → emit `"model:download-progress"` Tauri event
- `DownloadComplete` → emit `"model:download-complete"` Tauri event
- `LoadingStarted/Stage/Complete/Failed` → emit `"model:loading-*"` events
- `HardwareMetricsUpdated` → emit `"model:hardware-updated"` event

### Task 2.9: Compile + Verify All Commands

```bash
cargo check -p desktop --features inference
```

All commands compile. Specta generates updated `bindings.ts`.

### GATE: Every Tauri command does real work. Zero stubs remain. Specta bindings updated.

---

## PHASE 3: FRONTEND WIRING — Make Existing UI Work

**Goal**: Existing components render real data. Route page works.

### Task 3.1: Update Frontend Services

**File**: `services/registry.service.ts`, `slots.service.ts`, `hardware.service.ts`

Update invoke calls to match any renamed commands. Add new service functions:
- `downloadModel(repoId, filename): Promise<string>`
- `cancelDownload(downloadId): Promise<void>`
- `autoConfigureHardware(): Promise<AutoConfig>`
- `getSlotStatus(slotId): Promise<SlotStatus>`

### Task 3.2: Add Event Listeners to Runes

**File**: `runes/models.runes.svelte.ts`

Subscribe to Tauri events:
- `"model:download-progress"` → update download state
- `"model:download-complete"` → refresh registry
- `"model:loading-started/stage/complete/failed"` → update slot statuses
- `"model:hardware-updated"` → update hardware state

### Task 3.3: Wire SetupWizard to Real Downloads

**File**: `components/SetupWizard.svelte`

Replace `handleSetup()` setTimeout loop with:
1. Call `autoConfigureHardware()` to get tier recommendations
2. For each recommendation: call `downloadModel(rec.modelRepoId, rec.modelFilename)`
3. Listen to `"model:download-progress"` events for progress bar
4. On all downloads complete → auto-assign to slots → step = "ready"

### Task 3.4: Wire Route Page

**File**: `routes/(model-loader)/model-loader/+page.svelte`

Replace skeleton Card with `<ModelLoaderPanel />`. The component already handles everything.

### Task 3.5: Compile + Visual Check

```bash
cd interfaces/desktop && pnpm svelte-check
cargo xtask run-dev  # verify UI renders real data
```

### GATE: ModelLoaderPanel shows real hardware metrics, real slots (8 default), real scan results. SetupWizard downloads real models from HF.

---

## PHASE 4: HUGGINGFACE SEARCH UI — The Missing Feature

**Goal**: Users can search HuggingFace for models, see friendly results with icons, download with one click.

### STOP — Owner Decision Required
**Question**: You said "emoji/icons i make and provide" for search results. What specific icons/emojis do you have or want? Options:
- A) I use lucide-svelte icons (already in deps) as placeholders, you replace later
- B) You provide icon assets now (SVG/PNG/emoji mappings) and I wire them
- C) We define the icon mapping contract (capability → icon) and you fill it in
**Impact**: Determines whether Phase 4 blocks on asset delivery.

### STOP — Owner Decision Required
**Question**: Where does the search UI live?
**Options**:
- A) Inside ModelLoaderPanel (new section, toggled by "Download Model" button)
- B) Separate route `/model-loader/search`
- C) Dialog/modal overlay from ModelLoaderPanel
**Recommendation**: A — keeps everything in one place, matches layman-friendly flow.
**Impact**: Determines component structure.

### Task 4.1: Create Search Service

**File**: `services/search.service.ts` (NEW)

```typescript
export async function searchHuggingFace(
  query: string,
  filterCapability?: ModelCapability,
  limit?: number,
): Promise<HfSearchResult[]>
```

### Task 4.2: Create Search State Rune

**File**: `runes/search.runes.svelte.ts` (NEW)

```typescript
class SearchState {
  query = $state("")
  results = $state<HfSearchResult[]>([])
  searching = $state(false)
  error = $state<string | null>(null)
  filterCapability = $state<ModelCapability | null>(null)

  async search(): Promise<void>
  clear(): void
}
export const searchState = new SearchState()
```

### Task 4.3: Create HfModelCard Component

**File**: `components/HfModelCard.svelte` (NEW)

Per search result:
- Model name + author
- Download count + likes (formatted)
- Pipeline tag badge
- GGUF file list (expandable)
  - Per file: filename, size, quant level, "Download" button
  - Fit indicator (green/yellow/red) based on current hardware
- Icon/emoji per capability type (see Task 4.5)

### Task 4.4: Create ModelSearch Component

**File**: `components/ModelSearch.svelte` (NEW)

- Search input with debounce (300ms)
- Capability filter chips (All, Chat, Embedding, Vision, Voice)
- Results grid of HfModelCard
- Empty state: "Search HuggingFace for AI models"
- Loading state: spinner
- Error state: error message with retry

### Task 4.5: Define Icon/Emoji Mapping

### STOP — Owner Decision Required
**Question**: What icons represent each capability? Proposed mapping:
```
text_generation  → 🧠 Brain / MessageSquare icon
embedding        → 🔍 Search / Layers icon
reranking        → 📊 Ranking / ArrowUpDown icon
vision_language  → 👁️ Eye / ScanEye icon
vision_embedding → 🖼️ Image / ImageIcon icon
speech_to_text   → 🎤 Mic / Mic icon
text_to_speech   → 🔊 Speaker / Volume2 icon
```
**Options**:
- A) Use these emoji + lucide icons
- B) You provide custom icons/assets
- C) Different mapping entirely
**Impact**: Visual identity of search results.

### Task 4.6: Wire Search Into ModelLoaderPanel

**File**: `components/ModelLoaderPanel.svelte`

Add search section (toggled by "Download Model" button):
- When clicked: show `<ModelSearch />` inline below actions
- When a model file is downloaded: auto-refresh registry, show in slot assignment

### Task 4.7: Download Progress Inline

When user clicks "Download" on an HF file:
1. `downloadModel(repoId, filename)` → returns downloadId
2. HfModelCard shows inline progress bar for that file
3. On complete: badge changes to "Downloaded ✓"
4. Registry auto-refreshes

### Task 4.8: Compile + Visual Check

```bash
pnpm svelte-check
cargo xtask run-dev  # test search, download, assign flow
```

### GATE: Can search HF, see results with icons, download a model, see it in registry, assign to slot.

---

## PHASE 5: POLISH — CSS, Layman UX, Edge Cases

**Goal**: Everything renders correctly, layman mode is actually friendly, edge cases handled.

### Task 5.1: Audit CSS Rendering

Check that all `resolveMacro()` kinds used in model components are registered:
- `model-panel`, `model-error`, `model-metrics`, `model-action`
- `setup-wizard`, `setup-action`, `setup-ready`, `setup-progress`, `setup-rec`
- `slot-row`, `slot-picker`, `subsystem-group`
- `vram-gauge`, `clyffy-narration`, `model-event-card`, `model-event-narration`
- NEW: `hf-model-card`, `model-search`, `hf-file-row`

If any kind is not in the macro registry → add it with appropriate preset defaults.

### STOP — Owner Decision Required
**Question**: Are these macro kinds registered in the style system, or do they fall through to defaults? If fallthrough, the CSS works but uses generic vars. Is that acceptable for now?
**Options**:
- A) Register each kind with specific preset values (full design pass)
- B) Let them fall through to defaults (works, looks generic)
- C) Add them to a "model-loader" family with shared base values
**Impact**: Visual polish level. Option B ships faster. Option A looks better.

### Task 5.2: Layman Mode Improvements

- Friendly slot labels already exist (`friendlySlotLabel()` in types)
- Add friendly model names: "Qwen3-14B-Q4_K_M.gguf" → "Qwen 3 (14 billion, medium quality)"
- Add plain-English VRAM fit: "Easy fit" / "Tight fit" / "Won't fit" / "CPU mode"
- Add "What is this?" tooltips for each slot in layman mode

### Task 5.3: Error State UX

- No GPU: Show CPU-mode badge, hide VRAM gauge, adjust recommendations
- Download failed: Show retry button, error message in plain English
- Model incompatible: Show "This model can't do {capability}" with suggestion
- Disk full: Show "Not enough space — need {X}GB, have {Y}GB"

### Task 5.4: Empty State UX

- No models downloaded: Show ClyffyNarration "Let me help you set up your AI" + prominent search
- No search results: "No models found for '{query}'. Try a different search."
- No GPU detected: "Running in CPU mode — models will be slower but everything works."

### Task 5.5: Final Compile + Full Flow Test

```bash
cargo check -p desktop --features inference
cd interfaces/desktop && pnpm svelte-check && pnpm build
cargo xtask run-dev
```

Test full flow:
1. App boots → Model Loader stage in boot log
2. OverMind shows ModelLoaderPanel with real hardware
3. First run → SetupWizard with real recommendations
4. Search HF → results with icons
5. Download model → real progress
6. Assign to slot → load → inference test

### GATE: Full flow works end-to-end. Layman can set up AI without knowing what GGUF means.

---

## File Manifest

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `engine/src/platform/services/model_loader.rs` | 1 | Service wrapper |
| `engine/src/platform/boot/model_loader.rs` | 1 | Boot stage |
| `src-tauri/src/commands/models/search.rs` | 2 | HF search command |
| `src-tauri/src/commands/models/events.rs` | 2 | Tauri event bridge |
| `domains/app/models/services/search.service.ts` | 4 | Search service |
| `domains/app/models/runes/search.runes.svelte.ts` | 4 | Search state |
| `domains/app/models/components/ModelSearch.svelte` | 4 | Search UI |
| `domains/app/models/components/HfModelCard.svelte` | 4 | Search result card |

### Modified Files
| File | Phase | Change |
|------|-------|--------|
| `kernel/model-loader/Cargo.toml` | 0 | Add specta optional dep |
| `kernel/model-loader/src/**/*.rs` (6 files) | 0 | Add specta derives |
| `src-tauri/Cargo.toml` | 0 | Enable inference feature |
| `src-tauri/src/commands/models/mod.rs` | 0,2 | Delete dupes, rewrite stubs |
| `src-tauri/src/lib.rs` | 2 | Register new commands |
| `engine/src/platform/services/mod.rs` | 1 | Add ModelLoader variant |
| `engine/src/platform/mod.rs` | 1 | Add field, accessor, health, shutdown |
| `engine/src/platform/boot/mod.rs` | 1 | Add boot stage |
| `engine/src/platform/config.rs` | 1 | Add config entry |
| `engine/platform.default.toml` | 1 | Add config section |
| `domains/app/models/services/*.ts` | 3 | Add new service functions |
| `domains/app/models/runes/models.runes.svelte.ts` | 3 | Add event listeners |
| `domains/app/models/components/SetupWizard.svelte` | 3 | Wire real downloads |
| `domains/app/models/components/ModelLoaderPanel.svelte` | 4 | Add search section |
| `routes/(model-loader)/model-loader/+page.svelte` | 3 | Use ModelLoaderPanel |

### Deleted
| File/Code | Phase | Why |
|-----------|-------|-----|
| `HardwareInfo` struct (Tauri) | 0 | Duplicate of model-loader type |
| `ModelInfo` struct (Tauri) | 0 | Duplicate of model-loader type |
| `SlotInfo` struct (Tauri) | 0 | Duplicate of model-loader type |
| setTimeout fake download | 3 | Replaced with real HF download |

---

## Estimated Scope

| Phase | Files Changed | New Files | Complexity |
|-------|--------------|-----------|------------|
| 0: Consolidation | 8 | 0 | Low — delete dupes, add derives |
| 1: Engine Wiring | 6 | 2 | Medium — follow existing pattern |
| 2: Tauri Commands | 3 | 2 | Medium — delegate to service |
| 3: Frontend Wiring | 5 | 0 | Low — update existing code |
| 4: Search UI | 2 | 4 | Medium — new components |
| 5: Polish | 5 | 0 | Low — CSS, copy, edge cases |
| **Total** | **29** | **8** | |
