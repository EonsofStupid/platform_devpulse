/**
 * @file Navigation Menu Context — Svelte context for compound component communication
 * @kind navigation-menu
 * @layer components
 *
 * TWO context levels:
 * 1. Root context: NavigationMenuRootCtx (set by NavigationMenu.svelte)
 * 2. Item context: NavigationMenuItemCtx (set by NavigationMenuItem.svelte)
 *
 * ColdLight-owned — no MeltUI adapter. Symbol-keyed context + typed get/set helpers.
 */

import { getContext, setContext } from "svelte";

// =============================================================================
// ROOT CONTEXT — set by NavigationMenu.svelte, consumed by items
// =============================================================================

export interface NavigationMenuRootCtx {
	/** Currently open item value (undefined = none open) */
	readonly activeItem: string | undefined;
	/** Open a specific item sub-menu by value */
	readonly openItem: (value: string) => void;
	/** Close all sub-menus */
	readonly closeAll: () => void;
}

const NAV_MENU_ROOT_CTX = Symbol("coldlight-navigation-menu-root");

export function setNavigationMenuRootContext(ctx: NavigationMenuRootCtx): void {
	setContext(NAV_MENU_ROOT_CTX, ctx);
}

export function getNavigationMenuRootContext(): NavigationMenuRootCtx {
	return getContext<NavigationMenuRootCtx>(NAV_MENU_ROOT_CTX);
}

// =============================================================================
// ITEM CONTEXT — set by NavigationMenuItem.svelte, consumed by Trigger/Content
// =============================================================================

export interface NavigationMenuItemCtx {
	readonly open: boolean;
	readonly toggle: () => void;
	readonly close: () => void;
	readonly triggerId: string;
	readonly contentId: string;
	readonly value: string;
}

const NAV_MENU_ITEM_CTX = Symbol("coldlight-navigation-menu-item");

export function setNavigationMenuItemContext(ctx: NavigationMenuItemCtx): void {
	setContext(NAV_MENU_ITEM_CTX, ctx);
}

export function getNavigationMenuItemContext(): NavigationMenuItemCtx {
	return getContext<NavigationMenuItemCtx>(NAV_MENU_ITEM_CTX);
}
