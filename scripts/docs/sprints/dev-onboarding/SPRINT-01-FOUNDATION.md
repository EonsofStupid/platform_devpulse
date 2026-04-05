# Sprint 1: Foundation — Types + State + Seed Families + Import Router

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 5 new |
| **Depends on** | Nothing — this is the base layer |
| **Consumers** | Every subsequent sprint imports from these files |

---

## PRE-FLIGHT

Before writing ANY code:
1. Verify `features/setup-wizard/steps/` directory exists (it does — confirmed empty)
2. Read `models.types.ts` for existing types to avoid duplication
3. Read `hardware.runes.svelte.ts` for HardwareTier definition (already exists in models.types.ts)
4. Read `download.service.ts` for autoConfigureHardware return type (raw JSON string)

---

## FILE 1: `features/setup-wizard/wizard.types.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.types.ts`

**Purpose:** All types for the 5-phase dev onboarding wizard. Does NOT duplicate types from `models.types.ts` — imports them.

**Imports from existing code:**
```typescript
import type { DevicePreference, HardwareTier } from "../../types/models.types.js";
```

**Types to define:**

```typescript
/** The 5 phases of dev onboarding, in order. */
export type WizardPhase = "hardware" | "models" | "voice" | "clyffy" | "project";

/** All phases in order, for iteration. */
export const WIZARD_PHASES: WizardPhase[] = ["hardware", "models", "voice", "clyffy", "project"];

/** Phase display metadata. */
export interface PhaseInfo {
  phase: WizardPhase;
  label: string;
  description: string;
}

export const PHASE_INFO: PhaseInfo[] = [
  { phase: "hardware", label: "Hardware", description: "Detect CPU, GPU, VRAM, disk" },
  { phase: "models", label: "Models", description: "Download and assign AI models" },
  { phase: "voice", label: "Voice", description: "Configure speech-to-text and text-to-speech" },
  { phase: "clyffy", label: "Clyffy", description: "First conversation and pipeline test" },
  { phase: "project", label: "Project", description: "Set up dev profile and index code" },
];

/** Hardware profile tiers from the spec — maps to curated recommendations. */
export type HardwareProfile =
  | "ENTRY_8GB"
  | "MID_12GB"
  | "HIGH_16GB"
  | "ENTHUSIAST_24GB"
  | "CPU_ONLY";

/** Map HardwareTier (from models.types) to HardwareProfile (wizard-specific). */
export function tierToProfile(tier: HardwareTier): HardwareProfile {
  switch (tier) {
    case "high": return "ENTHUSIAST_24GB";      // 16GB+ detected, conservative label
    case "medium": return "ENTRY_8GB";           // 8-15GB
    case "low": return "ENTRY_8GB";              // 4-7GB, same curated list
    case "minimal": return "CPU_ONLY";
    case "cpu_only": return "CPU_ONLY";
  }
}

/** Model recommendation for wizard download flow. */
export interface ModelRec {
  /** Human name: "Qwen3-8B" */
  name: string;
  /** Why the user needs it: "Your main AI brain" */
  purpose: string;
  /** Target slot ID: "chat.brain", "voice.stt", etc. */
  slot: string;
  /** Download size in MB */
  sizeMb: number;
  /** Estimated VRAM usage in MB (0 for CPU-only models) */
  vramMb: number;
  /** HuggingFace repo ID: "Qwen/Qwen3-8B-Instruct-GGUF" */
  repo: string;
  /** Filename within repo: "qwen3-8b-instruct-q4_k_m.gguf" */
  file: string;
  /** Where this model runs */
  device: DevicePreference;
}

/** Import mode for local model files. */
export type ImportMode = "copy" | "symlink";

/** Resource allocation tier for VRAM/RAM budget planning. */
export type ResourceTier = "gpu_reserved" | "gpu_shared" | "cpu_ddr" | "disk_cold";

/** Per-slot resource allocation rule. */
export interface ResourceRule {
  slotId: string;
  tier: ResourceTier;
  /** Lower = higher priority for shared GPU access. */
  priority: number;
}

/** Continue gate — evaluated per phase before allowing advance. */
export interface ContinueGate {
  phase: WizardPhase;
  /** Human-readable conditions. */
  conditions: string[];
  /** All conditions met? */
  allMet: boolean;
  /** Why gate is blocked (empty if allMet). */
  blockers: string[];
}

/** Voice pipeline delivery mode. */
export type VoiceDeliveryMode = "stream" | "buffer" | "hybrid";

/** Voice pipeline config persisted via preferences. */
export interface VoiceConfig {
  latencyToleranceMs: number;
  deliveryMode: VoiceDeliveryMode;
  memoryLaneProtocol: "rkyv" | "bincode" | "msgpack";
}
```

