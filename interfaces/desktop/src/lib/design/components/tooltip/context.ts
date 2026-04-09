/**
 * @file Tooltip Context
 * @kind tooltip
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseTooltipReturn } from "$lib/design/behaviors/overlays/tooltip/tooltip.types.js";

export interface TooltipContext {
	readonly hook: UseTooltipReturn;
}

const TOOLTIP_CTX = Symbol("coldlight-tooltip");

export function setTooltipContext(ctx: TooltipContext): void {
	setContext(TOOLTIP_CTX, ctx);
}

export function getTooltipContext(): TooltipContext {
	return getContext<TooltipContext>(TOOLTIP_CTX);
}
