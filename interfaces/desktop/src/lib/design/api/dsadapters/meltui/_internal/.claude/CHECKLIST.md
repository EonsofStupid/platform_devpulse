# MeltUI _internal Runtime — Checklist

> **Runtime mapping from MeltUI → ColdLight data attributes.**

---

## FILES

| File | Purpose | Status |
|------|---------|--------|
| `types.ts` | `ColdLightRuntimeParts`, `MeltUIInternalAdapter` | ✅ |
| `index.ts` | Barrel with `getMeltInternal()` | ✅ |

---

## IMPLEMENTED ADAPTERS (10 of 49)

### Buttons & Toggles
- [x] `button.internal.ts`
- [ ] `toggle.internal.ts`
- [ ] `toggleGroup.internal.ts`
- [x] `switch.internal.ts`

### Inputs & Forms
- [x] `checkbox.internal.ts`
- [ ] `radioGroup.internal.ts`
- [ ] `slider.internal.ts`
- [ ] `label.internal.ts`
- [x] `input.internal.ts`
- [ ] `textarea.internal.ts`
- [x] `select.internal.ts`
- [ ] `combobox.internal.ts`

### Date & Time
- [ ] `calendar.internal.ts`
- [ ] `dateField.internal.ts`
- [ ] `datePicker.internal.ts`
- [ ] `timeField.internal.ts`

### Dialogs & Overlays
- [x] `dialog.internal.ts`
- [ ] `alertDialog.internal.ts`
- [x] `popover.internal.ts`
- [ ] `hoverCard.internal.ts`
- [x] `tooltip.internal.ts`
- [ ] `contextMenu.internal.ts`
- [ ] `dropdownMenu.internal.ts`

### Navigation
- [x] `tabs.internal.ts`
- [x] `accordion.internal.ts`
- [ ] `collapsible.internal.ts`
- [ ] `navigationMenu.internal.ts`
- [ ] `menubar.internal.ts`
- [ ] `pagination.internal.ts`
- [ ] `breadcrumb.internal.ts`

### Layout & Display
- [ ] `aspectRatio.internal.ts`
- [ ] `avatar.internal.ts`
- [ ] `separator.internal.ts`
- [ ] `scrollArea.internal.ts`
- [ ] `progress.internal.ts`

### Search & Commands
- [ ] `command.internal.ts`

### Feedback
- [ ] `toast.internal.ts`
- [ ] `alert.internal.ts`
- [ ] `badge.internal.ts`
- [ ] `skeleton.internal.ts`
- [ ] `spinner.internal.ts`

### Utilities
- [ ] `portal.internal.ts`
- [ ] `presence.internal.ts`
- [ ] `focusTrap.internal.ts`
- [ ] `visuallyHidden.internal.ts`
- [ ] `liveStatus.internal.ts`
- [ ] `kbd.internal.ts`

### Data Display
- [ ] `dataTable.internal.ts`
- [ ] `chart.internal.ts`

---

## USAGE

```typescript
import { getMeltInternal, hasMeltInternal } from '$lib/design/api/adapters/meltui/_internal';

// Get runtime parts for a primitive
const parts = getMeltInternal('button').build({ disabled: true });

// Spread onto elements
<button {...parts.root}>
  <span {...parts.icon}>...</span>
  <span {...parts.label}>Click me</span>
</button>
```

---

## OUTPUT FORMAT

Each `build()` returns:

```typescript
{
  root: {
    'data-kind': 'button',
    'data-slot': 'root',
    'data-state': 'idle'
  },
  // additional slots...
}
```

---

## VERIFICATION

```bash
cd interfaces/desktop

# Type check
pnpm check

# Verify exports
ls src/lib/design/api/adapters/meltui/_internal/
# Expected: types.ts index.ts *.internal.ts
```

---

## SIGN-OFF

1. Types defined? **YES**
2. Index barrel created? **YES**
3. Core primitives implemented? **YES** (10 of 49)
4. getMeltInternal() works? **YES**
5. hasMeltInternal() works? **YES**

---

**10 primitives unblocked. Add more as needed.**
