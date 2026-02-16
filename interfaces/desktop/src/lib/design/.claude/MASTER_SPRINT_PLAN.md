# MASTER SPRINT PLAN — ColdLight Design System

> **The owner directs ColdLight. ColdLight directs everything.**
> **ColdLight OWNS everything by default. MeltUI is an exception-only adapter.**

---

## REALITY CHECK (2026-02-16)

### What EXISTS (real code, compiles)

| Layer | Path | Status |
|-------|------|--------|
| **Config** | `config/coldlight/` | 10 typed fragments, orchestrator compiles |
| **Config Type** | `config/coldlight/types.ts` | `ColdLightConfig` — full type with `as const satisfies` |
| **Config Orchestrator** | `coldlight.config.ts` | Single import, all fragments wired |
| **Taxonomy Contracts** | `taxonomy/kinds/primitives/` | **40 contracts** — Zod-validated, typed, complete |
| **Primitive Contract Schema** | `taxonomy/primitive/contract.ts` | `PrimitiveContractSchema` — Zod enforcement |
| **Component Contract Schema** | `taxonomy/component/contract.ts` | `ComponentContractSchema` + `validateComponentContract` |
| **Scanner** | `taxonomy/scanner.ts` | 446 lines — config-driven, contract-aware parity |
| **Registry** | `taxonomy/registry.ts` | Runtime manifest reader |
| **Vocabularies** | `config/coldlight/vocabularies.cfg.ts` | ARIA roles, attributes, states, keyboard keys, etc. |
| **Tokens SSOT** | `tokens/tokens.ts` | Tier 1 global values (OKLCH) |
| **Tokens Semantic** | `tokens/semantic.ts` | Tier 2 semantic aliases |
| **Tokens Components** | `tokens/components.ts` | Tier 3 component-scoped |
| **Tokens Schema** | `tokens/schema.ts` | Zod validators + cross-tier enforcement |
| **Tokens DTCG** | `tokens/tokens.json` | DTCG 1.0 interchange (generated) |
| **Tokens CSS** | `tokens/tokens.css` | CSS custom properties (generated) |
| **Vitest Config** | `vitest.config.ts` | Configured — Playwright browser, Chromium |
| **Recipes** | `recipes/` | 4 recipes (panel, dialog, combobox, tabs) |
| **Blueprints** | `blueprints/` | 4 blueprints (panel, dialog, combobox, tabs) |
| **Adapters** | `api/adapters/` | ColdLight dialog/tabs + MeltUI combobox transports |

### What DOES NOT EXIST (zero implementation)

| Layer | Path | Status |
|-------|------|--------|
| **Primitive Folders** | `primitives/{kind}/` | **ZERO** — only `types.ts` + `index.ts` stubs |
| **Component Folders** | `components/{kind}/` | **ZERO** — only shared types/schema/index |
| **Test Files** | `**/*.test.ts` | **ZERO** — vitest configured, no tests written |
| **Tokens Index** | `tokens/index.ts` | **STUBBED** — `export {}` |
| **Svelte Components** | `*.svelte` in primitives/ | **ZERO** — no actual components |

### Gap Summary

40 taxonomy contracts exist. Zero primitive folders. Zero component folders. Zero tests. Zero Svelte components.
**The foundation (config, types, contracts, scanner) is solid. The implementation layer is empty.**

---

## TECHNOLOGY STACK (Locked)

| Tech | Version | Purpose |
|------|---------|---------|
| Style Dictionary | **v5** | Token pipeline (DTCG 1.0 interchange) |
| Tailwind CSS | **v4** | @theme directive, utility classes from tokens |
| OKLCH | — | Color system (perceptually uniform) |
| Zod | **v4** | Schema validation at all boundaries |
| Vitest | — | Browser tests via `vitest-browser-svelte` + `@vitest/browser-playwright` |
| Playwright | — | Real Chromium browser (no jsdom) |
| Svelte | **5** | Runes ($state, $derived, $effect, $bindable) |
| SvelteKit | **5** | Framework |
| Tauri | **2.0** | Desktop shell |

