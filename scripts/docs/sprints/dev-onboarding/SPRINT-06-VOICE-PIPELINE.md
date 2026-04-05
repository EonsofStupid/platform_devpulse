# Sprint 6: Phase 3 — Voice Pipeline Setup

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 4 new, 1 modified |
| **Depends on** | Sprint 1 (types, runes), Sprint 2 (wizard.service gate logic) |
| **POA&M** | P1: Voice inference stubs — STT/TTS commands return "not yet available". Dev track expects this. |

---

## PRE-FLIGHT

1. Read `src-tauri/src/commands/voice/mod.rs` — confirm ALL voice commands and their signatures
2. Verify which commands are stubs vs real:
   - `get_voice_status()` → REAL (derives from slot statuses)
   - `speak(text, voice, slot)` → STUB: "Voice TTS not yet available"
   - `test_microphone()` → STUB: "Microphone test not yet available"
   - `transcribe_audio()` → STUB: "Speech-to-text not yet available"
   - `list_voices(slot_id)` → SEMI-REAL: returns hardcoded 3 Kokoro voices
   - `preview_voice(voice, slot_id)` → STUB
   - `list_voice_profiles()` → SEMI-REAL: returns default profile
   - `save_voice_profile(profile)` → STUB
3. Read `modelsState.statuses` — confirm voice.stt and voice.tts slot status access pattern
4. Read `VoiceStatusInfo` type: `{ stt_loaded, tts_loaded, mic_detected, active_profile, active_voice }`

---

## FILE 1: `features/setup-wizard/steps/VoicePipelineStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/VoicePipelineStep.svelte`

**Purpose:** Phase 3 orchestrator. Three sections stacked vertically: STT config, TTS config, Latency Tuning.

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
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import SttConfigPanel from "./SttConfigPanel.svelte";
import TtsConfigPanel from "./TtsConfigPanel.svelte";
import LatencyTuningPanel from "./LatencyTuningPanel.svelte";
import { pickVariation } from "../seed-families.js";
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Phase 3: Voice Pipeline                              │
│                                                      │
│ ┌─ STT Config ─────────────────────────────────────┐│
│ │ (SttConfigPanel)                                  ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ ┌─ TTS Config ─────────────────────────────────────┐│
│ │ (TtsConfigPanel)                                  ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ ┌─ Latency Tuning (dev only) ──────────────────────┐│
│ │ (LatencyTuningPanel)                              ││
│ └───────────────────────────────────────────────────┘│
│                                                      │
│ [← Back]                           [Continue →]      │
│ Continue gate: voice.stt + voice.tts assigned        │
└─────────────────────────────────────────────────────┘
```

**Verification:**
- [ ] Three panels render vertically
- [ ] Continue gate shows blockers from `continueBlockers` prop
- [ ] Back button calls `onBack()`
- [ ] All styling via ColdLight token vars

---

## FILE 2: `features/setup-wizard/steps/SttConfigPanel.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/SttConfigPanel.svelte`

**Purpose:** STT section. Shows voice.stt slot status, model assignment, mic test button.

**Imports:**
```typescript
import { Mic, Check, AlertTriangle, Loader2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { statusLabel } from "../../../types/models.types.js";
```

**State:**
```typescript
const sttSlot = $derived(modelsState.slots.find(s => s.id === "voice.stt"));
const sttStatus = $derived(modelsState.statuses["voice.stt"] ?? { type: "not_loaded" as const });
const sttModel = $derived(modelsState.assignedModel("voice.stt"));
let micTestResult = $state<string | null>(null);
let micTestError = $state<string | null>(null);
let micTesting = $state(false);
```

**Mic test:**
```typescript
async function testMic(): Promise<void> {
  micTesting = true;
  micTestError = null;
  micTestResult = null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<{ detected: boolean; peak_amplitude: number }>("test_microphone");
    micTestResult = result.detected ? `Mic detected (peak: ${result.peak_amplitude})` : "No mic detected";
  } catch (e) {
    // Expected: "Microphone test not yet available" — display as-is
    micTestError = e instanceof Error ? e.message : String(e);
  } finally {
    micTesting = false;
  }
}
```

**Display:**
```
─── STT: Speech-to-Text ──────────────────────────
Model: [Whisper-small]  Device: [CPU]
Status: ● NOT_LOADED (or whatever real status is)

[Test Mic] → "Microphone test not yet available"
              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
              This is CORRECT for dev track.
              Raw error surfaces. Not hidden.
