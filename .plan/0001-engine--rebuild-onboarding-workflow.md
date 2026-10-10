---
id: 0001
boundary: engine
paths:
  - systems/devpulse-engine/src/platform/onboarding/
  - interfaces/desktop/src-tauri/src/commands/onboarding/
  - interfaces/desktop/src/lib/domains/app/onboarding/
touches: [kernel-clyffy, desktop-tauri, desktop-onboarding, desktop-models, desktop-coldlight]
status: draft
owner: Jesse Hades Hall
created: 2026-10-10
updated: 2026-10-10
supersedes: []
specs:
  - scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md          # owner dictation, SSOT for model-loader UX
  - .claude/plans/coldlight-recovery/07-wizard-recode-spec.md    # owner's binding wizard requirements
  - docs/PLATFORM_SPEC_LAYMAN.md
  - .plan/0006-desktop-coldlight--rebuild-preset-system.md
---

# Rebuild onboarding: engine-owned capability lifecycle over endpoints

## Goal

Every AI capability — Brain, Vision, Voice (listening + speaking), Memory —
can be installed, configured, maintained, and removed from the UI with a
click, and authored as one folder. Every capability is an **endpoint**,
running embedded on this machine or on a server, reached over HTTPS (tier 1)
or a private network — WireGuard, mesh, VPN — when one exists (tier 2). The
**engine** owns this as the onboarding boundary; it writes the resulting AI
configuration into the **kernel**, which holds configuration only.

## Owner requirements (binding — see sources)

From `MODEL-LOADER-UX-REQUIREMENTS.md` (2026-04-04, direct dictation):

1. Friendlier than OpenWebUI / LM Studio / Jan.ai — zero jargon by default.
2. Vision a first-class card; 3. Voice a first-class card (Listening + Speaking, preview, mic, push-to-talk).
4. Configuration updates the existing record in GlobalDb — never creates new; live UI via events.
5. Consumer product: first-run detects hardware → recommends → one-click install; no terminal; plain English; resume failed downloads; real progress, no fake spinners; offline works; undo ("go back to previous").
6. Four sections minimum: Brain, Vision, Voice, Memory.
7. Advanced view behind a feature flag — everything layered, nothing deleted.

From `07-wizard-recode-spec.md` (2026-07-13): real scan that actually tries
local and network AI services; **no mock — a message only when it is true and
happened**; signals behind every UI line; tooltips everywhere; components as
colocated variants of base blocks; generated ColdLight tokens only; crisp
edges, zero halos; animated backdrop variations.

From the owner (2026-10-10): onboarding is an engine boundary that configures
the kernel; everything is an endpoint; tier 1 HTTPS → tier 2 private network.

## Context (verified 2026-10-10)

- Current wizard (June 7, pre-spec) breaks most requirements: jargon,
  per-tile Apply, Svelte orchestrating installs, no resume.
- Later history has a 07-spec scan (`endpoint_discovery.rs`, 391 lines:
  saved → configured → this machine → mDNS → Tailscale mesh, bounded probing,
  `clyffy.discovery` signals) that only recognized a Clyffy server — to be
  ported and generalized.
- A first OpenAI-compatible probe was drafted in `kernel/devpulse-clyffy/src/endpoints/`
  (uncommitted). Probing is a process, not configuration — it moves into the
  engine boundary in phase 1.
- Kernel `interactions` module calls the Setup Wizard an interaction
  template — overlaps this boundary; see Decisions.

## Structure — authored and plug-and-play

Lifecycle per capability follows the **reconcile loop** (desired state vs
observed state → install / repair / update / remove), the pattern Kubernetes
operators use to install *and maintain*. Capabilities are **declarative
manifests**, like package formulae: adding one is a folder, not code changes.

```text
systems/devpulse-engine/src/platform/onboarding/      the boundary (engine)
  mod.rs               facade: start / choose / retry / skip / snapshot; capability registry
  workflow.rs          first-run flow: detect → scan → recommend → install → confirm → complete
  reconcile.rs         desired vs observed per capability: install, repair, update, remove, undo
  store.rs             GlobalDb checkpoints + config history (resume, undo)
  events.rs            typed snapshot + scan/progress events; tracing target 1:1
  connectivity/        how an endpoint is reached
    mod.rs             Tier: Https (1) → PrivateNetwork (2)
    https.rs
    private_network.rs WireGuard / mesh (Tailscale, Headscale) / VPN detection + peers
  discovery/           finding endpoints — one file per source
    saved.rs  configured.rs  this_machine.rs  home_network.rs  private_network.rs
  probes/              identifying protocols — one file per protocol
    openai_compatible.rs  anthropic.rs  clyffy.rs
  runtimes/            embedded endpoints DevPulse installs and runs locally
                       (latest prebuilt servers as subprocesses; WSL-guided where needed)
  capabilities/        one folder per capability — the authoring surface
    brain/   vision/   voice-listening/   voice-speaking/   memory/
      capability.toml  layman copy, protocol, install methods, health check, hardware fit
      mod.rs           optional hooks

kernel/devpulse-clyffy/src/config/                    receives AI configuration only
interfaces/desktop/src-tauri/src/commands/onboarding/ intents + event forwarding only
interfaces/desktop/src/lib/domains/app/onboarding/    presentational UI (first run)
interfaces/desktop/src/lib/domains/app/models/        Model Loader: maintain the same capabilities
```

## Non-goals

- Clyffy contextual help (plans 0004 / 0005).
- Preset system rebuild (plan 0006) — this plan consumes it.

## Phases (approval between each; each ≤ 5 files except mechanical moves)

| # | Outcome | Verification |
| --- | --- | --- |
| 1 | `connectivity/` tiers + `probes/` (OpenAI-compatible moved from the kernel draft) | Live: tier 1 against Ollama on this machine; tier 2 against a mesh peer (`100.x`) |
| 2 | `discovery/` ladder, ported + generalized, with signals | Live scan: every UI-bound event matches a logged probe |
| 3 | `capabilities/` manifests (brain, vision, voice-listening, voice-speaking, memory) + registry; kernel config write path | Manifest schema validation; config written to existing record, never a new one |
| 4 | `reconcile.rs` + `runtimes/` + `store.rs`: install, repair, update, remove, undo; resume | Kill mid-install, relaunch → resumes; undo restores previous config |
| 5 | `workflow.rs` + Tauri intents/events; bindings regenerated | `cargo check -p devpulse_desktop_backend`; bindings drift gate |
| 6 | Frontend `onboarding/`: scan UI, Brain / Vision / Voice / Memory cards, tooltips, layman copy (07 R2–R6) | Live; text scan finds no jargon from UX spec §1 |
| 7 | Model Loader maintains the same capabilities; advanced view behind flag | Live: change a capability → same card updates, no new card |
| 8 | Owner checkpoint (07 R7) | Owner sign-off |

## Decisions needed

1. **Tiers** — read as: tier 1 = direct HTTPS; tier 2 = private network
   (WireGuard, Tailscale/Headscale mesh, VPN), preferred when present. Correct?
2. **Kernel `interactions`** — the kernel module that defines the Setup Wizard
   as an interaction template: move its onboarding parts into this boundary
   (proposed) or keep it as Clyffy's scripted copy only?
3. **Frontend layout** — Nx library types in code vs `Desktop.md`
   `contracts / state / services / features` (still open).

## Verification

Recorded per phase in the log.

## Log

- 2026-10-10 — Rewritten on the owner's UX requirements (restored from the
  June 30 recovery) and the 07 spec. Onboarding is the engine boundary;
  everything is an endpoint; tier 1 HTTPS → tier 2 private network.
