# SPRINT: ColdLight Builders — Native Builder System

> **Sprint**: COLD-BUILDERS
> **Date**: 2026-02-25
> **Status**: PLANNING
> **Prerequisite**: All 17 MeltUI transport adapters passing svelte-check (DONE)

---

## 1. WHAT THIS IS

ColdLight-native builders for the **50 primitives that MeltUI does not cover**.

MeltUI covers 29 complex widgets (accordion, combobox, dialog, etc.). Those stay as-is — we use melt for what melt does. But 50 primitives have `ariaStateProvider: "coldlight"` in their contracts and **no builder from either side**. These need ColdLight-owned builders that follow melt's exact architectural patterns.

**Why not just inline ARIA in components?**
- Components become untestable behavior blobs
- VPB cannot introspect builder capabilities at runtime
- No shared state management patterns (selection, focus, controlled/uncontrolled)
- No reuse — every component re-invents the wheel

**Why mirror melt's patterns?**
- Proven architecture (class-based, headless, spread-able attribute objects)
- Consistent mental model for any developer reading the codebase
- Our existing tooling (scanner, inventory, manifest) already expects this shape
- When melt adds a builder for something we built, migration is trivial

---

## 2. WHERE IT LIVES

```
src/lib/design/                     ← ColdLight design root (SSOT)
├── primitives/                     ← Layer 1: structural shells
├── builders/                       ← Layer 2: ARIA + behavior (NEW)
│   ├── _internal/                  ← Shared foundational utilities
│   │   ├── synced.svelte.ts        ← Controlled/uncontrolled state wrapper
│   │   ├── selection-state.svelte.ts ← Single/multi-select state machine
│   │   ├── merge-attrs.ts          ← Attribute object composition
│   │   ├── builder-metadata.ts     ← data-cl-* attribute + ID factories
│   │   ├── types.ts                ← MaybeGetter, SlotAttrs, BuilderProps base
│   │   ├── extract.ts              ← MaybeGetter → value resolution
│   │   ├── keyboard.ts             ← kbd constants + directional key helpers
│   │   ├── is.ts                   ← Type guards (isFunction, isGetter, etc.)
│   │   └── index.ts                ← Barrel
│   │
│   ├── {kind}/                     ← One folder per builder
│   │   ├── factory.ts              ← THE builder. Class + create function.
│   │   ├── types.ts                ← Props, states, slot attr shapes
│   │   ├── index.ts                ← Barrel
│   │   └── {Kind}.test.ts          ← Vitest browser test
│   │
│   └── index.ts                    ← Master barrel: re-exports all builders
├── recipes/                        ← Layer 3: styling patterns
├── components/                     ← Layer 4: primitives + builders + recipes
├── tokens/                         ← SD5 pipeline
├── api/adapters/                   ← External adapter cloaking (meltui)
└── coldlight.config.ts             ← Config drives everything
```

Alias: `$lib/design/builders/` — resolves via SvelteKit `$lib`.

**No `_transport/` layer.** These builders ARE ColdLight. They return `SlotAttrs` natively. No translation needed.

**No `.svelte.ts` files at the builder level.** Builders use `factory.ts` following melt's convention. The `_internal/` utilities that need Svelte runes use `.svelte.ts` (Synced, SelectionState).

---

## 3. COLDLIGHT CONFIG INTEGRATION

`coldlight.config.ts` needs a new root:

```typescript
// roots.cfg.ts — add:
buildersRoot: "src/lib/design/builders",
```

`adapters.cfg.ts` already declares `ariaStateProvider: "coldlight"` as default. Builders are the implementation of that declaration.

Scanner (`platform-scanner.ts`) completeness check per builder:
```
hasFactory + hasTypes + hasIndex + hasTest = Complete
```

---

## 4. FOUNDATIONAL UTILITIES (`_internal/`)

These are ColdLight equivalents of melt's internal utilities. Every builder composes from these. They are the foundation — built and tested FIRST before any individual builder.

### 4.1 `synced.svelte.ts` — Controlled/Uncontrolled State

Melt's `Synced<T>` is the core state primitive. Every builder wraps its main state in it.

**What it does:**
- If config passes a **getter function** → reads from getter every time (controlled)
- If config passes a **static value** → stores in internal `$state` (uncontrolled)
- When `current` is set, calls `onChange` callback
- Optional `equalityCheck` to prevent unnecessary updates

**Public API:**
```typescript
export class Synced<T> {
    constructor(args: {
        value: MaybeGetter<T | undefined>;
        onChange?: (value: T) => void;
        defaultValue: T;
        equalityCheck?: (a: T, b: T) => boolean;
    });
    get current(): T;
    set current(value: T);
}
```

**Why this matters:** Without Synced, every builder manually implements controlled/uncontrolled logic. With it, state management is one line: `#value = new Synced({ value: props.value, onChange: props.onValueChange, defaultValue: false })`.

### 4.2 `selection-state.svelte.ts` — Single/Multi-Select

