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

# Sprint 7: Phase 4 + Phase 5 — Clyffy Activation + Project Setup + Completion

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 3 new, 2 modified |
| **Depends on** | Sprint 1 (types, runes), Sprint 2 (wizard.service) |
| **POA&M** | P1: inference may fail if no model loaded. P2: project indexing not wired. |

---

## PRE-FLIGHT

1. Read `inference.service.ts` — confirm: `generateText(slotId, prompt, maxTokens, temperature)` → `Promise<string>`, `onInferenceToken(callback)` for streaming
2. Read `commands.inferenceGenerate` signature — confirm params: `slotId, prompt, maxTokens, temperature`
3. Read `modelsState.statuses["chat.brain"]` — confirm access pattern for brain loaded check
4. Read `get_preference`/`set_preference` command signatures — confirm: `key: String` → `Option<String>`

---

## FILE 1: `features/setup-wizard/steps/ClyfActivationStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ClyfActivationStep.svelte`

**Purpose:** Phase 4. First real conversation with Clyffy. Chat input (text). Pipeline monitor strip. Round-trip counter. Manual confirm button.

**Props:**
```typescript
interface Props {
  onContinue: () => void;
  onBack: () => void;
  continueEnabled: boolean;
  continueBlockers: string[];
}
```

**Imports:**
```typescript
import { MessageCircle, Send, Check, AlertTriangle, Loader2 } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { generateText } from "../../../services/inference.service.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
```

**State:**
```typescript
let inputText = $state("");
let messages = $state<Array<{ role: "user" | "assistant"; text: string }>>([]);
let generating = $state(false);
let lastRoundTripMs = $state<number | null>(null);
let pipelineError = $state<string | null>(null);

const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const brainLoaded = $derived(brainStatus?.type === "loaded");
```

**Send message:**
```typescript
async function sendMessage(): Promise<void> {
  if (!inputText.trim() || generating) return;
  
  const userMsg = inputText.trim();
  inputText = "";
  messages = [...messages, { role: "user", text: userMsg }];
  
  generating = true;
  pipelineError = null;
  const start = performance.now();
  
  try {
    const response = await generateText("chat.brain", userMsg, 256, 0.7);
    const elapsed = Math.round(performance.now() - start);
    lastRoundTripMs = elapsed;
    messages = [...messages, { role: "assistant", text: response }];
    wizardState.roundTripCount += 1;
  } catch (e) {
    // Raw error — expected if model not actually running
    const msg = e instanceof Error ? e.message : String(e);
    pipelineError = msg;
    messages = [...messages, { role: "assistant", text: `[Error: ${msg}]` }];
  } finally {
    generating = false;
  }
}
```

**Manual confirm:**
```typescript
function confirmClyffy(): void {
  wizardState.clyfConfirmed = true;
}
```

**Layout (from spec Section 5):**
```
┌─────────────────────────────────────────────────────┐
│ Phase 4: Clyffy Activation                           │
│                                                      │
│ ┌─ Chat Area ──────────────────────────────────────┐│
│ │ Clyffy: "Hey! Everything's wired up..."          ││
│ │ User: "Hello Clyffy!"                            ││
│ │ Clyffy: "Hi there! How can I help?"              ││
│ │                                                   ││
│ │ [Type here...                          ] [Send]   ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ PIPELINE MONITOR:                                    │
│ Brain: idle │ VRAM: 5.2/8.0 GB │ Last: 2100ms      │
│ Round-trips: 2/3 │ Token/s: —                        │
│                                                      │
│ Personality Check:                                   │
│ ✅ Clyffy responded coherently                       │
│ ○  3+ exchanges completed (2/3)                      │
│ ○  Manual confirm                                    │
│                                                      │
│ [Clyffy's working, let's go] ← manual override      │
│                                                      │
│ [← Back]                           [Continue →]      │
└─────────────────────────────────────────────────────┘
```

