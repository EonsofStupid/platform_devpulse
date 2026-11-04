import { getContext, setContext } from "svelte";
import type { PanelPadding } from "./types.js";

const CTX_KEY = Symbol("coldlight:components:panel");

export interface PanelComponentContext {
	readonly padding: PanelPadding;
}

export function setPanelComponentContext(ctx: PanelComponentContext): void {
	setContext(CTX_KEY, ctx);
}

export function getPanelComponentContext(): PanelComponentContext {
	return getContext<PanelComponentContext>(CTX_KEY);
}

/** A padding override for the panel's parts; md is the parts' own, from panel.tokens.json. */
export const PADDING_MAP: Record<PanelPadding, string> = {
	none: "p-0",
	sm: "px-2 py-1.5",
	md: "",
	lg: "px-6 py-5",
};
