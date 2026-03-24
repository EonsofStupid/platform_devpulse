/**
 * @file Menubar Component Barrel
 * @kind menubar
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export type { MenubarMenuCtx, MenubarRootCtx } from "./context.js";
export {
	getMenubarMenuContext,
	getMenubarRootContext,
	setMenubarMenuContext,
	setMenubarRootContext,
} from "./context.js";
export { default as Menubar } from "./Menubar.svelte";
export { default as MenubarContent } from "./MenubarContent.svelte";
export { default as MenubarItem } from "./MenubarItem.svelte";
export { default as MenubarMenu } from "./MenubarMenu.svelte";
export { default as MenubarSeparator } from "./MenubarSeparator.svelte";
export { default as MenubarTrigger } from "./MenubarTrigger.svelte";
export { menubarComposition } from "./composition.js";
export type {
	MenubarContentProps,
	MenubarItemProps,
	MenubarMenuProps,
	MenubarProps,
	MenubarSeparatorProps,
	MenubarSize,
	MenubarTriggerProps,
} from "./types.js";