Melt's `SelectionState<T, Multiple>` manages selection for any builder that has selectable items.

**What it does:**
- Type branches: `Multiple extends true ? SvelteSet<T> : T | undefined`
- Single-select: get/set value directly
- Multi-select: add, delete, toggle, clear, has, toArray, toSet
- Fires onChange on every mutation

**Public API:**
```typescript
export class SelectionState<T, Multiple extends boolean = false> {
    constructor(props: {
        value?: MaybeMultiple<T, Multiple>;
        onChange?: OnMultipleChange<T, Multiple>;
        multiple?: Multiple;
    });
    get current(): Multiple extends true ? SvelteSet<T> : T | undefined;
    has(item: T): boolean;
    add(value: T): void;
    delete(value: T): void;
    toggle(item: T): void;
    clear(): void;
    toArray(): T[];
}
```

**Used by:** toggle-group, toolbar, data-table, any builder with selectable items.

### 4.3 `merge-attrs.ts` — Attribute Object Composition

Melt's `mergeAttrs` composes multiple attribute objects with smart handling.

**What it does:**
- Merges N attribute objects into one
- **Chains event handlers**: if two objects both have `onclick`, both fire
- Chains `class` strings (space-separated)
- Merges `style` objects/strings
- Last-wins for all other attributes

**Public API:**
```typescript
export function mergeAttrs(
    ...args: Record<string, unknown>[]
): Record<string, unknown>;
```

**Why this matters:** Components need to spread builder attrs AND add their own handlers. Without mergeAttrs, event handlers get silently overwritten.

### 4.4 `builder-metadata.ts` — Data Attributes + IDs

Melt's `createBuilderMetadata` generates consistent `data-melt-*` attributes. Ours generates `data-cl-*`.

**What it does:**
- Given a builder name and slot names, produces:
  - `dataAttrs`: `{ trigger: "data-cl-toggle-group-trigger", item: "data-cl-toggle-group-item" }`
  - `dataSelectors`: `{ trigger: "[data-cl-toggle-group-trigger]" }` (for CSS and tests)
  - `createIds()`: `{ trigger: "cl-tg-a3x9", item: "cl-tg-b7k2" }` (unique per instance)
- Prefix is `cl` (cold light), not `melt`

**Public API:**
```typescript
export function createBuilderMetadata<
    Name extends string,
    Parts extends readonly string[],
>(name: Name, parts: Parts): {
    dataAttrs: Record<Parts[number], string>;
    dataSelectors: Record<Parts[number], string>;
    createIds: () => Record<Parts[number], string>;
};
```

### 4.5 `roving-focus.svelte.ts` — Roving Tabindex

Shared keyboard navigation for any builder with focusable children (toggle-group, toolbar, radio-group pattern).

**What it does:**
- Manages tabindex: active item = 0, rest = -1
- Arrow key navigation (orientation-aware)
- Home/End
- Loop option
- Skips disabled items
- `$effect`-based: reacts to DOM changes

**Public API:**
```typescript
export class RovingFocus {
    constructor(config: {
        orientation?: MaybeGetter<"horizontal" | "vertical">;
        loop?: MaybeGetter<boolean>;
        selector?: string; // default: '[data-roving-item]:not([data-disabled])'
    });
    /** Get attrs for a focusable item */
    getItemAttrs(value: string, active: boolean): SlotAttrs;
    /** Handle keydown on the container */
    handleKeydown(e: KeyboardEvent, container: HTMLElement): void;
    /** Focus a specific item by value */
    focus(container: HTMLElement, value: string): void;
}
```

### 4.6 `typeahead.svelte.ts` — Character Match

Shared typeahead search for builders with text-matchable items.

**What it does:**
- Accumulates typed characters over a timeout window
- Finds first matching item by text content
- Resets search string after timeout

**Public API:**
```typescript
export class Typeahead {
    constructor(config?: { timeout?: MaybeGetter<number> });
    /** Process a character keypress. Returns matching element or null. */
    handle(char: string, candidates: HTMLElement[]): HTMLElement | null;
    /** Reset search state. */
    reset(): void;
}
```

### 4.7 `types.ts` — Shared Types

```typescript
/** Value or getter — reactive when getter, static when value */
export type MaybeGetter<T> = T | (() => T);

/** Extract value from MaybeGetter */
export function extract<T>(value: MaybeGetter<T>): T;
export function extract<T>(value: MaybeGetter<T | undefined>, fallback: T): T;

/** Slot attribute object — spread onto element */
export type SlotAttrs = Record<string, unknown>;

/** Standard data-state values */
export type DataState = "on" | "off" | "active" | "inactive" | "open" | "closed";

/** Data attribute helpers */
export function dataAttr(value: boolean): "" | undefined;
export function disabledAttr(value?: boolean): true | undefined;
```

### 4.8 `extract.ts` — MaybeGetter Resolution

Separate file for the extract function (tree-shakeable):