**Pipeline monitor strip:**
- Brain status: from `modelsState.statuses["chat.brain"]` → "idle" / "loading" / "loaded"
- VRAM: `hardwareState.vramUsedMb` / `hardwareState.vramTotalMb`
- Last round-trip: `lastRoundTripMs` (null → "—")
- Round-trips: `wizardState.roundTripCount` / 3

**Personality check:**
- Coherent response: `wizardState.roundTripCount > 0` (at least one successful exchange)
- 3+ exchanges: `wizardState.roundTripCount >= 3`
- Manual confirm: `wizardState.clyfConfirmed`

**Continue gate:** `wizardState.roundTripCount >= 3 || wizardState.clyfConfirmed`

**Verification:**
- [ ] `generateText("chat.brain", userMsg, 256, 0.7)` matches inference.service signature exactly
- [ ] If brain not loaded, `generateText` throws "No model loaded in slot 'chat.brain'" — displayed raw
- [ ] Round-trip counter increments on successful exchange only
- [ ] Manual confirm button sets `wizardState.clyfConfirmed = true` — bypasses 3-exchange requirement
- [ ] Pipeline monitor shows real data from hardware/models runes
- [ ] Messages list shows conversation history
- [ ] All styling via ColdLight token vars

---

## FILE 2: `features/setup-wizard/steps/ProjectSetupStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ProjectSetupStep.svelte`

**Purpose:** Phase 5. Dogfood profile check. Offer to index DevPulse codebase. Allow skip.

**Props:**
```typescript
interface Props {
  onContinue: () => void;
  onBack: () => void;
}
```

**Imports:**
```typescript
import { FolderOpen, Database, SkipForward } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { pickVariation } from "../seed-families.js";
```

**State:**
```typescript
let selectedOption = $state<"devpulse" | "browse" | "skip">("devpulse");
let customPath = $state("");
let creatingProfile = $state(false);
let error = $state<string | null>(null);
```

**Create dev profile:**
```typescript
async function createDevProfile(): Promise<void> {
  creatingProfile = true;
  error = null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const profile = {
      type: "dev",
      created: new Date().toISOString(),
      indexedProjects: [],
    };
    await invoke("set_preference", {
      key: "dev_profile",
      value: JSON.stringify(profile),
    });
    wizardState.devProfileExists = true;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    creatingProfile = false;
  }
}
```

**Layout (from spec Section 6.2):**
```
┌─────────────────────────────────────────────────────┐
│ Phase 5: Project Setup                               │
│                                                      │
│ Clyffy: "Last step. Let's give me something to      │
│          work with."                                 │
│                                                      │
│ ○ Index DevPulse source (recommended)                │
│   Path: D:\localdev\platform_devpulse\               │
│                                                      │
│ ○ Add a different project                            │
│   [Browse...]                                        │
│                                                      │
│ ○ Skip for now                                       │
│                                                      │
│ INDEXING BEST PRACTICES:                             │
│ • .git, node_modules, dist, target/ excluded         │
│ • Files >500KB skipped                               │
│ • Chunking: semantic (code-aware)                    │
│ • Re-index detects changed files only                │
│                                                      │
│ ⚠️ Project indexing requires the RAG pipeline        │
│    (not yet wired). This will show a real error      │
│    if attempted. You can skip for now.               │
│                                                      │
│ [← Back]                           [Finish →]        │
└─────────────────────────────────────────────────────┘
```

**NOTE:** The indexing WILL fail — RAG pipeline is not wired (POA&M P2). The UI shows this transparently. Skip is always available. Profile creation works (just preferences).

**Verification:**
- [ ] Three options: DevPulse, browse, skip
- [ ] Dev profile created via `set_preference("dev_profile", ...)` — works (config commands are real)
- [ ] Indexing attempt will fail with real error — displayed raw, not hidden
- [ ] Skip always available — this phase doesn't block
- [ ] All styling via ColdLight token vars

