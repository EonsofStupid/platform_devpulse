# Sprint 03 — JSDoc Parity (Golden Standard Retrofit)

> **Scope**: 5 Sprint 02 primitives (separator, collapsible, accordion, scroll-area, toolbar)
> **Goal**: Bring every .ts file to golden-standard JSDoc parity established by button/dialog/tabs in Sprint 01.
> **Gate**: `pnpm svelte-check` passes. Every .ts file has `@file` header. Every taxonomy types.ts has section separators. Every export has JSDoc.
> **Created**: 2026-01-31
> **Status**: IN PROGRESS

---

## Why This Sprint Matters

Sprint 01 established three golden primitives with full JSDoc: button, dialog, tabs. The remaining 5 Sprint 01 primitives (sheet, alert-dialog, popover, tooltip, select) were subsequently brought to gold standard.

Sprint 02 added 5 more primitives structurally correct but **without JSDoc**: separator, collapsible, accordion, scroll-area, toolbar. All 19 Svelte files have `@component` blocks. The .ts files do not have `@file` headers, section separators, or export-level JSDoc.

**Current state: 8 of 13 primitives at gold standard. 5 need JSDoc retrofit.**

This sprint is **documentation only**. Zero structural changes. Zero new exports. Zero logic changes. Every file must produce identical compiled output before and after.

---

## Golden Standard Reference

Every pattern below is copied directly from the existing button/dialog/tabs implementations.

### Pattern A: Taxonomy `types.ts`

```typescript
/**
 * @file {Kind} Taxonomy Types
 * @description Type vocabulary for the {kind} primitive.
 * as const arrays → derived type unions. Consumed by contract.ts.
 *
 * kind: "{kind}"
 * ariaStateProvider: "{provider}" — {one-line explanation}.
 */

import type { StateToken, SlotStateMap } from "../../../types.js";

// ─── SLOT TYPES ─────────────────────────────────────────────────────────────

/** All slot names for the {kind} primitive */
export const {kind}Slots = [...] as const;

/** Union of {kind} slot names */
export type {Kind}Slot = (typeof {kind}Slots)[number];

// ─── STATE TYPES ────────────────────────────────────────────────────────────

/** All state tokens applicable to the {kind} primitive */
export const {kind}StateTokens = [...] as const satisfies readonly StateToken[];

/** Union of {kind} state tokens */
export type {Kind}State = (typeof {kind}StateTokens)[number];

// ─── SLOT STATE MAP ─────────────────────────────────────────────────────────

/** Per-slot allowed states for {kind} */
export const {kind}SlotStates = {...} as const satisfies SlotStateMap<{Kind}Slot, {Kind}State>;
```

### Pattern B: Taxonomy `contract.ts`

```typescript
/**
 * @file {Kind} Taxonomy Contract
 * @description ColdLight SSOT contract for the {kind} primitive.
 *
 * ariaStateProvider: "{provider}" — {explanation}.
 * 2-folder parity: taxonomy + primitive.
 */

import type { PrimitiveContract } from "../../../types.js";
import { {kind}SlotStates, type {Kind}Slot, type {Kind}State } from "./types.js";

// ─── CONTRACT ───────────────────────────────────────────────────────────────

/** {Kind} primitive contract — ColdLight SSOT */
export const contract: PrimitiveContract<"{kind}", {Kind}Slot, {Kind}State> = {...};
```

### Pattern C: Taxonomy `index.ts`

```typescript
/**
 * @file {Kind} Taxonomy Barrel
 * @description Re-exports {kind} types + contract. Zero logic.
 */
```

### Pattern D: Primitive `types.ts`

```typescript
/**
 * @file {Kind} Primitive Types
 * @description Structural type declarations for the {kind} primitive.
 * Aligned to taxonomy contract: kind="{kind}"
 * Slots: {comma-separated slot list}
 * ariaStateProvider: "{provider}" — {explanation}.
 */

/** {Kind} {role} — {brief description} */
export interface {Kind}Props extends ... {...}
```

Every interface gets a one-line JSDoc. Every non-obvious prop gets a `/** description */`.

### Pattern E: Primitive `context.ts`

```typescript
/**
 * @file {Kind} Primitive Context
 * @description Svelte context for compound {kind} coordination.
 * Root sets context, sub-components read it.
 * Reactive via getter when set from Svelte component with $state.
 */
```

Every type gets a JSDoc. Every function gets a JSDoc.

### Pattern F: Primitive `index.ts`

```typescript
/**
 * @file {Kind} Primitive Barrel
 */
```

