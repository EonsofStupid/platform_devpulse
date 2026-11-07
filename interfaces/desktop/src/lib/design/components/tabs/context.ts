import { getContext, setContext } from "svelte";
import type { TabsActions, TabsInstance } from "$lib/design/taxonomy/.generated/imports.gen.js";

const CTX_KEY = Symbol("coldlight:components:tabs");

export interface TabsComponentContext {
	readonly transport: TabsInstance & TabsActions;
	readonly classes: Record<string, string>;
}

export function setTabsComponentContext(ctx: TabsComponentContext): void {
	setContext(CTX_KEY, ctx);
}

export function getTabsComponentContext(): TabsComponentContext {
	return getContext<TabsComponentContext>(CTX_KEY);
}
