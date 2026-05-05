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

# Sprint 14: Voice Pipeline Overhaul — Conversational Brain, Escalation, Pipeline Test

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2) |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 10 (SSOT), Sprint 11 (voice.brain slot + Rust fields), Sprint 12 (keyring commands), Sprint 13 (completion phase) |
| **Files** | 3 new Svelte, 4 modified (Svelte + TS) |

---

## SIGNAL SYSTEM ALIGNMENT

This sprint uses the engine's signal types:
- `SlotId` — typed slot references: "voice.stt", "voice.tts", "voice.brain"
- `LoadingState` — slot readiness mapped through `ModelStatus` (cold/warm/standby/hot)
- `isInferenceReady()` — returns true for "hot" || "standby"
- `ApiProvider` — Rust enum: Anthropic | OpenAI (from Sprint 12 keyring)

The escalation chain:
```
voice.brain (CPU, Hot) → chat.brain (GPU, Hot) → API (external, Anthropic/OpenAI)
```

voice.brain is USER-CONFIGURABLE in dev track. Users pick the model, assign it, can test it. Future: API-capable, paid subscribers get configuration tools.

---

## CURRENT STATE OF VoicePipelineStep.svelte (63 lines)

```svelte
<!-- Renders 3 panels in vertical stack -->
<SttConfigPanel />
<TtsConfigPanel />
<LatencyTuningPanel />
```

No tabs, no accordion, no ConversationalBrain, no Escalation, no PipelineTest.

**After Sprint 14:** Tabbed/accordion layout with 6 panels:
1. STT Config (existing)
2. TTS Config (existing)
3. Conversational Brain (NEW)
4. Escalation Config (NEW)
5. Latency Tuning (existing)
6. Full Pipeline Test (NEW)

---

## CURRENT STATE OF wizard.service.ts — Voice Gate (lines 72-82)

```typescript
case "voice": {
  const conditions = ["STT model assigned", "TTS model assigned"];
  const sttSlot = modelsState.slots.find((s) => s.id === "voice.stt");
  const ttsSlot = modelsState.slots.find((s) => s.id === "voice.tts");
  const sttAssigned = !!sttSlot?.assigned_model_id;
  const ttsAssigned = !!ttsSlot?.assigned_model_id;
  const allMet = sttAssigned && ttsAssigned;
  // ...
}
```

**Missing:** No check for voice.brain assignment. Voice.brain is user-configurable, should be part of the gate.

---

## CURRENT STATE OF wizard.types.ts — No Escalation Types

No `EscalationConfig`, no `EscalationPriority`. Need to add.

---

## CURRENT STATE OF wizard.runes.svelte.ts — No Escalation State

No `escalationConfig` state. Need to add.

---

## NEW FILE 1: `steps/ConversationalBrainPanel.svelte`

**Purpose:** Shows voice.brain slot. User-configurable — they pick a model, assign it, see status. Explains the escalation concept via seed family narration.

**Dependencies:**
- `modelsState` from `models.runes.svelte.js` — slot status, assigned model
- `SlotId` type from `models.types.js`
- `statusLabel`, `friendlySlotLabel`, `isInferenceReady` from `models.types.js`
- `pickVariation` from `seed-families.js`
- Design: Text, Badge, box, cn, hstack, stack

**Structure:**
```svelte
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { friendlySlotLabel, isInferenceReady, statusLabel } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";

const brainStatus = $derived(modelsState.statuses["voice.brain"] ?? { type: "cold" as const });
const brainModel = $derived(modelsState.assignedModel("voice.brain"));
const brainReady = $derived(isInferenceReady(brainStatus));
</script>
```

**UI sections:**
1. **Header:** "Conversational Brain" + status badge
2. **Model info:** Assigned model filename or "No model assigned"
3. **Clyffy explanation:** Seed family narration explaining what voice.brain does
   - "This is a small, fast model that handles quick voice responses without waking up the main brain."
   - Use `pickVariation("escalation.voice_brain")` — NEEDS new seed family
