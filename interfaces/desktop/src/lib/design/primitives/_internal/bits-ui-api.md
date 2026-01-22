# bits-ui v2.15.4 API Reference

> **VERIFIED**: This document reflects actual exports from `node_modules/bits-ui/dist/`
> **Last verified**: 2026-01-21

---

## Core Exports

```typescript
import {
  Accordion, AlertDialog, AspectRatio, Avatar, BitsConfig, Button,
  Calendar, Checkbox, Collapsible, Combobox, Command, ContextMenu,
  DateField, DatePicker, DateRangeField, DateRangePicker, Dialog,
  DropdownMenu, Label, LinkPreview, Menubar, Meter, NavigationMenu,
  Pagination, PinInput, Popover, Progress, RadioGroup, RangeCalendar,
  RatingGroup, ScrollArea, Select, Separator, Slider, Switch, Tabs,
  TimeField, TimeRangeField, Toggle, ToggleGroup, Toolbar, Tooltip,
  Portal, IsUsingKeyboard, computeCommandScore, getBitsConfig
} from "bits-ui";
```

---

## Select

### Exports
| Component | Exported | Notes |
|-----------|----------|-------|
| Root | ✅ | |
| Content | ✅ | |
| ContentStatic | ✅ | |
| Item | ✅ | |
| Group | ✅ | |
| GroupHeading | ✅ | ColdLight calls this `GroupLabel` |
| Trigger | ✅ | |
| Portal | ✅ | |
| Viewport | ✅ | |
| ScrollUpButton | ✅ | ColdLight calls this `ScrollUp` |
| ScrollDownButton | ✅ | ColdLight calls this `ScrollDown` |
| **Arrow** | ❌ | **NOT EXPORTED** - use FloatingLayerArrow |
| **ItemText** | ❌ | **DOESN'T EXIST** - ColdLight owns this |

### Select.Item Props (ACTUAL)
```typescript
{
  value: string;        // REQUIRED - NOT generic <T>, string only!
  label?: string;       // For typeahead - NOT "textValue"
  disabled?: boolean;
  onHighlight?: () => void;
  onUnhighlight?: () => void;
}
```

### ColdLight Type Corrections Needed
- ❌ `textValue` → ✅ `label`
- ❌ Generic `<T>` → ✅ `string` only
- ❌ Arrow component → ✅ Use FloatingLayerArrow from _internal

---

## Tooltip

### Exports
| Component | Exported | Notes |
|-----------|----------|-------|
| Root | ✅ | |
| Content | ✅ | |
| ContentStatic | ✅ | |
| Trigger | ✅ | |
| Arrow | ✅ | **EXISTS** unlike Select |
| Provider | ✅ | |
| Portal | ✅ | |

### Tooltip.Provider Props (ACTUAL)
```typescript
{
  delayDuration?: number;              // Default: 700 - NOT "openDelay"
  skipDelayDuration?: number;          // Default: 300
  disableHoverableContent?: boolean;   // Default: false
  disableCloseOnTriggerClick?: boolean;// Default: false
  disabled?: boolean;
  ignoreNonKeyboardFocus?: boolean;
}
```

### Tooltip.Root Props (ACTUAL)
```typescript
{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  delayDuration?: number;              // NOT "openDelay"
  disableHoverableContent?: boolean;
  disableCloseOnTriggerClick?: boolean;
  disabled?: boolean;
  ignoreNonKeyboardFocus?: boolean;
}
```

### ColdLight Type Corrections Needed
- ❌ `openDelay` → ✅ `delayDuration`
- ❌ `closeDelay` → ✅ **REMOVE** (doesn't exist)

---

## Popover

### Exports
| Component | Exported | Notes |
|-----------|----------|-------|
| Root | ✅ | |
| Arrow | ✅ | **EXISTS** |
| Content | ✅ | |
| ContentStatic | ✅ | |
| Trigger | ✅ | |
| Close | ✅ | |
| Portal | ✅ | |
| Overlay | ✅ | |

---

## Dialog

### Exports
| Component | Exported | Notes |
|-----------|----------|-------|
| Root | ✅ | |
| Title | ✅ | |
| Close | ✅ | |
| Portal | ✅ | |
| Content | ✅ | |
| Overlay | ✅ | |
| Trigger | ✅ | |
| Description | ✅ | |

---

## AlertDialog

Uses same structure as Dialog.

---

## Tabs

### Exports
| Component | Exported | Notes |
|-----------|----------|-------|
| Root | ✅ | |
| List | ✅ | |
| Trigger | ✅ | |
| Content | ✅ | |

---

## Type Compatibility Issues

### The `null` vs `undefined` Problem

bits-ui types use `Without<>` which explicitly excludes `null`:
```typescript
// bits-ui internal
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
```

HTML attributes allow `null`, bits-ui requires `undefined`.

**Solution**: ColdLight props must NOT extend HTMLAttributes directly when spreading to bits-ui.

### Pattern for ColdLight Props
```typescript
// WRONG - causes type errors
export interface SelectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  // ...
}

// RIGHT - explicit props only
export interface SelectItemProps {
  class?: string;
  "data-id"?: string;
  // Only what ColdLight accepts, use type assertion when passing to bits-ui
}
```

---

## Utilities Available

From `bits-ui/dist/bits/utilities/`:

| Utility | Path | Purpose |
|---------|------|---------|
| FloatingLayerArrow | `floating-layer/components/floating-layer-arrow.svelte` | Arrow for positioned content |
| PresenceLayer | `presence-layer/presence-layer.svelte` | Mount/unmount animations |
| FocusScope | `focus-scope/focus-scope.svelte` | Focus trapping |
| DismissibleLayer | `dismissible-layer/dismissible-layer.svelte` | Click outside handling |
| EscapeLayer | `escape-layer/escape-layer.svelte` | Escape key handling |
| ScrollLock | `scroll-lock/scroll-lock.svelte` | Body scroll prevention |
| VisuallyHidden | `visually-hidden/visually-hidden.svelte` | Screen reader only content |
| Portal | `portal/portal.svelte` | DOM portaling |

**Note**: These are internal paths, may change between versions.

---

## _internal Abstraction

ColdLight's `_internal/index.ts` re-exports these utilities:
```typescript
// Public API (stable)
export { Portal, IsUsingKeyboard, useId, mergeProps } from "bits-ui";

// Internal utilities (unstable paths - isolate here)
export { default as FloatingLayerArrow } from "bits-ui/dist/bits/utilities/floating-layer/components/floating-layer-arrow.svelte";
// ... etc
```

When bits-ui changes internal paths, only `_internal/index.ts` needs updating.
