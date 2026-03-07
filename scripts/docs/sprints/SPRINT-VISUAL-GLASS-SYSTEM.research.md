# Research: Visual Glass System Token Architecture

**Date**: 2026-03-06
**Sprint**: SPRINT-VISUAL-GLASS-SYSTEM
**Status**: COMPLETE

## Question/Goal

How should ColdLight's surface/token system handle the variety of glass effects needed across the app (panels, chat bubbles, active buttons) without creating per-component tokens?

## Codebase Analysis

### Current Surface Values (token-categories.ts s-axis)

| Index | ID | Token | Blur | Saturate |
|-------|-----|-------|------|----------|
| s0 | transparent | transparent | - | - |
| s1 | glass-void | `oklch(0.08 0.005 250 / 0.85)` | blur-md (8px) | 1.5 |
| s2 | glass-deep | `oklch(0.11 0.01 250 / 0.75)` | blur-lg (16px) | 1.3 |
| s3 | glass-smoke | `oklch(0.16 0.005 0 / 0.60)` | blur-xl (24px) | 1.2 |
| s4 | glass-frost | `oklch(0.92 0.01 220 / 0.40)` | blur-2xl (40px) | 1.1 |
| s5 | matte-dark | `oklch(0.14 0.005 250)` | - | - |
| s6 | solid-teal | `var(--color-teal-500)` | - | - |
| s7 | void-gradient | gradient | - | - |

### What Hardcoded CSS Actually Uses

**Neutral panels (hue 250, low chroma 0.010-0.015):**
- Topbar: `oklch(0.08 0.012 250 / 0.92)`, blur(20px), sat(1.4)
- Sidebar: `oklch(0.07 0.010 250 / 0.90)`, blur(20px), sat(1.3)
- Statusbar: `oklch(0.06 0.010 250 / 0.94)`, blur(16px), sat(1.2)
- Chat input: `oklch(0.08 0.015 250 / 0.92)`, blur(16px), sat(1.3)
- Chat threads: `oklch(0.06 0.012 250 / 0.88)`, blur(12px)

**Teal-tinted (hue 180, high chroma 0.04-0.06):**
- User bubble: `oklch(0.11 0.04 180 / 0.85)`, blur(14px), sat(1.4)
- Active sidebar btn: `oklch(0.12 0.06 180 / 0.90)`

**Purple-tinted (hue 280, high chroma 0.04-0.08):**
- AI bubble: `oklch(0.11 0.04 280 / 0.80)`, blur(14px), sat(1.3)
- Chat topbar: `oklch(0.07 0.015 280 / 0.92)`, blur from app shell

### Three Independent Dimensions in Play

| Dimension | Current System | What's Needed |
|-----------|---------------|---------------|
| Lightness/opacity | 4 glass tiers | Same (panels are all similar tier) |
| Blur intensity | Tied to surface | glass-void blur too weak (8px vs 16-20px) |
| Hue tint | All hue 250 | Three families: 250, 180, 280 |

## Findings

### How Mature Design Systems Handle This

1. **Surface tokens = reusable palette, NOT per-component.** Radix, Shadcn, Material Design all use 4-8 surface tiers. No `glass-topbar`, `glass-sidebar`.

2. **Hue tinting = genuinely different surface.** A teal-tinted glass with 0.04 chroma looks fundamentally different from neutral 0.005 chroma glass. It IS a different material. Adding 2-3 hue-tinted surface tokens is correct.

3. **Panel hierarchy = recipe-level, not token-level.** Topbar vs sidebar vs statusbar differ by ~0.02 lightness. That's a recipe concern (structural classes + frame/bevel treatment), not a token concern.

4. **Small per-slot adjustments live in recipes.** The recipe says "topbar gets glass-void + bevel-subtle", not "topbar gets glass-topbar".

### Options Evaluated

**Option A: Per-component glass tokens** (glass-topbar, glass-sidebar, etc.)
- REJECTED: Couples tokens to layout. Not reusable. Combinatorial explosion.

**Option B: Parameterized glass via CSS custom properties** (`--cl-hue`, `--cl-chroma`)
- REJECTED: Clever but fragile, harder to debug, breaks token transparency.

**Option C: New encoding axis for hue** (9th axis)
- REJECTED: Overkill for 2-3 tint variants. Over-engineers the system.

**Option D: Update existing + add hue-tinted surface variants** (SELECTED)
- Update glass-void to be denser/blurrier (match panel intent)
- Add glass-teal and glass-purple as new surface values
- Add accent-teal and accent-purple to frame axis
- Panel hierarchy via recipe slots + frame/bevel axes

## Recommendations

### 1. Token Changes (tokens.css)

```css
/* UPDATE: glass-void - denser for panel use */
--glass-void: oklch(0.08 0.01 250 / 0.90);

/* NEW: Hue-tinted glass surfaces */
--glass-teal: oklch(0.11 0.04 180 / 0.85);
--glass-purple: oklch(0.11 0.04 280 / 0.80);
```

### 2. Surface Axis Updates (token-categories.ts)

Update s1 (glass-void):
- `blur(var(--blur-md))` -> `blur(var(--blur-lg))` (8px -> 16px)
- Token value updated via tokens.css (denser alpha)

Add s8 (glass-teal), s9 (glass-purple):
- blur-lg, appropriate saturate per tint
- Borders use color-specific oklch

### 3. Frame Axis Additions (token-categories.ts)

Add f5 (accent-teal): teal-400 border at 45% opacity + frame glow
Add f6 (accent-purple): purple-400 border at 40% opacity + frame glow

### 4. Preset Updates (presets.ts)

| Preset ID | Surface | Glow | Frame | Other |
|-----------|---------|------|-------|-------|
| shell-topbar | glass-void | none | none | bevel=subtle |
| shell-sidebar | glass-void | none | soft | - |
| shell-statusbar | glass-void | none | none | - |
| chat-bubble-user | glass-teal | teal | accent-teal | depth=z1, bevel=subtle |
| chat-bubble-ai | glass-purple | purple | accent-purple | depth=z1, bevel=subtle |
| chat-topbar | glass-void | none | none | bevel=subtle |
| chat-input | glass-void | none | soft | transition=fast |
| sidebar-nav-active (NEW) | glass-teal | teal | accent-teal | depth=z1, bevel=subtle |

### 5. Recipe Changes

Recipes emit variant utilities from preset values:
- `v-s1` = glass-void (now denser, more blur)
- `v-s8` = glass-teal
- `v-s9` = glass-purple
- `v-f5` = accent-teal border
- `v-f6` = accent-purple border

Panel hierarchy from structural classes + frame treatment, not separate surfaces.

## Files Referenced

- `tokens/tokens.css`: Token SSOT (lines 78-81 — glass tokens)
- `tokens/tailwind.css`: Auto-generated @theme (regenerated by build)
- `registry/token-categories.ts`: 8-axis registry (lines 61-669)
- `registry/presets.ts`: Named preset definitions (50+ presets)
- `registry/resolve-visual.ts`: Resolution pipeline
- `generated/variants.css`: Auto-generated @utility rules
- `recipes/layouts/shell/shell.app.ts`: App shell recipe slots
- `recipes/layouts/shell/shell.chat.ts`: Chat shell recipe slots
- `app.css`: Hardcoded CSS to be replaced (lines 24-166)
