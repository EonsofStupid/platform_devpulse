# ColdLight Style Guide

> Code standards and architectural boundaries.

---

## THE VISUAL COMPILER PATTERN

ColdLight is a visual compiler. Style Dictionary 5 generates CSS from DTCG JSON tokens. Everything downstream consumes SD5 output. No hand-written CSS values.

### How It Works

```
SD5 DTCG JSON → CSS custom properties → Tailwind @theme → variants.css @utility
                                                         ↓
Components: useColdLight() → resolveVisual() → cn(recipe, visual.segments, radius)
                                                         ↓
DOM: class="btn h-10 px-4 v-s1 v-d2 v-g1 rounded-lg" data-encoding="v-s1d2g1"
```

---

## Core Principles

1. **SD5 is the UI compiler** — drives ALL CSS generation
2. **Recipes are composable** — configurable objects with defaults, not static strings
3. **VPB writes code** — code generator, not just a previewer
4. **Token-driven** — no raw colors, no raw spacing, no magic numbers
5. **8-axis encoding** — v-* utilities set CSS custom properties from token-categories.ts
6. **Pre-release mode** — no backwards compat, no shims, aggressively reauthor

---

## Rules

### Components NEVER contain:
- Raw color values (`#fff`, `oklch()`, `rgb()`)
- Arbitrary Tailwind values (`bg-[#000]`, `text-[12px]`)
- Inline styles with raw values
- Hand-written CSS custom property references

### Components ALWAYS use:
- `useColdLight()` for visual resolution
- `cn()` for class composition
- Recipe functions for layout
- v-* encoding for visual properties
- `data-kind`, `data-slot`, `data-state` attributes

### Token Usage:
- Tokens exist as DTCG JSON in `scripts/build/styledictionary/tokens/src/`
- Consumed via SD5-generated CSS custom properties
- Mapped to Tailwind via @theme blocks
- Exposed to components via the 8-axis encoding system
- NEVER reference token CSS vars directly in components

### File Organization:
- `.js` extensions in TypeScript imports
- `cn()` from `$lib/design/utils/cn.js`
- `forEach` for Set iteration (not `for...of`)
- Every component follows the `components/{kind}/` pattern

---

## Verification

```bash
cd interfaces/desktop
pnpm ds:tokens:build    # SD5 build
pnpm svelte-check       # 0 errors
pnpm build              # Vite build passes
```

---

**SD5 is the compiler. Tokens are the source. Components consume encoding. No shortcuts.**