4. **Escalation chain visualization:** Simple text showing the priority chain:
   ```
   voice.brain (quick answers) → chat.brain (complex reasoning) → API (cloud fallback)
   ```
5. **Status indicators:** Model assigned? Loaded? Inference ready?

**Estimated size:** ~90 lines

---

## NEW FILE 2: `steps/EscalationConfigPanel.svelte`

**Purpose:** Configure the escalation priority chain. Local slots first, API providers as fallback. API key management via keyring (Sprint 12).

**Dependencies:**
- `modelsState` from `models.runes.svelte.js`
- `SlotId`, `friendlySlotLabel` from `models.types.js`
- `wizardState` from `wizard.runes.svelte.js`
- `invoke` from `@tauri-apps/api/core` — for keyring commands
- Design: Text, Badge, box, cn, hstack, stack

**CRITICAL SECURITY RULES:**
- API key input: `type="password"` — NEVER type="text"
- After `store_api_key` succeeds: CLEAR the input value immediately
- NEVER store actual key in component $state after submission
- Display ONLY the masked preview from `get_api_key_status`
- Key status refreshed via `get_api_key_status` — returns `{ provider, stored, masked_preview }`

**UI sections:**
1. **Escalation chain:** Numbered priority list (drag-to-reorder is future — for now, fixed order)
   - Priority 1: voice.brain (local, CPU, fast) — status badge from modelsState
   - Priority 2: chat.brain (local, GPU, full reasoning) — status badge from modelsState
   - Priority 3: Anthropic API — key status + input
   - Priority 4: OpenAI API — key status + input

2. **API key management per provider:**
   ```svelte
   <!-- Per API provider -->
   {#each apiProviders as provider (provider.name)}
     <div>
       {#if provider.stored}
         <Badge variant="positive" size="sm">Key stored</Badge>
         <Text size="xs" color="muted">{provider.maskedPreview}</Text>
         <button onclick={() => deleteKey(provider.name)}>Remove</button>
       {:else}
         <input
           type="password"
           placeholder="Paste API key..."
           bind:value={keyInputs[provider.name]}
         />
         <button onclick={() => storeKey(provider.name)}>Save</button>
       {/if}
     </div>
   {/each}
   ```

3. **Functions:**
   ```typescript
   let keyInputs = $state<Record<string, string>>({ Anthropic: "", OpenAI: "" });
   let keyStatuses = $state<Array<{ provider: string; stored: boolean; masked_preview: string | null }>>([]);

   async function refreshKeyStatuses(): Promise<void> {
     const { invoke } = await import("@tauri-apps/api/core");
     keyStatuses = await invoke("get_api_key_status");
   }

   async function storeKey(providerName: string): Promise<void> {
     const key = keyInputs[providerName];
     if (!key) return;
     const { invoke } = await import("@tauri-apps/api/core");
     await invoke("store_api_key", { provider: providerName, key });
     keyInputs[providerName] = ""; // CLEAR immediately
     await refreshKeyStatuses();
   }

   async function deleteKey(providerName: string): Promise<void> {
     const { invoke } = await import("@tauri-apps/api/core");
     await invoke("delete_api_key", { provider: providerName });
     await refreshKeyStatuses();
   }

   $effect(() => { refreshKeyStatuses(); });
   ```

4. **Escalation detection mode:** Read-only label "Rule-based (local)" — future: ML-based
5. **Note about delivery mode:** "Delivery mode (stream/buffer/hybrid) is configured in the Latency Tuning tab."

**IMPORTANT:** Delivery mode STAYS in LatencyTuningPanel. NOT moved here.

**Estimated size:** ~160 lines

---

## NEW FILE 3: `steps/FullPipelineTest.svelte`

**Purpose:** 5-step end-to-end voice pipeline test. Most steps will FAIL in dev track (stubs). That's correct — raw errors prove the plumbing works.

**Dependencies:**
- `invoke` from `@tauri-apps/api/core`
- `generateText` from `inference.service.js`
- `modelsState`, `isInferenceReady` from types
- Design components

