# bits-ui v2.15.4 Complete API Reference

> **Extracted**: 2026-01-21
> **Source**: `node_modules/bits-ui/dist/`
> **Purpose**: Authoritative reference for ColdLight primitive development

---

## Table of Contents

1. [Main Exports](#main-exports)
2. [Shared Exports](#shared-exports)
3. [Internal Types](#internal-types)
4. [Utilities](#utilities)
5. [Component APIs](#component-apis)
   - [Select](#select)
   - [Tooltip](#tooltip)
   - [Dialog](#dialog)
   - [Popover](#popover)
   - [Tabs](#tabs)

---

## Main Exports

```typescript
// bits-ui/dist/index.d.ts
export {
  Accordion,
  AlertDialog,
  AspectRatio,
  Avatar,
  BitsConfig,
  Button,
  Calendar,
  Checkbox,
  Collapsible,
  Combobox,
  Command,
  ContextMenu,
  DateField,
  DatePicker,
  DateRangeField,
  DateRangePicker,
  Dialog,
  DropdownMenu,
  Label,
  LinkPreview,
  Menubar,
  Meter,
  NavigationMenu,
  Pagination,
  PinInput,
  Popover,
  Progress,
  RadioGroup,
  RangeCalendar,
  RatingGroup,
  ScrollArea,
  Select,
  Separator,
  Slider,
  Switch,
  Tabs,
  TimeField,
  TimeRangeField,
  Toggle,
  ToggleGroup,
  Toolbar,
  Tooltip,
  Portal,
  IsUsingKeyboard,
  computeCommandScore,
  getBitsConfig,
} from "./bits/index.js";

export * from "./shared/index.js";
export type * from "./shared/index.js";
export * from "./types.js";
```

---

## Shared Exports

```typescript
// bits-ui/dist/shared/index.d.ts

// Pin Input Patterns
export {
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "../bits/pin-input/pin-input.svelte.js";

// Common Types
export type Selected<Value> = {
  value: Value;
  label?: string;
};

export type SegmentPart =
  | "month" | "day" | "year"
  | "hour" | "minute" | "second"
  | "dayPeriod" | "timeZoneName" | "literal";

export type FocusTarget = string | HTMLElement | SVGElement | null;
export type FocusProp = FocusTarget | ((defaultEl?: HTMLElement | null) => FocusTarget);

export type StyleProperties = CSS.Properties & {
  [str: `--${string}`]: any;
};

export type Orientation = "horizontal" | "vertical";
export type Direction = "ltr" | "rtl";
export type SliderThumbPositioning = "exact" | "contain";

// Utility Types
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

// Re-exports
export { mergeProps } from "svelte-toolbelt";
export { useId } from "../internal/use-id.js";
export * from "./attributes.js";
export * from "./types.js";
```

---

## Internal Types

### WithChild Pattern (CRITICAL)

```typescript
// bits-ui/dist/internal/types.d.ts

export type OnChangeFn<T> = (value: T) => void;
export type ElementRef = Box<HTMLElement | null>;

/**
 * The core pattern for bits-ui component props.
 *
 * @template Props - Component-specific props
 * @template SnippetProps - Props passed to child/children snippets
 * @template Ref - Element type for ref binding
 */
export type WithChild<
  Props extends Record<PropertyKey, unknown> = {},
  SnippetProps extends Record<PropertyKey, unknown> = { _default: never },
  Ref = HTMLElement
> = Omit<Props, "child" | "children"> & {
  /**
   * Render delegation snippet - receives { props, ...SnippetProps }
   * MUST spread props onto rendered element for accessibility
   */
  child?: SnippetProps extends { _default: never }
    ? Snippet<[{ props: Record<string, unknown> }]>
    : Snippet<[SnippetProps & { props: Record<string, unknown> }]>;

  /**
   * Default children snippet - receives SnippetProps (no props to spread)
   */
  children?: SnippetProps extends { _default: never }
    ? Snippet
    : Snippet<[SnippetProps]>;

  style?: StyleProperties | string | null | undefined;
  ref?: Ref | null | undefined;
};

/**
 * Similar to WithChild but children snippet doesn't receive SnippetProps
 */
export type WithChildNoChildrenSnippetProps<
  Props extends Record<PropertyKey, unknown> = {},
  SnippetProps extends Record<PropertyKey, unknown> = { _default: never },
  Ref = HTMLElement
> = Omit<Props, "child" | "children"> & {
  child?: SnippetProps extends { _default: never }
    ? Snippet<[{ props: Record<string, unknown> }]>
    : Snippet<[SnippetProps & { props: Record<string, unknown> }]>;
  children?: Snippet;
  style?: StyleProperties | string | null | undefined;
  ref?: Ref | null | undefined;
};

/**
 * Simple children-only pattern
 */
export type WithChildren<Props = {}> = Props & {
  children?: Snippet | undefined;
};

/**
 * Omits properties from T that exist in U
 */
export type Without<T extends object, U extends object> = Omit<T, keyof U>;

export type Arrayable<T> = T[] | T;
```

### Primitive Attributes

```typescript
// bits-ui/dist/shared/attributes.d.ts

// bits-ui removes `id`, `style`, `children` from HTML attributes
// id is required internally, style is typed differently, children uses snippets

type BitsPrimitive<T> = Omit<T, "style" | "id" | "children"> & {
  id?: string;  // NOT null - bits-ui requires string | undefined
};

export type BitsPrimitiveButtonAttributes = BitsPrimitive<HTMLButtonAttributes>;
export type BitsPrimitiveDivAttributes = BitsPrimitive<HTMLDivAttributes>;
export type BitsPrimitiveInputAttributes = BitsPrimitive<HTMLInputAttributes>;
export type BitsPrimitiveSpanAttributes = BitsPrimitive<HTMLSpanAttributes>;
// ... etc
```

---

## Utilities

### Directory Structure

```
bits-ui/dist/bits/utilities/
├── arrow/                    # Arrow component for floating elements
├── config/                   # BitsConfig provider
├── dismissible-layer/        # Outside click/interaction handling
├── escape-layer/             # Escape key handling
├── floating-layer/           # Floating UI positioning
│   └── components/
│       ├── floating-layer.svelte
│       ├── floating-layer-anchor.svelte
│       ├── floating-layer-arrow.svelte
│       ├── floating-layer-content.svelte
│       └── floating-layer-content-static.svelte
├── focus-scope/              # Focus trapping
├── hidden-input.svelte       # Form hidden inputs
├── is-using-keyboard/        # Keyboard detection
├── mounted.svelte            # Mount detection
├── popper-layer/             # Combined floating + dismissible + escape
├── portal/                   # Portal rendering
├── presence-layer/           # Presence/animation handling
├── scroll-lock/              # Scroll prevention
├── text-selection-layer/     # Text selection control
└── visually-hidden/          # Screen reader only content
```

### FloatingLayer

```typescript
// Export path: bits-ui/dist/bits/utilities/floating-layer/index.d.ts
export * as FloatingLayer from "./components/index.js";

// Components:
export { default as Anchor } from "./floating-layer-anchor.svelte";
export { default as Arrow } from "./floating-layer-arrow.svelte";
export { default as Content } from "./floating-layer-content.svelte";
export { default as ContentStatic } from "./floating-layer-content-static.svelte";
export { default as Root } from "./floating-layer.svelte";

// Types:
export type FloatingLayerContentProps = {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  arrowPadding?: number;
  avoidCollisions?: boolean;
  collisionBoundary?: Arrayable<Boundary>;
  collisionPadding?: number | Partial<Record<Side, number>>;
  sticky?: "partial" | "always";
  hideWhenDetached?: boolean;
  updatePositionStrategy?: "optimized" | "always";
  strategy?: "absolute" | "fixed";
  dir?: Direction;
  preventScroll?: boolean;
  customAnchor?: string | HTMLElement | Measurable | null;
  content?: Snippet<[{ props: Record<string, unknown>; wrapperProps: Record<string, unknown> }]>;
};
```

### Arrow

```typescript
// Export path: bits-ui/dist/bits/utilities/arrow/index.d.ts
export { default as Arrow } from "./arrow.svelte";
export type { ArrowProps } from "./types.js";

// Types:
export type ArrowPropsWithoutHTML = WithChild<{
  width?: number;   // default: 10
  height?: number;  // default: 5
}>;

export type ArrowProps = ArrowPropsWithoutHTML & BitsPrimitiveSpanAttributes;
```

### PresenceLayer

```typescript
// Export path: bits-ui/dist/bits/utilities/presence-layer/index.d.ts
export { default as PresenceLayer } from "./presence-layer.svelte";
export type { PresenceLayerProps } from "./types.js";

// Types:
export type PresenceLayerProps = {
  forceMount?: boolean;
};

export type PresenceLayerImplProps = PresenceLayerProps & {
  open: boolean;
  presence?: Snippet<[{ present: boolean }]>;
  ref: ReadableBox<HTMLElement | null>;
};
```

### FocusScope

```typescript
// Export path: bits-ui/dist/bits/utilities/focus-scope/index.d.ts
export { default as FocusScope } from "./focus-scope.svelte";
export type { FocusScopeProps } from "./types.js";

// Types:
export type FocusScopeProps = {
  onOpenAutoFocus?: EventCallback;
  onCloseAutoFocus?: EventCallback;
  trapFocus?: boolean;  // default: false
};
```

### DismissibleLayer

```typescript
// Export path: bits-ui/dist/bits/utilities/dismissible-layer/index.d.ts
export { default as DismissibleLayer } from "./dismissible-layer.svelte";
export type { DismissibleLayerProps } from "./types.js";

// Types:
export type InteractOutsideBehaviorType =
  | "close"
  | "defer-otherwise-close"
  | "defer-otherwise-ignore"
  | "ignore";

export type DismissibleLayerProps = {
  onInteractOutside?: (e: PointerEvent) => void;
  interactOutsideBehavior?: InteractOutsideBehaviorType;  // default: "close"
  onFocusOutside?: (event: FocusEvent) => void;
};
```

### EscapeLayer

```typescript
// Export path: bits-ui/dist/bits/utilities/escape-layer/index.d.ts
export { default as EscapeLayer } from "./escape-layer.svelte";
export type { EscapeLayerProps } from "./types.js";

// Types:
export type EscapeBehaviorType =
  | "close"
  | "defer-otherwise-close"
  | "defer-otherwise-ignore"
  | "ignore";

export type EscapeLayerProps = {
  onEscapeKeydown?: (e: KeyboardEvent) => void;
  escapeKeydownBehavior?: EscapeBehaviorType;  // default: "close"
};
```

### Portal

```typescript
// Export path: bits-ui/dist/bits/utilities/portal/index.d.ts
export { default as Portal } from "./portal.svelte";
export type { PortalProps } from "./types.js";

// Types:
export type PortalProps = {
  to?: string | HTMLElement;  // default: body
  disabled?: boolean;
  children?: Snippet;
};
```

---

## Component APIs

### Select

#### Exports

```typescript
// bits-ui/dist/bits/select/exports.d.ts

export { default as Root } from "./components/select.svelte";
export { default as Content } from "./components/select-content.svelte";
export { default as ContentStatic } from "./components/select-content-static.svelte";
export { default as Item } from "./components/select-item.svelte";
export { default as Group } from "./components/select-group.svelte";
export { default as GroupHeading } from "./components/select-group-heading.svelte";
export { default as Trigger } from "./components/select-trigger.svelte";
export { default as Portal } from "../utilities/portal/portal.svelte";
export { default as Viewport } from "./components/select-viewport.svelte";
export { default as ScrollUpButton } from "./components/select-scroll-up-button.svelte";
export { default as ScrollDownButton } from "./components/select-scroll-down-button.svelte";

// NOTE: No Arrow export - use FloatingLayer.Arrow or utilities/arrow
// NOTE: No ItemText export - ColdLight must provide this
// NOTE: No Separator export - ColdLight must provide this
```

#### Types

```typescript
// Root Props
export type SelectBaseRootPropsWithoutHTML = WithChildren<{
  disabled?: boolean;           // default: false
  required?: boolean;           // default: false
  name?: string;                // for form submission
  open?: boolean;               // default: false, bindable
  onOpenChange?: OnChangeFn<boolean>;
  onOpenChangeComplete?: OnChangeFn<boolean>;
  loop?: boolean;               // default: false
  scrollAlignment?: "nearest" | "center";  // default: "nearest"
  items?: { value: string; label: string; disabled?: boolean }[];
  allowDeselect?: boolean;      // single-select only
  autocomplete?: HTMLInputAttributes["autocomplete"];
}>;

// Single select
export type SelectSingleRootPropsWithoutHTML = {
  value?: string;               // bindable
  onValueChange?: OnChangeFn<string>;
  type: "single";               // REQUIRED
};

// Multiple select
export type SelectMultipleRootPropsWithoutHTML = {
  value?: string[];             // bindable
  onValueChange?: OnChangeFn<string[]>;
  type: "multiple";             // REQUIRED
};

// Item Props
export type SelectItemSnippetProps = {
  selected: boolean;
  highlighted: boolean;
};

export type SelectItemPropsWithoutHTML = WithChild<{
  value: string;                // REQUIRED
  label?: string;               // for typeahead (NOT textValue!)
  disabled?: boolean;           // default: false
  onHighlight?: () => void;
  onUnhighlight?: () => void;
}, SelectItemSnippetProps>;

// Content Props - extends PopperLayerProps
export type SelectContentPropsWithoutHTML = WithChildNoChildrenSnippetProps<
  Omit<PopperLayerProps, "content" | "onOpenAutoFocus" | "trapFocus" | "onCloseAutoFocus"> & {
    loop?: boolean;
  },
  FloatingContentSnippetProps  // { open: boolean }
>;

// Trigger Props
export type SelectTriggerPropsWithoutHTML = WithChild;

// Viewport Props
export type SelectViewportPropsWithoutHTML = WithChild;

// Group Props
export type SelectGroupPropsWithoutHTML = WithChild;

// GroupHeading Props
export type SelectGroupHeadingPropsWithoutHTML = WithChild;

// ScrollButton Props
export type SelectScrollButtonPropsWithoutHTML = WithChild<{
  delay?: (tick: number) => number;  // default: () => 50
}>;
```

---

### Tooltip

#### Exports

```typescript
// bits-ui/dist/bits/tooltip/exports.d.ts

export { default as Root } from "./components/tooltip.svelte";
export { default as Content } from "./components/tooltip-content.svelte";
export { default as ContentStatic } from "./components/tooltip-content-static.svelte";
export { default as Trigger } from "./components/tooltip-trigger.svelte";
export { default as Arrow } from "./components/tooltip-arrow.svelte";  // HAS Arrow!
export { default as Provider } from "./components/tooltip-provider.svelte";
export { default as Portal } from "../utilities/portal/portal.svelte";
```

#### Types

```typescript
// Provider Props
export type TooltipProviderPropsWithoutHTML = WithChildren<{
  delayDuration?: number;              // default: 700 (NOT openDelay!)
  skipDelayDuration?: number;          // default: 300
  disableHoverableContent?: boolean;   // default: false
  disableCloseOnTriggerClick?: boolean;// default: false
  disabled?: boolean;                  // default: false
  ignoreNonKeyboardFocus?: boolean;    // default: false
}>;

// NOTE: NO closeDelay prop exists!

// Root Props
export type TooltipRootPropsWithoutHTML = WithChildren<{
  open?: boolean;                      // default: false
  onOpenChange?: OnChangeFn<boolean>;
  onOpenChangeComplete?: OnChangeFn<boolean>;
  delayDuration?: number;              // default: 700
  disableHoverableContent?: boolean;   // default: false
  disableCloseOnTriggerClick?: boolean;// default: false
  disabled?: boolean;                  // default: false
  ignoreNonKeyboardFocus?: boolean;    // default: false
}>;

// Content Props
export type TooltipContentPropsWithoutHTML = WithChildNoChildrenSnippetProps<
  Omit<FloatingLayerContentProps, "content" | "preventScroll"> &
  Omit<DismissibleLayerProps, "onInteractOutsideStart"> &
  EscapeLayerProps & {
    forceMount?: boolean;
  },
  FloatingContentSnippetProps  // { open: boolean }
>;

// Trigger Props
export type TooltipTriggerPropsWithoutHTML = WithChild<{
  disabled?: boolean | null | undefined;  // default: false
}>;

// Arrow Props - same as utilities/arrow
export type TooltipArrowPropsWithoutHTML = ArrowPropsWithoutHTML;
```

---

### Dialog

#### Exports

```typescript
// bits-ui/dist/bits/dialog/exports.d.ts

export { default as Root } from "./components/dialog.svelte";
export { default as Title } from "./components/dialog-title.svelte";
export { default as Close } from "./components/dialog-close.svelte";
export { default as Portal } from "../utilities/portal/portal.svelte";
export { default as Content } from "./components/dialog-content.svelte";
export { default as Overlay } from "./components/dialog-overlay.svelte";
export { default as Trigger } from "./components/dialog-trigger.svelte";
export { default as Description } from "./components/dialog-description.svelte";
```

#### Types

```typescript
// Root Props
export type DialogRootPropsWithoutHTML = WithChildren<{
  open?: boolean;
  onOpenChange?: OnChangeFn<boolean>;
  onOpenChangeComplete?: OnChangeFn<boolean>;
}>;

// Content Props
export type DialogContentSnippetProps = {
  open: boolean;
};

export type DialogContentPropsWithoutHTML = WithChildNoChildrenSnippetProps<
  Omit<
    EscapeLayerProps &
    Omit<DismissibleLayerProps, "onInteractOutsideStart"> &
    PresenceLayerProps &
    FocusScopeProps &
    TextSelectionLayerProps &
    ScrollLockProps,
    "loop"
  >,
  DialogContentSnippetProps
>;

// Overlay Props
export type DialogOverlaySnippetProps = {
  open: boolean;
};

export type DialogOverlayPropsWithoutHTML = WithChild<
  PresenceLayerProps,
  DialogOverlaySnippetProps
>;

// Title Props
export type DialogTitlePropsWithoutHTML = WithChild<{
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}>;

// Trigger/Close Props
export type DialogTriggerPropsWithoutHTML = WithChild;
export type DialogClosePropsWithoutHTML = DialogTriggerPropsWithoutHTML;

// Description Props
export type DialogDescriptionPropsWithoutHTML = WithChild;
```

---

### Popover

#### Exports

```typescript
// bits-ui/dist/bits/popover/exports.d.ts

export { default as Root } from "./components/popover.svelte";
export { default as Arrow } from "./components/popover-arrow.svelte";
export { default as Content } from "./components/popover-content.svelte";
export { default as ContentStatic } from "./components/popover-content-static.svelte";
export { default as Trigger } from "./components/popover-trigger.svelte";
export { default as Close } from "./components/popover-close.svelte";
export { default as Portal } from "../utilities/portal/portal.svelte";
export { default as Overlay } from "./components/popover-overlay.svelte";
```

#### Types

```typescript
// Root Props
export type PopoverRootPropsWithoutHTML = WithChildren<{
  open?: boolean;
  onOpenChange?: OnChangeFn<boolean>;
  onOpenChangeComplete?: OnChangeFn<boolean>;
}>;

// Trigger Props - NOTE: has openOnHover, openDelay, closeDelay!
export type PopoverTriggerPropsWithoutHTML = WithChild<{
  openOnHover?: boolean;   // default: false
  openDelay?: number;      // default: 700 (only for hover)
  closeDelay?: number;     // default: 300 (only for hover)
}>;

// Content Props
export type PopoverContentPropsWithoutHTML = WithChildNoChildrenSnippetProps<
  Omit<PopperLayerProps, "content" | "loop">,
  FloatingContentSnippetProps
>;

// Close Props
export type PopoverClosePropsWithoutHTML = WithChild;

// Arrow Props
export type PopoverArrowPropsWithoutHTML = ArrowPropsWithoutHTML;

// Overlay Props
export type PopoverOverlaySnippetProps = {
  open: boolean;
};

export type PopoverOverlayPropsWithoutHTML = WithChild<
  PresenceLayerProps,
  PopoverOverlaySnippetProps
>;
```

---

### Tabs

#### Exports

```typescript
// bits-ui/dist/bits/tabs/exports.d.ts

export { default as Root } from "./components/tabs.svelte";
export { default as Content } from "./components/tabs-content.svelte";
export { default as List } from "./components/tabs-list.svelte";
export { default as Trigger } from "./components/tabs-trigger.svelte";
```

#### Types

```typescript
// Root Props
export type TabsActivationMode = "manual" | "automatic";

export type TabsRootPropsWithoutHTML = WithChild<{
  value?: string;
  onValueChange?: OnChangeFn<string>;
  orientation?: Orientation;       // default: "horizontal"
  loop?: boolean;                  // default: false
  activationMode?: TabsActivationMode;  // default: "automatic"
  disabled?: boolean;              // default: false
}>;

// List Props
export type TabsListPropsWithoutHTML = WithChild;

// Trigger Props
export type TabsTriggerPropsWithoutHTML = WithChild<{
  value: string;                   // REQUIRED
  disabled?: boolean | null | undefined;  // default: false
}>;

// Content Props
export type TabsContentPropsWithoutHTML = WithChild<{
  value: string;                   // REQUIRED
}>;
```

---

## Critical Notes for ColdLight

### 1. Props Pattern

bits-ui uses `Without<HTMLAttributes, ComponentProps>` to merge HTML attributes with component props while preventing conflicts. The component props always take precedence.

### 2. `id` Constraint

bits-ui requires `id` to be `string | undefined`, NOT `string | null`. This is because bits-ui uses IDs internally for element references.

### 3. `child` vs `children`

- `child` snippet: For render delegation. Receives `{ props, ...snippetProps }`. **MUST spread props onto element**.
- `children` snippet: For default rendering. May receive `snippetProps` depending on component.

### 4. Missing Components

The following are NOT exported by bits-ui and must be provided by ColdLight:
- `Select.ItemText` - just a span wrapper
- `Select.Separator` - a div with role="separator"
- `Select.Arrow` - must use `utilities/arrow` or `FloatingLayer.Arrow`

### 5. Prop Naming

| ColdLight Assumed | bits-ui Actual | Component |
|-------------------|----------------|-----------|
| `openDelay` | `delayDuration` | Tooltip |
| `closeDelay` | N/A (doesn't exist) | Tooltip |
| `textValue` | `label` | Select.Item |
| Generic `<T>` | `string` only | Select |

### 6. Import Paths

```typescript
// Public API
import { Select, Tooltip, Dialog } from "bits-ui";

// Utilities (internal paths - may change between versions)
import { FloatingLayer } from "bits-ui/dist/bits/utilities/floating-layer/index.js";
import { Arrow } from "bits-ui/dist/bits/utilities/arrow/index.js";
import { PresenceLayer } from "bits-ui/dist/bits/utilities/presence-layer/index.js";
import { FocusScope } from "bits-ui/dist/bits/utilities/focus-scope/index.js";
import { DismissibleLayer } from "bits-ui/dist/bits/utilities/dismissible-layer/index.js";
import { EscapeLayer } from "bits-ui/dist/bits/utilities/escape-layer/index.js";
import { Portal } from "bits-ui/dist/bits/utilities/portal/index.js";
```

---

## Data Attributes

bits-ui adds these data attributes automatically:

| Attribute | Values | Components |
|-----------|--------|------------|
| `data-state` | `"open"` / `"closed"` | All floating |
| `data-state` | `"checked"` / `"unchecked"` | Checkbox, Switch |
| `data-state` | `"active"` / `"inactive"` | Tabs |
| `data-disabled` | Present when disabled | All |
| `data-highlighted` | Present when highlighted | Select.Item, Menu.Item |
| `data-selected` | Present when selected | Select.Item |
| `data-orientation` | `"horizontal"` / `"vertical"` | Tabs, Accordion |
| `data-side` | `"top"` / `"right"` / `"bottom"` / `"left"` | Floating content |
| `data-align` | `"start"` / `"center"` / `"end"` | Floating content |

---

## Version History

- **2.15.4** (current) - Verified January 2026
- **2.4.1** (June 2025) - Referenced in older spec document
- **2.1.0+** - Svelte 5 only rewrite

---

*This document was extracted directly from `node_modules/bits-ui/dist/` type definitions.*
