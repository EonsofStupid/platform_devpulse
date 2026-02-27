/**
 * @file Combobox Context — Svelte context for compound component coordination
 * @kind combobox
 * @layer components
 * @package @devpulse/coldlight
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root component (Combobox.svelte) creates the transport and sets context.
 * All sub-components consume it via getComboboxContext().
 *
 * The combobox transport includes:
 * - slots: input, trigger, content, label (melt-managed ARIA attributes)
 * - states: open, value, inputValue, highlighted (reactive state)
 * - actions: getOption(), isSelected(), select() (item-level operations)
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */

import { getContext, setContext } from "svelte";
import type {
	ComboboxTransport,
	ComboboxActions,
} from "$lib/design/api/adapters/meltui/_internal/combobox/index.js";

/**
 * Combined transport + actions type for the combobox context.
 *
 * Sub-components access:
 * - `ctx.slots.input` — melt ARIA attributes for the input element
 * - `ctx.states.open` — whether the listbox is open
 * - `ctx.getOption(value)` — melt ARIA attributes for an option element
 * - `ctx.isSelected(value)` — whether a specific value is selected
 */
export type ComboboxContext<T = unknown> = ComboboxTransport<T> & ComboboxActions<T>;

const COMBOBOX_CTX = Symbol("coldlight-combobox");

/**
 * Set the combobox context from the root component.
 * Called once in Combobox.svelte during initialization.
 */
export function setComboboxContext<T>(transport: ComboboxContext<T>): void {
	setContext(COMBOBOX_CTX, transport);
}

/**
 * Get the combobox context from any sub-component.
 * Throws if called outside a Combobox compound component tree.
 */
export function getComboboxContext<T = unknown>(): ComboboxContext<T> {
	return getContext<ComboboxContext<T>>(COMBOBOX_CTX);
}
