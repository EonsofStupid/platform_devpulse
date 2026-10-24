/**
 * @file Menubar Context — Svelte context for compound component communication
 * @kind menubar
 * @layer components
 *
 * TWO context levels:
 * 1. Root context: MenubarRootCtx (set by Menubar.svelte)
 * 2. Menu context: MenubarMenuCtx (set by MenubarMenu.svelte)
 *
 * Symbol-keyed context + typed get/set helpers.
 */

import { getContext, setContext } from "svelte";

// =============================================================================
// ROOT CONTEXT — set by Menubar.svelte, consumed by MenubarMenu.svelte
// =============================================================================

export interface MenubarRootCtx {
	/** Currently open menu value (undefined = none open) */
	readonly activeMenu: string | undefined;
	/** Open a specific menu by value */
	readonly openMenu: (value: string) => void;
	/** Close all menus */
	readonly closeAll: () => void;
}

const MENUBAR_ROOT_CTX = Symbol("coldlight-menubar-root");

export function setMenubarRootContext(ctx: MenubarRootCtx): void {
	setContext(MENUBAR_ROOT_CTX, ctx);
}

export function getMenubarRootContext(): MenubarRootCtx {
	return getContext<MenubarRootCtx>(MENUBAR_ROOT_CTX);
}

// =============================================================================
// MENU CONTEXT — set by MenubarMenu.svelte, consumed by Trigger/Content
// =============================================================================

export interface MenubarMenuCtx {
	readonly open: boolean;
	readonly toggle: () => void;
	readonly close: () => void;
	readonly triggerId: string;
	readonly contentId: string;
	readonly value: string;
}

const MENUBAR_MENU_CTX = Symbol("coldlight-menubar-menu");

export function setMenubarMenuContext(ctx: MenubarMenuCtx): void {
	setContext(MENUBAR_MENU_CTX, ctx);
}

export function getMenubarMenuContext(): MenubarMenuCtx {
	return getContext<MenubarMenuCtx>(MENUBAR_MENU_CTX);
}
