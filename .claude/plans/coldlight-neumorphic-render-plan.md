# ColdLight — Neumorphic Render Plan (close the deferred depth/color/blend gap)

> Extends `.claude/plans/coldlight-recovery/`. Grounded in `design/TRUTH.md §6`,
> `design/SEED-PRESETS.md`, `DESIGN_SYSTEM_SPEC.md`, and `REFERENCES/*.png`.
> NOTHING here authorizes a change until the operator says go. Colors = confirm-first.

## The problem, proven (not claimed)

The design vocabulary is fully authored but **no surface applies it** — the app renders
flat black + green because the presets your components wear are authored flat:

- `--preset-neuro-deep-background-color: var(--color-void-950)` — near-black
- `--preset-neuro-deep-box-shadow: inset … oklch(from var(--color-black) …)` — black-on-black inset = invisible depth
- `--preset-neuro-deep-gradient: none` — no blend
- no accent color, no `--glow-*`, no raised `--bevel-*`
- `--gradient-blend-*` (the two-color diagonal blends): **0 consumers**
- `--bevel-*` / `--glow-*`: **0 component consumers**

Root: the recovery plan's **box-shadow/depth pass was DEFERRED** ("depth tokens teal-tinted,
needs own pass" — INDEX.md, OPEN-after-T3) and **F1 consumer-rebind slices 05–10 are PENDING**.
The deferral is why depth/color/blend never landed.

## The rule this plan enforces (operator's, from TRUTH.md §6)

- **DEFAULT is NEUMORPHIC.** `default` intent → `neuro-elevated`. The neumorphic surface's
  signature = **two accent colors blending diagonally through a low-alpha middle** (the
  `--gradient-blend-*` family) on a **lifted** (not void-950) surface, with a **raised bevel**
  and an **accent/mode glow**.
- **SOME are STARK.** `danger` → `stark-glow`, `warning` → `stark-elevated`, `stark` → `stark-glow`.
  Stark = bold/high-contrast, minimal depth — deliberately NOT neumorphic.
- Other families keep their role: `primary`/`info`/`glass` → glass; `ghost`/`flat` → flat;
  `accent` → chrome; `chat` → the vertical golden-pattern family.
- Preset composition (SEED-PRESETS.md): `surface + blur + depth(bevel) + glow + blend`,
  `glowAlpha 0.35`, `fillAlpha 0.08`; glow hue = surface hue; hover widens spread one step,
  never re-colors. Tokens bind through roles — no raw literals (rulings rule 6).

## Fix — re-author the preset SOURCES (one SSOT, lights up app-wide by design)

All edits are in `interfaces/desktop/scripts/build/styledictionary/tokens/src/presets/*.tokens.json`
then `pnpm ds:tokens:build`. Because every surface wears these via renderForge, fixing the
source re-skins the whole app — that is the app-wide default, not a per-component sweep.

### Phase A — Prove `neuro-deep` (the default neumorphic surface)
1. Re-author `neuro.tokens.json` `deep` variant to the neumorphic spec:
   - surface: a **lifted** dark-but-colored base (role-bound, NOT `void-950`)
   - **bevel**: raised (outset) multi-layer per `DESIGN_SYSTEM_SPEC` (`bevel-outset-*`) —
     light top-left highlight + dark bottom-right, real extrusion (not inset-black)
   - **glow**: accent/mode glow (`--glow-{hue}` at `glowAlpha 0.35`)
   - **gradient**: a `--gradient-blend-*` two-color diagonal (the middle-blend default)
2. Regen → the dashboard cards HMR into neumorphic + colored + blended immediately.
3. Operator eyes: does it read like `DASHBOARD-REFERENCE-01`? Tune the ONE before rolling.

### Phase B — Roll the neuro family
`neuro-elevated` (default), `neuro-minimal`, `neuro-muted`, `neuro-solid` — same recipe at
graded depth/alpha. These cover `default`/`secondary`/`neutral`/`success`/`matte` intents.

### Phase C — Stark family (deliberately NOT neumorphic)
`stark-glow` / `stark-elevated` — bold, high-contrast, minimal depth, semantic glow
(danger red / warning amber). Completes recovery slice-03 (retro/stark literals → refs).

### Phase D — Glass family
`glass-deep`/`glass-minimal` — translucent + blur + subtle blend, per SEED-PRESETS glass tier.

### Phase E — Wire blends as the default surface treatment
Bind `--gradient-blend-*` into the neuro/glass preset `gradient` axis (per-role hue pairing)
so the two-color-blend-in-the-middle is the literal default background, not `none`.

### Phase F — Finish the PENDING F1 consumer rebinds
Recovery slices 05–10: DevPulseDashboard, ChatFrame, etc. still reach `var(--accent-teal-*)`
raw — rebind to roles so consumers stop overriding the preset colors.

## Open item I could NOT find (needs your pointer or a fresh spec)

**The "3 links at the top → Latest pulls my content from my other sites" feature.**
I searched current tree, full git history (deleted docs), `TopBar.svelte`, and the reference
images (`refernece-dashboard3.png` shows menu · DevPULSE · PULSE FEED · bell · Maestro — no
explicit 3-link "Latest"). It is not in the recovered notes. Either point me at where it's
written, or describe it once and I'll spec it into `TopBar` + a content-fetch source for your
ecosystem sites (wiredfront / pixvix / viziwizi / overmind).

## Verification (per phase)
- `cd interfaces/desktop && pnpm ds:tokens:build` — clean regen
- `pnpm check` — svelte-check green
- **Operator run-dev eyes** — the real gate: does it match the reference images
- Grep: `--gradient-blend-*` consumers > 0; `--bevel-*`/`--glow-*` reach surfaces; no raw
  `var(--accent-*-)` literals left in the touched consumers
