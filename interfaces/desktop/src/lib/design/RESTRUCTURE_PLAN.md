# Design System Restructure Plan

## ⚠️ PARTIALLY EXECUTED STATE

Files already created (before user stopped execution):
- `recipes/index.ts` - Recipe registry with Duration/Easing/Motion + sample recipes
- `recipes/actions/index.ts` - Action registry with glowTrack, ripple, tilt, focusTrap

These need review. They may need adjustment or deletion based on user decisions.

---

## PRINCIPLE: Nothing is deleted until it is captured

This document maps EVERY piece of existing content to its destination in the new structure.
User must verify this mapping before any file operations.

---

## CURRENT STATE INVENTORY

### 1. taxonomy/ (KEEP AS-IS)
| File | Status | Content |
|------|--------|---------|
| `kinds.ts` | ✅ DONE | Block kind definitions with layoutMode |
| `contracts.ts` | ✅ DONE | DsSurfaceProps + kind-specific contracts |
| `slots.ts` | ✅ DONE | Slot configurations |
| `index.ts` | ✅ DONE | Barrel export |

**Action:** None needed - already correct.

---

### 2. tokens/ (KEEP AS-IS)
| File | Status | Content |
|------|--------|---------|
| `tokens.ts` | ✅ SSOT | Canonical token definitions |
| `tokens.css` | ✅ GENERATED | CSS custom properties |
| `types.ts` | ✅ GENERATED | TypeScript types + runtime arrays |
| `schema.ts` | ✅ EXISTS | Zod validators |
| `tailwind.preset.ts` | ✅ GENERATED | Tailwind theme mapping |
| `index.ts` | ✅ EXISTS | Barrel export |

**Action:** None needed - already correct.

---

### 3. foundations/index.ts (MERGE INTO tokens/)

**Current content that must be captured:**

```typescript
// SpaceMap - maps s0-s8 to CSS vars
export const SpaceMap = {
  s0: "var(--dp-space-1)",
  s1: "var(--dp-space-2)",
  // ...
}

// RadiusMap - maps r0-r4 to CSS vars
export const RadiusMap = {
  r0: "0",
  r1: "var(--dp-radius-sm)",
  // ...
}

// TextMap - maps xs-2xl to CSS vars
export const TextMap = {
  xs: "var(--dp-text-xs)",
  // ...
}

// ZIndex - z-index scale
export const ZIndex = {
  base: 0,
  dropdown: 100,
  // ...
}

// Density - compact/default/comfortable presets
export const Density = { ... }
```

**Destination:** Add to `tokens/index.ts` as re-exports OR add to `tokens/maps.ts` as a new file.

**Question for user:**
- Option A: Add `tokens/maps.ts` for these lookup maps
- Option B: Inline into `tokens/index.ts`
- Option C: These are redundant with generated types - delete entirely

---

### 4. surfaces/ (CONTENT → recipes/)

**surfaces/index.ts contains:**
```typescript
// SurfaceCapabilities interface
// SurfaceAllowedControls interface
// SurfaceDependencies interface
// SurfaceRegistryEntry interface
// SurfaceRegistry object (glass, panels, solid, matte entries)
// Helper functions: isSurfaceAllowed, getAllowedControls, hasCapability
```

**Destination:** `recipes/surface.registry.ts`
- This is recipe metadata, not rendering logic
- Maps surface types to their capabilities

**surfaces/recipes/glass.surface.css contains:**
```css
/* Utility classes - NOT recipe pattern, more like component utilities */
.glass-button              /* Button with glass styling + hover/active/disabled states */
.glass-button-primary      /* Primary variant */
.glass-input               /* Input with glass styling + focus state */
.glass-tint-teal           /* Tint modifier using --_tint-hue */
.glass-tint-purple         /* Tint modifier */
.glass-tint-gold           /* Tint modifier */
.glass-tint-coral          /* Tint modifier */
.glass-scrim               /* Backdrop overlay for modals */
```
Uses tokens: `--dp-space-*`, `--dp-radius-*`, `--dp-font-*`, `--dp-text-*`, `--dp-hue-*`,
`--dp-bevel-*`, `--dp-duration-*`, `--dp-ease-*`, `--dp-inset-*`

**surfaces/recipes/panels.surface.css contains:**
```css
/* Layered panel structure - GOOD recipe pattern */
.dp-panel                  /* Base panel: grid, gap layer, glass gradient, outer glow */
.dp-panel--glass           /* Glass recipe variant with dual-tint gradient */
.dp-panel__content         /* Inner content container */
.dp-panel--sm              /* Size variant (smaller gap) */
.dp-panel--lg              /* Size variant (larger gap) */
/* Plus :hover and :focus-within states */
```
Uses tokens: `--dp-panel-gap`, `--dp-radius-*`, `--dp-glass-*`, `--dp-blur-*`,
`--dp-border-*`, `--dp-hue-*`, `--dp-glow-*`, `--dp-shadow-*`, `--dp-bevel-*`, `--dp-space-*`

