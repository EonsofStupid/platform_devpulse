# _internal/melt/ — Complete Sprint Plan

> **Binding layer mapping all 31 Melt UI builders 1:1 to ColdLight**
> **This is LAW. No shortcuts. No drift.**

---

## ARCHITECTURE

```
interfaces/desktop/src/lib/design/
├── sys/api/
│   └── _internal/
│       ├── README.md              # Integration docs
│       ├── index.ts               # Barrel export
│       └── melt/
│           ├── index.ts           # Melt barrel
│           ├── types.ts           # Builder return types
│           ├── state.ts           # State extraction helpers
│           ├── schemas.ts         # Zod validation schemas
│           └── builders/          # Per-builder type exports
│               ├── dialog.ts
│               ├── select.ts
│               └── ...
├── taxonomy/
│   ├── primitiveKinds.ts          # 46 primitive kinds
│   ├── primitiveRegistry.ts       # Slots + metadata
│   └── provider/                  # NEW: Provider port contract
│       ├── index.ts
│       ├── types.ts               # Provider interface
│       └── melt.ts                # Melt implementation
└── primitives/
    └── {kind}/                    # One folder per primitive
```

---

## SPRINT 0: PROVIDER PORT CONTRACT

### 0.1 Create `taxonomy/provider/types.ts`

```typescript
/**
 * @file taxonomy/provider/types.ts
 * @layer taxonomy
 *
 * Provider port contract — defines what an ARIA provider must expose.
 * ColdLight can swap Melt UI for another provider (Ark UI, React Aria, etc.)
 * as long as it implements this contract.
 */

import type { Action } from 'svelte/action';
import type { Readable, Writable } from 'svelte/store';

// ============================================
// PROVIDER IDENTITY
// ============================================

export type ProviderId = 'melt-ui' | 'ark-ui' | 'react-aria' | 'custom';

export interface ProviderInfo {
  id: ProviderId;
  name: string;
  version: string;
  description: string;
}

// ============================================
// BUILDER CAPABILITIES
// ============================================

export interface BuilderCapabilities {
  /** Handles ARIA attributes via action */
  aria: boolean;
  /** Handles focus management */
  focus: boolean;
  /** Handles keyboard navigation */
  keyboard: boolean;
  /** Handles click outside */
  clickOutside: boolean;
  /** Handles escape key */
  escape: boolean;
  /** Handles scroll lock */
  scrollLock: boolean;
  /** Handles floating positioning */
  floating: boolean;
  /** Handles portal rendering */
  portal: boolean;
  /** Handles typeahead */
  typeahead: boolean;
}

// ============================================
// GENERIC BUILDER RETURN
// ============================================

export interface GenericBuilder<
  TElements extends Record<string, unknown>,
  TStates extends Record<string, Readable<unknown> | Writable<unknown>>,
  THelpers extends Record<string, (...args: unknown[]) => unknown> = Record<string, never>,
  TOptions extends Record<string, Writable<unknown>> = Record<string, never>,
> {
  elements: TElements;
  states: TStates;
  helpers?: THelpers;
  options?: TOptions;
}

// ============================================
// ELEMENT BUILDER (for use:melt)
// ============================================

export interface ElementBuilder {
  /** Action to apply to element */
  action?: Action;
  /** Attributes to spread */
  [key: string]: unknown;
}

// ============================================
// PROVIDER CONTRACT
// ============================================

export interface ProviderContract {
  /** Provider identity */
  info: ProviderInfo;

  /** What this provider handles */
  capabilities: BuilderCapabilities;

  /** The action directive name (e.g., 'melt' for use:melt) */
  actionName: string;

  /** Import path for the provider */
  importPath: string;
}
```

### 0.2 Create `taxonomy/provider/melt.ts`

```typescript
/**
 * @file taxonomy/provider/melt.ts
 * @layer taxonomy
 *
 * Melt UI provider implementation.
 */

import type { ProviderContract, BuilderCapabilities, ProviderInfo } from './types.js';

export const MELT_PROVIDER_INFO: ProviderInfo = {
  id: 'melt-ui',
  name: 'Melt UI',
  version: '>=0.80.0',
  description: 'Headless UI components for Svelte with full ARIA support',
};

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
};

export const MELT_PROVIDER: ProviderContract = {
  info: MELT_PROVIDER_INFO,
  capabilities: MELT_CAPABILITIES,
  actionName: 'melt',
  importPath: '@melt-ui/svelte',
};
```

