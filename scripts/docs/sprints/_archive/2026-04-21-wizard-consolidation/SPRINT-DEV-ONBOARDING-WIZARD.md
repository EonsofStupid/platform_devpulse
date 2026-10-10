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

# SPRINT: Dev Onboarding Wizard — Self-Contained Module

| Field | Value |
|-------|-------|
| **Status** | `PLANNED` |
| **Date** | `2026-04-05` |
| **SSOT** | DEV ONBOARDING SPECIFICATION v1.0.0-rc1 |
| **Supersedes** | SPRINT-MODEL-LOADER-COMPLETE.md (Phase 2 only) |
| **Track** | INTERNAL (dev onboarding) — customer onboarding is a SEPARATE future spec |
| **Scope** | 5-phase full-viewport wizard: Hardware → Models → Voice → Clyffy → Project |
| **Sprint Docs** | `dev-onboarding/SPRINT-01` through `SPRINT-09` — each fully self-contained |

---

## INDIVIDUAL SPRINT DOCUMENTS

Each sprint is broken out into its own fully-researched document with exact imports, exact types, exact function signatures, and verification checklists. **During execution, reference ONLY the active sprint doc — not this parent.**

| Sprint | File | Summary |
|--------|------|---------|
| 1 | [SPRINT-01-FOUNDATION.md](dev-onboarding/SPRINT-01-FOUNDATION.md) | wizard.types.ts, wizard.runes.svelte.ts, import-router.ts, seed-families.ts, index.ts |
| 2 | [SPRINT-02-HARDWARE-DETECTION.md](dev-onboarding/SPRINT-02-HARDWARE-DETECTION.md) | WelcomeStep, HardwareDetectionStep, wizard.service.ts |
| 3 | [SPRINT-03-MODEL-LOADER-LEFT.md](dev-onboarding/SPRINT-03-MODEL-LOADER-LEFT.md) | ModelLoaderStep, SlotAssignmentPanel, ImportPrompt, downloadAndAssign |
| 4 | [SPRINT-04-MODEL-LOADER-RIGHT.md](dev-onboarding/SPRINT-04-MODEL-LOADER-RIGHT.md) | ModelBrowserPopup, ResourceAllocationPanel |
| 5 | [SPRINT-05-RUST-IMPORT.md](dev-onboarding/SPRINT-05-RUST-IMPORT.md) | Rust import_local_model: target_slot + import_mode + symlink |
| 6 | [SPRINT-06-VOICE-PIPELINE.md](dev-onboarding/SPRINT-06-VOICE-PIPELINE.md) | VoicePipelineStep, SttConfig, TtsConfig, LatencyTuning |
| 7 | [SPRINT-07-CLYFFY-PROJECT.md](dev-onboarding/SPRINT-07-CLYFFY-PROJECT.md) | ClyfActivationStep, ProjectSetupStep, CompletionStep |
| 8 | [SPRINT-08-ORCHESTRATOR.md](dev-onboarding/SPRINT-08-ORCHESTRATOR.md) | SetupWizard.svelte orchestrator, BootOverlay wiring, old wizard delete |
| 9 | [SPRINT-09-SUBSEQUENT-LAUNCH.md](dev-onboarding/SPRINT-09-SUBSEQUENT-LAUNCH.md) | Return user skip, missing model repair, hardware change detection |

### Phase 2: Gap Fixes (from audit against DEV ONBOARDING SPECIFICATION)

