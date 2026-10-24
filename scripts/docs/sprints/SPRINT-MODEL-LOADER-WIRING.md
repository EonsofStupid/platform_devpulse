# SPRINT: Model Loader Wiring — Make It Real

**Date**: 2026-04-01
**Status**: PLAN — Owner approval required before execution
**Supersedes**: SPRINT-MODEL-LOADER-REAL.md Phases 0-1 (already done on disk)

---

## WHAT EXISTS ON DISK (Verified)

| Layer | Status | Evidence |
|-------|--------|----------|
| `kernel/model-loader/` crate | REAL | 30 files, ~3,500 lines. GGUF parsing, HF downloads, candle backend, slot registry, VRAM budget, inference bridge |
| Engine service wrapper | REAL | `services/model_loader.rs` (182 lines), Mutex-wrapped, boots from config |
| Engine boot stage | REAL | `boot/model_loader.rs` (84 lines), logs to boot.log |
| 8 default slots | REAL | `integrations/slots.rs` — brain, minion, embedder, reranker, vision, stt, tts |
| Narration system | REAL | `integrations/narration.rs` — layman + advanced messages |
| 12 Tauri commands | REAL | `commands/models/mod.rs` — hardware, scan, slots, assign, load, unload, download, search, auto-configure |
| 9 frontend components | REAL | ModelLoaderPanel, SetupWizard, BootSetupWizard, HfModelCard, ModelSearch, SubsystemGroup, SlotRow, VramGauge, ClyffyNarration |
| 7 services + 3 rune stores | REAL | Hardware polling, model registry, search, downloads — all wired to real Tauri commands |

## WHAT DOES NOT WORK

| Problem | Root Cause | Impact |
|---------|-----------|--------|
| `inference_generate` is a stub | Returns error always — never wired to InferenceHandle | Clyffy can't speak |
| No TauriEventBridge | Events go to file log, frontend doesn't get real-time loading progress | UI blind during load |
| No swap protection | Model load/unload runs while user can click around | Potential crash during weight swap |
| Pool resource leak on failed load | `pool.release()` never called on acquire failure | VRAM leaks on repeated failures |
| No partial-load cleanup | Backend.unload() not called if load fails mid-way | Weights stuck in GPU memory |
| `.expect()` in bridge.rs:216 | Thread spawn panic instead of error | Crash instead of hard fail |
| No mix validation | Can assign models that exceed total VRAM budget | OOM when loading the combination |
| Boot crash gives zero console output | Errors swallowed or only in boot.log, not stderr | Owner sees crash with no explanation |

---

## PHASE 1: SAFETY — Swap Protection + Resource Cleanup

**Goal**: Model load/unload cannot crash the app. Failed loads clean up. Errors are visible.

### Task 1.1: Fix Pool Resource Leak on Failed Load

**File**: `kernel/model-loader/src/service.rs` ~line 378

Currently: acquire() fails → status set to Failed → no pool.release() called → VRAM leak.

Fix: Wrap acquire in proper cleanup. If load fails after bridge is created, call pool.release() to free the reference.

### Task 1.2: Fix Partial-Load Cleanup in Backend

**File**: `kernel/model-loader/src/backends/bridge.rs`

Currently: If backend.load() fails mid-way, no unload called. Candle may have partially allocated weights.

Fix: In the bridge thread loop, if Load request fails, call backend.unload() before sending error reply. Swallow unload errors (best-effort cleanup).

### Task 1.3: Replace .expect() with Hard Fail Error

**File**: `kernel/model-loader/src/backends/bridge.rs:216`

Currently: `thread::Builder::new().spawn(...).expect("Failed to spawn")` — panics.

Fix: Return `LoaderError::Internal` with clear message. No panics in production code.

### Task 1.4: Add Unload Retry (2x then hard fail)

**File**: `kernel/model-loader/src/service.rs` (unload_slot method)

Currently: Single unload attempt, error propagated.