```typescript
export function extract<T>(value: MaybeGetter<T | undefined>, fallback?: T): T | undefined {
    const v = typeof value === "function" ? (value as () => T)() : value;
    return v ?? fallback;
}
```

---

## 5. INDIVIDUAL BUILDER PATTERN

Every builder folder has exactly 3 files + 1 test:

```
builders/{kind}/
├── factory.ts       ← Class definition + createX() factory function
├── types.ts         ← Props interface, state types, slot attr shapes
├── index.ts         ← Barrel
└── {Kind}.test.ts   ← Vitest browser test
```

### 5.1 `types.ts` — Contract

```typescript
/**
 * @file builders/{kind}/types.ts
 * @package @devpulse/coldlight
 *
 * Props, states, and slot shapes for the {Kind} builder.
 * WAI-ARIA APG: {link}
 */

import type { MaybeGetter, SlotAttrs } from "../_internal/types.js";

/** Constructor config. MaybeGetter for controlled/uncontrolled. */
export interface {Kind}Props {
    value?: MaybeGetter<boolean>;
    onValueChange?: (value: boolean) => void;
    disabled?: MaybeGetter<boolean>;
    // ... kind-specific props
}

/** Reactive state exposed by the builder. */
export interface {Kind}State {
    readonly value: boolean;
    readonly disabled: boolean;
}

/** For compound builders: item metadata. */
export interface {Kind}ItemMeta {
    value: string;
    disabled?: boolean;
}
```

### 5.2 `factory.ts` — The Builder

```typescript
/**
 * @file builders/{kind}/factory.ts
 * @package @devpulse/coldlight
 *
 * ColdLight {Kind} builder — Svelte 5 runes-native.
 *
 * Owns all ARIA semantics: {roles}.
 * Keyboard: {keys}.
 *
 * WAI-ARIA APG: {link}
 */

import { Synced } from "../_internal/synced.svelte.js";
import { createBuilderMetadata, type SlotAttrs } from "../_internal/index.js";
import type { {Kind}Props, {Kind}ItemMeta } from "./types.js";

const metadata = createBuilderMetadata("{kind}", ["root", "item"] as const);

export class {Kind} {
    #props: {Kind}Props;
    #value: Synced<boolean>;
    ids: ReturnType<typeof metadata.createIds>;

    constructor(props: {Kind}Props = {}) {
        this.#props = props;
        this.#value = new Synced({
            value: props.value,
            onChange: props.onValueChange,
            defaultValue: false,
        });
        this.ids = metadata.createIds();
    }

    // --- State ---
    get value(): boolean { return this.#value.current; }
    set value(v: boolean) { this.#value.current = v; }

    // --- Element attribute getters (spread onto HTML) ---
    get root(): SlotAttrs {
        return {
            [metadata.dataAttrs.root]: "",
            role: "group",
            // ... ARIA attrs
        };
    }

    // --- Item factory (for compound builders) ---
    getItem(meta: {Kind}ItemMeta): SlotAttrs {
        return {
            [metadata.dataAttrs.item]: "",
            id: `${this.ids.item}-${meta.value}`,
            "data-value": meta.value,
            // ... per-item ARIA
        };
    }
}

/** Factory function — preferred API for transport layer consumers. */
export function create{Kind}(props?: {Kind}Props): {Kind} {
    return new {Kind}(props);
}
```

### 5.3 `index.ts` — Barrel

```typescript
/**
 * @file builders/{kind}/index.ts
 * @package @devpulse/coldlight
 */

export { {Kind}, create{Kind} } from "./factory.js";
export type { {Kind}Props, {Kind}State, {Kind}ItemMeta } from "./types.js";
```

### 5.4 `{Kind}.test.ts` — Vitest Browser Test

```typescript
/**
 * @file builders/{kind}/{Kind}.test.ts
 * @package @devpulse/coldlight
 *
 * Tests: ARIA attributes, keyboard interaction, state management.
 * Runs in real Chromium via @vitest/browser-playwright.
 */

import { describe, it, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import { {Kind} } from "./factory.js";

describe("{Kind} builder", () => {
    it("returns correct ARIA attributes on root", () => {
        const builder = new {Kind}();
        const root = builder.root;
        expect(root.role).toBe("{expected_role}");
        expect(root["data-cl-{kind}-root"]).toBe("");
    });

    it("controlled state follows getter", () => {
        let external = false;
        const builder = new {Kind}({
            value: () => external,
            onValueChange: (v) => { external = v; },
        });
        expect(builder.value).toBe(false);
    });

    // ... keyboard, selection, compound item tests
});
```

---

## 6. BUILDER INVENTORY — ALL 50 UNCOVERED PRIMITIVES

### Tier 1: Complex (state + keyboard + compound)

These are the hardest. Built first because they validate the _internal utilities.