| Sprint | File | Summary |
|--------|------|---------|
| 10 | [SPRINT-10-SSOT-ALIGNMENT.md](dev-onboarding/SPRINT-10-SSOT-ALIGNMENT.md) | **CRITICAL** — Align all types to events.rs: SlotId, ModelStatus→LoadingState, AllocationMode, delete ResourceTier/memoryLaneProtocol |
| 11 | [SPRINT-11-RUST-HARDWARE-SLOTS.md](dev-onboarding/SPRINT-11-RUST-HARDWARE-SLOTS.md) | Rust: HardwareInfo 5 fields + SlotInfo 3 view fields + voice.brain TOML slot |
| 12 | [SPRINT-12-RUST-KEYRING.md](dev-onboarding/SPRINT-12-RUST-KEYRING.md) | Rust: keyring crate, 4 credential commands |
| 13 | [SPRINT-13-FRONTEND-FIXES.md](dev-onboarding/SPRINT-13-FRONTEND-FIXES.md) | Frontend: CompletionStep mount, browser filter, resource panel read-only, path fix |
| 14 | [SPRINT-14-VOICE-OVERHAUL.md](dev-onboarding/SPRINT-14-VOICE-OVERHAUL.md) | Voice: ConversationalBrain, EscalationConfig, API keys UI, FullPipelineTest |

---

## ABSOLUTE RULES

1. **No mocks, no stubs, no fallbacks** — every UI element reflects real state
2. **No patching** — author the whole system correctly from the ground up
3. **No shortcuts** — DoD-grade discipline, hypermodular, boring repeatable patterns
4. **No assumptions** — verify every file exists before editing, read before writing
5. **No drift** — every file follows the same pattern, every component uses ColdLight token vars
6. **No dead code** — warnings are blockers, unused vars get deleted
7. **No blind fixes** — understand root causes before changing anything
8. **Compile check after every edit** — owner runs the build, state what to verify
9. **Plan before execute** — this document IS the plan, no code until approved
10. **Max 5 files per phase** — state plan, wait for approval between phases

---

## WHAT EXISTS TODAY (verified 2026-04-05)

### Frontend — Models Domain

```
interfaces/desktop/src/lib/domains/app/models/
├── index.ts                          — 13 component exports, 5 rune states, 8 helpers
├── components/
│   ├── SetupWizard.svelte            — 604 lines, 6-step wizard (ONLY covers Phase 2 partially)
│   ├── ModelLoaderPanel.svelte       — admin 4-card view (NOT boot experience)
│   ├── BrainCard, VisionCard, VoiceCard, MemoryCard
│   ├── VramGauge, VramBudgetPlanner, GpuUtilGauge, ContextGauge
│   ├── ClyffyNarration, ModelSearch, HfModelCard
│   ├── SlotRow, SubsystemGroup, SwapOverlay, VoiceSlotStatus
│   └── chat/ModelEventCard.svelte
├── features/setup-wizard/steps/      — EMPTY directory
├── runes/                            — hardware, models, narration, search, swap
├── services/                         — catalog, competency, content, download, hardware, inference, registry, search, slots
├── types/models.types.ts             — 20+ types
└── utils/terminology.ts              — 10 translators × 3 levels
```

### Rust Backend

- 18 model commands, 12 voice commands (10 stubs), 3 config commands
- `import_local_model` — hardcodes `models/chat/`, NO target_slot, NO import_mode
- `auto_configure` — returns AutoConfig JSON with tier + recommendations including Whisper + Kokoro

### BootOverlay.svelte

- Currently imports SetupWizard from components/ (fixed prior session)
- Container widened to max-w-5xl
- `setupError` variable declared but never displayed (dead code)

---

## GAP ANALYSIS

| Spec Requirement | Current State | Gap |
|-----------------|---------------|-----|
| Phase 1: Hardware Detection | Scanning step waits 1500ms, shows spinner | No CPU/RAM/GPU/VRAM/Disk breakdown |
| Phase 2: Model Loader full viewport | Recommendations step with cards | No browser popup, resource allocation, device selector, seed tooltips |
| Phase 2: Symlink/Copy import | Hardcodes to models/chat/ | Rust needs target_slot + import_mode |
| Phase 2: Auto-assign after download | Downloads but never assigns | Need wizard.service orchestration |
| Phase 3: Voice Pipeline | Voice commands are stubs | STT/TTS config, latency tuning — ALL NEW |
| Phase 4: Clyffy Activation | Does not exist | First conversation + pipeline monitor — ALL NEW |
| Phase 5: Project Setup | Does not exist | Dogfood profile + indexing — ALL NEW |
| Continue gates | Does not exist | Wizard advances freely |
| Full viewport ownership | Wizard wrapped in centered container | Needs to OWN the viewport |