**5-step test sequence:**

| Step | Action | Expected Dev Track Result |
|------|--------|---------------------------|
| 1. STT Transcription | `invoke("test_microphone")` | FAIL: "Microphone test not yet available" |
| 2. voice.brain Response | `generateText("voice.brain", "Hello, quick test", 64, 0.7)` | FAIL if model not loaded, PASS if loaded |
| 3. TTS Vocalization | `invoke("speak", { text: "test", voice: "clyffy-default", slot: "voice.tts" })` | FAIL: "Voice TTS not yet available" |
| 4. chat.brain Escalation | `generateText("chat.brain", "Explain what DevPulse does in one sentence", 128, 0.7)` | PASS if model loaded |
| 5. API Fallback | Check if any API key stored via `get_api_key_status` | PASS if key stored, SKIP if not |

**UI per step:**
```svelte
{#each testSteps as step, i (step.name)}
  <div class={hstack({ gap: "3", align: "center" })}>
    {#if step.status === "pending"}
      <span class="w-3 h-3 rounded-full border" style="border-color: var(--border-subtle);"></span>
    {:else if step.status === "running"}
      <LoaderCircle size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
    {:else if step.status === "passed"}
      <Check size={12} style="color: var(--signal-success);" />
    {:else if step.status === "failed"}
      <TriangleAlert size={12} style="color: var(--signal-error);" />
    {:else if step.status === "skipped"}
      <span class="w-3 h-3 rounded-full" style="background: var(--text-muted);"></span>
    {/if}
    <Text size="xs" weight="bold" color="primary">{step.name}</Text>
    {#if step.error}
      <Text size="xs" color="muted" class="flex-1 truncate">{step.error}</Text>
    {:else if step.result}
      <Text size="xs" color="muted" class="flex-1 truncate">{step.result}</Text>
    {/if}
  </div>
{/each}
```

**"Run All Tests" button** — runs sequentially, updating each step's status in real-time.

**Estimated size:** ~140 lines

---

## MODIFICATION 1: `VoicePipelineStep.svelte` — Tabbed/Accordion Layout

**Current:** 63 lines, 3 panels in vertical stack.

**After:** Tabbed layout with 6 panels. Each tab: label + panel component.

```svelte
<script lang="ts">
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import ConversationalBrainPanel from "./ConversationalBrainPanel.svelte";
import EscalationConfigPanel from "./EscalationConfigPanel.svelte";
import FullPipelineTest from "./FullPipelineTest.svelte";
import LatencyTuningPanel from "./LatencyTuningPanel.svelte";
import SttConfigPanel from "./SttConfigPanel.svelte";
import TtsConfigPanel from "./TtsConfigPanel.svelte";

interface Props {
  onContinue: () => void;
  onBack: () => void;
  continueEnabled: boolean;
  continueBlockers: string[];
}

let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();

const tabs = [
  { id: "stt", label: "STT" },
  { id: "tts", label: "TTS" },
  { id: "brain", label: "Voice Brain" },
  { id: "escalation", label: "Escalation" },
  { id: "latency", label: "Latency" },
  { id: "test", label: "Pipeline Test" },
] as const;

type TabId = (typeof tabs)[number]["id"];
let activeTab = $state<TabId>("stt");
</script>

<div class={`${stack({ gap: "6" })} w-full flex-1`}>
  <Text size="lg" weight="bold" color="primary">Voice Pipeline</Text>

  <!-- Tab bar -->
  <div class={hstack({ gap: "1", align: "center" })} role="tablist">
    {#each tabs as tab (tab.id)}
      <button
        role="tab"
        aria-selected={activeTab === tab.id}
        class={cn(
          "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
          activeTab === tab.id ? "" : "opacity-60"
        )}
        style="background: {activeTab === tab.id ? 'var(--surface-elevated)' : 'transparent'}; color: var(--text-primary); border: 1px solid {activeTab === tab.id ? 'var(--border-subtle)' : 'transparent'};"
        onclick={() => { activeTab = tab.id; }}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  <!-- Tab content -->
  <div class="flex-1 min-h-0 overflow-y-auto">
    {#if activeTab === "stt"}
      <SttConfigPanel />
    {:else if activeTab === "tts"}
      <TtsConfigPanel />
    {:else if activeTab === "brain"}
      <ConversationalBrainPanel />
    {:else if activeTab === "escalation"}
      <EscalationConfigPanel />
    {:else if activeTab === "latency"}
      <LatencyTuningPanel />
    {:else if activeTab === "test"}
      <FullPipelineTest />
    {/if}
  </div>

  <!-- Navigation (same pattern as before) -->
  <div class={hstack({ gap: "4", align: "center", justify: "between" })}>
    <!-- ... Back / Continue buttons ... -->
  </div>
</div>
```

