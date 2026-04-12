/**
 * @file Navigation Menu Component Barrel
 * @kind navigation-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 * ColdLight-owned navigation menu.
 */

export type { NavigationMenuItemCtx, NavigationMenuRootCtx } from "./context.js";
export {
	getNavigationMenuItemContext,
	getNavigationMenuRootContext,
	setNavigationMenuItemContext,
	setNavigationMenuRootContext,
} from "./context.js";
export { default as NavigationMenu } from "./NavigationMenu.svelte";
export { default as NavigationMenuContent } from "./NavigationMenuContent.svelte";
export { default as NavigationMenuItem } from "./NavigationMenuItem.svelte";
export { default as NavigationMenuLink } from "./NavigationMenuLink.svelte";
export { default as NavigationMenuTrigger } from "./NavigationMenuTrigger.svelte";
export type {
	NavigationMenuContentProps,
	NavigationMenuItemProps,
	NavigationMenuLinkProps,
	NavigationMenuProps,
	NavigationMenuSize,
	NavigationMenuTriggerProps,
} from "./types.js";
