/**
 * @file Combobox Primitive Types
 * @description Structural type declarations for the combobox primitive.
 * Aligned to taxonomy contract: kind="combobox"
 * Slots: root (renderless), input (self-closing), trigger, content, item, group, empty
 * ariaStateProvider: "meltui" — createCombobox provides ARIA roles, keyboard nav, and filtering.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Combobox root — renderless context provider (no DOM element) */
export interface ComboboxProps extends BaseProps {
	/** Open state (bindable) */
	open?: boolean;
	/** Current value (bindable) */
	value?: string;
	children?: Snippet;
}

/** Combobox input — autocomplete search input (self-closing, no children) */
export interface ComboboxInputProps extends OmitStyle<HTMLInputElement>, BaseProps {}

/** Combobox trigger — button that toggles the dropdown */
export interface ComboboxTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Combobox content — dropdown container for the listbox options */
export interface ComboboxContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Combobox item — selectable option within the listbox */
export interface ComboboxItemProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Combobox group — labelled group of related options */
export interface ComboboxGroupProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Combobox empty — placeholder shown when no options match filter */
export interface ComboboxEmptyProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
