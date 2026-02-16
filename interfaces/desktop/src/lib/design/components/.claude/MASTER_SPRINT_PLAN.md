# MASTER SPRINT PLAN — ColdLight Components

> **ColdLight OWNS everything. MeltUI is an optional adapter, NOT the default.**
> **Every component is ColdLight-owned unless the contract explicitly justifies adapter delegation.**
> **The owner directs ColdLight. Config serves the owner.**

---

## REALITY CHECK (2026-02-16)

### What EXISTS

| Path | Status | Notes |
|------|--------|-------|
| `taxonomy/kinds/primitives/` | **40 contracts** | Zod-validated, typed, ARIA-complete |
| `taxonomy/component/` | Schema + contract + types | `ComponentContractSchema`, `validateComponentContract` |
| `taxonomy/primitive/contract.ts` | `PrimitiveContractSchema` | Zod enforcement, `parseContract()` |
| `taxonomy/scanner.ts` | 446 lines | Config-driven, contract-aware parity |
| `config/coldlight/` | **10 fragments** | All typed, `as const satisfies ColdLightConfig` |
| `coldlight.config.ts` | Orchestrator | Single import for all build tools |
| `tokens/tokens.ts` | Tier 1 SSOT | OKLCH colors, spacing, radius, etc. |
| `tokens/semantic.ts` | Tier 2 | Semantic aliases (surface, border, depth, transition) |
| `tokens/components.ts` | Tier 3 | Component-scoped (button, panel, input, badge, dialog, tooltip) |
| `tokens/tokens.json` | DTCG 1.0 | Generated interchange file |
| `vitest.config.ts` | Configured | Playwright browser provider, Chromium |

### What DOES NOT EXIST

| Path | Status | Notes |
|------|--------|-------|
| `primitives/{kind}/` | **ZERO folders** | Only `types.ts` + `index.ts` stubs at root |
| `components/{kind}/` | **ZERO folders** | Only shared types/schema/index at root |
| `**/*.test.ts` | **ZERO files** | Vitest configured, no tests written |
| `**/*.svelte` in primitives/ | **ZERO** | No actual Svelte components |

---

## TECHNOLOGY STACK

| Tech | Role | How It Fits |
|------|------|-------------|
| **Style Dictionary v5** | Token SSOT | Outputs CSS custom properties, DTCG JSON, TypeScript |
| **Tailwind v4** | Utility layer | Consumes tokens via @theme — CSS-first, no config file |
| **OKLCH** | Color system | Perceptually uniform, channel-separated for manipulation |
| **Zod v4** | Validation | Schema enforcement at all boundaries |
| **Vitest** | Unit/browser tests | `vitest-browser-svelte` + `@vitest/browser-playwright` |
| **Playwright** | Browser runtime | Real Chromium, no jsdom |
| **Svelte 5** | Components | Runes ($state, $derived, $effect, $bindable) |

### How They Connect

```
tokens.ts (SSOT — OKLCH values)
    ├── ds-tokens-build.ts reads tokens.cfg.ts
    │   ├── tokens.css (CSS custom properties + @theme block)
    │   ├── tokens.json (DTCG 1.0 interchange for SD5)
    │   └── types.ts (TypeScript unions + runtime arrays)
    │
    └── Tailwind v4 reads @theme from tokens.css
        └── Utilities: bg-glass-void, shadow-z2, rounded-md, etc.
            └── Components use utilities + recipe class strings
```

---

## OWNERSHIP MODEL

```
ColdLight (OWNER — DEFAULT for all new primitives)
├── Owns: ARIA attributes, focus, keyboard, state, data-* attributes
├── Owns: Component structure, slots, props, typing
├── Owns: CSS via tokens → Tailwind v4 utilities + recipes
├── Public API: what users import
└── ariaStateProvider: "coldlight" (DEFAULT)

MeltUI Adapter (EXCEPTION — justified per-contract only)
├── Used: ONLY for complex ARIA patterns ColdLight can't own directly
│   Examples: dialog focus trap, combobox listbox, floating positioning
├── Internal: never imported by user code
├── Transport: cloaked via api/adapters/meltui/_internal/
└── ariaStateProvider: "meltui" (must be justified in contract comment)
```

