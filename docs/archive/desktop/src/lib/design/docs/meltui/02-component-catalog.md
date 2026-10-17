# Melt UI — Component Catalog

> Every builder with elements, states, and key options.
> All imports from `@melt-ui/svelte`.

---

## Overlay / Disclosure

### createDialog

```typescript
const {
  elements: { trigger, overlay, content, title, description, close, portalled },
  states: { open },
} = createDialog({
  role?: "dialog" | "alertdialog",
  defaultOpen?: boolean,
  open?: Writable<boolean>,
  preventScroll?: boolean,         // Default true
  closeOnOutsideClick?: boolean,   // Default true
  closeOnEscape?: boolean,         // Default true
  portal?: string | HTMLElement,
  forceVisible?: boolean,
  openFocus?: string | HTMLElement,
  closeFocus?: string | HTMLElement,
  onOpenChange?: ChangeHandler<boolean>,
});
```

### createPopover

```typescript
const {
  elements: { trigger, content, arrow, close },
  states: { open },
} = createPopover({
  defaultOpen?: boolean,
  open?: Writable<boolean>,
  positioning?: FloatingConfig,
  portal?: string | HTMLElement,
  closeOnOutsideClick?: boolean,
  closeOnEscape?: boolean,
  forceVisible?: boolean,
  arrowSize?: number,
  onOpenChange?: ChangeHandler<boolean>,
});
```

### createTooltip

```typescript
const {
  elements: { trigger, content, arrow },
  states: { open },
} = createTooltip({
  defaultOpen?: boolean,
  open?: Writable<boolean>,
  positioning?: FloatingConfig,
  openDelay?: number,             // Default 1000
  closeDelay?: number,            // Default 0
  closeOnPointerDown?: boolean,
  closeOnEscape?: boolean,
  forceVisible?: boolean,
  portal?: string | HTMLElement,
  arrowSize?: number,
  group?: string | boolean,      // Group tooltips (only one open at a time)
  onOpenChange?: ChangeHandler<boolean>,
});
```

### createCollapsible

```typescript
const {
  elements: { root, trigger, content },
  states: { open },
} = createCollapsible({
  defaultOpen?: boolean,
  open?: Writable<boolean>,
  disabled?: boolean,
  forceVisible?: boolean,
  onOpenChange?: ChangeHandler<boolean>,
});
```

### createLinkPreview

```typescript
const {
  elements: { trigger, content, arrow },
  states: { open },
} = createLinkPreview({
  defaultOpen?: boolean,
  open?: Writable<boolean>,
  openDelay?: number,
  closeDelay?: number,
  positioning?: FloatingConfig,
  portal?: string | HTMLElement,
  arrowSize?: number,
  forceVisible?: boolean,
  onOpenChange?: ChangeHandler<boolean>,
});
```

---

## Form Components

### createCheckbox

```typescript
const {
  elements: { root, input, indicator },
  states: { checked },          // boolean | "indeterminate"
  helpers: { isChecked, isIndeterminate },
} = createCheckbox({
  defaultChecked?: boolean | "indeterminate",
  checked?: Writable<boolean | "indeterminate">,
  disabled?: boolean,
  required?: boolean,
  name?: string,
  value?: string,
  onCheckedChange?: ChangeHandler<boolean | "indeterminate">,
});
```

### createSwitch

```typescript
const {
  elements: { root, input, thumb },
  states: { checked },
} = createSwitch({
  defaultChecked?: boolean,
  checked?: Writable<boolean>,
  disabled?: boolean,
  required?: boolean,
  name?: string,
  value?: string,
  onCheckedChange?: ChangeHandler<boolean>,
});
```

### createRadioGroup

```typescript
const {
  elements: { root, item, hiddenInput },
  states: { value },
  helpers: { isChecked },
} = createRadioGroup({
  defaultValue?: string,
  value?: Writable<string>,
  disabled?: boolean,
  required?: boolean,
  loop?: boolean,
  orientation?: "horizontal" | "vertical",
  onValueChange?: ChangeHandler<string>,
});
```

**Usage:**
```svelte
<div use:melt={$root}>
  {#each options as option}
    <button use:melt={$item(option.value)}>
      {option.label}
    </button>
    <input use:melt={$hiddenInput(option.value)} />
  {/each}
</div>
```

### createSlider

