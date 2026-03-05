/**
 * @file Collapsible Context — Svelte context for compound component communication
 * @kind collapsible
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components (CollapsibleTrigger, CollapsibleContent) consume it.
 */

import { getContext, setContext } from "svelte";
import type { CollapsibleTransport } from "$lib/design/api/dsadapters/meltui/_internal/collapsible/index.js";

const COLLAPSIBLE_CTX = Symbol("coldlight-collapsible");

export function setCollapsibleContext(transport: CollapsibleTransport): void {
	setContext(COLLAPSIBLE_CTX, transport);
}

export function getCollapsibleContext(): CollapsibleTransport {
	return getContext<CollapsibleTransport>(COLLAPSIBLE_CTX);
}
