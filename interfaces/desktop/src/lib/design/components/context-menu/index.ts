/**
 * @file Context Menu Component Barrel
 * @kind context-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as ContextMenu } from "./ContextMenu.svelte";
export { default as ContextMenuTrigger } from "./ContextMenuTrigger.svelte";
export { default as ContextMenuContent } from "./ContextMenuContent.svelte";
export { default as ContextMenuItem } from "./ContextMenuItem.svelte";
export { default as ContextMenuSeparator } from "./ContextMenuSeparator.svelte";

export { contract as contextMenuComponentContract } from "./contract.js";
export { contextMenuRecipe } from "./recipe.js";
export { setContextMenuContext, getContextMenuContext } from "./context.js";

export type {
	ContextMenuProps,
	ContextMenuTriggerProps,
	ContextMenuContentProps,
	ContextMenuItemProps,
	ContextMenuSeparatorProps,
	ContextMenuSize,
} from "./types.js";

export type { ContextMenuCtx } from "./context.js";
