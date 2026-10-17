# Sprint 08 — Menus & Navigation

> **Scope**: dropdown-menu, context-menu, menubar, navigation-menu, command
> **Goal**: Add 5 primitives bringing total from 33 → 38. Full taxonomy contracts + structural shells.
> **Gate**: `pnpm svelte-check` passes. 0 errors. `/cl-primitive-verify` gold standard on all 5.
> **Created**: 2026-02-01
> **Status**: IN PROGRESS

---

## Scope Summary

| Kind | Type | Provider | Slots | Context | Renderless | Self-closing |
|------|------|----------|-------|---------|------------|--------------|
| dropdown-menu | Compound | meltui | 13 (root†, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub†, sub-trigger, sub-content) | `{ open }` | root, sub | — |
| context-menu | Compound | meltui | 13 (root†, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub†, sub-trigger, sub-content) | `{ open }` | root, sub | — |
| menubar | Compound | meltui | 14 (root, menu†, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub†, sub-trigger, sub-content) | `MenubarContext` + `MenubarMenuContext { open }` | menu, sub | — |
| navigation-menu | Compound | coldlight | 7 (root, list, item, trigger, content, link, viewport) | `{ value }` | — | — |
| command | Compound | coldlight | 7 (root, input‡, list, group, item, empty, separator) | `{ value }` | — | input |

† renderless (fragment element)  ‡ self-closing (input element)

---

## Primitive Details

### DROPDOWN-MENU (13 slots)

WAI-ARIA: Menu pattern. role="menu" on content, role="menuitem" / "menuitemcheckbox" / "menuitemradio" on items.
Keyboard: ArrowUp, ArrowDown, ArrowLeft (close sub), ArrowRight (open sub), Enter, Space, Escape, Home, End.
Focus: roving tabindex within menu items. Dismiss: Escape + outside click.

| Slot | Element | Children | data-state | Notes |
|------|---------|----------|------------|-------|
| root | fragment | renderless | — | Context provider, no DOM |
| trigger | button | snippet | — | Opens the menu |
| content | div | snippet | open/closed | The popup menu |
| group | div | snippet | — | Groups related items |
| item | div | snippet | — | Clickable menu item |
| checkbox-item | div | snippet | checked/unchecked | Checkable menu item |
| radio-group | div | snippet | — | Groups radio items |
| radio-item | div | snippet | checked/unchecked | Radio menu item |
| label | div | snippet | — | Group label |
| separator | div | snippet | — | Visual separator |
| sub | fragment | renderless | — | Sub-menu context |
| sub-trigger | div | snippet | open/closed | Opens sub-menu |
| sub-content | div | snippet | open/closed | Sub-menu popup |

Context: `DropdownMenuContext = { readonly open: boolean }`

### CONTEXT-MENU (13 slots)

Same menu pattern as dropdown-menu. Trigger is a div wrapping the right-click target area.
Only difference: trigger element is div (not button), activation is right-click (handled by adapter).

| Slot | Element | Children | Notes |
|------|---------|----------|-------|
| root | fragment | renderless | Same as dropdown-menu |
| trigger | div | snippet | **div** — wraps right-click target area |
| (rest) | | | Identical to dropdown-menu |

Context: `ContextMenuContext = { readonly open: boolean }`

### MENUBAR (14 slots)

WAI-ARIA: Menubar pattern. role="menubar" on root. Contains multiple menu instances.
Keyboard: ArrowLeft/Right between menu triggers, ArrowUp/Down within menus.
Root is a DOM element (div), not renderless. Menu is renderless (context for each dropdown).

| Slot | Element | Children | Notes |
|------|---------|----------|-------|
| root | div | snippet | The horizontal bar container |
| menu | fragment | renderless | Per-menu context wrapper |
| trigger | button | snippet | Menu button in bar |
| content | div | snippet | data-state=open/closed |
| (menu items) | | | Same as dropdown-menu (group through sub-content) |

