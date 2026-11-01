# ColdLight Taxonomy — Checklist

> **SSOT for ColdLight primitive kinds, slots, and states.**

---

## FILES

| File | Purpose | Status |
|------|---------|--------|
| `types.ts` | `ColdLightPrimitiveKind`, `ColdLightDataAttrs`, `ColdLightPrimitiveRuntime` | ✅ |
| `coldlight.contract.ts` | `ColdLightContract` interface | ✅ |
| `coldlight.registry.ts` | SSOT registry with all 49 primitives | ✅ |
| `index.ts` | Barrel export | ✅ |

---

## PRIMITIVES (49 Total)

### Buttons & Toggles (4)
- [x] `button` — root, icon, label
- [x] `toggle` — root
- [x] `toggleGroup` — root, item
- [x] `switch` — root, thumb

### Inputs & Forms (8)
- [x] `checkbox` — root, indicator
- [x] `radioGroup` — root, item, indicator
- [x] `slider` — root, track, range, thumb
- [x] `label` — root
- [x] `input` — root, label, control, help, error
- [x] `textarea` — root
- [x] `select` — root, trigger, value, content, viewport, item, label, separator
- [x] `combobox` — root, input, trigger, content, item, empty

### Date & Time (4)
- [x] `calendar` — root, header, heading, grid, cell, day
- [x] `dateField` — root, label, input, segment
- [x] `datePicker` — root, trigger, content, calendar
- [x] `timeField` — root, label, input, segment

### Dialogs & Overlays (7)
- [x] `dialog` — root, trigger, portal, overlay, content, header, title, description, footer, close
- [x] `alertDialog` — root, trigger, portal, overlay, content, header, title, description, footer, cancel, action
- [x] `popover` — root, trigger, content, arrow, close
- [x] `hoverCard` — root, trigger, content, arrow
- [x] `tooltip` — root, trigger, content, arrow
- [x] `contextMenu` — root, trigger, content, item, separator, sub, subTrigger, subContent
- [x] `dropdownMenu` — root, trigger, content, item, separator, sub, subTrigger, subContent, checkboxItem, radioGroup, radioItem

### Navigation (7)
- [x] `tabs` — root, list, trigger, content
- [x] `accordion` — root, item, trigger, content
- [x] `collapsible` — root, trigger, content
- [x] `navigationMenu` — root, list, item, trigger, content, link, indicator, viewport
- [x] `menubar` — root, menu, trigger, content, item, separator, sub, subTrigger, subContent
- [x] `pagination` — root, list, item, prev, next, ellipsis
- [x] `breadcrumb` — root, list, item, link, separator, page

### Layout & Display (5)
- [x] `aspectRatio` — root
- [x] `avatar` — root, image, fallback
- [x] `separator` — root
- [x] `scrollArea` — root, viewport, scrollbar, thumb
- [x] `progress` — root, indicator

### Search & Commands (1)
- [x] `command` — root, input, list, empty, group, item, separator

### Feedback (5)
- [x] `toast` — root, title, description, action, close
- [x] `alert` — root, title, description
- [x] `badge` — root
- [x] `skeleton` — root
- [x] `spinner` — root

### Utilities (6)
- [x] `portal` — root
- [x] `presence` — root
- [x] `focusTrap` — root
- [x] `visuallyHidden` — root
- [x] `liveStatus` — root
- [x] `kbd` — root

### Data Display (2)
- [x] `dataTable` — root, header, body, row, cell, headerCell
- [x] `chart` — root, canvas, legend, tooltip

---

## VERIFICATION

```bash
cd interfaces/desktop

# Type check
pnpm check

# Verify exports
ls src/lib/design/taxonomy/api/adapter/coldlight/
# Expected: types.ts coldlight.contract.ts coldlight.registry.ts index.ts
```

---

## SIGN-OFF

1. All 49 primitive kinds defined? **YES**
2. All slots defined per kind? **YES**
3. All states defined per kind? **YES**
4. Types derived from registry? **YES**
5. Barrel exports wired? **YES**

---

**Every box checked. This is the SSOT.**
