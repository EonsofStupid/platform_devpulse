/**
 * @file Popover Context
 * @kind popover
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UsePopoverReturn } from "$lib/design/primitives/popover/popover.types.js";

export interface PopoverContext {
	readonly hook: UsePopoverReturn;
}

const POPOVER_CTX = Symbol("coldlight-popover");

export function setPopoverContext(ctx: PopoverContext): void {
	setContext(POPOVER_CTX, ctx);
}

export function getPopoverContext(): PopoverContext {
	return getContext<PopoverContext>(POPOVER_CTX);
}
