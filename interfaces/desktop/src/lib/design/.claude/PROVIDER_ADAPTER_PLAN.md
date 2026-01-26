# ColdLight Provider Adapter Architecture Plan

## GOAL
Build a **provider abstraction layer** so ColdLight primitives can swap backends:
- Melt UI (current)
- Skeleton (future)
- Ark UI (future)
- React Aria (future)

---

## CURRENT STATE

### What Exists (`sys/api/_internal/melt/`)
```
melt/
├── types.ts       ✓ 31 builder type aliases
├── state.ts       ✓ State extractors (extractOpenState, etc.)
├── assertions.ts  ✗ BROKEN - imports missing taxonomy files
├── schemas.ts     ✓ Zod validation schemas
└── index.ts       ✓ Barrel exports
```

### What's Missing
1. **taxonomy/** folder doesn't exist - assertions.ts can't import
2. **Provider contract interface** - no abstract layer
3. **Registry** - no way to register/swap providers
4. **Primitive-to-builder mapping** - hardcoded in assertions

---

## ARCHITECTURE

### Layer 1: Taxonomy (Kind/Slot Definitions)
```
design/taxonomy/
├── primitiveKinds.ts    # "button", "tabs", "accordion", etc.
├── primitiveRegistry.ts # Kind → Slot[] mapping
└── index.ts
```

### Layer 2: Provider Contract
```
design/sys/api/_internal/
├── contract.ts          # IProviderAdapter interface
├── registry.ts          # ProviderRegistry singleton
└── melt/                # Melt implementation (exists)
```

### Layer 3: Primitives Consume Contract
```typescript
// In any primitive:
import { useProvider } from '$lib/design/sys/api/_internal';

// Gets current provider (Melt by default)
const provider = useProvider();
const { elements, states } = provider.createTabs(options);
```

---

## EXECUTION STEPS

### STEP 1: Create Taxonomy (5 files)

**File: `taxonomy/primitiveKinds.ts`**
```typescript
export const PRIMITIVE_KINDS = [
  'button', 'tabs', 'accordion', 'dialog', 'popover',
  'tooltip', 'select', 'combobox', 'checkbox', 'switch',
  'radio-group', 'toggle', 'toggle-group', 'dropdown-menu',
  'context-menu', 'collapsible', 'slider', 'progress',
  'pin-input', 'tags-input', 'calendar', 'date-picker',
  'avatar', 'scroll-area', 'tree-view', 'menubar',
  'separator', 'label', 'pagination', 'link-preview',
] as const;

export type PrimitiveKind = typeof PRIMITIVE_KINDS[number];

export function isPrimitiveKind(kind: string): kind is PrimitiveKind {
  return PRIMITIVE_KINDS.includes(kind as PrimitiveKind);
}
```

**File: `taxonomy/primitiveRegistry.ts`**
```typescript
import type { PrimitiveKind } from './primitiveKinds.js';

const PRIMITIVE_SLOTS: Record<PrimitiveKind, readonly string[]> = {
  button: ['root', 'icon', 'label', 'badge'],
  tabs: ['root', 'list', 'trigger', 'panel'],
  accordion: ['root', 'item', 'trigger', 'content'],
  // ... etc
};

export function getPrimitiveSlots(kind: PrimitiveKind): readonly string[] {
  return PRIMITIVE_SLOTS[kind] ?? [];
}

export function isValidSlot(kind: PrimitiveKind, slot: string): boolean {
  return getPrimitiveSlots(kind).includes(slot);
}
```

**File: `taxonomy/provider/types.ts`**
```typescript
import type { PrimitiveKind } from '../primitiveKinds.js';

// Which primitives use Melt vs custom ARIA
const MELT_PRIMITIVES: PrimitiveKind[] = [
  'tabs', 'accordion', 'dialog', 'popover', 'tooltip',
  'select', 'combobox', 'checkbox', 'switch', 'radio-group',
  'dropdown-menu', 'context-menu', 'collapsible', 'slider',
  'progress', 'pin-input', 'tags-input', 'calendar',
  'date-picker', 'avatar', 'scroll-area', 'tree-view',
  'menubar', 'toggle', 'toggle-group', 'pagination',
  'link-preview',
];

const CUSTOM_ARIA_PRIMITIVES: PrimitiveKind[] = [
  'button', 'separator', 'label',
];

export function isMeltPrimitive(kind: PrimitiveKind): boolean {
  return MELT_PRIMITIVES.includes(kind);
}

// Maps kind → Melt builder function name
const BUILDER_MAP: Partial<Record<PrimitiveKind, string>> = {
  tabs: 'createTabs',
  accordion: 'createAccordion',
  dialog: 'createDialog',
  // ... etc
};

export function getBuilderName(kind: PrimitiveKind): string | undefined {
  return BUILDER_MAP[kind];
}
```

### STEP 2: Create Provider Contract

**File: `sys/api/_internal/contract.ts`**
```typescript
/**
 * Provider adapter contract.
 * Any headless library (Melt, Skeleton, Ark) must implement this.
 */