---

## EXECUTION PLAN (9 Sprints, max 5 files each)

### Sprint 1: Foundation — Types + State + Seed Families (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/wizard.types.ts` |
| 2 | CREATE | `features/setup-wizard/wizard.runes.svelte.ts` |
| 3 | CREATE | `features/setup-wizard/import-router.ts` |
| 4 | CREATE | `features/setup-wizard/seed-families.ts` |
| 5 | CREATE | `features/setup-wizard/index.ts` |

**wizard.types.ts exports:**
- `WizardPhase`: "hardware" | "models" | "voice" | "clyffy" | "project"
- `WizardStep`: per-phase step unions
- `ModelRec`: { name, purpose, slot, sizeMb, vramMb, repo, file, device }
- `ImportMode`: "copy" | "symlink"
- `SeedFamily`: { id, core_facts, variations, context_triggers }
- `HardwareProfile`: "ENTRY_8GB" | "MID_12GB" | "HIGH_16GB" | "ENTHUSIAST_24GB" | "CPU_ONLY"
- `ContinueGate`: { phase, conditions, allMet, blockers }
- `ResourceTier`: "gpu_reserved" | "gpu_shared" | "cpu_ddr" | "disk_cold"
- `ResourceRule`: { slotId, tier, priority }

**seed-families.ts covers:** quant formats (Q4_K_M, Q6_K, Q8_0, fp16, bf16), file formats (GGUF, SafeTensors), model architectures (Qwen3, Phi-4, Gemma-3, Mistral-7B), VRAM concepts, loading states, error explanations. 4-5 variations per concept. `pickVariation(familyId)` picks one per session.

### Sprint 2: Phase 1 — Hardware Detection (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/steps/HardwareDetectionStep.svelte` |
| 2 | CREATE | `features/setup-wizard/steps/WelcomeStep.svelte` |
| 3 | CREATE | `features/setup-wizard/wizard.service.ts` |
| 4 | MODIFY | `features/setup-wizard/wizard.runes.svelte.ts` |
| 5 | MODIFY | `features/setup-wizard/index.ts` |

HardwareDetectionStep shows ALL metrics: CPU (name, cores, threads), RAM (total, available), GPU (name, CUDA), VRAM (total, free), Disk (free), NVML status. All from `hardwareState` rune. Clyffy narration via seed families.

### Sprint 3: Phase 2 Left Panel — Slot Assignment (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/steps/ModelLoaderStep.svelte` |
| 2 | CREATE | `features/setup-wizard/steps/SlotAssignmentPanel.svelte` |
| 3 | CREATE | `features/setup-wizard/steps/ImportPrompt.svelte` |
| 4 | MODIFY | `features/setup-wizard/wizard.service.ts` |
| 5 | MODIFY | `features/setup-wizard/wizard.runes.svelte.ts` |

All 7 slots visible. Download→scan→assign flow. ImportPrompt with symlink/copy. Continue gate: chat.brain LOADED.

### Sprint 4: Phase 2 Right Panel — Browser + Allocation (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/steps/ModelBrowserPopup.svelte` |
| 2 | CREATE | `features/setup-wizard/steps/ResourceAllocationPanel.svelte` |
| 3 | MODIFY | `features/setup-wizard/steps/ModelLoaderStep.svelte` |
| 4 | MODIFY | `features/setup-wizard/seed-families.ts` |
| 5 | MODIFY | `features/setup-wizard/wizard.types.ts` |

Model browser: curated per profile + HF search + local/symlink. Resource allocation: 4 tiers, editable, persisted.

### Sprint 5: Rust — Import Router + Symlink (3 files)

| # | Action | File |
|---|--------|------|
| 1 | MODIFY | `src-tauri/src/commands/models/mod.rs` |
| 2 | MODIFY | `features/setup-wizard/import-router.ts` |
| 3 | MODIFY | `services/download.service.ts` |