Fix: Retry unload twice with 500ms delay between attempts. If both fail, hard fail with error message that includes what slot, what model, and the error from both attempts.

### Task 1.5: Mix Budget Validation on Assign

**File**: `kernel/model-loader/src/service.rs` (assign_model method)

Currently: Any model can be assigned to any compatible slot regardless of total budget.

Fix: Before assigning, compute what the total VRAM would be if this model were loaded alongside all currently-loaded models. If it exceeds available VRAM (with 10% headroom), return error with:
- "This model needs {X}MB but you only have {Y}MB free"
- Suggestion: "Unload {slot} to free {Z}MB"

### Task 1.6: Ensure Boot Errors Reach Console

**File**: `systems/devpulse-engine/src/platform/boot/model_loader.rs`

Currently: Boot failure logged to boot.log but may not reach stderr clearly.

Fix: On any boot failure, emit `tracing::error!()` (which hits stderr) AND write to boot.log. The error must include: what stage failed, what the error was, and what to do about it.

**Gate**: `cargo check -p model-loader` + `cargo check -p devpulse-engine`. No `.expect()` in model-loader crate. Pool cleanup verified by reading the error path.

---

## PHASE 2: SWAP OVERLAY — Full-Screen Block During Model Operations

**Goal**: When a model is loading/unloading/swapping, a full-screen overlay prevents user interaction. Only for model operations — everything else runs normally.

### Task 2.1: Create SwapOverlay Component

**File**: `interfaces/desktop/src/lib/domains/app/models/components/SwapOverlay.svelte` (NEW)

Full-screen fixed overlay (z-50) that:
- Shows Clyffy narration message ("Loading up the AI Brain...")
- Shows progress stage (Verifying → Allocating → Loading Weights → Warming Up)
- Shows which slot is being loaded/unloaded
- Shows memory footprint being consumed
- Blocks all pointer events (`pointer-events-none` on content behind)
- Dismisses automatically when operation completes or fails
- On failure: shows error message + "Got it" dismiss button

Uses `resolveMacro()` with kind `swap-overlay`. TailwindCSS 4. Svelte 5 runes.

### Task 2.2: Create Swap State Rune

**File**: `interfaces/desktop/src/lib/domains/app/models/runes/swap.runes.svelte.ts` (NEW)

```
class SwapState {
  active: boolean          — is a swap in progress?
  slotId: string | null    — which slot
  operation: 'load' | 'unload' | null
  stage: string | null     — loading stage name
  progress: number         — 0-100
  error: string | null     — failure message
  
  startLoad(slotId): void
  startUnload(slotId): void
  updateStage(stage, progress): void
  complete(): void
  fail(error): void
}
```

### Task 2.3: Wire SwapOverlay Into App Layout

**File**: `interfaces/desktop/src/lib/layouts/app/Frame.svelte`

Add `<SwapOverlay />` at the top level, outside all other content. It renders based on `swapState.active`. When active, it sits above everything.

### Task 2.4: Wire Load/Unload Through Swap State

**File**: `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts`

Update `load()` and `unload()` methods:
1. Set `swapState.startLoad(slotId)` BEFORE calling Tauri command
2. On success: `swapState.complete()`
3. On failure: `swapState.fail(error.message)`

### Task 2.5: Wire TauriEventBridge for Loading Progress

**File**: `systems/devpulse-engine/src/platform/integrations/events.rs`

Replace TODO with real `TauriEventBridge`:
- Implements `LoaderEventSink` 
- On `LoadingStarted` → emit `"model:loading-started"` Tauri event
- On `LoadingStage` → emit `"model:loading-stage"` with stage name + progress
- On `LoadingComplete` → emit `"model:loading-complete"` with memory footprint
- On `LoadingFailed` → emit `"model:loading-failed"` with error
- On `UnloadComplete` → emit `"model:unload-complete"`

This requires the `AppHandle` passed during boot. The bridge stores `Arc<AppHandle>` and calls `app.emit()`.

### Task 2.6: Wire Frontend Event Listeners to Swap State