### 0.3 Create `taxonomy/provider/index.ts`

```typescript
/**
 * @file taxonomy/provider/index.ts
 * @layer taxonomy
 *
 * Provider port contract exports.
 */

export type {
  ProviderId,
  ProviderInfo,
  BuilderCapabilities,
  GenericBuilder,
  ElementBuilder,
  ProviderContract,
} from './types.js';

export {
  MELT_PROVIDER_INFO,
  MELT_CAPABILITIES,
  MELT_PROVIDER,
} from './melt.js';

// Current active provider
export { MELT_PROVIDER as CURRENT_PROVIDER } from './melt.js';
```

**Checklist:**
- [ ] `taxonomy/provider/types.ts` created
- [ ] `taxonomy/provider/melt.ts` created
- [ ] `taxonomy/provider/index.ts` created
- [ ] `pnpm check` passes

---

## SPRINT 1: _internal/melt/ STRUCTURE

### 1.1 Create `sys/api/_internal/melt/types.ts`

```typescript
/**
 * @file sys/api/_internal/melt/types.ts
 * @layer internal
 *
 * Melt UI builder return types for ColdLight context typing.
 */

import type {
  CreateDialogReturn,
  CreatePopoverReturn,
  CreateTooltipReturn,
  CreateSelectReturn,
  CreateComboboxReturn,
  CreateTabsReturn,
  CreateAccordionReturn,
  CreateDropdownMenuReturn,
  CreateContextMenuReturn,
  CreateCheckboxReturn,
  CreateSwitchReturn,
  CreateRadioGroupReturn,
  CreateCollapsibleReturn,
  CreateSeparatorReturn,
  CreateProgressReturn,
  CreateToggleReturn,
  CreateToggleGroupReturn,
  CreateSliderReturn,
  CreatePaginationReturn,
  CreateToasterReturn,
  CreateCalendarReturn,
  CreateDateFieldReturn,
  CreateDatePickerReturn,
  CreateAvatarReturn,
  CreatePinInputReturn,
  CreateTagsInputReturn,
  CreateLinkPreviewReturn,
  CreateMenubarReturn,
  CreateScrollAreaReturn,
  CreateTreeReturn,
} from '@melt-ui/svelte';

// ============================================
// BUILDER TYPE ALIASES
// ============================================

// Overlay / Floating
export type DialogBuilder = CreateDialogReturn;
export type PopoverBuilder = CreatePopoverReturn;
export type TooltipBuilder = CreateTooltipReturn;
export type LinkPreviewBuilder = CreateLinkPreviewReturn;
export type ToasterBuilder = CreateToasterReturn;

// Selection
export type SelectBuilder = CreateSelectReturn;
export type ComboboxBuilder = CreateComboboxReturn;
export type CheckboxBuilder = CreateCheckboxReturn;
export type SwitchBuilder = CreateSwitchReturn;
export type RadioGroupBuilder = CreateRadioGroupReturn;
export type ToggleBuilder = CreateToggleReturn;
export type ToggleGroupBuilder = CreateToggleGroupReturn;

// Navigation
export type TabsBuilder = CreateTabsReturn;
export type AccordionBuilder = CreateAccordionReturn;
export type DropdownMenuBuilder = CreateDropdownMenuReturn;
export type ContextMenuBuilder = CreateContextMenuReturn;
export type MenubarBuilder = CreateMenubarReturn;
export type PaginationBuilder = CreatePaginationReturn;

// Form Inputs
export type PinInputBuilder = CreatePinInputReturn;
export type TagsInputBuilder = CreateTagsInputReturn;
export type SliderBuilder = CreateSliderReturn;

// Date/Time
export type CalendarBuilder = CreateCalendarReturn;
export type DateFieldBuilder = CreateDateFieldReturn;
export type DatePickerBuilder = CreateDatePickerReturn;

// Layout / Display
export type CollapsibleBuilder = CreateCollapsibleReturn;
export type SeparatorBuilder = CreateSeparatorReturn;
export type ProgressBuilder = CreateProgressReturn;
export type AvatarBuilder = CreateAvatarReturn;
export type ScrollAreaBuilder = CreateScrollAreaReturn;

// Tree / Hierarchy
export type TreeBuilder = CreateTreeReturn;

// ============================================
// TYPE EXTRACTION UTILITIES
// ============================================

/**
 * Extract elements from a builder return type.
 */
export type BuilderElements<T> = T extends { elements: infer E } ? E : never;

/**
 * Extract states from a builder return type.
 */
export type BuilderStates<T> = T extends { states: infer S } ? S : never;

/**
 * Extract helpers from a builder return type.
 */
export type BuilderHelpers<T> = T extends { helpers: infer H } ? H : never;

/**
 * Extract options from a builder return type.
 */
export type BuilderOptions<T> = T extends { options: infer O } ? O : never;
```

