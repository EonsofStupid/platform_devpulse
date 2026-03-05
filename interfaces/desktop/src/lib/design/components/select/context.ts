/**
 * @file Select Context — Svelte context for compound component communication
 * @kind select
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 */

import { getContext, setContext } from "svelte";
import type { SelectTransport } from "$lib/design/api/dsadapters/meltui/_internal/select/index.js";

const SELECT_CTX = Symbol("coldlight-select");

export function setSelectContext<T>(transport: SelectTransport<T>): void {
	setContext(SELECT_CTX, transport);
}

export function getSelectContext<T = unknown>(): SelectTransport<T> {
	return getContext<SelectTransport<T>>(SELECT_CTX);
}
