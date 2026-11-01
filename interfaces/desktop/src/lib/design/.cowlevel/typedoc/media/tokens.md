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
| Teal | `--dp-hue-teal` | 180 |
| Purple | `--dp-hue-purple` | 280 |
| Magenta | `--dp-hue-magenta` | 330 |
| Ember | `--dp-hue-ember` | 25 |
| Frost | `--dp-hue-frost` | 220 |
| Cyber | `--dp-hue-cyber` | 160 |

### Color Scales

Six palettes, each with a 50-900 step scale:

```css
--dp-color-teal-50 through --dp-color-teal-900
--dp-color-purple-50 through --dp-color-purple-900
--dp-color-magenta-50 through --dp-color-magenta-900
--dp-color-ember-50 through --dp-color-ember-900
--dp-color-frost-50 through --dp-color-frost-900
--dp-color-neutral-50 through --dp-color-neutral-900
```

Steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900.

### Glass Surfaces

| Name | Variable | Description |
|------|----------|-------------|
| Void | `--dp-glass-void` | Darkest, near-black (85% opacity) |
| Deep | `--dp-glass-deep` | Default glass depth (75% opacity) |
| Smoke | `--dp-glass-smoke` | Slightly lighter (60% opacity) |
| Frost | `--dp-glass-frost` | Lightest, frosted (40% opacity) |

### Matte Surfaces

| Name | Variable | Description |
|------|----------|-------------|
| Dark | `--dp-matte-dark` | Darkest matte |
| Medium | `--dp-matte-medium` | Mid matte |
| Light | `--dp-matte-light` | Lightest matte |

### Text Colors

| Name | Variable | Usage |
|------|----------|-------|
| Primary | `--dp-text-primary` | Main text |
| Secondary | `--dp-text-secondary` | Supporting text |
| Muted | `--dp-text-muted` | Disabled/subtle |
| Inverted | `--dp-text-inverted` | Dark text on light backgrounds |
| Link | `--dp-text-link` | Hyperlinks |
| Error | `--dp-text-error` | Error messages |
| Success | `--dp-text-success` | Success messages |

---

## Spacing

Fixed rem values (1 unit = 0.25rem).

| Name | Variable | Value |
|------|----------|-------|
| 1 | `--dp-space-1` | 0.25rem |
| 2 | `--dp-space-2` | 0.5rem |
| 3 | `--dp-space-3` | 0.75rem |
| 4 | `--dp-space-4` | 1rem |
| 5 | `--dp-space-5` | 1.25rem |
| 6 | `--dp-space-6` | 1.5rem |
| 8 | `--dp-space-8` | 2rem |

---

## Border Radius

| Name | Variable | Value |
|------|----------|-------|
| None | `--dp-radius-none` | 0 |
| SM | `--dp-radius-sm` | 0.25rem |
| MD | `--dp-radius-md` | 0.5rem |
| LG | `--dp-radius-lg` | 0.75rem |
| XL | `--dp-radius-xl` | 1rem |
| Full | `--dp-radius-full` | 9999px |

---

## Blur

| Name | Variable | Value |
|------|----------|-------|
| Off | `--dp-blur-off` | 0 |
| SM | `--dp-blur-sm` | 4px |
| MD | `--dp-blur-md` | 8px |
| LG | `--dp-blur-lg` | 16px |
| XL | `--dp-blur-xl` | 24px |

---

## Glows

Accent-colored box-shadow values.

| Name | Variable | Color |
|------|----------|-------|
| Off | `--dp-glow-off` | none |
| Teal | `--dp-glow-teal` | oklch teal at 40% opacity |
| Purple | `--dp-glow-purple` | oklch purple at 40% opacity |
| Magenta | `--dp-glow-magenta` | oklch magenta at 40% opacity |
| Ember | `--dp-glow-ember` | oklch ember at 40% opacity |
| Frost | `--dp-glow-frost` | oklch frost at 40% opacity |
| Cyber | `--dp-glow-cyber` | oklch cyber at 40% opacity |

---

## Shadows

Elevation stacks using z-level naming.

| Name | Variable | Elevation |
|------|----------|-----------|
| Z0 | `--dp-shadow-z0` | none |
| Z1 | `--dp-shadow-z1` | Base elevation |
| Z2 | `--dp-shadow-z2` | Raised |
| Z3 | `--dp-shadow-z3` | Floating |
| Z4 | `--dp-shadow-z4` | Modal/overlay |

---

## Bevels

Inset shadow effects for depth.

| Name | Variable | Effect |
|------|----------|--------|
| Off | `--dp-bevel-off` | none |
| Subtle | `--dp-bevel-subtle` | Light top highlight |
| Soft | `--dp-bevel-soft` | Top + bottom edge |
| Medium | `--dp-bevel-medium` | Stronger top + bottom edge |

---

## Z-Index

| Name | Variable | Value |
|------|----------|-------|
| Base | `--dp-z-base` | 0 |
| Raised | `--dp-z-raised` | 10 |
| Dropdown | `--dp-z-dropdown` | 100 |
| Sticky | `--dp-z-sticky` | 200 |
| Overlay | `--dp-z-overlay` | 300 |
| Modal | `--dp-z-modal` | 400 |
| Popover | `--dp-z-popover` | 500 |
| Toast | `--dp-z-toast` | 600 |
| Tooltip | `--dp-z-tooltip` | 700 |

---

## Text Sizes

| Name | Variable | Value |
|------|----------|-------|
| XS | `--dp-text-size-xs` | 0.75rem |
| SM | `--dp-text-size-sm` | 0.875rem |
| Base | `--dp-text-size-base` | 1rem |
| LG | `--dp-text-size-lg` | 1.125rem |
| XL | `--dp-text-size-xl` | 1.25rem |
| 2XL | `--dp-text-size-2xl` | 1.5rem |

---

## Duration

| Name | Variable | Value |
|------|----------|-------|
| Instant | `--dp-duration-instant` | 50ms |
| Fast | `--dp-duration-fast` | 150ms |
| Normal | `--dp-duration-normal` | 250ms |
| Slow | `--dp-duration-slow` | 400ms |
| Glacial | `--dp-duration-glacial` | 700ms |

---

## Easing

| Name | Variable | Curve |
|------|----------|-------|
| Linear | `--dp-ease-linear` | linear |
| In | `--dp-ease-in` | cubic-bezier(0.4, 0, 1, 1) |
| Out | `--dp-ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| In-Out | `--dp-ease-inOut` | cubic-bezier(0.4, 0, 0.2, 1) |
| Spring | `--dp-ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) |

---

## Padding

Component-level padding presets.

| Name | Variable | Value |
|------|----------|-------|
| SM | `--dp-padding-sm` | 0.375rem 0.75rem |
| MD | `--dp-padding-md` | 0.5rem 1rem |
| LG | `--dp-padding-lg` | 0.75rem 1.5rem |

---

## Adding New Tokens

1. Add the value to `tokens/tokens.ts`
2. If new category, add `addSection()` call in `ds-tokens-build.ts`
3. If enumerable, add to `enums` in `tokens.ts`
4. Run `pnpm ds:tokens:build`
5. Use `var(--dp-your-token)` in CSS/recipes

**Never hand-edit generated files.**