**File**: `interfaces/desktop/src/lib/domains/app/models/runes/swap.runes.svelte.ts`

Listen to Tauri events:
- `"model:loading-stage"` → `swapState.updateStage(stage, progress)`
- `"model:loading-complete"` → `swapState.complete()`
- `"model:loading-failed"` → `swapState.fail(error)`
- `"model:unload-complete"` → `swapState.complete()`

**Gate**: `pnpm svelte-check`. SwapOverlay renders during load. Dismisses on complete/fail. User can't click through it.

---

## PHASE 3: INFERENCE — Wire generate Command

**Goal**: `inference_generate` calls real InferenceHandle. Clyffy can respond.

### Task 3.1: Wire inference_generate to Real Handle

**File**: `interfaces/desktop/src-tauri/src/commands/models/mod.rs`

Replace stub with:
1. Get model_loader service from app state
2. Get inference handle for the requested slot: `loader.inference_handle(slot_id)`
3. If no handle (model not loaded): hard fail with "No model loaded in slot '{slot_id}'. Load a model first."
4. Call `handle.generate(prompt, max_tokens, temperature, token_sink)`
5. Collect tokens from the flume receiver
6. Return complete text

### Task 3.2: Wire Streaming Token Events

For streaming responses:
1. Create a flume channel pair in the command
2. Pass sender as `token_sink` to `handle.generate()`
3. Spawn task that reads from receiver and emits `"inference-token"` Tauri events
4. Frontend `onInferenceToken` listener already exists in `inference.service.ts`

### Task 3.3: Hard Fail inference_generate When No Model

Currently returns a friendly error string. Change to return structured error that the frontend can distinguish:
- `NO_MODEL_LOADED` — slot exists but nothing loaded
- `SLOT_NOT_FOUND` — invalid slot id
- `INFERENCE_FAILED` — model loaded but generation failed (with error detail)

**Gate**: `cargo check -p devpulse_desktop_backend`. Can call inference_generate with a loaded model and get tokens back.

---

## PHASE 4: CONFIGURABILITY — Dynamic Mix Management

**Goal**: System adapts to actual hardware. User can swap individual pieces. Total budget enforced.

### Task 4.1: Budget Enforcement UI in SlotRow

**File**: `interfaces/desktop/src/lib/domains/app/models/components/SlotRow.svelte`

When user picks a model from the dropdown:
- Show estimated VRAM for that model
- Show remaining budget after all other loaded models
- If it won't fit: disable the "Load" button, show "Won't fit — need {X}MB, have {Y}MB free"
- Suggestion: "Unload {other_slot} to free {Z}MB"

### Task 4.2: Total Budget Display in ModelLoaderPanel

**File**: `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte`

Add a budget summary bar at the top:
- Total available: {VRAM or RAM}
- Used by loaded models: {sum of loaded footprints}
- Each loaded slot shows its portion as a colored segment
- Labels: "AI Brain: 3.2GB | Voice: 0.5GB | Search: 0.3GB — 4.0GB of 8.0GB"

### Task 4.3: Auto-Configure Respects Current State

**File**: `kernel/model-loader/src/hardware/auto_config.rs`

Currently: Recommendations are hardcoded per tier, ignoring what's already loaded.

Fix: `auto_configure()` should subtract already-loaded models from the budget before recommending. If brain is already loaded, don't recommend it again.

### Task 4.4: Slot-Level Device Override

Currently: `DevicePreference` is set at slot registration. User can't change it.

Add a Tauri command `set_slot_device_preference(slot_id, preference)` so the user can force a slot to CPU if they want to free VRAM for the brain model. This is configurability — let the user decide the mix.

**Gate**: Budget bar shows accurate totals. Can't load a mix that exceeds budget. Auto-configure skips already-loaded models.

---

## PHASE 5: BOOT RELIABILITY — Zero Silent Crashes

**Goal**: `cargo xtask run-dev` never crashes without clear console output explaining why.

### Task 5.1: Audit Every Boot Stage for Error Visibility

