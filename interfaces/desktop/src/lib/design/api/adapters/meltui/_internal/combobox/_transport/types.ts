/**
 * @file Combobox Transport Types
 * @description Typed transport interface for combobox.
 * Maps melt v0.44 Combobox API → ColdLight vocabulary.
 */

import type { SlotAttrs, TransportAdapter } from "$lib/design/api/adapters/coldlight/_internal/_transport/types.js";

export interface ComboboxTransportStates<T> {
	open: boolean;
	value: T | undefined;
	inputValue: string;
	highlighted: T | null;
}

export type ComboboxTransport<T> = TransportAdapter<
	"input" | "trigger" | "content" | "label",
	ComboboxTransportStates<T>
>;

export interface ComboboxActions<T> {
	getOption(value: T, label?: string): SlotAttrs;
	isSelected(value: T): boolean;
	select(value: T): void;
}

export interface ComboboxTransportConfig<T> {
	value?: T;
	onValueChange?: (value: T | undefined) => void;
	inputValue?: string;
	onInputValueChange?: (value: string) => void;
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	highlighted?: T | null;
	onHighlightChange?: (highlighted: T | null) => void;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	sameWidth?: boolean;
	scrollAlignment?: "nearest" | "center" | null;
}
