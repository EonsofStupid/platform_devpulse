/**
 * @file Menubar Primitive Context
 * @description Svelte context for compound menubar coordination.
 * Root sets context, sub-components read it.
 * Two levels: root context (Menubar) and menu context (MenubarMenu).
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

// ─── ROOT CONTEXT ────────────────────────────────────────────────────────
const MENUBAR_KEY = Symbol("coldlight:menubar");

/** Menubar root context shape (placeholder for future expansion) */
export type MenubarContext = Record<string, never>;

/** Set menubar context (called by Menubar root) */
export function setMenubarContext(ctx: MenubarContext): void {
	setContext(MENUBAR_KEY, ctx);
}

/** Get menubar context (called by sub-components) */
export function getMenubarContext(): MenubarContext {
	return getContext<MenubarContext>(MENUBAR_KEY);
}

// ─── MENU CONTEXT ────────────────────────────────────────────────────────
const MENUBAR_MENU_KEY = Symbol("coldlight:menubar-menu");

/** Menubar menu context shape */
export type MenubarMenuContext = {
	readonly open: boolean;
};

/** Set menu context (called by MenubarMenu) */
export function setMenubarMenuContext(ctx: MenubarMenuContext): void {
	setContext(MENUBAR_MENU_KEY, ctx);
}

/** Get menu context (called by MenubarTrigger/Content) */
export function getMenubarMenuContext(): MenubarMenuContext {
	return getContext<MenubarMenuContext>(MENUBAR_MENU_KEY);
}
