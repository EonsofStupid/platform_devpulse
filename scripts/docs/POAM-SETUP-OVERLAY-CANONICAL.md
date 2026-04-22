# POAM: Setup Overlay Canonicalization And Model Loader Reset

| Field | Value |
|---|---|
| Status | Canonical planning document |
| Date | 2026-04-13 |
| Owner | Jesse |
| Scope | Setup overlay, model loader, layman UX, runtime truth, route absorption, ColdLight reauthoring |
| Supersedes | Raw requirements dump usage, drifted setup route ownership, older setup sprint authority where it conflicts with this document |
| Primary Goal | Establish one authoritative, guardrailed, layman-first setup overlay for DevPulse that honestly configures, downloads, assigns, loads, and validates the platform |

## 1. Executive Summary

This document is the canonical POAM for the DevPulse setup experience.

The setup overlay is the only source of truth.

The architecture is locked:

1. The setup-wizard domain owns setup business logic, state, service orchestration, copy contracts, checklist rules, help surfaces, and feature components.
2. The app shell owns the mount point and open or close lifecycle for the overlay.
3. Routes are extraction inputs during cutover only. They do not own setup state, setup copy, setup control flow, or setup authority.
4. Rust owns the actual actions, runtime state, loading state, download state, assignment state, boot state, and configuration truth.
5. ColdLight owns visual primitives, semantic tokens, spacing, typography, radius, motion, and accent systems.

The immediate task after this POAM is route absorption. Every useful element under the setup route tree gets reviewed, reauthored into the overlay source of truth, and the route tree gets deleted after parity.

## 2. Settled Architecture

### 2.1 Canonical Ownership

#### Domain authority

- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/SetupWizardOverlay.svelte`
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.ts`
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.service.ts`
- `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.types.ts`

#### Shell authority

- `interfaces/desktop/src/lib/layouts/app/Frame.svelte`
- `interfaces/desktop/src/lib/layouts/app/BootOverlay.svelte`

#### Extraction-only drift during cutover

- `interfaces/desktop/src/routes/(setup)/+layout.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/+page.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/models/+page.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/browse/+page.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/customize/+page.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/activate/+page.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/profile/+page.svelte`
- `interfaces/desktop/src/routes/(setup)/model-loader/complete/+page.svelte`

### 2.2 Required Runtime Authority

#### Kernel SSOT

- `kernel/model-loader/config/slots.default.toml`
- `kernel/model-loader/config/presets.default.toml`
- `kernel/model-loader/config/assistant.default.toml`
- `kernel/model-loader/src/service.rs`
- `kernel/model-loader/src/loading/states.rs`
- `kernel/model-loader/src/hardware/metrics.rs`
- `kernel/model-loader/src/wizard/copy.rs`

#### Engine and service gates

- `systems/devpulse-engine/platform.default.toml`
- `systems/devpulse-engine/src/platform/boot/mod.rs`
- `systems/devpulse-engine/src/platform/boot/whisper.rs`

#### Tauri command surfaces

- `interfaces/desktop/src-tauri/src/commands/models/mod.rs`
- `interfaces/desktop/src-tauri/src/commands/voice/mod.rs`

### 2.3 Kernel Boundary Decision

`kernel/model-loader` is not a Tauri or Svelte boundary violation.

Current responsibility split is valid:

1. Kernel owns slots, presets, assistant config, model discovery, downloads, loading, hardware metrics, inference routing, and lifecycle states.
2. Engine owns boot orchestration, service attachment, persistence bridges, and platform service gates.
3. Tauri command modules own invoke surfaces, DTO mapping, and frontend-safe serialization.

The only cleanup worth planning there in this POAM is reducing configuration ownership confusion such as the default wizard copy location. That is not the primary blocker.

## 3. Product Contract

The setup overlay must let a non-technical user bring DevPulse from first boot to usable platform state without editing config files, understanding model formats, or guessing what the app is doing.

The setup overlay must be better than LM Studio, OpenWebUI, Jan.ai, and similar tools in these ways:

1. More layman-friendly naming and guidance.
2. More honest real-time progress and load narration.
3. More guardrails around hardware fit, slot assignment, and overflow policy.
4. Better integrated token, search, download, assignment, and validation flows.
5. Clearer explanations for optional, disabled, and advanced capabilities.

## 4. Non-Negotiables

1. Overlay is canonical.
2. No route-owned setup state.
3. No `--wiz-*` rendering contract in active UI.
4. No hidden disabled services.
5. No mocked progress, fake load state, or handwritten runtime lies.
6. No raw technical jargon in layman mode.
7. No config-file authoring required for standard users.
8. No broken click-off, reopen, or frozen-overlay behavior.
9. No backwards compatibility shims that preserve duplicate setup ownership.
10. No implementation work is considered complete until verification passes and route drift is removed.

## 5. Canonical Overlay Flow

### 5.1 Phase Order

1. Welcome
2. Hardware Detect
3. Model Plan
4. Browse And Import
5. Slot Customize
6. Download And Assign
7. Load And Verify
8. Voice Configure
9. Activation Test
10. Profile Summary
11. Completion

### 5.2 Mandatory Phases

Mandatory:

1. Welcome
2. Hardware Detect
3. Model Plan
4. Download And Assign
5. Load And Verify
6. Activation Test
7. Completion

### 5.3 Optional But First-Run Visible Phases

1. Browse And Import
2. Slot Customize
3. Voice Configure
4. Profile Summary

### 5.4 Advanced Controls Within Overlay

Advanced controls stay inside the overlay behind progressive disclosure, not in separate authority paths:

1. Per-slot swaps
2. Offload and overflow rules
3. Voice brain routing
4. Wake phrase and keyword workflow setup
5. Detailed model search and import
6. Device placement overrides

### 5.5 Canonical Model Plan Phase Requirements

The `Model Plan` phase is the richest first-run decision surface and must absorb the strongest behavior from the former `models/+page.svelte` route implementation.

Required behavior:

1. Brain chooser chip row across presets and baseline configurations.
2. Required-versus-optional recommendation grouping driven by config, not hardcoded UI assumptions.
3. Layman role tooltips for every recommended role and model family.
4. One-click bulk download and assign CTA with honest preflight and progress narration.
5. Clear logging around tier switch, baseline switch, and setup start so failures are visible and attributable.
6. A clearer preset-selection flow than the current overlay, including visible reasons why a baseline is recommended for the current hardware.

The model-plan phase is not just a tier picker. It is the canonical place where the user chooses a guarded baseline configuration for the platform.

### 5.6 Config-Driven Baseline Configuration Packs

Everything in setup remains config-driven. The overlay does not invent fixed UI-only model bundles.

The system must support a small number of baseline configurations that are defined by config and can mix model formats per role when that is the best fit.

Examples of allowed baseline behavior:

1. SafeTensors for the main brain.
2. GGUF for smaller always-available STT, TTS, or dedicated 24/7 companion brain paths.
3. Large reasoning brain in warm state while smaller companion models remain always available.
4. Mixed GPU and DDR residency rules where the large brain rotates shards or memory pressure between GPU and system memory according to guardrailed policy.

These baseline packs must be surfaced in layman language as guided choices, while remaining fully traceable to config and runtime truth underneath.

## 6. UX Requirements

### 6.1 Layman-First Language

The user sees role and purpose, not raw model internals, by default.

Examples:

1. `chat.brain` becomes `Clyffy's Brain`.
2. `rag.embedder` becomes `Memory Search`.
3. `rag.reranker` becomes `Quality Filter`.
4. `vision.embedder` becomes `Screen Reader` or `Eyes` depending on context.
5. `voice.stt` becomes `Voice Input`.
6. `voice.tts` becomes `Voice Output`.

Technical names remain available in secondary copy, tooltips, or advanced view only.

### 6.2 Checklist Requirements

The setup overlay must have one persistent checklist visible throughout setup.

Minimum checklist items:

1. Hardware detected
2. Brain selected
3. Helper and support models selected
4. HuggingFace access ready
5. Downloads complete
6. Assignments saved
7. Runtime load policy confirmed
8. Models loaded or intentionally deferred
9. Voice path configured
10. Activation test passed
11. Setup complete

Checklist state must be driven by real command, event, or config truth where possible.

### 6.3 Lifecycle States The UI Must Explain

1. Not configured
2. Recommended
3. Already on disk
4. Available locally
5. Search result
6. Queued
7. Downloading
8. Downloaded
9. Assigned
10. Waiting to load
11. Loading
12. Loaded
13. Warm standby
14. Always on
15. Fallback active
16. Failed
17. Blocked by hardware
18. Disabled by config

### 6.4 Error Rules

Every error must explain what happened, what it affects, and what the user can do next.

