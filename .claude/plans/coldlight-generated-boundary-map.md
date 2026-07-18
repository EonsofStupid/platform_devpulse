# ColdLight — LANE-BY-LANE ALIGNMENT MAP (dry run, zero changes)

**Date:** 2026-07-17 · **Method:** READ the emitted CSS pair-by-pair against its generator and its token source. Not "where do files live" — "is each lane authoring the thing it is supposed to author, and where do two lanes emit the same thing." Every row was read, not grepped-for-counts. Tailwind v4 namespace list verified against tailwindcss.com/docs/theme (2026-07-17).

---

## The mental model that was missing

`theme/` and `styles/` are **not** a copy of each other by accident. They are meant to be **two different lanes**:

| Lane | Job | Correct output |
|---|---|---|
| `styles/` | Define the **VALUE** of every token, layered | `@layer tokens.* { :root { --x: <value> } }` |
| `theme/` | **REGISTER** tokens with Tailwind so utilities exist | `@theme` / `@theme inline` with a **Tailwind namespace** name |

The bug is not "theme duplicates styles." The bug is that **the theme generator, for most domains, emits the VALUE again under the SAME name in an unlayered `@theme` block** — doing styles/'s job, badly, on top of styles/. Where the generator remaps to a real Tailwind namespace, the lane is clean and there is **zero** duplication. **The repo already contains the correct pattern; it just isn't applied everywhere.**

---

## LANE 1 — `theme/` (Tailwind registration)

### 1.1 The measurement (all 23 theme files, read + classified)

712 vars emitted into `@theme` (`:root`, **unlayered**); 81 into `@theme inline` (no `:root` emit).

| | count | meaning |
|---|---:|---|
| earn a Tailwind utility (valid namespace) | **364** | legitimate — keep |
| **DEAD WEIGHT** — name is not a TW v4 namespace → generates **0 utilities** | **348** | pure liability |
| **COLLIDE** with a `styles/` definition (same name, unlayered beats layered) | **644** | the cascade defect |

**644 collisions ≈ the entire 765 CONTESTED audit number.** One mechanism, not scattered rot.

### 1.2 Why — proven from the generator

`coldlight/tailwind-theme` format (`sd.config.mjs:700-751`): a token whose **source value** is a whole `{ref}` → `@theme inline { --x: var(--target) }` (`:733-736`, rebindable, correct — this half was fixed as "audit finding F5"). **Everything else → `literals.push()` → `@theme { --x: <baked value> }`** (`:740`, unlayered).

The name only becomes a *Tailwind* name if `tw4Remap` (`:137-151`) maps it. It maps exactly **6 things**: `bevel→inset-shadow`, `textSize→text`, `space→spacing`, `zIndex→z`, `motion.ease→ease`, `motion.animation→animate`. Everything else keeps its raw name — which is why `--accent-*`, `--gradient-*`, `--transition-*`, `--elevation-*`, `--surface-*`, `--role-*`… are emitted verbatim, collide with `styles/`, and (not being TW namespaces) produce no utilities.

Note: even `zIndex→z` is dead — `--z-*` is **not** a Tailwind v4 namespace (the list is color/font/text/font-weight/tracking/leading/tab-size/breakpoint/container/spacing/radius/shadow/inset-shadow/drop-shadow/blur/perspective/zoom/aspect/ease/animate). Only `bevel→inset-shadow`, `textSize→text`, `space→spacing`, `motion.ease→ease`, `motion.animation→animate` land on real namespaces.

### 1.3 The correct pattern is already in the repo — `bevel`

| file | @theme | earns utils | dead | collides | verdict |
|---|---:|---:|---:|---:|---|
| **bevel.css** | 7 | **7** | 0 | **0** | ✅ MODEL — remapped to `--inset-shadow-*`: real namespace, different name |
| **text-composed.css** | 30 | **30** | 0 | **0** | ✅ custom typography format, own namespace |
| color.css | 179 | 179 | 0 | 179 | ⚠ earns utils BUT collides — name-shares `--color-*` with styles/ |
| typography/text-style/text | 97 | 97 | 0 | 97 | ⚠ same: valid namespace, colliding name |
| radius / blur | 14 | 14 | 0 | 14 | ⚠ same |
| **gradient.css** | 54 | **0** | 54 | 54 | ❌ not a namespace, pure collision |
| **transition.css** | 50 | **0** | 50 | 50 | ❌ |
| **surface.css** | 49 | **0** | 49 | 49 | ❌ |
| **elevation.css** | 45 | **0** | 45 | 45 | ❌ |
| **accent.css** | 32 | **0** | 32 | 32 | ❌ (+38 inline that are correct) |
| border / backdrop / motion / role / shadow / interaction / signal / overlay / scrollbar / spacing(29) | — | 0 | ~245 | ~245 | ❌ |

