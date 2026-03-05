/**
 * @file MeltUI Combobox Factory
 * @description Wraps melt's Combobox class (v0.44+, Svelte 5 runes).
 * This is the ONLY file that imports from `melt` for combobox.
 */

import { Combobox, type ComboboxProps } from "melt/builders";

export type MeltComboboxInstance<T> = Combobox<T, false>;
export type MeltComboboxConfig<T> = ComboboxProps<T, false>;

export function createMeltCombobox<T>(config?: MeltComboboxConfig<T>): MeltComboboxInstance<T> {
	return new Combobox<T, false>(config);
}
