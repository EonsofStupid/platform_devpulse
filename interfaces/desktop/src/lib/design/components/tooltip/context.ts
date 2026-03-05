/**
 * @file Tooltip Context — Svelte context for compound component communication
 * @kind tooltip
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components (TooltipTrigger, TooltipContent) consume it.
 */

import { getContext, setContext } from "svelte";
import type { TooltipTransport } from "$lib/design/api/dsadapters/meltui/_internal/tooltip/index.js";

const TOOLTIP_CTX = Symbol("coldlight-tooltip");

export function setTooltipContext(transport: TooltipTransport): void {
	setContext(TOOLTIP_CTX, transport);
}

export function getTooltipContext(): TooltipTransport {
	return getContext<TooltipTransport>(TOOLTIP_CTX);
}