Dual context:
- `MenubarContext = {}` (compound existence)
- `MenubarMenuContext = { readonly open: boolean }` (per-menu state)

### NAVIGATION-MENU (7 slots)

Navigation landmark with expandable sub-menus. role="navigation" on root.
Keyboard: ArrowLeft/Right between items, ArrowDown to open, Escape to close.

| Slot | Element | Children |
|------|---------|----------|
| root | nav | snippet |
| list | ul | snippet |
| item | li | snippet |
| trigger | button | snippet |
| content | div | snippet |
| link | a | snippet |
| viewport | div | snippet |

Context: `NavigationMenuContext = { readonly value: string }`

### COMMAND (7 slots)

Command palette / search interface. Combobox pattern with filterable list.
role="combobox" on root, role="listbox" on list, role="option" on items.
Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close.

| Slot | Element | Children |
|------|---------|----------|
| root | div | snippet |
| input | input | self-closing |
| list | div | snippet |
| group | div | snippet |
| item | div | snippet |
| empty | div | snippet |
| separator | div | snippet |

Context: `CommandContext = { readonly value: string }`

---

## Execution Checklist

### 8.1 DROPDOWN-MENU (19 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/dropdown-menu/types.ts`
- [ ] `taxonomy/kinds/primitives/dropdown-menu/contract.ts`
- [ ] `taxonomy/kinds/primitives/dropdown-menu/index.ts`

Primitives:
- [ ] `primitives/dropdown-menu/types.ts`
- [ ] `primitives/dropdown-menu/context.ts`
- [ ] `primitives/dropdown-menu/DropdownMenu.svelte` (renderless)
- [ ] `primitives/dropdown-menu/DropdownMenuTrigger.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuContent.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuGroup.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuItem.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuCheckboxItem.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuRadioGroup.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuRadioItem.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuLabel.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuSeparator.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuSub.svelte` (renderless)
- [ ] `primitives/dropdown-menu/DropdownMenuSubTrigger.svelte`
- [ ] `primitives/dropdown-menu/DropdownMenuSubContent.svelte`
- [ ] `primitives/dropdown-menu/index.ts`

### 8.2 CONTEXT-MENU (19 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/context-menu/types.ts`
- [ ] `taxonomy/kinds/primitives/context-menu/contract.ts`
- [ ] `taxonomy/kinds/primitives/context-menu/index.ts`

Primitives:
- [ ] `primitives/context-menu/types.ts`
- [ ] `primitives/context-menu/context.ts`
- [ ] `primitives/context-menu/ContextMenu.svelte` (renderless)
- [ ] `primitives/context-menu/ContextMenuTrigger.svelte`
- [ ] `primitives/context-menu/ContextMenuContent.svelte`
- [ ] `primitives/context-menu/ContextMenuGroup.svelte`
- [ ] `primitives/context-menu/ContextMenuItem.svelte`
- [ ] `primitives/context-menu/ContextMenuCheckboxItem.svelte`
- [ ] `primitives/context-menu/ContextMenuRadioGroup.svelte`
- [ ] `primitives/context-menu/ContextMenuRadioItem.svelte`
- [ ] `primitives/context-menu/ContextMenuLabel.svelte`
- [ ] `primitives/context-menu/ContextMenuSeparator.svelte`
- [ ] `primitives/context-menu/ContextMenuSub.svelte` (renderless)
- [ ] `primitives/context-menu/ContextMenuSubTrigger.svelte`
- [ ] `primitives/context-menu/ContextMenuSubContent.svelte`
- [ ] `primitives/context-menu/index.ts`

### 8.3 MENUBAR (20 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/menubar/types.ts`
- [ ] `taxonomy/kinds/primitives/menubar/contract.ts`
- [ ] `taxonomy/kinds/primitives/menubar/index.ts`