export interface IProviderAdapter {
  readonly name: string;
  readonly version: string;

  // Factory methods return { elements, states, helpers }
  createTabs(options?: unknown): TabsReturn;
  createAccordion(options?: unknown): AccordionReturn;
  createDialog(options?: unknown): DialogReturn;
  // ... etc
}

// Return type contracts
export interface TabsReturn {
  elements: { root: object; list: object; trigger: (id: string) => object; panel: (id: string) => object };
  states: { value: Readable<string> };
  helpers: { isSelected: (id: string) => Readable<boolean> };
}
// ... similar for other primitives
```

### STEP 3: Create Provider Registry

**File: `sys/api/_internal/registry.ts`**
```typescript
import type { IProviderAdapter } from './contract.js';

let currentProvider: IProviderAdapter | null = null;

export function registerProvider(provider: IProviderAdapter): void {
  currentProvider = provider;
  console.log(`[ColdLight] Provider registered: ${provider.name} v${provider.version}`);
}

export function useProvider(): IProviderAdapter {
  if (!currentProvider) {
    throw new Error('[ColdLight] No provider registered. Call registerProvider() first.');
  }
  return currentProvider;
}

export function getProviderName(): string {
  return currentProvider?.name ?? 'none';
}
```

### STEP 4: Implement Melt Adapter

**File: `sys/api/_internal/melt/adapter.ts`**
```typescript
import type { IProviderAdapter } from '../contract.js';
import { createTabs, createAccordion, createDialog } from '@melt-ui/svelte';

export const MeltAdapter: IProviderAdapter = {
  name: 'melt-ui',
  version: '2.15.4',

  createTabs(options) {
    const builder = createTabs(options);
    return {
      elements: builder.elements,
      states: { value: builder.states.value },
      helpers: { isSelected: builder.helpers.isSelected },
    };
  },

  createAccordion(options) {
    const builder = createAccordion(options);
    // ... normalize to contract
  },

  // ... etc
};
```

### STEP 5: Initialize on App Mount

**File: `sys/init.ts`**
```typescript
import { registerProvider } from '$lib/design/sys/api/_internal/registry.js';
import { MeltAdapter } from '$lib/design/sys/api/_internal/melt/adapter.js';

export function initColdLight(): void {
  registerProvider(MeltAdapter);
}
```

---

## FILE CREATION ORDER

1. `taxonomy/primitiveKinds.ts`
2. `taxonomy/primitiveRegistry.ts`
3. `taxonomy/provider/types.ts`
4. `taxonomy/index.ts`
5. `sys/api/_internal/contract.ts`
6. `sys/api/_internal/registry.ts`
7. `sys/api/_internal/melt/adapter.ts`
8. Update `sys/api/_internal/melt/index.ts`
9. Update `sys/api/_internal/index.ts`

---

## VERIFICATION

After each file:
```bash
cd interfaces/desktop/src && pnpm check
```

After all files:
```bash
pnpm dev  # Should start without errors
```

---

## APPROVE?

If this plan is correct, say "execute" and I'll create each file in order with verification after each step.
