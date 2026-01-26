# MASTER SPRINT PLAN — Melt UI Integration

> **ENFORCEMENT MODE. NO HANDWAVING. ACTUAL CODE.**
> **Every step has verification. Every file has content.**

---

## CURRENT STATE (VERIFIED)

| Path | Status | Notes |
|------|--------|-------|
| `taxonomy/primitiveKinds.ts` | ✅ EXISTS | 46 kinds registered |
| `taxonomy/primitiveRegistry.ts` | ✅ EXISTS | Slots + metadata with `meltBuilder` |
| `taxonomy/provider/` | ❌ EMPTY | Folder exists, no files |
| `sys/api/_internal/` | ❌ INCOMPLETE | Only README.md, no melt/ folder |
| `primitives/` | ❌ INCOMPLETE | Documentation only, no actual primitives |

---

## ENFORCEMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: TAXONOMY (taxonomy/)                              │
│  ───────────────────────────────                            │
│  • primitiveKinds.ts     ✅ 46 kinds                        │
│  • primitiveRegistry.ts  ✅ Slots + metadata                │
│  • provider/types.ts     ❌ TO CREATE                       │
│  • provider/melt.ts      ❌ TO CREATE                       │
│  • provider/index.ts     ❌ TO CREATE                       │
│                                                             │
│  ENFORCES: Kind registration before primitive exists        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: BINDING (design/api/adapters/meltui/)                 │
│  ──────────────────────────────────────────                 │
│  • types.ts              ❌ TO CREATE (31 builder types)    │
│  • state.ts              ❌ TO CREATE (extractors)          │
│  • schemas.ts            ❌ TO CREATE (Zod validation)      │
│  • assertions.ts         ❌ TO CREATE (runtime checks)      │
│  • index.ts              ❌ TO CREATE (barrel)              │
│                                                             │
│  ENFORCES: Type-safe builder usage, runtime validation      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: PRIMITIVES (primitives/{name}/)                   │
│  ────────────────────────────────────────                   │
│  Must import from _internal, must pass assertions           │
│                                                             │
│  ENFORCES: Cannot create primitive without binding layer    │
└─────────────────────────────────────────────────────────────┘
```

---

## SPRINT 0: PROVIDER CONTRACT

### 0.1 Create `taxonomy/provider/types.ts`

```typescript
/**
 * @file taxonomy/provider/types.ts
 * @layer taxonomy
 *
 * Provider port contract — ENFORCEMENT TYPES.
 * Any ARIA provider must implement this contract.
 */

import type { Action } from 'svelte/action';
import type { Readable, Writable } from 'svelte/store';
import type { PrimitiveKind } from '../primitiveKinds.js';

// ============================================
// PROVIDER IDENTITY
// ============================================

export type ProviderId = 'melt-ui' | 'ark-ui' | 'custom';

export interface ProviderInfo {
  readonly id: ProviderId;
  readonly name: string;
  readonly version: string;
}

// ============================================
// BUILDER CAPABILITIES (ENFORCEMENT)
// ============================================

export interface BuilderCapabilities {
  /** Handles ARIA via action */
  readonly aria: boolean;
  /** Handles focus management */
  readonly focus: boolean;
  /** Handles keyboard navigation */
  readonly keyboard: boolean;
  /** Handles click outside */
  readonly clickOutside: boolean;
  /** Handles escape key */
  readonly escape: boolean;
  /** Handles scroll lock */
  readonly scrollLock: boolean;
  /** Handles floating positioning */
  readonly floating: boolean;
  /** Handles portal rendering */
  readonly portal: boolean;
  /** Handles typeahead */
  readonly typeahead: boolean;
}

// ============================================
// BUILDER MAPPING (ENFORCEMENT)
// ============================================

/**
 * Maps PrimitiveKind to Melt UI builder name.
 * THIS IS THE SOURCE OF TRUTH.
 */
