/**
 * @file Combobox Transport Factory
 * @description Creates a typed ColdLight combobox transport from melt v0.44.
 * Maps melt getters → ColdLight slot vocabulary.
 */

import type { SlotAttrs } from "$lib/design/api/dsadapters/coldlight/_internal/_transport/types.js";
import { createMeltCombobox } from "../factory.js";
import type { ComboboxActions, ComboboxTransport, ComboboxTransportConfig } from "./types.js";

export function createComboboxTransport<T>(
	config?: ComboboxTransportConfig<T>,
): ComboboxTransport<T> & ComboboxActions<T> {
	// Note: melt's Combobox constructor internally sets a smart closeOnOutsideClick
	// function that recognizes trigger button clicks by DOM ID. Passing `true` or
	// `undefined` would override it, breaking trigger-button-to-open. Only pass
	// closeOnOutsideClick when explicitly `false` to disable outside-click closing.
	const combobox = createMeltCombobox<T>({
		value: config?.value,
		onValueChange: config?.onValueChange as never,
		inputValue: config?.inputValue,
		onInputValueChange: config?.onInputValueChange,
		open: config?.open,
		onOpenChange: config?.onOpenChange,
		highlighted: config?.highlighted,
		onHighlightChange: config?.onHighlightChange,
		closeOnEscape: config?.closeOnEscape,
		sameWidth: config?.sameWidth ?? true,
		scrollAlignment: config?.scrollAlignment,
		...(config?.closeOnOutsideClick === false ? { closeOnOutsideClick: false } : {}),
	});

	return {
		slots: {
			get input(): SlotAttrs {
				return combobox.input as unknown as SlotAttrs;
			},
			get trigger(): SlotAttrs {
				return combobox.trigger as unknown as SlotAttrs;
			},
			get content(): SlotAttrs {
				return combobox.content as unknown as SlotAttrs;
			},
			get label(): SlotAttrs {
				return combobox.label as unknown as SlotAttrs;
			},
		},
		states: {
			get open(): boolean {
				return combobox.open;
			},
			set open(v: boolean) {
				combobox.open = v;
			},
			get value(): T | undefined {
				return combobox.value as T | undefined;
			},
			set value(v: T | undefined) {
				combobox.value = v as never;
			},
			get inputValue(): string {
				return combobox.inputValue;
			},
			set inputValue(v: string) {
				combobox.inputValue = v;
			},
			get highlighted(): T | null {
				return combobox.highlighted;
			},
			set highlighted(v: T | null) {
				combobox.highlighted = v;
			},
		},
		getOption: (value: T, label?: string): SlotAttrs =>
			combobox.getOption(value, label) as unknown as SlotAttrs,
		isSelected: (value: T): boolean => combobox.isSelected(value),
		select: (value: T): void => combobox.select(value),
	};
}