```typescript
const {
  elements: { root, range, thumb, tick },
  states: { value },                    // number[]
} = createSlider({
  defaultValue?: number[],              // [50] for single, [20, 80] for range
  value?: Writable<number[]>,
  min?: number,
  max?: number,
  step?: number,
  disabled?: boolean,
  orientation?: "horizontal" | "vertical",
  onValueChange?: ChangeHandler<number[]>,
  onValueCommit?: ChangeHandler<number[]>,  // On drag end
});
```

### createToggle

```typescript
const {
  elements: { root },
  states: { pressed },
} = createToggle({
  defaultPressed?: boolean,
  pressed?: Writable<boolean>,
  disabled?: boolean,
  onPressedChange?: ChangeHandler<boolean>,
});
```

### createToggleGroup

```typescript
const {
  elements: { root, item },
  states: { value },                    // string | string[]
  helpers: { isPressed },
} = createToggleGroup({
  defaultValue?: string | string[],
  value?: Writable<string | string[]>,
  type?: "single" | "multiple",
  disabled?: boolean,
  loop?: boolean,
  rovingFocus?: boolean,
  orientation?: "horizontal" | "vertical",
  onValueChange?: ChangeHandler<string | string[]>,
});
```

### createPinInput

```typescript
const {
  elements: { root, input, hiddenInput },
  states: { value, valueStr },
} = createPinInput({
  defaultValue?: string[],
  value?: Writable<string[]>,
  placeholder?: string,
  type?: "text" | "password",
  disabled?: boolean,
  name?: string,
  onValueChange?: ChangeHandler<string[]>,
  onComplete?: (pin: string) => void,
});
```

### createLabel

```typescript
const {
  elements: { root },
} = createLabel();
```

---

## Collection Components

### createSelect

```typescript
const {
  elements: { trigger, menu, option, group, groupLabel, label, hiddenInput, arrow },
  states: { open, selected, selectedLabel, highlighted },
  helpers: { isSelected, isHighlighted },
} = createSelect<T>({
  defaultSelected?: Selected<T>,
  selected?: Writable<Selected<T>>,
  multiple?: boolean,
  disabled?: boolean,
  required?: boolean,
  name?: string,
  preventScroll?: boolean,
  positioning?: FloatingConfig,
  portal?: string | HTMLElement,
  closeOnOutsideClick?: boolean,
  closeOnEscape?: boolean,
  forceVisible?: boolean,
  loop?: boolean,
  typeahead?: boolean,
  onSelectedChange?: ChangeHandler<Selected<T>>,
  onOpenChange?: ChangeHandler<boolean>,
});
```

**Usage:**
```svelte
<button use:melt={$trigger}>
  {$selectedLabel || "Select..."}
</button>

{#if $open}
  <div use:melt={$menu}>
    {#each items as item}
      <div use:melt={$option({ value: item.value, label: item.label })}>
        {item.label}
        {#if $isSelected(item.value)}
          <CheckIcon />
        {/if}
      </div>
    {/each}
  </div>
{/if}
```

### createCombobox

```typescript
const {
  elements: { input, menu, option, label, group, groupLabel, hiddenInput, arrow },
  states: { open, inputValue, selected, highlighted, touchedInput },
  helpers: { isSelected, isHighlighted },
} = createCombobox<T>({
  defaultSelected?: Selected<T>,
  selected?: Writable<Selected<T>>,
  multiple?: boolean,
  disabled?: boolean,
  required?: boolean,
  name?: string,
  positioning?: FloatingConfig,
  portal?: string | HTMLElement,
  loop?: boolean,
  closeOnOutsideClick?: boolean,
  closeOnEscape?: boolean,
  forceVisible?: boolean,
  debounce?: number,
  inputValue?: Writable<string>,
  onSelectedChange?: ChangeHandler<Selected<T>>,
  onOpenChange?: ChangeHandler<boolean>,
  onInputValueChange?: (value: string) => void,
});
```

### createDropdownMenu / createContextMenu

