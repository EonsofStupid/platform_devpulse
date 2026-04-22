> # ⚠️ UNVERIFIED — OUTPUT NOT TRUSTED
>
> This sprint was marked COMPLETE in a prior session log. That status is
> **not binding.** The setup wizard does not currently pass a live audit
> against the 10 Commandments in `POAM-MODEL-LOADER-WIZARD.md`.
>
> - Prior commits shipped. Prior code lives on disk. Neither proves the UX works.
> - Every file this sprint touched must be re-checked against the 10
>   Commandments (POAM §top) before being cited as "done."
> - Acceptance criteria below are aspirational, not retired.
>
> **Authority** → `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# Sprint 10: SSOT Alignment — Unified Signal System Compliance

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2 — Critical Fixes) |
| **Status** | `PLANNED` |
| **Priority** | HIGHEST — blocks all other Phase 2 sprints |
| **Files** | ~10 modified across wizard module + models domain |
| **SSOT** | `systems/devpulse-engine/src/platform/facade/events.rs` |

---

## THE PROBLEM

The wizard module invented a parallel type universe instead of deriving from the engine's unified signal system. This creates:
- Freeform string slot IDs with zero type safety
- A `ModelStatus` type that doesn't cover `Warm`/`Standby` states
- A `ResourceTier` type that competes with `AllocationMode`
- A `memoryLaneProtocol` field that exposes kernel internals
- A `HardwareProfile` type that should derive from `AllocationMode`

## THE SSOT (from events.rs)

```rust
// Slot identification — PascalCase internal, dotted-string at perimeter (TOML/Tauri)
enum SlotId { ChatBrain, MinionShared, MinionEscalation, RagEmbedder, RagReranker,
              VisionEmbedder, VoiceStt, VoiceTts, Custom(String) }

// Model states — the full lifecycle
enum LoadingState { Cold, Warm, Standby, Hot }

// Hardware budget tiers — the engine's allocation envelope
enum AllocationMode { CpuOnly, Budget, Standard, High, Flagship }

// Device placement — concrete, not a preference
enum Device { Gpu { index: u8 }, Cpu }

// Signal classification
enum SignalKind { ChatMessage, Transcription, VisualEmbedding, Command, ... }
enum SignalSource { UserInput, VoiceInput, FileWatcher, Minion(MinionId), ... }
```

---

## FIX 1: Create `SlotId` TypeScript type

**File:** `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts`

The dotted strings from `platform.default.toml` ARE the public form. Generate a union type:

```typescript
/** Canonical slot identifiers — matches platform.default.toml SSOT. */
export type SlotId =
  | "chat.brain"
  | "minion.shared"
  | "minion.escalation"
  | "rag.embedder"
  | "rag.reranker"
  | "vision.embedder"
  | "voice.stt"
  | "voice.tts"
  | "voice.brain";  // Added in Sprint 11

/** All known slot IDs for iteration. */
export const SLOT_IDS: SlotId[] = [
  "chat.brain", "minion.shared", "minion.escalation",
  "rag.embedder", "rag.reranker", "vision.embedder",
  "voice.stt", "voice.tts", "voice.brain",
];
```

Then update `friendlySlotLabel` and `friendlySlotPurpose` to accept `SlotId` not `string`.
Update `ModelRec.slot` from `string` to `SlotId`.
Update `ResourceRule.slotId` from `string` to `SlotId`.

---

## FIX 2: Align `ModelStatus` with `LoadingState`

**File:** `interfaces/desktop/src/lib/domains/app/models/types/models.types.ts`

The kernel's `LoadingState` has 4 variants. The frontend needs 2 additional transient states (`failed`, `unloading`). The correct approach: frontend type is a SUPERSET that maps FROM the kernel type.

```typescript
/**
 * Frontend model status — superset of engine LoadingState.
 *
 * Mapping from engine LoadingState:
 *   Cold    → { type: "cold" }         (on disk only)
 *   Warm    → { type: "warm" }         (weights cached, fast reload)
 *   Standby → { type: "standby" }      (session created, <500ms)
 *   Hot     → { type: "hot", footprint } (inference-ready)
 *
 * Frontend-only transient states:
 *   loading  → model transitioning between states
 *   failed   → transition failed with error
 *   unloading → being removed from memory
 */