**surfaces/recipes/index.css contains:** Just `@import` for the above two files.

**Destination:** `recipes/css/` folder
- `glass.surface.css` → `recipes/css/utilities.css` (or integrate into component recipes)
- `panels.surface.css` → `recipes/css/panels.css`

---

### 5. motion/ (CONTENT → recipes/)

**motion/index.ts contains:**
```typescript
// Duration tokens (instant, fast, normal, slow)
// Easing tokens (linear, easeOut, easeIn, easeInOut, bounce)
// MotionPresets (fadeIn, fadeOut, slideUp, slideDown, scaleIn, pulse)
// MotionBudgets (reduced, minimal, default, full)
// prefersReducedMotion() helper
```

**Destination:** `recipes/index.ts` - already captured there

**motion/keyframes.css contains:**
- gradient-shift
- glow-pulse, glow-electric, glow-rotate
- parasite-sweep, text-shimmer
- scanline-scroll, subtle-pulse, breathe
- hover-lift, press-down, fade-in-up, fade-out-down, focus-ring-pulse

**Destination:** `recipes/css/keyframes.css`

---

### 6. behaviors/index.ts (CONTENT → recipes/actions/ OR domains/)

**Current content:**
```typescript
// BehaviorTypes array
// HoverIntentConfig, PressConfig, TiltConfig, ZoneFocusConfig interfaces
// BehaviorPresets (button, card, panel, modal, zone)
// BehaviorConstraints
```

**Question for user:**
- Option A: These are action configs → `recipes/actions/types.ts`
- Option B: These are domain-level behavior rules → `domains/interactions/`
- Option C: Redundant with recipe.requires pattern - delete

---

### 7. blocks/index.ts (CONTENT → sys/debug/vpb/)

**Current content:**
```typescript
// BlockSchema (Zod) - basic block validation
// LayoutSchema (Zod) - layout file validation
// validateLayout, safeParseLayout helpers
// InspectorControls - VPB inspector UI config
```

**Destination:** `sys/debug/vpb/schema/`
- BlockSchema → Replace with typed BlockNode<K> from taxonomy
- LayoutSchema → Keep for file validation
- InspectorControls → `vpb/inspector/controls.ts`

