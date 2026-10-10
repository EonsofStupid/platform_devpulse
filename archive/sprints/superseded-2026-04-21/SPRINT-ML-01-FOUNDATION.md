> # ☠️ SUPERSEDED — DO NOT EXECUTE
>
> **This sprint doc is DEAD.** The model-loader / setup-wizard work has been
> re-chartered under `POAM-MODEL-LOADER-WIZARD.md`, which embeds the 10
> Commandments verbatim as the workflow SSOT.
>
> - Do not plan against this file.
> - Do not cite "DONE" items below as evidence of working behavior.
> - If you need historical context, read this as archaeology, not authority.
>
> **Go to:** `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# SPRINT ML-01: Foundation — Boot Unblock + Type Safety

> **Status**: PLAN — Owner approval required
> **POA&M**: Milestone M1
> **Scope**: 7 files changed, 2 files deleted
> **Verification**: `cargo check -p devpulse-engine` + `pnpm svelte-check` after every phase

---

## What This Sprint Fixes

The model loader kernel works. The Tauri commands work. The frontend components exist.
But the system cannot function because:

1. **Boot ordering**: SurrealDB (Stage 4) blocks Model Loader (Stage 12) — 3-7s delay, zero shared dependency
2. **Type mismatch**: `slots.service.ts` and `registry.service.ts` use raw `invoke()` with camelCase types, but Rust sends snake_case. Every field access is `undefined` at runtime.
3. **Dead wizard**: `BootSetupWizard` (6-step, complete) is orphaned. `SetupWizard` (4-step, worse) is active.
4. **CSS bug**: `var(-bg)` missing `--` prefix in ModelLoaderPanel
5. **No status listener**: `platform:models-status` event emitted by Rust but nothing consumes it

---

## PHASE 1: Parallel Boot — Model Loader Independent of SurrealDB

### Files
- `systems/devpulse-engine/src/platform/boot/mod.rs`

### What Changes

The `execute_inner` function currently runs all 14 stages sequentially. Model Loader at Stage 12 has ZERO dependency on SurrealDB at Stage 4.

**Change**: After Stage 1 (preflight) completes, spawn Model Loader boot as a parallel task using `tokio::spawn`. The main pipeline continues with Stages 2-11 as before. Before Stage 14 (validate), `join` the Model Loader task.

```
BEFORE:                          AFTER:
Stage 1  preflight               Stage 1  preflight
Stage 2  libsql                  Stage 2  libsql          ┐
Stage 3  duckdb                  Stage 3  duckdb          │
Stage 4  surrealdb (3-7s)       Stage 4  surrealdb       ├─ PARALLEL: model_loader
Stage 5  moka                    Stage 5  moka            │
Stage 6  user libsql             Stage 6  user libsql     │
Stage 7  vector                  Stage 7  vector          ┘
...                              Stage 8-11 ...
Stage 12 model_loader            Stage 12 join model_loader task
Stage 13 devforge                Stage 13 devforge
Stage 14 validate                Stage 14 validate
```

### Specific Code Change

In `execute_inner`, after preflight:

```rust
// Spawn model loader in parallel — it has zero dependency on other stages
let ml_handle = {
    let dd = data_dir.to_path_buf();
    let bc = boot_config.clone();
    let bl = boot_log.clone();
    let sink = model_event_sink.clone();
    tokio::spawn(async move {
        boot::model_loader::boot(&dd, &bc, &bl, sink).await
    })
};

// ... stages 2-11 run as before ...

// Join model loader before validate
let model_loader_result = ml_handle.await
    .map_err(|e| anyhow::anyhow!("Model loader task panicked: {e}"))?;
