# ColdLight Quick Refresh

> Read this after every compaction.

---

## Variant Key Encoding (8-AXIS — FROZEN)

```
v-s{#}z{#}d{#}b{#}g{#}f{#}m{#}t{#}
```

| Key | Code | Meaning |
|-----|------|---------|
| `s` | surface | Surface type (glass-void, glass-deep, glass-teal, glass-purple, etc.) |
| `z` | material | Material / z-depth |
| `d` | depth | Shadow depth (z0–z4) |
| `b` | bevel | Bevel treatment (off, subtle, soft, medium) |
| `g` | glow | Glow color (off, teal, purple, magenta, ember, frost, cyber) |
| `f` | frame | Frame/border (off, soft, hard, glow, accent-teal, accent-purple) |
| `m` | motion | Motion animation |
| `t` | transition | Transition speed |

Example: `v-s1z0d2b1g0f1m0t2`
Composable: `v-s1 v-d2 v-t2`

---

## Markup Contract

```html
<button class="v-s1 v-d2 v-t2" data-kind="button" data-slot="root" data-state="idle">
  Save
</button>
```

- `v-*` = variant utilities (set CSS custom properties, generated from token-categories.ts)
- `data-kind` / `data-slot` / `data-state` = THREE data attributes only

---

## Layer Stack (LOCKED — 4 layers)

| Layer | What | Location |
|-------|------|----------|
| Primitives | Structureless shells. Zero ARIA. data-kind + data-slot + HTML + ...rest | `primitives/{kind}/` |
| Components | Primitive + Builder = ARIA-complete. ZERO visual style. | `components/{kind}/` |
| Recipes | Styling patterns. registerRecipe() + DsSurfaceProps + getRecipe() | `recipes/components/{kind}/` |
| UI | Component + Recipe = Styled. What users import. | `ui/{kind}/` |

---

## Provider Model

```
SD5 Tokens → CSS Custom Properties → Tailwind v4 @theme → variants.css @utility blocks
```

- **ColdLight owns**: `role`, `aria-*`, `tabindex`, focus, keyboard, `data-kind`, `data-slot`, `data-state`
- **dsAdapter (MeltUI)**: EXCEPTION ONLY — complex ARIA (dialog focus trap, combobox listbox)
- **Adapters**: `api/dsadapters/{engine}/_internal/{kind}/`

---

## Token Pipeline

- **Style Dictionary v5** — DTCG 1.0 → CSS + TypeScript + JSON
- **OKLCH** color system
- **3-tier** — Global → Semantic → Component tokens
- **8-axis encoding** — token-categories.ts is SSOT → generates variants.css, Zod schemas, types
- **Build**: `pnpm ds:tokens:build`

---

## Key Paths

- `registry/token-categories.ts` — 8-axis category SSOT (add value here → types auto-update)
- `registry/presets.ts` — Named visual configs per kind (60+ presets)
- `registry/resolve-visual.ts` — Pipeline: defaults → preset → props → encoding
- `generated/variants.css` — Auto-generated @utility rules from token-categories
- `api/dsadapters/` — Adapter layer (coldlight/ and meltui/)
- `primitives/` — Structural shells (83 kinds)
- `components/` — ARIA + state (67 kinds)
- `recipes/` — Styling (centralized registerRecipe system)

---

## Commands

```bash
cd interfaces/desktop
pnpm dev              # Dev server
pnpm svelte-check     # TypeScript
pnpm ds:tokens:build  # Rebuild tokens + variants
pnpm coldlight:generate  # Scanner → manifest
```

---

## Banned

- Direct `@melt-ui/svelte` imports outside `_internal/`
- Hand-written CSS outside `design/`
- Raw HTML when a ColdLight primitive exists
- `any` types
- jsdom testing
- References to deleted concepts: taxonomy/, catalog/, semantics/, molecules/, shortcodes/
