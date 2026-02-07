import { getContext, setContext } from "svelte";
import type {
	DialogAttachments,
	DialogInstance,
} from "$lib/design/taxonomy/.generated/imports.gen.js";

const CTX_KEY = Symbol("coldlight:components:dialog");

export interface DialogComponentContext {
	readonly transport: DialogInstance & DialogAttachments;
	readonly classes: Record<string, string>;
}

export function setDialogComponentContext(ctx: DialogComponentContext): void {
	setContext(CTX_KEY, ctx);
}

export function getDialogComponentContext(): DialogComponentContext {
	return getContext<DialogComponentContext>(CTX_KEY);
}