---

## PRIMITIVE FOLDER STRUCTURE (Mandatory)

```
primitives/{kind}/
├── {Name}.svelte          # Unstyled structural component
│                          # ColdLight-owned: renders native HTML + ARIA directly
│                          # Adapter-backed: consumes transport via context
├── types.ts               # Props interface (extends base, typed slots)
├── context.ts             # Symbol-keyed Svelte context (compound primitives)
│                          # Pattern:
│                          #   const CTX_KEY = Symbol('{kind}');
│                          #   export function set{Kind}Context(ctx) { setContext(CTX_KEY, ctx); }
│                          #   export function get{Kind}Context() { return getContext<T>(CTX_KEY); }
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
├── {Name}.test.svelte     # Test wrapper (renders primitive in isolation)
└── index.ts               # Barrel export
```

### When context.ts is Required

- **Compound primitives** where a root component shares state with sub-components
- Examples: Tabs (TabsRoot shares activeTab with TabsTrigger, TabsContent), Accordion, RadioGroup
- NON-compound primitives (Button, Badge, Separator) do NOT need context.ts

### context.ts Pattern

```typescript
// primitives/tabs/context.ts
import { getContext, setContext } from 'svelte';

const CTX_KEY = Symbol('tabs');

export interface TabsContext {
  activeTab: { value: string };        // Svelte 5 rune state
  orientation: 'horizontal' | 'vertical';
  onTabChange: (id: string) => void;
}

export function setTabsContext(ctx: TabsContext): void {
  setContext(CTX_KEY, ctx);
}

export function getTabsContext(): TabsContext {
  return getContext<TabsContext>(CTX_KEY);
}
```

---

## COMPONENT FOLDER STRUCTURE (Mandatory)

```
components/{kind}/
├── {Name}.svelte          # Styled component (primitive + recipe)
│                          # Consumes tokens via Tailwind v4 utilities
│                          # Gets recipe class strings from getRecipe().classes()
├── types.ts               # Component props (extends primitive props + DsSurfaceProps)
├── schema.ts              # Zod contract (ComponentContractSchema, links to primitive)
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
└── index.ts               # Barrel export
```

---

## TESTING (Non-Negotiable)

### Primitive Tests

Every primitive `{Name}.test.ts` MUST verify:

| Category | What to Test |
|----------|-------------|
| **ARIA Presence** | Correct `role`, required attributes from contract |
| **Data Attributes** | `data-kind="{kind}"`, `data-slot="{slot}"`, `data-state` values |
| **Keyboard** | Every key from `contract.keyboard` triggers correct behavior |
| **Focus** | `contract.focusStrategy` matches actual behavior (trap, roving, etc.) |
| **State** | States from `contract.states` transition correctly |
| **A11y** | Screen reader labels, focus-visible ring, no keyboard traps |

### Component Tests

Every component `{Name}.test.ts` MUST verify:

| Category | What to Test |
|----------|-------------|
| **Schema** | `ComponentContractSchema.parse()` succeeds, primitive link valid |
| **Recipe** | Correct CSS classes applied per recipe variant |
| **Props** | Props forward to underlying primitive correctly |
| **Slots** | Named slots render children correctly |

### Test File Pattern

