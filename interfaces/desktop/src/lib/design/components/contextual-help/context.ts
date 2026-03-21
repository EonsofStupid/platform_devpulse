import { getContext, setContext } from "svelte";
import type { ContextualHelpIds } from "./types.js";

export interface ContextualHelpContext {
	readonly isOpen: boolean;
	readonly classes: Record<string, string>;
	readonly ids: { root: string; trigger: string; popover: string; heading: string };
	readonly dir: "ltr" | "rtl";
	toggle(): void;
}

const CTX = Symbol("coldlight-contextual-help");

export function setContextualHelpContext(ctx: ContextualHelpContext): void {
	setContext(CTX, ctx);
}

export function getContextualHelpContext(): ContextualHelpContext {
	return getContext<ContextualHelpContext>(CTX);
}
