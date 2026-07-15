# 10 — App-truth recovery: connection-first master plan

> Authored 2026-07-13 from operator screenshots of the RUNNING app + repo ground
> truth. The disease is one thing: **the kernel severance landed in the backend,
> but the UI surfaces were never repointed** — so every route still renders the
> pre-severance world (local GPU tiering, cortex branding, LibSQL/local-Surreal
> tiles, Standalone badge while a live Clyffy sits on the network unheard).
> Fix the wire first; the routes stop lying as a consequence.

## Evidence (operator screenshots, 2026-07-13 22:30)

1. **Clyffy Chat window** — badge reads `AI: Standalone`; header reads
   `DEVPULSE CORTEX MEMORY`; red `No active project` error. Connection down +
   cortex branding alive inside chat (B8 never ran).
2. **Devtools overview** — `Cortex — Memory orchestration` tile alive
   (connectome replaces cortex — purge never ran); `LibSQL` tile (superseded:
   Turso is the local SSOT); `SurrealDB … HTTP :8822 · Sidecar lifecycle` tile
   (SurrealDB lives on ClyffyOS/GB10 now, not a local sidecar); `Qdrant
   embedded` tile (ClyffyOS-side post-split). The dashboard describes the
   pre-split architecture.
3. **Slot Orchestrator** — `No slots` with acres of empty panel; Registry tab
   itself works (52 models listed with sizes/VRAM/capabilities). Devtools law:
   empty states = bug states.
4. **Hardware tier readout** — `CPU only — no discrete GPU detected · Tier
   Minimal · Micro-models only`. The AI layer is being gated by the LOCAL
   dev box's GPU. Post-severance this is architecturally wrong: Tier-2 =
   pure function of the connected endpoint's `GET /v1/capability`. The GB10
   has 128GB VRAM; the local box's GPU must never gate the AI layer.

## Repo ground truth (verified this session)

- Working tree: ~923 insertions across 20 modified + 6 new files, ALL
  uncommitted (wizard recode R-slices half-landed).
- R3a half-landed: `wizard-elevated-hover/-active`, `wizard-inset`,
  `wizard-inset-hover` leaves EXIST in `wizard.tokens.json` and EMIT as CSS
  vars (`components.generated.css:1812-1823`) — but the generated CSS contains
  **zero `:hover` rules**: nothing applies the leaves, so no card ever lifts.
  `cl-radar-sweep` missing from `keyframes.css`; `radar-sweep` mirror missing
  from `animation.tokens.json`.
- Universal-effects violations: `ui/ScanPanel.svelte` (2 scoped `@keyframes`),
  `ui/FoundEndpointCard.svelte` (1 scoped `@keyframes` + arbitrary
  `animate-[…]` utility).
- 09-connection slice plans exist on disk, unexecuted:
  C2 probe-loop status truth · C3 https/scheme discovery · C4 real
  ConnectionMode · B8 cortex purge (census-bucketed) · C6 copy SSOT · CV
  checkpoint.
- CI: `.github/workflows/ci.yml` (3 jobs) + `release.yml` (2 jobs) all
  `runs-on: ubuntu-latest` — GitHub-hosted billing. The 88-core self-hosted
  box is not referenced anywhere.

## Phase 0 — protect the work + stop the money burn (tonight, minutes)

1. WIP-commit the branch (no push): `git add -A && git commit -m "wip(wizard):
   R-slice work in flight — checkpoint before 10-recovery"` — 900+ lines of
   real work stop being one bad keystroke from gone. (Operator fires this.)
2. Kill hosted-runner billing NOW, independent of the runner build-out:
   `gh workflow disable ci.yml && gh workflow disable release.yml`.
   Re-enable after Phase 6 repoints them. Reversible one-liners.

## Phase 1 — the wire: make the scan FIND the running Clyffy (09/C3 + 09/C2)

The Clyffy is up; the app says nothing. Execute the existing slices:

- **C3 first** (`09-connection-slices/slice-C3-https-discovery-schemes.md`) —
  discovery ladder probes the schemes/ports the real endpoint answers on.
- **C2 second** (`slice-C2-probe-loop-status-truth.md`) — every probe attempt
  surfaces as a typed signal; the scan panel can NEVER silently fail again
  (no-mock law: render only what happened).