Each error surface should prefer action choices such as:

1. Retry
2. Pick smaller option
3. Browse alternatives
4. Continue with limited mode
5. Open help or explanation

## 7. ColdLight And Visual System Requirements

### 7.1 Visual Authority

All active setup rendering must use ColdLight semantic tokens, primitives, and utilities.

Relevant sources:

1. `interfaces/desktop/src/lib/design/theme/accent.css`
2. `interfaces/desktop/src/lib/design/components/dynamic-background/DynamicBackground.svelte`
3. `interfaces/desktop/src/lib/design/MASTER-PLAN.md`

### 7.2 Role Accent Mapping

Use existing ColdLight accents as follows:

1. Brain: `accent-violet` or `accent-purple`
2. Helpers and minions: `accent-green`
3. Search, memory, encoder, and vision: `accent-blue` or `accent-cyan`
4. Voice: `accent-coral`
5. Checklist readiness, guidance, and confirmation: `accent-gold`

Error and warning states continue to use semantic warning and danger surfaces.

### 7.3 Layout Rules

1. Use rem units and clamp-based scaling.
2. Use the established aspect-ratio utility patterns.
3. Use the animated configurable background asset and behavior already associated with the setup shell.
4. Keep clear visual hierarchy, guardrails, and progressive disclosure.
5. Do not reintroduce a wizard-local alias token system as a rendering dependency.

## 8. Help, Tooltips, Knowledge Drops, And Clyffy Guidance

### 8.1 Required Help Surfaces

1. Inline tooltip
2. Glossary hover
3. Clyffy popup
4. Did-you-know card
5. Why-this-matters panel
6. Warning card
7. Workflow example panel

### 8.2 Required Knowledge-Drop Coverage

1. Hardware scan and tiering
2. Brain size and recommendation choice
3. HuggingFace token and search
4. Download progress and what is happening
5. Slot assignment and why each role exists
6. Offload and overflow behavior
7. STT, TTS, and speech-to-speech expectations
8. Wake phrase and keyword workflows
9. Completion summary and next steps

### 8.3 Reference Inputs Only

These are reference sources for behavior and information architecture, not direct code reuse:

1. `OLD_PROJECTS_CSS_TSX/GlossaryTooltipHandler.ui.tsx`
2. `OLD_PROJECTS_CSS_TSX/EnvField.ui.tsx`

## 9. Search, Token, Import, Download, And Load Requirements

### 9.1 HuggingFace Search

The overlay must support:

1. Search without token
2. Search with token
3. Private-repo handling
4. Clear tabbed or segmented search and local browse flows
5. Real result metadata and fit indicators
6. Retry and load-more behavior

### 9.2 Token Management

The overlay must support:

1. Add token
2. Update token
3. Clear token
4. Masked token inspection with suffix or explicit eye-reveal behavior
5. Explanation of why the token helps
6. Clear distinction between anonymous and authenticated download behavior

### 9.3 Local Import

The overlay must support local model import with honest loading state and no UI freeze.

Accepted file types:

1. `.gguf`
2. `.safetensors`
3. `.onnx`
4. `.bin`

The system should intelligently suggest role fit for imported models while still allowing explicit user choice.

### 9.4 Download Progress

Download progress must show:

1. Friendly model name
2. Exact stage
3. Percentage
4. Bytes transferred
5. Speed
6. ETA when available
7. Cancel and retry state

### 9.5 Load Progress

Model load state must show:

1. Which slot is loading
2. Whether the model is queued, mounting, warming, or ready
3. GGUF or SafeTensors shard or mount progress where supported
4. Why a load is blocked or deferred

### 9.6 Baseline Mix And Runtime Presentation

The overlay must explicitly support and explain mixed-format baselines.

That means the user can be placed onto a recommended platform configuration where:

1. The main reasoning brain may be SafeTensors-backed.
2. Smaller dedicated real-time or 24/7 components may be GGUF-backed.
3. Voice, speech-to-speech, and helper runtime paths may use different backends or formats than the main brain.
4. The UI still presents one coherent guardrailed platform setup instead of exposing backend complexity as user burden.

The overlay must explain why a given baseline uses a mixed strategy in plain language such as speed, memory stability, always-ready voice, or better hardware fit.

## 10. Slot And Runtime Configuration Requirements

### 10.1 Minimum Setup-Visible Slots

