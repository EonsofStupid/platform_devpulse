# SPRINT: Token Bridge + 3-Tier Architecture

> **Status**: READY
> **Priority**: CRITICAL — BLOCKS ALL OTHER SPRINTS
> **Goal**: Fix @theme generation so recipe class names resolve, add semantic + component token tiers, unify dual @theme blocks
> **Research**: [SPRINT-VISUAL-SCAFFOLDING.research.md](./SPRINT-VISUAL-SCAFFOLDING.research.md)
> **Master Plan Phase**: Phase 4 (Token Bridge + 3-Tier Architecture)
> **Date**: 2026-02-07

---

## Problem Statement

Recipes produce Tailwind class names that **do not exist** in the @theme block. This means every recipe-styled component renders with zero visual output. Nothing works until this is fixed.

### The Gap

| Recipe emits | @theme has | Result |
|-------------|------------|--------|
| `bg-glass-void` | `--color-glass-void` (wrong namespace) | NO CLASS GENERATED |
| `shadow-dp-z2` | `--shadow-z2` (no `dp-` prefix) | NO CLASS GENERATED |
| `rounded-dp-md` | `--radius-md` (no `dp-` prefix) | NO CLASS GENERATED |
| `shadow-dp-glow-teal` | `--shadow-glow-teal` (no `dp-` prefix) | NO CLASS GENERATED |
| `text-dp-sm` | `--font-size-sm` (no `dp-` prefix) | NO CLASS GENERATED |

### Dual @theme

- `tokens.css` has @theme with token mappings (332 lines)
- `app.css` has SEPARATE @theme with void/obsidian colors, fonts, animations (14 entries)
- These must unify into ONE @theme in `tokens.css`

---

## Prerequisites

- [x] Token SSOT (`tokens/tokens.ts`) exists with real values (288 lines)
- [x] Token build script (`ds-tokens-build.ts`) exists and runs
- [x] `tokens.css` generates :root + @theme blocks
- [x] Recipe registry works (`getRecipe`, `registerRecipe`)
- [x] Recipe `classes()` functions produce class strings

---

## Decision: Fix Direction

**Option A (RECOMMENDED): Fix recipe utils to emit class names that match existing @theme**

The @theme already maps tokens correctly (e.g. `--shadow-z1`, `--radius-md`). The problem is `recipes/utils.ts` emits wrong class names (`shadow-dp-z1` instead of `shadow-z1`).

**Option B: Fix @theme to match recipe class names**

Add `--shadow-dp-z1`, `--radius-dp-md`, etc. to @theme. Creates redundant aliases.

**DECISION: Option A** — fix utils.ts to emit correct class names, then add the missing glass/matte surface entries to @theme.

---

## Tasks

### Phase A: Fix Recipe Utils (THE IMMEDIATE FIX)

- [ ] **A1.** Update `recipes/utils.ts` — remove `dp-` prefix from all maps:
  - `RADIUS_MAP`: `rounded-dp-none` → `rounded-none`, etc.
  - `DEPTH_MAP`: `shadow-dp-z1` → `shadow-z1`, etc.
  - `SIZE_MAP`: `text-dp-sm` → `text-sm`, etc.
  - `GLOW_MAP`: `shadow-dp-glow-teal` → `shadow-glow-teal`, etc.
  - `surfaceClass()`: already correct (`bg-glass-void`) — verify @theme maps it

- [ ] **A2.** Add glass/matte surface colors to @theme in `tokens.css`:
  ```
  --color-glass-void: var(--glass-void);
  --color-glass-deep: var(--glass-deep);
  --color-glass-smoke: var(--glass-smoke);
  --color-glass-frost: var(--glass-frost);
  --color-matte-dark: var(--matte-dark);
  --color-matte-medium: var(--matte-medium);
  --color-matte-light: var(--matte-light);
  ```
  This makes `bg-glass-void`, `bg-matte-dark` resolve in Tailwind v4.

- [ ] **A3.** Verify: `pnpm dev` renders Frame.svelte with visible glass backgrounds and shadows

### Phase B: Unify Dual @theme

- [ ] **B1.** Move `app.css` @theme entries into token build output:
  - Add `void` and `obsidian` color scales to `tokens.ts`
  - Add `font-sans` and `font-mono` to `tokens.ts`
  - Add `pulse-glow` animation to `tokens.ts`
  - Add `success`, `warning`, `error` signal colors to `tokens.ts`

- [ ] **B2.** Update `ds-tokens-build.ts` to emit these values in the @theme block

- [ ] **B3.** Strip `app.css` to ONLY:
  ```css
  @import "tailwindcss";
  @import "@fontsource/inter/400.css";
  @import "@fontsource/inter/500.css";
  @import "@fontsource/inter/600.css";
  @import "@fontsource/inter/700.css";
  @import "@fontsource/jetbrains-mono/400.css";
  @import "@fontsource/jetbrains-mono/500.css";
  @import "$lib/design/tokens/tokens.css";
  @import "$lib/design/index.css";

  html, body {
    width: 100%;
    height: 100%;
    background-color: var(--color-void-950);
    color: white;
  }
  ```

