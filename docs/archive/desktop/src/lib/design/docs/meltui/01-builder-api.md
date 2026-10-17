# Melt UI — Builder API Reference

## Builder Function Signature

Every builder follows this pattern:

```typescript
function createComponent(options?: ComponentOptions): {
  elements: Record<string, Writable<MeltElement>>;
  states: Record<string, Writable<any>>;
  helpers?: Record<string, Function>;
  options: ComponentOptions;
}
```

### MeltElement

The element objects returned by builders contain:

```typescript
interface MeltElement {
  // HTML attributes
  role?: string;
  id?: string;
  tabindex?: number;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  "aria-haspopup"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-selected"?: boolean;
  "aria-checked"?: boolean | "mixed";
  "aria-disabled"?: boolean;
  "data-state"?: string;
  "data-disabled"?: string;
  "data-highlighted"?: string;
  "data-melt-*"?: string;
  style?: string;

  // Event handlers (Svelte format)
  action: Action;              // Svelte action for event binding
}
```

## Positioning

Overlay components use Floating UI under the hood:

```typescript
type FloatingConfig = {
  placement?: Placement;      // 'top' | 'bottom' | 'left' | 'right' + '-start' | '-end'
  strategy?: 'absolute' | 'fixed';
  offset?: { mainAxis?: number; crossAxis?: number };
  gutter?: number;
  flip?: boolean;
  overlap?: boolean;
  sameWidth?: boolean;
  fitViewport?: boolean;
  boundary?: Element | Element[];
};

// Usage
createSelect({
  positioning: {
    placement: "bottom-start",
    gutter: 8,
    flip: true,
    sameWidth: true,
  },
});
```

## Portal

Content can be portalled to a target element:

```typescript
createDialog({
  portal: "body",              // CSS selector
  // or
  portal: document.getElementById("portal-target"),
});
```

## Focus Management

### Focus Trap
Dialog and similar components trap focus:
```typescript
createDialog({
  closeOnOutsideClick: true,
  closeOnEscape: true,
  // Focus trap is automatic when modal
});
```

### Focus Return
Focus returns to the trigger element when overlay closes (automatic).

### Initial Focus
```typescript
createDialog({
  openFocus: "#first-input",  // Focus this element on open
  closeFocus: "#trigger",     // Focus this element on close
});
```

## Event Callbacks

All builders support event callbacks for state changes:

```typescript
createDialog({
  onOpenChange: (details: { curr: boolean; next: boolean }) => {
    console.log(`Dialog ${details.next ? 'opening' : 'closing'}`);
    // Return false to prevent the change
  },
});

createSelect({
  onSelectedChange: (details: { curr: Selected; next: Selected }) => {
    // Access previous and next value
  },
  onOpenChange: (details) => { /* ... */ },
});
```

### Change Prevention

Return an explicit value to override the change:

```typescript
createDialog({
  onOpenChange: ({ next }) => {
    if (hasUnsavedChanges && !next) {
      return false;  // Prevent closing
    }
    return next;     // Allow change
  },
});
```

## Multiple Selection

Components like Select, Listbox, Toggle Group support multi-select:

```typescript
createSelect({
  multiple: true,
  defaultValue: ["option-1", "option-3"],
  onSelectedChange: ({ next }) => {
    // next is an array of Selected objects
  },
});
```

## Item Types

Collection components use typed items:

```typescript
type Selected<T = unknown> = {
  value: string;
  label?: string;
  disabled?: boolean;
  [key: string]: T;
};

// Usage in select
createSelect<{ value: string; label: string; group?: string }>({
  // Type parameter flows through to callbacks
});
```

## Group Support

Select, Menu, and similar support grouped items:

```svelte
<script>
  const { elements: { menu, item, group, groupLabel, separator } } = createDropdownMenu();
</script>

<div use:melt={$menu}>
  <div use:melt={$group("edit")}>
    <div use:melt={$groupLabel("edit")}>Edit</div>
    <div use:melt={$item({ id: "cut" })}>Cut</div>
    <div use:melt={$item({ id: "copy" })}>Copy</div>
  </div>
  <div use:melt={$separator} />
  <div use:melt={$group("view")}>
    <div use:melt={$groupLabel("view")}>View</div>
    <div use:melt={$item({ id: "zoom-in" })}>Zoom In</div>
  </div>
</div>
```

## Typeahead

Collection components (Select, Combobox, Menu) support typeahead search:
- Type a character to jump to matching items
- Type multiple characters quickly for multi-char search
- Automatic timeout resets the search buffer

This is built-in and requires no configuration.

## Keyboard Navigation

All components implement WAI-ARIA keyboard patterns:

| Component | Keys |
|---|---|
| Dialog | Escape (close), Tab (trap focus) |
| Select | Arrow Up/Down (navigate), Enter/Space (select), Escape (close), Home/End |
| Combobox | Arrow Up/Down, Enter (select), Escape (close), typed chars (filter) |
| Menu | Arrow Up/Down, Enter (activate), Escape (close), Home/End |
| Tabs | Arrow Left/Right or Up/Down (navigate), Home/End |
| Accordion | Arrow Up/Down, Enter/Space (toggle), Home/End |
| Slider | Arrow Left/Right, Home/End, Page Up/Down |
| Checkbox | Space (toggle) |
| Switch | Space (toggle) |
| Radio Group | Arrow Up/Down/Left/Right (navigate + select) |
| Tree View | Arrow Up/Down (navigate), Arrow Right (expand), Arrow Left (collapse) |
| Date Picker | Arrow keys (navigate dates), Enter (select), Page Up/Down (months) |
