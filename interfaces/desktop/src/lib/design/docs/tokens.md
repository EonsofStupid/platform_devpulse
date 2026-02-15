# ColdLight Tokens

> Token reference for @devpulse/coldlight

---

## Overview

Tokens are the atomic values of the design system. All tokens are defined in `tokens/tokens.ts` and generated into CSS custom properties, TypeScript types, and a Tailwind preset.

**SSOT**: `tokens/tokens.ts` is the only source of truth. All other files are generated via `pnpm ds:tokens:build`.

---

## Color System (OKLCH)

ColdLight uses OKLCH color format for perceptually uniform colors.

### Accent Hues

| Name | Variable | Hue Angle |
|------|----------|-----------|
| Teal | `--hue-teal` | 180 |
| Purple | `--hue-purple` | 280 |
| Magenta | `--hue-magenta` | 330 |
| Ember | `--hue-ember` | 25 |
| Frost | `--hue-frost` | 220 |
| Cyber | `--hue-cyber` | 160 |

### Color Scales

Six palettes, each with a 50-900 step scale:

```css
--color-teal-50 through --color-teal-900
--color-purple-50 through --color-purple-900
--color-magenta-50 through --color-magenta-900
--color-ember-50 through --color-ember-900
--color-frost-50 through --color-frost-900
--color-neutral-50 through --color-neutral-900
```

Steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900.

### Glass Surfaces

| Name | Variable | Description |
|------|----------|-------------|
| Void | `--glass-void` | Darkest, near-black (85% opacity) |
| Deep | `--glass-deep` | Default glass depth (75% opacity) |
| Smoke | `--glass-smoke` | Slightly lighter (60% opacity) |
| Frost | `--glass-frost` | Lightest, frosted (40% opacity) |

### Matte Surfaces

| Name | Variable | Description |
|------|----------|-------------|
| Dark | `--matte-dark` | Darkest matte |
| Medium | `--matte-medium` | Mid matte |
| Light | `--matte-light` | Lightest matte |

### Text Colors

| Name | Variable | Usage |
|------|----------|-------|
| Primary | `--text-primary` | Main text |
| Secondary | `--text-secondary` | Supporting text |
| Muted | `--text-muted` | Disabled/subtle |
| Inverted | `--text-inverted` | Dark text on light backgrounds |
| Link | `--text-link` | Hyperlinks |
| Error | `--text-error` | Error messages |
| Success | `--text-success` | Success messages |

---

## Spacing

Fixed rem values (1 unit = 0.25rem).

| Name | Variable | Value |
|------|----------|-------|
| 1 | `--space-1` | 0.25rem |
| 2 | `--space-2` | 0.5rem |
| 3 | `--space-3` | 0.75rem |
| 4 | `--space-4` | 1rem |
| 5 | `--space-5` | 1.25rem |
| 6 | `--space-6` | 1.5rem |
| 8 | `--space-8` | 2rem |

---

## Border Radius

| Name | Variable | Value |
|------|----------|-------|
| None | `--radius-none` | 0 |
| SM | `--radius-sm` | 0.25rem |
| MD | `--radius-md` | 0.5rem |
| LG | `--radius-lg` | 0.75rem |
| XL | `--radius-xl` | 1rem |
| Full | `--radius-full` | 9999px |

---

## Blur

| Name | Variable | Value |
|------|----------|-------|
| Off | `--blur-off` | 0 |
| SM | `--blur-sm` | 4px |
| MD | `--blur-md` | 8px |
| LG | `--blur-lg` | 16px |
| XL | `--blur-xl` | 24px |

---

## Glows

Accent-colored box-shadow values.

| Name | Variable | Color |
|------|----------|-------|
| Off | `--glow-off` | none |
| Teal | `--glow-teal` | oklch teal at 40% opacity |
| Purple | `--glow-purple` | oklch purple at 40% opacity |
| Magenta | `--glow-magenta` | oklch magenta at 40% opacity |
| Ember | `--glow-ember` | oklch ember at 40% opacity |
| Frost | `--glow-frost` | oklch frost at 40% opacity |
| Cyber | `--glow-cyber` | oklch cyber at 40% opacity |

---

## Shadows

Elevation stacks using z-level naming.

| Name | Variable | Elevation |
|------|----------|-----------|
| Z0 | `--shadow-z0` | none |
| Z1 | `--shadow-z1` | Base elevation |
| Z2 | `--shadow-z2` | Raised |
| Z3 | `--shadow-z3` | Floating |
| Z4 | `--shadow-z4` | Modal/overlay |

---

## Bevels

Inset shadow effects for depth.

| Name | Variable | Effect |
|------|----------|--------|
| Off | `--bevel-off` | none |
| Subtle | `--bevel-subtle` | Light top highlight |
| Soft | `--bevel-soft` | Top + bottom edge |
| Medium | `--bevel-medium` | Stronger top + bottom edge |

---

## Z-Index

| Name | Variable | Value |
|------|----------|-------|
| Base | `--z-base` | 0 |
| Raised | `--z-raised` | 10 |
| Dropdown | `--z-dropdown` | 100 |
| Sticky | `--z-sticky` | 200 |
| Overlay | `--z-overlay` | 300 |
| Modal | `--z-modal` | 400 |
| Popover | `--z-popover` | 500 |
| Toast | `--z-toast` | 600 |
| Tooltip | `--z-tooltip` | 700 |

---

## Text Sizes

| Name | Variable | Value |
|------|----------|-------|
| XS | `--text-size-xs` | 0.75rem |
| SM | `--text-size-sm` | 0.875rem |
| Base | `--text-size-base` | 1rem |
| LG | `--text-size-lg` | 1.125rem |
| XL | `--text-size-xl` | 1.25rem |
| 2XL | `--text-size-2xl` | 1.5rem |

---

## Duration

| Name | Variable | Value |
|------|----------|-------|
| Instant | `--duration-instant` | 50ms |
| Fast | `--duration-fast` | 150ms |
| Normal | `--duration-normal` | 250ms |
| Slow | `--duration-slow` | 400ms |
| Glacial | `--duration-glacial` | 700ms |

---

## Easing

| Name | Variable | Curve |
|------|----------|-------|
| Linear | `--ease-linear` | linear |
| In | `--ease-in` | cubic-bezier(0.4, 0, 1, 1) |
| Out | `--ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| In-Out | `--ease-inOut` | cubic-bezier(0.4, 0, 0.2, 1) |
| Spring | `--ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) |

---

## Padding

Component-level padding presets.

| Name | Variable | Value |
|------|----------|-------|
| SM | `--padding-sm` | 0.375rem 0.75rem |
| MD | `--padding-md` | 0.5rem 1rem |
| LG | `--padding-lg` | 0.75rem 1.5rem |

---

## Adding New Tokens

1. Add the value to `tokens/tokens.ts`
2. If new category, add `addSection()` call in `ds-tokens-build.ts`
3. If enumerable, add to `enums` in `tokens.ts`
4. Run `pnpm ds:tokens:build`
5. Use `var(--your-token)` in CSS/recipes

**Never hand-edit generated files.**
