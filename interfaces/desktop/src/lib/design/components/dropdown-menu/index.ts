/**
 * @file Dropdown Menu Component Barrel
 * @kind dropdown-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as DropdownMenu } from "./DropdownMenu.svelte";
export { default as DropdownMenuTrigger } from "./DropdownMenuTrigger.svelte";
export { default as DropdownMenuContent } from "./DropdownMenuContent.svelte";
export { default as DropdownMenuItem } from "./DropdownMenuItem.svelte";
export { default as DropdownMenuSeparator } from "./DropdownMenuSeparator.svelte";
export { default as DropdownMenuGroup } from "./DropdownMenuGroup.svelte";
export { default as DropdownMenuLabel } from "./DropdownMenuLabel.svelte";

export { contract as dropdownMenuComponentContract } from "./contract.js";
export { dropdownMenuRecipe } from "./recipe.js";
export { setDropdownMenuContext, getDropdownMenuContext } from "./context.js";

export type {
	DropdownMenuProps,
	DropdownMenuTriggerProps,
	DropdownMenuContentProps,
	DropdownMenuItemProps,
	DropdownMenuSeparatorProps,
	DropdownMenuGroupProps,
	DropdownMenuLabelProps,
	DropdownMenuSize,
} from "./types.js";

export type { DropdownMenuContext } from "./context.js";
