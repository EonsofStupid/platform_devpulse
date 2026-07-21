# RENDERFORGE.md — the runtime styling resolver + modern-CSS derivation layer

> **Authority:** this file. Replaces all references to the non-existent
> "RenderForge.md Law N" comments scattered through the renderforge/* sources.
> See TRUTH.md for the architecture-wide ground truth.
>
> **2026-07 modernization (this revision):** the old model baked every visual
> value into a token literal and let the resolver *echo* it through a `var()`
> fallback chain. Modern CSS — `color-mix()`, relative color syntax
> (`oklch(from …)`), typed custom properties (`@property`), container **style**
> queries (`@container style(--density: …)`), `light-dark()`, and `@layer` — is
> now Baseline and makes that bake-everything indirection obsolete. Effects
> (blend, bevel, glow, density) are **derived**, not baked. This doc defines the
> derivation contract. It is why the app can finally render its default look:
> **a two-colour diagonal blend on a neumorphic surface**, computed from an
> accent — never a flat `gradient: none`.

`renderForge` maps a `(kind, preset, state)` triple to a `(dataAttrs, cssVars)`
pair a component spreads onto its DOM root. It is one pure function. It does
**not** compute colour maths — that is the job of the derivation glue, in CSS,
so the resolver stays runtime-agnostic (Svelte **and** React) and the browser
does the interpolation.

---

## 0. The three layers (read this first)

RenderForge is no longer "a resolver." It is three cooperating layers:

| Layer | Where | Job |
|---|---|---|
| **1 · Resolver** | `renderforge/render.ts` (pure TS) | Emit **input** custom properties: which accent, which look, how deep. No colour maths. |
| **2 · Registry** | `glue/registry.css` (`@property`) | **Type** the input axes (`<color>`, `<angle>`, `<length>`, `<percentage>`) so they inherit correctly and **animate**. |
| **3 · Derivation glue** | `glue/render-base.css` (`@layer`) | **Compute** the visible effect — blend, bevel, glow, density — from the typed inputs using `color-mix()` + relative colour. |

The old "20 static longhand vars, pass-through only" model is Layer 1's *legacy*
output. It stays (a hand-authored `@defaults` axis must still be able to win),
but it is now the **fallback floor**, not the mechanism. The mechanism is
derivation in Layer 3.

```
resolver emits  --accent, --accent-2, --look, --bevel-depth …   (Layer 1)
       ↓ typed + animatable via @property                        (Layer 2)
glue derives    background-image: linear-gradient(… color-mix …) (Layer 3)
                box-shadow:      … oklch(from var(--surface) …)
```

---

## 1. Public API (unchanged)

```ts
import { renderForge, cssVarString } from '$lib/design/renderforge';

const m = $derived(renderForge({ kind: 'card', preset: 'default', state: 'default' }));
// m: { kind, dataAttrs: {...}, cssVars: {...} }
```

`cssVarString(m.cssVars)` is the only sanctioned bridge from `cssVars` to the
DOM. Components spread `m.dataAttrs` and set `style={cssVarString(m.cssVars)}`.

---

## 2. Layer 2 — the `@property` registry (NEW, load-bearing)

Untyped custom properties are strings; the browser **cannot interpolate** them,
so a gradient built from them can never animate and an invalid value silently
poisons the whole declaration. Registering each visual input with `@property`
gives it a type, a guaranteed `initial-value` (so the derivation never resolves
to garbage), controlled inheritance, and — critically — **animatability**.

`glue/registry.css` (emitted by the SD5 pipeline). Note: `@property`'s
`initial-value` MUST be computationally independent — a concrete literal, never
a `var()` or token ref. The SD5 build bakes each as the token's *resolved
literal*. Palette **binding** is a separate `--accent: var(--accent-teal-main)`
assignment on `:root`/zones (§3a, §5), never inside `@property`:

```css
/* Accent operator colours — the blend endpoints. Inherit so a surface can be
   re-tinted by setting --accent on any ancestor. */
