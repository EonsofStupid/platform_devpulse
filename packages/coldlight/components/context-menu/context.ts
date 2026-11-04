/**
 * @file Context Menu Context — Svelte context for compound component communication
 * @kind context-menu
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 */

import { getContext, setContext } from "svelte";
import type { UseContextMenuReturn } from "#coldlight/behaviors/navigation/context-menu/index.js";

export interface ContextMenuCtx {
	readonly hook: UseContextMenuReturn;
}

const CONTEXT_MENU_CTX = Symbol("coldlight-context-menu");

export function setContextMenuContext(ctx: ContextMenuCtx): void {
	setContext(CONTEXT_MENU_CTX, ctx);
}

export function getContextMenuContext(): ContextMenuCtx {
	return getContext<ContextMenuCtx>(CONTEXT_MENU_CTX);
}
