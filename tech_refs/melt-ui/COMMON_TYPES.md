# Melt UI — Common Types Reference

> Shared types used across multiple builders

---

## FloatingConfig

Used by: Popover, Tooltip, Select, Combobox, DropdownMenu, ContextMenu, LinkPreview

```typescript
interface FloatingConfig {
  /** Position relative to anchor */
  placement?:
    | 'top' | 'top-start' | 'top-end'
    | 'right' | 'right-start' | 'right-end'
    | 'bottom' | 'bottom-start' | 'bottom-end'
    | 'left' | 'left-start' | 'left-end';

  /** Positioning strategy */
  strategy?: 'absolute' | 'fixed';

  /** Gap between floating element and anchor */
  gutter?: number;  // default: 5

  /** Offset adjustments */
  offset?: {
    mainAxis?: number;
    crossAxis?: number;
  };

  /** Flip to opposite side if overflowing */
  flip?: boolean;  // default: true

  /** Allow element to overlap anchor */
  overlap?: boolean;  // default: false

  /** Constrain to viewport bounds */
  fitViewport?: boolean;

  /** Match anchor width */
  sameWidth?: boolean;
}
```

---

## EscapeBehavior

Used by: Dialog, Popover, Tooltip, DropdownMenu, ContextMenu, Select, Combobox

```typescript
type EscapeBehavior =
  | 'close'                    // Close on Escape (default)
  | 'ignore'                   // Ignore Escape key
  | 'defer-otherwise-close'    // Defer to parent, else close
  | 'defer-otherwise-ignore';  // Defer to parent, else ignore
```

---

## FocusProp

Used by: Dialog, Popover

```typescript
type FocusProp =
  | boolean                           // true = default, false = none
  | string                            // CSS selector
  | HTMLElement                       // Direct element reference
  | ((element: HTMLElement) => void); // Custom function
```

---

## ChangeFn

Used by: All builders with controlled state

```typescript
type ChangeFn<T> = (args: { curr: T; next: T }) => T;
```

Example:
```typescript
onOpenChange: ({ curr, next }) => {
  console.log(`Open changing from ${curr} to ${next}`);
  return next;  // or return curr to prevent change
}
```

---

## SelectOption

Used by: Select, Combobox

```typescript
interface SelectOption<T = unknown> {
  value: T;
  label?: string;
  disabled?: boolean;
}
```

---

## Tag

Used by: TagsInput

```typescript
interface Tag {
  id: string;
  value: string;
}
```

---

## DateValue

Used by: Calendar, DatePicker, DateField

From `@internationalized/date`:

```typescript
import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  type DateValue,
} from '@internationalized/date';

// CalendarDate: date only (no time)
const date = new CalendarDate(2024, 1, 15);

// CalendarDateTime: date + time (no timezone)
const dateTime = new CalendarDateTime(2024, 1, 15, 10, 30);

// ZonedDateTime: date + time + timezone
const zoned = new ZonedDateTime(2024, 1, 15, 'America/New_York', 0, 10, 30);
```

---

## Data Attributes (Common)

### State

```
[data-state]      "open" | "closed" | "checked" | "unchecked" | "indeterminate" |
                  "active" | "inactive" | "on" | "off" | "visible" | "hidden" |
                  "loading" | "loaded" | "error" | "complete"
```

### Position

```
[data-side]       "top" | "right" | "bottom" | "left"
[data-align]      "start" | "center" | "end"
[data-orientation] "horizontal" | "vertical"
```

### Interaction

```
[data-disabled]    Present when disabled
[data-selected]    Present when selected
[data-highlighted] Present when keyboard highlighted
[data-focus]       Present when focused
```

### Identity

```
[data-melt-{name}]           Present on all elements (e.g., data-melt-dialog)
[data-melt-{name}-{part}]    Specific part (e.g., data-melt-dialog-content)
[data-value]                 Value attribute for items
[data-label]                 Label attribute for items
```

---

## Portal Types

```typescript
type PortalConfig = string | HTMLElement | null;

// Examples:
portal: 'body'              // CSS selector
portal: document.body       // Direct reference
portal: null                // Disable portal
portal: '#my-portal-root'   // Custom selector
```

---

## Orientation

```typescript
type Orientation = 'horizontal' | 'vertical';
```

Used by: RadioGroup, Tabs, Slider, ToggleGroup, Separator