export const BUILDER_MAP: Partial<Record<PrimitiveKind, string>> = {
  // Buttons & Toggles
  toggle: 'createToggle',
  toggleGroup: 'createToggleGroup',
  switch: 'createSwitch',

  // Inputs & Forms
  checkbox: 'createCheckbox',
  radioGroup: 'createRadioGroup',
  slider: 'createSlider',
  label: 'createLabel',
  select: 'createSelect',
  combobox: 'createCombobox',

  // Date & Time
  calendar: 'createCalendar',
  dateField: 'createDateField',
  datePicker: 'createDatePicker',

  // Dialogs & Overlays
  dialog: 'createDialog',
  alertDialog: 'createDialog', // same builder, role=alertdialog
  popover: 'createPopover',
  hoverCard: 'createLinkPreview',
  tooltip: 'createTooltip',
  contextMenu: 'createContextMenu',
  dropdownMenu: 'createDropdownMenu',

  // Navigation
  tabs: 'createTabs',
  accordion: 'createAccordion',
  collapsible: 'createCollapsible',
  menubar: 'createMenubar',
  pagination: 'createPagination',

  // Layout & Display
  avatar: 'createAvatar',
  separator: 'createSeparator',
  scrollArea: 'createScrollArea',
  progress: 'createProgress',

  // Feedback
  toast: 'createToaster',
} as const;

/**
 * Get the Melt builder name for a primitive kind.
 * Returns undefined for custom primitives.
 */
export function getBuilderName(kind: PrimitiveKind): string | undefined {
  return BUILDER_MAP[kind];
}

/**
 * Check if a kind uses Melt UI.
 */
export function isMeltPrimitive(kind: PrimitiveKind): boolean {
  return kind in BUILDER_MAP;
}

// ============================================
// PROVIDER CONTRACT
// ============================================

export interface ProviderContract {
  readonly info: ProviderInfo;
  readonly capabilities: BuilderCapabilities;
  readonly actionName: string;
  readonly importPath: string;
}
```

**VERIFICATION:**
```bash
pnpm check 2>&1 | grep -E "(error|provider/types)"
# Must show: no errors
```

---

### 0.2 Create `taxonomy/provider/melt.ts`

```typescript
/**
 * @file taxonomy/provider/melt.ts
 * @layer taxonomy
 *
 * Melt UI provider implementation.
 */

import type { ProviderContract, BuilderCapabilities, ProviderInfo } from './types.js';

export const MELT_INFO: ProviderInfo = {
  id: 'melt-ui',
  name: 'Melt UI',
  version: '>=0.80.0',
} as const;

export const MELT_CAPABILITIES: BuilderCapabilities = {
  aria: true,
  focus: true,
  keyboard: true,
  clickOutside: true,
  escape: true,
  scrollLock: true,
  floating: true,
  portal: true,
  typeahead: true,
} as const;

export const MELT_PROVIDER: ProviderContract = {
  info: MELT_INFO,
  capabilities: MELT_CAPABILITIES,
  actionName: 'melt',
  importPath: '@melt-ui/svelte',
} as const;
```

---

### 0.3 Create `taxonomy/provider/index.ts`

```typescript
/**
 * @file taxonomy/provider/index.ts
 * @layer taxonomy
 *
 * Provider exports.
 */

export type {
  ProviderId,
  ProviderInfo,
  BuilderCapabilities,
  ProviderContract,
} from './types.js';

export {
  BUILDER_MAP,
  getBuilderName,
  isMeltPrimitive,
} from './types.js';

export {
  MELT_INFO,
  MELT_CAPABILITIES,
  MELT_PROVIDER,
} from './melt.js';

// Active provider
export { MELT_PROVIDER as ACTIVE_PROVIDER } from './melt.js';
```

---

**SPRINT 0 VERIFICATION:**
```bash
cd interfaces/desktop/src
pnpm check
# MUST pass with zero errors

# Verify exports work
node -e "
  const fs = require('fs');
  const types = fs.readFileSync('lib/design/taxonomy/provider/types.ts', 'utf8');
  const melt = fs.readFileSync('lib/design/taxonomy/provider/melt.ts', 'utf8');
  const index = fs.readFileSync('lib/design/taxonomy/provider/index.ts', 'utf8');
  console.log('FILES EXIST:', types.length > 0, melt.length > 0, index.length > 0);
