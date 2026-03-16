# ColdLight Quick Refresh

> Read this after every compaction.

---

## What ColdLight IS

ColdLight is a **visual compiler**. Style Dictionary 5 is the engine. DTCG JSON tokens are the source. Everything downstream consumes SD5 output. No hand-written CSS values.

**Goal**: Liquid metal, glass depth, SVG neumorphism, 3x heavy visuals. NOT flat CSS. NOT MVP.

---

## 8-Axis Encoding (FROZEN)

```
v-s{#}z{#}d{#}b{#}g{#}f{#}m{#}t{#}
```

| Code | Category | Description |
|------|----------|-------------|
| `s` | surface | Glass-void, glass-deep, glass-teal, etc. |
| `z` | material | Glass clarity, matte, metal chrome/copper |
| `d` | depth | Shadow depth z0–z4 |
| `b` | bevel | Neumorphic inset shadows (off, subtle, soft, medium, strong) |
| `g` | glow | Accent emission (off, teal, purple, magenta, ember, frost, cyber) |
| `f` | frame | Border (off, soft, hard, glow, accent-teal, accent-purple) |
| `m` | motion | Ambient animation |
| `t` | transition | User-triggered speed + easing |

Composable: `v-s1 v-d2 v-t2` or full `v-s1z0d2b1g0f1m0t2`

---

## CSS Variable Names (What SD5 ACTUALLY Generates)

| Category | CSS Prefix | Example |
|----------|-----------|---------|
| Glow shadows | `--glow-*` | `--glow-teal` |
| Depth shadows | `--shadow-*` | `--shadow-z2` |
| Bevel | `--bevel-*` | `--bevel-subtle` |
| Motion duration | `--motion-duration-*` | `--motion-duration-fast` |
| Motion easing | `--motion-ease-*` | `--motion-ease-spring` |
| Motion animation | `--motion-animation-*` | `--motion-animation-breathe` |
| Transitions | `--transition-*` | `--transition-fade` |
| Colors | `--color-{hue}-{step}` | `--color-teal-500` |

**WARNING**: Do NOT invent variable names. Check `css/primitives/*.css` and `css/semantic/*.css` for actual output.

---

## Markup Contract

```html
<button class="v-s1 v-d2 v-t2" data-kind="button" data-slot="root" data-state="idle">
  Save
</button>
```

- `v-*` = variant utilities (generated from token-categories.ts)
- `data-kind` / `data-slot` / `data-state` = three data attributes only

---

## 4-Layer Model (LOCKED)

| Layer | What | Location |
|-------|------|----------|
| Primitives | CONFIGURATION ONLY. Contract + structural shell. Never imported by users. | `primitives/{kind}/` |
| Recipes | Styling patterns. registerRecipe() + per-slot class strings. | `recipes/components/{kind}/` |
| Components | THE PRODUCT. ARIA + recipe styling + useColdLight(). What users import. | `components/{kind}/` |
| UI | Styled wrappers (Radix/shadcn model). APPROVED, not yet built. | `ui/{kind}/` (planned) |

---

## Token Pipeline

```
17 DTCG JSON files (scripts/build/styledictionary/tokens/src/*.json)
  → SD5 (sd.config.ts, 664 lines, enum-authored)
  → css/{primitives,semantic,components}/*.css (@layer tokens.*)
  → theme/*.css (Tailwind @theme blocks)
  → types/*.d.ts (TypeScript)
  → generated/token-manifest.json (VPB metadata)
  → generated/variants.css (8-axis @utility rules)
```

**Build**: `pnpm ds:tokens:build`

---

## Key Paths

| File | Purpose |
|------|---------|
| `registry/token-categories.ts` | 8-axis category SSOT |
| `registry/presets.ts` | 60+ named visual configs per kind |
| `registry/resolve-visual.ts` | Pipeline: defaults → preset → props → encoding |
| `registry/kind-definitions.ts` | 30 CDOs (kind, engine, defaults) |
| `generated/variants.css` | Auto-generated @utility rules |
| `svg/filters/` | SVG neumorphism (feSpecularLighting, feGaussianBlur, feTurbulence) |
| `recipes/` | 104 .ts files, 32 registered recipes |
| `components/` | 89 kinds, 167 .svelte files |
| `primitives/` | 92 kinds, 59 .svelte files |
| `blocks/` | VPB block system (8 categories) |
| `components/_base/use-coldlight.svelte.ts` | Svelte 5 rune wrapper |
| `components/_base/schema.ts` | ComponentSchema |

---

## Commands

```bash
cd interfaces/desktop
pnpm dev              # Dev server :1420
pnpm svelte-check     # TypeScript (0 errors)
pnpm ds:tokens:build  # SD5: JSON → CSS + @theme + .d.ts + manifest
pnpm build            # Vite production build
```

---

## Banned

- Direct `@melt-ui/svelte` imports outside `_internal/`
- Hand-written CSS values outside `design/`
- Raw HTML when a ColdLight component exists
- `any` types
- jsdom testing
- References to deleted concepts: taxonomy/, catalog/, semantics/, molecules/, shortcodes/
- Inventing CSS variable names without checking SD5 output
- Describing architecture that doesn't exist on disk
