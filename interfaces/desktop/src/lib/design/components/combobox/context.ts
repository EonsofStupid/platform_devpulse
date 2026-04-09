/**
 * @file Combobox Context
 * @kind combobox
 * @layer components
 *
 * Exposes useComboBox() hook return + composition classes to sub-components.
 * No adapters, no transport layer. Direct hook access.
 */

import { getContext, setContext } from "svelte";
import type { UseComboBoxReturn } from "$lib/design/behaviors/inputs/combobox/combobox.types.js";

export interface ComboboxContext {
	readonly hook: UseComboBoxReturn;
	readonly disabled: boolean;
	readonly size: string;
	readonly dir: "ltr" | "rtl";
}

const COMBOBOX_CTX = Symbol("coldlight-combobox");

export function setComboboxContext(ctx: ComboboxContext): void {
	setContext(COMBOBOX_CTX, ctx);
}

export function getComboboxContext(): ComboboxContext {
	return getContext<ComboboxContext>(COMBOBOX_CTX);
}
