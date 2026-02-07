# SPRINT 11: ColdLight Token → Tailwind v4 Integration

> **Status**: READY FOR EXECUTION
> **Scope**: `interfaces/desktop/src/lib/design/tokens/`, `interfaces/desktop/src/lib/design/recipes/`
> **Prerequisites**: Token SSOT exists (tokens.ts), build pipeline exists (ds-tokens-build.ts)
> **Total Tasks**: 24 tasks across 6 phases
> **Total Files**: 8 modified, 0 new
> **Compact Checkpoints**: After Phase 2 (task 8), After Phase 4 (task 18)
> **Gate**: `pnpm svelte-check` 0 errors, `pnpm ds:tokens:build` succeeds, recipes render correctly

---

## Goal

Connect the token system to Tailwind v4 properly. Currently:
- tokens.ts (SSOT) generates tokens.css with `--dp-*` CSS variables
- tokens.css is **not imported** (commented out in app.css)
- Recipes reference non-existent classes (`glass-void`, `glass-deep`)
- Recipe utils duplicate token values as Tailwind class mappings

After this sprint:
- tokens.css includes both `:root` variables AND `@theme` Tailwind mappings
- One import enables the entire token system
- Recipes use generated utility classes (`bg-glass-void`, `rounded-dp-lg`)
- lefthook regenerates tokens on tokens.ts change
- Zod validates recipe registration

---

## Hard Invariants

1. **tokens.ts is SSOT** — never hand-edit tokens.css, types.ts, or any generated file
2. **`--dp-*` prefix for CSS vars** — namespace isolation
3. **Tailwind v4 @theme syntax** — no v3 preset objects
4. **Recipes use generated utilities** — no hardcoded Tailwind classes that bypass tokens
5. **All `.ts` imports use `.js` extension**
6. **lefthook hook triggers on `tokens.ts` change**

---

## Current State (Audit before execution)

```
src/lib/design/tokens/
├── tokens.ts            ✓ SSOT — all token definitions (288 lines)
├── tokens.css           ✓ Generated — :root with --dp-* vars (182 lines)
├── types.ts             ✓ Generated — TypeScript types + runtime arrays
├── tailwind.preset.ts   ✗ Generated — v3 format (OBSOLETE)
├── schema.ts            ✓ Zod validation schemas
└── .tokens.gen.mjs      ✗ Empty stub

app.css:
  Line 15: /* @import "$lib/design/tokens/tokens.css"; */  ← COMMENTED OUT
  Line 19-33: @theme { ... }  ← Hardcoded values, NOT referencing tokens

recipes/utils.ts:
  radiusClass("lg") → "rounded-lg"  ← Tailwind class, NOT token reference

recipes/components/panel/panel.default.ts:
  Line 21: "glass-void"  ← Class does NOT exist
```

**Verify before starting:**
- [ ] `pnpm ds:tokens:build` runs without error
- [ ] `src/lib/design/tokens/tokens.css` exists and has `:root` block
- [ ] `src/app.css` has commented import on line 15

---

## Phase 1: Update Token Generator for Tailwind v4

### Task 1.1: Read current generator
- [ ] Read `scripts/dev/design/ds-tokens-build.ts`
- [ ] Identify `generateCss()` function
- [ ] Note output format (`:root` block only)

### Task 1.2: Add @theme block generation to tokens.css
- [ ] Modify `generateCss()` to output TWO blocks:
  - First: `:root { --dp-* vars }`
  - Second: `@theme { Tailwind mappings }`
- [ ] @theme mappings:
  ```css
  @theme {
    /* Surface materials */
    --color-glass-void: var(--dp-glass-void);
    --color-glass-deep: var(--dp-glass-deep);
    --color-glass-smoke: var(--dp-glass-smoke);
    --color-glass-frost: var(--dp-glass-frost);
    --color-matte-dark: var(--dp-matte-dark);
    --color-matte-medium: var(--dp-matte-medium);
    --color-matte-light: var(--dp-matte-light);

    /* Accent color scales (dp-teal-500 etc) */
    --color-dp-teal-*: var(--dp-color-teal-*);
    /* ... all accents ... */

    /* Radius */
    --radius-dp-none: var(--dp-radius-none);
    --radius-dp-sm: var(--dp-radius-sm);
    --radius-dp-md: var(--dp-radius-md);
    --radius-dp-lg: var(--dp-radius-lg);
    --radius-dp-xl: var(--dp-radius-xl);
    --radius-dp-full: var(--dp-radius-full);

    /* Shadows */
    --shadow-dp-z0: var(--dp-shadow-z0);
    --shadow-dp-z1: var(--dp-shadow-z1);
    --shadow-dp-z2: var(--dp-shadow-z2);
    --shadow-dp-z3: var(--dp-shadow-z3);
    --shadow-dp-z4: var(--dp-shadow-z4);

    /* Glows */
    --shadow-dp-glow-teal: var(--dp-glow-teal);
    --shadow-dp-glow-purple: var(--dp-glow-purple);
    /* ... all glows ... */

    /* Spacing */
    --spacing-dp-1: var(--dp-space-1);
    --spacing-dp-2: var(--dp-space-2);
    /* ... all spacing ... */

    /* Text sizes */
    --font-size-dp-xs: var(--dp-text-size-xs);
    --font-size-dp-sm: var(--dp-text-size-sm);
    /* ... all text sizes ... */
  }
  ```