| Kind | ARIA Roles | Keyboard | _internal deps |
|------|-----------|----------|----------------|
| **toggle-group** | group, button (aria-pressed) | Arrow L/R, Enter/Space | Synced, SelectionState, RovingFocus |
| **toolbar** | toolbar, roving tabindex across mixed children | Arrow L/R, Home/End, Tab | RovingFocus, Typeahead |
| **number-input** | group, spinbutton (valuenow/min/max) | ArrowUp/Down, Home/End, PageUp/Down | Synced |
| **data-table** | grid, row, gridcell, columnheader | Arrow 2D, Home/End, Page | SelectionState, RovingFocus |
| **scroll-area** | scrollbar (aria-controls, aria-orientation) | None (pointer) | Synced |
| **search-input** | searchbox, button (clear) | Escape clears | Synced |
| **sheet** | dialog (aria-modal) | Escape, Tab trap | Synced (reuse dismiss/escape/presence from existing _transport) |
| **notification-center** | log (aria-live) | None | Synced |

### Tier 2: Medium (state + simple keyboard)

| Kind | ARIA | Keyboard | _internal deps |
|------|------|----------|----------------|
| **checkbox** | checkbox (aria-checked tri-state) | Space | Synced |
| **switch** | switch (aria-checked) | Space, Enter | Synced |
| **form-field** | group (compound: label+control+error) | None | — |
| **loading-overlay** | status (aria-busy) | None | Synced |
| **toggle-group** → already in Tier 1 | | | |
| **nav-item** | link (aria-current) | Enter | — |

### Tier 3: Simple (ARIA-only, no keyboard, no state)

These are thin — just return correct attribute objects. Built in batches.

| Kind | ARIA |
|------|------|
| alert/banner | `role="alert"` |
| badge | `role="status"` |
| breadcrumb | `<nav aria-label>` |
| callout | `role="note"` |
| card | `role="group"` |
| code | none (semantic `<code>`) |
| divider/separator | `role="separator"`, `aria-orientation` |
| empty-state | `role="status"` |
| heading | implicit heading (h1-h6) |
| inline-message | `role="status"` |
| input | implicit textbox, `aria-invalid/required/readonly` |
| input-group | `role="group"` |
| kbd | none (semantic `<kbd>`) |
| label | none (semantic `<label>`) |
| list | implicit list |
| nav | `<nav>` |
| prose | none |
| sidebar | `<nav>` |
| skeleton | `role="status"`, `aria-busy` |
| skip-link | native `<a>` |
| spinner | `role="status"`, `aria-label` |
| stat | `role="group"` |
| steps | `<nav>`, `aria-current` |
| table | implicit table roles |
| table-of-contents | `<nav>`, links |
| text/textarea | implicit textbox |
| color-input | `role="group"` |
| form | native `<form>` |
| aspect-ratio/box/center/container/flex/grid/hstack/stack/spacer/sticky | none (layout, no ARIA) |

---

## 7. DEVDEPENDENCIES

### Already installed (no changes needed)

| Package | Version | Use |
|---------|---------|-----|
| `svelte` | `^5.0.0` | Runes: `$state`, `$derived`, `$effect` in `.svelte.ts` utility files |
| `zod` | `^4.3.6` | Config schema validation |
| `vitest` | `^4.0.18` | Builder unit tests |
| `@vitest/browser-playwright` | `^4.0.17` | Real Chromium browser tests |
| `vitest-browser-svelte` | `^2.0.2` | Svelte component rendering in tests |
| `@testing-library/svelte` | `^5.3.1` | DOM queries |
| `@testing-library/user-event` | `^14.6.1` | Keyboard/pointer simulation |
| `@biomejs/biome` | `^2.3.13` | Linting + formatting |
| `tsx` | `^4.21.0` | Script runner |
| `aria-query` | `^5.3.2` | ARIA role/attribute validation in tests |
| `@floating-ui/dom` | `^1.7.5` | Positioning (for popover-like builders if needed) |

### No new dependencies required

The builder system is built entirely from:
- Svelte 5 runes (reactivity)
- Native DOM APIs (focus, keyboard, events)
- Existing ColdLight utilities
- TypeScript

---

## 8. AUTOMATION & MAINTENANCE

### 8.1 Scanner Integration

`platform-scanner.ts` already checks adapter completeness. Add parallel check for `builders/`:

```
Builder completeness = hasFactory + hasTypes + hasIndex + hasTest
```

Add to `coldlight.config.ts`:
```typescript
roots: {
    // existing...
    buildersRoot: "src/lib/design/builders",
}
```

### 8.2 Lefthook Hooks

Add to `lefthook.yml` pre-commit:
```yaml
cold-builders-check:
    glob: "interfaces/desktop/src/lib/design/builders/**/*.{ts,svelte.ts}"
    run: "cd interfaces/desktop && pnpm svelte-check"
```

### 8.3 Biome / Grit Rules

New grit rules to add:
1. **`no-direct-melt-import.grit`** — Builders must NEVER import from `melt`. They are ColdLight-native.
2. **`builder-factory-export.grit`** — Every `factory.ts` must export both the class and `createX()` function.
3. **`data-cl-prefix.grit`** — Builder attrs must use `data-cl-*` prefix, never `data-melt-*`.