1. `chat.brain`
2. `minion.shared`
3. `minion.escalation`
4. `rag.embedder`
5. `rag.reranker`
6. `vision.embedder`
7. `voice.stt`
8. `voice.tts`
9. `voice.brain`
10. `voice.wake`

### 10.2 Brain Modes

The overlay must expose these concepts in user-facing form:

1. Always loaded 24/7
2. Warm standby
3. Load on demand
4. GPU first
5. CPU only
6. Partial GPU offload
7. Overflow to system RAM
8. Reject when over budget

The brain-mode system must also support the case where a large primary brain stays warm while a smaller dedicated always-available companion or voice-facing brain remains live for responsiveness.

### 10.3 Offload And Overflow Controls

Required control types:

1. Layman presets
2. Advanced device placement
3. GPU versus CPU priority
4. Overflow rule selection
5. Offload level or layer strategy where available
6. Clear hardware budget visualization

The layman presets must be capable of representing shard rotation or residency policy between GPU and DDR without exposing raw implementation jargon unless the user expands advanced controls.

### 10.4 Voice Modes

The setup UI must expose and explain:

1. STT
2. TTS
3. Speech-to-speech
4. Wake phrase
5. Keyword workflows and actions
6. Push to talk
7. Always listening
8. Dedicated voice brain versus shared brain handling

Voice and speech-facing runtime can be backed by smaller dedicated models or mixed-format configurations where that improves responsiveness or keeps the large reasoning brain warm instead of always active.

## 11. Runtime Truth Matrix

### 11.1 Real Today

1. Hardware detection
2. Preset and slot SSOTs
3. HuggingFace search and download infrastructure
4. Slot assignment infrastructure
5. Boot-time model loader orchestration
6. Overlay shell mount path in app shell

### 11.2 Real But Incomplete Or Partial

1. Setup overlay itself: currently incomplete phase coverage
2. Voice domain UI: real structure exists, not fully surfaced in setup
3. Kokoro: backend path exists, full end-to-end runtime still incomplete
4. Whisper: backend exists, disabled by config and not fully active end to end

### 11.3 Explicitly Disabled Or Not Attached

1. Whisper service is disabled by config in `systems/devpulse-engine/platform.default.toml`
2. Grammar service is not yet attached in facade boot

These must be shown honestly in the UI with reasons and next actions. They are not hidden.

## 12. Overlay Dismissal, Reopen, And Window State Requirements

1. Backdrop click must be deliberate and predictable.
2. Escape must behave predictably.
3. Reopen must preserve state.
4. Download and load activity must continue or pause intentionally, never vanish silently.
5. Returning to the overlay must restore exact mem-state without freezing.
6. Window focus changes must not orphan popups, token dialogs, or load-progress views.

## 13. Devtools Split

### 13.1 First-Run Setup Must Cover

1. Hardware fit
2. Brain and support model selection
3. Token and search setup
4. Download and assignment
5. Load and runtime validation
6. Voice baseline configuration
7. Activation test

### 13.2 Later Devtools Can Own Ongoing Administration

1. Slot manager
2. VRAM budget inspector
3. Token manager
4. Voice lab
5. Keyword workflow editor
6. Service status
7. Download and load queue
8. Test bench and diagnostics

These remain consumers of the same domain and Rust command surfaces. They must not fork setup logic.

### 13.3 Guardrailed Devtools Requirement

The platform still needs clear layman-friendly devtools for ongoing configuration after first run.

Those tools must make these concerns understandable and safe:

1. Choosing or changing baseline configurations.
2. Seeing which roles use GGUF versus SafeTensors and why.
3. Understanding whether the large brain is hot, warm, on demand, or overflowing into DDR.
4. Managing smaller 24/7 companion or voice-facing models.
5. Adjusting offload and overflow behavior without exposing raw backend complexity by default.

These tools are not a second source of truth. They are guided consumers of the same config-driven setup domain and kernel runtime state.

## 14. Route Absorption Map

### 14.1 Extraction Sources

#### `routes/(setup)/+layout.svelte`

Absorb:

1. Animated and configurable background shell behavior
2. Setup-only visual staging cues worth preserving

Delete after parity.

#### `routes/(setup)/model-loader/+page.svelte`

Absorb:

1. Welcome entry flow intent
2. Hardware-scan gating and logging behavior

Delete after parity.

#### `routes/(setup)/model-loader/models/+page.svelte`

Absorb:

1. Brain chip switching
2. Preset selection cards
3. Required versus optional grouping
4. Layman help rows
5. Bulk download initiation and visible queue behavior
6. Better tier-switch and setup-start logging
7. Clearer baseline-selection flow

Delete after parity.

#### `routes/(setup)/model-loader/browse/+page.svelte`

Absorb:

1. Local versus HuggingFace browse surface
2. Grouped local model inventory
3. Import flow
4. Shared download banner behavior

Delete after parity.

#### `routes/(setup)/model-loader/customize/+page.svelte`

Absorb:

1. Role-grouped slot cards
2. Swap-popup entry and flow
3. VRAM bar usage in-context

Delete after parity.

#### Wrapper routes

These are delete-after-parity with no independent authority:

1. `routes/(setup)/model-loader/activate/+page.svelte`
2. `routes/(setup)/model-loader/profile/+page.svelte`
3. `routes/(setup)/model-loader/complete/+page.svelte`

## 15. Execution Plan And Milestones

### Milestone 1: Establish Overlay POAM Authority

Done by this document.

Deliverable:

1. Canonical planning document exists
2. Overlay authority locked
3. Kernel boundary question answered

### Milestone 2: Review And Absorb Every Setup Route File

Deliverable:

1. A file-by-file merge map
2. Overlay components or phases that replace each useful route surface
3. A delete-after-parity list for each route file

### Milestone 3: Reauthor Overlay To Full Phase Coverage

Deliverable:

1. Full canonical phase sequence in overlay
2. ColdLight-only visuals
3. Checklist and knowledge-drop system integrated

### Milestone 4: Route Tree Removal

Deliverable:

1. BootOverlay no longer routes into setup pages
2. `(setup)` route tree removed
3. No duplicate setup authority remains

### Milestone 5: Runtime Honesty Hardening

Deliverable:

1. Real download and load narration
2. Honest disabled-service surfaces for Whisper and Grammar
3. Token, search, and voice flows surfaced in overlay

### Milestone 6: Verification And Cleanup

Deliverable:

1. Frontend checks clean
2. Rust checks clean
3. Drift docs archived and labeled

## 16. Archive And Drift Policy

### 16.1 Active Inputs Only

Reference inputs worth mining, not obeying blindly:

1. `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`
2. `scripts/docs/sprints/BUILD-DIARY-WIZARD.md`
3. Relevant setup and voice sprint docs only when they contain unique decisions not contradicted by this POAM

### 16.2 Drift To Archive

1. Setup route ownership docs that assume routes are authoritative
2. Sprint docs that conflict with overlay authority
3. Wizard alias-token assumptions that conflict with ColdLight authority

### 16.3 Delete-After-Parity

1. Entire `interfaces/desktop/src/routes/(setup)` tree
2. Any duplicate setup renderer outside the overlay domain

## 17. Verification Gates

### 17.1 Ownership Gate

Search must show one active setup owner only.

### 17.2 Frontend Gate

1. `pnpm svelte-check`
2. Biome or equivalent formatting and linting on edited setup files

### 17.3 Rust Gate

1. `cargo check -p model-loader`
2. `cargo check -p devpulse-engine`
3. `cargo check -p devpulse_desktop_backend`

### 17.4 Functional Gate

1. First boot opens the overlay under the app shell.
2. Background is animated and configurable.
3. Hardware shows honest CPU and GPU state.
4. Search and token flows work.
5. Downloads show honest progress.
6. Loads show honest state.
7. Reopen preserves state.
8. Activation proves chat works.
9. Completion returns to the platform cleanly.

### 17.5 Runtime Honesty Gate

Every visible state in the overlay must map to a real command, event, config, or persisted runtime state.

## 18. Definition Of Done

This POAM is fulfilled when all of the following are true:

1. The setup overlay is the only setup authority.
2. Every useful route behavior has been reauthored into the overlay domain.
3. The setup route tree is deleted.
4. The overlay is fully ColdLight-authored with no wizard alias token dependency.
5. Layman help, glossary, tooltips, popups, and checklist surfaces are present and useful.
6. HuggingFace token, search, download, assign, and load flows are honest and easy to use.
7. Slot, VRAM, overflow, CPU, DDR, and GPU controls are surfaced in a clear guided way.
8. STT, TTS, speech-to-speech, Kokoro, Whisper, Grammar, wake phrase, and keyword workflow states are represented honestly.
9. Dismiss and reopen behavior is stable.
10. Verification gates pass and drift is archived or deleted.