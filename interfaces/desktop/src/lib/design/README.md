# COLD LIGHT Design System

> **Enterprise-grade, token-governed, VPB-ready design system for DevPulse.**

---

## ⚠️ HARD RULES

| Rule | Correct | Forbidden |
|------|---------|-----------|
| **Bits UI** | Import ONLY in `primitives/` | Import in components/blocks/domains |
| **CSS Values** | `var(--dp-*)` tokens only | Hardcoded `oklch()`, `8px`, etc. |
| **Props** | Union literals `"glass" \| "solid"` | `string` type |
| **Validation** | At boundaries (VPB load, API) | On every render |

---

## 8-Tier Architecture

```
lib/design/
├── taxonomy/          TIER 1: Category definitions + dependency gates
├── tokens/            TIER 2: SSOT JSON + Types + Zod schemas
├── foundations/       TIER 3: Spacing, Z-Index, Density maps
├── surfaces/          TIER 4: SSOT registry + CSS recipes
├── motion/            TIER 5: Keyframes + presets + budgets
├── behaviors/         TIER 6: Interaction modules + constraints
├── primitives/        TIER 7a: Bits UI wrappers (YOUR API)
├── components/        TIER 7b: Semantic styled components
└── blocks/            TIER 8: VPB compositions + validators
```

---

## SSOT Pattern

**TypeScript `index.ts` files ARE the SSOT** - no separate JSON needed.

Each tier's `index.ts` exports:
- Const registry objects with `as const`
- Type definitions
- Helper functions

```typescript
// surfaces/index.ts IS the SSOT
export const SurfaceRegistry = {
  glass: {
    recipe: "glass.surface.css",
    capabilities: { supportsTone: true, supportsGlow: true },
    allowedControls: { tone: ["cold", "neutral"], ... },
    dependencies: { tokens: ["dp-glass-*"] },
  },
} as const;
```

---

## Surfaces Structure

```
surfaces/
├── index.ts              # SSOT: registry + capabilities + helpers
└── recipes/
    ├── index.css         # Bundle import
    ├── glass.surface.css # Token-only CSS
    └── panels.surface.css
```

---

## Plugins (NOT a DS tier)

```
domains/plugins/parasiteLogo/
├── plugin.manifest.ts    # Capabilities declaration
├── plugin.vpb.tab.ts     # VPB tab contribution
└── plugin.blocks/        # Block definitions
```

---

## New Category Checklist

When adding (e.g., "slime" surface):

- [ ] **Taxonomy**: `surface/slime` in DesignCategories
- [ ] **Tokens**: `slime` in SurfaceTokens
- [ ] **Surfaces SSOT**: Entry with capabilities + controls + deps
- [ ] **Recipe CSS**: `slime.surface.css` (only if custom styles needed)
- [ ] **Motion**: Only if slime requires keyframes
- [ ] **Components**: Declare which allow slime

---

## Key SSOT Files

| File | Purpose |
|------|---------|
| `tokens/tokens.json` | Token values |
| `tokens/types.ts` | TS types (generated OK) |
| `tokens/schema.ts` | Zod validators |
| `surfaces/index.ssot.json` | Surface registry |