booted.model_loader = model_loader_result;
```

### Task Checklist
- [ ] 1.1: Read `boot/mod.rs` execute_inner function (full, with offsets)
- [ ] 1.2: Identify exact insertion points for spawn and join
- [ ] 1.3: Verify `boot_config` implements Clone (or wrap in Arc)
- [ ] 1.4: Verify `boot_log` is Send + Sync (it's Arc<Mutex>)
- [ ] 1.5: Move model loader spawn after Stage 1, join before Stage 14
- [ ] 1.6: Wrap `HardwareMonitor::new()` call in `spawn_blocking` (it sleeps 200ms)
- [ ] 1.7: `cargo check -p devpulse-engine`
- [ ] 1.8: Verify boot log still shows model loader timing

**Gate**: `cargo check -p devpulse-engine` passes. Model loader no longer blocked by SurrealDB.

---

## PHASE 2: Fix Frontend Type Shapes — Kill camelCase Domain Types

### Files
- `interfaces/desktop/src/lib/domains/app/models/services/slots.service.ts` — REWRITE
- `interfaces/desktop/src/lib/domains/app/models/services/registry.service.ts` — REWRITE
- `interfaces/desktop/src/lib/domains/app/models/services/download.service.ts` — REWRITE
- `interfaces/desktop/src/lib/domains/app/models/services/inference.service.ts` — REWRITE
- `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts` — DELETE

### What Changes

Four services use raw `invoke<T>()` with manually-typed camelCase interfaces. The specta-generated bindings at `src/lib/sys/generated/bindings.ts` have the correct snake_case types that match what Rust actually sends.

**Change**: Rewrite all four services to use `commands.*` from bindings (same pattern as `hardware.service.ts` and `search.service.ts` already use). Delete the duplicate `models.types.ts` file entirely. Update all imports across the domain.

### Specific Changes Per File

**`slots.service.ts`** — Currently:
```typescript
import { invoke } from '@tauri-apps/api/core';
import type { SlotInfo } from '../types/models.types.js';
export async function getSlots(): Promise<SlotInfo[]> {
    return invoke<SlotInfo[]>('get_slots');
}
```
Change to:
```typescript
import { commands } from '$lib/sys/generated/bindings.js';
export async function getSlots() {
    return commands.getSlots();
}
```

Same pattern for `registry.service.ts`, `download.service.ts`, `inference.service.ts`.

**`models.types.ts`** — DELETE. All types come from bindings. Any component importing from this file must switch to importing from bindings.

### Task Checklist
- [ ] 2.1: Read current `bindings.ts` — confirm SlotInfo, ModelRegistryEntry, HardwareInfo types exist with snake_case
- [ ] 2.2: Read each of the 4 services — note every import and function signature
- [ ] 2.3: Read `models.types.ts` — list every type exported
- [ ] 2.4: Grep for every import of `models.types` across the codebase — list all consumers
- [ ] 2.5: Rewrite `slots.service.ts` to use `commands.*`
- [ ] 2.6: Rewrite `registry.service.ts` to use `commands.*`
- [ ] 2.7: Rewrite `download.service.ts` to use `commands.*`
- [ ] 2.8: Rewrite `inference.service.ts` to use `commands.*`
- [ ] 2.9: Update all imports from `models.types.ts` → `bindings.ts` types
- [ ] 2.10: Delete `models.types.ts`
- [ ] 2.11: Update runes files if they reference domain types
- [ ] 2.12: `pnpm svelte-check` — zero errors

**Gate**: `pnpm svelte-check` passes. No file imports from `models.types.ts`. All slot data fields resolve correctly.

---

## PHASE 3: Consolidate Wizard + Fix CSS + Wire Status Event

### Files
- `interfaces/desktop/src/lib/domains/app/models/components/ModelLoaderPanel.svelte` — fix CSS, switch wizard
- `interfaces/desktop/src/lib/domains/app/models/components/SetupWizard.svelte` — DELETE
- `interfaces/desktop/src/lib/domains/app/models/index.ts` — export BootSetupWizard
- `interfaces/desktop/src/lib/domains/app/models/components/SwapOverlay.svelte` — replace emoji with text

### What Changes

1. **Wizard**: `ModelLoaderPanel` imports `SetupWizard`. Change to import `BootSetupWizard`. Delete `SetupWizard.svelte`.
2. **CSS**: Fix `var(-bg)` → `var(--bg)` in ModelLoaderPanel line 118.
3. **Emoji**: Replace `⚠️` and `🧠` in SwapOverlay with text labels or ColdLight tokens.
4. **Exports**: Add `BootSetupWizard` to domain `index.ts`.

### Task Checklist
- [ ] 3.1: Read `ModelLoaderPanel.svelte` — find wizard import and `var(-bg)`
- [ ] 3.2: Read `SwapOverlay.svelte` — find emoji usage
- [ ] 3.3: Read `index.ts` — current exports
- [ ] 3.4: Change ModelLoaderPanel wizard import from SetupWizard → BootSetupWizard
- [ ] 3.5: Fix `var(-bg)` → `var(--bg)`
- [ ] 3.6: Replace emoji in SwapOverlay with text or token references
- [ ] 3.7: Delete `SetupWizard.svelte`
- [ ] 3.8: Update `index.ts` exports
- [ ] 3.9: Grep for any remaining imports of `SetupWizard` — update or remove
- [ ] 3.10: `pnpm svelte-check` — zero errors

**Gate**: `pnpm svelte-check` passes. No `SetupWizard` references remain. CSS is valid.

---

## PHASE 4: Wire `platform:models-status` Event

### Files
- `interfaces/desktop/src/lib/domains/app/models/runes/models.runes.svelte.ts` — add status listener

### What Changes

The Rust backend emits `platform:models-status` after boot and after `complete_model_setup`. Nothing listens for it. The models rune should listen for this event and refresh its state when received.

### Task Checklist
- [ ] 4.1: Read `models.runes.svelte.ts` — find initialization/listener setup
- [ ] 4.2: Add `listen("platform:models-status")` that triggers `refresh()`
- [ ] 4.3: Ensure listener cleanup on module teardown
- [ ] 4.4: `pnpm svelte-check` — zero errors

**Gate**: `pnpm svelte-check` passes. Status event triggers rune refresh.

---

## Summary

| Phase | Files Changed | Files Deleted | Verification |
|-------|--------------|---------------|--------------|
| 1 | 1 (boot/mod.rs) | 0 | `cargo check -p devpulse-engine` |
| 2 | 5 services + imports | 1 (models.types.ts) | `pnpm svelte-check` |
| 3 | 3 (panel, overlay, index) | 1 (SetupWizard.svelte) | `pnpm svelte-check` |
| 4 | 1 (models.runes) | 0 | `pnpm svelte-check` |
| **Total** | **10 files** | **2 files** | |

**Estimated scope**: 4 phases, ~10 files touched, 2 deleted. No new files created.
