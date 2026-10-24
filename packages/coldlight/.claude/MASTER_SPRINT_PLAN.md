# MASTER SPRINT PLAN — ColdLight Design System

> **The owner directs ColdLight. ColdLight directs everything.**
> **ColdLight OWNS everything .**

---

## TERMINOLOGY (LOCKED — from CLAUDE.md)

| Layer | What | Code? |
|-------|------|-------|
| Tokens | Design tokens (SD5 pipeline, DTCG 1.0, 3-tier) | JSON / CSS |
| Recipes | CSS appearance rules | CSS classes |
| Primitives | ColdLight-owned ARIA + behavior (WAI-ARIA APG) | Svelte 5 |
| **Semantics** | Primitive + Recipe = Styled | Svelte |
| Blueprints | Prebuilt assembly | TypeScript |
| Patterns | Guidance only | Docs |
| Blocks | VPB runtime payload | JSON |

**SEMANTICS = Primitive + Recipe. ARIA lives in primitives (ColdLight-owned, WAI-ARIA APG). NO separate ARIA contract in semantics.**

**"catalog" NOT "taxonomy". "semantics" NOT "components".**

---

## REALITY CHECK (2026-02-17)

### What EXISTS

| Layer | Path | Status |
|-------|------|--------|
| Config | `config/coldlight/` | 10 typed fragments, orchestrator compiles |
| Tokens SSOT | `tokens/tokens.ts` | Tier 1 global values (OKLCH) |
| Tokens Semantic | `tokens/semantic.ts` | Tier 2 semantic aliases |
| Tokens Component | `tokens/components.ts` | Tier 3 component-scoped |
| Tokens CSS | `tokens/tokens.css` | Generated CSS + @theme block |
| Tokens Schema | `tokens/schema.ts` | Zod validators |
| Tokens DTCG | `tokens/tokens.json` | DTCG 1.0 interchange |
| Build Script | `scripts/dev/design/ds-tokens-build.ts` | Generates CSS + types + preset |
| Molecules | `molecules/*.css` | glass, depth, glow, bevel — RENDER |
| Recipes | `recipes/` | 4 recipes (panel, dialog, combobox, tabs) |
| Recipe Utils | `recipes/utils.ts` | Token → Tailwind class maps |
| Blueprints | `blueprints/` | 4 blueprints |
| Adapters | `api/adapters/` | ColdLight dialog/tabs + MeltUI combobox |
| Catalog VPB | `catalog/vpb/` | Block kinds, contracts, slots |
| Catalog Primitives | `catalog/kinds/primitives/button/` | Button contract |
| Primitives | `primitives/button/` | Button.svelte — needs ColdLight-owned ARIA |

### What DOES NOT EXIST

| Layer | Path | Status |
|-------|------|--------|
| Primitives | `primitives/{kind}/` | Only button exists — need 40+ |
| Semantics | `semantics/{kind}/` | **ZERO** — folder doesn't exist |
| Tests | `**/*.test.ts` | **ZERO** |
| Token barrel | `tokens/index.ts` | Stubbed |
| Working pipeline | tokens → Tailwind → render | Not verified end-to-end |

---

## SPRINT 1: Token Pipeline (UNBLOCKS EVERYTHING)

**Goal:** Verify `ds-tokens-build.ts` produces working CSS, recipe class names resolve in Tailwind v4, and one component renders visually in the browser.

Tasks:
- [ ] Run `pnpm ds:tokens:build` — verify it completes
- [ ] Verify `tokens.css` @theme block has all token mappings
- [ ] Verify molecule classes resolve (`glass-void`, `depth-raised`, `glow-teal`)
- [ ] Verify recipe utility classes resolve (`rounded-lg`, `bg-glass-void`)
- [ ] Wire `tokens/index.ts` barrel export
- [ ] Run `pnpm dev` — verify no CSS errors in browser console
- [ ] Render one Panel with `glass-void` recipe — verify it's visible

**Deliverable:** One styled panel visible in browser. Token pipeline confirmed working.

---

## SPRINT 2: ColdLight-Owned Primitives (ALL 40)

**Goal:** Every primitive kind gets a named folder under `primitives/` with ColdLight-owned `.svelte` + `types.ts` + `context.ts` (if compound) + `index.ts`. Primitives OWN their ARIA via WAI-ARIA APG patterns.

