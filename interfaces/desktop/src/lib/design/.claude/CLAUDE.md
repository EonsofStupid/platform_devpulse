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
            ├── CSS via recipes, tokens, variants
            ├── Public API (what users import)
            └── MeltUI adapter (EXCEPTION ONLY — never the default)
```

---

## ARIA Ownership (CRITICAL)

**ColdLight OWNS ARIA by default.** The `engine` field in each schema determines who provides ARIA:

- `"coldlight"` (DEFAULT) — ColdLight builders handle ARIA. 60+ kinds.
- `"meltui"` (EXCEPTION) — MeltUI adapter handles ARIA. Only for complex ARIA patterns (dialog focus trap, combobox listbox). 20 kinds.

**ColdLight is ALWAYS the public API.** Users never import `@melt-ui/svelte`.

---

## Layer Architecture (LOCKED — 4 layers)

```
primitives/{kind}/  → STRUCTURELESS shells. Zero ARIA. data-kind + data-slot + HTML + ...rest spread.
components/{kind}/  → PRIMITIVE + BUILDER = ARIA-complete. ZERO VISUAL STYLE.
recipes/            → Styling patterns via registerRecipe() + DsSurfaceProps + getRecipe()
ui/{kind}/          → COMPONENT + RECIPE = STYLED. What users import.
```

---

## Contract Location

Contracts live in `primitives/{kind}/contract.ts`.
Zod-validated via `PrimitiveContractSchema.parse()`.
Scanner reads contracts → generates manifest.

---

## Adapter Architecture (dsAdapter)

```
api/dsadapters/
├── coldlight/_internal/{kind}/   → ColdLight builders (60+ kinds)
│   └── factory.ts                → Builder class with ARIA, state, handlers
├── meltui/_internal/{kind}/      → MeltUI adapters (20 kinds)
│   ├── factory.ts                → Wraps MeltUI builder
│   └── _transport/               → Maps MeltUI → ColdLight interface
└── resolve.ts                    → resolveAdapter(schema) dispatches by engine field
```

**AdapterResult** (universal — every adapter returns this):
```typescript
interface AdapterResult {
  states: Record<string, { get current(): boolean; set current(v: boolean) }>;
  attrs: Record<string, Record<string, string | undefined>>;
  handlers: Record<string, Record<string, (e: Event) => void>>;
  context?: Record<string, unknown>;
}
```

---

## Token Pipeline (8-axis)

- `registry/token-categories.ts` — SSOT for all 8 axes (s/z/d/b/g/f/m/t)
- Add a value → types auto-update. NO other code changes needed.
- `pnpm ds:tokens:build` → tokens.css, tailwind.css, variants.css, types.ts, manifest
- Encoding: `v-s3z1d2b1g0f1m0t2` or composable `v-s3 v-d2 v-t2`

---

## Preset System

- `registry/presets.ts` — 60+ named presets per kind
- `registry/resolve-visual.ts` — Pipeline: kind defaults → preset → props → encoding → ResolvedVisual

---

## When Adding a Primitive

1. Create contract: `primitives/{kind}/contract.ts`
2. Create primitive folder: `primitives/{kind}/` with `.svelte`, `types.ts`, `context.ts` (if compound), `.test.ts`, `index.ts`
3. If engine = "meltui" (EXCEPTION ONLY):
   - Create `api/dsadapters/meltui/_internal/{kind}/factory.ts`
   - Create `api/dsadapters/meltui/_internal/{kind}/_transport/`
4. Create component folder: `components/{kind}/`
5. Create centralized recipe: `recipes/components/{kind}/`
6. Register preset: `registry/presets.ts`
7. Run scanner, run tests

---

## Testing (Non-Negotiable)

- **Vitest browser tests** in real Chromium
- **No jsdom. No mocking DOM.**
- Every primitive: ARIA presence, data attributes, keyboard, focus, state
- Every component: schema validation, recipe application, prop forwarding

---

## Files to Read First

1. `MASTER-PLAN.md` — Canonical specification
2. `coldlight.config.ts` — Config orchestrator
3. `registry/token-categories.ts` — 8-axis encoding SSOT
4. `registry/presets.ts` — Named visual configs
5. `config/coldlight/types.ts` — ColdLightConfig type

---

## Banned

- Direct `@melt-ui/svelte` imports outside `_internal/`
- Hand-written CSS outside `design/`
- Raw HTML when a ColdLight primitive exists
- `any` types
- jsdom testing
- Primitives without tests
- Inline `recipe.ts` in component folders (use centralized `recipes/components/{kind}/`)
- References to deleted concepts: taxonomy/, catalog/, semantics/, molecules/, shortcodes/

---

YOU DO NOT EXECUTE A SINGLE LINE OF CODE WITHOUT A TRUE PLAN WRITTEN FIRST.
METHODICALLY AND ACTUALLY OFF THE CODEBASE. ZERO ASSUMPTIONS.
THAT PLAN ALLOWS YOU TO HAVE RESEARCH. YOU DO NOT GUESS.
THIS IS FOUNDATIONAL WORK.

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