Every boot stage in `boot/mod.rs` must:
- Emit `tracing::error!()` on failure (hits stderr)
- Write to boot.log with stage name and timing
- Include actionable message: what failed, what the error was, what to try

### Task 5.2: Model Loader Boot Stage — Graceful Degradation

If model-loader boot fails (e.g., models dir can't be created):
- Log clear error to stderr AND boot.log
- Continue boot in degraded mode (model_loader = None)
- StatusBar shows "Model Loader: offline" 
- User sees why in boot.log

### Task 5.3: Add Boot Summary to Console

At end of boot, print a one-line summary to stderr:
```
[boot] 12/14 services ready in 2.3s | FAILED: Model Loader (models dir missing)
```

Or on success:
```
[boot] 14/14 services ready in 2.3s | all critical services healthy
```

This is what the owner sees in the terminal. No guessing.

**Gate**: `cargo xtask run-dev` with intentionally broken config → clear error in terminal. Fix config → clean boot with summary line.

---

## FILE MANIFEST

### New Files
| File | Phase | Purpose |
|------|-------|---------|
| `domains/app/models/components/SwapOverlay.svelte` | 2 | Full-screen block during model ops |
| `domains/app/models/runes/swap.runes.svelte.ts` | 2 | Swap operation state |

### Modified Files
| File | Phase | Change |
|------|-------|--------|
| `kernel/model-loader/src/service.rs` | 1 | Pool cleanup on failed load, unload retry, budget validation |
| `kernel/model-loader/src/backends/bridge.rs` | 1 | Partial-load cleanup, remove .expect() |
| `systems/devpulse-engine/src/platform/boot/model_loader.rs` | 1,5 | Error visibility |
| `systems/devpulse-engine/src/platform/integrations/events.rs` | 2 | TauriEventBridge |
| `interfaces/desktop/src-tauri/src/commands/models/mod.rs` | 3 | Wire inference_generate |
| `interfaces/desktop/src/lib/layouts/app/Frame.svelte` | 2 | Add SwapOverlay |
| `domains/app/models/runes/models.runes.svelte.ts` | 2 | Wire load/unload through swap state |
| `domains/app/models/components/SlotRow.svelte` | 4 | Budget enforcement in UI |
| `domains/app/models/components/ModelLoaderPanel.svelte` | 4 | Budget summary bar |
| `kernel/model-loader/src/hardware/auto_config.rs` | 4 | Respect current state |
| `systems/devpulse-engine/src/platform/boot/mod.rs` | 5 | Boot summary line |

---

## EXECUTION ORDER

```
Phase 1 (safety)     → Phase 2 (swap overlay)  → Phase 3 (inference)
    ~2 hours               ~2 hours                  ~1 hour
                                                        ↓
                    Phase 4 (configurability) → Phase 5 (boot reliability)
                         ~2 hours                  ~1 hour
```

Phase 1 MUST be first — no point building UI for loading if loading can leak VRAM.
Phase 2 needs Phase 1's cleanup guarantees.
Phase 3 is independent but needs Phase 2's event bridge.
Phase 4 builds on everything working.
Phase 5 can run anytime but makes everything else debuggable.

**Total: ~8 hours. 13 files. 2 new, 11 modified. Zero stubs when done.**

---

## WHAT THIS SPRINT DOES NOT COVER

| Item | Why Deferred |
|------|-------------|
| LibSqlConfig (persist assignments to DB) | MemoryConfig works for dev, DB persistence is a separate concern |
| Hot-swap (load new model while old serves) | Needs swap.rs implemented, complex — overlay approach is safer for now |
| Download resume across restarts | HF-hub handles caching, good enough for now |
| Custom model import (non-HF) | Scan already picks up any GGUF in models dir |
| Model quantization selection UI | HfModelCard already shows quant levels per file |

---

*When this sprint is done: models load/unload safely behind an overlay, failed loads clean up properly, inference works end-to-end, the mix is budget-validated, and boot never crashes silently.*
