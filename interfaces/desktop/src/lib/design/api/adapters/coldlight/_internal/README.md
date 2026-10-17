# ColdLight `_internal` — Primitive Mapping Layer

> **One file per primitive. One-to-one mapping. No drift.**

---

## Purpose

Each `*.internal.ts` file is the **stable shape** a primitive relies on.

Before ANY primitive can be implemented, its `_internal` file MUST exist.

---

## File Format

Every `_internal/<kind>.internal.ts` MUST export:

```typescript
/**
 * @file _internal/<kind>.internal.ts
 * @primitive <kind>
 * @layer adapter
 */

// ============================================================
// 1. PRIMITIVE IDENTITY
// ============================================================
export const KIND = '<kind>' as const;

// ============================================================
// 2. SLOT INVENTORY
// ============================================================
export const SLOTS = {
  /** Must exist when primitive renders */
  required: ['root'] as const,

  /** Exist only when feature enabled */
  conditional: [] as const,

  /** Never allowed on this primitive */
  forbidden: [] as const,
} as const;

// Derived types
export type RequiredSlot = typeof SLOTS.required[number];
export type ConditionalSlot = typeof SLOTS.conditional[number];
export type Slot = RequiredSlot | ConditionalSlot;

// ============================================================
// 3. STATE TOKEN INVENTORY
// ============================================================
export const STATES = {
  /** Shared tokens (from global vocabulary) */
  shared: ['disabled', 'focused', 'focus-visible'] as const,

  /** Primitive-specific tokens */
  specific: [] as const,
} as const;

// Derived types
export type SharedState = typeof STATES.shared[number];
export type SpecificState = typeof STATES.specific[number];
export type State = SharedState | SpecificState;

// ============================================================
// 4. MELT BUILDER (for MeltUI adapter)
// ============================================================
/** The MeltUI builder function name */
export const MELT_BUILDER = 'create<Kind>' as const;

// ============================================================
// 5. ELEMENT MAP (Melt element → ColdLight slot)
// ============================================================
export const ELEMENT_MAP = {
  // meltElement: 'coldlightSlot',
  root: 'root',
} as const satisfies Record<string, Slot>;

// ============================================================
// 6. STATE MAP (Melt state → ColdLight state token)
// ============================================================
export const STATE_MAP = {
  // meltState: 'coldlightToken',
} as const;

// ============================================================
// 7. MELT HANDLES (passthrough — do not override)
// ============================================================
export const MELT_HANDLES = [
  'role',
  'aria-*',
  'tabindex',
  'id',
] as const;

// ============================================================
// 8. COLDLIGHT ADDS (we always add these)
// ============================================================
export const COLDLIGHT_ADDS = [
  'data-kind',
  'data-slot',
  'data-state',
] as const;
```

---

## Example: Accordion

```typescript
// _internal/accordion.internal.ts

export const KIND = 'accordion' as const;

export const SLOTS = {
  required: ['root', 'item', 'trigger', 'content'] as const,
  conditional: ['icon'] as const,
  forbidden: [] as const,
} as const;

export type RequiredSlot = typeof SLOTS.required[number];
export type ConditionalSlot = typeof SLOTS.conditional[number];
export type Slot = RequiredSlot | ConditionalSlot;

export const STATES = {
  shared: ['disabled', 'focused', 'focus-visible'] as const,
  specific: ['open', 'closed'] as const,
} as const;

export type SharedState = typeof STATES.shared[number];
export type SpecificState = typeof STATES.specific[number];
export type State = SharedState | SpecificState;

export const MELT_BUILDER = 'createAccordion' as const;

export const ELEMENT_MAP = {
  root: 'root',
  item: 'item',
  trigger: 'trigger',
  content: 'content',
} as const satisfies Record<string, Slot>;

export const STATE_MAP = {
  open: 'open',
  // Melt's `open: boolean` → 'open' | 'closed'
} as const;

export const MELT_HANDLES = [
  'role',
  'aria-expanded',
  'aria-controls',
  'aria-labelledby',
  'tabindex',
  'id',
  'data-state', // Melt sets this too
  'data-disabled',
] as const;

export const COLDLIGHT_ADDS = [
  'data-kind',
  'data-slot',
  'data-state', // We override Melt's with space-separated tokens
] as const;
```

---

## Example: Tabs (Full Contract)

