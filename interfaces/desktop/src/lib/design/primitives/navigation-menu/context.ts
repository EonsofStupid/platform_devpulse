/**
 * @file NavigationMenu Primitive Context
 * @description Svelte context for compound navigation-menu coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:navigation-menu");

/** NavigationMenu context shape */
export type NavigationMenuContext = {
	readonly value: string;
};

/** Set navigation-menu context — called by NavigationMenu root */
export function setNavigationMenuContext(ctx: NavigationMenuContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get navigation-menu context — called by child slots */
export function getNavigationMenuContext(): NavigationMenuContext {
	return getContext<NavigationMenuContext>(CTX_KEY);
}
