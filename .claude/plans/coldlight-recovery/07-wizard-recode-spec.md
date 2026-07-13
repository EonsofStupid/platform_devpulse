# 07 — WIZARD COMPLETE RECODE (operator order 2026-07-13: "you will literally recode this wizard")

> Supersedes 06's S-A/S-B (its audit + checklist carry over). NO code until the
> operator approves THIS spec. Pre-release law: reauthor, no shims, no half-edits.

## THE OPERATOR'S DEFINITIVE REQUIREMENTS (2026-07-13, their words — BINDING)

1. **The animated background — the animated VARIATIONS** (the BackgroundScene
   variation system + the MP4 asset; the wizard backdrop is animated, theirs).
2. **Properly authored = components stored IN the wizard folder as VARIANTS off
   the base design blocks** (central-library law: base in design/, typed feature
   variants colocated in setup-wizard/).
3. **ColdLight style tokens from the style CSS GENERATED FROM BUILD, faithfully**
   (SD5-emitted chain only — no ad-hoc styling).
4. **Tooltips on mouseover** (layman copy, everywhere).
5. **A cool scanning animation showing it is ACTUALLY trying to find the AI
   services — local or over the network — and it must ACTUALLY be trying to
   connect. NO MOCK: never able to show a message unless it is true and it
   happened.** Clear layman-friendly messaging + actual status as it runs.
6. **Stark crisp edges + depth** — the stark family aesthetic: crisp hairlines,
   depth shadows, zero halos.
7. **Signals emitted from the scan** for clear logging + baseline configurations
   — the strict signal system (tracing targets + typed events, 1:1); every scan
   attempt emits its structured signal, and the UI renders only what the
   signals prove happened.

## Requirements (earlier decode, still mandatory)

1. **Individual components styled properly** — every element wears its ColdLight
   preset chain; no bare pills, no default chrome, no half-styled anything.
2. **Animated background stays** — the MP4 backdrop (W2 later optimizes format).
3. **Tooltips on mouseover** — every interactive + informational element carries
   a layman tooltip (design/components/tooltip), copy from the SSOT.
4. **Actual verbatim layman-friendly copy** — Teaching-Mode voice everywhere,
   zero hardcoded English in views, all keys in wizard_copy.default.toml.
5. **The ACTUAL scan shows** — clicking Find my Clyffy pops a live scan surface
   showing real attempts as they happen: each rung (your saved endpoint / your
   config / this machine / your home network / your private mesh) with live
   status, each candidate URL probed shown as attempted → reached/no-answer,
   found endpoints materializing as capability cards.
6. **Crisp edges, zero glow halos; exactly TWO chromes** (shell + interactive
   wells) — 06's A1/A2 rulings.
7. **Blue shell / purple / teal identity + lightness ladder stay** (W0).
8. Flow: endpoint → capability confirm → complete (C1 landed); skip persists
   decided; TopBar chip re-enters. Cortex VOCABULARY dies per B8 (names from
   kernel_terms SSOT — the confirm view presents the connected Clyffy's
   capability slots, never an "embedded cortex").

## Rebuild slices (each ≤5 files, verified, one commit, HMR to operator's eyes)

- **R1 — backend scan-attempt events**: add `DiscoveryEvent::CandidateProbed
  { url, reached }` (wire enum lives in clyffyos-wire? NO — DiscoveryEvent is
  DESKTOP-side: endpoint_discovery.rs:70-90) + emit per probe in the verify
  fan-out (endpoint_discovery.rs:330-345); regen specta bindings. Files:
  endpoint_discovery.rs, events.rs if needed, regen. cargo check -p
  devpulse_desktop_backend.
- **R2 — copy SSOT**: every new key for the recode (mode tooltips, scan rung
  labels, scan attempt lines, confirm-view slot layman names, complete view,
  errors) in wizard_copy.default.toml `connect.*` — layman verbatim voice.
- **R3 — OverlayShell recode**: ONE crisp shell (wizard-deep, depth-only
  shadow), animated backdrop slot kept, mascot + step indicator, content flows
  directly, footer. Kill the wizard-solid body Card. (wizard.tokens.json glow
  strip rides here + regen.)
- **R4 — EndpointView recode**: mode cards (wizard-elevated, crisp, Tooltip on
  each explaining local vs GB10 in layman), Find-my-Clyffy primary CTA,
  **ScanPanel** (new colocated component in the view's folder — the live scan
  surface consuming clyffyDiscoveryProgress: rung rows with spinner→check,
  attempt lines streaming (mono, muted), found capability cards with Confirm),
  manual entry reveal, connected/connecting badges, skip. Tooltips throughout.
- **R5 — capability confirm view recode** (replaces CortexView; name from
  kernel_terms vocabulary): renders the CONNECTED Clyffy's advertised slots as
  layman tiles (computed from capability, honest empty when standalone),
  tooltips per tile, Continue finishes (C1 logic).
- **R6 — CompleteView + dispatcher wiring recode**: hardcoded title/subtitle
  literals out (SSOT), clyffy-collab stays out of forward flow, dead views
  (SlotSave/firstRun) removed per 04 C5.
- **R7 — CHECKPOINT**: operator walks the whole wizard against the 06 checklist
  + requirements 1–8; each box ticked with evidence or the slice family is NOT
  done.

## Verification law per slice

svelte-check 0/0 · no-raw-values exit 0 · cargo check (R1) · zero hardcoded
English in views (grep the diff) · emitted-CSS greps for preset changes ·
git diff --stat ⊆ FILES list · commit + push each slice · operator's eyes at R7
(and at R3/R4 via HMR mid-family).

APPROVED BY OPERATOR: ____________ ("go" executes R1→R7 in order, reporting
each slice; any deviation stops and reports.)
