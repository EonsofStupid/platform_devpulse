# MACRO-LAW.md — the family-split CSS contract

> **Authority:** this file. Replaces the dead reference to "MACRO-LAW.md
> Law 5" in `generated/render-base.css:2`. See TRUTH.md for the
> architecture-wide ground truth.

This document specifies the **glue CSS contract** between `renderForge`
output and the styles applied by the browser. The contract has one job:
let component-agnostic CSS rules consume the typed CSS custom properties
that `renderForge` emits, scoped by axis family.

The contract is implemented in `generated/render-base.css`. This document
is its specification.

---

## 1. The four-layer contract

```
   AUTHORED                        RUNTIME ATTRIBUTES                    BROWSER STATE
   ────────                        ──────────────────                    ─────────────

  PresetDefinition                  data-kind="<kind>"                  computed style
  in visual/presets/*.ts            data-cl-{family}=""                 (the actual
                                    data-state="<state>"                 paint)
  ────► SD5 build ────►             ────► render-base.css ────►
  emits CSS custom                  selector rules consume
  properties:                       custom properties:
  --preset-{id}-{axis}              [data-cl-surface]
  --preset-{id}-{state}-{axis}        background-color: var(--background-color, transparent);
  --style-{kind}-{id}-{axis}          border-color: var(--border-color, transparent);
  --style-{kind}-{id}-{state}-{axis}  ...
                                    [data-cl-text]
                                      color: var(--color, inherit);
                                      ...
```

Four layers, exactly one direction of consumption:

1. **Authored:** a `PresetDefinition` declares typed values per axis.
2. **Build:** SD5 emits CSS custom properties keyed by preset ID and state.
3. **Resolver:** `renderForge` writes a 20-key `cssVars` map of var() chains
   pointing at those properties, plus `data-cl-{family}` markers.
4. **Glue CSS:** `render-base.css` provides selector-scoped rules that
   `var(--{axis})` the runtime values onto real CSS properties.

---

## 2. The 6 family selectors

Each family is a CSS selector scope. A component opts into a family by
emitting `data-cl-{family}` (which `renderForge` does for it, based on
`KIND_FAMILIES[kind]`).

| Selector | What it styles | Properties consumed |
|---|---|---|
| `[data-kind]` | Universal — every styled element | `transition-*`, `opacity`, `animation` |
| `[data-cl-surface]` | Background, borders, shadows, gradient fills | `background-color`, `border-color`, `box-shadow`, `background-image` (gradient) |
| `[data-cl-text]` | Typography | `color`, `font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height` |
| `[data-cl-frame]` | Dimensional shape | `border-radius`, `border-width`, `border-style` |
| `[data-cl-interactive]` | Behavior cues + state filters | `cursor`, `outline*`, `:hover` filter, `:active` filter, disabled handling |
| `[data-cl-layout]` | Spacing/flow | `gap` |
| `[data-cl-overlay]` | Layering | `backdrop-filter`, `z-index`, `isolation` |

**Universal (`[data-kind]`)** is special: it's not a family, it's the
container rule that every styled element receives. Used for animation,
opacity, and transition timing — properties that apply uniformly
regardless of family.

---

## 3. The interactive family carries CSS-pseudo state, not data-state

This is a subtle but crucial design point.

```css
[data-cl-interactive]:hover {
  filter: var(--hover-filter, brightness(1.1));
}
[data-cl-interactive]:focus-visible {
  outline: 2px solid var(--focus-ring, currentColor);
}
[data-cl-interactive]:active {
  filter: var(--active-filter, brightness(0.9));
}
[data-cl-interactive]:disabled,
[data-cl-interactive][aria-disabled="true"] {
  cursor: not-allowed;
  pointer-events: none;
}
```

Hover, focus-visible, active, and disabled are handled by **CSS pseudo-classes**
(plus `[aria-disabled="true"]` for non-button elements that need the same
treatment). They are *not* triggered by `data-state="hover"` etc.

This means:

- A component does NOT need to set `data-state="hover"` on mouseover. The
  browser handles that.
- The resolver's `RenderState` type is for *programmatic* state — disabled,
  loading, pressed, expanded — not for interactive hover/focus.
- The preset's `states.hover` overrides flow through different CSS variables
  than the inline `cssVars` from the resolver.

**The disconnect:** today, `PresetDefinition.states.hover` describes
hover-state values that get compiled into `--preset-{id}-hover-{axis}`
custom properties. But `render-base.css` doesn't have a rule like
`[data-cl-surface]:hover { background-color: var(--background-color-hover); }`
— it only filter-shifts via `[data-cl-interactive]:hover`. **The hover
preset overrides aren't fully wired through the cascade today.** This is a
real gap, not a bug per se. See PARKING-LOT.md PL-007 for the resolution path.

---

## 4. Axes per family — the wiring table