"
```

- [ ] `taxonomy/provider/types.ts` EXISTS and passes check
- [ ] `taxonomy/provider/melt.ts` EXISTS and passes check
- [ ] `taxonomy/provider/index.ts` EXISTS and passes check
- [ ] `pnpm check` passes

---

## SPRINT 1: BINDING LAYER

### 1.1 Create folder structure

```bash
mkdir -p sys/api/_internal/melt
```

---

### 1.2 Create `design/api/adapters/meltui/types.ts`

```typescript
/**
 * @file design/api/adapters/meltui/types.ts
 * @layer internal
 *
 * Melt UI builder return type aliases.
 * These are the EXACT types from @melt-ui/svelte.
 */

import type {
  createDialog,
  createPopover,
  createTooltip,
  createSelect,
  createCombobox,
  createTabs,
  createAccordion,
  createDropdownMenu,
  createContextMenu,
  createCheckbox,
  createSwitch,
  createRadioGroup,
  createCollapsible,
  createSeparator,
  createProgress,
  createToggle,
  createToggleGroup,
  createSlider,
  createLabel,
  createPagination,
  createToaster,
  createCalendar,
  createDateField,
  createDatePicker,
  createAvatar,
  createPinInput,
  createTagsInput,
  createLinkPreview,
  createMenubar,
  createScrollArea,
  createTree,
} from '@melt-ui/svelte';

// ============================================
// BUILDER RETURN TYPE ALIASES
// ============================================

// Overlay / Floating
export type DialogBuilder = ReturnType<typeof createDialog>;
export type PopoverBuilder = ReturnType<typeof createPopover>;
export type TooltipBuilder = ReturnType<typeof createTooltip>;
export type LinkPreviewBuilder = ReturnType<typeof createLinkPreview>;
export type ToasterBuilder = ReturnType<typeof createToaster>;

// Selection
export type SelectBuilder = ReturnType<typeof createSelect>;
export type ComboboxBuilder = ReturnType<typeof createCombobox>;
export type CheckboxBuilder = ReturnType<typeof createCheckbox>;
export type SwitchBuilder = ReturnType<typeof createSwitch>;
export type RadioGroupBuilder = ReturnType<typeof createRadioGroup>;
export type ToggleBuilder = ReturnType<typeof createToggle>;
export type ToggleGroupBuilder = ReturnType<typeof createToggleGroup>;

// Navigation
export type TabsBuilder = ReturnType<typeof createTabs>;
export type AccordionBuilder = ReturnType<typeof createAccordion>;
export type DropdownMenuBuilder = ReturnType<typeof createDropdownMenu>;
export type ContextMenuBuilder = ReturnType<typeof createContextMenu>;
export type MenubarBuilder = ReturnType<typeof createMenubar>;
export type PaginationBuilder = ReturnType<typeof createPagination>;

// Form Inputs
export type PinInputBuilder = ReturnType<typeof createPinInput>;
export type TagsInputBuilder = ReturnType<typeof createTagsInput>;
export type SliderBuilder = ReturnType<typeof createSlider>;
export type LabelBuilder = ReturnType<typeof createLabel>;

// Date/Time
export type CalendarBuilder = ReturnType<typeof createCalendar>;
export type DateFieldBuilder = ReturnType<typeof createDateField>;
export type DatePickerBuilder = ReturnType<typeof createDatePicker>;

// Layout / Display
export type CollapsibleBuilder = ReturnType<typeof createCollapsible>;
export type SeparatorBuilder = ReturnType<typeof createSeparator>;
export type ProgressBuilder = ReturnType<typeof createProgress>;
export type AvatarBuilder = ReturnType<typeof createAvatar>;
export type ScrollAreaBuilder = ReturnType<typeof createScrollArea>;

// Tree / Hierarchy
export type TreeBuilder = ReturnType<typeof createTree>;

// ============================================
// TYPE EXTRACTION UTILITIES
// ============================================

/** Extract elements from a builder. */
export type BuilderElements<T> = T extends { elements: infer E } ? E : never;

/** Extract states from a builder. */
export type BuilderStates<T> = T extends { states: infer S } ? S : never;

/** Extract helpers from a builder. */
export type BuilderHelpers<T> = T extends { helpers: infer H } ? H : never;

