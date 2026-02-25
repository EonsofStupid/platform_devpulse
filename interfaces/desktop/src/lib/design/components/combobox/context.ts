/**
 * @file Combobox Context — Svelte context for compound component communication
 * @kind combobox
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 *
 * The combobox transport includes both ComboboxTransport (slots + states)
 * and ComboboxActions (getOption, isSelected, select).
 */

import { getContext, setContext } from "svelte";
import type {
	ComboboxTransport,
	ComboboxActions,
} from "$lib/design/api/adapters/meltui/_internal/combobox/index.js";

/** Combined transport + actions type for the combobox context. */
export type ComboboxContext<T = unknown> = ComboboxTransport<T> & ComboboxActions<T>;

const COMBOBOX_CTX = Symbol("coldlight-combobox");

export function setComboboxContext<T>(transport: ComboboxContext<T>): void {
	setContext(COMBOBOX_CTX, transport);
}

export function getComboboxContext<T = unknown>(): ComboboxContext<T> {
	return getContext<ComboboxContext<T>>(COMBOBOX_CTX);
}
