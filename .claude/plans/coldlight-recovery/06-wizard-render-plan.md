# 06 — Wizard render: double-chrome, crisp edges, token truth (AUDIT + PLAN)

> 2026-07-13. Operator rulings this session: (1) fix the component-inside-component,
> (2) REMOVE the glow — the wizard was supposed to be CRISP EDGES, (3) ColdLight
> tokens must be properly rendering, (4) discovery must SHOW it is scanning.
> NO code is touched until the operator approves this document.

## AUDIT (all evidence read this session, file:line)

### A1 — FOUR chromes nested (operator's count confirmed from code)

The endpoint screen renders four boxed layers inside each other:

| Depth | Element | Chrome it wears | Evidence |
| --- | --- | --- | --- |
| 1 | `[data-layout="setup"]` window backdrop panel | circuit-board field | app.css:36-55 |
| 2 | `<Card preset="wizard-deep" class="shell-card">` | border + depth-z3 + BLUE HALO + blur | OverlayShell:82 |
| 3 | `<Card preset="wizard-solid" class="shell-body">` | border + depth-z2 + PURPLE HALO + bevel | OverlayShell:96 |
| 4 | 2× `<Card as="button" preset="wizard-elevated" class="mode-card">` | border + depth-z1 + TEAL HALO each | EndpointView:152,166 |

Plus found-cards (also wizard-elevated) when discovery returns. RULING: flatten
to **exactly TWO chromes** — the shell, and the interactive wells. The body panel
dies; text flows directly on the shell. The `:global(.shell-body)` rules
(OverlayShell:185-191) are pure layout (flex/gap/pad/min-height) and survive on
a plain div.

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

## OPERATOR RULINGS CHECKLIST — every box needs its evidence before "done"

- [ ] **ONE outer shell, content flows on it** — grep proof: zero `wizard-solid`
      in OverlayShell; template tree re-read shows shell → content → wells only
- [ ] **Max TWO chromes on screen** (shell + interactive wells) — nesting table
      re-derived from code after the change
- [ ] **CRISP EDGES — zero glow halos in the wizard** — grep proof: no `glow-`
      term in any emitted `--preset-wizard-*` box-shadow
- [ ] **ColdLight tokens rendering** — operator's eyes: CTA reads BLUE, wells
      read teal glass, shell reads blue glass on the ladder; if not, next probe
      is computed-styles in the running webview (documented, not guessed)
- [ ] **Discovery visibly scans** — operator clicks Find my Clyffy and watches
      per-rung lines appear live
- [ ] **Zero new hardcoded English** — all new strings via wizard_copy SSOT
      (grep the diff for literals)
- [ ] **Zero new raw values** — `no-raw-values` exit 0 on every commit
- [ ] **Blue identity + MP4 backdrop untouched** — diff scope contains no hue or
      backdrop change
- [ ] **Every slice committed + pushed individually** — git log shows one commit
      per slice with verify lines in the message
- [ ] **Diff never exceeds the plan's FILES list** — `git diff --stat` compared
      against the slice spec before each commit

Failing ANY box = the slice is NOT done and gets reported as failed, per the
chain's no-partial-progress law.

APPROVED BY OPERATOR: ____________