---

## Scope Summary

| Kind | Provider | Tax Files | Prim Files | Total |
|------|----------|-----------|------------|-------|
| separator | coldlight | 3 | 2 (types, index) | 5 |
| collapsible | coldlight | 3 | 3 (types, context, index) | 6 |
| accordion | coldlight | 3 | 3 (types, context, index) | 6 |
| scroll-area | coldlight | 3 | 2 (types, index) | 5 |
| toolbar | coldlight | 3 | 2 (types, index) | 5 |

**Total: 27 file updates. Zero new files. Zero structural changes.**

---

## Execution Checklist

All paths relative to `interfaces/desktop/src/lib/design/`.

### 3.1 SEPARATOR (coldlight, 5 files)

- [ ] `taxonomy/kinds/primitives/separator/types.ts` — Pattern A
- [ ] `taxonomy/kinds/primitives/separator/contract.ts` — Pattern B (2-folder parity note)
- [ ] `taxonomy/kinds/primitives/separator/index.ts` — Pattern C
- [ ] `primitives/separator/types.ts` — Pattern D (1 interface: SeparatorProps)
- [ ] `primitives/separator/index.ts` — Pattern F

### 3.2 COLLAPSIBLE (coldlight, 6 files)

- [ ] `taxonomy/kinds/primitives/collapsible/types.ts` — Pattern A
- [ ] `taxonomy/kinds/primitives/collapsible/contract.ts` — Pattern B (2-folder parity note)
- [ ] `taxonomy/kinds/primitives/collapsible/index.ts` — Pattern C
- [ ] `primitives/collapsible/types.ts` — Pattern D (3 interfaces: CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps)
- [ ] `primitives/collapsible/context.ts` — Pattern E
- [ ] `primitives/collapsible/index.ts` — Pattern F

### 3.3 ACCORDION (coldlight, 6 files)

- [ ] `taxonomy/kinds/primitives/accordion/types.ts` — Pattern A
- [ ] `taxonomy/kinds/primitives/accordion/contract.ts` — Pattern B (2-folder parity note)
- [ ] `taxonomy/kinds/primitives/accordion/index.ts` — Pattern C
- [ ] `primitives/accordion/types.ts` — Pattern D (5 interfaces: AccordionProps, AccordionItemProps, AccordionHeaderProps, AccordionTriggerProps, AccordionContentProps)
- [ ] `primitives/accordion/context.ts` — Pattern E (2-level: root + item context)
- [ ] `primitives/accordion/index.ts` — Pattern F

### 3.4 SCROLL-AREA (coldlight, 5 files)

- [ ] `taxonomy/kinds/primitives/scroll-area/types.ts` — Pattern A
- [ ] `taxonomy/kinds/primitives/scroll-area/contract.ts` — Pattern B (2-folder parity note)
- [ ] `taxonomy/kinds/primitives/scroll-area/index.ts` — Pattern C
- [ ] `primitives/scroll-area/types.ts` — Pattern D (5 interfaces: ScrollAreaProps, ScrollAreaViewportProps, ScrollAreaScrollbarProps, ScrollAreaThumbProps, ScrollAreaCornerProps)
- [ ] `primitives/scroll-area/index.ts` — Pattern F

### 3.5 TOOLBAR (coldlight, 5 files)

- [ ] `taxonomy/kinds/primitives/toolbar/types.ts` — Pattern A
- [ ] `taxonomy/kinds/primitives/toolbar/contract.ts` — Pattern B (2-folder parity note)
- [ ] `taxonomy/kinds/primitives/toolbar/index.ts` — Pattern C
- [ ] `primitives/toolbar/types.ts` — Pattern D (5 interfaces: ToolbarProps, ToolbarGroupProps, ToolbarItemProps, ToolbarSeparatorProps, ToolbarLinkProps)
- [ ] `primitives/toolbar/index.ts` — Pattern F

### 3.6 GATE CHECK

- [ ] `pnpm svelte-check` — 0 errors. Compiled output unchanged.
- [ ] Every taxonomy `types.ts` has: `@file` header, 3 section separators, JSDoc on every export
- [ ] Every taxonomy `contract.ts` has: `@file` header, contract section separator, JSDoc on contract export
- [ ] Every taxonomy `index.ts` has: `@file` + `@description` header
- [ ] Every primitive `types.ts` has: `@file` header with contract alignment, JSDoc on every interface
- [ ] Every primitive `context.ts` has: `@file` header with reactivity note, JSDoc on types + functions
- [ ] Every primitive `index.ts` has: `@file` header
- [ ] Zero logic changes — `git diff --stat` shows only comment/whitespace additions