**NOTE on tab bar styling:** The `border: 1px solid` in the style attribute will trigger the no-raw-values hook. Use Tailwind `border` class + `border-color` CSS var instead:
```
class="... border" style="border-color: {activeTab === tab.id ? 'var(--border-subtle)' : 'transparent'};"
```

**Estimated size:** ~100 lines

---

## MODIFICATION 2: `wizard.service.ts` — Voice Gate + Parameterized Inference

### Voice gate (lines 72-82) — Add voice.brain check:

```typescript
case "voice": {
  const conditions = ["STT model assigned", "TTS model assigned", "Voice brain assigned"];
  const sttSlot = modelsState.slots.find((s) => s.id === "voice.stt");
  const ttsSlot = modelsState.slots.find((s) => s.id === "voice.tts");
  const brainSlot = modelsState.slots.find((s) => s.id === "voice.brain");
  const sttAssigned = !!sttSlot?.assigned_model_id;
  const ttsAssigned = !!ttsSlot?.assigned_model_id;
  const brainAssigned = !!brainSlot?.assigned_model_id;
  const allMet = sttAssigned && ttsAssigned && brainAssigned;
  const blockers: string[] = [];
  if (!sttAssigned) blockers.push("Voice Input (STT) needs a model assigned");
  if (!ttsAssigned) blockers.push("Clyffy's Voice (TTS) needs a model assigned");
  if (!brainAssigned) blockers.push("Voice Brain needs a model assigned for quick responses");
  return { phase, conditions, allMet, blockers };
}
```

### Parameterize testInference (line 163-166):

```typescript
// BEFORE:
export async function testInference(prompt: string): Promise<string> {
  const { generateText } = await import("../../services/inference.service.js");
  return generateText("chat.brain", prompt, 256, 0.7);
}

// AFTER:
export async function testInference(
  slotId: string,
  prompt: string,
  maxTokens = 256,
  temperature = 0.7,
): Promise<string> {
  const { generateText } = await import("../../services/inference.service.js");
  return generateText(slotId, prompt, maxTokens, temperature);
}
```

**Update caller in ClyfActivationStep.svelte** (line 53) — add slotId param:
```typescript
// BEFORE:
const response = await generateText("chat.brain", userMsg, 256, 0.7);

// AFTER (uses testInference from service, not direct generateText):
// Actually, ClyfActivation currently imports generateText directly (line 19).
// Keep it as-is for now — ClyfActivation tests chat.brain specifically.
// FullPipelineTest will use the parameterized testInference.
```

---

## MODIFICATION 3: `wizard.types.ts` — Add Escalation Types

Add after the VoiceConfig section (after line 131):

