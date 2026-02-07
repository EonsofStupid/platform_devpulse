/**
 * @file NavigationMenu Primitive Barrel
 */

export {
	getNavigationMenuContext,
	type NavigationMenuContext,
	setNavigationMenuContext,
} from "./context.js";
export { default as NavigationMenu } from "./NavigationMenu.svelte";
export { default as NavigationMenuContent } from "./NavigationMenuContent.svelte";
export { default as NavigationMenuItem } from "./NavigationMenuItem.svelte";
export { default as NavigationMenuLink } from "./NavigationMenuLink.svelte";
export { default as NavigationMenuList } from "./NavigationMenuList.svelte";
export { default as NavigationMenuTrigger } from "./NavigationMenuTrigger.svelte";
export { default as NavigationMenuViewport } from "./NavigationMenuViewport.svelte";
export type {
	NavigationMenuContentProps,
	NavigationMenuItemProps,
	NavigationMenuLinkProps,
	NavigationMenuListProps,
	NavigationMenuProps,
	NavigationMenuTriggerProps,
	NavigationMenuViewportProps,
} from "./types.js";
