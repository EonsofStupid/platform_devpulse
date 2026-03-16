# Claude Instructions for ColdLight

> **Read this first when working on ColdLight.**
> **The owner is in charge. ColdLight serves the owner's vision. Config serves the owner.**

---

## The One Rule

**Config drives everything. The owner decides.**

---

## Ownership Hierarchy

```
OWNER (human) — supreme authority
  └── coldlight.config.ts — the owner's instrument of control
       └── ColdLight — owns EVERYTHING by default
            ├── ARIA attributes, focus, keyboard, state
            ├── Component structure, slots, props, typing
            ├── CSS via SD5 tokens, recipes, variants
            ├── Public API (what users import)
            └── MeltUI adapter (EXCEPTION ONLY — never the default)
```

---

## What ColdLight IS

ColdLight is a **visual compiler**. Style Dictionary 5 is the engine. 17 DTCG JSON token files are the source. SD5 generates CSS, TypeScript types, Tailwind @theme blocks, and VPB manifests. Everything downstream consumes SD5 output.

**The goal**: liquid metal, glass depth, SVG neumorphism, 20-40px glows, 5-7 layer bevel stacks, text-level glow emission. 3x heavy visuals. Not conservative. Not MVP.

---

## ARIA Ownership (CRITICAL)

**ColdLight OWNS ARIA by default.** The `engine` field in each schema determines who provides ARIA:

- `"coldlight"` (DEFAULT) — ColdLight handles ARIA. 60+ kinds.
- `"meltui"` (EXCEPTION) — MeltUI adapter handles ARIA. Only for complex ARIA patterns (dialog focus trap, combobox listbox). ~20 kinds.

**ColdLight is ALWAYS the public API.** Users never import `@melt-ui/svelte`.

---

## 4-Layer Architecture (LOCKED)

| Layer | Folder | What It Does |
|-------|--------|-------------|
| **Primitives** | `primitives/{kind}/` | CONFIGURATION ONLY. Contract + structural shell. Never imported by users. |
| **Recipes** | `recipes/components/{kind}/` | Styling patterns via registerRecipe() + per-slot class strings. |
| **Components** | `components/{kind}/` | THE PRODUCT. ARIA + recipe styling + useColdLight(). What users import. |
| **UI** | `ui/{kind}/` | Styled wrappers (Radix/shadcn model). APPROVED by owner, not yet built. |

---

## Token Pipeline (SD5)

```
17 DTCG JSON files (scripts/build/styledictionary/tokens/src/*.json)
  → SD5 transforms (colorOklch, sizePxToRem, shadowCssShorthand, gradientCssShorthand)
  → css/{primitives,semantic,components}/*.css (@layer tokens.*)
  → theme/*.css (Tailwind v4 @theme blocks)
  → types/*.d.ts (TypeScript const arrays + union types)
  → generated/token-manifest.json (VPB metadata)
```

**Build**: `pnpm ds:tokens:build`
**Config**: `scripts/build/styledictionary/sd.config.ts` (664 lines, enum-authored, 28 platforms)

### CSS Variable Names (What SD5 ACTUALLY Generates)

| Token Group | CSS Prefix | NOT This |
|-------------|-----------|----------|
| Glow shadows | `--glow-*` | ~~--shadow-glow-*~~ |
| Motion duration | `--motion-duration-*` | ~~--transition-duration-*~~ |
| Motion easing | `--motion-ease-*` | ~~--transition-timing-function-*~~ |
| Motion animation | `--motion-animation-*` | ~~--animate-*~~ |
| Depth shadows | `--shadow-*` | correct |
| Transitions | `--transition-*` | correct (semantic composites) |

**NEVER invent variable names. Check the generated CSS files.**

---

## 8-Axis Encoding

SSOT: `registry/token-categories.ts`

`v-s3z1d2b1g0f1m0t2` or composable `v-s3 v-d2 v-t2`

| Code | Category |
|------|----------|
| s | surface |
| z | material |
| d | depth |
| b | bevel |
| g | glow |
| f | frame |
| m | motion |
| t | transition |

---

## Preset System

- `registry/presets.ts` — 60+ named presets per kind
- `registry/resolve-visual.ts` — Pipeline: kind defaults → preset → props → encoding → ResolvedVisual
- `registry/kind-definitions.ts` — 30 CDOs (kind, engine, defaultPreset, defaultRecipe, requiredAxes)

---

## SVG Neumorphism

Real SVG filter primitives in `svg/filters/`:
- `feSpecularLighting` — Phong model bevel depth
- `feGaussianBlur` + `feColorMatrix` — shape-aware glow
- `feTurbulence` + `feDisplacementMap` — surface grain

Parameterized via CSS custom properties. VPB generates editor controls from filter manifest.

---

## Verified Disk State (2026-03-16)

| What | Count |
|------|-------|
| Component kinds | 89 |
| Component .svelte files | 167 |
| Primitive kinds | 92 |
| Primitive .svelte files | 59 |
| Recipe .ts files | 104 |
| Registered recipes | 32 |
| Registered presets | 60+ |
| Token JSON files | 17 |
| SD5 platforms | 28 |

---

## Testing

- **Vitest browser tests** in real Chromium
- **No jsdom. No mocking DOM.**
- Every primitive: ARIA presence, data attributes, keyboard, focus, state
- Every component: schema validation, recipe application, prop forwarding

---

## Files to Read First

1. `COLDLIGHT.md` — Canonical specification
2. `coldlight.config.ts` — Config orchestrator
3. `registry/token-categories.ts` — 8-axis encoding SSOT
4. `registry/presets.ts` — Named visual configs
5. `TOKEN_PIPELINE.md` — SD5 pipeline details

---

## Banned

- Direct `@melt-ui/svelte` imports outside `_internal/`
- Hand-written CSS values outside `design/`
- Raw HTML when a ColdLight component exists
- `any` types
- jsdom testing
- Inline `recipe.ts` in component folders (use centralized `recipes/components/{kind}/`)
- References to deleted concepts: taxonomy/, catalog/, semantics/, molecules/, shortcodes/
- Describing architecture that doesn't exist on disk
- Inventing CSS variable names without verifying SD5 output

---

YOU DO NOT EXECUTE A SINGLE LINE OF CODE WITHOUT A TRUE PLAN WRITTEN FIRST.
METHODICALLY AND ACTUALLY OFF THE CODEBASE. ZERO ASSUMPTIONS.
THAT PLAN ALLOWS YOU TO HAVE RESEARCH. YOU DO NOT GUESS.
THIS IS FOUNDATIONAL WORK.

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