```

**Verification:**
- [ ] Reads `modelsState.statuses["voice.stt"]` — real state
- [ ] Assigned model from `modelsState.assignedModel("voice.stt")` — null if none
- [ ] `test_microphone` invoke returns raw error "Microphone test not yet available" — displayed AS-IS
- [ ] No try to hide or prettify the stub error — dev track mandates raw errors
- [ ] Status badge uses correct variant based on ModelStatus.type
- [ ] All styling via ColdLight token vars

---

## FILE 3: `features/setup-wizard/steps/TtsConfigPanel.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/TtsConfigPanel.svelte`

**Purpose:** TTS section. Shows voice.tts slot, voice profile selection, test voice button.

**Imports:**
```typescript
import { Volume2, Check, AlertTriangle, Loader2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { statusLabel } from "../../../types/models.types.js";
```

**State:**
```typescript
const ttsSlot = $derived(modelsState.slots.find(s => s.id === "voice.tts"));
const ttsStatus = $derived(modelsState.statuses["voice.tts"] ?? { type: "not_loaded" as const });
const ttsModel = $derived(modelsState.assignedModel("voice.tts"));
let voices = $state<Array<{ id: string; label: string; gender: string }>>([]);
let selectedVoice = $state<string>("clyffy-default");
let testResult = $state<string | null>(null);
let testError = $state<string | null>(null);
let testing = $state(false);
```

**Load voices on mount:**
```typescript
$effect(() => {
  loadVoices();
});

async function loadVoices(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<Array<{ id: string; label: string; gender: string }>>("list_voices", { slotId: "voice.tts" });
    voices = result;
  } catch (e) {
    console.warn("[TtsConfig] Failed to load voices:", e);
    // Hardcoded Kokoro voices returned by the command — should work
  }
}
```

**Test voice:**
```typescript
async function testVoice(): Promise<void> {
  testing = true;
  testError = null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("speak", { text: "Hello! I'm Clyffy, your AI assistant.", voice: selectedVoice, slot: "voice.tts" });
    testResult = "Voice test completed";
  } catch (e) {
    // Expected: "Voice TTS not yet available" — raw display
    testError = e instanceof Error ? e.message : String(e);
  } finally {
    testing = false;
  }
}
```

**Display:**
```
─── TTS: Text-to-Speech ──────────────────────────
Model: [Kokoro-82M]  Device: [CPU]
Status: ● NOT_LOADED
Voice Profile: [Clyffy-default ▼]

[Test Voice] → "Voice TTS not yet available"
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                CORRECT for dev track.

Voice Profiles:
  ○ Clyffy-default (warm, steady)
  ○ Clyffy-casual (relaxed, informal)
  ○ Clyffy-focused (crisp, technical)
```

**Verification:**
- [ ] `list_voices` returns hardcoded Kokoro voices (verified in voice/mod.rs)
- [ ] `speak` returns raw error "Voice TTS not yet available" — displayed as-is
- [ ] Voice profile radio buttons from loaded voices
- [ ] Status from `modelsState.statuses["voice.tts"]` — real
- [ ] All styling via ColdLight token vars

---

## FILE 4: `features/setup-wizard/steps/LatencyTuningPanel.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/LatencyTuningPanel.svelte`

**Purpose:** Dev-only latency config. Content source selector, pipeline timing breakdown, latency tolerance slider, stream/buffer/hybrid, memory lane protocol.

**Imports:**
```typescript
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { pickVariation } from "../seed-families.js";
import type { VoiceDeliveryMode } from "../wizard.types.js";
```

**Bound to `wizardState.voiceConfig`:**
```typescript
// These bind directly to wizardState — no local copy
function setLatency(ms: number): void {
  wizardState.voiceConfig = { ...wizardState.voiceConfig, latencyToleranceMs: ms };
}

function setDeliveryMode(mode: VoiceDeliveryMode): void {
  wizardState.voiceConfig = { ...wizardState.voiceConfig, deliveryMode: mode };
}

function setProtocol(proto: "rkyv" | "bincode" | "msgpack"): void {
  wizardState.voiceConfig = { ...wizardState.voiceConfig, memoryLaneProtocol: proto };
}
```

**Display (from spec Section 4.2):**
```
─── LATENCY TUNING (dev only) ────────────────────
Content Source: [chat.brain (local) ▼]

Pipeline Timing:
User speaks → [STT: —ms] → [Reasoning: —ms] →
[serialize: <1ms] → [TTS gen: —ms] → [Play: —s]
Total: — (no data until Phase 4 tests)