**Alignment rule (one change in the generator, not 700 files):** `theme/` must **never emit a value**. Every theme var is either
1. a **reference** to its `styles/` sibling under a **remapped Tailwind namespace** (`@theme inline { --inset-shadow-x: var(--bevel-x) }` — extend `bevel`'s model), or
2. **not emitted at all** if the domain has no Tailwind namespace (gradient, transition, elevation, surface, accent, role, backdrop, signal, overlay, scrollbar, interaction have **no** TW namespace → they belong ONLY in `styles/`; delete their theme platform).

Even `bevel` today copies the literal instead of referencing `var(--bevel-x)` — so a runtime rebind of `--bevel-subtle` does NOT reach `--inset-shadow-subtle`. Referencing (option 1) fixes that too.

**Projected: 644 collisions → 0. 348 dead vars → 0. CONTESTED 765 → ~121.** The number that got *worse* over five days, fixed at its generator, not chased across 57 consumer files.

---

## LANE 2 — `styles/` (the token VALUES) + the component-color source

### 2.1 `styles/` itself is authored correctly

Every file is `@layer tokens.{primitives,semantic,components}` (`styles/index.css:4`). Values resolve through the ramp: `--accent-teal-main: var(--color-teal-400)` (`accent.css:29`). The role aliases are real: `--accent-primary-main → --primary-main → --accent-blue-main`. **This lane is right.** Its only problem is that `theme/` (Lane 1) overrides it unlayered.

### 2.2 The component-color source IS a real lane — but 100% raw literals

`components.generated.css` (`--style-{kind}-*`) is fed by `collect-element-seed-defs.mjs`: it parses each component's `@defaults` doc-comment → `tokens/src/style-defaults.json` (**tracked** — corrected; I earlier said untracked, that was wrong) → SD5 → `--style-{kind}-{axis}`. renderForge resolves `var(--style-{kind}-{preset}-{axis}, var(--preset-…, …))` (`collect:20-23`). **A component documenting its own default look is a legitimate lane — not drift.**

The defect is the **values**:

| | count |
|---|---:|
| components with `@defaults` | 86 |
| color values in `@defaults` | **306** |
| authored as a raw literal (`oklch(...)`) | **306** |
| authored as a role reference (`{role...}`) | **0** |

`Button.svelte:16` and `Card.svelte` both hard-code the identical `oklch(0.0901 0.017 224.61 / 0.8)`. This is rule 6 violated **306 times at the source**, and it is the hue-224/hue-173 concentration behind the teal wash — NOT the emitter, the **seed values**.

**Alignment:** `collect-element-seed-defs.mjs` already pass-through-emits whatever the `@defaults` say. Change the **inputs**: `"background-color": "{surface.card}"` instead of `"oklch(...)"`. The lane and generator are fine; 306 doc-comment values must become role references. (This is operator ruling slices 05–10 territory — the "wrong-name rebind" batches — plus a source re-seed.)

---

## LANE 3 — `svg/` (a second, parallel token+glue lane)

Structure mirrors Lanes 1–2 and is **internally coherent**, but its two halves don't meet:

| file | kind | emits/defines | references |
|---|---|---|---|
| `svg/presets/svg-presets.generated.css` | GENERATED (SD5 platform `css-svg-presets`, `:1060`) from `tokens/src/svg-presets.json` | `--svg-style-*` (200 props) | `var(--cl-svg-accent-main)` ×**33** |
| `svg/svg-accent-defaults.css` | HAND-AUTHORED | `--svg-accent-{main,glow,fill}` ×**4** | correctly → `var(--accent-main)` (the role) |

**Break: the generated side says `--cl-svg-accent-*`; the hand side defines `--svg-accent-*`.** 33 refs, 0 definers → the entire `--svg-style-*` accent tier is guaranteed-invalid. `svg-accent-defaults.css` even documents itself as the P2.4 fix for "audit finding F4" (the teal pin) — and it is correct — but the generated side never got the matching rename in its **source** (`svg-presets.json`, untracked). This is **slice 02**, which merged at `4ca9e6ab` then was reverted by PR #28 and never re-landed (see `coldlight-single-system-build-plan.md`).

**Alignment:** one edit in `tokens/src/svg-presets.json` — `cl-svg-accent` → `svg-accent` — then regen. `git show 95537cdf` is the exact known-good diff.

---

## LANE 4 — `generated/*.css` glue (no generator exists)

Six CSS files imported by `design/index.css:19-46` that **no platform emits** — hand-authored, three wearing false `AUTO-GENERATED` badges:

| file | what it is | correct lane |
|---|---|---|
| `render-base.css` | renderForge var→property glue (the `[data-cl-*]` contract) | **legit glue** — but consumes 6 vars nothing emits (`--focus-ring/-offset`, `--hover-filter`, `--active-filter`, `--gap`, `--z`); `:79 gap:var(--gap)` no fallback → gap never applies (ruling Q19) |
| `keyframes.css` | **the effects SSOT** — see below | needs a generator |
| `diagonal-blends.css` | 88 literals, hardcoded brand hex `#17deef` | tokenize → SD5 |
| `focus.css` / `scrollbars.css` / `typography.css` | small glue, **false generated badge** | either generate or drop the badge |

### 4.1 The effects system — exists, well-designed, defeated by a missing generator

`keyframes.css:1-18` is the central-effects system the boundary asks for: all keyframes `cl-`-prefixed (collision-free), consumed by **any** feature/block/component via `class="animate-[cl-breathe_...]"`, explicitly banning component `<style>` keyframes. **This is correct design.** It fails on three points:

1. **No generator.** Header: *"today no generator exists, so keyframes are hand-authored here AND mirrored into the token JSON."* Rule B is thus violated **by instruction** — no one can obey "never touch runtime CSS" when the CSS has no emitter.
2. **The hand-mirror has drifted destructively.** CSS = **28** keyframes; `animation.tokens.json` = **22**. Six exist ONLY in CSS: `cl-glow-pulse, cl-crt-flicker, cl-scanline, cl-neon-buzz, cl-specular-sweep, cl-alert-pulse` (the CRT/cyberpunk set). Build the promised generator today → it emits 22 and **deletes those 6**. → the JSON must ABSORB the 6 first.
3. **Its own rules already broken:** 5 keyframes unprefixed (`pulse-glow, fade-in, slide-up, slide-down, scale-in`), and **21 scoped `@keyframes` in component `<style>`** (BackgroundScene `hue-shift`, DynamicBackground, ClyffyHeadshot/Mascot, SpriteAnimator, datastore heroes…) — each an effect authored outside the SSOT.

---

## LIVE BUG (found by reading, not grepping) — `claude.css` emitted, never imported

`sd.config.mjs:1038` registers `cssFile('claude.css', pathFilter('claude'), semantic)`. The barrel that becomes `styles/index.css` is a **hand-typed template literal** in `build.mjs:53-68` — it imports 15 semantic files; `claude.css` is not one. On disk: `styles/semantic/claude.css`, 12 props, **0 importers → dead.** Same class as the `:1039` warning ("chat + wizard were authored but never emitted"). **Root cause: the barrel is retyped by hand in `build.mjs` while the file list lives in `sd.config.mjs` — two sources, guaranteed drift. The barrel must be DERIVED from the platform file list.**

---

## THE ALIGNMENT (what "authored in its lane" means, per lane)

| Lane | Today | Aligned | Change surface |
|---|---|---|---|
| `theme/` | 712 values re-emitted unlayered; 348 dead, 644 collide | reference-only, remapped TW namespace, or NOT emitted | **1 generator** (`tailwind-theme` format) + drop ~11 namespace-less theme platforms |
| `styles/` | correct, but overridden by theme/ | wins once theme/ stops emitting values | none (fixed by Lane 1) |
| `@defaults` seed | 306 raw literals, 0 refs | role references | **306 doc-comment values** re-seeded → `{role...}` |
| `svg/` | `cl-svg-accent` vs `svg-accent` mismatch, 33 dead refs | names meet | **1 line** in `svg-presets.json` + regen (re-land slice 02) |
| `generated/` glue | 6 hand-authored, no emitter | generated from token sources | **build keyframes/filters/blends generators**; absorb 6 orphan keyframes FIRST |
| barrel | hand-typed, drifts (claude.css) | derived from platform list | **1 change** in `build.mjs` |
| folder layout | 6 emit roots | one `generated/` root, organized | 28 `buildPath` edits (mechanical, LAST) |

**Order:** (1) fix the `tailwind-theme` generator → kills 644 collisions, the biggest single win; (2) derive the barrel → kills claude.css class; (3) re-land svg slice 02; (4) absorb the 6 keyframes, then build the keyframes generator; (5) re-seed the 306 `@defaults` to role refs; (6) tokenize blends/parasite; (7) repoint buildPaths into one folder LAST (pure move, once everything it moves is correct).

---

## Corrections to my own earlier claims tonight (so they are not repeated)

- `style-defaults.json` is **TRACKED**, not untracked (I said untracked — wrong).
- `theme/` is not "duplicate CSS" — it is a **mis-generated registration lane**; where remapped (`bevel`) it is correct and collision-free. The fix is the generator, not deletion of the folder.
- The component tier is not "winning the cascade" — `theme/` (unlayered) wins; and the teal comes from **306 raw `@defaults` seeds**, not the emitter.
- Generation is NOT monochrome: 948 unique colors / 33 hue buckets emit correctly (css-analyzer). Teal is a **seed + consumption** defect.