### 8.4 Inventory Generator

`generate-inventory.ts` already tracks factory presence per adapter. Extend to scan `builders/` with the same structure:

```
## ColdLight Builders (N)

| # | Kind | factory | types | test | Complete |
```

### 8.5 Manifest Generator

`generate-manifest.ts` should generate import cloaks for builders same as adapters:

```typescript
export { ToggleGroup, createToggleGroup } from "$lib/design/builders/toggle-group/index.js";
```

---

## 9. RELATIONSHIP TO EXISTING LAYERS

```
┌─────────────────────────────────────────────────┐
│ components/{kind}/                              │
│   Svelte files. Wire builder + recipe.          │
│   Import from builders/{kind}/             │
│   OR from api/adapters/meltui/_internal/{kind}/ │
├─────────────────────────────────────────────────┤
│ builders/{kind}/                           │  ← NEW
│   Class + factory.ts. Returns SlotAttrs.        │
│   Uses _internal/ utilities.                    │
│   NO transport layer. IS ColdLight.             │
├─────────────────────────────────────────────────┤
│ builders/_internal/                        │  ← NEW
│   Synced, SelectionState, RovingFocus,          │
│   Typeahead, mergeAttrs, builderMetadata        │
├─────────────────────────────────────────────────┤
│ api/adapters/meltui/_internal/{kind}/           │
│   factory.ts (wraps melt class)                 │
│   _transport/ (translates to ColdLight vocab)   │
├─────────────────────────────────────────────────┤
│ api/adapters/coldlight/_internal/_transport/     │
│   Shared utils: dismiss-layer, escape-layer,    │
│   presence, scroll-lock, ids, platform          │
│   (builders/ CAN import these too)               │
├─────────────────────────────────────────────────┤
│ primitives/{kind}/                              │
│   Unstyled structural shells.                   │
│   No ARIA. No behavior. Just DOM shape.         │
├─────────────────────────────────────────────────┤
│ tokens/ → SD5 pipeline → CSS/Tailwind/TS        │
│ recipes/ → Styling patterns                     │
└─────────────────────────────────────────────────┘
```

### Import Rules (Enforced by Grit)

| From | Can import | Cannot import |
|------|-----------|---------------|
| `builders/{kind}/` | `builders/_internal/`, `coldlight/_internal/_transport/` | `melt`, `api/adapters/meltui/`, `components/`, `primitives/` |
| `builders/_internal/` | `svelte/reactivity`, native DOM | everything else |
| `components/{kind}/` | `builders/{kind}/` OR `api/adapters/meltui/_internal/{kind}/` | never both for same component |

---

## 10. IMPLEMENTATION ORDER

### Phase 0: Foundation (`_internal/`)
- [ ] `types.ts` + `extract.ts` — shared types (port from existing `_transport/types.ts`)
- [ ] `synced.svelte.ts` — Synced class
- [ ] `selection-state.svelte.ts` — SelectionState class
- [ ] `merge-attrs.ts` — attribute composition
- [ ] `builder-metadata.ts` — data-cl-* + IDs
- [ ] `roving-focus.svelte.ts` — roving tabindex
- [ ] `typeahead.svelte.ts` — character match
- [ ] `index.ts` — barrel
- [ ] Tests for ALL _internal utilities

### Phase 1: First Complex Builder (validates the foundation)
- [ ] `toggle-group/` — exercises Synced + SelectionState + RovingFocus
- [ ] Vitest browser tests: ARIA, keyboard, single/multi select, controlled/uncontrolled

### Phase 2: Remaining Complex Builders
- [ ] `toolbar/`
- [ ] `number-input/`
- [ ] `search-input/`
- [ ] `scroll-area/`
- [ ] `sheet/`
- [ ] `data-table/`
- [ ] `notification-center/`

### Phase 3: Medium Builders
- [ ] `checkbox/`
- [ ] `switch/`
- [ ] `form-field/`
- [ ] `loading-overlay/`
- [ ] `nav-item/`

### Phase 4: Simple Builders (batch)
- [ ] All Tier 3 builders — batched in groups of 8-10

### Phase 5: Tooling Updates
- [ ] Update `coldlight.config.ts` — add `buildersRoot`
- [ ] Update `platform-scanner.ts` — scan `builders/`
- [ ] Update `generate-inventory.ts` — report builder completeness
- [ ] Update `generate-manifest.ts` — generate builder import cloaks
- [ ] Add grit rules: `no-direct-melt-import`, `builder-factory-export`, `data-cl-prefix`
- [ ] Update `lefthook.yml` — add builder pre-commit check

---

## 11. WHAT ABOUT THE EXISTING `coldlight/_internal/` BUILDERS?

We currently have 2 ColdLight adapter-layer builders at `api/adapters/coldlight/_internal/`:
- `dialog/` (dialog.svelte.ts + _transport/)
- `tabs/` (tabs.svelte.ts + _transport/)