@property --accent    { syntax: "<color>";      inherits: true; initial-value: oklch(0.63 0.08 173); } /* teal  */
@property --accent-2  { syntax: "<color>";      inherits: true; initial-value: oklch(0.63 0.12 280); } /* purple */

/* Blend geometry */
@property --blend-angle { syntax: "<angle>";      inherits: true; initial-value: 135deg; }
@property --blend-mid   { syntax: "<percentage>"; inherits: true; initial-value: 50%;   }

/* Neumorphic surface */
@property --surface      { syntax: "<color>";  inherits: true; initial-value: oklch(0.14 0.02 265); }
@property --bevel-depth  { syntax: "<length>"; inherits: true; initial-value: 0.5rem; }
@property --bevel-spread { syntax: "<length>"; inherits: true; initial-value: 1rem;   }

/* Emission */
@property --glow-strength { syntax: "<percentage>"; inherits: true; initial-value: 55%; }
```

Because these are typed, `transition: --accent 200ms, --blend-angle 400ms`
crossfades the blend and rotates it — impossible with plain vars. That is the
mechanism behind "living" surfaces, not a JS animation loop.

---

## 3. Layer 3 — derivation recipes (the default look, in real tokens)

All recipes live in `glue/render-base.css` inside `@layer coldlight.glue`, keyed
off the family markers the resolver emits (`[data-cl-surface]`, etc.) and gated
by the **look** (`data-look` / preset family, §5).

### 3a. Two-colour diagonal blend — the app-wide default

The default surface is two accents meeting on a diagonal, blended through the
middle. Derived — not a baked gradient token:

```css
[data-cl-surface] {
  background-image: linear-gradient(
    var(--blend-angle),
    var(--accent),
    color-mix(in oklch, var(--accent), var(--accent-2)) var(--blend-mid),
    var(--accent-2)
  );
}
```

`color-mix(in oklch, …)` gives the perceptually-even midpoint (mixing in sRGB
muddies complementary pairs). Change `--accent`/`--accent-2` on any container and
the blend follows — no new tokens. Endpoints resolve to the operator palette:
`--accent: var(--accent-teal-main)`, `--accent-2: var(--accent-purple-main)`,
etc. **Colours evolve, never replace** — the derivation *binds* the palette; it
does not cycle its values.

### 3b. Neumorphic bevel — derived from the surface, not baked

Raised (default) = light highlight from the top-left, dark shadow to the
bottom-right, both derived from `--surface` via relative colour so they track
whatever the surface is:

```css
[data-cl-surface] {
  box-shadow:
    calc(-1 * var(--bevel-depth)) calc(-1 * var(--bevel-depth)) var(--bevel-spread)
      oklch(from var(--surface) calc(l + 0.06) c h),                              /* highlight */
    var(--bevel-depth) var(--bevel-depth) var(--bevel-spread)
      oklch(from var(--surface) calc(l - 0.07) c h),                              /* shadow    */
    0 0 calc(2 * var(--bevel-spread))
      color-mix(in oklch, var(--accent), transparent var(--glow-strength));       /* glow (3c) */
}
```

Pressed / inset state flips the offsets and adds `inset`:

```css
[data-cl-surface][data-state="pressed"] {
  box-shadow:
    inset var(--bevel-depth) var(--bevel-depth) var(--bevel-spread)
      oklch(from var(--surface) calc(l - 0.07) c h),
    inset calc(-1 * var(--bevel-depth)) calc(-1 * var(--bevel-depth)) var(--bevel-spread)
      oklch(from var(--surface) calc(l + 0.06) c h);
}
```

### 3c. Accent glow — emission from one colour

`color-mix(in oklch, var(--accent), transparent var(--glow-strength))` — the
third `box-shadow` layer above, and reusable as a standalone `--glow` token.
Relative colour can widen it: `oklch(from var(--accent) l c h / 0.4)`.

### 3d. Density — container **style** queries, not media queries

Density is a component concern, so it is a container style query on a custom
property, not a global breakpoint:

```css
@container style(--density: compact) {
  [data-cl-frame]  { border-radius: calc(var(--radius) * 0.6); }
  [data-cl-layout] { gap: calc(var(--gap) * 0.6); }
  [data-cl-surface]{ --bevel-depth: 0.375rem; }
}
@container style(--density: spacious) {
  [data-cl-layout] { gap: calc(var(--gap) * 1.5); }
}
```

Size-based density still uses size queries + `cqi`/`cqb` units (the shell already
declares `container-type: inline-size` per zone). Set `--density` on a shell
zone or the provider to retune every surface inside it. (Style queries: Chrome/
Edge/Safari today; Firefox pending — the `initial-value` guarantees a sane
default there.)

### 3e. Theme — `light-dark()`, one token set

```css
:root { color-scheme: light dark; }
[data-cl-surface] { --surface: light-dark(var(--surface-base-light), var(--surface-base-dark)); }
```

No duplicate light/dark token trees; the derivations (bevel, blend) recompute
per scheme automatically because they read `--surface`/`--accent`.

---

## 4. `@layer` cascade order (NEW)

Derivation must lose to nothing accidental and win over nothing authored. The
barrel `design/index.css` establishes the order once:

```css
@layer reset, tokens, cl.registry, cl.glue, cl.presets, cl.components, utilities;
```

- `tokens` — SD5 custom properties (palette, roles, spacing).
- `cl.registry` — the `@property` block (§2).
- `cl.glue` — the derivation recipes (§3).
- `cl.presets` — per-preset input overrides (`--look`, `--accent`, `--bevel-depth`).
- `cl.components` — colocated component tweaks.
- `utilities` — Tailwind utilities win last for one-off overrides.

---

## 5. The look model — default neumorphic, some stark

Every surface wears exactly one **look**, emitted by the resolver as
`data-look` and selected by the preset family. The look decides *which*
derivations apply; the accent decides *what colour*.

| Look | `data-look` | Blend (3a) | Bevel (3b) | Glow (3c) | Backdrop | Default for |
|---|---|---|---|---|---|---|
| **neuro** | `neuro` | yes | raised | yes | — | **app default** — dashboards, cards, shell |
| **stark** | `stark` | no (flat `--surface`) | none | none | — | danger/warning, dense tables, code |
| **glass** | `glass` | translucent blend | soft | yes | `backdrop-filter` | overlays, chat, HUD |
| **flat** | `flat` | no | none | none | — | text-only, inputs |

```css
/* stark = kill the derivations, keep a solid surface */
[data-cl-surface][data-look="stark"] {
  background-image: none;
  background-color: var(--surface);
  box-shadow: none;
}
```

Intent → look → accent is resolved in `renderforge/intent.ts`: `default →
neuro`, `danger/warning → stark`, `glass-* → glass`. This is the SSOT the
[[project_coldlight_accent_palette]] and TRUTH.md §6 describe — now enforced by
the derivation layer instead of hoped-for in baked tokens.

---

## 6. The five locked invariants (preserved)

### P1 — Pure resolver
Same input → same output. No DOM, no runes, no `Date.now()`, no randomness. The
resolver emits *input* vars; **all colour maths is in CSS**, so P1 holds even as
derivation grows. Tests run in plain Node Vitest.

### P2 / P3 — the `var()` input chain is the fallback floor
The two-tier (default) and four-tier (state) `var(--style-{kind}-…, var(--preset-…, fallback))`
chains still resolve the input axes, so a hand-authored `@defaults` base still
outranks a foreign preset. Derivation reads the *resolved* inputs; it never
bypasses this chain.

### P4 — canonical longhand var names
Input axes use full CSS custom-property names. Derived outputs
(`--accent`, `--surface`, `--bevel-depth`, `--blend-angle`, `--glow-strength`)
are the registered set in §2. No shorthand keys (`-bg` is dead).

### P5 — Tier-1 attribute discipline
`m.dataAttrs` carries only `data-kind`, `data-cl-{family}`, and `data-look`. The
component authors `data-state`, `data-slot`.

---

## 7. What this revision requires downstream (execution checklist)

Spec-first: this doc lands before the code. The code changes it mandates:

1. **`glue/registry.css`** — author the `@property` block (§2); the SD5 build
   bakes each `initial-value` as the token's *resolved literal* (never a `var()`
   — the spec requires computational independence). Palette binding is a
   separate `--accent: var(…)` assignment on `:root`/zones, not in `@property`.
2. **`glue/render-base.css`** — replace the pass-through `[data-cl-surface]`
   rule with the derivation recipes (§3), wrapped in `@layer cl.glue`, gated by
   `data-look`.
3. **`renderforge/render.ts`** — emit the input axes (`--accent`, `--accent-2`,
   `--look`, `--bevel-depth`, `--blend-mid`) and `data-look`; keep the 20 legacy
   axes as the fallback floor. Stays pure.
4. **`renderforge/intent.ts`** — map intent → `{ look, accent, accent-2 }`
   instead of intent → baked preset name only.
5. **Preset token files** (`tokens/src/presets/*.tokens.json`) — presets carry
   `--look` + accent refs + depth, **not** baked `gradient`/`box-shadow` literals.
   Delete `gradient: none`. `--background-alpha` axis retired (relative colour /
   `color-mix` handle alpha inline).
6. **`design/index.css`** — declare the `@layer` order (§4) and import
   `registry.css` before `render-base.css`.
7. Regenerate (`pnpm ds:tokens:build`), then verify **in a running window** that
   a default Card renders the two-colour blend + bevel + glow, `data-look="stark"`
   renders flat, and `--density: compact` tightens it.

---

## 8. Browser baseline (all production-ready, 2026)

| Feature | Support | Fallback |
|---|---|---|
| `color-mix()` | ~89%+ (Baseline) | n/a — required |
| relative colour `oklch(from …)` | ~87%+ | n/a — required |
| `@property` | Baseline (universal) | `initial-value` guarantees a value |
| `@container` size queries | ~96% | media-query floor |
| `@container style()` | Chrome/Edge/Safari; Firefox pending | `initial-value` default |
| `light-dark()` | Baseline | explicit `@media (prefers-color-scheme)` |

Tauri ships a current Chromium/WebView2, so every feature here is available in
the app runtime with no polyfill.

---

## 9. Known bugs (carried forward)

| ID | Severity | File | Description | Fix |
|---|---|---|---|---|
| B2 | HIGH | `types.ts` | `RenderState` missing `'hover'`/`'focus'`/`'pressed'`. | Expand; the bevel pressed-state (§3b) needs `'pressed'`. |
| B3 | MEDIUM | `render.ts` | `--border-style` hardcoded `"solid"`; bypasses chain. | `v('border-style','solid')`. |
| B4–B6 | HIGH | `*.test.ts` | Legacy `-bg` assertions. | Rewrite against `--background-color` + the §2 registry. |
| B8 | LOW | multiple | Comments cite non-existent "Law N" docs. | Cite this file / TRUTH.md. |

---

## 10. Cross-references

- TRUTH.md — architecture-wide ground truth, intent→look map (§6).
- ADR-001-RENDER-FORGE.md — the architecture decision (update to reflect the
  three-layer derivation model).
- SEED-PRESETS.md — preset composition (accent + look, not baked literals).
- `glue/registry.css` — the `@property` registry (§2).
- `glue/render-base.css` — the derivation glue (§3).
- `renderforge/render.ts` — the pure resolver (Layer 1).
- `renderforge/intent.ts` — intent → look/accent resolution (§5).