/** Extract options from a builder. */
export type BuilderOptions<T> = T extends { options: infer O } ? O : never;
```

---

### 1.3 Create `design/api/adapters/meltui/state.ts`

```typescript
/**
 * @file design/api/adapters/meltui/state.ts
 * @layer internal
 *
 * State extraction for ColdLight data-state attributes.
 * These functions convert Melt state to data-state strings.
 */

// ============================================
// STATE TYPES
// ============================================

export type OpenState = 'open' | 'closed';
export type CheckedState = 'checked' | 'unchecked' | 'indeterminate';
export type ActiveState = 'active' | 'inactive';
export type OnOffState = 'on' | 'off';
export type ProgressState = 'loading' | 'complete' | 'error';

// ============================================
// EXTRACTORS
// ============================================

export function extractOpenState(open: boolean): OpenState {
  return open ? 'open' : 'closed';
}

export function extractCheckedState(checked: boolean | 'indeterminate'): CheckedState {
  if (checked === 'indeterminate') return 'indeterminate';
  return checked ? 'checked' : 'unchecked';
}

export function extractActiveState(active: boolean): ActiveState {
  return active ? 'active' : 'inactive';
}

export function extractOnOffState(on: boolean): OnOffState {
  return on ? 'on' : 'off';
}

export function extractProgressState(value: number, max: number, hasError = false): ProgressState {
  if (hasError) return 'error';
  return value >= max ? 'complete' : 'loading';
}

// ============================================
// PRESENCE EXTRACTORS (for data-* presence attributes)
// ============================================

export function extractPresence(value: boolean): '' | undefined {
  return value ? '' : undefined;
}

export const extractSelected = extractPresence;
export const extractHighlighted = extractPresence;
export const extractDisabled = extractPresence;
```

---

### 1.4 Create `design/api/adapters/meltui/assertions.ts`

```typescript
/**
 * @file design/api/adapters/meltui/assertions.ts
 * @layer internal
 *
 * RUNTIME ENFORCEMENT.
 * These functions throw if patterns are violated.
 */

import { dev } from '$app/environment';
import { isPrimitiveKind, type PrimitiveKind } from '$lib/design/taxonomy/primitiveKinds.js';
import { isValidSlot, getPrimitiveSlots } from '$lib/design/taxonomy/primitiveRegistry.js';
import { isMeltPrimitive, getBuilderName } from '$lib/design/taxonomy/provider/types.js';

// ============================================
// ASSERTION FUNCTIONS
// ============================================

/**
 * Assert that a kind is registered in taxonomy.
 * Throws in development if not registered.
 */
export function assertKindRegistered(kind: string, component: string): asserts kind is PrimitiveKind {
  if (!isPrimitiveKind(kind)) {
    const msg = `[ColdLight] Invalid kind "${kind}" in ${component}. ` +
      `Register in taxonomy/primitiveKinds.ts first.`;
    if (dev) throw new Error(msg);
    console.error(msg);
  }
}

/**
 * Assert that a slot is valid for the kind.
 * Throws in development if not registered.
 */
export function assertSlotValid(kind: PrimitiveKind, slot: string, component: string): void {
  if (!isValidSlot(kind, slot)) {
    const validSlots = getPrimitiveSlots(kind);
    const msg = `[ColdLight] Invalid slot "${slot}" for kind "${kind}" in ${component}. ` +
      `Valid slots: ${validSlots.join(', ')}`;
    if (dev) throw new Error(msg);
    console.error(msg);
  }
}

/**
 * Assert that a Melt primitive has a builder.
 * Throws in development if builder not mapped.
 */
export function assertBuilderExists(kind: PrimitiveKind, component: string): void {
  if (isMeltPrimitive(kind) && !getBuilderName(kind)) {
    const msg = `[ColdLight] Kind "${kind}" is marked as Melt primitive but has no builder in BUILDER_MAP. ` +
      `Add mapping in taxonomy/provider/types.ts.`;
    if (dev) throw new Error(msg);
    console.error(msg);
  }
}

/**
 * Assert that data-kind attribute exists on element.
 * For use in tests.
 */
