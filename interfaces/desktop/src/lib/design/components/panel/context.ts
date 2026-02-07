import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:components:panel");

export interface PanelComponentContext {
	readonly classes: Record<string, string>;
}

export function setPanelComponentContext(ctx: PanelComponentContext): void {
	setContext(CTX_KEY, ctx);
}

export function getPanelComponentContext(): PanelComponentContext {
	return getContext<PanelComponentContext>(CTX_KEY);
}