```typescript
// ── Escalation Config ─────────────────────────────────

/** Source type for an escalation priority. */
export type EscalationSource = "local_slot" | "api";

/** A single priority in the escalation chain. */
export interface EscalationPriority {
  /** 1 = highest priority (tried first). */
  priority: number;
  /** Where inference runs. */
  source: EscalationSource;
  /** Slot ID if source is "local_slot". */
  slotId?: SlotId;
  /** API provider name if source is "api". */
  apiProvider?: "Anthropic" | "OpenAI";
  /** Human label for display. */
  label: string;
}

/** Full escalation configuration. */
export interface EscalationConfig {
  /** Ordered priority chain. */
  priorities: EscalationPriority[];
  /** Detection mode — "rule_based" only for now. */
  detectionMode: "rule_based";
}

/** Default escalation chain. */
export const DEFAULT_ESCALATION: EscalationConfig = {
  priorities: [
    { priority: 1, source: "local_slot", slotId: "voice.brain", label: "Voice Brain (CPU, fast)" },
    { priority: 2, source: "local_slot", slotId: "chat.brain", label: "Main Brain (GPU, full reasoning)" },
    { priority: 3, source: "api", apiProvider: "Anthropic", label: "Anthropic API (cloud fallback)" },
    { priority: 4, source: "api", apiProvider: "OpenAI", label: "OpenAI API (cloud fallback)" },
  ],
  detectionMode: "rule_based",
};
```

---

## MODIFICATION 4: `wizard.runes.svelte.ts` — Add Escalation State

Add after voiceConfig (line 44):

```typescript
import type { EscalationConfig } from "./wizard.types.js";
import { DEFAULT_ESCALATION } from "./wizard.types.js";

// In WizardState class, after voiceConfig:
escalationConfig = $state<EscalationConfig>(DEFAULT_ESCALATION);
```

---

## SEED FAMILIES NEEDED

### File: `seed-families.ts`

Add new family for escalation concept:

```typescript
{
  id: "escalation.voice_brain",
  label: "Voice Brain Concept",
  coreFacts: [
    "Small CPU model handles quick conversational responses",
    "Escalates to GPU brain for complex reasoning",
    "Keeps GPU free for heavy tasks while voice stays responsive",
  ],
  variations: [
    "Think of this as Clyffy's quick-thinking mode — fast answers without firing up the big brain.",
    "The voice brain handles chit-chat and simple questions on the CPU. Anything harder gets escalated.",
    "This keeps your GPU free. Quick answers come from this small model, complex reasoning from the main brain.",
    "Like having a receptionist — handles the easy stuff, routes the hard questions to the expert.",
  ],
  contextTriggers: ["escalation_config"],
},
```

---

## BARREL EXPORTS UPDATE

### File: `index.ts`

Add exports for new components:
```typescript
export { default as ConversationalBrainPanel } from "./steps/ConversationalBrainPanel.svelte";
export { default as EscalationConfigPanel } from "./steps/EscalationConfigPanel.svelte";
export { default as FullPipelineTest } from "./steps/FullPipelineTest.svelte";
```

Add type exports:
```typescript
export type {
  EscalationConfig,
  EscalationPriority,
  EscalationSource,
} from "./wizard.types.js";
export { DEFAULT_ESCALATION } from "./wizard.types.js";
```

---

## FILES SUMMARY

| # | Action | File | Estimated Lines |
|---|--------|------|-----------------|
| 1 | CREATE | `steps/ConversationalBrainPanel.svelte` | ~90 |
| 2 | CREATE | `steps/EscalationConfigPanel.svelte` | ~160 |
| 3 | CREATE | `steps/FullPipelineTest.svelte` | ~140 |
| 4 | MODIFY | `VoicePipelineStep.svelte` | 63→~100 (tabbed layout) |
| 5 | MODIFY | `wizard.service.ts` | +voice.brain gate, parameterize testInference |
| 6 | MODIFY | `wizard.types.ts` | +EscalationPriority, EscalationConfig, DEFAULT_ESCALATION |
| 7 | MODIFY | `wizard.runes.svelte.ts` | +escalationConfig state |
| 8 | MODIFY | `seed-families.ts` | +escalation.voice_brain family |
| 9 | MODIFY | `index.ts` | +3 component exports, +3 type exports |

---

## KEYRING COMMAND REFERENCE (from Sprint 12)

These are the Tauri commands available for API key management:

| Command | Params | Returns | Notes |
|---------|--------|---------|-------|
| `store_api_key` | `{ provider: ApiProvider, key: string }` | `Result<(), String>` | ApiProvider is `"Anthropic"` or `"OpenAI"` |
| `get_api_key` | `{ provider: ApiProvider }` | `Result<Option<String>, String>` | Returns actual key — backend only, NOT for display |
| `delete_api_key` | `{ provider: ApiProvider }` | `Result<(), String>` | Idempotent — no error if already deleted |
| `get_api_key_status` | none | `Result<Vec<ApiKeyStatus>, String>` | Returns `{ provider, stored, masked_preview }` per provider. SAFE for frontend. |

**CRITICAL:** `get_api_key` returns the REAL key — use it in backend escalation only. Frontend uses `get_api_key_status` which returns masked previews.

**Provider enum values in Rust:** `ApiProvider::Anthropic`, `ApiProvider::OpenAI`. When calling from TS via invoke, pass as string: `"Anthropic"`, `"OpenAI"`.

---

## MANDATORY EXECUTION CHECKLIST

### ConversationalBrainPanel
- [ ] Uses SlotId type for "voice.brain"
- [ ] Shows modelsState status for voice.brain slot
- [ ] Shows assigned model filename or "No model assigned"
- [ ] Escalation chain visualization (text, not interactive)
- [ ] Seed family narration (pickVariation("escalation.voice_brain"))

### EscalationConfigPanel
- [ ] API key input is `type="password"` — NEVER type="text"
- [ ] Calls `invoke("store_api_key", { provider, key })` — NOT generated bindings (may lag)
- [ ] CLEARS input immediately after successful store
- [ ] NEVER stores actual key in component $state after submission
- [ ] Shows masked preview from `get_api_key_status`
- [ ] Delete button calls `invoke("delete_api_key", { provider })`
- [ ] Key status refreshed via $effect on mount
- [ ] Priority chain displayed (fixed order for now — no drag)
- [ ] Delivery mode NOT here — stays in LatencyTuningPanel
- [ ] No kernel-protected terms in code

### FullPipelineTest
- [ ] 5 test steps matching spec
- [ ] Each step: pending → running → passed/failed/skipped
- [ ] Raw errors from stubs displayed as-is (no generic messages)
- [ ] Step 2 uses `generateText("voice.brain", ...)` — parameterized slot
- [ ] Step 4 uses `generateText("chat.brain", ...)`
- [ ] Step 5 checks `get_api_key_status` — skips if no key stored
- [ ] "Run All Tests" button runs sequentially

### VoicePipelineStep
- [ ] Tabbed layout with 6 tabs: STT, TTS, Voice Brain, Escalation, Latency, Pipeline Test
- [ ] Tab bar uses ARIA role="tablist" + role="tab" + aria-selected
- [ ] Active tab visually distinct
- [ ] Tab content area scrollable
- [ ] No raw border values (use Tailwind border class + CSS var)

### Voice Gate
- [ ] wizard.service.ts voice gate checks voice.brain assigned (3 conditions, not 2)
- [ ] Blocker message: "Voice Brain needs a model assigned for quick responses"

### Types + State
- [ ] EscalationPriority type with slotId typed as `SlotId` (not string)
- [ ] EscalationConfig with priorities array + detectionMode
- [ ] DEFAULT_ESCALATION with 4-priority chain
- [ ] wizardState.escalationConfig initialized with DEFAULT_ESCALATION
- [ ] All new types exported from barrel index.ts

### Seed Families
- [ ] escalation.voice_brain family with 4 variations + coreFacts

### Quality Gates
- [ ] All ModelStatus references use aligned types (hot/cold/standby, not loaded/not_loaded)
- [ ] No kernel-protected terms in public code (no "Cortex", "Trinity", "rumination", etc.)
- [ ] Grep for `type="text"` in EscalationConfigPanel → 0 hits on key inputs
- [ ] biome: 0 errors, 0 warnings on all new/modified files
- [ ] svelte-check: 0 errors

**If ANY checkbox unchecked, sprint is NOT done.**