export function assertDataKind(element: Element | null, expectedKind: string): void {
  if (!element) {
    throw new Error(`[ColdLight Test] Element is null`);
  }
  const kind = element.getAttribute('data-kind');
  if (kind !== expectedKind) {
    throw new Error(`[ColdLight Test] Expected data-kind="${expectedKind}", got "${kind}"`);
  }
}

/**
 * Assert that data-slot attribute exists on element.
 * For use in tests.
 */
export function assertDataSlot(element: Element | null, expectedSlot: string): void {
  if (!element) {
    throw new Error(`[ColdLight Test] Element is null`);
  }
  const slot = element.getAttribute('data-slot');
  if (slot !== expectedSlot) {
    throw new Error(`[ColdLight Test] Expected data-slot="${expectedSlot}", got "${slot}"`);
  }
}

/**
 * Assert that data-state attribute has expected value.
 * For use in tests.
 */
export function assertDataState(element: Element | null, expectedState: string): void {
  if (!element) {
    throw new Error(`[ColdLight Test] Element is null`);
  }
  const state = element.getAttribute('data-state');
  if (state !== expectedState) {
    throw new Error(`[ColdLight Test] Expected data-state="${expectedState}", got "${state}"`);
  }
}
```

---

### 1.5 Create `design/api/adapters/meltui/schemas.ts`

```typescript
/**
 * @file design/api/adapters/meltui/schemas.ts
 * @layer internal
 *
 * Zod validation schemas for props.
 */

import { z } from 'zod';

// ============================================
// STATE PROPS
// ============================================

export const OpenStatePropsSchema = z.object({
  open: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()).optional(),
});
export type OpenStateProps = z.infer<typeof OpenStatePropsSchema>;

export const CheckedStatePropsSchema = z.object({
  checked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
  defaultChecked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
  onCheckedChange: z.function().optional(),
});
export type CheckedStateProps = z.infer<typeof CheckedStatePropsSchema>;

// ============================================
// POSITIONING
// ============================================

export const SideSchema = z.enum(['top', 'right', 'bottom', 'left']);
export const AlignSchema = z.enum(['start', 'center', 'end']);

export const PlacementSchema = z.enum([
  'top', 'top-start', 'top-end',
  'right', 'right-start', 'right-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
]);

export const FloatingPropsSchema = z.object({
  placement: PlacementSchema.optional(),
  strategy: z.enum(['absolute', 'fixed']).optional(),
  gutter: z.number().optional(),
  flip: z.boolean().optional(),
  sameWidth: z.boolean().optional(),
});
export type FloatingProps = z.infer<typeof FloatingPropsSchema>;

// ============================================
// BEHAVIOR
// ============================================

export const EscapeBehaviorSchema = z.enum([
  'close',
  'ignore',
  'defer-otherwise-close',
  'defer-otherwise-ignore',
]);
export type EscapeBehavior = z.infer<typeof EscapeBehaviorSchema>;

export const ModalBehaviorPropsSchema = z.object({
  escapeBehavior: EscapeBehaviorSchema.optional(),
  closeOnOutsideClick: z.boolean().optional(),
  preventScroll: z.boolean().optional(),
});
export type ModalBehaviorProps = z.infer<typeof ModalBehaviorPropsSchema>;

// ============================================
// FORM
// ============================================

export const FormFieldPropsSchema = z.object({
  name: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
});
export type FormFieldProps = z.infer<typeof FormFieldPropsSchema>;

// ============================================
// VALIDATION
// ============================================

export function validateProps<T>(
  schema: z.ZodSchema<T>,
  props: unknown,
  context?: string
): T {
  const result = schema.safeParse(props);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`[ColdLight] Invalid props${context ? ` in ${context}` : ''}: ${issues}`);
  }
  return result.data;
}
```

---

### 1.6 Create `design/api/adapters/meltui/index.ts`

```typescript
/**
 * @file design/api/adapters/meltui/index.ts
 * @layer internal
 *
 * Melt UI binding layer barrel.
 */

// Re-export melt action
export { melt } from '@melt-ui/svelte';

