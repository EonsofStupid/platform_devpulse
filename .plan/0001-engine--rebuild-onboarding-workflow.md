---
id: 0001
boundary: engine
paths:
  - systems/devpulse-engine/src/platform/onboarding/
  - kernel/devpulse-clyffy/src/endpoints/
  - interfaces/desktop/src-tauri/src/commands/onboarding/
  - interfaces/desktop/src/lib/domains/app/onboarding/
touches: [kernel-clyffy, desktop-tauri, desktop-onboarding, desktop-coldlight]
status: draft
owner: Jesse Hades Hall
created: 2026-10-10
updated: 2026-10-10
supersedes: []
specs:
  - .claude/plans/coldlight-recovery/07-wizard-recode-spec.md   # owner's binding requirements
  - .claude/plans/coldlight-recovery/08-wizard-recode-slices/
  - .claude/plans/coldlight-recovery/09-connection-slices/
  - docs/PLATFORM_SPEC_LAYMAN.md
  - .plan/0006-desktop-coldlight--rebuild-preset-system.md
---

# Rebuild onboarding: engine-owned workflow, real endpoint discovery

## Goal

Onboarding is an engine-owned, resumable workflow — endpoint → capability
confirm → complete — that finds real AI endpoints (this machine, home
network, private mesh, saved, configured), shows only what actually
happened, and renders through a presentational UI built from colocated
variants of ColdLight blocks.

## Binding requirements (07 spec, owner's words — summarized, see source)

1. Animated background and its variations (BackgroundScene + MP4).
2. Components stored in the wizard folder as variants of the base design blocks.
3. ColdLight tokens only from the generated build CSS.
4. Tooltips on mouseover everywhere, layman copy from the copy SSOT.
5. A scanning animation that is actually trying to find AI services, local or
   over the network. **No mock: never show a message unless it is true and it
   happened.**
6. Stark crisp edges and depth, zero halos.
7. Signals emitted from the scan (typed event + tracing, 1:1); the UI renders
   only what the signals prove happened.

Flow: endpoint → capability confirm → complete; skip persists; TopBar chip
re-enters. Scan ladder: saved endpoint → configuration → this machine → home
network → private mesh; found endpoints appear as capability cards; manual
entry; honest "scanned, none found".

## Context (verified 2026-10-10)

- This branch (`da9ff1a2`, 2026-06-07) predates the 07 spec. The spec, its
  slices, and their implementation exist in later history (`origin/main`).
  Plan documents restored to `.claude/plans/` on 2026-10-10.
- Implementation in later history, to port (adapted, not copied blind):
  `interfaces/desktop/src-tauri/src/endpoint_discovery.rs` (391 lines — ladder,
  bounded fan-out, `clyffy.discovery` tracing target, read-only rules),
  `setup-wizard/feature/views/EndpointView.svelte`, `ui/ModeCard.svelte`,
  `ui/ScanPanel.svelte`, `ui/ManualEntry.svelte`, `wizard_copy` `connect.*` keys.
- That discovery verified only a Clyffy server (`GET /v1/capability`). Under
  the endpoint model every endpoint must be recognized: OpenAI-compatible
  servers (`GET /v1/models` — Ollama, LM Studio, vLLM, llama-server, embedded),
  Anthropic (Claude), and Clyffy.
- Today the Svelte overlay drives the backend: step state in `wizardState`,
  `autoConfigure()` + per-slot `installToSlot()` via `Promise.all`;
  `auto_configure` returns a JSON string parsed by hand. Onboarding sits inside
  the models domain (`domains/app/models/feature/setup-wizard/`).
- Kernel owns AI configuration only; the engine owns platform flows.

## Structure — plug-and-play by construction

Ports and adapters (the kernel's existing hexagonal style) in Rust; Nx library
types (`feature / ui / data-access / util`, adopted in `79560f8c`) in the
frontend. Adding a scan rung, a protocol probe, or an onboarding step = one new
file + one registry entry; callers do not change.

```text
kernel/devpulse-clyffy/src/endpoints/          AI configuration (kernel)
  mod.rs                 port: discover(), test(endpoint)
  model.rs               Endpoint, EndpointKind (embedded | network | cloud), Capability
  discovery/
    mod.rs               DiscoverySource trait + ladder runner (bounded fan-out, signals)
    saved.rs  configured.rs  this_machine.rs  home_network.rs  private_mesh.rs
  probes/
    mod.rs               EndpointProbe trait (handshake -> capabilities)
    openai_compatible.rs  anthropic.rs  clyffy.rs

systems/devpulse-engine/src/platform/onboarding/   platform flow (engine)
  mod.rs                 facade: start / choose / retry / skip / snapshot
  workflow.rs            state machine: Endpoint -> CapabilityConfirm -> Complete
  store.rs               libSQL checkpoints — resume after crash or close
  events.rs              OnboardingSnapshot + ScanEvent (specta), tracing 1:1

interfaces/desktop/src-tauri/src/commands/onboarding/mod.rs   intents + event forwarding only

interfaces/desktop/src/lib/domains/app/onboarding/             presentational UI
  index.ts               public API
  data-access/           onboarding.state.svelte.ts — mirrors the snapshot; no orchestration
  feature/               OnboardingOverlay.svelte, views/{Endpoint,CapabilityConfirm,Complete}View.svelte
  ui/                    colocated variants of design blocks: ModeCard, ScanPanel,
                         FoundCard, ManualEntry, CapabilityTile, onboarding.tokens.json
  util/
```

## Non-goals

- Endpoint management screen in Settings (add / remove / edit) — plan 0002.
- Embedded runtime install with WSL guidance — plan 0002.
- Clyffy contextual help (plans 0004 / 0005).

## Phases (approval between each; each ≤ 5 files except mechanical moves)

| # | Outcome | Verification |
| --- | --- | --- |
| 1 | Kernel `endpoints/`: discovery ladder + probes (ported, generalized), signals | Unit tests per source and probe; live probe of a real local OpenAI-compatible server |
| 2 | Engine `onboarding/`: workflow, checkpoints, typed events | Unit tests: each transition, resume from each step, idempotent re-run |
| 3 | Tauri intents + snapshot event; bindings regenerated | `cargo check -p devpulse_desktop_backend`; bindings drift gate |
| 4 | Frontend domain `onboarding/` (moved out of `models`); data-access mirrors snapshot; views + colocated variants (07 R4–R6) | Live: scan rows appear only as signals arrive; `svelte-check` 0 |
| 5 | Copy SSOT keys + tooltips (R2), backdrop variations (R3b), stark crisp tokens (R3a, via 0006) | Live: no hardcoded English in views; text scan finds no spec "never see" terms |
| 6 | Checkpoint (R7): owner walks the flow; resume proven (kill mid-step, relaunch); no-mock proven (every UI line maps to a logged signal) | Owner sign-off |

## Decisions needed

1. Endpoints home inside the kernel: `kernel/devpulse-clyffy/src/endpoints/`
   (proposed — the AI orchestrator) or `kernel/model-loader`.
2. Frontend domain layout: the code uses Nx library types
   (`data-access / feature / ui / util`); `docs/platform/Desktop.md` (LOCKED)
   specifies `contracts / state / services / features`. They conflict — pick
   one and the other doc/code is corrected.

## Verification

Recorded per phase in the log.

## Log

- 2026-10-10 — Draft, replacing an invented flow. Grounded in the owner's 07
  spec and its implementation in later history. Onboarding owned by the
  engine; kernel holds AI configuration (endpoints) only.