---

## PRIMITIVE FOLDER STRUCTURE (Mandatory)

Every primitive MUST have a named folder under `primitives/{kind}/`:

```
primitives/{kind}/
├── {Name}.svelte          # Unstyled structural component
│                          # ColdLight-owned: renders native HTML + ARIA directly
│                          # Adapter-backed: consumes transport via context
├── types.ts               # Props interface (extends base, typed slots)
├── context.ts             # Symbol-keyed Svelte context (compound primitives only)
│                          # Pattern: const CTX_KEY = Symbol('{kind}');
│                          # Root: setContext(CTX_KEY, state)
│                          # Sub: getContext<T>(CTX_KEY)
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
│                          # Categories: ARIA, data-attributes, keyboard, focus, state
├── {Name}.test.svelte     # Test wrapper component (renders primitive for testing)
└── index.ts               # Barrel export (re-exports component + types)
```

### context.ts Pattern (Compound Primitives)

```typescript
// primitives/tabs/context.ts
import { getContext, setContext } from 'svelte';

const CTX_KEY = Symbol('tabs');

export interface TabsContext {
  activeTab: { value: string };
  orientation: 'horizontal' | 'vertical';
  // ... compound state shared between root and sub-components
}

export function setTabsContext(ctx: TabsContext) {
  setContext(CTX_KEY, ctx);
}

export function getTabsContext(): TabsContext {
  return getContext<TabsContext>(CTX_KEY);
}
```

---

## COMPONENT FOLDER STRUCTURE (Mandatory)

Every styled component MUST have a named folder under `components/{kind}/`:

```
components/{kind}/
├── {Name}.svelte          # Styled component (primitive + recipe)
├── types.ts               # Component props (extends primitive props + DsSurfaceProps)
├── schema.ts              # Zod contract (ComponentContractSchema, links to primitive)
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
│                          # Categories: schema validation, recipe application, props, slots
└── index.ts               # Barrel export
```

---

## TESTING REQUIREMENTS (Non-Negotiable)

### Primitive Tests ({Name}.test.ts)

Every primitive test MUST cover:

1. **ARIA Presence** — correct role, required attributes present
2. **Data Attributes** — `data-kind`, `data-slot`, `data-state` correct
3. **Keyboard Navigation** — all keys from contract.keyboard work
4. **Focus Management** — focus strategy from contract matches behavior
5. **State Management** — states transition correctly, data-state updates
6. **Accessibility** — screen reader compatibility, focus visible

### Component Tests ({Name}.test.ts)

Every component test MUST cover:

1. **Schema Validation** — ComponentContractSchema validates, primitive link verified
2. **Recipe Application** — correct CSS classes applied per recipe
3. **Prop Forwarding** — props pass through to underlying primitive
4. **Slot Rendering** — named slots render correctly

### Test Infrastructure

- `vitest.config.ts` — already configured with Playwright browser provider
- `vitest-browser-svelte` — already in setupFiles
- Browser: Chromium (headless for CI, headed for dev)
- Pattern: `import { render } from 'vitest-browser-svelte'`
- Assertions: `import { expect } from 'vitest'`

---

## SPRINT SEQUENCE

### Sprint 1: Token Pipeline Fix (SD5 + OKLCH + TW4)

**Goal:** Fix `ds-tokens-build.ts` to produce working CSS + Tailwind @theme from `tokens.cfg.ts`

