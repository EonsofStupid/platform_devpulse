# Research: dsAdapter Architecture Alignment

**Date**: 2026-03-02
**Sprint**: DSADAPTER-ALIGNMENT
**Status**: COMPLETE

---

## Question/Goal

Audit the entire ColdLight design system against the locked architecture spec. Identify every deviation from the four-layer architecture (primitives → builders → components → ui). Document what exists, what's wrong, and what needs to happen.

---

## Codebase Analysis

### What EXISTS and is CORRECT

| Layer | Path | Status | Details |
|-------|------|--------|---------|
| Tokens | `tokens/` | WORKING | SD5 pipeline, 3-tier, `pnpm ds:tokens:build` |
| Primitives | `primitives/{kind}/` | 87 exist | Structureless shells, `data-kind`/`data-slot`, zero ARIA applied, `...rest` spread |
| Primitive contracts | `primitives/{kind}/contract.ts` | 87 exist | Zod-validated, scanner reads them |
| Builder _internal | `api/adapters/coldlight/builders/` | CORRECT | Synced, SelectionState, mergeAttrs, builderMetadata, keyboard, extract, is |
| ColdLight builders | `api/adapters/coldlight/_internal/{kind}/factory.ts` | 55 exist | Class-based, MeltUI pattern, 1,286 tests passing |
| Builder tests | `api/adapters/coldlight/_internal/{kind}/{Kind}.test.ts` | Many exist | Vitest browser tests |
| MeltUI adapter | `api/adapters/meltui/` | Structure exists | For complex widgets (dialog, combobox, etc.) |
| Recipes | `recipes/` | 4+ exist | panel, dialog, combobox, tabs |
| Config | `config/coldlight/` | 10 fragments | Typed, orchestrator compiles |
| Scanner | `taxonomy/scanner.ts` | EXISTS | Config-driven, contract-aware |
| Manifest | `taxonomy/.generated/manifest.json` | EXISTS | VPB source of truth |
| resolveVisual() | `registry/resolve-visual.ts` | CORRECT | Universal prop resolution pipeline |
| useColdLight() | `components/_base/use-coldlight.svelte.ts` | CORRECT | Svelte 5 rune wrapper for resolveVisual |
| MeltUI dependency | `package.json` | DECLARED | `"melt": "^0.44.0"` — needs pnpm install if missing |

### What EXISTS but is WRONG

| Issue | Path | What's Wrong | Spec Says |
|-------|------|-------------|-----------|
| **Components have visual style** | `components/{kind}/` | useColdLight(), recipes, ColdLightProps, data-encoding baked into component .svelte files | Components = ARIA + state ONLY, ZERO visual style (Locked 2026-02-21) |
| **Components extend ColdLightProps** | `components/{kind}/types.ts` | types.ts files extend ColdLightProps (8-axis visual props) | ColdLightProps belong in [DELETED — no ui/ layer. Components ARE the styled final product], not component layer |
| **No ui/ layer** | `ui/` | Does not exist | [DELETED — no ui/ layer. Components ARE the styled final product] wraps components + applies recipes. What users import. |
| **ColdLight Layers in memory** | MEMORY.md | Listed 6 layers with "Components = Styled" | Four layers: primitives → builders → components (ARIA only) → ui (styled) |

### What DOES NOT EXIST

| Layer | Path | Status | Notes |
|-------|------|--------|-------|
| **[DELETED — components/{kind}/ IS the product]** | `ui/` | ZERO | The styled layer. Wraps component + recipe. Where ColdLightProps, useColdLight(), encoding belong. |
| **Per-component recipes** | `components/{kind}/recipe.ts` | Many exist BUT in wrong layer | Recipes should be consumed by [DELETED — no ui/ layer. Components ARE the styled final product], not component layer |
| **Complete test coverage** | Many primitives/components | Missing | Tests mandatory per spec |

---

## The Core Problem

The previous work ("gold standard" upgrade) put visual concerns in the WRONG LAYER.

### Architecture spec (LOCKED 2026-02-21):
```
primitives/  → Zero ARIA, zero style. Structureless shell.
components/  → ARIA computed from state. ZERO visual style.
ui/          → Component + recipe = styled. What users import.
```

### What was built:
```
primitives/  → Correct (zero ARIA, data-kind/data-slot)
components/  → WRONG: has useColdLight(), ColdLightProps, recipes, data-encoding
ui/          → Does not exist
```

Every single `components/{kind}/` folder has been contaminated with visual concerns that belong in `[DELETED — components/{kind}/ IS the product]`.

---

## Findings

### 1. The dsAdapter (builder system) IS real and correct
- 55 ColdLight-native builders exist at `api/adapters/coldlight/_internal/{kind}/`
- They follow MeltUI's exact pattern: class-based, Synced state, spread-able attribute objects
- _internal utilities (Synced, SelectionState, mergeAttrs, keyboard, etc.) are correct
- 1,286 tests passing per SPRINT-BUILDERS-REAUTHOR

### 2. The primitives ARE correct
- 87 primitives with `data-kind`/`data-slot`, zero ARIA applied, `...rest` spread
- Contracts exist alongside implementations

### 3. The component layer is WRONG
- Every component has visual concerns (useColdLight, recipes, ColdLightProps) that violate the locked architecture
- Components should ONLY wrap primitive + consume builder for ARIA
- Visual concerns belong in a ui/ layer that doesn't exist yet

### 4. MeltUI is declared but may need install
- `"melt": "^0.44.0"` in package.json
- May not be in node_modules (needs `pnpm install`)

### 5. Sprint files document the correct architecture
- SPRINT-COLD-BUILDERS.md — correct builder pattern
- SPRINT-BUILDERS-REAUTHOR.md — correct builder reauthor plan
- MASTER-PLAN.md — correct four-layer architecture
- ARCHITECTURE.md — correct layer descriptions
- All locked decisions align

---

## Recommendations

### Option A: Split components/ into components/ (ARIA) + ui/ (styled)
1. Strip visual concerns from every `components/{kind}/` .svelte and types.ts
2. Create `[DELETED — components/{kind}/ IS the product]` for each kind — move visual concerns there
3. [DELETED — no ui/ layer. Components ARE the styled final product] imports component, applies recipe + ColdLightProps

### Option B: Keep current structure, rename intent
- Accept that `components/` IS the styled layer
- This contradicts the locked decision from 2026-02-21

**Recommendation: Option A** — follow the locked spec. The architecture was locked for a reason.

---

## Files Referenced
- `MASTER-PLAN.md`: Authoritative architecture spec, four-layer model
- `.claude/ARCHITECTURE.md`: Quick reference, confirms three implementation layers
- `.claude/MASTER_SPRINT_PLAN.md`: Sprint sequence, locked terminology
- `components/.claude/MASTER_SPRINT_PLAN.md`: Component sprint plan
- `SPRINT-COLD-BUILDERS.md`: Builder system spec (50 ColdLight builders)
- `SPRINT-BUILDERS-REAUTHOR.md`: Builder reauthor plan (type precision fix)
- `.claude/ADAPTER_ARCHITECTURE.md`: dsAdapter = internal behavior provider
- `config/coldlight/adapters.cfg.ts`: ATTRIBUTES config (data-kind, data-slot, data-state)
- `api/adapters/coldlight/builders/`: Builder internals (_internal utilities)
- `registry/resolve-visual.ts`: resolveVisual() pipeline
- `components/_base/use-coldlight.svelte.ts`: useColdLight() rune