### Task 1.3: Delete tailwind.preset.ts generation
- [ ] Remove `generatePreset()` function (v3 format, obsolete)
- [ ] Remove `tailwind.preset.ts` from generated files list
- [ ] Keep the file but add deprecation comment OR delete entirely

### Task 1.4: Run generator and verify output
- [ ] Run: `cd interfaces/desktop && pnpm ds:tokens:build`
- [ ] Verify: tokens.css now has `:root` block AND `@theme` block
- [ ] Verify: no TypeScript errors

### Phase 1 Gate
- [ ] `pnpm ds:tokens:build` succeeds
- [ ] tokens.css contains `@theme {` block
- [ ] tokens.css contains `--color-glass-void:` inside @theme

---

## Phase 2: Enable Token Import

### Task 2.1: Uncomment token import in app.css
- [ ] Edit `src/app.css` line 15
- [ ] Change from: `/* @import "$lib/design/tokens/tokens.css"; */`
- [ ] Change to: `@import "$lib/design/tokens/tokens.css";`
- [ ] Remove comment on line 16

### Task 2.2: Remove duplicate @theme definitions
- [ ] In app.css `@theme` block (lines 19-33)
- [ ] Remove any values that are now defined in tokens.css
- [ ] Keep only app-specific values (fonts, custom animations)

### Task 2.3: Verify Tailwind utilities work
- [ ] Start dev server: `pnpm dev`
- [ ] In browser devtools, verify:
  - `bg-glass-void` generates correct background
  - `rounded-dp-lg` generates correct border-radius
  - `shadow-dp-z2` generates correct box-shadow

### Phase 2 Gate
- [ ] `pnpm dev` starts without CSS errors
- [ ] `bg-glass-void` resolves to `oklch(0.08 0.005 250 / 0.85)` in devtools
- [ ] `rounded-dp-lg` resolves to `0.75rem` in devtools

> **COMPACT CHECKPOINT** — Verify Phase 1 + 2 gates, then proceed.

---

## Phase 3: Update Recipe Utils

### Task 3.1: Update radiusClass() to use token utilities
- [ ] Edit `src/lib/design/recipes/utils.ts`
- [ ] Change RADIUS_MAP values:
  ```typescript
  const RADIUS_MAP: Record<RadiusToken, string> = {
    none: "rounded-dp-none",
    sm: "rounded-dp-sm",
    md: "rounded-dp-md",
    lg: "rounded-dp-lg",
    xl: "rounded-dp-xl",
    full: "rounded-dp-full",
  };
  ```

### Task 3.2: Update depthClass() to use token utilities
- [ ] Change DEPTH_MAP values:
  ```typescript
  const DEPTH_MAP: Record<DepthToken, string> = {
    0: "",
    1: "shadow-dp-z1",
    2: "shadow-dp-z2",
    3: "shadow-dp-z3",
    4: "shadow-dp-z4",
  };
  ```

### Task 3.3: Update sizeClass() to use token utilities
- [ ] Change SIZE_MAP values:
  ```typescript
  const SIZE_MAP: Record<SizeToken, string> = {
    sm: "text-dp-sm",
    md: "text-dp-base",
    lg: "text-dp-lg",
  };
  ```

### Task 3.4: Add glowClass() utility
- [ ] Add new function:
  ```typescript
  const GLOW_MAP: Record<GlowToken, string> = {
    off: "",
    teal: "shadow-dp-glow-teal",
    purple: "shadow-dp-glow-purple",
    magenta: "shadow-dp-glow-magenta",
    ember: "shadow-dp-glow-ember",
    frost: "shadow-dp-glow-frost",
    cyber: "shadow-dp-glow-cyber",
  };

  export function glowClass(glow: GlowToken): string {
    return GLOW_MAP[glow];
  }
  ```

### Task 3.5: Add surfaceClass() utility
- [ ] Add new function for surface materials:
  ```typescript
  export function surfaceClass(surface: SurfaceToken, variant: string): string {
    if (surface === "glass") {
      return `bg-glass-${variant}`;
    }
    if (surface === "matte") {
      return `bg-matte-${variant}`;
    }
    return "";
  }
  ```

### Phase 3 Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] All util functions return token-based utility classes
- [ ] No hardcoded Tailwind classes (e.g., "rounded-lg") remain

---

## Phase 4: Update Recipes

### Task 4.1: Update panel.default.ts (glass.void)
- [ ] Edit `src/lib/design/recipes/components/panel/panel.default.ts`
- [ ] Replace `"glass-void"` with `surfaceClass("glass", "void")`
- [ ] Replace `radiusClass(props.radius)` (already correct after Task 3.1)
- [ ] Update border to use token-based class if available

