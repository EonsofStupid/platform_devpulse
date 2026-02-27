/**
 * @file Navigation Menu Component Barrel
 * @kind navigation-menu
 * @layer components
 *
 * Compound component: exports root + all sub-components.
 * ColdLight-owned — no MeltUI adapter.
 */

export { default as NavigationMenu } from "./NavigationMenu.svelte";
export { default as NavigationMenuItem } from "./NavigationMenuItem.svelte";
export { default as NavigationMenuTrigger } from "./NavigationMenuTrigger.svelte";
export { default as NavigationMenuContent } from "./NavigationMenuContent.svelte";
export { default as NavigationMenuLink } from "./NavigationMenuLink.svelte";

export { contract as navigationMenuComponentContract } from "./contract.js";
export { navigationMenuRecipe } from "./recipe.js";
export {
	setNavigationMenuRootContext,
	getNavigationMenuRootContext,
	setNavigationMenuItemContext,
	getNavigationMenuItemContext,
} from "./context.js";

export type {
	NavigationMenuProps,
	NavigationMenuItemProps,
	NavigationMenuTriggerProps,
	NavigationMenuContentProps,
	NavigationMenuLinkProps,
	NavigationMenuSize,
} from "./types.js";

export type { NavigationMenuRootCtx, NavigationMenuItemCtx } from "./context.js";
