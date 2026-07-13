# 06 — Wizard render: double-chrome, crisp edges, token truth (AUDIT + PLAN)

> 2026-07-13. Operator rulings this session: (1) fix the component-inside-component,
> (2) REMOVE the glow — the wizard was supposed to be CRISP EDGES, (3) ColdLight
> tokens must be properly rendering, (4) discovery must SHOW it is scanning.
> NO code is touched until the operator approves this document.

## AUDIT (all evidence read this session, file:line)

### A1 — The double component (component inside component)

`OverlayShell.svelte:82-103`: `<Card preset="wizard-deep" class="shell-card">`
(Tier 2 chrome: border + shadow stack + blur) DIRECTLY wraps
`<Card preset="wizard-solid" class="shell-body">` (Tier 3: its OWN border +
shadow stack + bevel). Two full chromes nested with zero content between them —
the boxed-card-inside-boxed-card seam visible in the operator's screenshot.
The `:global(.shell-body)` rules (OverlayShell:185-191) are pure layout
(flex/gap 0.75rem/pad 1rem/min-height 9rem) and survive on any element.

### A2 — The glow inventory (wizard scope)

All three wizard presets stack an emission halo into `box-shadow`
(`wizard.tokens.json`, emitted at components.generated.css:1783-1811):

| Preset | box-shadow today | Halo term |
| --- | --- | --- |
| wizard-deep | `var(--depth-z3), var(--glow-blue)` | glow-blue = 1.875rem/0.75rem blue halo (glow.css:20) |
| wizard-solid | `var(--depth-z2), var(--glow-purple), var(--bevel-subtle)` | glow-purple halo |
| wizard-elevated | `var(--depth-z1), var(--glow-teal)` | glow-teal halo |

The "dumb blue glow" around the shell IS `--glow-blue`. Mode cards + found-cards
inherit wizard-elevated's halo. Crisp-edges ruling ⇒ halos leave the WIZARD
presets (glow primitives stay in the library for surfaces that legitimately use
them — deferred ≠ retired).

### A3 — Token chain truth (verified end-to-end, not guessed)

`Button preset="primary"` → renderForge (`render.ts:90-95`) →
`var(--style-button-primary-*, var(--preset-button-primary-*, fallback))` →
per-kind tier EMPTY (verified: zero `--style-button-primary-*` in emitted CSS) →
shared tier `--preset-button-primary-background-color: var(--accent-primary-main)`
(P2.4) → `accent.css:11 → role.css:7 → --accent-blue-main → color.css:48
oklch(0.55 0.14 240)`. Button applies the vars (`Button.svelte:62,69-70`), glue
consumes them (`render-base.css:31-34`). The chain RESOLVES; what murders
legibility on screen is A1+A2 (halos over halos, chrome inside chrome) plus the
formerly black panels (fixed in W0 `1fb6e096`). After A1/A2 land, the blue CTA
and the ladder read cleanly — verified by the operator's eyes, not by svelte-check
(type gate only, agreed).

### A4 — Discovery shows nothing while scanning

Backend streams `DiscoveryEvent::{SourceScanned, Found, Finished}` per rung
(`endpoint_discovery.rs:70-90`). `EndpointView.svelte:86-98` listens ONLY for
`found`. While scanning, the UI shows a spinner on the button and otherwise
nothing — no "checked localhost / mDNS / mesh" lines. The operator cannot see
that scanning is happening ("does nothing to show you are even trying").

## PLAN — two slices, each verified, each one commit

### S-A (2 files + regen): kill the double chrome + crisp edges

1. `OverlayShell.svelte`: inner `<Card preset="wizard-solid" class="shell-body">`
   → `<div class="shell-body">` (content field of the ONE shell; existing
   layout rules keep spacing; comment updated to record the ruling).
2. `wizard.tokens.json` box-shadow values (SOURCE, then regen):
   - wizard-deep: `var(--depth-z3), var(--glow-blue)` → `var(--depth-z3)`
   - wizard-solid: `var(--depth-z2), var(--glow-purple), var(--bevel-subtle)` →
     `var(--depth-z2), var(--bevel-subtle)` (preset kept for future use even
     though the shell no longer wears it — value made ruling-consistent)
   - wizard-elevated: `var(--depth-z1), var(--glow-teal)` → `var(--depth-z1)`
   Identity hues/borders/ladder untouched. No other preset family touched.
3. Verify: `pnpm ds:tokens:build` exit 0; grep emitted lines 1783-1811 show
   depth-only shadows; `pnpm check` 0/0; `no-raw-values` exit 0; HMR → operator
   sees ONE crisp-edged shell, flat interior, distinct wells, blue CTA.

### S-B (2 files): discovery scan feedback

1. `wizard_copy.default.toml` (connect section): add keys
   `scan_source_persisted/configured/localhost/mdns/mesh` (layman labels, e.g.
   "your saved endpoint", "your config file", "this machine", "your home network
   (mDNS)", "your private mesh") + `scan_checked` ("Checked {source}") +
   `scan_finished` ("Scan complete — {count} found") — copy stays in the SSOT,
   zero hardcoded English in the view.
2. `EndpointView.svelte`: extend the existing listener for `source_scanned` +
   `finished`; render a live scan-progress list (mono, muted, one line per rung
   as it completes) under the discover button while `discovery === "searching"`,
   replaced by the found-cards / none-found copy on finish.
3. Verify: `pnpm check` 0/0; `no-raw-values` exit 0; operator clicks Find my
   Clyffy and SEES each rung report in real time.

### Out of scope here (already planned elsewhere, untouched)

Mode-card functional modes (04/C4) · wizard forward-flow C1 (landed `62c61d50`) ·
chat window W1 · MP4→WebM W2 · cortex-vocabulary purge B8.

APPROVED BY OPERATOR: ____________