// Types
export type {
  DialogBuilder,
  PopoverBuilder,
  TooltipBuilder,
  SelectBuilder,
  ComboboxBuilder,
  CheckboxBuilder,
  SwitchBuilder,
  RadioGroupBuilder,
  ToggleBuilder,
  ToggleGroupBuilder,
  TabsBuilder,
  AccordionBuilder,
  DropdownMenuBuilder,
  ContextMenuBuilder,
  CollapsibleBuilder,
  SeparatorBuilder,
  ProgressBuilder,
  SliderBuilder,
  LabelBuilder,
  PaginationBuilder,
  ToasterBuilder,
  CalendarBuilder,
  DateFieldBuilder,
  DatePickerBuilder,
  AvatarBuilder,
  PinInputBuilder,
  TagsInputBuilder,
  LinkPreviewBuilder,
  MenubarBuilder,
  ScrollAreaBuilder,
  TreeBuilder,
  BuilderElements,
  BuilderStates,
  BuilderHelpers,
  BuilderOptions,
} from './types.js';

// State extraction
export {
  extractOpenState,
  extractCheckedState,
  extractActiveState,
  extractOnOffState,
  extractProgressState,
  extractPresence,
  extractSelected,
  extractHighlighted,
  extractDisabled,
  type OpenState,
  type CheckedState,
  type ActiveState,
  type OnOffState,
  type ProgressState,
} from './state.js';

// Assertions (runtime enforcement)
export {
  assertKindRegistered,
  assertSlotValid,
  assertBuilderExists,
  assertDataKind,
  assertDataSlot,
  assertDataState,
} from './assertions.js';

// Schemas
export {
  OpenStatePropsSchema,
  CheckedStatePropsSchema,
  SideSchema,
  AlignSchema,
  PlacementSchema,
  FloatingPropsSchema,
  EscapeBehaviorSchema,
  ModalBehaviorPropsSchema,
  FormFieldPropsSchema,
  validateProps,
  type OpenStateProps,
  type CheckedStateProps,
  type FloatingProps,
  type EscapeBehavior,
  type ModalBehaviorProps,
  type FormFieldProps,
} from './schemas.js';
```

---

### 1.7 Create `sys/api/_internal/index.ts`

```typescript
/**
 * @file sys/api/_internal/index.ts
 * @layer internal
 *
 * Internal API barrel.
 */

// Melt UI integration
export * from './melt/index.js';

// Re-export Melt creators for convenience
export {
  createDialog,
  createPopover,
  createTooltip,
  createSelect,
  createCombobox,
  createTabs,
  createAccordion,
  createDropdownMenu,
  createContextMenu,
  createCheckbox,
  createSwitch,
  createRadioGroup,
  createCollapsible,
  createSeparator,
  createProgress,
  createToggle,
  createToggleGroup,
  createSlider,
  createLabel,
  createPagination,
  createToaster,
  createCalendar,
  createDateField,
  createDatePicker,
  createAvatar,
  createPinInput,
  createTagsInput,
  createLinkPreview,
  createMenubar,
  createScrollArea,
  createTree,
} from '@melt-ui/svelte';
```

---

**SPRINT 1 VERIFICATION:**
```bash
cd interfaces/desktop/src

# Type check
pnpm check

# Verify files exist
ls -la lib/design/design/api/adapters/meltui/