- **Input needed from operator:** the exact address the running Clyffy
  answers on (scheme+host+port as you'd curl it). That address decides
  whether C3's ladder covers it or the ladder needs a rung.

Exit: scan panel shows the live probe of the real endpoint; connect succeeds;
`ConnectionState = connected` persists; auto-reconnect holds it.

## Phase 2 — capability from the wire, never local hardware (09/C4 + new slice C7)

- **C4** (`slice-C4-connection-mode-real.md`) — local/network/gb10 modes
  really filter the ladder.
- **C7 (NEW slice, to be authored):** rip local-GPU tier gating OFF the AI
  layer. `CPU only → Tier Minimal → Micro-models only` dies as an AI gate;
  Tier-2 model surfaces become a pure function of the advertised
  `EndpointCapability{kind,version,build_sha,slots[]}`. Local hardware stats
  remain ONLY as Tier-1 non-AI system info. This flips the chat badge, the
  model tier readout, and every "Standalone" indicator to wire truth.

Exit: with Clyffy connected, no surface anywhere claims Minimal/micro/
Standalone. Disconnect → indicators degrade honestly (subtle, per the
indicator law), never block Tier-1.

## Phase 3 — cortex purge, app-wide (09/B8)

`slice-B8-cortex-purge-series.md` — the census-bucketed sweep (~44 files).
Kills `DEVPULSE CORTEX MEMORY` in the chat window, the `Cortex` devtools
tile, and every remaining cortex string outside the wizard seam. connectome
vocabulary in; SSOT = kernel_terms.

Exit: `grep -ri "cortex" interfaces/desktop/src` → 0 product-surface hits.

## Phase 4 — devtools/dashboard truth sweep (new slice family, to be authored)

Every tile states the CURRENT architecture or shows an honest bug-state:

- `LibSQL` tile → Turso (local SSOT).
- `SurrealDB` local-sidecar tile → repointed: GB10-hosted, status over the
  wire, connection-gated.
- `Qdrant embedded` tile → honest post-split state (ClyffyOS-side).
- Slot Orchestrator `No slots` → real slot state from the engine, or a
  diagnostic empty-state that says WHY (devtools law: empty = bug).

Slices authored via /coldlight-slices discipline after a census of
`src/lib/devtools/registry.ts` + the overview route. ≤5 files each.

## Phase 5 — wizard interactive effects, universal pipeline only (finish R3a → R4 conformance)

1. Finish R3a: add `cl-radar-sweep` to `keyframes.css` + `radar-sweep` mirror
   to `animation.tokens.json`; `pnpm ds:tokens:build`; verify emitted.
2. **Mechanism gap (the dead-hover root cause):** the `-hover/-active` leaves
   emit as vars with no applier. Probe how `renderforge/render.ts` applies
   preset axes; author the state-leaf applier THERE (universal — every
   preset family gets working `-hover/-active`, not just wizard). This is
   R3a's step-0 stop condition resolved at the root instead of per-component
   CSS. One slice, design/ scope.
3. Purge scoped `@keyframes` from ScanPanel + FoundEndpointCard; rewire to
   SSOT keyframes/utilities per R4b/R4c specs. Verify `@keyframes`-in-
   component = 0 across the wizard tree.
4. HMR checkpoint: mode cards lift on hover, press on click; radar sweep
   spins on a REAL scan; found-card enters via SSOT `slide-up`.

Exit: R4 slices meet the 07 acceptance bar (color AND motion, tooltips,
zero scoped effect CSS), operator eyes on running app (R7/CV checkpoint).

## Phase 6 — CI onto the 88-core box

1. Register the self-hosted runner (88-core host), labels e.g.
   `[self-hosted, windows, x64, core88]` — or Linux labels per that host's OS.
2. Repoint all five `runs-on:` entries; hosted runners remain ONLY if the
   operator wants a cloud fallback lane (default: none).
3. `gh workflow enable` both; one deliberate push; `/ci-watch` to green.

Exit: zero GitHub-hosted minutes billed on routine pushes.

## Sequencing law

0 → 1 → 2 → 3/4 (parallel-safe, different files) → 5 → 6. Phases 1–2 are the
disease; 3–5 are symptoms wearing its colors. Every phase: slice discipline
(≤5 files, one commit, verify in the commit message), no auto-fix, no shims.
Operator fires each phase — nothing auto-chains.

APPROVED BY OPERATOR: ____________