These were designed as **adapter-layer** builders with `_transport/` wiring — they predate the `builders/` pattern. They stay where they are. The new `builders/` pattern is a simpler, single-layer pattern for the 50 uncovered primitives. The two systems coexist — components import from whichever location provides their builder.

---

## 12. SUCCESS CRITERIA

- [ ] `builders/_internal/` — all 8 utility files passing tests
- [ ] `toggle-group` builder — full ARIA, keyboard, controlled/uncontrolled, tested
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `pnpm test:browser` — all builder tests passing
- [ ] Scanner recognizes builders and reports completeness
- [ ] Inventory generator includes builders section
- [ ] Zero `melt` imports in `builders/`

---

## APPENDIX A: MELT SOURCE → COLDLIGHT IMPLEMENTATION MAPPING

This appendix documents the exact melt v0.44 source code for each internal utility, and the corresponding ColdLight implementation we will write. This is the reference spec — no deviation without justification.

### A.1 Synced — Melt Source (verbatim from `melt/dist/Synced.svelte.js`)

```javascript
// Melt's implementation
export class Synced {
    #internalValue = $state();
    #valueArg;
    #onChange;
    #defaultValue;
    #equalityCheck;

    constructor({ value, onChange, ...args }) {
        this.#valueArg = value;
        this.#onChange = onChange;
        this.#defaultValue = "defaultValue" in args ? args?.defaultValue : undefined;
        this.#equalityCheck = args.equalityCheck;
        this.#internalValue = extract(value, this.#defaultValue);
    }

    get current() {
        return isFunction(this.#valueArg)
            ? this.#valueArg() ?? this.#defaultValue ?? this.#internalValue
            : this.#internalValue;
    }

    set current(value) {
        if (this.#equalityCheck === true && this.current === value) return;
        if (isFunction(this.#equalityCheck)) {
            if (this.#equalityCheck(this.current, value)) return;
        }
        if (isFunction(this.#valueArg)) {
            this.#onChange?.(value);
            return;
        }
        this.#internalValue = value;
        this.#onChange?.(value);
    }
}
```

**ColdLight equivalent**: Same logic, TypeScript typed, our import paths. Key behavior:
- Getter arg → controlled (always reads from getter, setter only fires onChange)
- Static arg → uncontrolled (internal $state, setter updates internal + fires onChange)
- `equalityCheck: true` → reference equality skip
- `equalityCheck: function` → custom equality skip

### A.2 SelectionState — Melt Source (verbatim from `melt/dist/utils/selection-state.svelte.js`)

```javascript
// Melt's implementation (key methods)
export class SelectionState {
    #props;
    #internal_set = new SvelteSet();
    isControlled = $derived(isSvelteSet(this.#props.value) || isFunction(this.#props.value));
    isMultiple = $derived(extract(this.#props.multiple, false));

    constructor(props) {
        this.#props = props;
        // Initialize internal set from static value
        if (!isIterable(props.value) && props.value !== undefined) {
            this.#internal_set.add(props.value);
        } else if (isIterable(props.value)) {
            forEach(props.value, (v) => this.#internal_set.add(v));
        }
    }

    get current() {
        let value;
        if (isFunction(this.#props.value)) value = this.#props.value();
        else if (isSvelteSet(this.#props.value)) value = this.#props.value;
        else value = this.#internal_set;

        return this.isMultiple ? toSet(value) : toSingle(value);
    }

    manipulate(cb) {
        const set = this.isControlled ? toSet(this.current) : this.#internal_set;
        const prevValue = $state.snapshot(this.isMultiple ? set : toSingle(set));
        cb(set);
        const newValue = this.isMultiple ? set : toSingle(set);
        if (dequal(prevValue, $state.snapshot(newValue))) return;
        this.onChange(newValue);
    }

    toggle(item) {
        this.manipulate((set) => {
            if (set.has(item)) { set.delete(item); }
            else { if (!this.isMultiple) set.clear(); set.add(item); }
        });
    }
    // ... has, add, delete, clear, toArray, toSet
}
```

**ColdLight equivalent**: Same logic. Note `dequal` dependency — melt uses it for deep comparison. We should either:
- (a) Add `dequal` as a devDep (~400 bytes, no transitive deps), OR
- (b) Use `$state.snapshot` + JSON comparison for simple cases

Decision: Use (a) — `dequal` is the correct tool. Add to devDependencies.

### A.3 Data Attribute Helpers — Melt Source

```javascript
// melt/dist/utils/attribute.js
export function dataAttr(value) {
    return value === true ? "" : value === false ? undefined : value;
}

export function disabledAttr(value) {
    return value === true ? true : undefined;
}
```

### A.4 Extract — Melt Source

```javascript
// melt/dist/utils/extract.js
export function extract(value, defaultValue) {
    if (isGetter(value)) {
        const gotten = value();
        if (gotten === undefined) return defaultValue;
        return gotten;
    }
    if (value === undefined) return defaultValue;
    return value;
}
```

