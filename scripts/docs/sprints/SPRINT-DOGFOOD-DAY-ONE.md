# SPRINT: Dogfood Day One

> **Goal**: First-run setup must end in a deliberate Apply/Save action.
> **Owner**: EonsofStupid
> **Date**: 2026-04-19
> **Status**: READY FOR EXECUTION

---

## What This Sprint Delivers

By the end of this sprint, a user can:

1. Launch DevPulse on a fresh install and actually see the setup flow.
2. Enter their profile information and persist it.
3. Pick local models for brain, vision, voice, and memory without those picks mutating live state immediately.
4. Choose one assistant routing mode and persist it.
5. Hit a single Apply/Save action that commits the pending setup in one step.
6. Use Claude subscription as an available runtime path.
7. Use one of these exact routing choices:
   - `Local First`
   - `Local + Claude Subscription`
   - `Local + Claude + API Council`
8. Launch into chat with the saved setup.
9. Receive knowledge content from the real backend instead of hardcoded frontend-only stubs.
10. Persist knowledge reactions and selection state.
11. See knowledge appear in at least one live product surface during dogfooding.

---

## Session Boundary

This planning document covers both workstreams that are in scope for Dogfood Day One:

1. Apply/save setup and assistant routing.
2. Knowledge library delivery and integration.

This planning pass modifies the sprint document only.
It does not claim ownership over other in-progress implementation files being worked in parallel.

---

## Verified Current State

These items exist on disk today and are the actual starting point:

| Area | Current State | Evidence |
|------|---------------|----------|
| Platform config split | DONE | `config/platform/**/*.toml` composes into engine build config |
| Claude platform service defaults | DONE | `config/platform/services/system/claude.toml` defines subscription, API, lanes, and council defaults |
| Profile backend commands | DONE | `fetch_user_profile`, `update_user_profile`, `fetch_user_preferences`, `update_user_preferences` are registered in Tauri |
| Setup overlay profile UI | PARTIAL | `SetupWizardOverlay.svelte` already collects name, email, and experience |
| Settings profile UI | PARTIAL | `/devpulse/settings/+page.svelte` already reads and updates profile rows |
| Model registry push state | DONE | `models.state.svelte.ts` listens to `platform:models-status` and filters by capability |
| Model cards | PARTIAL | Brain, Vision, Voice, and Memory cards exist, but they assign immediately on selection |
| Apply button | PARTIAL | `ModelLoaderPanel.svelte` already has `Apply and Launch Clyffy`, but card-level assignment bypasses it |
| First-run seed | BROKEN FOR DOGFOOD | `interfaces/desktop/src-tauri/src/lib.rs` seeds `onboarding_complete = 1` and `display_name = 'Developer'` |
| Claude routing toggle | BROKEN FOUNDATION | `commands/cloud/mod.rs` uses a `preferences(key, value)` shape that does not match the real `preferences` schema |
| Assistant config persistence | DONE | `kernel/model-loader/src/assistant/config.rs` persists user assistant config to `{userdata}/config/assistant.toml` |

---

## SSOT Map

These are the authoritative sources for this sprint. New work must attach to them instead of inventing parallel state.

### Platform-level defaults

- `config/platform/services/system/claude.toml`
  - Declares whether Claude subscription, API providers, and council capabilities exist at the platform level.
  - This is defaults and availability, not per-user choice.

### User-level persisted assistant setup

- `kernel/model-loader/config/assistant.default.toml`
- `kernel/model-loader/src/assistant/config.rs`
  - This is the correct persistence surface for user-facing assistant behavior.
  - New routing mode state belongs here, not in the broken cloud preferences path.

### Runtime model state

- `interfaces/desktop/src/lib/domains/app/models/data-access/models.state.svelte.ts`
  - Rust is the live source of truth after apply.
  - Frontend draft state must sit above this, not mutate this directly until save.

### First-run setup UI

- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/ModelLoaderPanel.svelte`
  - These are the current entry points for first-run configuration.
  - They must converge on a single draft-and-apply flow.

---

## Core Requirement

This sprint does **not** treat model selection as instant-save.

The required behavior is:

1. User changes model picks and routing mode in the UI.
2. Those edits remain draft-only.
3. Nothing commits until the user hits `Apply and Launch Clyffy` or `Save`.
4. One save action writes profile data, assistant routing mode, and model assignments.
5. After save, Rust becomes the live source of truth again and the app launches with those committed values.

---

## Routing Modes

The user-facing routing mode is a single enum with exactly these choices:

1. `local_first`
   - Local chat brain is primary.
   - Claude subscription and API are not used for normal routing.
   - Local slots remain local as always.

2. `local_plus_claude_subscription`
   - Local chat brain remains primary.
   - Claude subscription lane is available for escalation or assisted routing.
   - API providers are not part of the active routing plan.

3. `local_claude_plus_api_council`
   - Local chat brain remains primary.
   - Claude subscription is available.
   - API providers are also available.
   - Council routing may arbitrate between local, subscription, and API lanes.

This is a user setting, not a platform capability flag.

---

## Phase 1: Fix First-Run Reality

**Goal**: make the product actually enter setup instead of pretending it already completed.

### Problem

The current seed path writes a ready-made user row with `onboarding_complete = 1` and `display_name = 'Developer'`.
That defeats dogfooding immediately.

### Files

- `interfaces/desktop/src-tauri/src/lib.rs`
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`

### Required Changes

1. Change first-run seed behavior so a fresh install is actually incomplete.
2. Stop seeding `Developer` as the finished identity state.
3. Ensure the wizard opens on true first run.
4. Preserve the existing profile commands as the persistence path.

### Verification

- Fresh boot opens setup.
- Profile starts unset.
- The app does not silently skip to the dashboard.

---

## Phase 2: Introduce Draft Setup State

**Goal**: separate draft choices from committed runtime state.

### Problem

Today `ModelPicker.svelte` calls `modelsState.assign()` immediately.
That makes the picker itself a save button, which violates the required behavior.

### Files

- `interfaces/desktop/src/lib/domains/app/models/feature/components/ModelPicker.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/BrainCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/VisionCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/VoiceCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/MemoryCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/ModelLoaderPanel.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts`

### Required Changes

1. Add draft slot assignment state in the wizard or model-loader state layer.
2. Change `ModelPicker` from `assign immediately` to `select draft model`.
3. Update all four cards to display:
   - committed model
   - pending model
   - dirty state if draft differs from committed
4. Keep download/import flows able to target draft slots.
5. Make `Apply and Launch Clyffy` the only commit point.

### Draft State Shape

Minimum fields:

```ts
type DraftSetupState = {
  slotAssignments: Record<string, string | null>;
  routingMode: "local_first" | "local_plus_claude_subscription" | "local_claude_plus_api_council";
  profile: {
    displayName: string;
    email: string;
    expertiseLevel: 1 | 2 | 3;
  };
  dirty: boolean;
};
```

### Verification

- Clicking a model changes the UI selection but does not call Rust assignment yet.
- Leaving and re-opening the panel in the same session preserves the draft.
- The live slot stays unchanged until apply.

---

## Phase 3: Persist Assistant Routing Mode Correctly

**Goal**: add the three-mode user preference to the real assistant config surface.

### Problem

The existing cloud command path is not acceptable for this sprint:

1. It models only `Local` vs `Cloud`.
2. It does not express subscription-plus-council behavior.
3. It writes through a table shape that does not match the actual user preferences schema.

### Correct Path

Use assistant config as the persisted user SSOT:

- `kernel/model-loader/config/assistant.default.toml`
- `kernel/model-loader/src/assistant/config.rs`
- `kernel/model-loader/src/service.rs`
- `systems/devpulse-engine/src/platform/services/model_loader.rs`
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs`
- generated bindings

### Required Changes

1. Add an assistant routing enum to assistant config.
2. Default it in `assistant.default.toml`.
3. Add read/write methods in the kernel model-loader service.
4. Expose Tauri commands to get and set the routing mode.
5. Use this path in UI instead of the current cloud toggle path.

### Required Enum

Rust shape:

```rust
pub enum AssistantRoutingMode {
    LocalFirst,
    LocalPlusClaudeSubscription,
    LocalClaudePlusApiCouncil,
}
```

TOML shape:

```toml
[routing]
mode = "local_first"
```

### Verification

- Assistant config round-trips the mode.
- Reloading the app restores the chosen mode.
- No part of setup depends on the broken `InferenceProvider::Cloud` path.

---

## Phase 4: User-Facing Mode Toggle

**Goal**: expose the routing choice where the user actually sets up the app.

### Files

- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`
- `interfaces/desktop/src/routes/(app)/devpulse/settings/+page.svelte`
- optionally a shared presenter under the models domain if the toggle is reused