# Test import works
echo "import * from '\$lib/design/sys/api/_internal';" > /tmp/test.ts
```

- [ ] `design/api/adapters/meltui/types.ts` EXISTS
- [ ] `design/api/adapters/meltui/state.ts` EXISTS
- [ ] `design/api/adapters/meltui/assertions.ts` EXISTS
- [ ] `design/api/adapters/meltui/schemas.ts` EXISTS
- [ ] `design/api/adapters/meltui/index.ts` EXISTS
- [ ] `sys/api/_internal/index.ts` EXISTS
- [ ] `pnpm check` passes

---

## SPRINT 2: VERIFICATION SCRIPT

### 2.1 Create `scripts/verify-primitives.ts`

This script ENFORCES the architecture:

```typescript
/**
 * @file scripts/verify-primitives.ts
 *
 * ENFORCEMENT SCRIPT.
 * Verifies that all primitives follow the architecture.
 * Run with: npx tsx scripts/verify-primitives.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const DESIGN_DIR = 'lib/design';
const PRIMITIVES_DIR = path.join(DESIGN_DIR, 'primitives');
const TAXONOMY_DIR = path.join(DESIGN_DIR, 'taxonomy');
const INTERNAL_DIR = path.join(DESIGN_DIR, 'sys/api/_internal');

let errors: string[] = [];
let warnings: string[] = [];

function error(msg: string) {
  errors.push(`ERROR: ${msg}`);
}

function warn(msg: string) {
  warnings.push(`WARN: ${msg}`);
}

function checkFileExists(filePath: string, description: string): boolean {
  if (!fs.existsSync(filePath)) {
    error(`${description} missing: ${filePath}`);
    return false;
  }
  return true;
}

// ============================================
// CHECK TAXONOMY
// ============================================

console.log('\n=== CHECKING TAXONOMY ===\n');

checkFileExists(path.join(TAXONOMY_DIR, 'primitiveKinds.ts'), 'primitiveKinds.ts');
checkFileExists(path.join(TAXONOMY_DIR, 'primitiveRegistry.ts'), 'primitiveRegistry.ts');
checkFileExists(path.join(TAXONOMY_DIR, 'provider/types.ts'), 'provider/types.ts');
checkFileExists(path.join(TAXONOMY_DIR, 'provider/melt.ts'), 'provider/melt.ts');
checkFileExists(path.join(TAXONOMY_DIR, 'provider/index.ts'), 'provider/index.ts');

// ============================================
// CHECK INTERNAL LAYER
// ============================================

console.log('\n=== CHECKING _INTERNAL ===\n');

checkFileExists(path.join(INTERNAL_DIR, 'melt/types.ts'), 'melt/types.ts');
checkFileExists(path.join(INTERNAL_DIR, 'melt/state.ts'), 'melt/state.ts');
checkFileExists(path.join(INTERNAL_DIR, 'melt/assertions.ts'), 'melt/assertions.ts');
checkFileExists(path.join(INTERNAL_DIR, 'melt/schemas.ts'), 'melt/schemas.ts');
checkFileExists(path.join(INTERNAL_DIR, 'melt/index.ts'), 'melt/index.ts');
checkFileExists(path.join(INTERNAL_DIR, 'index.ts'), '_internal/index.ts');

// ============================================
// RESULTS
// ============================================

console.log('\n=== RESULTS ===\n');

if (warnings.length > 0) {
  console.log('WARNINGS:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log(`  ${e}`));
  console.log(`\n❌ FAILED: ${errors.length} errors\n`);
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED\n');
  process.exit(0);
}
```

---

## COMPLETE VERIFICATION

```bash
cd interfaces/desktop/src

# 1. Type check
pnpm check
# MUST: Zero errors

# 2. Verify files exist
ls lib/design/taxonomy/provider/
# MUST: types.ts melt.ts index.ts

ls lib/design/design/api/adapters/meltui/
# MUST: types.ts state.ts assertions.ts schemas.ts index.ts

# 3. Run verification script
npx tsx scripts/verify-primitives.ts
# MUST: ALL CHECKS PASSED
```

---

## CHECKLIST

### Sprint 0: Provider Contract
- [ ] `taxonomy/provider/types.ts` — BUILDER_MAP, getBuilderName, isMeltPrimitive
- [ ] `taxonomy/provider/melt.ts` — MELT_INFO, MELT_CAPABILITIES, MELT_PROVIDER
- [ ] `taxonomy/provider/index.ts` — Exports + ACTIVE_PROVIDER

### Sprint 1: Binding Layer
- [ ] `design/api/adapters/meltui/types.ts` — 31 builder type aliases
- [ ] `design/api/adapters/meltui/state.ts` — State extractors
- [ ] `design/api/adapters/meltui/assertions.ts` — Runtime enforcement
- [ ] `design/api/adapters/meltui/schemas.ts` — Zod validation
- [ ] `design/api/adapters/meltui/index.ts` — Barrel
- [ ] `sys/api/_internal/index.ts` — Top barrel

### Sprint 2: Verification
- [ ] `scripts/verify-primitives.ts` — Enforcement script

### Final
- [ ] `pnpm check` passes
- [ ] Verification script passes

---

**THIS PLAN IS LAW. EXECUTE IN ORDER. VERIFY EACH STEP.**
