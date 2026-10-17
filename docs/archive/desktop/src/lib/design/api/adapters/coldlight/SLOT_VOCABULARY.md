# ColdLight Slot Vocabulary

> **SSOT for `data-slot` values.**
>
> Semantic, provider-agnostic, stable slot names.

---

## Rules

1. **Slots represent structural parts, not styling choices.**
   - If a "slot" only exists for visual effects, it belongs in recipes.

2. **Slots must be provider-agnostic.**
   - No `trigger`, `contentEl`, `melt-*` naming.
   - Use semantic names that work if MeltUI is replaced.

3. **Slots must be stable + additive.**
   - Can add optional slots later.
   - Removing/renaming slots is a breaking change.
   - Treat slot inventories like public API.

4. **Naming convention:**
   - lowercase kebab-case
   - semantic part names

---

## Universal Slots

These slots appear across many primitives:

| Slot | Description |
|------|-------------|
| `root` | Container wrapper (always present) |
| `control` | Interactive control element |
| `label` | Text label for the element |
| `icon` | Icon element |
| `icon-leading` | Icon before content |
| `icon-trailing` | Icon after content |

---

## Content Slots

| Slot | Description |
|------|-------------|
| `content` | Main content area |
| `panel` | Content panel (tabs, accordion) |
| `viewport` | Scrollable viewport |
| `list` | List container |
| `item` | Individual item in list |

---

## Form Slots

| Slot | Description |
|------|-------------|
| `input` | Input element |
| `helper` | Helper text below input |
| `error` | Error message |
| `counter` | Character counter |
| `indicator` | State indicator (checkbox, radio) |

---

## Overlay Slots

| Slot | Description |
|------|-------------|
| `trigger` | Element that opens overlay |
| `portal` | Portal container |
| `overlay` | Backdrop overlay |
| `arrow` | Pointing arrow |
| `close` | Close button |

---

## Dialog Slots

| Slot | Description |
|------|-------------|
| `header` | Dialog header |
| `title` | Dialog title |
| `description` | Dialog description |
| `footer` | Dialog footer |
| `cancel` | Cancel action (alert dialog) |
| `action` | Confirm action (alert dialog) |

---

## Navigation Slots

| Slot | Description |
|------|-------------|
| `list` | Tab/nav list container |
| `tab` | Individual tab |
| `link` | Navigation link |
| `separator` | Visual separator |
| `page` | Current page indicator (breadcrumb) |
| `prev` | Previous page button |
| `next` | Next page button |
| `ellipsis` | Truncation indicator |

---

## Enhancement Slots

| Slot | Description |
|------|-------------|
| `badge` | Badge indicator |
| `overflow` | Overflow menu |
| `scroll-prev` | Scroll previous button |
| `scroll-next` | Scroll next button |
| `contextmenu` | Context menu |
| `drag-handle` | Drag handle |
| `ghost` | Drag ghost/preview |

---

## Data Slots

| Slot | Description |
|------|-------------|
| `header` | Table/grid header |
| `body` | Table/grid body |
| `row` | Table row |
| `cell` | Table cell |
| `header-cell` | Header cell |
| `canvas` | Chart canvas |
| `legend` | Chart legend |

---

## Slot Inventory by Primitive

### Button
```
root, icon, label
```

### Accordion
```
root, item, trigger, content, [icon]
```

### Tabs
```
root, list, tab, panel, [indicator, icon, badge, close, overflow, scroll-prev, scroll-next, contextmenu, drag-handle, ghost]
```

### Dialog
```
root, trigger, portal, overlay, content, header, title, description, footer, close
```

### Alert Dialog
```
root, trigger, portal, overlay, content, header, title, description, footer, cancel, action
```

### Popover
```
root, trigger, content, arrow, close
```

### Tooltip
```
root, trigger, content, arrow
```

### Select
```
root, trigger, value, content, viewport, item, label, separator
```

### Combobox
```
root, input, trigger, content, item, empty
```

### Checkbox
```
root, indicator
```

### Radio Group
```
root, item, indicator
```

### Switch
```
root, thumb
```

### Input
```
root, label, control, help, error
```

### Progress
```
root, indicator
```

### Dropdown Menu
```
root, trigger, content, item, separator, sub, sub-trigger, sub-content, checkbox-item, radio-group, radio-item
```

### Context Menu
```
root, trigger, content, item, separator, sub, sub-trigger, sub-content
```

### Navigation Menu
```
root, list, item, trigger, content, link, indicator, viewport
```

### Menubar
```
root, menu, trigger, content, item, separator, sub, sub-trigger, sub-content
```

### Scroll Area
```
root, viewport, scrollbar, thumb
```

### Avatar
```
root, image, fallback
```

### Toast
```
root, title, description, action, close
```

### Alert
```
root, title, description
```

### Calendar
```
root, header, heading, grid, cell, day
```

### Date Field
```
root, label, input, segment
```

### Date Picker
```
root, trigger, content, calendar
```

### Command
```
root, input, list, empty, group, item, separator
```

### Pagination
```
root, list, item, prev, next, ellipsis
```

### Breadcrumb
```
root, list, item, link, separator, page
```

### Data Table
```
root, header, body, row, cell, header-cell
```

---

## Slot vs Recipe

| Use Slot | Use Recipe |
|----------|------------|
| Structural part | Visual effect |
| Has semantic meaning | Purely decorative |
| Needs `data-slot` targeting | Needs CSS class targeting |
| Provider maps to it | No provider involvement |

### Examples

**Slot (structural):**
```html
<div data-slot="content">Main content here</div>
```

**Recipe (visual):**
```html
<div class="glass-surface grain-overlay">Visual effect</div>
```

---

**This is the canonical slot vocabulary.**
