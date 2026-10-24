/**
 * @file Tabs Context
 * @kind tabs
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseTabsReturn } from "#coldlight/behaviors/navigation/tabs/tabs.types.js";

export interface TabsContext {
	readonly hook: UseTabsReturn;
}

const TABS_CTX = Symbol("coldlight-tabs");

export function setTabsContext(ctx: TabsContext): void {
	setContext(TABS_CTX, ctx);
}

export function getTabsContext(): TabsContext {
	return getContext<TabsContext>(TABS_CTX);
}