```typescript
const {
  elements: {
    trigger,
    menu,
    item,
    separator,
    group,
    groupLabel,
    arrow,
    // Sub-menus:
    subTrigger,
    subMenu,
  },
  states: { open },
  builders: {
    createSubmenu,           // Create nested sub-menus
    createMenuRadioGroup,    // Radio items in menu
    createCheckboxItem,      // Checkbox items in menu
  },
} = createDropdownMenu({
  positioning?: FloatingConfig,
  portal?: string | HTMLElement,
  closeOnOutsideClick?: boolean,
  closeOnEscape?: boolean,
  loop?: boolean,
  forceVisible?: boolean,
  arrowSize?: number,
  typeahead?: boolean,
  closeFocus?: string | HTMLElement,
  onOpenChange?: ChangeHandler<boolean>,
});

// Sub-menu builder
const {
  elements: { subTrigger, subMenu, subArrow },
  states: { subOpen },
} = createSubmenu({
  positioning?: FloatingConfig,
});

// Radio group within menu
const {
  elements: { radioGroup, radioItem },
  states: { value },
  helpers: { isChecked },
} = createMenuRadioGroup({
  defaultValue?: string,
  onValueChange?: ChangeHandler<string>,
});

// Checkbox item
const {
  elements: { checkboxItem },
  states: { checked },
} = createCheckboxItem({
  defaultChecked?: boolean,
  onCheckedChange?: ChangeHandler<boolean>,
});
```

### createMenubar

```typescript
const {
  elements: { menubar },
  builders: { createMenu },
} = createMenubar({
  loop?: boolean,
  closeOnEscape?: boolean,
});

// Each menu in the menubar
const {
  elements: { trigger, menu, item, separator },
  states: { open },
} = createMenu({
  positioning?: FloatingConfig,
});
```

### createListbox

```typescript
const {
  elements: { root, option, label, group, groupLabel },
  states: { value, highlighted },
  helpers: { isSelected, isHighlighted },
} = createListbox<T>({
  defaultValue?: Selected<T>,
  value?: Writable<Selected<T>>,
  multiple?: boolean,
  disabled?: boolean,
  loop?: boolean,
  orientation?: "horizontal" | "vertical",
  typeahead?: boolean,
  onValueChange?: ChangeHandler<Selected<T>>,
});
```

---

## Navigation

### createTabs

```typescript
const {
  elements: { root, list, trigger, content },
  states: { value },
} = createTabs({
  defaultValue?: string,
  value?: Writable<string>,
  orientation?: "horizontal" | "vertical",
  activationMode?: "automatic" | "manual",
  loop?: boolean,
  autoSet?: boolean,
  onValueChange?: ChangeHandler<string>,
});
```

**Usage:**
```svelte
<div use:melt={$root}>
  <div use:melt={$list}>
    <button use:melt={$trigger("tab-1")}>Tab 1</button>
    <button use:melt={$trigger("tab-2")}>Tab 2</button>
  </div>
  <div use:melt={$content("tab-1")}>Content 1</div>
  <div use:melt={$content("tab-2")}>Content 2</div>
</div>
```

### createAccordion

```typescript
const {
  elements: { root, item, trigger, content, heading },
  states: { value },
  helpers: { isSelected },
} = createAccordion({
  defaultValue?: string | string[],
  value?: Writable<string | string[]>,
  type?: "single" | "multiple",
  disabled?: boolean,
  forceVisible?: boolean,
  onValueChange?: ChangeHandler<string | string[]>,
});
```

### createPagination

```typescript
const {
  elements: { root, pageTrigger, prevButton, nextButton },
  states: { pages, range, page, totalPages },
} = createPagination({
  count: number,                   // Total items
  perPage?: number,                // Items per page
  defaultPage?: number,
  page?: Writable<number>,
  siblingCount?: number,
  onPageChange?: ChangeHandler<number>,
});

// $pages returns: Array<{ type: "page", value: number } | { type: "ellipsis" }>
```

### createTableOfContents

```typescript
const {
  elements: { item },
  states: { activeHeadingIdxs, headingsList },
  helpers: { isActive },
} = createTableOfContents({
  selector?: string,              // CSS selector for headings
  exclude?: string[],             // IDs to exclude
  activeType?: "all" | "lowest" | "highest" | "nearest",
  headingFilterFn?: (heading: HTMLHeadingElement) => boolean,
  scrollOffset?: number,
  scrollBehavior?: ScrollBehavior,
});
```

### createToolbar

```typescript
const {
  elements: { root, button, link, separator },
  builders: { createToolbarGroup },
} = createToolbar({
  loop?: boolean,
  orientation?: "horizontal" | "vertical",
});

const {
  elements: { group, item },
  states: { value },
} = createToolbarGroup({
  type?: "single" | "multiple",
  defaultValue?: string | string[],
});
```

---

## Date Components

### createCalendar