**Verification after writing:**
- [ ] No duplicate types from `models.types.ts` (HardwareTier, DevicePreference are IMPORTED, not redefined)
- [ ] All imports use `.js` extension
- [ ] `WIZARD_PHASES` array matches spec order exactly
- [ ] `tierToProfile` handles all 5 HardwareTier values

---

## FILE 2: `features/setup-wizard/wizard.runes.svelte.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.ts`

**Purpose:** Svelte 5 rune state for the wizard orchestrator. Tracks current phase, continue gates, recommendations.

**Imports:**
```typescript
import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import type { AutoConfig, SlotRecommendation } from "../../types/models.types.js";
import {
  type ContinueGate,
  type HardwareProfile,
  type ModelRec,
  type ResourceRule,
  type VoiceConfig,
  type WizardPhase,
  WIZARD_PHASES,
  tierToProfile,
} from "./wizard.types.js";
```

**State class (WizardState):**

```typescript
class WizardState {
  // ── Phase Navigation ─────────────────────────────────
  currentPhase = $state<WizardPhase>("hardware");
  
  // ── Phase 1: Hardware ────────────────────────────────
  hardwareProfile = $derived<HardwareProfile>(tierToProfile(hardwareState.tier));
  hardwareScanned = $state(false);

  // ── Phase 2: Models ──────────────────────────────────
  recommendations = $state<ModelRec[]>([]);
  downloadQueue = $state<ModelRec[]>([]);
  downloadingIndex = $state(-1);
  downloadProgress = $state(0);
  resourceRules = $state<ResourceRule[]>([]);
  showModelBrowser = $state(false);
  showImportPrompt = $state(false);

  // ── Phase 3: Voice ───────────────────────────────────
  voiceConfig = $state<VoiceConfig>({
    latencyToleranceMs: 2500,
    deliveryMode: "buffer",
    memoryLaneProtocol: "rkyv",
  });

  // ── Phase 4: Clyffy ──────────────────────────────────
  roundTripCount = $state(0);
  clyfConfirmed = $state(false);

  // ── Phase 5: Project ─────────────────────────────────
  devProfileExists = $state(false);
  indexingStarted = $state(false);

  // ── Global ───────────────────────────────────────────
  error = $state<string | null>(null);
  onboardingComplete = $state(false);

  // ── Phase Index ──────────────────────────────────────
  get currentPhaseIndex(): number {
    return WIZARD_PHASES.indexOf(this.currentPhase);
  }

  get isFirstPhase(): boolean {
    return this.currentPhaseIndex === 0;
  }

  get isLastPhase(): boolean {
    return this.currentPhaseIndex === WIZARD_PHASES.length - 1;
  }

  // ── Continue Gates ───────────────────────────────────
  evaluateGate(phase: WizardPhase): ContinueGate { ... }
  // Implementation deferred to Sprint 2 — needs hardware + models state wired

  // ── Navigation ───────────────────────────────────────
  canAdvance(): boolean { ... }
  advance(): void { ... }
  goBack(): void { ... }

  // ── Recommendations ──────────────────────────────────
  setRecommendations(autoConfig: AutoConfig): void { ... }
  // Converts AutoConfig.recommendations (SlotRecommendation[]) to ModelRec[]
}

export const wizardState = new WizardState();
```

**Initial implementation:** Define the class with all $state/$derived fields. Navigation methods (advance/goBack) work based on phase index. Gate evaluation returns a stub that always passes — Sprint 2 wires real conditions.

**Verification after writing:**
- [ ] Uses $state and $derived — NO legacy stores
- [ ] Imports from relative paths with `.js` extension
- [ ] `WizardState` class has ALL fields listed above
- [ ] `hardwareProfile` is $derived from `hardwareState.tier` — reactive
- [ ] No circular imports (does NOT import from wizard.service.ts)

---

## FILE 3: `features/setup-wizard/import-router.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/import-router.ts`

**Purpose:** Maps slot IDs to filesystem subdirectories. Used by both wizard UI and (eventually) the Rust import command.

**No framework imports needed — pure TypeScript.**

