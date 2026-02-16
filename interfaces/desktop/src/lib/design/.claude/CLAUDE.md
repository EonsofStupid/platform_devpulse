# Claude Instructions for ColdLight

> **Read this first when working on ColdLight.**
> **The owner is in charge. ColdLight serves the owner's vision. Config serves the owner.**

---

## The One Rule

**Taxonomy is truth. Config drives everything. The owner decides.**

---

## Ownership Hierarchy

```
OWNER (human) — supreme authority
  └── coldlight.config.ts — the owner's instrument of control
       └── ColdLight — owns EVERYTHING by default
            ├── ARIA attributes, focus, keyboard, state
            ├── Component structure, slots, props, typing
            ├── CSS via recipes, tokens, molecules
            ├── Public API (what users import)
            └── MeltUI adapter (EXCEPTION ONLY — never the default)
```

---

## ARIA Ownership (CRITICAL)

**ColdLight OWNS ARIA by default.** The `ariaStateProvider` in each contract determines who provides ARIA:

- `"coldlight"` (DEFAULT) — ColdLight handles ARIA directly on native HTML elements. The primitive renders `<button>`, `<input>`, etc. with ARIA attributes set by ColdLight. No adapter needed. 2-folder parity.
- `"meltui"` (EXCEPTION) — MeltUI adapter handles ARIA through transport chain. Only for complex ARIA patterns (dialog focus trap, combobox listbox). Must be justified in the contract. 3-folder parity.

**ColdLight is ALWAYS the public API regardless of archetype.** Users never import `@melt-ui/svelte`.

---

## Contract Chain

```
taxonomy/kinds/primitives/{kind}/contract.ts   <- SSOT (Zod-validated)
           |
     +-----+-----+
     |           |
     v           v (only if ariaStateProvider: "meltui")
primitives/     api/adapters/meltui/
{kind}/         _internal/{kind}/
     |
     v
components/     <- Styled component (primitive + recipe)
{kind}/
```

- Config declares dsAdapter
- Contract declares ariaStateProvider
- Folder name = kind name = binding
- No separate adapter-kind contracts

---

## Primitive Folder Structure (ColdLight-Owned)

```
primitives/{kind}/
├── {Name}.svelte          # Unstyled component, ColdLight ARIA
├── types.ts               # Props interface
├── context.ts             # Symbol-keyed Svelte context (if compound)
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
├── {Name}.test.svelte     # Test wrapper component
└── index.ts               # Barrel export
```

## Component Folder Structure

```
components/{kind}/
├── {Name}.svelte          # Styled component (primitive + recipe)
├── types.ts               # Component props (extends primitive + surface)
├── schema.ts              # Zod contract (links to primitive contract)
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
└── index.ts               # Barrel export
```

---

## Testing (Non-Negotiable)

- **Vitest browser tests** in real Chromium via `vitest-browser-svelte` + `@vitest/browser-playwright`
- **No jsdom. No mocking DOM.**
- Every primitive: ARIA presence, data attributes, keyboard navigation, focus management, state
- Every component: schema validation, recipe application, prop forwarding, slot rendering
- Scanner flags missing test files
- CI enforces zero test failures

---

## Token Pipeline

- **Style Dictionary v5** — `tokens.ts` (SSOT) → SD5 build → DTCG 1.0 + CSS + TypeScript
- **OKLCH** color system — channel-separated for programmatic manipulation
- **3-tier** — Global → Semantic → Component tokens, Zod-validated cross-tier
- **Tailwind v4** @theme — tokens map to TW4 utility namespaces via `tokens.cfg.ts`
- **Config-driven** — `coldlight.config.ts` → `tokens.cfg.ts` declares everything

---

## When Adding a Primitive

1. Declare contract: `taxonomy/kinds/primitives/{kind}/contract.ts` + `types.ts` + `index.ts`
2. Create primitive folder: `primitives/{kind}/` with `.svelte`, `types.ts`, `context.ts` (if compound), `.test.ts`, `index.ts`
3. If ariaStateProvider = "meltui" (EXCEPTION ONLY):
   - Verify kind in `taxonomy/api/adapter/meltui/contract.ts`
   - Create `api/adapters/meltui/_internal/{kind}/factory.ts`
4. Create component folder: `components/{kind}/` with `.svelte`, `types.ts`, `schema.ts`, `.test.ts`, `index.ts`
5. Run scanner to validate parity
6. Run tests — must pass

---

## When Editing Contracts

Contracts live ONLY in `taxonomy/kinds/primitives/{kind}/`.
Zod-validated via `PrimitiveContractSchema.parse()`.
Scanner calls `.parse()` — invalid contracts fail hard.

---

## Files to Read First

1. `MASTER-PLAN.md` — Canonical specification (Foundation Requirements are NON-NEGOTIABLE)
2. `coldlight.config.ts` — THE config orchestrator
3. `taxonomy/primitive/contract.ts` — PrimitiveContractSchema (Zod enforcement)
4. `taxonomy/scanner.ts` — Config-driven parity checker
5. `config/coldlight/types.ts` — ColdLightConfig type

---

## Banned

- Direct `@melt-ui/svelte` imports outside `_internal/`
- Hand-written CSS outside `design/`
- Raw HTML when a ColdLight primitive exists
- `any` types
- jsdom testing
- Primitives without tests
- Components without named folders
- Tokens without Zod validation

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