`import_local_model` gets `target_slot` + `import_mode`. Routing: chat/minion→chat/, voice→voice/, rag→rag/, vision→vision/. Symlink: Windows `symlink_file`, Unix `symlink`.

### Sprint 6: Phase 3 — Voice Pipeline (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/steps/VoicePipelineStep.svelte` |
| 2 | CREATE | `features/setup-wizard/steps/SttConfigPanel.svelte` |
| 3 | CREATE | `features/setup-wizard/steps/TtsConfigPanel.svelte` |
| 4 | CREATE | `features/setup-wizard/steps/LatencyTuningPanel.svelte` |
| 5 | MODIFY | `features/setup-wizard/wizard.runes.svelte.ts` |

STT config, TTS config, latency slider, stream/buffer/hybrid, memory lane protocol. Raw errors from voice stubs — expected and wanted for dev track.

### Sprint 7: Phase 4 + 5 — Clyffy + Project (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/steps/ClyfActivationStep.svelte` |
| 2 | CREATE | `features/setup-wizard/steps/ProjectSetupStep.svelte` |
| 3 | CREATE | `features/setup-wizard/steps/CompletionStep.svelte` |
| 4 | MODIFY | `features/setup-wizard/wizard.service.ts` |
| 5 | MODIFY | `features/setup-wizard/wizard.runes.svelte.ts` |

Clyffy activation: real inference call, pipeline monitor, 3+ exchange gate. Project setup: dev profile, indexing offer. Completion: full summary.

### Sprint 8: Orchestrator + BootOverlay Integration (5 files)

| # | Action | File |
|---|--------|------|
| 1 | CREATE | `features/setup-wizard/SetupWizard.svelte` |
| 2 | MODIFY | `layouts/app/BootOverlay.svelte` |
| 3 | MODIFY | `domains/app/models/index.ts` |
| 4 | DELETE | `components/SetupWizard.svelte` |
| 5 | MODIFY | `features/setup-wizard/index.ts` |

Wire all phases. Phase progress indicator. Continue gates enforced. Old wizard deleted. Full viewport.

### Sprint 9: Subsequent Launch + Settings (3 files)

| # | Action | File |
|---|--------|------|
| 1 | MODIFY | `features/setup-wizard/wizard.service.ts` |
| 2 | MODIFY | `features/setup-wizard/SetupWizard.svelte` |
| 3 | MODIFY | `features/setup-wizard/wizard.runes.svelte.ts` |

Skip wizard on return. Missing model detection. Hardware change detection.

---

## POA&M

### Blocked Items

| ID | Item | Blocker | Workaround |
|----|------|---------|------------|
| P1 | Voice inference (STT/TTS) | sherpa-rs + Kokoro integration | Raw "not yet available" errors — dev track expects this |
| P2 | Project indexing | RAG pipeline not wired | Show error, allow skip |
| P3 | Minion animations | Rive assets not built | Text-only progress |
| P4 | Cloud Clyffy fallback | Supabase not deployed | Local model + seed families |
| P5 | auto_configure returns JSON string | Not typed struct | JSON.parse in wizard.service |
| P6 | specta bindings for new params | cargo build needed | Raw invoke() with manual types |

### Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| inference_generate fails | Medium | Phase 4 unusable | Raw error + manual override button |
| Symlink needs admin on Windows | High | Import fails | Default to Copy, show Windows-specific error |
| File picker returns UNC path | Medium | Path breaks | Normalize in Rust |

### Milestones

| Sprint | Milestone | Gate |
|--------|-----------|------|
| 1 | Types + State authored | svelte-check passes |
| 2 | Hardware Detection shows real metrics | Visual verification |
| 3 | Slot assignment + download + assign working | Model appears in slot |
| 4 | Model browser + resource allocation visible | Curated models shown |
| 5 | Import routes correctly, symlink works | File in correct subdir |
| 6 | Voice pipeline UI with real stub errors | STT/TTS sections visible |
| 7 | Full 5-phase flow navigable | All phases render |
| 8 | App boots into new wizard | BootOverlay connected |
| 9 | Return users skip wizard | Subsequent launch works |