- [ ] **B4.** Run `pnpm ds:tokens:build` and verify single unified @theme

### Phase C: Semantic Tokens (Tier 2)

- [ ] **C1.** Create `tokens/semantic.ts` with intent-based aliases:
  ```typescript
  export const semantic = {
    surface: {
      primary: "var(--glass-void)",
      elevated: "var(--glass-smoke)",
      overlay: "var(--glass-deep)",
      muted: "var(--matte-dark)",
    },
    border: {
      subtle: "oklch(from var(--color-teal-700) l c h / 0.22)",
      soft: "oklch(from var(--color-teal-600) l c h / 0.30)",
      emphasis: "oklch(from var(--color-teal-500) l c h / 0.50)",
      focus: "var(--color-teal-400)",
    },
    depth: {
      flat: "var(--shadow-z0)",
      raised: "var(--shadow-z1)",
      panel: "var(--shadow-z2)",
      overlay: "var(--shadow-z3)",
      modal: "var(--shadow-z4)",
    },
    transition: {
      instant: "var(--duration-instant) var(--ease-out)",
      fast: "var(--duration-fast) var(--ease-out)",
      normal: "var(--duration-normal) var(--ease-inOut)",
      slow: "var(--duration-slow) var(--ease-inOut)",
    },
  } as const;
  ```

- [ ] **C2.** Update `ds-tokens-build.ts` to import and emit Tier 2 tokens as CSS custom properties:
  ```
  --surface-primary: var(--glass-void);
  --border-subtle: oklch(from var(--color-teal-700) l c h / 0.22);
  --depth-panel: var(--shadow-z2);
  ```

- [ ] **C3.** Add Tier 2 entries to @theme block so Tailwind utilities generate:
  ```
  --color-surface-primary: var(--surface-primary);
  --color-surface-elevated: var(--surface-elevated);
  --shadow-depth-panel: var(--depth-panel);
  ```

### Phase D: Component Tokens (Tier 3)

- [ ] **D1.** Create `tokens/components.ts` with per-kind scoped tokens:
  ```typescript
  export const components = {
    button: {
      bg: "var(--surface-primary)",
      "bg-hover": "var(--surface-elevated)",
      border: "var(--border-subtle)",
      "border-focus": "var(--border-focus)",
    },
    panel: {
      bg: "var(--surface-primary)",
      border: "var(--border-soft)",
      depth: "var(--depth-panel)",
    },
    input: {
      bg: "var(--surface-overlay)",
      "bg-focus": "var(--surface-elevated)",
      border: "var(--border-subtle)",
      "border-focus": "var(--border-focus)",
    },
    badge: {
      bg: "var(--surface-elevated)",
      border: "var(--border-subtle)",
    },
  } as const;
  ```

- [ ] **D2.** Update `ds-tokens-build.ts` to emit Tier 3 as CSS custom properties:
  ```
  --button-bg: var(--surface-primary);
  --panel-border: var(--border-soft);
  ```

- [ ] **D3.** Update `tokens/schema.ts` with Zod validators for Tier 2 and Tier 3

### Phase E: Rebuild design/index.css

- [ ] **E1.** Update `design/index.css` to import all design system CSS in correct order:
  ```css
  /* 1. Tokens (all 3 tiers) */
  /* (tokens.css imported separately in app.css before this) */

  /* 2. Molecules */
  @import "./molecules/glass.css";
  @import "./molecules/glow.css";
  @import "./molecules/bevel.css";

  /* 3. Common styles (moved from layouts/common/) */
  /* (migrate in app shell sprint) */
  ```

- [ ] **E2.** Run `pnpm svelte-check` — zero errors

---

## Verification

```bash
cd interfaces/desktop

# Build tokens
pnpm ds:tokens:build

# Verify single @theme
grep -c "@theme" src/lib/design/tokens/tokens.css  # Should be 1
grep "@theme" src/app.css  # Should return empty

# Verify class names resolve
pnpm dev  # Visual: Frame.svelte glass backgrounds visible

# Type check
pnpm svelte-check
```

---

## Files Modified

| File | Action |
|------|--------|
| `design/recipes/utils.ts` | FIX — remove `dp-` prefix from all maps |
| `design/tokens/tokens.css` | GENERATED — add glass/matte to @theme |
| `design/tokens/semantic.ts` | NEW — Tier 2 semantic aliases |
| `design/tokens/components.ts` | NEW — Tier 3 component tokens |
| `design/tokens/schema.ts` | UPDATE — add Tier 2/3 validators |
| `scripts/dev/design/ds-tokens-build.ts` | UPDATE — emit 3 tiers + unified @theme |
| `app.css` | STRIP — remove @theme block, keep fonts + base only |
| `design/index.css` | UPDATE — proper import order |

---

## Blocks

- SPRINT-APP-SHELL-REBUILD (can't use recipes until classes resolve)
- SPRINT-CHAT-OVERLAY (can't style anything until classes resolve)
- Every visual phase in MASTER-PLAN.md
