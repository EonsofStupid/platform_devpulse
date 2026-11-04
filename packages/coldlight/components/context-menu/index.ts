/**
 * @file Context Menu Component Barrel
 * @kind context-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 */

export { default as ContextMenu } from "./ContextMenu.svelte";
export { default as ContextMenuContent } from "./ContextMenuContent.svelte";
export { default as ContextMenuGroup } from "./ContextMenuGroup.svelte";
export { default as ContextMenuItem } from "./ContextMenuItem.svelte";
export { default as ContextMenuLabel } from "./ContextMenuLabel.svelte";
export { default as ContextMenuSeparator } from "./ContextMenuSeparator.svelte";
export { default as ContextMenuTrigger } from "./ContextMenuTrigger.svelte";
export type { ContextMenuCtx } from "./context.js";
export { getContextMenuContext, setContextMenuContext } from "./context.js";
export {
	CONTEXT_MENU_DEFAULTS,
	CONTEXT_MENU_SIZES,
	CONTEXT_MENU_VARIANTS,
} from "./context-menu.generated.js";
export type {
	ContextMenuContentProps,
	ContextMenuGroupProps,
	ContextMenuItemProps,
	ContextMenuLabelProps,
	ContextMenuProps,
	ContextMenuSeparatorProps,
	ContextMenuSize,
	ContextMenuTriggerProps,
	ContextMenuVariant,
} from "./types.js";