---

## VERIFICATION CHECKLIST (MANDATORY per sprint)

### After EVERY file edit:
- [ ] Re-read file to confirm edit applied
- [ ] Check for dead imports, unused vars, unreachable code
- [ ] All imports use `.js` extension
- [ ] No raw oklch/hex/rgb — all ColdLight token vars
- [ ] No legacy Svelte stores — only $state, $derived, $effect

### After EVERY sprint:
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `npx biome check` on changed files — 0 errors
- [ ] Grep ALL references to moved/deleted files — must be ZERO
- [ ] Read BootOverlay to verify wizard renders
- [ ] Read models/index.ts to verify exports

### On ANY error:
- [ ] Read FULL error message
- [ ] Read the FULL function producing the error
- [ ] Read 20 lines above and below for context
- [ ] Identify ROOT CAUSE
- [ ] Fix foundational code per plan — NOT a patch
- [ ] If fix requires plan change, STATE and get approval

### On ANY rename/move/delete:
- [ ] Search direct imports
- [ ] Search type references
- [ ] Search string literals
- [ ] Search dynamic imports
- [ ] Search re-exports
- [ ] Search barrel files
- [ ] ALL updated or rename is INCOMPLETE

---

## FILES SUMMARY

**18 new files, 19 modifications, 1 deletion. 9 sprints. Max 5 files per sprint.**

### New Files (18):
1. `features/setup-wizard/wizard.types.ts`
2. `features/setup-wizard/wizard.runes.svelte.ts`
3. `features/setup-wizard/import-router.ts`
4. `features/setup-wizard/seed-families.ts`
5. `features/setup-wizard/index.ts`
6. `features/setup-wizard/wizard.service.ts`
7. `features/setup-wizard/SetupWizard.svelte`
8. `features/setup-wizard/steps/WelcomeStep.svelte`
9. `features/setup-wizard/steps/HardwareDetectionStep.svelte`
10. `features/setup-wizard/steps/ModelLoaderStep.svelte`
11. `features/setup-wizard/steps/SlotAssignmentPanel.svelte`
12. `features/setup-wizard/steps/ImportPrompt.svelte`
13. `features/setup-wizard/steps/ModelBrowserPopup.svelte`
14. `features/setup-wizard/steps/ResourceAllocationPanel.svelte`
15. `features/setup-wizard/steps/VoicePipelineStep.svelte`
16. `features/setup-wizard/steps/SttConfigPanel.svelte`
17. `features/setup-wizard/steps/TtsConfigPanel.svelte`
18. `features/setup-wizard/steps/LatencyTuningPanel.svelte`
19. `features/setup-wizard/steps/ClyfActivationStep.svelte`
20. `features/setup-wizard/steps/ProjectSetupStep.svelte`
21. `features/setup-wizard/steps/CompletionStep.svelte`

### Modified Files:
- `src-tauri/src/commands/models/mod.rs` (Rust — target_slot + import_mode)
- `services/download.service.ts` (new params)
- `layouts/app/BootOverlay.svelte` (import path + viewport)
- `domains/app/models/index.ts` (export paths)

### Deleted Files (1):
- `components/SetupWizard.svelte` (replaced by module)

---

## NOT IN SCOPE

| Item | Reason |
|------|--------|
| Customer onboarding | Separate spec after dev track proves defaults |
| Cloud Clyffy fallback | Requires Supabase deployment |
| Interaction library | Depends on ClyffyRouter |
| DevHub overlay | Separate sprint |
| Smart import (Downloads scan) | Can add to browser later |
| Rive animations | Asset creation needed |
| Voice inference | Engine-level work |
| RAG pipeline | Engine-level work |

---

*Every owner correction captured. No assumptions. No drift. No shortcuts.*
