# Research: TypeScript Errors Blocking svelte-check

**Date**: 2026-02-07
**Sprint**: SPRINT-TS-ERRORS-CLEANUP
**Status**: COMPLETE

## Question/Goal
Fix all 11 remaining TypeScript errors so svelte-check passes clean.

## Error Inventory

### Group A: Missing exports from `imports.gen.ts` (7 errors)

**Root cause:** `imports.gen.ts` only has combobox entries. Dialog and Tabs sections were never added. Additionally, `ComboboxActions` was never exported.

| File | Missing Import | Status |
|------|---------------|--------|
| `components/combobox/context.ts:3` | `ComboboxActions` | Not exported from imports.gen.ts |
| `components/dialog/context.ts:3` | `DialogAttachments` | No dialog section in imports.gen.ts |
| `components/dialog/context.ts:4` | `DialogInstance` | No dialog section in imports.gen.ts |
| `components/dialog/Dialog.svelte:5` | `createDialog` | No dialog section in imports.gen.ts |
| `components/tabs/context.ts:2` | `TabsActions` | No tabs section in imports.gen.ts |
| `components/tabs/context.ts:2` | `TabsInstance` | No tabs section in imports.gen.ts |
| `components/tabs/Tabs.svelte:5` | `createTabs` | No tabs section in imports.gen.ts |

**Fix path:** Create adapter factory files for dialog and tabs (like combobox/factory.ts), then add their re-exports to imports.gen.ts. Also add `ComboboxActions` type.

### Group B: `transport.states` doesn't exist on melt classes (3 errors)

**Root cause:** Combobox.svelte and Dialog.svelte use `transport.states.open`, `transport.states.value`, etc. But melt v0.44 Combobox class has direct properties (`combobox.open`, `combobox.value`, `combobox.inputValue`), not a `.states` namespace. Same for Dialog (`dialog.open`).

| File | Error | Actual melt API |
|------|-------|----------------|
| `Combobox.svelte:50` | `transport.states.open` | `transport.open` (direct setter) |
| `Combobox.svelte:53` | `transport.states.value` | `transport.value` (direct setter) |
| `Combobox.svelte:56` | `transport.states.inputValue` | `transport.inputValue` (direct setter) |

**Fix path:** The adapter factory should expose a `.states` facade if the components expect it, OR the components should use direct property access. Since imports.gen.ts is the adapter cloak, the factory should provide the interface the components expect.

### Group C: Registry manifest type cast (1 error)

**Root cause:** `registry.ts:20` does `manifestJson as ColdLightManifest`. The JSON has `slotSpec` entries where some slots are `undefined` (optional slots that don't exist for that primitive). But `ManifestPrimitive.slotSpec` is `Record<string, SlotSpec>` which doesn't allow `undefined` values.

**Fix path:** The JSON manifest has optional properties per-primitive that don't apply. The cast fails because the JSON shape includes keys with `undefined` values that don't satisfy `SlotSpec`. Fix: cast through `unknown`.

## Melt v0.44 API Shape (from d.ts files)

### Combobox
- Class: `Combobox<T, Multiple>`
- Direct properties: `value`, `inputValue`, `highlighted`, `open` (inherited from BasePopover), `touched`, `multiple`, `scrollAlignment`
- Methods: `select()`, `getOption()`, `highlight()`, `highlightNext/Prev/First/Last()`, `isSelected()`
- Getters: `label`, `input`, `trigger`, `content`

### Dialog
- Class: `Dialog`
- Direct properties: `open`, `closeOnEscape`, `closeOnOutsideClick`, `scrollLock`
- Getters: `trigger`, `content`, `overlay`, `sharedProps`, `refs`

### Tabs
- Class: `Tabs<T>`
- Direct properties: `value`, `selectWhenFocused`, `loop`, `orientation`
- Getters: `triggerList`
- Methods: `getTrigger(value)`, `getContent(value)`

## Findings

1. Melt v0.44 uses direct class properties (no `.states` namespace)
2. The adapter factories need to either wrap melt classes with a `.states` facade OR the components need to use direct access
3. The simpler fix: components use direct transport properties since the factory returns the melt instance directly
4. Dialog and Tabs need adapter factories created (like combobox has)
5. The manifest cast just needs `as unknown as ColdLightManifest`

## Recommendations

**Approach: Minimal targeted fixes**

1. Create `dialog/factory.ts` and `tabs/factory.ts` adapter files
2. Add dialog + tabs exports to `imports.gen.ts`
3. Add `ComboboxActions` type to combobox factory (or remove from context.ts if unused concept)
4. Fix `transport.states.X` → `transport.X` in component .svelte files
5. Fix `DialogAttachments` and `TabsActions` types — define or remove from context.ts
6. Fix registry.ts cast through unknown

## Files Referenced
- `taxonomy/.generated/imports.gen.ts`: Only has combobox, missing dialog + tabs
- `api/adapters/meltui/_internal/combobox/factory.ts`: Pattern to follow for dialog/tabs
- `components/combobox/Combobox.svelte`: Uses `transport.states.X` (wrong API)
- `components/dialog/Dialog.svelte`: Imports missing `createDialog`
- `components/tabs/Tabs.svelte`: Imports missing `createTabs`
- `components/*/context.ts`: Import types that don't exist
- `taxonomy/registry.ts`: Manifest cast fails
- `melt/dist/builders/*.d.ts`: Actual melt API shapes
