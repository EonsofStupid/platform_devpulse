/**
 * @file Popover Context — Svelte context for compound component communication
 * @kind popover
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components (PopoverTrigger, PopoverContent, PopoverArrow) consume it.
 */

import { getContext, setContext } from "svelte";
import type { PopoverTransport } from "$lib/design/api/dsadapters/meltui/_internal/popover/index.js";

const POPOVER_CTX = Symbol("coldlight-popover");

export function setPopoverContext(transport: PopoverTransport): void {
	setContext(POPOVER_CTX, transport);
}

export function getPopoverContext(): PopoverTransport {
	return getContext<PopoverTransport>(POPOVER_CTX);
}