```typescript
/**
 * Map a slot ID to its model storage subdirectory.
 * 
 * Routing:
 *   chat.brain, chat.*, minion.*  → "chat"
 *   voice.stt, voice.tts          → "voice"
 *   rag.embedder, rag.reranker    → "rag"
 *   vision.*                       → "vision"
 *   unknown                        → "chat" (safe default)
 */
export function slotToSubdir(slotId: string): string {
  const prefix = slotId.split(".")[0];
  const map: Record<string, string> = {
    chat: "chat",
    minion: "chat",
    voice: "voice",
    rag: "rag",
    vision: "vision",
  };
  return map[prefix] ?? "chat";
}

/**
 * Build the full relative path for a model file in its slot's directory.
 * Example: slotToModelPath("voice.stt", "ggml-small.bin") → "models/voice/ggml-small.bin"
 */
export function slotToModelPath(slotId: string, filename: string): string {
  return `models/${slotToSubdir(slotId)}/${filename}`;
}
```

**Verification after writing:**
- [ ] `slotToSubdir("chat.brain")` → "chat"
- [ ] `slotToSubdir("minion.shared")` → "chat"
- [ ] `slotToSubdir("voice.stt")` → "voice"
- [ ] `slotToSubdir("voice.tts")` → "voice"
- [ ] `slotToSubdir("rag.embedder")` → "rag"
- [ ] `slotToSubdir("rag.reranker")` → "rag"
- [ ] `slotToSubdir("vision.embedder")` → "vision"
- [ ] `slotToSubdir("unknown.thing")` → "chat" (safe default)

---

## FILE 4: `features/setup-wizard/seed-families.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/seed-families.ts`

**Purpose:** Scripted narration variations. Each concept has 4-5 phrasings. Core facts are locked. Conversational framing varies per session.

```typescript
export interface SeedFamily {
  id: string;
  coreFacts: string[];
  variations: string[];
  contextTriggers: string[];
}
```

**Families to define (minimum viable for Sprint 1):**

| Family ID | Core Facts | Variation Count |
|-----------|-----------|-----------------|
| `quant.q4_k_m` | 4-bit, ~95% quality, ~25% memory | 5 |
| `quant.q6_k` | 6-bit, better quality, ~50% more memory | 4 |
| `quant.q8_0` | 8-bit, near-lossless, 2x memory of Q4 | 4 |
| `format.gguf` | Standard local format, universal | 4 |
| `format.safetensors` | HF official, full precision, bigger | 4 |
| `concept.vram` | Graphics card memory, models live here | 4 |
| `concept.context` | How much text model sees at once | 4 |
| `concept.slot` | Named job a model fills | 4 |
| `model.qwen3` | Alibaba, strong multilingual, code | 4 |
| `state.loading` | Model being loaded into memory | 4 |
| `state.loaded` | Model ready, taking VRAM | 4 |
| `state.failed` | Model failed to load | 4 |
| `error.vram_full` | Not enough graphics memory | 4 |
| `error.download_failed` | Network/disk issue | 4 |

**Session picker:**
```typescript
const sessionSeed = Math.floor(Math.random() * 1000);

export function pickVariation(familyId: string): string {
  const family = SEED_FAMILIES.get(familyId);
  if (!family) return "";
  const index = sessionSeed % family.variations.length;
  return family.variations[index];
}

export function getCoreFacts(familyId: string): string[] {
  return SEED_FAMILIES.get(familyId)?.coreFacts ?? [];
}
```

**All variations are VERBATIM from the spec.** The Q4_K_M family uses the exact 5 variations from Section 3.4 of the DEV ONBOARDING SPECIFICATION.

**Verification after writing:**
- [ ] At least 14 families defined
- [ ] Each family has 4-5 variations
- [ ] `pickVariation("quant.q4_k_m")` returns one of the 5 spec variations
- [ ] `getCoreFacts("quant.q4_k_m")` returns ["4-bit quantization", "~95% quality retention", "~25% original memory footprint"]
- [ ] No raw oklch/hex values — this is pure text data
- [ ] Session seed is stable for the session (same variation picked on re-render)

---

## FILE 5: `features/setup-wizard/index.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/index.ts`

**Purpose:** Barrel exports for the module.

