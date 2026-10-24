/**
 * @file Collapsible Context
 * @kind collapsible
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { CollapsibleIds } from "./types.js";

export interface CollapsibleContext {
	readonly isOpen: boolean;
	readonly disabled: boolean;
	readonly ids: Partial<CollapsibleIds>;
	readonly dir: "ltr" | "rtl";
	readonly triggerId: string;
	readonly contentId: string;
	toggle(): void;
}

const COLLAPSIBLE_CTX = Symbol("coldlight-collapsible");

export function setCollapsibleContext(ctx: CollapsibleContext): void {
	setContext(COLLAPSIBLE_CTX, ctx);
}

export function getCollapsibleContext(): CollapsibleContext {
	return getContext<CollapsibleContext>(COLLAPSIBLE_CTX);
}