export type ModelStatus =
  | { type: "cold" }
  | { type: "warm" }
  | { type: "standby" }
  | { type: "hot"; footprint: MemoryFootprint }
  | { type: "loading"; stage: LoadingStage; progressPct: number }
  | { type: "failed"; error: string }
  | { type: "unloading" };
```

**Breaking change:** Every `status.type === "loaded"` becomes `status.type === "hot"`. Every `status.type === "not_loaded"` becomes `status.type === "cold"`.

**Continue gate update:** "brain ready" means `type === "hot" || type === "standby"` — both can serve inference.

**statusLabel update:**
```typescript
export function statusLabel(status: ModelStatus): string {
  switch (status.type) {
    case "cold": return "Not Loaded";
    case "warm": return "Cached";
    case "standby": return "Ready";
    case "hot": return "Active";
    case "loading": return `Loading ${Math.round(status.progressPct)}%`;
    case "failed": return "Failed";
    case "unloading": return "Unloading";
  }
}
```

**Seed families update:** Add families for `state.warm` and `state.standby`.

---

## FIX 3: Replace `HardwareProfile` with `AllocationMode`

**File:** `wizard.types.ts`

Delete `HardwareProfile` type entirely. Replace with the engine's `AllocationMode`:

```typescript
/** Hardware allocation mode — mirrors engine AllocationMode from events.rs. */
export type AllocationMode =
  | "cpu_only"    // No GPU: everything on CPU
  | "budget"      // 6GB: 4B brain, CPU assist heavy
  | "standard"    // 8GB: 7B brain, embedder on CPU
  | "high"        // 12GB: 14B fits tight
  | "flagship";   // 16GB+: everything on GPU

export const ALLOCATION_MODES: AllocationMode[] = [
  "cpu_only", "budget", "standard", "high", "flagship",
];

