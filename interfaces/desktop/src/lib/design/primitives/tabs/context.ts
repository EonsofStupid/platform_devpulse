/**
 * @file Tabs Primitive Context
 * @description Svelte context for compound tabs coordination.
 * Root sets context, sub-components read it.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:tabs");

/** Tabs context shape */
export type TabsContext = {
	readonly value: string;
};

export function setTabsContext(ctx: TabsContext): void {
	setContext(CTX_KEY, ctx);
}

export function getTabsContext(): TabsContext {
	return getContext<TabsContext>(CTX_KEY);
}