---

## Specific JSDoc Content Per Kind

### Separator

**Taxonomy types.ts header:**
```
kind: "separator"
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Taxonomy contract.ts header:**
```
ariaStateProvider: "coldlight" — native HTML handles semantics.
2-folder parity: taxonomy + primitive.
```

**Primitive types.ts header:**
```
Aligned to taxonomy contract: kind="separator"
Slots: root
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Interface JSDoc:**
- `SeparatorProps` — Structural divider supporting horizontal/vertical orientation

### Collapsible

**Taxonomy types.ts header:**
```
kind: "collapsible"
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Taxonomy contract.ts header:**
```
ariaStateProvider: "coldlight" — native HTML handles semantics.
2-folder parity: taxonomy + primitive.
```

**Primitive types.ts header:**
```
Aligned to taxonomy contract: kind="collapsible"
Slots: root, trigger, content
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Interface JSDoc:**
- `CollapsibleProps` — Collapsible root — context provider, no DOM element
- `CollapsibleTriggerProps` — Button that toggles content visibility
- `CollapsibleContentProps` — Expandable content region

**Context JSDoc:**
- `CollapsibleContext` — Collapsible context shape
- `setCollapsibleContext` — Set collapsible context (called by Collapsible root)
- `getCollapsibleContext` — Get collapsible context (called by sub-components)

### Accordion

**Taxonomy types.ts header:**
```
kind: "accordion"
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Taxonomy contract.ts header:**
```
ariaStateProvider: "coldlight" — native HTML handles semantics.
2-folder parity: taxonomy + primitive.
```

**Primitive types.ts header:**
```
Aligned to taxonomy contract: kind="accordion"
Slots: root, item, header, trigger, content
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Interface JSDoc:**
- `AccordionProps` — Accordion root — context provider, no DOM element
- `AccordionItemProps` — Item wrapper providing item-level context
- `AccordionHeaderProps` — Heading wrapper for trigger
- `AccordionTriggerProps` — Button that toggles item content
- `AccordionContentProps` — Expandable content panel

**Context JSDoc:**
- `AccordionContext` — Accordion root context shape
- `setAccordionContext` — Set accordion context (called by Accordion root)
- `getAccordionContext` — Get accordion context (called by sub-components)
- `AccordionItemContext` — Accordion item context shape
- `setAccordionItemContext` — Set item context (called by AccordionItem)
- `getAccordionItemContext` — Get item context (called by AccordionTrigger/Content)

### Scroll-Area

**Taxonomy types.ts header:**
```
kind: "scroll-area"
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Taxonomy contract.ts header:**
```
ariaStateProvider: "coldlight" — native HTML handles semantics.
2-folder parity: taxonomy + primitive.
```

**Primitive types.ts header:**
```
Aligned to taxonomy contract: kind="scroll-area"
Slots: root, viewport, scrollbar, thumb, corner
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Interface JSDoc:**
- `ScrollAreaProps` — Scroll area root container
- `ScrollAreaViewportProps` — Scrollable content viewport
- `ScrollAreaScrollbarProps` — Custom scrollbar track
- `ScrollAreaThumbProps` — Draggable scrollbar thumb
- `ScrollAreaCornerProps` — Corner element where scrollbars meet

### Toolbar

**Taxonomy types.ts header:**
```
kind: "toolbar"
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Taxonomy contract.ts header:**
```
ariaStateProvider: "coldlight" — native HTML handles semantics.
2-folder parity: taxonomy + primitive.
```

**Primitive types.ts header:**
```
Aligned to taxonomy contract: kind="toolbar"
Slots: root, group, item, separator, link
ariaStateProvider: "coldlight" — native HTML handles semantics.
```

**Interface JSDoc:**
- `ToolbarProps` — Toolbar root container
- `ToolbarGroupProps` — Groups related toolbar items
- `ToolbarItemProps` — Actionable button within toolbar
- `ToolbarSeparatorProps` — Visual divider between groups
- `ToolbarLinkProps` — Navigation link within toolbar

---

## Invariants

1. **Zero structural changes.** Only JSDoc comments and section separators added.
2. **Compiled output must be identical.** `git diff` should show only comment lines.
3. **Every pattern matches the golden reference exactly.** Same separator width, same JSDoc verbs.
4. **Section separators are exactly 77 `─` characters** after `// ─── TITLE `, matching button/dialog/tabs.
5. **No new exports, no removed exports, no reordered exports.**