### A.5 createDataIds — Melt Source

```javascript
// melt/dist/utils/identifiers.js
let counter = 0;
export function createId() { return `melt-${counter++}`; }

export function createDataIds(name, parts) {
    return parts.reduce((acc, part) => {
        acc[part] = `data-melt-${name}-${part}`;
        return acc;
    }, {});
}
```

**ColdLight equivalent**: Prefix changes from `melt` to `cl`:
- `data-cl-{name}-{part}` for data attrs
- `cl-{counter}` for IDs
- `[data-cl-{name}-{part}]` for CSS selectors

### A.6 mergeAttrs — Melt Source

```javascript
// melt/dist/utils/merge-attrs.svelte.js (simplified)
export function mergeAttrs(...args) {
    const result = { ...args[0] };
    for (let i = 1; i < args.length; i++) {
        const props = args[i];
        for (const key in props) {
            const a = result[key];
            const b = props[key];
            if (isFunction(a) && isFunction(b) && isEventHandler(key)) {
                result[key] = composeHandlers(a, b);
            } else if (isFunction(a) && isFunction(b)) {
                result[key] = executeCallbacks(a, b);
            } else if (key === "style" && isString(a) && isString(b)) {
                result[key] = [a, b].join(";");
            } else {
                result[key] = b !== undefined ? b : a;
            }
        }
    }
    // Svelte bug: hidden/disabled false still renders as attribute
    if (result.hidden !== true) delete result.hidden;
    if (result.disabled !== true) delete result.disabled;
    return result;
}
```

### A.7 Keyboard Constants — Melt Source

```javascript
export const kbd = {
    ALT: "Alt", ARROW_DOWN: "ArrowDown", ARROW_LEFT: "ArrowLeft",
    ARROW_RIGHT: "ArrowRight", ARROW_UP: "ArrowUp", BACKSPACE: "Backspace",
    CAPS_LOCK: "CapsLock", CONTROL: "Control", DELETE: "Delete",
    END: "End", ENTER: "Enter", ESCAPE: "Escape", F1: "F1", F10: "F10",
    F11: "F11", F12: "F12", F2: "F2", F3: "F3", F4: "F4", F5: "F5",
    F6: "F6", F7: "F7", F8: "F8", F9: "F9", HOME: "Home", META: "Meta",
    PAGE_DOWN: "PageDown", PAGE_UP: "PageUp", SHIFT: "Shift",
    SPACE: " ", TAB: "Tab",
};

export const getNextKey = (dir = "ltr", orientation = "horizontal") => ({
    horizontal: dir === "rtl" ? kbd.ARROW_LEFT : kbd.ARROW_RIGHT,
    vertical: kbd.ARROW_DOWN,
})[orientation];

export const getPrevKey = (dir = "ltr", orientation = "horizontal") => ({
    horizontal: dir === "rtl" ? kbd.ARROW_RIGHT : kbd.ARROW_LEFT,
    vertical: kbd.ARROW_UP,
})[orientation];
```

### A.8 Toggle Builder — Melt Source (our gold standard reference)

```javascript
const identifiers = createDataIds("toggle", ["trigger", "hidden-input"]);

export class Toggle {
    #props;
    disabled = $derived(extract(this.#props.disabled, false));
    #value;

    constructor(props = {}) {
        this.#value = new Synced({
            value: props.value,
            onChange: props.onValueChange,
            defaultValue: false,
        });
        this.#props = props;
    }

    get value() { return this.#value.current; }
    set value(value) { this.#value.current = value; }

    get trigger() {
        return {
            [identifiers.trigger]: "",
            "data-checked": dataAttr(this.value),
            "aria-pressed": this.value,
            disabled: disabledAttr(this.disabled),
            onclick: () => {
                if (this.disabled) return;
                this.value = !this.value;
            },
        };
    }

    get hiddenInput() {
        return {
            [identifiers["hidden-input"]]: "",
            type: "hidden",
            value: this.value ? "on" : "off",
        };
    }
}
```

**This is the EXACT pattern every ColdLight builder follows.** Class-based, Synced state, data-attr identifiers, element attribute getters, event handlers inline.

### A.9 RadioGroup Item Pattern — Melt Source (roving + selection reference)

```javascript
// How melt handles per-item state + roving tabindex + keyboard
class RadioItem {
    #group;
    value;
    checked = $derived(this.#group.value === this.value);

    get attrs() {
        return {
            [metadata.dataAttrs.item]: "",
            "data-value": dataAttr(this.value),
            "data-state": dataAttr(this.checked ? "checked" : "unchecked"),
            "aria-checked": this.checked,
            role: "radio",
            tabindex: 0,
            onclick: (e) => { this.#select(e); },
            onkeydown: (e) => {
                if (e.key === kbd.SPACE) {
                    e.preventDefault();
                    this.#select(e);
                    return;
                }
                // Arrow nav: query siblings, find index, navigate
                const items = Array.from(
                    root.querySelectorAll(metadata.dataSelectors.item)
                ).filter((el) => !el.hasAttribute("data-disabled"));
                const currentIdx = items.indexOf(el);
                const { nextKey, prevKey } = getDirectionalKeys(dir, orientation);
                // ... handle nextKey, prevKey, HOME, END with loop
            },
        };
    }
}
```