| Axis (DTCG) | Var | Family rule |
|---|---|---|
| `backgroundColor` | `--background-color` | `[data-cl-surface]` |
| `backgroundColor` (alpha component) | `--background-alpha` | (forward-compatible, no rule yet) |
| `backgroundBlur` | `--backdrop-filter` | `[data-cl-overlay]` |
| `shadow` | `--box-shadow` | `[data-cl-surface]` |
| `border` (color) | `--border-color` | `[data-cl-surface]` |
| `border` (width) | `--border-width` | `[data-cl-frame]` |
| `border` (style) | `--border-style` | `[data-cl-frame]` |
| `borderRadius` | `--border-radius` | `[data-cl-frame]` |
| `color` | `--color` | `[data-cl-text]` |
| `typography.fontFamily` | `--font-family` | `[data-cl-text]` |
| `typography.fontSize` | `--font-size` | `[data-cl-text]` |
| `typography.fontWeight` | `--font-weight` | `[data-cl-text]` |
| `typography.letterSpacing` | `--tracking` | `[data-cl-text]` (mapped to `letter-spacing`) |
| `typography.lineHeight` | `--leading` | `[data-cl-text]` (mapped to `line-height`) |
| `gradient` | `--gradient` | `[data-cl-surface]` (mapped to `background-image`) |
| `backgroundImage` | `--background-image` | (forward-compatible, no rule yet) |
| `animation` | `--animation` | `[data-kind]` (universal) |
| `transition.duration` | `--transition-duration` | `[data-kind]` (universal) |
| `transition.timingFunction` | `--transition-timing` | `[data-kind]` (universal) |
| `opacity` | `--opacity` | `[data-kind]` (universal) |

**Naming conventions:**

- DTCG axis names are camelCase (`backgroundColor`).
- CSS custom property names are kebab-case (`--background-color`).
- Some custom property names use design-industry shortcuts that don't match
  the CSS property they map to: `--tracking` → `letter-spacing`, `--leading`
  → `line-height`. This is intentional — designers think in tracking/leading,
  CSS uses letter-spacing/line-height. The cascade does the translation.

---

## 5. The five laws of MACRO-LAW

These are the constraints that keep the family-split CSS coherent.
Violating any of them breaks the consumer contract.

### Law 1 — Family scope is opt-in, not inherited

A component receives a family rule's properties only if it has the
matching `data-cl-{family}` marker. There is no "all components are
surface" default. `[data-cl-text]` does not match `<button data-kind="button">`
unless the button's KIND_FAMILIES entry includes `text`.

### Law 2 — Variables are uniformly named across families

A variable like `--color` belongs to the `text` family by convention,
but the *name* `--color` is independent of the family. If two families
both consumed `--color`, they would both apply it. (They don't, but
the naming permits it. There's no namespacing prefix per family.)

This is by design: it lets us add a forward-compatible family without
renaming variables.

### Law 3 — `[data-kind]` is universal — no family marker required

`[data-kind]` rules apply to every styled component. Animation,
opacity, and transition timing live here because they're orthogonal to
visual family — every kind, in every family, has these.

### Law 4 — Pseudo-classes own interactive state visuals

`:hover`, `:focus-visible`, `:active`, `:disabled` and
`[aria-disabled="true"]` are scoped under `[data-cl-interactive]`. They
deliver the *visual* feedback for interactive states. Programmatic state
(loading, pressed, expanded) is handled separately via `data-state` and
ARIA attributes from the behavior hooks.

### Law 5 — Selectors only target Tier 1 and Tier 2 attributes

Per TRUTH.md §3, glue CSS rules in `render-base.css` may scope under
`[data-kind]`, `[data-cl-{family}]`, `[data-state]`, `[data-slot]`, and
`[data-orientation]`. Tier 3 (component-specific) attributes are owned
by individual components — `render-base.css` never targets `[data-tone]`,
`[data-engaged]`, `[data-position]`, etc.

---

## 6. Forward compatibility — the four unwired axes

Four CSS custom properties are emitted by `renderForge` but have no
consumer rule in `render-base.css` today:

- `--background-alpha`
- `--background-image` (the literal one, distinct from `--gradient`)
- `--gradient` (consumed indirectly as `background-image: var(--gradient)`,
  which conflicts with `--background-image`)
- (none others currently)

When new family rules are added (e.g. a real overlay-family rule for
`background-alpha` blending, or a separate `background-image` slot
distinct from `gradient`), the variable is already emitting. No resolver
change required. This is the payoff of P3 in RENDERFORGE.md (forward
compatibility) and Law 2 (uniform naming).

There is one outstanding conflict: `--gradient` and `--background-image`
both ultimately become `background-image:` in CSS. Today only `--gradient`
is consumed in `render-base.css`. If both eventually need to apply
(gradient over an image), the consumer rule needs to merge them via
multiple background layers. PARKING-LOT.md PL-008.

---

## 7. Cross-references

- TRUTH.md — architecture-wide ground truth, the data-attribute taxonomy
- RENDERFORGE.md — the resolver that produces these var() chains
- PARKING-LOT.md — deferred decisions, including PL-003, PL-007, PL-008
- `generated/render-base.css` — the live implementation
- `renderforge/generated/kind-families.ts` — the kind → family[] map
