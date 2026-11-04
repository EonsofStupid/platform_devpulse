/**
 * @file Breadcrumbs Context — Svelte context for compound component communication
 * @kind breadcrumbs
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseBreadcrumbsReturn } from "#coldlight/behaviors/navigation/breadcrumbs/index.js";

export interface BreadcrumbsContext {
	readonly hook: UseBreadcrumbsReturn;
	readonly separator: string;
}

const BREADCRUMBS_CTX = Symbol("coldlight-breadcrumbs");

export function setBreadcrumbsContext(ctx: BreadcrumbsContext): void {
	setContext(BREADCRUMBS_CTX, ctx);
}

export function getBreadcrumbsContext(): BreadcrumbsContext {
	return getContext<BreadcrumbsContext>(BREADCRUMBS_CTX);
}