**Note:** Current BlockSchema uses old token schemas (ToneSchema doesn't exist).
This needs rewrite, not migration.

---

### 8. components/ (EVALUATE EACH)

| Component | Content | Decision |
|-----------|---------|----------|
| `Badge.svelte` | Badge component | → DELETE or → domains/ui/ |
| `Button.svelte` | Button component | → DELETE or → domains/ui/ |
| `Card.svelte` | Card surface | → renderers/Card.svelte (after recipes) |
| `GlassPanel.svelte` | Glass panel surface | → renderers/Panel.svelte |
| `Input.svelte` | Input component | → DELETE or → domains/ui/ |
| `Panel.svelte` | Panel surface | → renderers/Panel.svelte |
| `Toggle.svelte` | Toggle component | → DELETE or → domains/ui/ |

**Question for user:**
- Are Badge, Button, Input, Toggle app UI or design system?
- If app UI → move to `domains/ui/` or delete
- If design system → need taxonomy entries first

---

### 9. primitives/ (KEEP - Bits UI wrappers)

| File | Status | Content |
|------|--------|---------|
| `Accordion.svelte` | KEEP | Bits UI Accordion wrapper |
| `Button.svelte` | KEEP | Bits UI Button wrapper |
| `Dialog.svelte` | KEEP | Bits UI Dialog wrapper |
| `Surface.svelte` | ⚠️ VIOLATES RULES | Has component-scoped `<style>` block |
| `Tabs.svelte` | KEEP | Bits UI Tabs wrapper |
| `TabSet.svelte` | KEEP | Bits UI TabSet wrapper |
| `Toggle.svelte` | KEEP | Bits UI Toggle wrapper |
| `ParasiteLogo.svelte` | KEEP | Logo component |

**⚠️ CRITICAL: Surface.svelte Analysis**

`primitives/Surface.svelte` has a 100+ line `<style>` block that:
- Uses `data-*` attributes for variant selection (data-variant, data-bevel, data-depth, etc.)
- Has component-scoped CSS that duplicates token logic
- Violates **Rule A** (tokens are global only) and **Rule C** (recipes are the only place styling happens)

```svelte
<!-- Current pattern (VIOLATES RULES) -->
<div data-variant={variant} data-bevel={bevel} data-glow={glow}>
<style>
  .dp-surface[data-variant="glass"] { background: var(--dp-glass-void); }
  .dp-surface[data-glow="teal"] { box-shadow: var(--dp-glow-teal); }
  /* ...100+ lines of CSS */
</style>
```

**Question for user:**
- Option A: DELETE - Replace with renderer that uses recipes (correct pattern)
- Option B: KEEP temporarily as legacy, mark deprecated, replace later
- Option C: This IS the renderer pattern we want (contradicts plan)

---

### 10. plugins/parasite/ (KEEP AS-IS)

Special plugin, not part of core design system restructure.

---

## TARGET STRUCTURE

```
src/lib/design/
├── taxonomy/                    # ✅ DONE - What exists
│   ├── index.ts
│   ├── kinds.ts
│   ├── contracts.ts
│   └── slots.ts
│
├── tokens/                      # ✅ DONE - Values
│   ├── index.ts
│   ├── tokens.ts                # SSOT
│   ├── tokens.css               # GENERATED
│   ├── types.ts                 # GENERATED
│   ├── schema.ts
│   ├── tailwind.preset.ts       # GENERATED
│   └── maps.ts                  # NEW: SpaceMap, RadiusMap, etc. (from foundations)
│
├── recipes/                     # NEW - How it looks
│   ├── index.ts                 # Recipe registry + Duration/Easing/Motion
│   ├── surface.registry.ts      # Surface capabilities (from surfaces/)
│   ├── css/
│   │   ├── index.css            # Bundle import
│   │   ├── keyframes.css        # From motion/
│   │   ├── glass.css            # From surfaces/recipes/
│   │   └── panels.css           # From surfaces/recipes/
│   └── actions/
│       └── index.ts             # Action registry + implementations
│
├── primitives/                  # KEEP - Bits UI wrappers
│   └── (existing files)
│
├── renderers/                   # FUTURE - After recipes complete
│   └── (created per 6-stage gate)
│
├── plugins/                     # KEEP AS-IS
│   └── parasite/
│
└── index.ts                     # Clean barrel export
```

---

## WHAT GETS DELETED (after capture verified)

| Folder/File | Captured In | Safe to Delete? |
|-------------|-------------|-----------------|
| `foundations/` | `tokens/maps.ts` | ⏳ After user confirms |
| `surfaces/` | `recipes/surface.registry.ts` + `recipes/css/` | ⏳ After user confirms |
| `motion/` | `recipes/index.ts` + `recipes/css/keyframes.css` | ⏳ After user confirms |
| `behaviors/` | `recipes/actions/` OR deleted | ⏳ User decision needed |
| `blocks/` | `sys/debug/vpb/schema/` | ⏳ After user confirms |
| `components/` | Evaluated per-file | ⏳ User decision needed |

---

## QUESTIONS FOR USER BEFORE PROCEEDING

Please answer each question with A, B, or C:

### Q1: foundations/ (SpaceMap, RadiusMap, TextMap, ZIndex, Density)
- **A**: Move to `tokens/maps.ts` - keep as lookup helpers
- **B**: Delete - redundant with generated types
- **C**: Something else (explain)

### Q2: behaviors/ (BehaviorTypes, configs, presets, constraints)
- **A**: Move to `recipes/actions/types.ts` - behavior configs for actions
- **B**: Delete - redundant with recipe.requires pattern
- **C**: Move to `domains/` - app-level behavior

### Q3: components/*.svelte (Badge, Button, Card, GlassPanel, Input, Panel, Toggle)
- **A**: DELETE ALL - these are scaffold, rebuild from scratch via 6-stage gate
- **B**: KEEP as legacy in `components/` - migrate incrementally
- **C**: Move to `domains/ui/` - these are app UI, not design system

### Q4: primitives/Surface.svelte (has 100+ lines component-scoped CSS)
- **A**: DELETE - violates rules, rebuild as proper renderer
- **B**: KEEP temporarily - mark deprecated, replace later
- **C**: This IS correct - update plan to allow this pattern

### Q5: Already-created recipes/index.ts and recipes/actions/index.ts
- **A**: KEEP - they look good, continue from here
- **B**: DELETE - start fresh after plan approval
- **C**: REVIEW - show me the content first

### Q6: app.css import chain
- **A**: Single import: `@import "./lib/design/index.css";`
- **B**: Keep multi-import: tokens.css, keyframes.css, recipes.css separately
- **C**: Something else (explain)

### Q7: Overall approach
- **A**: Clean slate - delete everything except taxonomy/ and tokens/, rebuild methodically
- **B**: Migrate incrementally - move files, update imports, verify at each step
- **C**: Hybrid - delete obvious scaffold, migrate valuable CSS

---

## EXECUTION ORDER (after user approval)

1. Create `tokens/maps.ts` with foundations content
2. Create `recipes/css/` folder
3. Move `motion/keyframes.css` → `recipes/css/keyframes.css`
4. Move `surfaces/recipes/*.css` → `recipes/css/`
5. Create `recipes/css/index.css` bundle
6. Create `recipes/surface.registry.ts` from surfaces/index.ts
7. Update `recipes/index.ts` to import surface registry
8. Update `design/index.ts` as clean barrel
9. Update `app.css` import chain
10. Delete old folders (foundations, surfaces, motion, behaviors, blocks)
11. Handle components/ per user decision

---

## VERIFICATION CHECKLIST

Before deleting any old folder:
- [ ] `pnpm check` passes
- [ ] `pnpm dev` loads without errors
- [ ] HMR works
- [ ] All exports from old files are available from new locations
