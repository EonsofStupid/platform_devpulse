/**
 * @file Dropdown Menu Component Barrel
 * @kind dropdown-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export type { DropdownMenuContext } from "./context.js";
export { getDropdownMenuContext, setDropdownMenuContext } from "./context.js";
export { contract as dropdownMenuComponentContract } from "./contract.js";
export { default as DropdownMenu } from "./DropdownMenu.svelte";
export { default as DropdownMenuContent } from "./DropdownMenuContent.svelte";
export { default as DropdownMenuGroup } from "./DropdownMenuGroup.svelte";
export { default as DropdownMenuItem } from "./DropdownMenuItem.svelte";
export { default as DropdownMenuLabel } from "./DropdownMenuLabel.svelte";
export { default as DropdownMenuSeparator } from "./DropdownMenuSeparator.svelte";
export { default as DropdownMenuTrigger } from "./DropdownMenuTrigger.svelte";
export { dropdownMenuRecipe } from "./recipe.js";
export type {
	DropdownMenuContentProps,
	DropdownMenuGroupProps,
	DropdownMenuItemProps,
	DropdownMenuLabelProps,
	DropdownMenuProps,
	DropdownMenuSeparatorProps,
	DropdownMenuSize,
	DropdownMenuTriggerProps,
} from "./types.js";
