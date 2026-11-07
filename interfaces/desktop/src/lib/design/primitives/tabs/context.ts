import { getContext, setContext } from "svelte";
import type { TabsContext } from "./types.js";

const KEY = Symbol("cl-tabs");

export function setTabsPrimitiveContext(ctx: TabsContext): void {
	setContext(KEY, ctx);
}

export function getTabsPrimitiveContext(): TabsContext {
	const ctx = getContext<TabsContext>(KEY);
	if (!ctx) {
		throw new Error("[ColdLight] TabsList/TabsTrigger/TabsContent must be used within TabsRoot");
	}
	return ctx;
}