### Task 4.2: Update panel.glass-tint.ts
- [ ] Similar updates for glass.tint variant
- [ ] Use `surfaceClass("glass", "deep")` or appropriate variant

### Task 4.3: Update panel.matte.ts
- [ ] Use `surfaceClass("matte", "dark")` or appropriate variant

### Task 4.4: Update panel.metal.ts
- [ ] Use appropriate surface class

### Task 4.5: Update dialog.default.ts
- [ ] Ensure recipe uses token-based utilities

### Task 4.6: Update combobox.default.ts
- [ ] Ensure recipe uses token-based utilities

### Task 4.7: Update tabs.default.ts
- [ ] Ensure recipe uses token-based utilities

### Phase 4 Gate
- [ ] `pnpm svelte-check` — 0 errors
- [ ] No recipe files contain hardcoded `"glass-void"` string literal
- [ ] All recipes use `surfaceClass()`, `radiusClass()`, etc.

> **COMPACT CHECKPOINT** — Verify Phase 3 + 4 gates, then proceed.

---

## Phase 5: Enforcement

### Task 5.1: Add token regeneration hook to lefthook
- [ ] Edit `lefthook.yml`
- [ ] Add new command in `pre-commit`:
  ```yaml
  tokens-regen:
    glob: "interfaces/desktop/src/lib/design/tokens/tokens.ts"
    root: "interfaces/desktop"
    run: pnpm ds:tokens:build
    stage_fixed: true
  ```

### Task 5.2: Add recipe validation to preflight
- [ ] Create or update preflight check
- [ ] Validate that recipes don't use non-existent classes
- [ ] Check that `surfaceClass()` is used instead of hardcoded strings

### Task 5.3: Update biome.json if needed
- [ ] Ensure generated tokens.css is in exclude list (already is)
- [ ] No changes needed if already configured

### Phase 5 Gate
- [ ] lefthook.yml has `tokens-regen` command
- [ ] `pnpm lefthook run pre-commit` includes token regeneration

---

## Phase 6: Verification

### Task 6.1: Full build verification
- [ ] Run: `pnpm ds:tokens:build`
- [ ] Run: `pnpm svelte-check`
- [ ] Run: `pnpm dev`
- [ ] Verify: components render with correct styles

### Task 6.2: Visual verification
- [ ] Navigate to test page with Panel component
- [ ] Verify: glass surface is visible (translucent dark background)
- [ ] Verify: radius is applied correctly
- [ ] Verify: shadows appear at correct depth

### Task 6.3: Token chain verification
- [ ] Change a token value in tokens.ts (e.g., `--dp-radius-lg: 1rem`)
- [ ] Run: `pnpm ds:tokens:build`
- [ ] Verify: CSS updates with new value
- [ ] Verify: UI updates to reflect new radius

### Task 6.4: Delete obsolete files
- [ ] Delete or deprecate `tailwind.preset.ts` if not needed
- [ ] Delete `.tokens.gen.mjs` stub if not used

### Phase 6 Gate
- [ ] Token change → CSS change → UI change chain works
- [ ] `pnpm svelte-check` — 0 errors
- [ ] No console errors in dev server

---

## File Inventory

### Modified Files (8)

```
scripts/dev/design/ds-tokens-build.ts     — Add @theme generation
src/app.css                               — Enable token import, clean @theme
src/lib/design/recipes/utils.ts           — Token-based utility functions
src/lib/design/recipes/components/panel/panel.default.ts
src/lib/design/recipes/components/panel/panel.glass-tint.ts
src/lib/design/recipes/components/panel/panel.matte.ts
src/lib/design/recipes/components/panel/panel.metal.ts
lefthook.yml                              — Token regeneration hook
```

### Generated Files (refreshed)

```
src/lib/design/tokens/tokens.css          — Now includes @theme block
```

### Deleted/Deprecated Files

```
src/lib/design/tokens/tailwind.preset.ts  — Obsolete v3 format
src/lib/design/tokens/.tokens.gen.mjs     — Empty stub
```

---

## Success Criteria

1. **Single import enables tokens** — `@import "tokens.css"` in app.css
2. **Tailwind utilities work** — `bg-glass-void`, `rounded-dp-lg` resolve correctly
3. **Recipes use token utilities** — No hardcoded class names
4. **Token chain is live** — Change tokens.ts → rebuild → UI updates
5. **Enforcement in place** — lefthook regenerates on token change
6. **VPB-ready** — Token values are CSS vars, readable at runtime

---

## Future: VPB Integration (Not This Sprint)

After this sprint, the foundation is ready for:
- SvelteFlow nodes that expose `--dp-*` CSS vars as inputs
- Gradient mixer overlay that writes to token values
- Live preview of token changes in VPB canvas
- Export modified tokens back to tokens.ts

This requires a separate sprint (SPRINT-12-vpb-token-editor).