```typescript
// _internal/tabs.internal.ts

export const KIND = 'tabs' as const;

export const SLOTS = {
  required: ['root', 'list', 'tab', 'panel'] as const,
  conditional: [
    'indicator',
    'icon',
    'badge',
    'close',
    'overflow',
    'scroll-prev',
    'scroll-next',
    'contextmenu',
    'drag-handle',
    'ghost',
  ] as const,
  forbidden: [] as const,
} as const;

export type RequiredSlot = typeof SLOTS.required[number];
export type ConditionalSlot = typeof SLOTS.conditional[number];
export type Slot = RequiredSlot | ConditionalSlot;

export const STATES = {
  shared: ['disabled', 'focused', 'focus-visible', 'hovered', 'pressed'] as const,
  specific: [
    // Mode (exactly one)
    'horizontal', 'vertical',
    // Selection (exactly one per tab)
    'active', 'inactive',
    'selected', 'unselected',
    // Overflow
    'overflowing',
    // Drag
    'dragging', 'over',
    // Close capability
    'closable',
    // Panel presence
    'present', 'hidden',
  ] as const,
} as const;

export type SharedState = typeof STATES.shared[number];
export type SpecificState = typeof STATES.specific[number];
export type State = SharedState | SpecificState;

export const MELT_BUILDER = 'createTabs' as const;

export const ELEMENT_MAP = {
  root: 'root',
  list: 'list',
  trigger: 'tab',
  content: 'panel',
} as const satisfies Record<string, Slot>;

export const STATE_MAP = {
  value: 'selected', // Melt's value → ColdLight's selected tab
} as const;

export const MELT_HANDLES = [
  'role',
  'aria-selected',
  'aria-controls',
  'aria-labelledby',
  'tabindex',
  'id',
  'data-state',
  'data-orientation',
] as const;

export const COLDLIGHT_ADDS = [
  'data-kind',
  'data-slot',
  'data-state',
] as const;

// ============================================================
// TABS-SPECIFIC: Presence Discipline
// ============================================================
export const PANEL_PRESENCE = {
  /** Panels are always mounted (not conditionally rendered) */
  alwaysMounted: true,

  /** Inactive panels are non-interactive but present */
  inactiveStates: ['hidden', 'present', 'inactive'] as const,

  /** Active panel states */
  activeStates: ['active', 'present'] as const,
} as const;

// ============================================================
// TABS-SPECIFIC: Overflow Behavior
// ============================================================
export const OVERFLOW = {
  /** Computed from tablist scroll metrics */
  signal: 'overflowing',

  /** When overflowing, enable these slots */
  enablesSlots: ['scroll-prev', 'scroll-next', 'overflow'] as const,
} as const;

// ============================================================
// TABS-SPECIFIC: Drag Reorder
// ============================================================
export const DRAG = {
  /** State when dragging this tab */
  draggingState: 'dragging',

  /** State when another tab is over this one */
  overState: 'over',

  /** Ghost slot for drag preview */
  ghostSlot: 'ghost',

  /** Keyboard shortcuts for reorder */
  shortcuts: {
    horizontal: ['Ctrl+ArrowLeft', 'Ctrl+ArrowRight'],
    vertical: ['Ctrl+ArrowUp', 'Ctrl+ArrowDown'],
  },
} as const;
```

---

## Checklist Before Creating Primitive

- [ ] `_internal/<kind>.internal.ts` exists
- [ ] `KIND` matches taxonomy `primitiveKinds.ts`
- [ ] `SLOTS.required` lists all mandatory slots
- [ ] `SLOTS.conditional` lists optional enhancements
- [ ] `STATES.shared` uses global vocabulary only
- [ ] `STATES.specific` lists primitive-specific tokens
- [ ] `MELT_BUILDER` is correct function name
- [ ] `ELEMENT_MAP` maps all Melt elements → ColdLight slots
- [ ] `STATE_MAP` maps Melt state → ColdLight tokens
- [ ] Types are derived from `as const` arrays

---

## Verification

```bash
cd interfaces/desktop
pnpm check
```

---

## Index Export Pattern

```typescript
// _internal/index.ts

// Re-export all internal mappings
export * as accordion from './accordion.internal.js';
export * as button from './button.internal.js';
export * as tabs from './tabs.internal.js';
// ... etc

// Type helper
export type { Slot, State } from './accordion.internal.js';
```

---

**No `_internal` file = No primitive implementation.**