```typescript
// Types
export type * from "./wizard.types.js";
export { WIZARD_PHASES, PHASE_INFO, tierToProfile } from "./wizard.types.js";

// State
export { wizardState } from "./wizard.runes.svelte.js";

// Import routing
export { slotToSubdir, slotToModelPath } from "./import-router.js";

// Seed families
export { pickVariation, getCoreFacts } from "./seed-families.js";
```

**Verification after writing:**
- [ ] All exports resolve (no typos in paths)
- [ ] All imports use `.js` extension
- [ ] No circular dependencies

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions. A passing check does NOT mean "good" — you READ the output and CONFIRM it matches expectations.

### Phase A: Per-File Authoring Verification

For EACH file written in this sprint, complete ALL of the following:

- [ ] **Re-read the file after writing** — confirm every line matches the sprint doc
- [ ] **Zero unused imports** — if an import exists, it MUST be used in the file. If not used, either wire it into the code or delete it. Do NOT leave unused imports.
- [ ] **Zero undefined references** — every type, function, variable referenced MUST be defined or imported. Grep the file for any identifier that has no definition.
- [ ] **Zero `any` types** — no implicit or explicit `any`. Every variable typed.
- [ ] **All imports use `.js` extension** — grep for `from "` lines, confirm every relative import ends in `.js`
- [ ] **No raw oklch/hex/rgb/hsl values** — grep for `oklch`, `#[0-9a-f]`, `rgb(`, `hsl(`. Must be zero hits.
- [ ] **No legacy Svelte stores** — grep for `writable`, `readable`, `derived` from `svelte/store`. Must be zero.
- [ ] **No `unwrap()` in Rust** — if Rust files, grep for `.unwrap()`. Must be zero.
- [ ] **File purpose matches sprint doc** — re-read the sprint doc description for this file, confirm the implementation matches

### Phase B: Cross-File Integrity

- [ ] **All exports resolve** — every export in index.ts can be traced to an actual definition
- [ ] **No circular imports** — trace the import chain: wizard.types → (no imports from module), wizard.runes → wizard.types + external runes, import-router → (standalone), seed-families → (standalone), index → all others
- [ ] **Types match consumers** — for every type exported, verify at least one future sprint doc references it by name
- [ ] **No orphaned code** — every function defined is either exported or called within the file

### Phase C: Biome Enforcement (MANDATORY — not optional)

Run and READ the output. Do not assume clean.

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/features/setup-wizard/ --diagnostic-level=warn
```

- [ ] **Zero errors** — if any error, fix the ROOT CAUSE. Do not suppress.
- [ ] **Zero warnings** — warnings are blockers. Unused vars, unused imports, formatting issues — ALL fixed.
- [ ] **Re-run after fixes** — if you fixed anything, run biome AGAIN. Confirm zero.

Then format:
```bash
cd interfaces/desktop && npx biome format --write src/lib/domains/app/models/features/setup-wizard/
```

- [ ] **Format applied** — re-read each file to confirm biome didn't break anything

### Phase D: TypeScript Verification (MANDATORY)

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors from our files** — filter output for `features/setup-wizard/`. Must be zero errors.
- [ ] **Zero warnings from our files** — warnings are blockers. Fix them.
- [ ] **Read the FULL output** — do not assume "0 errors" from a glance. Scroll through. Confirm.

### Phase E: Faithfulness Check

- [ ] **Every type from sprint doc exists** — re-read the sprint doc "Types to define" section. Confirm EACH type is in the file.
- [ ] **Every function from sprint doc exists** — re-read the sprint doc function descriptions. Confirm EACH function is implemented.
- [ ] **Seed families count** — sprint doc says "at least 14 families." Count them. Confirm >= 14.
- [ ] **Seed family variations count** — sprint doc says "4-5 variations each." Spot-check 3 families. Confirm each has 4-5.
- [ ] **Q4_K_M verbatim check** — the 5 variations for quant.q4_k_m MUST match the DEV ONBOARDING SPECIFICATION Section 3.4 verbatim. Read the spec, read the code, confirm.

### Phase F: Sprint Done Gate

ALL of the above must be checked. Then and ONLY then:

- [ ] **Sprint doc status updated** — change status from PLANNED to COMPLETE
- [ ] **No open questions** — if anything is unclear, ASK before marking complete
- [ ] **Next sprint dependencies met** — re-read "WHAT SPRINT 2 NEEDS FROM THIS SPRINT" section. Confirm every listed item exists and is exported.

**If ANY checkbox above is not checked, this sprint is NOT done. Do not proceed to Sprint 2.**