### 1.2 Create `sys/api/_internal/melt/state.ts`

```typescript
/**
 * @file sys/api/_internal/melt/state.ts
 * @layer internal
 *
 * State extraction helpers for ColdLight data-state attributes.
 */

// ============================================
// OPEN/CLOSED STATE
// ============================================

export type OpenState = 'open' | 'closed';

/**
 * Extract open/closed state string for data-state attribute.
 */
export function extractOpenState(open: boolean): OpenState {
  return open ? 'open' : 'closed';
}

// ============================================
// CHECKED STATE
// ============================================

export type CheckedState = 'checked' | 'unchecked' | 'indeterminate';

/**
 * Extract checked state string for data-state attribute.
 */
export function extractCheckedState(
  checked: boolean | 'indeterminate'
): CheckedState {
  if (checked === 'indeterminate') return 'indeterminate';
  return checked ? 'checked' : 'unchecked';
}

// ============================================
// ACTIVE/INACTIVE STATE
// ============================================

export type ActiveState = 'active' | 'inactive';

/**
 * Extract active/inactive state for data-state attribute.
 */
export function extractActiveState(active: boolean): ActiveState {
  return active ? 'active' : 'inactive';
}

// ============================================
// ON/OFF STATE
// ============================================

export type OnOffState = 'on' | 'off';

/**
 * Extract on/off state for data-state attribute (alternative to checked).
 */
export function extractOnOffState(on: boolean): OnOffState {
  return on ? 'on' : 'off';
}

// ============================================
// PROGRESS STATE
// ============================================

export type ProgressState = 'loading' | 'complete' | 'error';

/**
 * Extract progress state for data-state attribute.
 */
export function extractProgressState(
  value: number,
  max: number,
  hasError = false
): ProgressState {
  if (hasError) return 'error';
  return value >= max ? 'complete' : 'loading';
}

// ============================================
// SELECTION STATE
// ============================================

/**
 * Check if item is selected (returns presence attribute value).
 */
export function extractSelected(selected: boolean): '' | undefined {
  return selected ? '' : undefined;
}

/**
 * Check if item is highlighted (returns presence attribute value).
 */
export function extractHighlighted(highlighted: boolean): '' | undefined {
  return highlighted ? '' : undefined;
}

/**
 * Check if item is disabled (returns presence attribute value).
 */
export function extractDisabled(disabled: boolean): '' | undefined {
  return disabled ? '' : undefined;
}
```

### 1.3 Create `sys/api/_internal/melt/schemas.ts`

