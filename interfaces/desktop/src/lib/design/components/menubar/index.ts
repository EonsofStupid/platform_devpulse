/**
 * @file Menubar Component Barrel
 * @kind menubar
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as Menubar } from "./Menubar.svelte";
export { default as MenubarMenu } from "./MenubarMenu.svelte";
export { default as MenubarTrigger } from "./MenubarTrigger.svelte";
export { default as MenubarContent } from "./MenubarContent.svelte";
export { default as MenubarItem } from "./MenubarItem.svelte";
export { default as MenubarSeparator } from "./MenubarSeparator.svelte";

export { contract as menubarComponentContract } from "./contract.js";
export { menubarRecipe } from "./recipe.js";
export {
	setMenubarRootContext,
	getMenubarRootContext,
	setMenubarMenuContext,
	getMenubarMenuContext,
} from "./context.js";

export type {
	MenubarProps,
	MenubarMenuProps,
	MenubarTriggerProps,
	MenubarContentProps,
	MenubarItemProps,
	MenubarSeparatorProps,
	MenubarSize,
} from "./types.js";

export type { MenubarRootCtx, MenubarMenuCtx } from "./context.js";