**This pattern maps to our toggle-group items.** Each item gets `getItem()` returning spread-able attrs with inline keyboard handling.

---

## APPENDIX B: NEW DEVDEPENDENCY

### `dequal` — Deep Equality

**Why**: SelectionState needs deep comparison to prevent unnecessary onChange calls when set contents haven't changed. Melt uses `dequal` internally.

```bash
pnpm add -D dequal
```

| Package | Version | Size | Deps |
|---------|---------|------|------|
| `dequal` | `^2.0.3` | 406 bytes (min+gz) | 0 |

---

## APPENDIX C: TOGGLE-GROUP BUILDER SPEC

This is the first builder we will implement. Full specification:

### WAI-ARIA APG Reference
https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ (toggle-group is a simplified toolbar)

### ARIA Mapping

| Element | Role | Attributes |
|---------|------|------------|
| Root container | `group` | `aria-label`, `aria-orientation`, `data-cl-toggle-group-root` |
| Each item | `button` | `aria-pressed`, `tabindex` (roving), `data-cl-toggle-group-item`, `data-value`, `data-state` |

### Props

```typescript
export type ToggleGroupProps<Multiple extends boolean = false> = {
    /** Current value(s). Getter = controlled, static = uncontrolled. */
    value?: Multiple extends true
        ? MaybeGetter<Iterable<string> | undefined>
        : MaybeGetter<string | undefined>;
    /** Called when value changes. */
    onValueChange?: Multiple extends true
        ? (value: SvelteSet<string>) => void
        : (value: string | undefined) => void;
    /** Allow multiple items pressed simultaneously. @default false */
    multiple?: MaybeGetter<Multiple | undefined>;
    /** Disable the entire group. @default false */
    disabled?: MaybeGetter<boolean | undefined>;
    /** Orientation for arrow key navigation. @default "horizontal" */
    orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;
    /** Whether arrow keys loop. @default true */
    loop?: MaybeGetter<boolean | undefined>;
    /** Whether focusing an item selects it. @default false */
    selectWhenFocused?: MaybeGetter<boolean | undefined>;
};
```

### Element Getters

```typescript
class ToggleGroup {
    get root(): {
        "data-cl-toggle-group-root": "";
        role: "group";
        "aria-orientation": "horizontal" | "vertical";
        "data-orientation": "horizontal" | "vertical";
        "data-disabled": "" | undefined;
    };

    getItem(value: string, disabled?: boolean): {
        "data-cl-toggle-group-item": "";
        "data-value": string;
        "data-state": "on" | "off";
        "data-disabled": "" | undefined;
        role: "button";
        "aria-pressed": boolean;
        "aria-disabled": boolean | undefined;
        tabindex: 0 | -1;     // roving: active = 0, rest = -1
        onclick: () => void;   // toggle selection
        onkeydown: (e: KeyboardEvent) => void; // arrow nav + space/enter
    };
}
```

### Keyboard Behavior

| Key | Action |
|-----|--------|
| `ArrowRight` / `ArrowDown` | Focus next item (or first if loop) |
| `ArrowLeft` / `ArrowUp` | Focus previous item (or last if loop) |
| `Home` | Focus first item |
| `End` | Focus last item |
| `Space` / `Enter` | Toggle pressed state of focused item |
| Tab | Move focus out of group (standard tab behavior) |

### State Management

- **Single select** (`multiple: false`): One item pressed at a time. Pressing a new item deselects the old one. Pressing the active item deselects it (value becomes `undefined`).
- **Multi select** (`multiple: true`): Any number of items pressed. Toggle individually. Value is `SvelteSet<string>`.
- **Controlled**: Pass `value: () => externalState`. Builder always reads from getter. `onValueChange` fires but builder doesn't store.
- **Uncontrolled**: Pass `value: "initial"` or omit. Builder manages internal `$state`. `onValueChange` still fires for observation.

### _internal Dependencies

```
ToggleGroup
├── Synced (disabled prop)
├── SelectionState (value — single/multi)
├── createDataIds ("toggle-group", ["root", "item"])
├── dataAttr, disabledAttr
├── extract
├── kbd, getNextKey, getPrevKey
└── (no RovingFocus class — keyboard is inline per melt's pattern)
```

Note: After studying melt's RadioGroup and Tabs, the keyboard navigation is handled **inline in the item's `onkeydown`** — not as a separate RovingFocus class. Melt queries sibling elements directly. We follow this pattern for consistency. The `RovingFocus` class in `_internal` is an OPTIONAL convenience for builders that want it, but `toggle-group` uses inline keyboard handling to match melt exactly.
