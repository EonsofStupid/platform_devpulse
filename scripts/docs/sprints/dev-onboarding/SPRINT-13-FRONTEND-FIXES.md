# Sprint 13: Frontend — Remaining Gap Fixes

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2) |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 10 (SSOT alignment), Sprint 11 (Rust fields), Sprint 12 (keyring) |
| **Files** | ~8 Svelte/TS modified |

---

## FIXES

### 1. CompletionStep never mounted
Add completion screen after ProjectSetupStep in SetupWizard.svelte using local `showCompletion` state.

### 2. ModelBrowserPopup — slot selector for local import
Replace hardcoded `"chat.brain"` with a `<select>` bound to `modelsState.userSlots`.

### 3. ModelBrowserPopup — format filter dropdown
Wire `ModelBrowserFilter` type into UI with GGUF/SafeTensors/All selector.

### 4. ResourceAllocationPanel — read-only rewrite
Delete per-slot tier selectors. Show read-only `AllocationMode` derived from hardware. Display which slots prefer GPU vs CPU from `slot.preferred_device`. Keep VRAM budget bar.

### 5. ClyfActivationStep — pipeline monitor expansion
Split into: STT status, Brain status, TTS status, VRAM, Last round-trip, Token/s (—), Voice latency (—), Round-trips.

### 6. ProjectSetupStep — derive path from Tauri
Replace hardcoded `D:\localdev\...` with `appDataDir()`. Check existing profile via `checkDevProfile()` on mount.

### 7. LatencyTuningPanel — remove protocol selector
Delete the memory lane protocol radio group entirely. Keep latency slider + delivery mode.

### 8. Seed families — add warm/standby
Add `state.warm` and `state.standby` families with 4 variations each matching LoadingState semantics.

---

## MANDATORY EXECUTION CHECKLIST

- [ ] CompletionStep renders after ProjectSetupStep
- [ ] ModelBrowserPopup uses slot selector for imports
- [ ] ModelBrowserPopup has format filter dropdown
- [ ] ResourceAllocationPanel is READ-ONLY (no tier selectors, no preference persistence)
- [ ] ClyfActivationStep pipeline monitor has 7+ fields
- [ ] ProjectSetupStep path derived from Tauri, profile checked on mount
- [ ] LatencyTuningPanel has NO protocol selector, NO memoryLaneProtocol references
- [ ] seed-families.ts has state.warm + state.standby families
- [ ] Grep for `memoryLaneProtocol` → 0 hits in entire wizard module
- [ ] Grep for `resourceRules` → 0 hits in entire wizard module
- [ ] biome: 0 errors, 0 warnings
- [ ] svelte-check: 0 errors, 0 warnings

**If ANY checkbox unchecked, sprint is NOT done.**