```typescript
/**
 * @file sys/api/_internal/melt/schemas.ts
 * @layer internal
 *
 * Zod validation schemas for props at the boundary.
 */

import { z } from 'zod';

// ============================================
// COMMON PROP SCHEMAS
// ============================================

/**
 * Open/close state props schema.
 */
export const OpenStatePropsSchema = z.object({
  open: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
  onOpenChange: z
    .function()
    .args(z.boolean())
    .returns(z.void())
    .optional(),
});

export type OpenStateProps = z.infer<typeof OpenStatePropsSchema>;

/**
 * Checked state props schema.
 */
export const CheckedStatePropsSchema = z.object({
  checked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
  defaultChecked: z.union([z.boolean(), z.literal('indeterminate')]).optional(),
  onCheckedChange: z
    .function()
    .args(z.union([z.boolean(), z.literal('indeterminate')]))
    .returns(z.void())
    .optional(),
});

export type CheckedStateProps = z.infer<typeof CheckedStatePropsSchema>;

/**
 * Value state props schema (generic).
 */
export const ValueStatePropsSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema.optional(),
    defaultValue: valueSchema.optional(),
    onValueChange: z
      .function()
      .args(valueSchema)
      .returns(z.void())
      .optional(),
  });

// ============================================
// POSITIONING SCHEMAS
// ============================================

export const SideSchema = z.enum(['top', 'right', 'bottom', 'left']);
export const AlignSchema = z.enum(['start', 'center', 'end']);

export const PlacementSchema = z.enum([
  'top',
  'top-start',
  'top-end',
  'right',
  'right-start',
  'right-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
]);

/**
 * Floating positioning props schema.
 */
export const FloatingPropsSchema = z.object({
  placement: PlacementSchema.optional(),
  strategy: z.enum(['absolute', 'fixed']).optional(),
  gutter: z.number().optional(),
  offset: z
    .object({
      mainAxis: z.number().optional(),
      crossAxis: z.number().optional(),
    })
    .optional(),
  flip: z.boolean().optional(),
  overlap: z.boolean().optional(),
  fitViewport: z.boolean().optional(),
  sameWidth: z.boolean().optional(),
});

export type FloatingProps = z.infer<typeof FloatingPropsSchema>;

// ============================================
// BEHAVIOR SCHEMAS
// ============================================

export const EscapeBehaviorSchema = z.enum([
  'close',
  'ignore',
  'defer-otherwise-close',
  'defer-otherwise-ignore',
]);

export type EscapeBehavior = z.infer<typeof EscapeBehaviorSchema>;

/**
 * Modal behavior props schema.
 */
export const ModalBehaviorPropsSchema = z.object({
  escapeBehavior: EscapeBehaviorSchema.optional(),
  closeOnOutsideClick: z.boolean().optional(),
  preventScroll: z.boolean().optional(),
});

export type ModalBehaviorProps = z.infer<typeof ModalBehaviorPropsSchema>;

// ============================================
// FORM SCHEMAS
// ============================================

/**
 * Form field props schema.
 */
export const FormFieldPropsSchema = z.object({
  name: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

export type FormFieldProps = z.infer<typeof FormFieldPropsSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate props at boundary.
 */
export function validateProps<T>(
  schema: z.ZodSchema<T>,
  props: unknown,
  context?: string
): T {
  const result = schema.safeParse(props);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(
      `[ColdLight] Invalid props${context ? ` in ${context}` : ''}: ${message}`
    );
  }
  return result.data;
}

/**
 * Safe parse without throwing.
 */
export function safeValidateProps<T>(
  schema: z.ZodSchema<T>,
  props: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  return schema.safeParse(props);
}
```

### 1.4 Create `sys/api/_internal/melt/index.ts`

```typescript
/**
 * @file sys/api/_internal/melt/index.ts
 * @layer internal
 *
 * Melt UI integration layer barrel export.
 */

// Re-export melt action from @melt-ui/svelte
export { melt } from '@melt-ui/svelte';

// Builder types
export type {
  // Overlay / Floating
  DialogBuilder,
  PopoverBuilder,
  TooltipBuilder,
  LinkPreviewBuilder,
  ToasterBuilder,
  // Selection
  SelectBuilder,
  ComboboxBuilder,
  CheckboxBuilder,
  SwitchBuilder,
  RadioGroupBuilder,
  ToggleBuilder,
  ToggleGroupBuilder,
  // Navigation
  TabsBuilder,
  AccordionBuilder,
  DropdownMenuBuilder,
  ContextMenuBuilder,
  MenubarBuilder,
  PaginationBuilder,
  // Form Inputs
  PinInputBuilder,
  TagsInputBuilder,
  SliderBuilder,
  // Date/Time
  CalendarBuilder,
  DateFieldBuilder,
  DatePickerBuilder,
  // Layout / Display
  CollapsibleBuilder,
  SeparatorBuilder,
  ProgressBuilder,
  AvatarBuilder,
  ScrollAreaBuilder,
  // Tree
  TreeBuilder,
  // Utilities
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
  extractSelected,
  extractHighlighted,
  extractDisabled,
  type OpenState,
  type CheckedState,
  type ActiveState,
  type OnOffState,
  type ProgressState,
} from './state.js';

// Validation schemas
export {
  OpenStatePropsSchema,
  CheckedStatePropsSchema,
  ValueStatePropsSchema,
  SideSchema,
  AlignSchema,
  PlacementSchema,
  FloatingPropsSchema,
  EscapeBehaviorSchema,
  ModalBehaviorPropsSchema,
  FormFieldPropsSchema,
  validateProps,
  safeValidateProps,
  type OpenStateProps,
  type CheckedStateProps,
  type FloatingProps,
  type EscapeBehavior,
  type ModalBehaviorProps,
  type FormFieldProps,
} from './schemas.js';
```