---

## FILE 3: `features/setup-wizard/steps/CompletionStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/CompletionStep.svelte`

**Purpose:** Final summary. Lists all configured models + status. VRAM/DDR summary. "Enter DevPulse" button.

**Props:**
```typescript
interface Props {
  onComplete: () => void;
}
```

**Imports:**
```typescript
import { Check, Zap } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { friendlySlotLabel, formatMb, statusLabel } from "../../../types/models.types.js";
import { markOnboardingComplete } from "../wizard.service.js";
```

**Display (from spec Section 7):**
```
Clyffy: "Setup complete. Here's what we've got:"

✅ Brain: Qwen3-8B-Q4_K_M (GPU, 4.8 GB)
✅ Worker: Qwen3-0.6B (CPU)
⚠️ RAG: Not assigned
⚠️ Voice STT: Not assigned
⚠️ Voice TTS: Not assigned
✅ Vision: SigLIP2 (CPU)

VRAM: 5.2 / 8.0 GB │ DDR: — / 32 GB

"Everything you configured is saved — next launch
 skips straight to the app."

                              [Enter DevPulse →]
```

**Data sources:**
- Slot list: `modelsState.userSlots`
- Per slot: `modelsState.assignedModel(slot.id)` → model name or "Not assigned"
- Per slot: `modelsState.statuses[slot.id]` → status badge
- VRAM: `hardwareState.vramUsedMb` / `hardwareState.vramTotalMb`
- RAM: `hardwareState.metrics?.ram_used_mb` / `hardwareState.metrics?.ram_total_mb`

**Enter DevPulse button:**
```typescript
async function handleEnter(): Promise<void> {
  await markOnboardingComplete();
  onComplete();
}
```

**Verification:**
- [ ] All `modelsState.userSlots` listed with real status
- [ ] `friendlySlotLabel(slot.id)` for display names
- [ ] VRAM from hardwareState — real
- [ ] `markOnboardingComplete()` persists "onboarding_complete" = "true"
- [ ] `onComplete()` fires — triggers BootOverlay fade + main app load
- [ ] All styling via ColdLight token vars

---

## FILE 4 (MODIFY): `features/setup-wizard/wizard.service.ts`

**Add Phase 4 + 5 methods:**

```typescript
/** Test inference by sending a prompt to the brain. */
export async function testInference(prompt: string): Promise<string> {
  const { generateText } = await import("../../services/inference.service.js");
  return generateText("chat.brain", prompt, 256, 0.7);
}

/** Create initial dev profile in preferences. */
export async function createDevProfile(): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  const profile = {
    type: "dev",
    created: new Date().toISOString(),
    indexedProjects: [],
  };
  await invoke("set_preference", {
    key: "dev_profile",
    value: JSON.stringify(profile),
  });
  wizardState.devProfileExists = true;
}

/** Check if dev profile exists. */
export async function checkDevProfile(): Promise<boolean> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<string | null>("get_preference", { key: "dev_profile" });
    const exists = result !== null;
    wizardState.devProfileExists = exists;
    return exists;
  } catch {
    return false;
  }
}
```

**Verification:**
- [ ] `testInference` delegates to `generateText` from inference.service
- [ ] `createDevProfile` uses `set_preference` with correct key
- [ ] `checkDevProfile` uses `get_preference` — handles null (no profile) case
- [ ] All use `@tauri-apps/api/core` invoke — not commands (bindings may not have these)

---

## FILE 5 (MODIFY): `features/setup-wizard/wizard.runes.svelte.ts`

**Verify Phase 4+5 state fields exist from Sprint 1:**

```typescript
// Phase 4
roundTripCount = $state(0);
clyfConfirmed = $state(false);

// Phase 5
devProfileExists = $state(false);
indexingStarted = $state(false);

// Global
onboardingComplete = $state(false);
```

If missing, add them. Also add seed family for welcome/project steps if not already in seed-families.ts.

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions.

