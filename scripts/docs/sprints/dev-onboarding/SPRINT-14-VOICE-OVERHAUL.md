# Sprint 14: Voice Pipeline Overhaul — Escalation, API Keys UI, Pipeline Test

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2) |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 10 (SSOT), Sprint 11 (voice.brain slot), Sprint 12 (keyring commands) |
| **Files** | 3 new Svelte, 2 modified Svelte, 2 modified TS |

---

## SIGNAL SYSTEM ALIGNMENT

This sprint uses the engine's signal types:
- `SignalKind::Transcription` — STT output flows as this signal
- `SignalKind::ChatMessage` — brain response
- `SignalSource::VoiceInput` — all voice pipeline signals originate here
- `SlotId` — typed slot references for voice.stt, voice.tts, voice.brain
- `LoadingState` — slot readiness mapped through `ModelStatus`

The escalation chain follows the engine pattern:
voice.brain (CPU, Hot) → minion.escalation (Warm) → chat.brain (GPU, Hot) → API (external)

---

## NEW FILES

### 1. `steps/ConversationalBrainPanel.svelte`
Shows `voice.brain` slot from `modelsState`. Uses `SlotId` type for `"voice.brain"`. Status mapped through `ModelStatus` (cold/warm/standby/hot). Explains the escalation concept via seed family.

### 2. `steps/EscalationConfigPanel.svelte`
Priority-ordered escalation:
- Priority 1: local slot selector (default: chat.brain, typed as SlotId)
- Priority 2: API provider (Anthropic) — key status from `invoke("get_api_key_status")`
- Priority 3: API provider (OpenAI) — same pattern
- API key input: `type="password"`, sends to `invoke("store_api_key")`, clears input after
- Masked preview from `get_api_key_status` — NEVER stores key in component state
- Escalation detection: rule-based (only option for now)
- Streaming mode: moved FROM LatencyTuningPanel to here (it's an escalation concern)

### 3. `steps/FullPipelineTest.svelte`
5-step test from spec Section 4.9:
1. STT transcribes → calls `invoke("test_microphone")` (stub, raw error expected)
2. voice.brain responds → calls `generateText("voice.brain", ...)` (needs model loaded)
3. TTS vocalizes → calls `invoke("speak", ...)` (stub, raw error expected)
4. Escalation to chat.brain → calls `generateText("chat.brain", ...)` (needs model loaded)
5. API test → calls API via escalation config (needs key stored)

Each step: pending → running → passed → failed (raw error). Dev track expects most to fail.

---

## MODIFICATIONS

### `VoicePipelineStep.svelte`
Renders 6 panels: STT, TTS, ConversationalBrain, EscalationConfig, LatencyTuning, FullPipelineTest.

### `wizard.service.ts`
Voice gate updated: checks voice.brain assigned in addition to stt + tts.

### `wizard.types.ts`
Add `EscalationConfig` type:
```typescript
export interface EscalationPriority {
  priority: number;
  source: "local_slot" | "api";
  slotId?: SlotId;
  apiProvider?: "Anthropic" | "OpenAI";
}
```

### `wizard.runes.svelte.ts`
Add `escalationConfig` state with default 3-priority chain.

---

## MANDATORY EXECUTION CHECKLIST

- [ ] ConversationalBrainPanel uses SlotId type for "voice.brain"
- [ ] EscalationConfigPanel API key input is type="password"
- [ ] EscalationConfigPanel calls invoke("store_api_key") — NOT commands (bindings may lag)
- [ ] EscalationConfigPanel NEVER stores actual key in component $state after submission
- [ ] EscalationConfigPanel shows masked preview from get_api_key_status
- [ ] FullPipelineTest has 5 steps matching spec
- [ ] Raw errors from stubs displayed as-is
- [ ] VoicePipelineStep renders all 6 panels
- [ ] Voice gate in wizard.service.ts checks voice.brain
- [ ] EscalationPriority.slotId typed as SlotId (not string)
- [ ] All ModelStatus references use new aligned types (hot/cold/standby, not loaded/not_loaded)
- [ ] No kernel-protected terms in public code
- [ ] biome: 0 errors, 0 warnings
- [ ] svelte-check: 0 errors, 0 warnings

**If ANY checkbox unchecked, sprint is NOT done.**