**Blocked by:** Token → Tailwind gap (recipes produce class names that don't resolve)

Tasks:
- [ ] Fix `ds-tokens-build.ts` to read `tokens.cfg.ts` for all paths and mappings
- [ ] Generate proper Tailwind v4 @theme block from tokens
- [ ] Generate `tokens.json` DTCG 1.0 interchange
- [ ] Unify dual @theme blocks (app.css + tokens.css → one @theme in tokens.css)
- [ ] Verify recipe class names resolve (e.g., `bg-glass-void`, `shadow-z2`)
- [ ] Wire `tokens/index.ts` barrel export

**Deliverables:**
- `pnpm ds:tokens:build` produces working `tokens.css` with @theme block
- All recipe class names resolve in browser
- DTCG 1.0 `tokens.json` generated

---

### Sprint 2: First ColdLight-Owned Primitive — Button

**Goal:** Build one complete primitive + component end-to-end as the gold standard.

**Pre-existing:** `taxonomy/kinds/primitives/button/contract.ts` (exists, Zod-validated)

Tasks:
- [ ] Create `primitives/button/Button.svelte` — native `<button>`, ColdLight ARIA, data-* attributes
- [ ] Create `primitives/button/types.ts` — ButtonProps interface
- [ ] Create `primitives/button/index.ts` — barrel export
- [ ] Create `primitives/button/Button.test.ts` — ARIA, keyboard, focus, state tests
- [ ] Create `primitives/button/Button.test.svelte` — test wrapper
- [ ] Create `components/button/Button.svelte` — styled (primitive + recipe)
- [ ] Create `components/button/types.ts` — ButtonComponentProps
- [ ] Create `components/button/schema.ts` — ComponentContractSchema for button
- [ ] Create `components/button/Button.test.ts` — schema + recipe tests
- [ ] Create `components/button/index.ts` — barrel export
- [ ] Verify scanner parity passes
- [ ] Verify all tests pass in Chromium

**Deliverables:**
- One complete primitive + component visible in browser
- All tests passing
- Gold standard folder structure for every future primitive

---

### Sprint 3: ColdLight-Owned Primitives (Batch 1 — Structureless)

Build simple primitives that ColdLight owns directly:

- badge, label, separator, spinner, skeleton, progress, avatar, visually-hidden
- Each gets: primitive folder, component folder, tests

---

### Sprint 4: ColdLight-Owned Primitives (Batch 2 — Form Controls)

More complex ColdLight-owned:

- input, textarea, checkbox, switch, toggle, radio-group, slider
- Each uses context.ts for compound state where needed

---

### Sprint 5: ColdLight-Owned Primitives (Batch 3 — Compound)

Compound primitives with context.ts:

- accordion, collapsible, tabs, toolbar, breadcrumb, card, scroll-area
- Each has context.ts with Symbol-keyed context pattern

---

### Sprint 6: Adapter-Backed Primitives (Exception — Justified)

Complex widgets where MeltUI adapter is justified by ARIA complexity:

- dialog, alert-dialog, sheet, combobox, command, select, popover, tooltip
- Each has contract comment explaining WHY adapter is needed
- Each has adapter mapping in `api/adapters/meltui/_internal/{kind}/`

---

### Sprint 7: Testing Enforcement + CI

- Scanner flags missing test files for any primitive or component
- CI pipeline: `pnpm test` must pass with zero failures
- Schema validation tests for all 40 contracts
- Playwright E2E for critical user flows

---

## EXECUTION RULES

1. **Owner decides.** No sprint starts without owner approval.
2. **ColdLight-owned first.** Default `ariaStateProvider: "coldlight"` unless contract justifies "meltui".
3. **Contract first.** No primitive/component exists without a taxonomy contract.
4. **Tests mandatory.** No primitive is done without passing Vitest browser tests.
5. **Config-driven.** Scanner reads `coldlight.config.ts` for all paths and enforcement rules.
6. **Schema-validated.** Zod validates all contracts at build time.
7. **context.ts for compound.** Compound primitives use Symbol-keyed Svelte context.
8. **Named folders.** Every primitive and component gets a named folder matching the taxonomy kind.
9. **One at a time.** Build one primitive end-to-end before starting the next.
10. **Research → plan → execute.** Never touch code without a sprint document approved by the owner.

---

## COMPLETION CRITERIA

System is done when:

1. All 40 taxonomy contracts have matching primitive folders with tests
2. All primitives have matching component folders with tests
3. `pnpm test` passes with zero failures
4. Scanner parity check passes for all kinds
5. Token pipeline produces working CSS + DTCG + TypeScript
6. Recipe class names resolve in browser
7. At least one component visible and interactive in browser