### Phase A: Per-File Authoring Verification

For EACH file written or modified:

- [ ] **Re-read after writing** — every line matches sprint doc
- [ ] **Zero unused imports** — every import used. Wire or delete.
- [ ] **Zero undefined references** — every identifier defined or imported
- [ ] **Zero `any` types**
- [ ] **All imports use `.js` extension**
- [ ] **No raw oklch/hex/rgb/hsl** — all colors via ColdLight token vars
- [ ] **No legacy Svelte stores** — $state/$derived/$effect only
- [ ] **File matches sprint doc description**

### Phase B: Component-Specific Verification

- [ ] **ClyfActivationStep** — chat input works. `generateText("chat.brain", ...)` called on send. Messages array updates with user + assistant entries. If inference fails, raw error shown as message (not hidden).
- [ ] **ClyfActivationStep round-trips** — `wizardState.roundTripCount` increments ONLY on successful exchange. Counter display shows X/3.
- [ ] **ClyfActivationStep pipeline monitor** — shows brain status from `modelsState.statuses["chat.brain"]`, VRAM from `hardwareState`, last round-trip ms.
- [ ] **ClyfActivationStep manual confirm** — "Clyffy's working, let's go" button sets `wizardState.clyfConfirmed = true`. This enables continue even with 0 exchanges.
- [ ] **ProjectSetupStep** — three options: DevPulse, browse, skip. Dev profile created via `invoke("set_preference", { key: "dev_profile", ... })`.
- [ ] **ProjectSetupStep transparency** — RAG not wired warning displayed. Indexing WILL fail with real error. Skip always available.
- [ ] **CompletionStep** — lists ALL `modelsState.userSlots` with `friendlySlotLabel()`, `assignedModel()`, `statusLabel()`. VRAM from hardwareState. RAM from metrics.
- [ ] **CompletionStep launch** — "Enter DevPulse" calls `markOnboardingComplete()` then `onComplete()`. Verify both fire.
- [ ] **wizard.service.ts methods** — `testInference`, `createDevProfile`, `checkDevProfile` all added. Each uses correct IPC calls.

### Phase C: Biome Enforcement (MANDATORY)

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/features/setup-wizard/ --diagnostic-level=warn
```

- [ ] **Zero errors** — fix ROOT CAUSE
- [ ] **Zero warnings** — ALL warnings are blockers
- [ ] **Re-run after fixes** — confirm zero

```bash
cd interfaces/desktop && npx biome format --write src/lib/domains/app/models/features/setup-wizard/
```

- [ ] **Format applied and verified**

### Phase D: TypeScript Verification (MANDATORY)

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors from our files**
- [ ] **Zero warnings from our files**
- [ ] **Read FULL output** — do not skim

### Phase E: Faithfulness Check

- [ ] **Inference errors are NOT "fixed"** — if brain not loaded, `generateText` throws "No model loaded in slot 'chat.brain'". This renders raw. No fallback. No mock response.
- [ ] **Continue gate Phase 4** — requires `roundTripCount >= 3 || clyfConfirmed`. Verify in `evaluateContinueGate("clyffy")`.
- [ ] **Continue gate Phase 5** — always allows continue (indexing optional). Verify `allMet: true`.
- [ ] **markOnboardingComplete calls completeModelSetup** — verify in wizard.service.ts that BOTH preference persistence AND `commands.completeModelSetup()` happen. This is CRITICAL — without it, BootOverlay never fades.
- [ ] **All data in CompletionStep is REAL** — slot names from `friendlySlotLabel`, model names from `assignedModel`, VRAM from hardwareState. No hardcoded strings.

### Phase F: Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **Next sprint dependencies met** — Sprint 8 needs: ALL step components exist and render, wizard.service has markOnboardingComplete with completeModelSetup

**If ANY checkbox unchecked, do NOT proceed to Sprint 8.**
