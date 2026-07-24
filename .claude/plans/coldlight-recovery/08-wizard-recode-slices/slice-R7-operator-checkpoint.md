# R7 — CHECKPOINT: the operator walks the wizard against the bar

## GOAL

No claim of DONE without the operator's eyes. This slice produces EVIDENCE
per box, in `03-verification-log.md`, with the operator confirming each
visual box in the running app (`cargo xtask run-dev`).

## PRECONDITIONS

R1–R6 all DONE and pushed. `git status` clean.

## THE CHECKLIST (each box = evidence or the family is NOT done)

Render + structure:
- [ ] ONE outer shell; content flows on it (grep: zero `wizard-solid` in
      OverlayShell; template tree pasted)
- [ ] Max TWO chromes visible (shell + interactive wells) — nesting table
      re-derived from the CURRENT code
- [ ] STARK NEUMORPHISM, ZERO GLOW — emitted grep: every
      `--preset-wizard-*-box-shadow` = depth/bevel terms only, no `glow`
- [ ] wizard-inset wells read carved-in (operator's eyes)
- [ ] Real OKLCH color on the ladder: blue shell / teal wells / blue CTA —
      operator's eyes; disagreement → computed-styles probe in the webview,
      documented, not argued

Motion + tooltips + copy:
- [ ] Animated background = BackgroundScene VARIATIONS incl. the MP4 loop
      (operator's eyes)
- [ ] Interactive elements: color + motion (mode-card lift, found-card
      entrance, scan sweep) — operator's eyes
- [ ] Tooltip on EVERY interactive element, layman verbatim — walk each
      surface with the mouse
- [ ] Zero hardcoded English in views — `grep -rn` for quoted sentences in
      `setup-wizard/**/*.svelte` (pasted, only `?? ""` fallbacks allowed)

The scan (no-mock law):
- [ ] Find my Clyffy pops the ScanPanel; sweep runs ONLY while the ladder
      runs; rung rows + probe lines correspond 1:1 to the emitted signals —
      cross-check the UI against
      `query_scoped_log("clyffy.discovery", …)` output in the same run
- [ ] With no clyffyd anywhere: the honest empty result renders
      (scan_finished_none) and NOTHING claims success
- [ ] Every scan attempt visible in the scoped log (tracing 1:1)

Flow:
- [ ] endpoint → capability → complete walks clean; Skip persists decided;
      TopBar chip re-enters to endpoint
- [ ] Capability step honest-empty standalone; no cortex vocabulary anywhere
      in the wizard seam (grep pasted)

Process:
- [ ] One commit per slice, pushed, verify lines in messages (`git log
      --oneline` pasted)
- [ ] Every slice's diff ⊆ its FILES list (spot-check two slices)

## STEPS

1. Ensure `cargo xtask run-dev` serves; walk the operator through each box
   IN ORDER, collecting their yes/no per visual box.
2. Write the evidence table into
   `.claude/plans/coldlight-recovery/03-verification-log.md` as entry V2.
3. Any box failing → the owning slice reopens (INDEX → PENDING + note);
   report honestly. NO partial-done reporting.
4. All boxes green → mark the family DONE in INDEX; commit the log update:
   `docs(plans): V2 — wizard recode checkpoint evidence (R7)`.

## STOP CONDITIONS

The operator says stop, or any evidence contradicts a DONE slice.
