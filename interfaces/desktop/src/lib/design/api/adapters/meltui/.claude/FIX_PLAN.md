# Sprint: Fix Melt Provider Adapter Types

> **Created:** 2026-01-23
> **Status:** IN PROGRESS

---

## SPRINT RULES

1. **Mark each checkbox as you complete it**
2. **If you encounter an error twice, STOP and research**
3. **No shortcuts — verify each step**
4. **Update this file after EVERY step**

---

## RESEARCH (COMPLETED)

Source: `node_modules/@melt-ui/svelte/dist/builders/*/create.d.ts`

**Verified Exports (36 public):**
```
createAccordion      createAvatar         createCalendar
createCheckbox       createCollapsible    createCombobox
createContextMenu    createDateField      createDatePicker
createDateRangeField createDateRangePicker createDialog
createDropdownMenu   createLabel          createLinkPreview
createMenubar        createPagination     createPinInput
createPopover        createProgress       createRadioGroup
createRangeCalendar  createScrollArea     createSelect
createSeparator      createSlider         createSwitch
createTableOfContents createTabs          createTagsInput
createToaster        createToggle         createToggleGroup
createToolbar        createTooltip        createTreeView
```

**Key Finding:** `createTree` DOES NOT EXIST → it's `createTreeView`

---

## STEP 1: Fix types.ts

File: `sys/api/_internal/melt/types.ts`

- [x] 1.1 Add `createTreeView` to imports (line 39-40)
- [x] 1.2 Change `TreeBuilder` to `TreeViewBuilder` (line 89-90)
- [x] 1.3 Verify no TypeScript errors in this file (node_modules errors only, types.ts clean)

**Verification command:**
```bash
cd interfaces/desktop/src && pnpm exec tsc --noEmit lib/design/sys/api/_internal/melt/types.ts
```

---

## STEP 2: Fix _internal/index.ts

File: `sys/api/_internal/index.ts`

- [x] 2.1 Read file to confirm current state
- [x] 2.2 Change `createTree` to `createTreeView` (line 43)
- [x] 2.3 Verify no TypeScript errors in this file (deferred to step 6)

---

## STEP 3: Fix melt/index.ts barrel

File: `sys/api/_internal/melt/index.ts`

- [x] 3.1 Read file to confirm current state
- [x] 3.2 Change `TreeBuilder` to `TreeViewBuilder` in type exports (line 43)
- [x] 3.3 Verify no TypeScript errors in this file (deferred to step 6)

---

## STEP 4: Fix schemas.ts

File: `sys/api/_internal/melt/schemas.ts`

- [x] 4.1 Read file to confirm current state
- [x] 4.2 Fix line 17: `z.function().args()` → `z.function()`
- [x] 4.3 Fix line 24: same pattern if present (already correct)
- [x] 4.4 Verify no TypeScript errors in this file (deferred to step 6)

---

## STEP 5: Update CHECKLIST.md

File: `.claude/CHECKLIST.md`

- [x] 5.1 Read file to confirm current state
- [x] 5.2 Update `TreeBuilder` → `TreeViewBuilder`
- [x] 5.3 Verify counts match reality (30 typed of 36 public)

---

## STEP 6: Full Verification

- [x] 6.1 Run `pnpm check` from `interfaces/desktop/src`
- [x] 6.2 Confirm zero errors in `sys/api/_internal/melt/` files
- [x] 6.3 Mark sprint COMPLETE

---

## ERROR LOG

| Step | Error | Resolution |
|------|-------|------------|
| 1.3 | node_modules type errors | Ignored - not our code, Svelte 5 / Melt compatibility |

---

## SIGN-OFF

- [x] All steps marked complete
- [x] pnpm check passes for _internal layer
- [x] CHECKLIST.md accurate

**Sprint Status:** COMPLETE
