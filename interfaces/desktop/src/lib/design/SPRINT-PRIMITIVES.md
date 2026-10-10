# SPRINT: Primitives — Convert .ts Re-exports to .svelte Wrappers

> **BLOCKING:** Components and renderers depend on this. Do this first.

---

## CURRENT STATE

- **31 `.ts` files** — bare re-exports: `export { X } from "meltui"`
- **33 `.svelte` files** — custom primitives with ColdLight pattern

**Problem:** The `.ts` re-exports have NO ColdLight pattern. No `data-kind`, `data-name`, `data-part`. No `OmitStyle`. No `stripStyleProp`.

---

## THE WORK

Convert each `.ts` re-export to a proper `.svelte` wrapper.

### Pattern to Follow

```svelte
<!--
  @file primitives/Button.svelte
  @layer primitives

  Bits UI Button with ColdLight pattern.
-->
<script lang="ts">
  import { Button as BitsButton } from "meltui";
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLButtonElement>, BaseProps {
    children?: Snippet;
    disabled?: boolean;
  }

  let {
    children,
    disabled = false,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Button");
</script>

<BitsButton.Root
  {disabled}
  class={className}
  data-kind="primitive"
  data-name="Button"
  data-part="root"
  data-id={id}
  {...rest}
>
  {@render children?.()}
</BitsButton.Root>
```

---

## TIER 1: HIGH-USE (6 files)

| # | Delete | Create | Bits UI Parts to Wrap |
|---|--------|--------|----------------------|
| 1 | Button.ts | Button.svelte | Root |
| 2 | Dialog.ts | Dialog.svelte | Root, Trigger, Portal, Overlay, Content, Title, Description, Close |
| 3 | Popover.ts | Popover.svelte | Root, Trigger, Content, Arrow, Close |
| 4 | Select.ts | Select.svelte | Root, Trigger, Value, Content, Item, Label, Separator |
| 5 | Tabs.ts | Tabs.svelte | Root, List, Trigger, Content |
| 6 | Toggle.ts | Toggle.svelte | Root |

**Checklist:**
- [ ] Button.svelte created, Button.ts deleted
- [ ] Dialog.svelte created, Dialog.ts deleted
- [ ] Popover.svelte created, Popover.ts deleted
- [ ] Select.svelte created, Select.ts deleted
- [ ] Tabs.svelte created, Tabs.ts deleted
- [ ] Toggle.svelte created, Toggle.ts deleted

---

## TIER 2: MEDIUM-USE (8 files)

| # | Delete | Create |
|---|--------|--------|
| 7 | Accordion.ts | Accordion.svelte |
| 8 | AlertDialog.ts | AlertDialog.svelte |
| 9 | Checkbox.ts | Checkbox.svelte |
| 10 | ContextMenu.ts | ContextMenu.svelte |
| 11 | DropdownMenu.ts | DropdownMenu.svelte |
| 12 | RadioGroup.ts | RadioGroup.svelte |
| 13 | Switch.ts | Switch.svelte |
| 14 | Tooltip.ts | Tooltip.svelte |

**Checklist:**
- [ ] Accordion.svelte created, Accordion.ts deleted
- [ ] AlertDialog.svelte created, AlertDialog.ts deleted
- [ ] Checkbox.svelte created, Checkbox.ts deleted
- [ ] ContextMenu.svelte created, ContextMenu.ts deleted
- [ ] DropdownMenu.svelte created, DropdownMenu.ts deleted
- [ ] RadioGroup.svelte created, RadioGroup.ts deleted
- [ ] Switch.svelte created, Switch.ts deleted
- [ ] Tooltip.svelte created, Tooltip.ts deleted

---

## TIER 3: LOW-USE (17 files)

| # | Delete | Create |
|---|--------|--------|
| 15 | AspectRatio.ts | AspectRatio.svelte |
| 16 | Avatar.ts | Avatar.svelte |
| 17 | Calendar.ts | Calendar.svelte |
| 18 | Collapsible.ts | Collapsible.svelte |
| 19 | Combobox.ts | Combobox.svelte |
| 20 | Command.ts | Command.svelte |
| 21 | DateField.ts | DateField.svelte |
| 22 | DatePicker.ts | DatePicker.svelte |
| 23 | HoverCard.ts | HoverCard.svelte |
| 24 | Label.ts | Label.svelte |
| 25 | Menubar.ts | Menubar.svelte |
| 26 | NavigationMenu.ts | NavigationMenu.svelte |
| 27 | Pagination.ts | Pagination.svelte |
| 28 | Progress.ts | Progress.svelte |
| 29 | ScrollArea.ts | ScrollArea.svelte |
| 30 | Separator.ts | Separator.svelte |
| 31 | Slider.ts | Slider.svelte |
| 32 | TimeField.ts | TimeField.svelte |
| 33 | ToggleGroup.ts | ToggleGroup.svelte |

**Checklist:**
- [ ] AspectRatio.svelte created, AspectRatio.ts deleted
- [ ] Avatar.svelte created, Avatar.ts deleted
- [ ] Calendar.svelte created, Calendar.ts deleted
- [ ] Collapsible.svelte created, Collapsible.ts deleted
- [ ] Combobox.svelte created, Combobox.ts deleted
- [ ] Command.svelte created, Command.ts deleted
- [ ] DateField.svelte created, DateField.ts deleted
- [ ] DatePicker.svelte created, DatePicker.ts deleted
- [ ] HoverCard.svelte created, HoverCard.ts deleted
- [ ] Label.svelte created, Label.ts deleted
- [ ] Menubar.svelte created, Menubar.ts deleted
- [ ] NavigationMenu.svelte created, NavigationMenu.ts deleted
- [ ] Pagination.svelte created, Pagination.ts deleted
- [ ] Progress.svelte created, Progress.ts deleted
- [ ] ScrollArea.svelte created, ScrollArea.ts deleted
- [ ] Separator.svelte created, Separator.ts deleted
- [ ] Slider.svelte created, Slider.ts deleted
- [ ] TimeField.svelte created, TimeField.ts deleted
- [ ] ToggleGroup.svelte created, ToggleGroup.ts deleted

---

## AFTER EACH TIER

1. Update `index.ts` exports (change `.js` to `.svelte`)
2. Run `pnpm svelte-check`
3. Fix any type errors

---

## FINAL CHECKLIST

- [ ] All 31 `.ts` files deleted
- [ ] All 31 `.svelte` wrappers created
- [ ] `index.ts` exports updated
- [ ] `pnpm svelte-check` passes with 0 errors
- [ ] All primitives have `data-kind="primitive"`, `data-name`, `data-part`

---

## DONE WHEN

Every primitive in the design system:
1. Has ColdLight pattern (`OmitStyle`, `BaseProps`, `data-*` attributes)
2. Exports from `index.ts`
3. Type-checks clean