### 1.5 Create `sys/api/_internal/index.ts`

```typescript
/**
 * @file sys/api/_internal/index.ts
 * @layer internal
 *
 * _internal API layer barrel export.
 * Integrates Melt UI (ARIA provider) with ColdLight (design system).
 */

// Melt UI integration
export * from './melt/index.js';

// Re-export common Melt creators for convenience
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

**Checklist:**
- [ ] `sys/api/_internal/melt/types.ts` created
- [ ] `sys/api/_internal/melt/state.ts` created
- [ ] `sys/api/_internal/melt/schemas.ts` created
- [ ] `sys/api/_internal/melt/index.ts` created
- [ ] `sys/api/_internal/index.ts` created
- [ ] `pnpm check` passes

---

## SPRINT 2: UPDATE README

### 2.1 Update `sys/api/_internal/README.md`

Replace existing content with updated architecture documentation.

**Checklist:**
- [ ] README.md updated with new structure
- [ ] Architecture diagram updated
- [ ] File index updated

---

## SPRINT 3: BUILDER-SPECIFIC TYPES (OPTIONAL)

Create individual type files for complex builders if needed:

```
sys/api/_internal/melt/builders/
├── dialog.ts        # Dialog-specific types
├── select.ts        # Select-specific types
├── combobox.ts      # Combobox-specific types
├── dropdown-menu.ts # Menu-specific types
└── ...
```

This is optional but useful for complex builders with many options.

---

## VERIFICATION CHECKLIST

### Provider Contract (Sprint 0)
- [ ] `taxonomy/provider/types.ts` — ProviderContract interface
- [ ] `taxonomy/provider/melt.ts` — Melt implementation
- [ ] `taxonomy/provider/index.ts` — Exports + CURRENT_PROVIDER

### Binding Layer (Sprint 1)
- [ ] `sys/api/_internal/melt/types.ts` — All 31 builder types
- [ ] `sys/api/_internal/melt/state.ts` — State extraction helpers
- [ ] `sys/api/_internal/melt/schemas.ts` — Zod validation
- [ ] `sys/api/_internal/melt/index.ts` — Barrel export
- [ ] `sys/api/_internal/index.ts` — Top-level export

### Integration
- [ ] All primitives can import from `'$lib/design/sys/api/_internal'`
- [ ] Types match actual Melt UI return values
- [ ] State helpers produce correct data-state values
- [ ] Schemas validate props correctly

### Commands
```bash
cd interfaces/desktop/src

# Type check entire project
pnpm check

# Verify imports work
pnpm build
```

---

## SUMMARY

| Sprint | Files | Purpose |
|--------|-------|---------|
| 0 | `taxonomy/provider/*` | Provider port contract |
| 1 | `sys/api/_internal/melt/*` | Melt binding layer |
| 2 | `sys/api/_internal/README.md` | Documentation |
| 3 | `sys/api/_internal/melt/builders/*` | Optional per-builder types |

**Total: 8 new files, 1 updated file**

---

## NEXT STEPS AFTER COMPLETION

1. Implement primitives using this binding layer
2. Each primitive imports types from `sys/api/_internal`
3. Each primitive uses state helpers for `data-state`
4. Each primitive validates props with schemas

**This sprint plan is LAW. Execute in order. No shortcuts.**