**Pattern (LOCKED):**
```
primitives/{kind}/
├── {Name}.svelte       ← ColdLight-owned: data-kind, data-slot, ARIA, keyboard, focus
├── {Name}{Sub}.svelte  ← Sub-components (compound primitives only)
├── types.ts            ← Props interface extending HTML element + BaseProps
├── context.ts          ← setContext/getContext (compound primitives only)
└── index.ts            ← Barrel export
```

**Rules:**
- ColdLight OWNS ARIA. Primitives set `role`, `aria-*`, `tabindex`, keyboard handlers, focus management directly.
- WAI-ARIA APG patterns — follow W3C authoring practices for each widget type.
- Svelte 5 runes only — `$state`, `$derived`, `$effect`, `$bindable`, `$props()`.
- Zero styling. Styling comes from recipe layer via semantics.
- Each primitive renders the correct semantic HTML element.
- `data-kind="{kind}"` and `data-slot="root"` on every root element.
- `data-state` reflects current state for recipe CSS selectors.
- Compound primitives use `setContext`/`getContext` with getter function for reactivity.
- dsAdapter (Melt UI) is EXCEPTION ONLY — justified by ARIA complexity comment in contract.

Tasks:
- [ ] Build all 40 primitive folders following WORKFLOW.md specification
- [ ] Each with correct HTML element, ARIA roles, keyboard handlers
- [ ] Compound primitives with context pattern (accordion, tabs, dialog, etc.)
- [ ] `pnpm svelte-check` passes with zero errors
- [ ] All primitives importable from `primitives/{kind}/index.ts`

**Deliverable:** 40 ColdLight-owned ARIA primitives that compile.

---

## SPRINT 3: Semantics Layer (Primitive + Recipe)

**Goal:** Create `semantics/` folder. Each semantic is a primitive + recipe = styled component.

**Pattern (LOCKED):**
```
semantics/{kind}/
├── {Name}.svelte       ← Imports primitive, applies recipe classes
├── types.ts            ← Semantic props (extends primitive + DsSurfaceProps)
└── index.ts            ← Barrel export (PUBLIC API — users import from here)
```

**Rules:**
- Semantics are what users import. Never primitives directly.
- Each semantic wraps a primitive and applies recipe classes.
- NO ARIA contracts. NO validation schemas. Just primitive + recipe.

Tasks:
- [ ] Create `semantics/` folder structure
- [ ] Build first semantic: `semantics/button/Button.svelte`
- [ ] Build panel, dialog, tabs, combobox semantics (recipes exist)
- [ ] Each semantic renders with visible styling in browser
- [ ] `pnpm svelte-check` passes

**Deliverable:** Styled components visible in browser.

---

## SPRINT 4: Tests

**Goal:** Vitest browser tests for primitives and semantics.

Tasks:
- [ ] Primitive tests: data attributes present, correct HTML element
- [ ] Semantic tests: recipe classes applied, props forwarded
- [ ] `pnpm test:browser` passes

**Deliverable:** Test coverage for all primitives and semantics.

---

## SPRINT 5: Catalog Alignment

**Goal:** Fix catalog/ imports (already renamed from taxonomy/). Fix all import paths. Scanner works.

Tasks:
- [x] Rename `taxonomy/` → `catalog/` (folder) — DONE
- [ ] Update ALL import paths across codebase (currently broken)
- [ ] Delete `kinds/component/` (wrong layer — semantics don't need ARIA contracts)
- [ ] Rebuild catalog/types.ts, scanner.ts, registry.ts for new architecture
- [ ] Update config roots to reference catalog
- [ ] `pnpm svelte-check` passes with zero errors

**Deliverable:** Clean catalog folder, all imports resolved, zero errors.

---

## SPRINT 6: Remaining Semantics + Blueprints

**Goal:** Build semantics for all 40 kinds. Wire blueprints.

Tasks:
- [ ] Semantics for all primitive kinds
- [ ] Blueprints reference semantics (not components)
- [ ] VPB blocks can render semantics

**Deliverable:** Full design system usable end-to-end.

---

## EXECUTION RULES

1. **Owner decides.** No sprint starts without owner approval.
2. **TERMINOLOGY.md vocabulary is LAW.** Semantics not components. Catalog not taxonomy.
3. **Build first, validate later.** Get .svelte files rendering before writing contracts.
4. **Test in browser.** If it doesn't render, it doesn't exist.
5. **One at a time.** Complete each sprint before starting next.
6. **No architecture astronautics.** No contracts for things that don't exist yet.
