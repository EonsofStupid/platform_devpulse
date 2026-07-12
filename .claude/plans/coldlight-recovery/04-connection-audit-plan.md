# Connection Audit + Execution Plan — the wizard → auto-connect → Clyffy chain

> 2026-07-12. Three read-only audits (wire crate + backend, wizard + frontend,
> config/persistence/seams). Facts carry file:line in the audit transcripts.
> NOTHING below executes without the operator's approval on this document.

## Verdict: the chain is REAL — the wizard exit and the mode story are the breaks

**WORKS end-to-end (verified, no hardcodes):**
boot seed (persisted choice wins over config; empty default = honest standalone) →
unconditional re-pointable probe loop (15s cadence, never gives up, event on change)
→ 5-rung discovery ladder (persisted / configured / loopback / mDNS
`_clyffy._tcp.local.` / tailscale mesh peers — every candidate verified by the real
`GET /v1/capability` handshake, bounded fan-out) → `connect_clyffy` (validate, set,
persist ATOMICALLY with boot readback) → typed events → frontend rune → all three
no-AI indicators live → **Tier-2 surfaces genuinely computed from capability slots**
(honest Tier-1 when empty). Contract = specta-generated from the shared
`clyffyos-wire` crate; **zero parallel DTOs; zero banned host/port/id hardcodes**
(config defaults 8080/`_clyffy._tcp.local.`/15s/5s are overridable constants, not
targets). With no clyffyd alive the client answers Disconnected honestly and Tier-2
lights up the instant one exists.

**THE BREAKS:**

| # | Finding | Evidence |
| --- | --- | --- |
| B1 | **Wizard dead-ends after connect**: endpoint → cortex → Continue lands on an EMPTY `installing` view (0 installs, no nav, auto-advance early-returns) — user stuck. Both views say "step 1 of 2 / 2 of 2": cortex-Continue was meant to FINISH | CortexView:245 → next(); SetupWizardOverlay:424 guard; InstallingView:16-18 no footer |
| B2 | **Stale `Connecting` bug**: probe loop's loop-local `last` never observes `connect_clyffy`'s store write — connect to an unreachable endpoint and `connection_status` reports `Connecting` forever | lib.rs:507,522 vs clyffy.rs:101 |
| B3 | **Modes are cosmetic**: no `ConnectionMode` anywhere; the Local/GB10 cards toggle CSS only — `connect()`/`discover()` never read `mode` | EndpointView:60,157,171; loader.rs has no mode key |
| B4 | **Discovery can never find an https endpoint**: all three URL builders hardcode `http://`; SPEC names https for network/GB10 — reachable today only by manual typing | endpoint_discovery.rs:193,258,286 |
| B5 | clyffy-collab (Claude-key step) unreachable forward — auto-advance jumps installing→complete over it | SetupWizardOverlay:428 |
| B6 | Dead code: `ClyffyClient::connect(&RegisteredEndpoint)` (never called), `wizardState.firstRun/refreshFirstRun` (stale docstring), `SlotSaveView` (not in VIEW_ORDER) | client.rs:102; wizard.state:84-130 |
| B7 | Copy/vocabulary hardcodes: CortexView title/subtitle English literals, ClyffyCollabView all-English, indicator labels "AI: Clyffy/Standalone" ×3, `"clyffy.local"` in customer copy — all outside the wizard_copy SSOT | SetupWizardOverlay:522-523; StatusBar:127; TopBar:129; chat Frame:66 |

**Deferred ≠ retired (untouched):** the welcome/hardware/preset local-install tail
(legacy path, Back-reachable), flat 15s retry without backoff, coarse 2-variant
error taxonomy, Tier-2 commands returning "endpoint pending" (correct until clyffyd
exists in the clyffyos repo).

## Execution plan (slices ≤5 files, gate + verify each, one commit each)

| Slice | Fix | Files (≤5) |
| --- | --- | --- |
| C1 | **Wizard completes**: connect path ends after cortex (Continue → finish/complete, never the legacy install tail); auto-advance guard corrected; step labels stay truthful. Depends on Q-C1 for clyffy-collab | wizard.state.svelte.ts, SetupWizardOverlay.svelte, CortexView.svelte |
| C2 | **Status truth**: probe loop dedups against the STORE's current state (not loop-local `last`) so command writes are observed; unreachable connect settles to Disconnected honestly | src-tauri/src/lib.rs (+ cargo check -p devpulse_desktop_backend) |
| C3 | **https discoverable**: `discovery_schemes: Vec<String>` (default `["http"]`) in ClyffyServiceEntry; the three URL builders iterate configured schemes — config-driven, nothing hardcoded | engine loader.rs, endpoint_discovery.rs |
| C4 | **Modes become real** (shape per Q-C4): `ConnectionMode` modeled; mode selection filters which discovery rungs run (local→loopback+mDNS · network→mDNS+mesh · gb10→mesh+configured); persisted with the choice | loader.rs, endpoint_discovery.rs, clyffy.rs/connection_store.rs, EndpointView.svelte |
| C5 | Dead-code retirement (B6) — absorb-verify then delete | client.rs, wizard.state.svelte.ts, SetupWizardOverlay.svelte |
| C6 | Copy → SSOT (B7): CortexView/ClyffyCollabView/indicator labels into wizard_copy + terminology | wizard_copy.default.toml + the 4 consumers |
| CV | **Checkpoint**: run-dev, operator walks it — auto-open → discover → confirm → cortex → FINISH; skip path; TopBar re-entry; unreachable-endpoint honesty (B2 proof) | — |

Order: C1 → C2 → CV(first pass) → C3 → C4 → C5 → C6 → CV(final).

## Operator questions (block only their own slice)

- **Q-C1** — clyffy-collab (bring-your-Claude-key): (a) insert forward after cortex as an optional step, or (b) keep out of the forward flow (reachable later via devtools/settings)?
- **Q-C4** — modes: (a) real `ConnectionMode` filtering discovery rungs as above (recommended), or (b) delete the cards and let discovery cover everything (guidance text only)?

APPROVED BY OPERATOR: ____________
