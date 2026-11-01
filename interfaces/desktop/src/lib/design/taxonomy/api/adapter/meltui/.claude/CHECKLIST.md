# MeltUI Adapter Taxonomy — Checklist

> **Contract and registry for MeltUI → ColdLight mapping.**

---

## FILES

| File | Purpose | Status |
|------|---------|--------|
| `types.ts` | `MeltUIAdapterEntry`, `MeltUIAdapterRegistry` | ✅ |
| `meltui.contract.ts` | `MeltUIContract` interface | ✅ |
| `meltui.registry.ts` | Full mapping for all 49 primitives | ✅ |
| `index.ts` | Barrel export | ✅ |

---

## MAPPING STRUCTURE

Each primitive entry contains:
- `kind` — ColdLight primitive kind
- `internalImpl` — Path to `_internal/*.internal.ts` file
- `stateMap` — Provider state → ColdLight state
- `slotMap` — Provider slot → ColdLight slot

---

## PRIMITIVES MAPPED (49 Total)

### Buttons & Toggles (4)
- [x] `button`
- [x] `toggle`
- [x] `toggleGroup`
- [x] `switch`

### Inputs & Forms (8)
- [x] `checkbox`
- [x] `radioGroup`
- [x] `slider`
- [x] `label`
- [x] `input`
- [x] `textarea`
- [x] `select`
- [x] `combobox`

### Date & Time (4)
- [x] `calendar`
- [x] `dateField`
- [x] `datePicker`
- [x] `timeField`

### Dialogs & Overlays (7)
- [x] `dialog`
- [x] `alertDialog`
- [x] `popover`
- [x] `hoverCard`
- [x] `tooltip`
- [x] `contextMenu`
- [x] `dropdownMenu`

### Navigation (7)
- [x] `tabs`
- [x] `accordion`
- [x] `collapsible`
- [x] `navigationMenu`
- [x] `menubar`
- [x] `pagination`
- [x] `breadcrumb`

### Layout & Display (5)
- [x] `aspectRatio`
- [x] `avatar`
- [x] `separator`
- [x] `scrollArea`
- [x] `progress`

### Search & Commands (1)
- [x] `command`

### Feedback (5)
- [x] `toast`
- [x] `alert`
- [x] `badge`
- [x] `skeleton`
- [x] `spinner`

### Utilities (6)
- [x] `portal`
- [x] `presence`
- [x] `focusTrap`
- [x] `visuallyHidden`
- [x] `liveStatus`
- [x] `kbd`

### Data Display (2)
- [x] `dataTable`
- [x] `chart`

---

## VERIFICATION

```bash
cd interfaces/desktop

# Type check
pnpm check

# Verify exports
ls src/lib/design/taxonomy/api/adapter/meltui/
# Expected: types.ts meltui.contract.ts meltui.registry.ts index.ts
```

---

## SIGN-OFF

1. All 49 primitives mapped? **YES**
2. State maps complete? **YES**
3. Slot maps complete? **YES**
4. Internal impl paths defined? **YES**
5. Barrel exports wired? **YES**

---

**Every box checked. No handwaving.**