### Required UX

The setup flow needs one clear assistant mode section with exactly three options:

1. `Local First`
   - fastest and fully local

2. `Local + Claude Subscription`
   - local by default, Claude subscription available

3. `Local + Claude + API Council`
   - local first, Claude subscription available, API providers available, council can arbitrate

### Rules

1. This is a radio-group style choice, not three independent toggles.
2. The chosen option is draft state until apply.
3. Settings page uses the same persisted value after first run.
4. Setup copy must say that local non-chat slots remain local regardless of mode.

### Verification

- The three choices appear in setup.
- One and only one can be selected.
- The selected choice is shown again in settings after save.

---

## Phase 5: Single Apply/Save Transaction

**Goal**: one user action commits the whole setup.

### Files

- `interfaces/desktop/src/lib/domains/app/models/feature/components/ModelLoaderPanel.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`
- Tauri command layer if a batch command is needed

### Required Behavior

`Apply and Launch Clyffy` performs, in order:

1. Persist profile changes.
2. Persist assistant routing mode.
3. Apply slot assignments.
4. Mark setup complete.
5. Launch into the main experience.

### Implementation Constraint

The user-facing flow must behave transactionally even if the backend implementation is multiple commands.

That means:

1. show a single save/apply spinner
2. block duplicate submits
3. surface the first real failure clearly
4. do not silently half-save while claiming success

### Verification

- Changing profile, routing mode, and models together requires exactly one apply action.
- After apply, reopening settings shows the saved values.
- Assigned models are the ones that were pending, not the ones from before the draft.

---

## Phase 6: Model Availability and Capability Fixes

**Goal**: make the draft/apply flow usable with the actual target models.

### Files

- `kernel/model-loader/src/models/discovery.rs`
- model directories on disk for `devpulse.json` manifests

### Required Changes

1. Keep the SigLIP ONNX heuristic fix so `siglip` maps to `VisionEmbedding`.
2. Put authoritative `devpulse.json` manifests next to SigLIP HD and Harrier if those files are on disk.
3. Ensure post-download discovery can produce correct capabilities for these slots.

### Verification

- Vision draft picker shows SigLIP HD.
- Memory draft picker shows Harrier.
- Apply commits those assignments successfully.

---

## Phase 7: Complete Kernel Knowledge Module

**Goal**: ship the knowledge library as part of Day One, not as follow-up work.

### Current State

The knowledge directory exists only partially:

1. `types.rs`, `loader.rs`, and `sync.rs` exist.
2. `mod.rs` is missing.
3. `selector.rs` is missing.
4. `data/` is empty.

### Files

- `kernel/devpulse-clyffy/src/cortex/mod.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/mod.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/types.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/loader.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/selector.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/sync.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/data/*`

### Required Changes

1. Add `mod.rs` so the module is structurally complete.
2. Implement `selector.rs` for runtime entry selection.
3. Add seeded JSON artifacts and a manifest.
4. Ensure loader and sync consume the shipped content consistently.

### Verification

- Knowledge module compiles as a complete unit.
- Seed data exists on disk.
- Selector can return a real entry from shipped content.

---

## Phase 8: Persist Knowledge in User Relational Store

**Goal**: make knowledge part of the actual user data model.

### Files

- `systems/devpulse-engine/src/platform/services/relational.rs`
- boot path that triggers sync from shipped JSON into libSQL

### Required Changes

1. Add the knowledge tables to the user schema.
2. Sync shipped JSON content into libSQL on boot.
3. Preserve per-user seen state and reactions.

### Verification

- First boot creates knowledge tables.
- Seed content is present in libSQL.
- Reboot does not duplicate or destroy user reaction state.

---

## Phase 9: Engine and Tauri Knowledge Facade

**Goal**: expose knowledge through the public engine and desktop boundary.

### Files

