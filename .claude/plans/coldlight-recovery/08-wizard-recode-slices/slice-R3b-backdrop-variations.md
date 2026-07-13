# R3b — backdrop: the animated VARIATIONS via BackgroundScene (MP4 stays)

## GOAL

Replace the dispatcher's raw `<video>` with the design library's
`BackgroundScene` variation system — the operator's "animated background with
the animated VARIATIONS". The MP4 stays (the `loop-video` variation plays the
SAME asset); a second palette-driven variation layer adds the living color
motion. Format optimization (WebM/AV1) remains W2, untouched.

## Audit facts

- `design/components/background-scene/BackgroundScene.svelte` — 6 variations
  (`circuit-drift, neural-pulse, void-breathe, loop-video, chrome-flow,
  cosmic-galaxy`), props `palette/speed/intensity/motion`, honors
  `prefers-reduced-motion` with `!important` pause (WCAG 2.3.3), and
  `loop-video` renders `/imgs/backgrounds/bganimation_loop.mp4` — the exact
  asset the dispatcher hardcodes today at `SetupWizardOverlay.svelte:70`.
- BackgroundScene mounts as an ABSOLUTE layer inside a positioned parent —
  the dispatcher's current video is `position: fixed`. The dispatcher wraps
  the two scene layers in one fixed, pointer-events-none, aria-hidden div
  (layout-only scoped CSS — allowed).

## PRECONDITIONS

1. R1 committed (tree clean).
2. Probe: `grep -n "MP4_BACKDROP_URL" interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`
   → hits at ~lines 70, 587, 597. Zero hits → STOP.
3. Probe: `grep -n "loop-video" interfaces/desktop/src/lib/design/components/background-scene/BackgroundScene.svelte`
   → hits (variation exists).

## FILES

1. `interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`
   — swap raw video for the variation system.

## STEPS

1. Re-read `SetupWizardOverlay.svelte` in full (656 lines).
2. Import: `import { BackgroundScene } from "$lib/design/components/background-scene/index.js";`
   (verify the barrel exports it: `grep -n "BackgroundScene" src/lib/design/components/background-scene/index.ts`).
3. Delete the `MP4_BACKDROP_URL` const + its doc comment (the asset path now
   lives in the library component — ONE owner). Keep the optimize-media note
   by moving its one-line "W2 lands multi-source AV1/WebM" sentence into the
   backdrop wrapper's comment.
4. Replace the `{#if MP4_BACKDROP_URL}…<video…>…{/if}` block with:

```svelte
<!-- Animated backdrop — the library's variation system (design/
     components/background-scene). Layer 1: the bundled MP4 loop
     (loop-video). Layer 2: a palette variation breathing over it.
     Both are reduced-motion aware inside BackgroundScene (WCAG
     2.3.3). W2 later lands multi-source AV1/WebM inside the
     component — the wizard won't change. -->
<div class="dispatcher-backdrop" aria-hidden="true">
	<BackgroundScene variation="loop-video" intensity="strong" motion="on" />
	<BackgroundScene variation="void-breathe" palette="frost" speed="slow" intensity="normal" motion="on" />
</div>
```

   (`frost` = hue 210 — the blue identity family; `void-breathe` = the
   dual-gradient hue-rotation variation. Layered over the MP4 at the
   component's own opacity scale, the shell keeps reading blue — Lock #6.)
5. Rework the scoped `.dispatcher-backdrop` CSS: keep `position: fixed;
   inset: 0; z-index: 8999; pointer-events: none;` — DELETE `object-fit`,
   `opacity: 0.35` (opacity now belongs to the scene layers' `intensity`)
   and the `@media (prefers-reduced-motion) { display: none }` block
   (BackgroundScene pauses internally; hiding the whole backdrop would kill
   the STATIC frame too — pausing is the honest reduced-motion behavior).
6. `pnpm check` → 0/0. `no-raw-values` on the diff → 0.
7. HMR gate: operator sees the MP4 loop + breathing blue variation behind
   the crisp shell. Report what THEY confirm, not what the code implies.
8. Commit + push: `feat(desktop): wizard backdrop through BackgroundScene variations — MP4 loop + frost breathe`.

## IMPORT REPOINTS

None outside the one file — `MP4_BACKDROP_URL` is module-local (probe:
`grep -rn "MP4_BACKDROP_URL" interfaces/desktop/src/` → hits only in
SetupWizardOverlay.svelte; more hits → STOP and enumerate).

## VERIFY

- `pnpm check` 0/0; diff-stat = 1 file.
- `grep -n "<video" interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte` → ZERO hits.
- Operator's eyes on HMR (step 7) — recorded in the commit body.

## KNOWN REDS

Baseline vitest reds only.

## ROLLBACK

`git checkout -- interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte`

## STOP CONDITIONS

- BackgroundScene barrel doesn't export the component → STOP (report; do not
  add exports in this slice).
- The `background-scene` kind lacks a `default` preset in emitted CSS and the
  component errors → STOP, report (it renderForges `preset: "default"`).