Primitives:
- [ ] `primitives/menubar/types.ts`
- [ ] `primitives/menubar/context.ts` (dual: MenubarContext + MenubarMenuContext)
- [ ] `primitives/menubar/Menubar.svelte`
- [ ] `primitives/menubar/MenubarMenu.svelte` (renderless)
- [ ] `primitives/menubar/MenubarTrigger.svelte`
- [ ] `primitives/menubar/MenubarContent.svelte`
- [ ] `primitives/menubar/MenubarGroup.svelte`
- [ ] `primitives/menubar/MenubarItem.svelte`
- [ ] `primitives/menubar/MenubarCheckboxItem.svelte`
- [ ] `primitives/menubar/MenubarRadioGroup.svelte`
- [ ] `primitives/menubar/MenubarRadioItem.svelte`
- [ ] `primitives/menubar/MenubarLabel.svelte`
- [ ] `primitives/menubar/MenubarSeparator.svelte`
- [ ] `primitives/menubar/MenubarSub.svelte` (renderless)
- [ ] `primitives/menubar/MenubarSubTrigger.svelte`
- [ ] `primitives/menubar/MenubarSubContent.svelte`
- [ ] `primitives/menubar/index.ts`

### 8.4 NAVIGATION-MENU (13 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/navigation-menu/types.ts`
- [ ] `taxonomy/kinds/primitives/navigation-menu/contract.ts`
- [ ] `taxonomy/kinds/primitives/navigation-menu/index.ts`

Primitives:
- [ ] `primitives/navigation-menu/types.ts`
- [ ] `primitives/navigation-menu/context.ts`
- [ ] `primitives/navigation-menu/NavigationMenu.svelte`
- [ ] `primitives/navigation-menu/NavigationMenuList.svelte`
- [ ] `primitives/navigation-menu/NavigationMenuItem.svelte`
- [ ] `primitives/navigation-menu/NavigationMenuTrigger.svelte`
- [ ] `primitives/navigation-menu/NavigationMenuContent.svelte`
- [ ] `primitives/navigation-menu/NavigationMenuLink.svelte`
- [ ] `primitives/navigation-menu/NavigationMenuViewport.svelte`
- [ ] `primitives/navigation-menu/index.ts`

### 8.5 COMMAND (13 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/command/types.ts`
- [ ] `taxonomy/kinds/primitives/command/contract.ts`
- [ ] `taxonomy/kinds/primitives/command/index.ts`

Primitives:
- [ ] `primitives/command/types.ts`
- [ ] `primitives/command/context.ts`
- [ ] `primitives/command/Command.svelte`
- [ ] `primitives/command/CommandInput.svelte` (self-closing)
- [ ] `primitives/command/CommandList.svelte`
- [ ] `primitives/command/CommandGroup.svelte`
- [ ] `primitives/command/CommandItem.svelte`
- [ ] `primitives/command/CommandEmpty.svelte`
- [ ] `primitives/command/CommandSeparator.svelte`
- [ ] `primitives/command/index.ts`

### 8.6 BARREL UPDATES

- [ ] `primitives/index.ts` — add 5 re-exports
- [ ] `taxonomy/kinds/primitives/index.ts` — add 5 export blocks

### 8.7 GATE CHECK

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All contracts have ALL fields: kind, ariaStateProvider, slots, slotSpec, states, slotStates, slotActions, aria, keyboard, focusStrategy, compound
- [ ] Renderless roots: only `{@render children?.()}`, no HTML element, no data-attrs, no cn(), BaseProps only
- [ ] Self-closing elements: no children, no `{@render}`, `<input />`
- [ ] ZERO: `@melt-ui/svelte` imports, `use:melt`, `role`, `aria-*`, `id`, event handlers
- [ ] Every `.ts` import uses `.js` extension

---

## Remaining After Sprint 08

**38/40 complete. 2 remaining + 1 utility for Sprint 09:**
- combobox, pagination (Sprint 09 — Data & Final)
- aspect-ratio (utility)
