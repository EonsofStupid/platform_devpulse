# COLD LIGHT Design System

> **Enterprise-grade, token-governed, VPB-ready design system for DevPulse.**

---

## 🛑 BEFORE WRITING ANY CODE

**Read [.agent/INSTRUCTIONS.md](./.agent/INSTRUCTIONS.md) first.**

This contains the mandatory pre-code sequence that MUST be followed.

---

## ⚠️ HARD RULES

| Rule | Correct | Forbidden |
|------|---------|-----------|
| **Bits UI** | Import ONLY in `primitives/` | Import in components/blocks/domains |
| **CSS Values** | `var(--dp-*)` tokens only | Hardcoded `oklch()`, `8px`, etc. |
| **Props** | Union literals `"glass" \| "solid"` | `string` type |
| **Validation** | At boundaries (VPB load, API) | On every render |
| **New Tokens** | Add to `tokens.css` FIRST | Use value before token exists |

---

## ✅ PRE-CODE CHECKLIST

Before writing ANY code:

1. [ ] **Read `.agent/INSTRUCTIONS.md`**
2. [ ] **Identify Tier** - Which of the 8 tiers?
3. [ ] **Check Tokens Exist** - Grep `tokens.css` for what you need
4. [ ] **If Token Missing → Create It First** - Add to `tokens.css`, then use
5. [ ] **No Hardcoded Values** - All values use `var(--dp-*)`

---

## ✅ POST-CODE CHECKLIST

After writing code, VERIFY:

1. [ ] **Grep for hardcoded colors**: `grep -rE "oklch\([0-9]" myfile.css`
2. [ ] **Grep for hardcoded pixels**: `grep -rE "[0-9]+px" myfile.css`
3. [ ] **Grep for bits-ui imports outside primitives**
4. [ ] **File has proper header** with `@file`, `@layer`, `@since`
5. [ ] **SSOT updated** if new surface/behavior added

---

## 8-Tier Architecture

```
lib/design/
├── .agent/            INSTRUCTIONS for AI assistants
├── taxonomy/          TIER 1: Category definitions
├── tokens/            TIER 2: SSOT values + types + validators
├── foundations/       TIER 3: Spacing, Z-Index, Density
├── surfaces/          TIER 4: Material recipes (CSS)
├── motion/            TIER 5: Keyframes + Budgets
├── behaviors/         TIER 6: Interaction modules
├── primitives/        TIER 7a: Bits UI wrappers (YOUR API)
├── components/        TIER 7b: Semantic styled components
└── blocks/            TIER 8: VPB compositions
```

---

## SSOT Pattern

**TypeScript `index.ts` files ARE the SSOT** - no separate JSON needed.

```typescript
export const SurfaceRegistry = {
  glass: {
    recipe: "glass.surface.css",
    capabilities: { supportsTone: true, supportsGlow: true },
    allowedControls: { tone: ["cold", "neutral"] },
    dependencies: { tokens: ["dp-glass-*"] },
  },
} as const;
```

---

## CSS File Locations

| File | Tier | Purpose |
|------|------|---------|
| `tokens/tokens.css` | 2 | CSS variables (SSOT) |
| `motion/keyframes.css` | 5 | Keyframe definitions |
| `surfaces/recipes/*.css` | 4 | Surface recipes |

---

## Key Commands

```bash
pnpm headers:check    # Verify file headers
pnpm headers:inject   # Add missing headers
pnpm dev              # Dev server
```

---

## Related Docs

- [.agent/INSTRUCTIONS.md](./.agent/INSTRUCTIONS.md) - **READ FIRST** - AI agent instructions
- [DesignArchitecture.md](./DesignArchitecture.md) - Complete architecture notes
- [STYLE_GUIDE.md](./STYLE_GUIDE.md) - Coding standards
