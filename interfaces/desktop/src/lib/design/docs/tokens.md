# ColdLight Tokens

> Token reference for @devpulse/coldlight

---

## Overview

Tokens are the atomic values of the design system. All tokens are defined in `tokens/tokens.ts` and generated into CSS custom properties.

**SSOT**: `tokens/tokens.ts` is the only source of truth. All other files are generated.

---

## Color System (OKLCH)

ColdLight uses OKLCH color format for perceptually uniform colors.

### Base Hues

| Token | Variable | Value |
|-------|----------|-------|
| Teal | `--dp-hue-teal` | 195 |
| Purple | `--dp-hue-purple` | 280 |
| Magenta | `--dp-hue-magenta` | 330 |
| Ember | `--dp-hue-ember` | 30 |
| Frost | `--dp-hue-frost` | 210 |
| Matte | `--dp-hue-matte` | 220 |

### Color Scales

Each hue has a 100-900 scale:

```css
--dp-teal-100 through --dp-teal-900
--dp-purple-100 through --dp-purple-900
--dp-magenta-100 through --dp-magenta-900
--dp-ember-100 through --dp-ember-900
--dp-frost-100 through --dp-frost-900
```

### Glass Variants

| Token | Variable | Description |
|-------|----------|-------------|
| Void | `--dp-glass-void` | Darkest, near-black |
| Deep | `--dp-glass-deep` | Default glass depth |
| Smoke | `--dp-glass-smoke` | Slightly lighter |
| Frost | `--dp-glass-frost` | Lightest, frosted |

### Text Colors

| Token | Variable | Usage |
|-------|----------|-------|
| Primary | `--dp-text-primary` | Main text |
| Secondary | `--dp-text-secondary` | Supporting text |
| Muted | `--dp-text-muted` | Disabled/subtle |
| White | `--dp-text-white` | High contrast |

---

## Spacing

Fluid spacing using `clamp()` for responsive scaling.

| Token | Variable | Range |
|-------|----------|-------|
| 1 | `--dp-space-1` | 2-4px |
| 2 | `--dp-space-2` | 4-8px |
| 3 | `--dp-space-3` | 8-12px |
| 4 | `--dp-space-4` | 12-16px |
| 5 | `--dp-space-5` | 16-24px |
| 6 | `--dp-space-6` | 24-32px |
| 8 | `--dp-space-8` | 32-48px |

---

## Border Radius

| Token | Variable | Range |
|-------|----------|-------|
| None | `--dp-radius-none` | 0 |
| SM | `--dp-radius-sm` | 2-4px |
| MD | `--dp-radius-md` | 4-8px |
| LG | `--dp-radius-lg` | 8-12px |
| XL | `--dp-radius-xl` | 12-16px |
| Full | `--dp-radius-full` | 9999px |

---

## Blur

| Token | Variable | Value |
|-------|----------|-------|
| SM | `--dp-blur-sm` | 4px |
| MD | `--dp-blur-md` | 8px |
| LG | `--dp-blur-lg` | 16px |
| XL | `--dp-blur-xl` | 24px |

---

## Glows

Composed box-shadow values for accent glows.

| Token | Variable | Color |
|-------|----------|-------|
| Teal | `--dp-glow-teal` | Teal inner/outer |
| Purple | `--dp-glow-purple` | Purple inner/outer |
| Magenta | `--dp-glow-magenta` | Magenta inner/outer |
| Ember | `--dp-glow-ember` | Ember inner/outer |
| Frost | `--dp-glow-frost` | Frost inner/outer |
| Cyber | `--dp-glow-cyber` | Neon green |

---

## Shadows

### Drop Shadows

| Token | Variable | Usage |
|-------|----------|-------|
| SM | `--dp-shadow-sm` | Subtle depth |
| MD | `--dp-shadow-md` | Default depth |
| LG | `--dp-shadow-lg` | Elevated |

### Z-Level Shadows

| Token | Variable | Elevation |
|-------|----------|-----------|
| Z1 | `--dp-shadow-z1` | Base elevation |
| Z2 | `--dp-shadow-z2` | Raised |
| Z3 | `--dp-shadow-z3` | Floating |
| Z4 | `--dp-shadow-z4` | Modal/overlay |

---

## Bevels

Inset/outset edge effects for depth.

| Token | Variable | Effect |
|-------|----------|--------|
| Outset | `--dp-bevel-outset` | Raised edges |
| Inset | `--dp-bevel-inset` | Sunken edges |
| Deep | `--dp-bevel-deep` | Strong inset |
| Imprint | `--dp-bevel-imprint` | Shell layer edge |
| Pressed | `--dp-bevel-pressed` | Active/pressed state |

---

## Z-Index

| Token | Variable | Value | Usage |
|-------|----------|-------|-------|
| Base | `--dp-z-base` | 0 | Default |
| Dropdown | `--dp-z-dropdown` | 100 | Dropdowns |
| Sticky | `--dp-z-sticky` | 200 | Sticky headers |
| Modal | `--dp-z-modal` | 300 | Modals |
| Popover | `--dp-z-popover` | 400 | Popovers |
| Tooltip | `--dp-z-tooltip` | 500 | Tooltips |
| Toast | `--dp-z-toast` | 600 | Toast notifications |
| Overlay | `--dp-z-overlay` | 700 | Full overlays |
| VPB | `--dp-z-vpb` | 800 | Visual Page Builder |
| VPB FAB | `--dp-z-vpb-fab` | 900 | VPB floating button |

---

## Typography

### Font Families

| Token | Variable | Stack |
|-------|----------|-------|
| Sans | `--dp-font-sans` | Inter, system |
| Mono | `--dp-font-mono` | JetBrains Mono, monospace |

### Text Sizes

| Token | Variable | Range |
|-------|----------|-------|
| XS | `--dp-text-xs` | 0.625-0.75rem |
| SM | `--dp-text-sm` | 0.75-0.875rem |
| Base | `--dp-text-base` | 0.875-1rem |
| LG | `--dp-text-lg` | 1-1.125rem |
| XL | `--dp-text-xl` | 1.125-1.25rem |
| 2XL | `--dp-text-2xl` | 1.25-1.5rem |

---

## Transitions

### Easing

| Token | Variable | Curve |
|-------|----------|-------|
| Out | `--dp-ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| Bounce | `--dp-ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) |

### Duration

| Token | Variable | Time |
|-------|----------|------|
| Fast | `--dp-duration-fast` | 150ms |
| Normal | `--dp-duration-normal` | 250ms |
| Slow | `--dp-duration-slow` | 400ms |

### Composed

| Token | Variable | Value |
|-------|----------|-------|
| Fast | `--dp-transition-fast` | 150ms ease-out |
| Normal | `--dp-transition-normal` | 250ms ease-out |

---

## Adding New Tokens

1. Add the value to `tokens/tokens.ts`
2. Export it from the file
3. Run `pnpm dev` (Vite plugin auto-generates)
4. Use `var(--dp-your-token)` in CSS/recipes

**Never hand-edit generated files.**
