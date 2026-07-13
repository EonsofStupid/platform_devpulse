# 08 — Wizard recode slice family (INDEX)

> Executes the BINDING spec in `../07-wizard-recode-spec.md`. Authored 2026-07-13
> from a full ground-truth audit (every file re-read this session — EndpointView,
> SetupWizardOverlay, OverlayShell, CortexView, wizard.state, wizard.types,
> wizard.tokens.json, bevel.tokens.json, BackgroundScene, Tooltip types, copy.rs
> ConnectCopy, wizard_copy.default.toml [connect], endpoint_discovery.rs
> DiscoveryEvent/DiscoverySource, card.types.ts CardPreset, kind-families.ts).
> ZERO destinations assumed — every path below exists in the tree today or is a
> file this family creates inside an existing folder. NO new directories.

## The operator's acceptance bar (verbatim, from 07 + 2026-07-13 rulings)

Real OKLCH color · containers with **stark neumorphism** (crisp hairline edges +
bevel depth, ZERO glow halos) · interactive elements with color AND motion ·
ColdLight style tokens from the BUILD-generated CSS faithfully (RAC-pattern
components: ColdLight-owned behavior + renderForge preset chain) · REM + fluid
container sizing (cqi) · tooltips on mouseover everywhere, layman verbatim ·
a cool scanning animation that is ACTUALLY trying to connect — **NO MOCK: never
able to show a message unless it is true and it happened** · signals emitted
from every scan attempt (tracing target + typed event, 1:1) · Rust = brain,
Svelte = dumb UI · animated background = the animated VARIATIONS, MP4 stays
(format optimization = W2, later) · blue shell / purple / teal identity stays.

## Slice DAG (status column updated by /coldlight-execute)

| # | Slice | Depends on | Status | Operator-eyes gate |
| --- | --- | --- | --- | --- |
| R1 | scan-signal backend (finish + verify + commit) | — | IN-PROGRESS (edits on disk, unverified) | — |
| R2 | copy SSOT — every key, verbatim | — | PENDING | — |
| R3a | neumorphic token pass (wizard presets + wizard-inset) | — | PENDING | — |
| R3b | backdrop → BackgroundScene variations | — | PENDING | HMR: animated variations visible |
| R4a | ModeCard (colocated variant, tooltip, selected state) | R2, R3a | PENDING | — |
| R4b | scan.state + ScanPanel (the live scan surface) | R1, R2, R3a | PENDING | HMR: real scan renders live |
| R4c | FoundEndpointCard + ManualEntry | R2, R3a | PENDING | — |
| R4d | EndpointView recomposition (thin view, tooltips complete) | R4a, R4b, R4c | PENDING | HMR: whole connect step |
| R5 | CapabilityView replaces CortexView (SSOT copy, no cortex) | R2 | PENDING | HMR: confirm step honest |
| R6 | dispatcher cleanup (dead views, forward flow) | R5 | PENDING | — |
| R7 | CHECKPOINT — operator walks the 10-box checklist | ALL | PENDING | FULL walk |

Every slice: one commit, pushed, verify output in the commit message. The
operator fires each slice (`/coldlight-execute` semantics — never auto-chain).

## Verification law (every slice)

- `cd interfaces/desktop && pnpm check` → 0 errors 0 warnings
- Rust slices: `cargo check -p <crate>` (NEVER workspace-wide)
- Token slices: `pnpm ds:tokens:build` exit 0 + grep the EMITTED css for the
  exact expected lines (stated per slice)
- Zero hardcoded English in views — grep the diff for string literals
- `no-raw-values` hook exit 0 (no `--no-verify`, ever)
- `git diff --stat` ⊆ the slice's FILES list (generated/regen artifacts exempt
  but named)
- KNOWN REDS (do NOT chase): Sheet.test.ts (5) + Checkbox.test.ts (2)
  pre-broken baseline; 106 pre-existing vitest failures (V1-F1); Sonar
  React-hook rule on `*.svelte.ts` is rule-scoping noise.

## RULED by the operator (2026-07-14 — no longer open)

1. **Q-1 — RULED: "yes enable assist."** `clyffy-collab` leaves `VIEW_ORDER`
   (stays on disk, reachable by `goTo`) and becomes the agent-popup
   "enable assist" moment per 07's popup track. R6 executes this.
2. **Q-2 — RULED: plan 04 happens in full.** Modes become REAL
   (`ConnectionMode` local / network / gb10 filtering discovery rungs) —
   planned as slice C4 in `../09-connection-slices/`. R2 carries the third
   mode card's copy so C4 never touches copy; R4a builds ModeCard so C4 only
   adds the third instance + the mode wire.
3. **UNIVERSAL EFFECTS LAW (operator, 2026-07-14)** — effects, colors, and
   design live in the UNIVERSAL pipeline only: keyframes SSOT
   (`generated/keyframes.css` + `animation.tokens.json` mirror), preset state
   leaves (neuro-family mechanism), primitives (bevel/depth). Wizard
   components carry ZERO scoped effect CSS — scoped `<style>` = layout + the
   one sanctioned Lock #6 overlay + a11y reduced-motion guards ONLY. Every R4
   slice verifies `@keyframes`-in-component = 0. The flow is: runtime styles
   folder (build-emitted) → component WEARS it by preset reference →
   colocated typed variant in the domain — plug-n-play.

## What this family does NOT touch (planned elsewhere, deferred ≠ retired)

B2 probe-loop stale-Connecting (04/C2) · https discovery schemes (04/C3) ·
real ConnectionMode filtering (04/C4) · B8 cortex purge outside the wizard
seam (44-file sweep, 04) · W1 chat window · W2 MP4→WebM/AV1 · agent popup
subsystem (07 track, after this family) · **F-slot-layman**: SLOT_LAYMAN's
purpose/tagline strings in SetupWizardOverlay are pre-existing hardcoded
English feeding the tiles — named debt, moves to the engine copy SSOT in its
own follow-up slice after R7.

APPROVED BY OPERATOR: ____________ (answers to Q-1/Q-2 count as part of the
approval; "go" fires R1)