```typescript
// primitives/button/Button.test.ts
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ButtonTest from './Button.test.svelte';

describe('Button primitive', () => {
  describe('ARIA', () => {
    it('renders with role="button"', async () => {
      const { getByRole } = render(ButtonTest);
      expect(getByRole('button')).toBeTruthy();
    });

    it('supports aria-pressed for toggle buttons', async () => {
      const { getByRole } = render(ButtonTest, { props: { pressed: true } });
      expect(getByRole('button').getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('Data attributes', () => {
    it('has data-kind="button"', async () => {
      const { getByRole } = render(ButtonTest);
      expect(getByRole('button').getAttribute('data-kind')).toBe('button');
    });

    it('has data-slot="root"', async () => {
      const { getByRole } = render(ButtonTest);
      expect(getByRole('button').getAttribute('data-slot')).toBe('root');
    });
  });

  describe('Keyboard', () => {
    it('activates on Enter', async () => { /* ... */ });
    it('activates on Space', async () => { /* ... */ });
  });

  describe('State', () => {
    it('shows data-state="disabled" when disabled', async () => { /* ... */ });
    it('shows data-state="loading" when loading', async () => { /* ... */ });
  });
});
```

---

## SPRINT SEQUENCE

### Sprint 1: Token Pipeline Fix (SD5 → TW4)

Fix `ds-tokens-build.ts` so token CSS + Tailwind @theme actually works.

- [ ] Build script reads `tokens.cfg.ts` for paths + mappings
- [ ] Generates @theme block that Tailwind v4 consumes
- [ ] Recipe class names (`bg-glass-void`, `shadow-z2`) resolve in browser
- [ ] DTCG 1.0 `tokens.json` generated correctly
- [ ] `tokens/index.ts` wired as proper barrel export

### Sprint 2: Button — Gold Standard Primitive

Build Button end-to-end as the template for all future primitives.

- [ ] `primitives/button/Button.svelte` — native `<button>`, ColdLight ARIA
- [ ] `primitives/button/types.ts` — `ButtonProps` interface
- [ ] `primitives/button/Button.test.ts` — ARIA, keyboard, focus, state, a11y
- [ ] `primitives/button/Button.test.svelte` — test wrapper
- [ ] `primitives/button/index.ts` — barrel
- [ ] `components/button/Button.svelte` — styled (primitive + recipe + TW4)
- [ ] `components/button/types.ts` — `ButtonComponentProps`
- [ ] `components/button/schema.ts` — `ComponentContractSchema` linked to primitive
- [ ] `components/button/Button.test.ts` — schema + recipe tests
- [ ] `components/button/index.ts` — barrel
- [ ] Scanner parity passes
- [ ] All tests pass in Chromium

### Sprint 3: Batch 1 — Simple ColdLight-Owned

badge, label, separator, spinner, skeleton, progress, avatar, visually-hidden

### Sprint 4: Batch 2 — Form Controls

input, textarea, checkbox, switch, toggle, radio-group, slider

### Sprint 5: Batch 3 — Compound (with context.ts)

accordion, collapsible, tabs, toolbar, breadcrumb, card, scroll-area

### Sprint 6: Adapter-Backed (Justified Exceptions)

dialog, alert-dialog, sheet, combobox, command, select, popover, tooltip

### Sprint 7: Testing Enforcement + CI

Scanner flags missing tests, CI enforces zero failures, Playwright E2E

---

## EXECUTION RULES

1. **Owner decides.** No sprint starts without owner approval.
2. **ColdLight-owned first.** `ariaStateProvider: "coldlight"` unless contract justifies "meltui".
3. **Contract first.** No primitive/component exists without a taxonomy contract.
4. **Tests mandatory.** No primitive is done without passing Vitest browser tests.
5. **Config-driven.** Scanner reads `coldlight.config.ts`. Zero hardcoded paths.
6. **Schema-validated.** Zod validates all contracts.
7. **context.ts for compound.** Symbol-keyed Svelte context pattern.
8. **Named folders.** Every primitive and component gets a named folder.
9. **SD5 → TW4.** Tokens are SSOT, Tailwind consumes via @theme.
10. **OKLCH everywhere.** No hex, no HSL, no RGB outside tokens.ts.
