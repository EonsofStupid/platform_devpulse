/**
 * @file Context Menu Context — Svelte context for compound component communication
 * @kind context-menu
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 *
 * Context shape: open state, position, close function.
 */

import { getContext, setContext } from "svelte";

export interface ContextMenuCtx {
	readonly open: boolean;
	readonly close: () => void;
	readonly position: { x: number; y: number };
	readonly contentId: string;
}

const CONTEXT_MENU_CTX = Symbol("coldlight-context-menu");

export function setContextMenuContext(ctx: ContextMenuCtx): void {
	setContext(CONTEXT_MENU_CTX, ctx);
}

export function getContextMenuContext(): ContextMenuCtx {
	return getContext<ContextMenuCtx>(CONTEXT_MENU_CTX);
}
