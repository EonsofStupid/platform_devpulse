/**
 * @file Context Menu Component Barrel
 * @kind context-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as ContextMenu } from "./ContextMenu.svelte";
export { default as ContextMenuContent } from "./ContextMenuContent.svelte";
export { default as ContextMenuItem } from "./ContextMenuItem.svelte";
export { default as ContextMenuSeparator } from "./ContextMenuSeparator.svelte";
export { default as ContextMenuTrigger } from "./ContextMenuTrigger.svelte";
export type { ContextMenuCtx } from "./context.js";
export { getContextMenuContext, setContextMenuContext } from "./context.js";
export { contract as contextMenuComponentContract } from "./contract.js";
export { contextMenuRecipe } from "./recipe.js";
export type {
	ContextMenuContentProps,
	ContextMenuItemProps,
	ContextMenuProps,
	ContextMenuSeparatorProps,
	ContextMenuSize,
	ContextMenuTriggerProps,
} from "./types.js";
