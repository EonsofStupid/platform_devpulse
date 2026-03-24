/**
 * @file Select Context
 * @kind select
 * @layer components
 *
 * Symbol-keyed context distributes useSelect hook to sub-components.
 */

import { getContext, setContext } from "svelte";
import type { UseSelectReturn } from "$lib/design/primitives/select/select.types.js";

export interface SelectContext {
	readonly hook: UseSelectReturn;
	readonly placeholder?: string;
}

const SELECT_CTX = Symbol("coldlight-select");

export function setSelectContext(ctx: SelectContext): void {
	setContext(SELECT_CTX, ctx);
}

export function getSelectContext(): SelectContext {
	return getContext<SelectContext>(SELECT_CTX);
}