Acceptable delay: [████████░░░░░░░░░░░░] 2500ms
(slider: 500ms to 10000ms)

○ Stream (starts speaking immediately, may pause)
● Buffer (wait for full response, smooth delivery)
○ Hybrid (stream after first sentence complete)

Memory Lane Protocol:
● rkyv (zero-copy, fastest)
○ bincode (Rust-to-Rust, slightly slower)
○ msgpack (cross-language, for future plugin system)
```

**Pipeline timing:** Shows dashes ("—") for all latency values. These populate in Phase 4 when the first real conversation happens. No fake values.

**Persist on change:**
```typescript
$effect(() => {
  persistVoiceConfig();
});

async function persistVoiceConfig(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_preference", {
      key: "voice_config",
      value: JSON.stringify(wizardState.voiceConfig),
    });
  } catch {
    // Non-critical — config still in memory
  }
}
```

**Verification:**
- [ ] Slider range: 500ms to 10000ms, default 2500ms
- [ ] Three delivery mode radios: stream, buffer, hybrid — buffer is default
- [ ] Three protocol radios: rkyv, bincode, msgpack — rkyv is default
- [ ] Pipeline timing shows "—" for all values (no fake data)
- [ ] Config persists via `set_preference`
- [ ] All styling via ColdLight token vars
- [ ] No IP-protected terms in public code (rkyv is OK — it's an open-source crate name, not a kernel term)

---

## FILE 5 (MODIFY): `features/setup-wizard/wizard.runes.svelte.ts`

**No structural changes needed.** `voiceConfig` already defined in Sprint 1. Verify it's there with correct defaults:

```typescript
voiceConfig = $state<VoiceConfig>({
  latencyToleranceMs: 2500,
  deliveryMode: "buffer",
  memoryLaneProtocol: "rkyv",
});
```

If Sprint 1 used string literals instead of the `VoiceConfig` type, update to use the type.

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

- [ ] **VoicePipelineStep** — renders THREE panels (STT, TTS, Latency). All three visible. Props match sprint doc.
- [ ] **SttConfigPanel** — reads `modelsState.statuses["voice.stt"]` (real state). Shows assigned model from `modelsState.assignedModel("voice.stt")`. Mic test button calls `invoke("test_microphone")`.
- [ ] **SttConfigPanel raw error** — `test_microphone` returns "Microphone test not yet available". This EXACT string renders in UI. Grep the template for the error display variable.
- [ ] **TtsConfigPanel** — reads `modelsState.statuses["voice.tts"]` (real state). Loads voices via `invoke("list_voices")`. Test button calls `invoke("speak")`.
- [ ] **TtsConfigPanel raw error** — `speak` returns "Voice TTS not yet available". This EXACT string renders in UI.
- [ ] **TtsConfigPanel voice profiles** — 3 Kokoro voices loaded from command. Radio selection works.
- [ ] **LatencyTuningPanel** — slider range 500-10000ms, default 2500. Three delivery modes: stream/buffer/hybrid. Three protocols: rkyv/bincode/msgpack. Pipeline timing shows "—" (no fake values).
- [ ] **LatencyTuningPanel persistence** — config changes call `invoke("set_preference")`. Verify key is "voice_config", value is JSON string.
- [ ] **All props interfaces match sprint doc exactly**
- [ ] **All event handlers wired** — no dead onclick handlers
- [ ] **Cleanup** — $effect in TtsConfigPanel (loadVoices) does not need cleanup (one-shot). Confirm no listener leaks.

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

- [ ] **Voice stubs are NOT "fixed"** — the errors "Microphone test not yet available" and "Voice TTS not yet available" are CORRECT for dev track. They prove the plumbing works. Do NOT add fallbacks or mocks.
- [ ] **Continue gate** — Phase 3 requires voice.stt AND voice.tts to have models ASSIGNED (not loaded — inference is stub). Verify gate checks `assigned_model_id`, not status.
- [ ] **VoiceConfig defaults** — latency 2500ms, buffer mode, rkyv protocol. Verify in wizard.runes.svelte.ts.
- [ ] **No IP-protected terms** — grep for "RKYV" (caps), "zero-copy deserialization". "rkyv" lowercase as crate name is OK.

### Phase F: Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **Next sprint dependencies met** — Sprint 7 needs: voiceConfig in wizardState, all voice step components rendering

**If ANY checkbox unchecked, do NOT proceed to Sprint 7.**
