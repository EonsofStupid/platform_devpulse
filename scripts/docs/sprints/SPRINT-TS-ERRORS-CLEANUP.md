# SPRINT: TypeScript Errors Cleanup

**Date**: 2026-02-07
**Research**: SPRINT-TS-ERRORS-CLEANUP.research.md
**Goal**: Fix all 11 svelte-check errors to zero
**Errors at start**: 11 errors, 59 warnings
**Status**: COMPLETE — 0 errors, 59 warnings

---

## Root Cause (corrected after deeper audit)

The initial research incorrectly assumed dialog/tabs needed NEW meltui factories.
Deeper audit revealed the transport layer already existed:

- **Combobox**: `meltui/_internal/combobox/_transport/factory.ts` wraps melt v0.44
- **Dialog**: `coldlight/_internal/dialog/_transport/factory.ts` custom native `<dialog>`
- **Tabs**: `coldlight/_internal/tabs/_transport/factory.ts` custom native ARIA tabs

All transport factories provide `.slots` and `.states` namespaces.
The components using `transport.states.X` were CORRECT.

**Actual problem**: `imports.gen.ts` was wired to the raw melt factory (no `.states`)
instead of the transport factory, and was missing dialog/tabs sections entirely.

---

## TASK 1: Rewrite imports.gen.ts — wire to transport factories

**File**: `taxonomy/.generated/imports.gen.ts`

- [x] 1.1 Combobox: `createComboboxTransport as createCombobox` + `ComboboxTransport as ComboboxInstance` + `ComboboxActions`
- [x] 1.2 Dialog: `createDialogTransport as createDialog` + `DialogTransport as DialogInstance` + `DialogAttachments`
- [x] 1.3 Tabs: `createTabsTransport as createTabs` + `TabsTransport as TabsInstance` + `TabsActions`

## TASK 2: Fix registry.ts manifest cast

**File**: `taxonomy/registry.ts:20`

- [x] 2.1 Change `manifestJson as ColdLightManifest` → `manifestJson as unknown as ColdLightManifest`

## TASK 3: Add .cowlevel to .gitignore

- [x] 3.1 Add `interfaces/desktop/src/lib/design/.cowlevel` to root `.gitignore`

## TASK 4: Fix tauri.conf.json npm → pnpm

- [x] 4.1 `beforeDevCommand`: `npm run dev` → `pnpm dev`
- [x] 4.2 `beforeBuildCommand`: `npm run build` → `pnpm build`

## TASK 5: Verify

- [x] 5.1 Run `pnpm exec svelte-check --threshold error` — 0 errors confirmed

---

## Error Log

| Task | Error | Fix | Result |
|------|-------|-----|--------|
| 1.1 | `imports.gen.ts` pointed to raw `createMeltCombobox` (no `.states`) | Rewired to `createComboboxTransport` | PASS |
| 1.2 | Dialog section missing entirely | Added coldlight dialog transport exports | PASS |
| 1.3 | Tabs section missing entirely | Added coldlight tabs transport exports | PASS |
| 2.1 | `manifestJson as ColdLightManifest` type mismatch | Cast through `unknown` | PASS |

## Cancelled Tasks (from incorrect initial plan)

| Task | Reason cancelled |
|------|-----------------|
| Create dialog/factory.ts under meltui | coldlight adapter already has dialog with native `<dialog>` |
| Create tabs/factory.ts under meltui | coldlight adapter already has tabs with custom ARIA |
| Fix context.ts phantom types | Types exist in transport layer, just weren't re-exported |
| Fix `transport.states.X` → direct access | Transport pattern provides `.states`, components were correct |
