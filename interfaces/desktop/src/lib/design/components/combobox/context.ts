/**
 * @file Combobox Context
 * @kind combobox
 * @layer components
 *
 * Maps useComboBox() hook return to the shape sub-components consume.
 * Sub-components access ctx.slots.*, ctx.states.*, ctx.getOption(), etc.
 */

import { getContext, setContext } from "svelte";
import type { UseComboBoxReturn } from "$lib/design/primitives/combobox/combobox.types.js";

export interface ComboboxContext {
	/** Slot attributes — spread onto elements. */
	readonly slots: {
		readonly input: UseComboBoxReturn["input"];
		readonly trigger: UseComboBoxReturn["trigger"];
		readonly content: UseComboBoxReturn["listbox"];
		readonly label: UseComboBoxReturn["label"];
	};
	/** Reactive state. */
	readonly states: {
		readonly open: boolean;
		readonly inputValue: string;
		readonly selectedValue: string;
		readonly highlightedId: string | null;
	};
	/** Get option attributes for a given value. */
	getOption(value: string, label?: string): ReturnType<UseComboBoxReturn["getOption"]>;
	/** Check if a value is selected. */
	isSelected(value: string): boolean;
	/** Svelte action to attach to the listbox element. */
	attachListbox: UseComboBoxReturn["attachListbox"];
	/** Per-slot recipe class strings. */
	readonly recipe: Record<string, string>;
	/** Whether the combobox is disabled. */
	readonly disabled: boolean;
	/** Size variant. */
	readonly size: string;
	/** Text direction. */
	readonly dir: "ltr" | "rtl";
}

const COMBOBOX_CTX = Symbol("coldlight-combobox");

export function setComboboxContext(ctx: ComboboxContext): void {
	setContext(COMBOBOX_CTX, ctx);
}

export function getComboboxContext(): ComboboxContext {
	return getContext<ComboboxContext>(COMBOBOX_CTX);
}
