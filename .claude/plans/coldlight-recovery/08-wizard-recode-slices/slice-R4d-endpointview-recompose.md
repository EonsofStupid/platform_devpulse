# R4d — EndpointView recomposition: thin view, tooltips complete

## GOAL

EndpointView ends the family as a THIN composition — mode row, discover row,
scan panel, found cards, manual well, status badges, footer — with a tooltip
on EVERY remaining interactive element and zero leftover chrome/CSS debt.

## PRECONDITIONS

1. R4a, R4b, R4c DONE. Tree clean.
2. Probe: `grep -c ":global(.mode-card\|:global(.found-card\|:global(.address" …/feature/views/EndpointView.svelte` → 0
   (the moves happened). Non-zero → STOP, a prior slice is incomplete.

## FILES

1. `…/setup-wizard/feature/views/EndpointView.svelte` — final pass only.

## STEPS

1. Re-read the file in full. Build the tooltip completeness table — every
   interactive/informational element vs its SSOT key:
   - discover button → `discover_tooltip` (landed R4b — verify)
   - mode cards → landed R4a (verify)
   - manual reveal button → `manual_tooltip` (landed R4c — verify)
   - footer Back → `back_tooltip` — ADD (Tooltip trio around the Button)
   - footer Skip → `skip_tooltip` — ADD
   - footer Continue → `continue_tooltip` — ADD
   - connected/connecting Badges → title text already self-describing; wrap
     connected Badge with `skip_hint`?? NO — badges keep their live status
     text; no tooltip fabrication. Leave.
2. Verify the view carries ZERO visual CSS: its `<style>` may only contain
   `.endpoint-view`, `.mode-row`, `.discover-row`, `.found-list`,
   `.footer-spacer` layout rules (flex/grid/gap/max-width/margin — rem+cqi).
   Anything else left → it was missed by its owning slice: STOP and report
   (do not silently absorb).
3. Confirm doc comment reflects the recode (component roster, scan surface,
   no-mock law) — rewrite the header comment to match reality.
4. `pnpm check` 0/0 · `no-raw-values` 0.
5. HMR gate — the operator walks the ENTIRE connect step: crisp shell, mode
   cards w/ tooltips + lift, real scan pop + sweep + truth rows, manual well
   carved-in, footer tooltips. This is the R4-family eyes moment.
6. Commit + push: `refactor(desktop): EndpointView thin recomposition — tooltip-complete connect step (R4d)`.

## IMPORT REPOINTS

None expected. `grep -n "import" EndpointView.svelte` must show only consumed
modules (unused import = incomplete work — trace WHY before deleting).

## VERIFY

Step 4 · diff-stat = 1 file.

## KNOWN REDS

Baseline only.

## ROLLBACK

`git checkout -- …/feature/views/EndpointView.svelte`

## STOP CONDITIONS

- Any fix belonging to R4a-c discovered here → STOP, report which slice
  regressed; do not absorb cross-slice work.