```typescript
const {
  elements: {
    calendar, heading, grid, cell, prevButton, nextButton,
  },
  states: {
    value,          // DateValue | undefined
    months,         // Month[] (grid data)
    weekdays,       // string[] (day names)
    headingValue,   // string (e.g., "March 2026")
  },
  helpers: { isDateDisabled, isDateUnavailable },
} = createCalendar({
  defaultValue?: DateValue,
  value?: Writable<DateValue>,
  locale?: string,
  placeholder?: DateValue,
  disabled?: boolean,
  readonly?: boolean,
  minValue?: DateValue,
  maxValue?: DateValue,
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  fixedWeeks?: boolean,
  numberOfMonths?: number,
  pagedNavigation?: boolean,
  preventDeselect?: boolean,
  isDateDisabled?: (date: DateValue) => boolean,
  isDateUnavailable?: (date: DateValue) => boolean,
  calendarLabel?: string,
  onValueChange?: ChangeHandler<DateValue | undefined>,
  onPlaceholderChange?: ChangeHandler<DateValue>,
});
```

### createRangeCalendar

Same as createCalendar but `value` is `{ start: DateValue; end: DateValue }`.

### createDateField

```typescript
const {
  elements: { field, segment, label, validation, hiddenInput },
  states: { value, segmentValues },
} = createDateField({
  defaultValue?: DateValue,
  value?: Writable<DateValue>,
  locale?: string,
  granularity?: "day" | "hour" | "minute" | "second",
  hourCycle?: 12 | 24,
  disabled?: boolean,
  readonly?: boolean,
  minValue?: DateValue,
  maxValue?: DateValue,
  name?: string,
  required?: boolean,
  hideTimeZone?: boolean,
  onValueChange?: ChangeHandler<DateValue | undefined>,
});
```

### createDatePicker

Combines DateField + Calendar in a popover:

```typescript
const {
  elements: { field, segment, label, trigger, content, calendar, /* ... */ },
  states: { open, value, /* ... */ },
} = createDatePicker({
  defaultValue?: DateValue,
  value?: Writable<DateValue>,
  locale?: string,
  positioning?: FloatingConfig,
  portal?: string | HTMLElement,
  closeOnOutsideClick?: boolean,
  // ... all calendar + date field options
});
```

### createDateRangeField / createDateRangePicker

Range variants of DateField/DatePicker with `start` and `end` fields.

---

## Display Components

### createAvatar

```typescript
const {
  elements: { root, image, fallback },
  states: { loadingStatus },        // "loading" | "loaded" | "error"
} = createAvatar({
  src?: string,
  delayMs?: number,
  onLoadingStatusChange?: ChangeHandler<"loading" | "loaded" | "error">,
});
```

### createProgress

```typescript
const {
  elements: { root, indicator },
  states: { value },
} = createProgress({
  defaultValue?: number,
  value?: Writable<number>,
  max?: number,
});
```

### createScrollArea

```typescript
const {
  elements: { root, viewport, content, scrollbarX, scrollbarY, thumbX, thumbY, corner },
} = createScrollArea({
  type?: "auto" | "always" | "scroll" | "hover",
  dir?: "ltr" | "rtl",
  scrollHideDelay?: number,
});
```

### createSeparator

```typescript
const {
  elements: { root },
} = createSeparator({
  orientation?: "horizontal" | "vertical",
  decorative?: boolean,
});
```

### createTagsInput

```typescript
const {
  elements: { root, input, tag, deleteTrigger, edit },
  states: { tags },
  helpers: { addTag, removeTag, updateTag },
} = createTagsInput({
  defaultTags?: string[],
  tags?: Writable<string[]>,
  unique?: boolean,
  add?: (tag: string) => string | undefined,   // Validate/transform before add
  remove?: (tag: string) => boolean,            // Validate before remove
  addOnPaste?: boolean,
  maxTags?: number,
  editable?: boolean,
  disabled?: boolean,
  blur?: "nothing" | "add" | "clear",
  delimiter?: string,
  onTagsChange?: ChangeHandler<string[]>,
});
```

### createTree

```typescript
const {
  elements: { tree, item, group },
  states: { selectedItem, expandedItems },
  helpers: { isExpanded, isSelected },
} = createTree({
  defaultExpanded?: string[],
  expanded?: Writable<string[]>,
  defaultSelected?: string,
  selected?: Writable<string>,
  multiple?: boolean,
  forceVisible?: boolean,
  onSelectedChange?: ChangeHandler<string | string[]>,
  onExpandedChange?: ChangeHandler<string[]>,
});
```