/** Map HardwareTier to AllocationMode. */
export function tierToAllocation(tier: HardwareTier, vramTotalMb?: number): AllocationMode {
  switch (tier) {
    case "high":
      return (vramTotalMb ?? 0) >= 16000 ? "flagship" : "high";
    case "medium":
      return "standard";
    case "low":
      return "budget";
    case "minimal":
    case "cpu_only":
      return "cpu_only";
  }
}
```

Update `wizard.runes.svelte.ts`:
```typescript
allocationMode = $derived<AllocationMode>(
  tierToAllocation(hardwareState.tier, hardwareState.vramTotalMb)
);
```

Update all references from `hardwareProfile` → `allocationMode`.

---

## FIX 4: Delete `ResourceTier` and `memoryLaneProtocol`

**Delete from `wizard.types.ts`:**
- `ResourceTier` type
- `ResourceRule` interface
- `VoiceDeliveryMode` stays (it's a real UI choice)
- `VoiceConfig.memoryLaneProtocol` field — DELETE

**Replace `VoiceConfig`:**
```typescript
export interface VoiceConfig {
  latencyToleranceMs: number;
  deliveryMode: VoiceDeliveryMode;
}
```

**Delete from `wizard.runes.svelte.ts`:**
- `resourceRules` state field
- `voiceConfig.memoryLaneProtocol` default

**Rewrite `ResourceAllocationPanel.svelte`:**
- DELETE per-slot tier selectors (no arbiter to receive them)
- KEEP read-only display of current `AllocationMode` derived from hardware
- Show which slots are on GPU vs CPU based on `slot.preferred_device` from SlotInfo
- Show VRAM budget bar (already exists via VramGauge)

**Rewrite `LatencyTuningPanel.svelte`:**
- DELETE memory lane protocol selector entirely
- KEEP latency tolerance slider
- KEEP delivery mode (stream/buffer/hybrid)

---

## FIX 5: Update all slot ID references to use `SlotId` type

**Files to update:**

| File | Change |
|------|--------|
| `wizard.types.ts` | `ModelRec.slot: SlotId` |
| `wizard.service.ts` | Gate checks: `"chat.brain"` etc. typed via import |
| `wizard.runes.svelte.ts` | `importTargetSlot: SlotId \| null` |
| `import-router.ts` | `slotToSubdir(slotId: SlotId)` |
| `SlotAssignmentPanel.svelte` | Slot iteration typed |
| `SttConfigPanel.svelte` | `"voice.stt"` as SlotId |
| `TtsConfigPanel.svelte` | `"voice.tts"` as SlotId |
| `ClyfActivationStep.svelte` | `"chat.brain"` as SlotId |
| `ModelBrowserPopup.svelte` | Import target uses SlotId |

**NOTE:** The actual string VALUES don't change. What changes is the TYPE — from `string` to `SlotId`. This gives compile-time safety against typos.

---

## FIX 6: Update all ModelStatus references

**Files to update:**

| File | Change |
|------|--------|
| `wizard.service.ts` | `brainStatus?.type === "hot" \|\| brainStatus?.type === "standby"` |
| `SlotAssignmentPanel.svelte` | `statusToVariant` maps all 7 states |
| `SttConfigPanel.svelte` | Status badge handles all 7 states |
| `TtsConfigPanel.svelte` | Status badge handles all 7 states |
| `ClyfActivationStep.svelte` | `brainLoaded` checks `"hot" \|\| "standby"` |
| `CompletionStep.svelte` | Status display handles all 7 states |
| `models.types.ts` | `statusLabel`, `statusColor` handle all 7 states |
| `seed-families.ts` | Add `state.warm`, `state.standby` families |

---

## FIX 7: Fix ClyfActivationStep pipeline monitor labels

Replace invented labels:
- `"loaded"` → `"hot"` or `"standby"` (from actual status)
- `"idle"` → `"cold"` (actual LoadingState term)

---

## FIX 8: Fix ProjectSetupStep hardcoded path

Replace `D:\localdev\platform_devpulse\` with Tauri `appDataDir()` call.

---

## MANDATORY EXECUTION CHECKLIST

### Phase A: Type Alignment Verification
- [ ] `SlotId` type exists in models.types.ts with all 9 slot IDs
- [ ] `ModelStatus` has 7 variants: cold, warm, standby, hot, loading, failed, unloading
- [ ] `AllocationMode` replaces `HardwareProfile` — 5 values matching events.rs
- [ ] `ResourceTier` type DELETED
- [ ] `ResourceRule` type DELETED
- [ ] `VoiceConfig.memoryLaneProtocol` DELETED
- [ ] `tierToProfile` renamed to `tierToAllocation`

### Phase B: All Consumers Updated
- [ ] Grep for `"loaded"` in wizard files → 0 hits (replaced with "hot")
- [ ] Grep for `"not_loaded"` in wizard files → 0 hits (replaced with "cold")
- [ ] Grep for `HardwareProfile` in wizard files → 0 hits (replaced with AllocationMode)
- [ ] Grep for `ResourceTier` in wizard files → 0 hits (deleted)
- [ ] Grep for `memoryLaneProtocol` in ALL files → 0 hits (deleted)
- [ ] Grep for `resourceRules` in wizard files → 0 hits (deleted)

### Phase C: Slot ID Type Safety
- [ ] `ModelRec.slot` typed as `SlotId`
- [ ] `friendlySlotLabel` accepts `SlotId` parameter
- [ ] `friendlySlotPurpose` accepts `SlotId` parameter
- [ ] All hardcoded slot strings in wizard files are assignable to `SlotId` type
- [ ] `import-router.ts` `slotToSubdir` accepts `SlotId`

### Phase D: Continue Gate Logic
- [ ] "models" gate: `type === "hot" || type === "standby"` (not just "loaded")
- [ ] "voice" gate: checks `assigned_model_id` (unchanged — voice inference is stub)
- [ ] "clyffy" gate: unchanged (round-trip count or manual confirm)

### Phase E: Biome + svelte-check
```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/ --diagnostic-level=warn
cd interfaces/desktop && pnpm svelte-check
```
- [ ] biome: 0 errors, 0 warnings
- [ ] svelte-check: 0 errors, 0 warnings

### Phase F: Faithfulness to events.rs
- [ ] Every type in wizard module has a clear lineage to events.rs or platform.default.toml
- [ ] No invented concepts that compete with engine types
- [ ] No kernel-protected terms in public-facing code (grep for "memory lane", "rkyv" in non-comment code)
- [ ] `statusLabel` handles ALL 7 ModelStatus variants — no missing case

### Phase G: Sprint Done Gate
- [ ] ALL above checked
- [ ] Sprint doc status → COMPLETE
- [ ] All subsequent sprints (11-14) can proceed on the corrected foundation

**If ANY checkbox unchecked, sprint is NOT done. This sprint is the foundation for everything else.**