- engine-side knowledge facade file under `systems/devpulse-engine/src/platform/services/`
- `interfaces/desktop/src-tauri/src/commands/knowledge.rs`
- Tauri command registration

### Required Changes

1. Convert kernel-internal knowledge types into generalized public types.
2. Add commands for fetch, react, and config.
3. Keep kernel vocabulary behind the existing boundary rules.

### Verification

- Frontend can fetch a knowledge entry.
- Frontend can record a reaction.
- Public surfaces expose generalized shapes only.

---

## Phase 10: Frontend Knowledge Integration

**Goal**: replace hardcoded knowledge placeholders with real backend-fed behavior.

### Files

- knowledge data-access service under `interfaces/desktop/src/lib/domains/app/knowledge/`
- knowledge rune state under `interfaces/desktop/src/lib/domains/app/knowledge/`
- one or more live surfaces such as loading, activity HUD, idle chat, or glossary

### Required Changes

1. Add frontend service wrappers for the knowledge commands.
2. Add rune state for current entry and reactions.
3. Integrate at least one dogfood-visible surface using backend knowledge.
4. Prefer replacing hardcoded frontend knowledge stubs over adding parallel copies.

### Verification

- At least one visible UI surface uses real backend knowledge.
- Reactions persist.
- The frontend no longer depends on a fake-only knowledge path for that surface.

---

## Verification Checklist

- [ ] Fresh boot opens setup instead of skipping it.
- [ ] Name, email, and expertise can be entered and remain draft-only until apply.
- [ ] Brain, vision, voice, and memory selections remain draft-only until apply.
- [ ] Setup exposes exactly these routing choices: `Local First`, `Local + Claude Subscription`, `Local + Claude + API Council`.
- [ ] Claude subscription is available as an option in the saved mode model.
- [ ] Settings page shows the saved profile and saved routing mode.
- [ ] `Apply and Launch Clyffy` commits everything in one user action.
- [ ] After apply, chat opens with the saved setup.
- [ ] SigLIP HD appears for vision if present on disk.
- [ ] Harrier appears for memory if present on disk.
- [ ] Knowledge content is loaded from shipped backend artifacts.
- [ ] At least one UI surface shows real knowledge entries.
- [ ] Knowledge reactions persist and affect subsequent selection behavior.
- [ ] `cargo check -p devpulse-engine` passes.
- [ ] `pnpm check` passes.

---

## File Plan

### Likely modified

- `interfaces/desktop/src-tauri/src/lib.rs`
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/ModelPicker.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/BrainCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/VisionCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/VoiceCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/MemoryCard.svelte`
- `interfaces/desktop/src/lib/domains/app/models/feature/components/ModelLoaderPanel.svelte`
- `interfaces/desktop/src/routes/(app)/devpulse/settings/+page.svelte`
- `kernel/model-loader/config/assistant.default.toml`
- `kernel/model-loader/src/assistant/config.rs`
- `kernel/model-loader/src/service.rs`
- `systems/devpulse-engine/src/platform/services/model_loader.rs`
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs`
- `kernel/model-loader/src/models/discovery.rs`
- `kernel/devpulse-clyffy/src/cortex/mod.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/types.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/loader.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/sync.rs`
- `systems/devpulse-engine/src/platform/services/relational.rs`

### Likely created

- a small shared assistant routing presenter or state file in the models domain if the toggle is reused in setup and settings
- `kernel/devpulse-clyffy/src/cortex/knowledge/mod.rs`
- `kernel/devpulse-clyffy/src/cortex/knowledge/selector.rs`
- knowledge data artifacts under `kernel/devpulse-clyffy/src/cortex/knowledge/data/`
- engine and Tauri knowledge facade files if they do not already exist

---

## Execution Order

1. Fix first-run seed and setup entry.
2. Add draft state for slot assignments.
3. Add assistant routing mode to assistant config.
4. Wire routing mode UI into setup and settings.
5. Make `Apply and Launch Clyffy` commit the whole setup.
6. Finish SigLIP and Harrier capability correctness.
7. Complete the kernel knowledge module and seed data.
8. Add relational sync and public knowledge facade.
9. Integrate knowledge into live UI surfaces.
10. Run smoke test across both setup and knowledge paths.

Track A and Track B can run in parallel, but knowledge remains in-scope for this sprint.
